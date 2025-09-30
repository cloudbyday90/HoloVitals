/**
 * Change Management Service
 * 
 * Manages change requests, approvals, and implementations with emergency fast-track
 * capabilities for critical system changes.
 */

import { PrismaClient, ChangeRequest, ChangeType, ChangePriority, ChangeStatus, ChangeRiskLevel, ApprovalStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface ChangeRequestData {
  type: ChangeType;
  priority: ChangePriority;
  riskLevel: ChangeRiskLevel;
  title: string;
  description: string;
  justification: string;
  affectedServices: string[];
  affectedSystems: string[];
  changeScope: string;
  implementationPlan: string;
  rollbackPlan: string;
  testingPlan?: string;
  estimatedDowntime?: number;
  userImpact?: string;
  businessImpact?: string;
  technicalImpact?: string;
  complianceImpact?: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  requestedBy: string;
  requestedByName: string;
  requestedByEmail: string;
  tags?: string[];
  attachments?: string[];
}

interface EmergencyChangeData {
  title: string;
  description: string;
  justification: string;
  affectedServices: string[];
  implementationPlan: string;
  rollbackPlan: string;
  requestedBy: string;
  requestedByName: string;
  requestedByEmail: string;
  incidentId?: string;
}

interface ApprovalDecision {
  approverId: string;
  approverName: string;
  decision: 'APPROVED' | 'REJECTED' | 'ESCALATED';
  comments?: string;
  conditions?: string;
}

interface ImplementationStep {
  step: number;
  stepName: string;
  stepDescription: string;
  rollbackCommand?: string;
}

export class ChangeManagementService {
  /**
   * Submit a change request
   */
  async submitChangeRequest(data: ChangeRequestData): Promise<ChangeRequest> {
    // Determine approval level based on risk
    const approvalLevel = this.determineApprovalLevel(data.riskLevel, data.type);

    const changeRequest = await prisma.changeRequest.create({
      data: {
        type: data.type,
        priority: data.priority,
        riskLevel: data.riskLevel,
        title: data.title,
        description: data.description,
        justification: data.justification,
        affectedServices: data.affectedServices,
        affectedSystems: data.affectedSystems,
        changeScope: data.changeScope,
        implementationPlan: data.implementationPlan,
        rollbackPlan: data.rollbackPlan,
        testingPlan: data.testingPlan,
        estimatedDowntime: data.estimatedDowntime,
        userImpact: data.userImpact,
        businessImpact: data.businessImpact,
        technicalImpact: data.technicalImpact,
        complianceImpact: data.complianceImpact,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        requestedBy: data.requestedBy,
        requestedByName: data.requestedByName,
        requestedByEmail: data.requestedByEmail,
        tags: data.tags || [],
        attachments: data.attachments || [],
        status: ChangeStatus.SUBMITTED,
        approvalLevel,
        requiresApproval: data.type !== ChangeType.STANDARD,
      },
    });

    // Create approval requests
    await this.createApprovalRequests(changeRequest.id, approvalLevel);

    // Notify relevant parties
    await this.notifyChangeSubmitted(changeRequest);

    return changeRequest;
  }

  /**
   * Submit emergency change request (fast-track)
   */
  async submitEmergencyChange(data: EmergencyChangeData): Promise<ChangeRequest> {
    const changeRequest = await prisma.changeRequest.create({
      data: {
        type: ChangeType.EMERGENCY,
        priority: ChangePriority.CRITICAL,
        riskLevel: ChangeRiskLevel.CRITICAL,
        title: data.title,
        description: data.description,
        justification: data.justification,
        affectedServices: data.affectedServices,
        affectedSystems: [],
        changeScope: 'Emergency change to restore service',
        implementationPlan: data.implementationPlan,
        rollbackPlan: data.rollbackPlan,
        requestedBy: data.requestedBy,
        requestedByName: data.requestedByName,
        requestedByEmail: data.requestedByEmail,
        status: ChangeStatus.SUBMITTED,
        approvalLevel: 2, // Requires technical lead approval
        requiresApproval: true,
        relatedIncidents: data.incidentId ? [data.incidentId] : [],
      },
    });

    // Create fast-track approval requests
    await this.createEmergencyApprovalRequests(changeRequest.id);

    // Send urgent notifications
    await this.notifyEmergencyChange(changeRequest);

    return changeRequest;
  }

  /**
   * Approve or reject change request
   */
  async processApproval(changeRequestId: string, approvalId: string, decision: ApprovalDecision): Promise<any> {
    const approval = await prisma.changeApproval.findUnique({
      where: { id: approvalId },
      include: { changeRequest: true },
    });

    if (!approval) {
      throw new Error('Approval request not found');
    }

    // Update approval
    await prisma.changeApproval.update({
      where: { id: approvalId },
      data: {
        status: decision.decision === 'APPROVED' ? ApprovalStatus.APPROVED : 
                decision.decision === 'REJECTED' ? ApprovalStatus.REJECTED : 
                ApprovalStatus.ESCALATED,
        decision: decision.decision,
        approverId: decision.approverId,
        approverName: decision.approverName,
        comments: decision.comments,
        conditions: decision.conditions,
        respondedAt: new Date(),
      },
    });

    // Check if all required approvals are complete
    const allApprovals = await prisma.changeApproval.findMany({
      where: { changeRequestId },
    });

    const allApproved = allApprovals.every(a => a.status === ApprovalStatus.APPROVED);
    const anyRejected = allApprovals.some(a => a.status === ApprovalStatus.REJECTED);

    // Update change request status
    if (anyRejected) {
      await prisma.changeRequest.update({
        where: { id: changeRequestId },
        data: { status: ChangeStatus.REJECTED },
      });

      await this.notifyChangeRejected(approval.changeRequest, decision.comments);
    } else if (allApproved) {
      await prisma.changeRequest.update({
        where: { id: changeRequestId },
        data: { status: ChangeStatus.APPROVED },
      });

      await this.notifyChangeApproved(approval.changeRequest);
    }

    return {
      approved: allApproved,
      rejected: anyRejected,
      pendingApprovals: allApprovals.filter(a => a.status === ApprovalStatus.PENDING).length,
    };
  }

  /**
   * Implement change request
   */
  async implementChange(changeRequestId: string, implementedBy: string, steps: ImplementationStep[]): Promise<any> {
    const changeRequest = await prisma.changeRequest.findUnique({
      where: { id: changeRequestId },
    });

    if (!changeRequest) {
      throw new Error('Change request not found');
    }

    if (changeRequest.status !== ChangeStatus.APPROVED && changeRequest.status !== ChangeStatus.SCHEDULED) {
      throw new Error(`Change request must be approved before implementation. Current status: ${changeRequest.status}`);
    }

    // Update change request status
    await prisma.changeRequest.update({
      where: { id: changeRequestId },
      data: {
        status: ChangeStatus.IN_PROGRESS,
        implementedBy,
        actualStart: new Date(),
      },
    });

    // Create implementation steps
    for (const step of steps) {
      await prisma.changeImplementation.create({
        data: {
          changeRequestId,
          step: step.step,
          stepName: step.stepName,
          stepDescription: step.stepDescription,
          rollbackCommand: step.rollbackCommand,
          status: 'PENDING',
        },
      });
    }

    // Notify implementation started
    await this.notifyImplementationStarted(changeRequest);

    return {
      changeRequestId,
      status: 'IN_PROGRESS',
      totalSteps: steps.length,
    };
  }

  /**
   * Execute implementation step
   */
  async executeImplementationStep(stepId: string): Promise<any> {
    const step = await prisma.changeImplementation.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      throw new Error('Implementation step not found');
    }

    try {
      // Update step status
      await prisma.changeImplementation.update({
        where: { id: stepId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      // Execute step (this would integrate with actual deployment system)
      const result = await this.executeStep(step);

      // Update step with results
      await prisma.changeImplementation.update({
        where: { id: stepId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration: Math.floor((Date.now() - (step.startedAt?.getTime() || Date.now())) / 1000),
          success: true,
          output: result.output,
        },
      });

      return {
        success: true,
        stepId,
        output: result.output,
      };
    } catch (error: any) {
      // Mark step as failed
      await prisma.changeImplementation.update({
        where: { id: stepId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          success: false,
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Complete change implementation
   */
  async completeChange(changeRequestId: string, actualDowntime?: number): Promise<ChangeRequest> {
    const changeRequest = await prisma.changeRequest.update({
      where: { id: changeRequestId },
      data: {
        status: ChangeStatus.TESTING,
        actualEnd: new Date(),
        actualDowntime,
      },
    });

    // Create validation tasks
    await this.createValidationTasks(changeRequestId);

    // Notify completion
    await this.notifyChangeCompleted(changeRequest);

    return changeRequest;
  }

  /**
   * Validate change implementation
   */
  async validateChange(changeRequestId: string, validationType: string, results: any): Promise<any> {
    await prisma.changeValidation.create({
      data: {
        changeRequestId,
        validationType,
        validationName: `${validationType} Validation`,
        validationSteps: JSON.stringify(results.steps),
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date(),
        passed: results.passed,
        results: results,
        issues: results.issues || [],
        recommendations: results.recommendations || [],
      },
    });

    // Check if all validations are complete
    const allValidations = await prisma.changeValidation.findMany({
      where: { changeRequestId },
    });

    const allPassed = allValidations.every(v => v.passed);

    if (allPassed) {
      await prisma.changeRequest.update({
        where: { id: changeRequestId },
        data: {
          status: ChangeStatus.COMPLETED,
          validationPassed: true,
        },
      });
    }

    return {
      validationType,
      passed: results.passed,
      allValidationsPassed: allPassed,
    };
  }

  /**
   * Rollback change
   */
  async rollbackChange(changeRequestId: string, rolledBackBy: string, reason: string): Promise<any> {
    const changeRequest = await prisma.changeRequest.findUnique({
      where: { id: changeRequestId },
    });

    if (!changeRequest) {
      throw new Error('Change request not found');
    }

    // Get implementation steps in reverse order
    const steps = await prisma.changeImplementation.findMany({
      where: {
        changeRequestId,
        status: 'COMPLETED',
        canRollback: true,
      },
      orderBy: { step: 'desc' },
    });

    // Execute rollback commands
    for (const step of steps) {
      if (step.rollbackCommand) {
        try {
          await this.executeRollbackCommand(step.rollbackCommand);
        } catch (error) {
          console.error(`Rollback failed for step ${step.step}:`, error);
        }
      }
    }

    // Update change request
    await prisma.changeRequest.update({
      where: { id: changeRequestId },
      data: {
        status: ChangeStatus.ROLLED_BACK,
        rolledBack: true,
        rollbackReason: reason,
        rollbackAt: new Date(),
      },
    });

    // Notify rollback
    await this.notifyChangeRolledBack(changeRequest, reason);

    return {
      success: true,
      changeRequestId,
      stepsRolledBack: steps.length,
    };
  }

  /**
   * Get change request statistics
   */
  async getChangeStatistics(): Promise<any> {
    const [
      totalChanges,
      pendingApproval,
      inProgress,
      completed,
      emergencyChanges,
      changesByType,
      changesByRisk,
      averageApprovalTime,
      averageImplementationTime,
    ] = await Promise.all([
      prisma.changeRequest.count(),
      prisma.changeRequest.count({ where: { status: ChangeStatus.SUBMITTED } }),
      prisma.changeRequest.count({ where: { status: ChangeStatus.IN_PROGRESS } }),
      prisma.changeRequest.count({ where: { status: ChangeStatus.COMPLETED } }),
      prisma.changeRequest.count({ where: { type: ChangeType.EMERGENCY } }),
      this.getChangeCountByType(),
      this.getChangeCountByRisk(),
      this.calculateAverageApprovalTime(),
      this.calculateAverageImplementationTime(),
    ]);

    return {
      total: totalChanges,
      pendingApproval,
      inProgress,
      completed,
      emergency: emergencyChanges,
      byType: changesByType,
      byRisk: changesByRisk,
      averageApprovalTime,
      averageImplementationTime,
    };
  }

  /**
   * Get pending approvals for user
   */
  async getPendingApprovals(userId: string): Promise<any[]> {
    return await prisma.changeApproval.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        // TODO: Add user role-based filtering
      },
      include: {
        changeRequest: true,
      },
      orderBy: {
        requestedAt: 'asc',
      },
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private determineApprovalLevel(riskLevel: ChangeRiskLevel, type: ChangeType): number {
    if (type === ChangeType.STANDARD) return 0; // No approval needed
    if (type === ChangeType.EMERGENCY) return 2; // Technical lead
    
    switch (riskLevel) {
      case ChangeRiskLevel.CRITICAL:
        return 3; // CTO approval
      case ChangeRiskLevel.HIGH:
        return 2; // Technical lead
      case ChangeRiskLevel.MEDIUM:
        return 1; // Engineer
      case ChangeRiskLevel.LOW:
        return 1; // Engineer
      default:
        return 1;
    }
  }

  private async createApprovalRequests(changeRequestId: string, approvalLevel: number): Promise<void> {
    const approvalLevels = [
      { level: 1, role: 'Engineer' },
      { level: 2, role: 'Technical Lead' },
      { level: 3, role: 'CTO' },
      { level: 4, role: 'Compliance Officer' },
    ];

    for (const level of approvalLevels) {
      if (level.level <= approvalLevel) {
        await prisma.changeApproval.create({
          data: {
            changeRequestId,
            approverLevel: level.level,
            approverRole: level.role,
            status: ApprovalStatus.PENDING,
          },
        });
      }
    }
  }

  private async createEmergencyApprovalRequests(changeRequestId: string): Promise<void> {
    // Emergency changes require immediate technical lead approval
    await prisma.changeApproval.create({
      data: {
        changeRequestId,
        approverLevel: 2,
        approverRole: 'Technical Lead (Emergency)',
        status: ApprovalStatus.PENDING,
      },
    });
  }

  private async createValidationTasks(changeRequestId: string): Promise<void> {
    const validationTypes = ['FUNCTIONAL', 'PERFORMANCE', 'SECURITY', 'COMPLIANCE'];

    for (const type of validationTypes) {
      await prisma.changeValidation.create({
        data: {
          changeRequestId,
          validationType: type,
          validationName: `${type} Validation`,
          validationSteps: 'Automated validation steps',
          status: 'PENDING',
        },
      });
    }
  }

  private async executeStep(step: any): Promise<any> {
    // TODO: Integrate with actual deployment system
    console.log(`Executing step: ${step.stepName}`);
    
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      output: `Step ${step.stepName} completed successfully`,
    };
  }

  private async executeRollbackCommand(command: string): Promise<void> {
    // TODO: Integrate with actual deployment system
    console.log(`Executing rollback command: ${command}`);
    
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async notifyChangeSubmitted(changeRequest: ChangeRequest): Promise<void> {
    // TODO: Implement notification
    console.log(`Change request submitted: ${changeRequest.id}`);
  }

  private async notifyEmergencyChange(changeRequest: ChangeRequest): Promise<void> {
    // TODO: Implement urgent notification
    console.log(`EMERGENCY change request: ${changeRequest.id}`);
  }

  private async notifyChangeApproved(changeRequest: ChangeRequest): Promise<void> {
    // TODO: Implement notification
    console.log(`Change request approved: ${changeRequest.id}`);
  }

  private async notifyChangeRejected(changeRequest: ChangeRequest, reason?: string): Promise<void> {
    // TODO: Implement notification
    console.log(`Change request rejected: ${changeRequest.id} - ${reason}`);
  }

  private async notifyImplementationStarted(changeRequest: ChangeRequest): Promise<void> {
    // TODO: Implement notification
    console.log(`Change implementation started: ${changeRequest.id}`);
  }

  private async notifyChangeCompleted(changeRequest: ChangeRequest): Promise<void> {
    // TODO: Implement notification
    console.log(`Change completed: ${changeRequest.id}`);
  }

  private async notifyChangeRolledBack(changeRequest: ChangeRequest, reason: string): Promise<void> {
    // TODO: Implement notification
    console.log(`Change rolled back: ${changeRequest.id} - ${reason}`);
  }

  private async getChangeCountByType(): Promise<any> {
    const counts = await prisma.changeRequest.groupBy({
      by: ['type'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.type] = curr._count;
      return acc;
    }, {} as any);
  }

  private async getChangeCountByRisk(): Promise<any> {
    const counts = await prisma.changeRequest.groupBy({
      by: ['riskLevel'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.riskLevel] = curr._count;
      return acc;
    }, {} as any);
  }

  private async calculateAverageApprovalTime(): Promise<number> {
    const approvedChanges = await prisma.changeRequest.findMany({
      where: {
        status: { in: [ChangeStatus.APPROVED, ChangeStatus.COMPLETED] },
      },
      select: {
        requestedAt: true,
        updatedAt: true,
      },
    });

    if (approvedChanges.length === 0) return 0;

    const totalTime = approvedChanges.reduce((sum, change) => {
      return sum + (change.updatedAt.getTime() - change.requestedAt.getTime());
    }, 0);

    // Return average in minutes
    return Math.round(totalTime / approvedChanges.length / (1000 * 60));
  }

  private async calculateAverageImplementationTime(): Promise<number> {
    const completedChanges = await prisma.changeRequest.findMany({
      where: {
        status: ChangeStatus.COMPLETED,
        actualStart: { not: null },
        actualEnd: { not: null },
      },
      select: {
        actualStart: true,
        actualEnd: true,
      },
    });

    if (completedChanges.length === 0) return 0;

    const totalTime = completedChanges.reduce((sum, change) => {
      return sum + (change.actualEnd!.getTime() - change.actualStart!.getTime());
    }, 0);

    // Return average in minutes
    return Math.round(totalTime / completedChanges.length / (1000 * 60));
  }
}

export default ChangeManagementService;