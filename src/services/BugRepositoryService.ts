/**
 * Bug Repository Service
 * 
 * Manages bug detection, tracking, categorization, and lifecycle management.
 * Integrates with multiple sources: user reports, system monitoring, automated tests.
 */

import { PrismaClient, Bug, BugSource, BugSeverity, BugStatus, BugCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface BugDetectionResult {
  detected: boolean;
  bugs: Bug[];
  source: BugSource;
}

interface BugReport {
  title: string;
  description: string;
  source: BugSource;
  severity?: BugSeverity;
  category?: BugCategory;
  reportedBy?: string;
  reportedByEmail?: string;
  stackTrace?: string;
  errorMessage?: string;
  affectedComponent?: string;
  environment?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  attachments?: string[];
}

interface BugPriorityScore {
  bugId: string;
  score: number;
  factors: {
    severity: number;
    usersAffected: number;
    businessImpact: number;
    age: number;
    recurrence: number;
  };
}

export class BugRepositoryService {
  /**
   * Report a new bug
   */
  async reportBug(report: BugReport): Promise<Bug> {
    // Calculate initial priority and impact
    const priority = this.calculatePriority(report.severity || BugSeverity.MEDIUM);
    const impactScore = await this.calculateImpactScore(report);

    const bug = await prisma.bug.create({
      data: {
        title: report.title,
        description: report.description,
        source: report.source,
        severity: report.severity || BugSeverity.MEDIUM,
        category: report.category || BugCategory.OTHER,
        reportedBy: report.reportedBy,
        reportedByEmail: report.reportedByEmail,
        stackTrace: report.stackTrace,
        errorMessage: report.errorMessage,
        affectedComponent: report.affectedComponent,
        environment: report.environment,
        stepsToReproduce: report.stepsToReproduce,
        expectedBehavior: report.expectedBehavior,
        actualBehavior: report.actualBehavior,
        attachments: report.attachments || [],
        priority,
        impactScore,
        status: BugStatus.NEW,
      },
    });

    // Check for duplicates
    await this.checkForDuplicates(bug.id);

    // Log bug creation
    await this.logBugHistory(bug.id, 'status', null, BugStatus.NEW, 'SYSTEM');

    // Notify relevant parties
    await this.notifyBugCreated(bug);

    return bug;
  }

  /**
   * Detect bugs from system monitoring
   */
  async detectSystemBugs(): Promise<BugDetectionResult> {
    const detectedBugs: Bug[] = [];

    // Check error logs for patterns
    const errorPatterns = await this.analyzeErrorLogs();
    for (const pattern of errorPatterns) {
      const bug = await this.reportBug({
        title: `System Error: ${pattern.errorType}`,
        description: `Detected recurring error pattern: ${pattern.description}`,
        source: BugSource.SYSTEM_DETECTION,
        severity: this.mapErrorSeverity(pattern.frequency, pattern.impact),
        category: this.categorizeError(pattern.errorType),
        errorMessage: pattern.sampleError,
        affectedComponent: pattern.component,
        environment: 'PRODUCTION',
      });
      detectedBugs.push(bug);
    }

    // Check performance degradation
    const performanceIssues = await this.detectPerformanceIssues();
    for (const issue of performanceIssues) {
      const bug = await this.reportBug({
        title: `Performance Degradation: ${issue.component}`,
        description: `Detected performance issue: ${issue.description}`,
        source: BugSource.PERFORMANCE_MON,
        severity: BugSeverity.MEDIUM,
        category: BugCategory.PERFORMANCE,
        affectedComponent: issue.component,
        environment: 'PRODUCTION',
      });
      detectedBugs.push(bug);
    }

    return {
      detected: detectedBugs.length > 0,
      bugs: detectedBugs,
      source: BugSource.SYSTEM_DETECTION,
    };
  }

  /**
   * Triage a bug (categorize and prioritize)
   */
  async triageBug(bugId: string, triageData: {
    severity?: BugSeverity;
    category?: BugCategory;
    priority?: number;
    assignedTo?: string;
  }): Promise<Bug> {
    const bug = await prisma.bug.findUnique({ where: { id: bugId } });
    if (!bug) throw new Error('Bug not found');

    const updates: any = {
      status: BugStatus.TRIAGED,
      updatedAt: new Date(),
    };

    if (triageData.severity) {
      await this.logBugHistory(bugId, 'severity', bug.severity, triageData.severity, 'TRIAGE_SYSTEM');
      updates.severity = triageData.severity;
    }

    if (triageData.category) {
      await this.logBugHistory(bugId, 'category', bug.category, triageData.category, 'TRIAGE_SYSTEM');
      updates.category = triageData.category;
    }

    if (triageData.priority !== undefined) {
      await this.logBugHistory(bugId, 'priority', bug.priority.toString(), triageData.priority.toString(), 'TRIAGE_SYSTEM');
      updates.priority = triageData.priority;
    }

    if (triageData.assignedTo) {
      updates.assignedTo = triageData.assignedTo;
      updates.assignedAt = new Date();
      await this.logBugHistory(bugId, 'assignedTo', bug.assignedTo || 'null', triageData.assignedTo, 'TRIAGE_SYSTEM');
    }

    return await prisma.bug.update({
      where: { id: bugId },
      data: updates,
    });
  }

  /**
   * Update bug status
   */
  async updateBugStatus(bugId: string, newStatus: BugStatus, userId: string): Promise<Bug> {
    const bug = await prisma.bug.findUnique({ where: { id: bugId } });
    if (!bug) throw new Error('Bug not found');

    await this.logBugHistory(bugId, 'status', bug.status, newStatus, userId);

    const updates: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    // Set timestamps based on status
    if (newStatus === BugStatus.CLOSED) {
      updates.closedAt = new Date();
    } else if (newStatus === BugStatus.FIXED) {
      updates.fixedAt = new Date();
      updates.fixedBy = userId;
    }

    return await prisma.bug.update({
      where: { id: bugId },
      data: updates,
    });
  }

  /**
   * Mark bug as duplicate
   */
  async markAsDuplicate(bugId: string, originalBugId: string): Promise<Bug> {
    const bug = await prisma.bug.update({
      where: { id: bugId },
      data: {
        isDuplicate: true,
        duplicateOf: originalBugId,
        status: BugStatus.DUPLICATE,
      },
    });

    await this.logBugHistory(bugId, 'status', bug.status, BugStatus.DUPLICATE, 'SYSTEM');

    return bug;
  }

  /**
   * Get high-priority bugs
   */
  async getHighPriorityBugs(limit: number = 20): Promise<Bug[]> {
    return await prisma.bug.findMany({
      where: {
        status: {
          in: [BugStatus.NEW, BugStatus.TRIAGED, BugStatus.CONFIRMED, BugStatus.IN_PROGRESS],
        },
        isDuplicate: false,
      },
      orderBy: [
        { severity: 'desc' },
        { priority: 'desc' },
        { reportedAt: 'asc' },
      ],
      take: limit,
    });
  }

  /**
   * Get bugs by category
   */
  async getBugsByCategory(category: BugCategory, status?: BugStatus): Promise<Bug[]> {
    const where: any = {
      category,
      isDuplicate: false,
    };

    if (status) {
      where.status = status;
    }

    return await prisma.bug.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { priority: 'desc' },
      ],
    });
  }

  /**
   * Get bug statistics
   */
  async getBugStatistics(): Promise<any> {
    const [
      totalBugs,
      openBugs,
      criticalBugs,
      bugsBySeverity,
      bugsByCategory,
      bugsByStatus,
      averageResolutionTime,
    ] = await Promise.all([
      prisma.bug.count(),
      prisma.bug.count({
        where: {
          status: {
            in: [BugStatus.NEW, BugStatus.TRIAGED, BugStatus.CONFIRMED, BugStatus.IN_PROGRESS],
          },
        },
      }),
      prisma.bug.count({
        where: {
          severity: BugSeverity.CRITICAL,
          status: {
            notIn: [BugStatus.CLOSED, BugStatus.WONT_FIX],
          },
        },
      }),
      this.getBugCountBySeverity(),
      this.getBugCountByCategory(),
      this.getBugCountByStatus(),
      this.calculateAverageResolutionTime(),
    ]);

    return {
      total: totalBugs,
      open: openBugs,
      critical: criticalBugs,
      bySeverity: bugsBySeverity,
      byCategory: bugsByCategory,
      byStatus: bugsByStatus,
      averageResolutionTime,
    };
  }

  /**
   * Calculate bug priority score
   */
  async calculateBugPriorityScore(bugId: string): Promise<BugPriorityScore> {
    const bug = await prisma.bug.findUnique({ where: { id: bugId } });
    if (!bug) throw new Error('Bug not found');

    // Severity factor (0-40 points)
    const severityScore = this.getSeverityScore(bug.severity);

    // Users affected factor (0-25 points)
    const usersAffectedScore = Math.min((bug.usersAffected || 0) / 100 * 25, 25);

    // Business impact factor (0-20 points)
    const businessImpactScore = bug.businessImpact ? 20 : 0;

    // Age factor (0-10 points) - older bugs get higher priority
    const ageInDays = (Date.now() - bug.reportedAt.getTime()) / (1000 * 60 * 60 * 24);
    const ageScore = Math.min(ageInDays / 30 * 10, 10);

    // Recurrence factor (0-5 points)
    const recurrenceScore = await this.getRecurrenceScore(bugId);

    const totalScore = severityScore + usersAffectedScore + businessImpactScore + ageScore + recurrenceScore;

    return {
      bugId,
      score: Math.round(totalScore),
      factors: {
        severity: severityScore,
        usersAffected: usersAffectedScore,
        businessImpact: businessImpactScore,
        age: ageScore,
        recurrence: recurrenceScore,
      },
    };
  }

  /**
   * Add comment to bug
   */
  async addComment(bugId: string, authorId: string, authorName: string, content: string, isInternal: boolean = false): Promise<void> {
    await prisma.bugComment.create({
      data: {
        bugId,
        authorId,
        authorName,
        content,
        isInternal,
      },
    });
  }

  /**
   * Create test case for bug
   */
  async createTestCase(bugId: string, testCase: {
    title: string;
    description: string;
    steps: string;
    expectedResult: string;
    automated?: boolean;
    testScript?: string;
  }): Promise<void> {
    await prisma.bugTestCase.create({
      data: {
        bugId,
        ...testCase,
      },
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private calculatePriority(severity: BugSeverity): number {
    const priorityMap = {
      [BugSeverity.CRITICAL]: 100,
      [BugSeverity.HIGH]: 75,
      [BugSeverity.MEDIUM]: 50,
      [BugSeverity.LOW]: 25,
      [BugSeverity.TRIVIAL]: 10,
    };
    return priorityMap[severity];
  }

  private async calculateImpactScore(report: BugReport): Promise<number> {
    // Base score on severity
    let score = this.getSeverityScore(report.severity || BugSeverity.MEDIUM);

    // Adjust based on environment
    if (report.environment === 'PRODUCTION') {
      score *= 1.5;
    }

    // Adjust based on component criticality
    if (report.affectedComponent) {
      const criticalComponents = ['authentication', 'authorization', 'payment', 'data-integrity'];
      if (criticalComponents.some(c => report.affectedComponent?.toLowerCase().includes(c))) {
        score *= 1.3;
      }
    }

    return Math.min(score, 100);
  }

  private getSeverityScore(severity: BugSeverity): number {
    const scoreMap = {
      [BugSeverity.CRITICAL]: 40,
      [BugSeverity.HIGH]: 30,
      [BugSeverity.MEDIUM]: 20,
      [BugSeverity.LOW]: 10,
      [BugSeverity.TRIVIAL]: 5,
    };
    return scoreMap[severity];
  }

  private async checkForDuplicates(bugId: string): Promise<void> {
    const bug = await prisma.bug.findUnique({ where: { id: bugId } });
    if (!bug) return;

    // Find similar bugs based on title and description
    const similarBugs = await prisma.bug.findMany({
      where: {
        id: { not: bugId },
        isDuplicate: false,
        status: { notIn: [BugStatus.CLOSED, BugStatus.WONT_FIX] },
        OR: [
          { title: { contains: bug.title.substring(0, 20) } },
          { errorMessage: bug.errorMessage ? { contains: bug.errorMessage.substring(0, 50) } : undefined },
        ],
      },
    });

    // If similar bugs found, mark as potential duplicate
    if (similarBugs.length > 0) {
      await prisma.bug.update({
        where: { id: bugId },
        data: {
          relatedBugs: similarBugs.map(b => b.id),
        },
      });
    }
  }

  private async logBugHistory(bugId: string, field: string, oldValue: string | null, newValue: string, changedBy: string): Promise<void> {
    await prisma.bugHistory.create({
      data: {
        bugId,
        field,
        oldValue,
        newValue,
        changedBy,
      },
    });
  }

  private async notifyBugCreated(bug: Bug): Promise<void> {
    // TODO: Implement notification logic
    // - Send email to assigned developer
    // - Post to Slack/Teams channel
    // - Create notification in system
    console.log(`Bug created: ${bug.id} - ${bug.title}`);
  }

  private async analyzeErrorLogs(): Promise<any[]> {
    // TODO: Implement error log analysis
    // - Query error logs from monitoring system
    // - Identify patterns and recurring errors
    // - Group similar errors
    return [];
  }

  private async detectPerformanceIssues(): Promise<any[]> {
    // TODO: Implement performance monitoring
    // - Query performance metrics
    // - Identify degradation patterns
    // - Detect slow endpoints
    return [];
  }

  private mapErrorSeverity(frequency: number, impact: string): BugSeverity {
    if (impact === 'CRITICAL' || frequency > 100) return BugSeverity.CRITICAL;
    if (impact === 'HIGH' || frequency > 50) return BugSeverity.HIGH;
    if (frequency > 10) return BugSeverity.MEDIUM;
    return BugSeverity.LOW;
  }

  private categorizeError(errorType: string): BugCategory {
    const categoryMap: { [key: string]: BugCategory } = {
      'auth': BugCategory.AUTHENTICATION,
      'permission': BugCategory.AUTHORIZATION,
      'database': BugCategory.DATABASE,
      'api': BugCategory.API,
      'performance': BugCategory.PERFORMANCE,
      'security': BugCategory.SECURITY,
    };

    for (const [key, category] of Object.entries(categoryMap)) {
      if (errorType.toLowerCase().includes(key)) {
        return category;
      }
    }

    return BugCategory.OTHER;
  }

  private async getBugCountBySeverity(): Promise<any> {
    const counts = await prisma.bug.groupBy({
      by: ['severity'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.severity] = curr._count;
      return acc;
    }, {} as any);
  }

  private async getBugCountByCategory(): Promise<any> {
    const counts = await prisma.bug.groupBy({
      by: ['category'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.category] = curr._count;
      return acc;
    }, {} as any);
  }

  private async getBugCountByStatus(): Promise<any> {
    const counts = await prisma.bug.groupBy({
      by: ['status'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as any);
  }

  private async calculateAverageResolutionTime(): Promise<number> {
    const closedBugs = await prisma.bug.findMany({
      where: {
        status: BugStatus.CLOSED,
        closedAt: { not: null },
      },
      select: {
        reportedAt: true,
        closedAt: true,
      },
    });

    if (closedBugs.length === 0) return 0;

    const totalTime = closedBugs.reduce((sum, bug) => {
      const resolutionTime = bug.closedAt!.getTime() - bug.reportedAt.getTime();
      return sum + resolutionTime;
    }, 0);

    // Return average in hours
    return Math.round(totalTime / closedBugs.length / (1000 * 60 * 60));
  }

  private async getRecurrenceScore(bugId: string): Promise<number> {
    const bug = await prisma.bug.findUnique({ where: { id: bugId } });
    if (!bug) return 0;

    // Check if similar bugs have been reported before
    const similarBugs = await prisma.bug.count({
      where: {
        id: { not: bugId },
        category: bug.category,
        affectedComponent: bug.affectedComponent,
        status: BugStatus.CLOSED,
      },
    });

    return Math.min(similarBugs, 5);
  }
}

export default BugRepositoryService;