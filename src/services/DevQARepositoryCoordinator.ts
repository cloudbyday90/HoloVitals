/**
 * Development & QA Repository Coordinator
 * 
 * Orchestrates interactions between Bug Repository, Development & Enhancement Repository,
 * and Development & QA Processing Repository. Manages data flow and automated workflows.
 */

import BugRepositoryService from './BugRepositoryService';
import DevelopmentEnhancementService from './DevelopmentEnhancementService';
import DevQAProcessingService from './DevQAProcessingService';
import { BugSeverity, BugStatus, FeatureType, FeaturePriority, EnvironmentType } from '@prisma/client';

interface WorkflowResult {
  success: boolean;
  message: string;
  data?: any;
}

export class DevQARepositoryCoordinator {
  private bugService: BugRepositoryService;
  private enhancementService: DevelopmentEnhancementService;
  private devQAService: DevQAProcessingService;

  constructor() {
    this.bugService = new BugRepositoryService();
    this.enhancementService = new DevelopmentEnhancementService();
    this.devQAService = new DevQAProcessingService();
  }

  // ============================================================================
  // BUG-DRIVEN WORKFLOWS
  // ============================================================================

  /**
   * Process a new bug report through the entire workflow
   */
  async processBugReport(bugReport: any): Promise<WorkflowResult> {
    try {
      // 1. Create bug in Bug Repository
      const bug = await this.bugService.reportBug(bugReport);

      // 2. Triage the bug
      const triageData = await this.autoTriageBug(bug.id);
      await this.bugService.triageBug(bug.id, triageData);

      // 3. If critical/high severity, create enhancement for systemic fix
      if (bug.severity === BugSeverity.CRITICAL || bug.severity === BugSeverity.HIGH) {
        const enhancement = await this.createEnhancementFromBug(bug.id);
        
        // 4. If approved, create development project
        if (enhancement) {
          const project = await this.createProjectFromBug(bug.id, enhancement.id);
          
          return {
            success: true,
            message: 'Bug processed and development project created',
            data: { bug, enhancement, project },
          };
        }
      }

      return {
        success: true,
        message: 'Bug processed and triaged',
        data: { bug },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to process bug: ${error.message}`,
      };
    }
  }

  /**
   * Create enhancement from high-priority bug
   */
  async createEnhancementFromBug(bugId: string): Promise<any> {
    const bug = await this.bugService['prisma'].bug.findUnique({ where: { id: bugId } });
    if (!bug) return null;

    // Check if enhancement already exists for this bug
    const existingEnhancements = await this.enhancementService['prisma'].feature.findMany({
      where: {
        relatedBugs: { has: bugId },
      },
    });

    if (existingEnhancements.length > 0) {
      return existingEnhancements[0];
    }

    // Create enhancement
    const enhancement = await this.enhancementService.submitFeatureRequest({
      title: `Fix: ${bug.title}`,
      description: `Enhancement to address bug: ${bug.description}\n\nOriginal Bug ID: ${bugId}`,
      type: FeatureType.ENHANCEMENT,
      priority: this.mapBugSeverityToPriority(bug.severity),
      businessValue: bug.businessImpact || 'Resolves critical bug affecting users',
      relatedBugs: [bugId],
      tags: ['bug-fix', bug.category.toLowerCase()],
    });

    // Auto-approve critical bug fixes
    if (bug.severity === BugSeverity.CRITICAL) {
      await this.enhancementService.evaluateFeature(enhancement.id, {
        approved: true,
        priority: FeaturePriority.CRITICAL,
        feedback: 'Auto-approved due to critical bug severity',
        evaluatedBy: 'SYSTEM',
      });
    }

    return enhancement;
  }

  /**
   * Create development project from bug
   */
  async createProjectFromBug(bugId: string, enhancementId?: string): Promise<any> {
    const bug = await this.bugService['prisma'].bug.findUnique({ where: { id: bugId } });
    if (!bug) throw new Error('Bug not found');

    const project = await this.devQAService.createProject({
      name: `Bug Fix: ${bug.title}`,
      description: bug.description,
      type: 'BUG_FIX',
      sourceType: 'BUG',
      sourceId: bugId,
      tags: ['bug-fix', bug.category.toLowerCase(), bug.severity.toLowerCase()],
    });

    // Update bug status
    await this.bugService.updateBugStatus(bugId, BugStatus.IN_PROGRESS, 'SYSTEM');

    return project;
  }

  // ============================================================================
  // FEATURE-DRIVEN WORKFLOWS
  // ============================================================================

  /**
   * Process a feature request through the entire workflow
   */
  async processFeatureRequest(featureRequest: any): Promise<WorkflowResult> {
    try {
      // 1. Create feature in Enhancement Repository
      const feature = await this.enhancementService.submitFeatureRequest(featureRequest);

      // 2. Perform impact analysis
      const impact = await this.enhancementService.performImpactAnalysis(feature.id);

      // 3. Auto-evaluate based on impact score
      if (impact.overallScore >= 70) {
        await this.enhancementService.evaluateFeature(feature.id, {
          approved: true,
          priority: FeaturePriority.HIGH,
          feedback: `Auto-approved based on high impact score (${impact.overallScore})`,
          evaluatedBy: 'SYSTEM',
        });

        // 4. Create development project
        const project = await this.createProjectFromFeature(feature.id);

        return {
          success: true,
          message: 'Feature approved and development project created',
          data: { feature, impact, project },
        };
      }

      return {
        success: true,
        message: 'Feature submitted for evaluation',
        data: { feature, impact },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to process feature: ${error.message}`,
      };
    }
  }

