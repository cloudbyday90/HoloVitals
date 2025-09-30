/**
 * Development & Enhancement Repository Service
 * 
 * Manages feature requests, roadmap planning, and enhancement tracking.
 * Integrates with Bug Repository for bug-driven improvements.
 */

import { PrismaClient, Feature, FeatureStatus, FeaturePriority, FeatureType, Roadmap } from '@prisma/client';

const prisma = new PrismaClient();

interface FeatureRequest {
  title: string;
  description: string;
  type: FeatureType;
  priority?: FeaturePriority;
  requestedBy?: string;
  requestedByEmail?: string;
  businessValue?: string;
  targetAudience?: string;
  expectedImpact?: string;
  successMetrics?: string;
  technicalSpec?: string;
  estimatedEffort?: number;
  complexity?: number;
  dependsOn?: string[];
  blockedBy?: string[];
  relatedBugs?: string[];
  tags?: string[];
  attachments?: string[];
}

interface RoadmapPlan {
  name: string;
  description?: string;
  version: string;
  startDate: Date;
  endDate: Date;
  features: string[];
  goals: string[];
}

interface ImpactAnalysis {
  featureId: string;
  technicalImpact: {
    complexity: number;
    effort: number;
    risk: string;
    dependencies: string[];
  };
  businessImpact: {
    value: number;
    audience: string;
    expectedOutcome: string;
  };
  resourceImpact: {
    developmentTime: number;
    testingTime: number;
    documentationTime: number;
  };
  overallScore: number;
}

export class DevelopmentEnhancementService {
  /**
   * Submit a new feature request
   */
  async submitFeatureRequest(request: FeatureRequest): Promise<Feature> {
    const feature = await prisma.feature.create({
      data: {
        title: request.title,
        description: request.description,
        type: request.type,
        priority: request.priority || FeaturePriority.MEDIUM,
        status: FeatureStatus.PROPOSED,
        requestedBy: request.requestedBy,
        requestedByEmail: request.requestedByEmail,
        businessValue: request.businessValue,
        targetAudience: request.targetAudience,
        expectedImpact: request.expectedImpact,
        successMetrics: request.successMetrics,
        technicalSpec: request.technicalSpec,
        estimatedEffort: request.estimatedEffort,
        complexity: request.complexity,
        dependsOn: request.dependsOn || [],
        blockedBy: request.blockedBy || [],
        relatedBugs: request.relatedBugs || [],
        tags: request.tags || [],
        attachments: request.attachments || [],
      },
    });

    // Log feature creation
    await this.logFeatureHistory(feature.id, 'status', null, FeatureStatus.PROPOSED, 'SYSTEM');

    // Notify stakeholders
    await this.notifyFeatureCreated(feature);

    return feature;
  }

  /**
   * Evaluate a feature request
   */
  async evaluateFeature(featureId: string, evaluation: {
    approved: boolean;
    priority?: FeaturePriority;
    targetRelease?: string;
    targetDate?: Date;
    feedback?: string;
    evaluatedBy: string;
  }): Promise<Feature> {
    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) throw new Error('Feature not found');

    const newStatus = evaluation.approved ? FeatureStatus.APPROVED : FeatureStatus.REJECTED;

    const updates: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (evaluation.priority) {
      updates.priority = evaluation.priority;
      await this.logFeatureHistory(featureId, 'priority', feature.priority, evaluation.priority, evaluation.evaluatedBy);
    }

    if (evaluation.targetRelease) {
      updates.targetRelease = evaluation.targetRelease;
    }

    if (evaluation.targetDate) {
      updates.targetDate = evaluation.targetDate;
    }

    await this.logFeatureHistory(featureId, 'status', feature.status, newStatus, evaluation.evaluatedBy);

    if (evaluation.feedback) {
      await this.addComment(featureId, evaluation.evaluatedBy, 'Evaluation Team', evaluation.feedback, true);
    }