  /**
   * Create development project from feature
   */
  async createProjectFromFeature(featureId: string): Promise<any> {
    const feature = await this.enhancementService['prisma'].feature.findUnique({ where: { id: featureId } });
    if (!feature) throw new Error('Feature not found');

    const project = await this.devQAService.createProject({
      name: feature.title,
      description: feature.description,
      type: 'FEATURE',
      sourceType: 'FEATURE',
      sourceId: featureId,
      tags: [feature.type.toLowerCase(), feature.priority.toLowerCase()],
    });

    // Update feature status
    await this.enhancementService.startDevelopment(featureId, 'SYSTEM');

    return project;
  }

  // ============================================================================
  // DEPLOYMENT WORKFLOWS
  // ============================================================================

  /**
   * Complete development and deploy workflow
   */
  async completeAndDeploy(projectId: string, deployedBy: string): Promise<WorkflowResult> {
    try {
      const project = await this.devQAService['prisma'].developmentProject.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return { success: false, message: 'Project not found' };
      }

      // 1. Run tests in QA environment
      const testResult = await this.devQAService.runTests(projectId, {
        environment: EnvironmentType.QA,
        testSuite: 'full',
        testType: 'INTEGRATION',
        triggeredBy: deployedBy,
      });

      if (!testResult.success) {
        return {
          success: false,
          message: 'Tests failed in QA environment',
          data: testResult,
        };
      }

      // 2. Deploy to Staging
      const stagingDeployment = await this.devQAService.deploy(projectId, {
        environment: EnvironmentType.STAGING,
        version: '1.0.0',
        branch: 'staging',
        deployedBy,
        notes: 'Automated deployment to staging',
      });

      if (!stagingDeployment.success) {
        return {
          success: false,
          message: 'Staging deployment failed',
          data: stagingDeployment,
        };
      }

      // 3. Run tests in Staging
      const stagingTestResult = await this.devQAService.runTests(projectId, {
        environment: EnvironmentType.STAGING,
        testSuite: 'full',
        testType: 'E2E',
        triggeredBy: deployedBy,
      });

      if (!stagingTestResult.success) {
        return {
          success: false,
          message: 'Tests failed in Staging environment',
          data: stagingTestResult,
        };
      }

      // 4. Update source (bug or feature) status
      if (project.sourceType === 'BUG' && project.sourceId) {
        await this.bugService.updateBugStatus(project.sourceId, BugStatus.FIXED, deployedBy);
      } else if (project.sourceType === 'FEATURE' && project.sourceId) {
        await this.enhancementService.completeFeature(project.sourceId, deployedBy);
      }

      // 5. Close project
      await this.devQAService.closeProject(projectId);

      return {
        success: true,
        message: 'Project completed and deployed successfully',
        data: {
          testResult,
          stagingDeployment,
          stagingTestResult,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Deployment workflow failed: ${error.message}`,
      };
    }
  }

  // ============================================================================
  // MONITORING & HEALTH WORKFLOWS
  // ============================================================================

  /**
   * Monitor system health and detect issues
   */
  async monitorSystemHealth(): Promise<WorkflowResult> {
    try {
      // 1. Monitor all environments
      await this.devQAService.monitorAllEnvironments();

      // 2. Detect system bugs
      const bugDetection = await this.bugService.detectSystemBugs();

      // 3. Process detected bugs
      if (bugDetection.detected) {
        for (const bug of bugDetection.bugs) {
          await this.processBugReport({
            title: bug.title,
            description: bug.description,
            source: bug.source,
            severity: bug.severity,
            category: bug.category,
          });
        }
      }

      return {
        success: true,
        message: 'System health monitoring completed',
        data: {
          bugsDetected: bugDetection.bugs.length,
          bugs: bugDetection.bugs,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Health monitoring failed: ${error.message}`,
      };
    }
  }

  // ============================================================================
  // REPORTING & ANALYTICS
  // ============================================================================

  /**
   * Generate comprehensive system report
   */
  async generateSystemReport(): Promise<any> {
    const [bugStats, featureStats, projectStats] = await Promise.all([
      this.bugService.getBugStatistics(),
      this.enhancementService.getFeatureStatistics(),
      this.getProjectStatistics(),
    ]);

    return {
      timestamp: new Date(),
      bugs: bugStats,
      features: featureStats,
      projects: projectStats,
      summary: {
        openBugs: bugStats.open,
        criticalBugs: bugStats.critical,
        featuresInProgress: featureStats.inProgress,
        activeProjects: projectStats.active,
      },
    };
  }

  /**
   * Get high-priority items across all repositories
   */
  async getHighPriorityItems(): Promise<any> {
    const [bugs, features] = await Promise.all([
      this.bugService.getHighPriorityBugs(10),
      this.enhancementService.getFeaturesByPriority(FeaturePriority.CRITICAL),
    ]);

    return {
      criticalBugs: bugs.filter(b => b.severity === BugSeverity.CRITICAL),
      highPriorityBugs: bugs.filter(b => b.severity === BugSeverity.HIGH),
      criticalFeatures: features,
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async autoTriageBug(bugId: string): Promise<any> {
    const bug = await this.bugService['prisma'].bug.findUnique({ where: { id: bugId } });
    if (!bug) throw new Error('Bug not found');

    // Calculate priority score
    const priorityScore = await this.bugService.calculateBugPriorityScore(bugId);

    // Determine if auto-assignment is needed
    let assignedTo: string | undefined;
    if (bug.severity === BugSeverity.CRITICAL) {
      assignedTo = 'CRITICAL_TEAM'; // Would be actual team/person ID
    }

    return {
      severity: bug.severity,
      category: bug.category,
      priority: priorityScore.score,
      assignedTo,
    };
  }

  private mapBugSeverityToPriority(severity: BugSeverity): FeaturePriority {
    const map = {
      [BugSeverity.CRITICAL]: FeaturePriority.CRITICAL,
      [BugSeverity.HIGH]: FeaturePriority.HIGH,
      [BugSeverity.MEDIUM]: FeaturePriority.MEDIUM,
      [BugSeverity.LOW]: FeaturePriority.LOW,
      [BugSeverity.TRIVIAL]: FeaturePriority.BACKLOG,
    };
    return map[severity];
  }

  private async getProjectStatistics(): Promise<any> {
    const projects = await this.devQAService['prisma'].developmentProject.findMany();
    
    return {
      total: projects.length,
      active: projects.filter(p => ['PLANNING', 'DEVELOPMENT', 'TESTING', 'STAGING'].includes(p.status)).length,
      completed: projects.filter(p => p.status === 'CLOSED').length,
      byType: this.groupBy(projects, 'type'),
      byStatus: this.groupBy(projects, 'status'),
    };
  }

  private groupBy(array: any[], key: string): any {
    return array.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }
}

export default DevQARepositoryCoordinator;