    return await prisma.feature.update({
      where: { id: featureId },
      data: updates,
    });
  }

  /**
   * Add feature to roadmap
   */
  async addToRoadmap(featureId: string, targetRelease: string, targetDate?: Date): Promise<Feature> {
    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) throw new Error('Feature not found');

    // Check dependencies
    const blockedDependencies = await this.checkDependencies(featureId);
    if (blockedDependencies.length > 0) {
      throw new Error(`Feature is blocked by: ${blockedDependencies.join(', ')}`);
    }

    const updates: any = {
      status: FeatureStatus.PLANNED,
      targetRelease,
      updatedAt: new Date(),
    };

    if (targetDate) {
      updates.targetDate = targetDate;
    }

    await this.logFeatureHistory(featureId, 'status', feature.status, FeatureStatus.PLANNED, 'ROADMAP_SYSTEM');

    return await prisma.feature.update({
      where: { id: featureId },
      data: updates,
    });
  }

  /**
   * Start feature development
   */
  async startDevelopment(featureId: string, assignedTo: string): Promise<Feature> {
    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) throw new Error('Feature not found');

    const updates: any = {
      status: FeatureStatus.IN_PROGRESS,
      assignedTo,
      assignedAt: new Date(),
      startedAt: new Date(),
      updatedAt: new Date(),
    };

    await this.logFeatureHistory(featureId, 'status', feature.status, FeatureStatus.IN_PROGRESS, assignedTo);

    return await prisma.feature.update({
      where: { id: featureId },
      data: updates,
    });
  }

  /**
   * Complete feature development
   */
  async completeFeature(featureId: string, implementedBy: string): Promise<Feature> {
    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) throw new Error('Feature not found');

    const updates: any = {
      status: FeatureStatus.COMPLETED,
      completedAt: new Date(),
      implementedBy,
      updatedAt: new Date(),
    };

    await this.logFeatureHistory(featureId, 'status', feature.status, FeatureStatus.COMPLETED, implementedBy);

    return await prisma.feature.update({
      where: { id: featureId },
      data: updates,
    });
  }

  /**
   * Create a roadmap
   */
  async createRoadmap(plan: RoadmapPlan): Promise<Roadmap> {
    // Validate features exist and are approved
    const features = await prisma.feature.findMany({
      where: {
        id: { in: plan.features },
        status: { in: [FeatureStatus.APPROVED, FeatureStatus.PLANNED] },
      },
    });

    if (features.length !== plan.features.length) {
      throw new Error('Some features are not approved or do not exist');
    }

    const roadmap = await prisma.roadmap.create({
      data: {
        name: plan.name,
        description: plan.description,
        version: plan.version,
        startDate: plan.startDate,
        endDate: plan.endDate,
        features: plan.features,
        goals: plan.goals,
        status: 'PLANNING',
      },
    });

    // Update features to reference this roadmap
    await prisma.feature.updateMany({
      where: { id: { in: plan.features } },
      data: {
        targetRelease: plan.version,
        status: FeatureStatus.PLANNED,
      },
    });

    return roadmap;
  }

  /**
   * Get roadmap by version
   */
  async getRoadmap(version: string): Promise<Roadmap | null> {
    return await prisma.roadmap.findFirst({
      where: { version },
    });
  }

  /**
   * Get all active roadmaps
   */
  async getActiveRoadmaps(): Promise<Roadmap[]> {
    return await prisma.roadmap.findMany({
      where: {
        status: { in: ['PLANNING', 'ACTIVE'] },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Perform impact analysis on a feature
   */
  async performImpactAnalysis(featureId: string): Promise<ImpactAnalysis> {
    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) throw new Error('Feature not found');

    // Technical Impact
    const technicalImpact = {
      complexity: feature.complexity || 5,
      effort: feature.estimatedEffort || 0,
      risk: this.assessRisk(feature),
      dependencies: feature.dependsOn,
    };

    // Business Impact
    const businessImpact = {
      value: this.calculateBusinessValue(feature),
      audience: feature.targetAudience || 'Unknown',
      expectedOutcome: feature.expectedImpact || 'Not specified',
    };

    // Resource Impact
    const resourceImpact = {
      developmentTime: feature.estimatedEffort || 0,
      testingTime: Math.ceil((feature.estimatedEffort || 0) * 0.3),
      documentationTime: Math.ceil((feature.estimatedEffort || 0) * 0.1),
    };

    // Calculate overall score (0-100)
    const overallScore = this.calculateOverallScore(technicalImpact, businessImpact, resourceImpact);

    return {
      featureId,
      technicalImpact,
      businessImpact,
      resourceImpact,
      overallScore,
    };
  }

  /**
   * Get features by priority
   */
  async getFeaturesByPriority(priority: FeaturePriority, status?: FeatureStatus): Promise<Feature[]> {
    const where: any = { priority };

    if (status) {
      where.status = status;
    }

    return await prisma.feature.findMany({
      where,
      orderBy: [
        { requestedAt: 'asc' },
      ],
    });
  }

  /**
   * Get features for a release
   */
  async getFeaturesForRelease(version: string): Promise<Feature[]> {
    return await prisma.feature.findMany({
      where: { targetRelease: version },
      orderBy: [
        { priority: 'desc' },
        { status: 'asc' },
      ],
    });
  }

  /**
   * Get bug-driven enhancements
   */
  async getBugDrivenEnhancements(): Promise<Feature[]> {
    return await prisma.feature.findMany({
      where: {
        type: FeatureType.ENHANCEMENT,
        relatedBugs: { isEmpty: false },
        status: { in: [FeatureStatus.PROPOSED, FeatureStatus.APPROVED, FeatureStatus.PLANNED] },
      },
      orderBy: [
        { priority: 'desc' },
      ],
    });
  }

  /**
   * Get feature statistics
   */
  async getFeatureStatistics(): Promise<any> {
    const [
      totalFeatures,
      proposedFeatures,
      inProgressFeatures,
      completedFeatures,
      featuresByType,
      featuresByPriority,
      featuresByStatus,
      averageCompletionTime,
    ] = await Promise.all([
      prisma.feature.count(),
      prisma.feature.count({ where: { status: FeatureStatus.PROPOSED } }),
      prisma.feature.count({ where: { status: FeatureStatus.IN_PROGRESS } }),
      prisma.feature.count({ where: { status: FeatureStatus.COMPLETED } }),
      this.getFeatureCountByType(),
      this.getFeatureCountByPriority(),
      this.getFeatureCountByStatus(),
      this.calculateAverageCompletionTime(),
    ]);

    return {
      total: totalFeatures,
      proposed: proposedFeatures,
      inProgress: inProgressFeatures,
      completed: completedFeatures,
      byType: featuresByType,
      byPriority: featuresByPriority,
      byStatus: featuresByStatus,
      averageCompletionTime,
    };
  }

  /**
   * Vote on a feature
   */
  async voteOnFeature(featureId: string, userId: string, vote: number, comment?: string): Promise<void> {
    await prisma.featureVote.upsert({
      where: {
        featureId_userId: {
          featureId,
          userId,
        },
      },
      create: {
        featureId,
        userId,
        vote,
        comment,
      },
      update: {
        vote,
        comment,
      },
    });
  }

  /**
   * Get feature votes
   */
  async getFeatureVotes(featureId: string): Promise<{ upvotes: number; downvotes: number; total: number }> {
    const votes = await prisma.featureVote.findMany({
      where: { featureId },
    });

    const upvotes = votes.filter(v => v.vote > 0).length;
    const downvotes = votes.filter(v => v.vote < 0).length;

    return {
      upvotes,
      downvotes,
      total: upvotes - downvotes,
    };
  }

  /**
   * Add comment to feature
   */
  async addComment(featureId: string, authorId: string, authorName: string, content: string, isInternal: boolean = false): Promise<void> {
    await prisma.featureComment.create({
      data: {
        featureId,
        authorId,
        authorName,
        content,
        isInternal,
      },
    });
  }

  /**
   * Create feature task
   */
  async createTask(featureId: string, task: {
    title: string;
    description?: string;
    assignedTo?: string;
    estimatedHours?: number;
  }): Promise<void> {
    await prisma.featureTask.create({
      data: {
        featureId,
        ...task,
      },
    });
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: string, actualHours?: number): Promise<void> {
    const updates: any = { status };

    if (status === 'DONE') {
      updates.completedAt = new Date();
    }

    if (actualHours !== undefined) {
      updates.actualHours = actualHours;
    }

    await prisma.featureTask.update({
      where: { id: taskId },
      data: updates,
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async checkDependencies(featureId: string): Promise<string[]> {
    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature || feature.dependsOn.length === 0) return [];

    const dependencies = await prisma.feature.findMany({
      where: {
        id: { in: feature.dependsOn },
        status: { notIn: [FeatureStatus.COMPLETED] },
      },
    });

    return dependencies.map(d => d.title);
  }

  private assessRisk(feature: Feature): string {
    const complexity = feature.complexity || 5;
    const hasDependencies = feature.dependsOn.length > 0;
    const isBlocked = feature.blockedBy.length > 0;

    if (complexity >= 8 || isBlocked) return 'HIGH';
    if (complexity >= 5 || hasDependencies) return 'MEDIUM';
    return 'LOW';
  }

  private calculateBusinessValue(feature: Feature): number {
    let value = 50; // Base value

    // Adjust based on priority
    const priorityBonus = {
      [FeaturePriority.CRITICAL]: 40,
      [FeaturePriority.HIGH]: 30,
      [FeaturePriority.MEDIUM]: 20,
      [FeaturePriority.LOW]: 10,
      [FeaturePriority.BACKLOG]: 5,
    };
    value += priorityBonus[feature.priority];

    // Adjust based on type
    if (feature.type === FeatureType.SECURITY) value += 20;
    if (feature.type === FeatureType.PERFORMANCE) value += 15;

    // Adjust based on related bugs
    if (feature.relatedBugs.length > 0) value += feature.relatedBugs.length * 5;

    return Math.min(value, 100);
  }

  private calculateOverallScore(technical: any, business: any, resource: any): number {
    // Business value (40%)
    const businessScore = business.value * 0.4;

    // Technical feasibility (30%) - inverse of complexity
    const technicalScore = (10 - technical.complexity) * 3;

    // Resource efficiency (30%) - inverse of effort
    const resourceScore = Math.max(0, 30 - (resource.developmentTime / 10));

    return Math.round(businessScore + technicalScore + resourceScore);
  }

  private async logFeatureHistory(featureId: string, field: string, oldValue: string | null, newValue: string, changedBy: string): Promise<void> {
    await prisma.featureHistory.create({
      data: {
        featureId,
        field,
        oldValue,
        newValue,
        changedBy,
      },
    });
  }

  private async notifyFeatureCreated(feature: Feature): Promise<void> {
    // TODO: Implement notification logic
    console.log(`Feature created: ${feature.id} - ${feature.title}`);
  }

  private async getFeatureCountByType(): Promise<any> {
    const counts = await prisma.feature.groupBy({
      by: ['type'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.type] = curr._count;
      return acc;
    }, {} as any);
  }

  private async getFeatureCountByPriority(): Promise<any> {
    const counts = await prisma.feature.groupBy({
      by: ['priority'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.priority] = curr._count;
      return acc;
    }, {} as any);
  }

  private async getFeatureCountByStatus(): Promise<any> {
    const counts = await prisma.feature.groupBy({
      by: ['status'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as any);
  }

  private async calculateAverageCompletionTime(): Promise<number> {
    const completedFeatures = await prisma.feature.findMany({
      where: {
        status: FeatureStatus.COMPLETED,
        completedAt: { not: null },
        startedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    if (completedFeatures.length === 0) return 0;

    const totalTime = completedFeatures.reduce((sum, feature) => {
      const completionTime = feature.completedAt!.getTime() - feature.startedAt!.getTime();
      return sum + completionTime;
    }, 0);

    // Return average in days
    return Math.round(totalTime / completedFeatures.length / (1000 * 60 * 60 * 24));
  }
}

export default DevelopmentEnhancementService;