/**
 * HIPAA Compliance Gate Service
 * 
 * Blocks non-compliant actions and requires compliance review before proceeding.
 * Integrates with all repositories to enforce HIPAA compliance.
 */

import { PrismaClient, ComplianceGate, GateStatus, ComplianceOverride, OverrideStatus } from '@prisma/client';
import HIPAAComplianceService from './HIPAAComplianceService';

const prisma = new PrismaClient();

interface GateRequest {
  repository: string;
  action: string;
  actionDetails: any;
  rules?: string[];
  triggeredBy: string;
}

interface GateResult {
  gateId: string;
  status: GateStatus;
  blocked: boolean;
  requiresReview: boolean;
  violations: any[];
  canProceed: boolean;
  message: string;
}

interface OverrideRequest {
  gateId?: string;
  violationId?: string;
  requestedBy: string;
  requestedByName: string;
  justification: string;
  businessNeed: string;
  riskAssessment: string;
  mitigationPlan: string;
  expiresAt?: Date;
}

export class HIPAAComplianceGateService {
  private complianceService: HIPAAComplianceService;

  constructor() {
    this.complianceService = new HIPAAComplianceService();
  }

  /**
   * Check compliance gate
   */
  async checkGate(request: GateRequest): Promise<GateResult> {
    // Create gate record
    const gate = await prisma.complianceGate.create({
      data: {
        gateId: `gate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        repository: request.repository,
        action: request.action,
        actionDetails: request.actionDetails,
        rulesChecked: request.rules || [],
        status: GateStatus.CHECKING,
      },
    });

    try {
      // Perform compliance check
      const complianceCheck = await this.complianceService.checkCompliance({
        action: request.action,
        repository: request.repository,
        targetType: 'action',
        targetId: gate.gateId,
        targetDetails: request.actionDetails,
        rules: request.rules,
        triggeredBy: request.triggeredBy,
      });

      // Update gate with check results
      const updatedGate = await prisma.complianceGate.update({
        where: { id: gate.id },
        data: {
          status: complianceCheck.blocked ? GateStatus.BLOCKED :
                  complianceCheck.requiresReview ? GateStatus.REVIEW_REQUIRED :
                  complianceCheck.passed ? GateStatus.PASSED :
                  GateStatus.BLOCKED,
          checkResults: {
            passed: complianceCheck.passed,
            score: complianceCheck.score,
            violations: complianceCheck.violations.length,
            warnings: complianceCheck.warnings.length,
          },
          violations: complianceCheck.violations.map(v => v.id),
          riskScore: complianceCheck.score,
          blocked: complianceCheck.blocked,
          blockedAt: complianceCheck.blocked ? new Date() : null,
          blockReason: complianceCheck.blocked ? 
            `Action blocked due to ${complianceCheck.violations.length} HIPAA violation(s)` : null,
          reviewRequired: complianceCheck.requiresReview,
          reviewRequestedAt: complianceCheck.requiresReview ? new Date() : null,
        },
      });

      // Notify if blocked or requires review
      if (complianceCheck.blocked || complianceCheck.requiresReview) {
        await this.notifyComplianceIssue(updatedGate, complianceCheck);
      }

      return {
        gateId: gate.gateId,
        status: updatedGate.status,
        blocked: complianceCheck.blocked,
        requiresReview: complianceCheck.requiresReview,
        violations: complianceCheck.violations,
        canProceed: !complianceCheck.blocked && !complianceCheck.requiresReview,
        message: this.generateGateMessage(updatedGate, complianceCheck),
      };
    } catch (error: any) {
      // Mark gate as failed
      await prisma.complianceGate.update({
        where: { id: gate.id },
        data: {
          status: GateStatus.BLOCKED,
          blocked: true,
          blockReason: `Compliance check failed: ${error.message}`,
        },
      });

      throw error;
    }
  }

  /**
   * Request compliance review
   */
  async requestReview(gateId: string, reviewNotes?: string): Promise<void> {
    await prisma.complianceGate.update({
      where: { gateId },
      data: {
        reviewRequired: true,
        reviewRequestedAt: new Date(),
        reviewNotes,
      },
    });

    // Notify compliance team
    await this.notifyReviewRequested(gateId);
  }

  /**
   * Approve gate (after review)
   */
  async approveGate(gateId: string, reviewedBy: string, reviewNotes: string, conditions?: string[]): Promise<void> {
    await prisma.complianceGate.update({
      where: { gateId },
      data: {
        status: GateStatus.APPROVED,
        reviewedBy,
        reviewedAt: new Date(),
        reviewDecision: 'APPROVE',
        reviewNotes,
        resolved: true,
        resolvedAt: new Date(),
        resolution: conditions ? 
          `Approved with conditions: ${conditions.join(', ')}` :
          'Approved without conditions',
      },
    });

    // Notify requester
    await this.notifyGateApproved(gateId);
  }

  /**
   * Reject gate (after review)
   */
  async rejectGate(gateId: string, reviewedBy: string, reviewNotes: string): Promise<void> {
    await prisma.complianceGate.update({
      where: { gateId },
      data: {
        status: GateStatus.REJECTED,
        reviewedBy,
        reviewedAt: new Date(),
        reviewDecision: 'REJECT',
        reviewNotes,
        resolved: true,
        resolvedAt: new Date(),
        resolution: 'Rejected due to HIPAA compliance concerns',
      },
    });

    // Notify requester
    await this.notifyGateRejected(gateId);
  }

  /**
   * Request compliance override
   */
  async requestOverride(request: OverrideRequest): Promise<ComplianceOverride> {
    // Determine approval level based on risk
    const approvalLevel = await this.determineApprovalLevel(request);

    const override = await prisma.complianceOverride.create({
      data: {
        overrideType: 'COMPLIANCE_GATE',
        gateId: request.gateId,
        violationId: request.violationId,
        requestedBy: request.requestedBy,
        requestedByName: request.requestedByName,
        justification: request.justification,
        businessNeed: request.businessNeed,
        riskAssessment: request.riskAssessment,
        mitigationPlan: request.mitigationPlan,
        approvalLevel,
        requiredApprovers: this.getRequiredApprovers(approvalLevel),
        approvals: [],
        expiresAt: request.expiresAt,
        monitoringRequired: true,
        reviewFrequency: 'MONTHLY',
        auditTrail: [{
          timestamp: new Date(),
          action: 'OVERRIDE_REQUESTED',
          by: request.requestedBy,
        }],
      },
    });

    // Notify approvers
    await this.notifyOverrideRequested(override);

    return override;
  }

  /**
   * Approve override
   */
  async approveOverride(overrideId: string, approvedBy: string, approverRole: string, conditions?: string[]): Promise<void> {
    const override = await prisma.complianceOverride.findUnique({
      where: { id: overrideId },
    });

    if (!override) {
      throw new Error('Override not found');
    }

    // Add approval
    const approvals = (override.approvals as any[]) || [];
    approvals.push({
      role: approverRole,
      approvedBy,
      approvedAt: new Date(),
      conditions: conditions || [],
    });

    // Check if all required approvals received
    const allApproved = this.checkAllApproved(approvals, override.requiredApprovers);

    // Update override
    await prisma.complianceOverride.update({
      where: { id: overrideId },
      data: {
        approvals,
        allApproved,
        status: allApproved ? OverrideStatus.APPROVED : OverrideStatus.UNDER_REVIEW,
        approvedAt: allApproved ? new Date() : null,
        approvedBy: allApproved ? approvedBy : null,
        conditions: conditions || override.conditions,
        auditTrail: [
          ...(override.auditTrail as any[]),
          {
            timestamp: new Date(),
            action: 'APPROVAL_RECEIVED',
            by: approvedBy,
            role: approverRole,
          },
        ],
      },
    });

    // If all approved, update gate
    if (allApproved && override.gateId) {
      await prisma.complianceGate.update({
        where: { gateId: override.gateId },
        data: {
          status: GateStatus.OVERRIDE_APPROVED,
          overrideId,
          resolved: true,
          resolvedAt: new Date(),
          resolution: 'Approved via compliance override',
        },
      });

      // Notify requester
      await this.notifyOverrideApproved(overrideId);
    }
  }

  /**
   * Reject override
   */
  async rejectOverride(overrideId: string, rejectedBy: string, rejectionReason: string): Promise<void> {
    const override = await prisma.complianceOverride.findUnique({
      where: { id: overrideId },
    });

    if (!override) {
      throw new Error('Override not found');
    }

    await prisma.complianceOverride.update({
      where: { id: overrideId },
      data: {
        status: OverrideStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy,
        rejectionReason,
        auditTrail: [
          ...(override.auditTrail as any[]),
          {
            timestamp: new Date(),
            action: 'OVERRIDE_REJECTED',
            by: rejectedBy,
            reason: rejectionReason,
          },
        ],
      },
    });

    // Notify requester
    await this.notifyOverrideRejected(overrideId);
  }

  /**
   * Get gate status
   */
  async getGateStatus(gateId: string): Promise<ComplianceGate | null> {
    return await prisma.complianceGate.findUnique({
      where: { gateId },
    });
  }

  /**
   * Get pending reviews
   */
  async getPendingReviews(): Promise<ComplianceGate[]> {
    return await prisma.complianceGate.findMany({
      where: {
        status: GateStatus.REVIEW_REQUIRED,
        resolved: false,
      },
      orderBy: {
        reviewRequestedAt: 'asc',
      },
    });
  }

  /**
   * Get pending overrides
   */
  async getPendingOverrides(): Promise<ComplianceOverride[]> {
    return await prisma.complianceOverride.findMany({
      where: {
        status: {
          in: [OverrideStatus.PENDING, OverrideStatus.UNDER_REVIEW],
        },
      },
      orderBy: {
        requestedAt: 'asc',
      },
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateGateMessage(gate: ComplianceGate, check: any): string {
    if (gate.blocked) {
      return `Action blocked due to ${check.violations.length} HIPAA violation(s). Compliance review required.`;
    } else if (gate.reviewRequired) {
      return `Action requires compliance review due to ${check.violations.length} potential violation(s).`;
    } else if (check.warnings.length > 0) {
      return `Action passed with ${check.warnings.length} warning(s). Review recommendations.`;
    } else {
      return 'Action complies with HIPAA requirements. Proceed.';
    }
  }

  private async determineApprovalLevel(request: OverrideRequest): Promise<number> {
    // Determine approval level based on risk
    // Level 1: Team Lead
    // Level 2: Compliance Officer
    // Level 3: Compliance Officer + Legal
    // Level 4: Compliance Officer + Legal + CTO

    // For now, default to level 2 (Compliance Officer)
    return 2;
  }

  private getRequiredApprovers(level: number): string[] {
    const approvers: { [key: number]: string[] } = {
      1: ['TEAM_LEAD'],
      2: ['COMPLIANCE_OFFICER'],
      3: ['COMPLIANCE_OFFICER', 'LEGAL'],
      4: ['COMPLIANCE_OFFICER', 'LEGAL', 'CTO'],
    };

    return approvers[level] || ['COMPLIANCE_OFFICER'];
  }

  private checkAllApproved(approvals: any[], requiredApprovers: string[]): boolean {
    const approvedRoles = new Set(approvals.map(a => a.role));
    return requiredApprovers.every(role => approvedRoles.has(role));
  }

  private async notifyComplianceIssue(gate: ComplianceGate, check: any): Promise<void> {
    // TODO: Implement notification
    console.log(`Compliance issue detected for gate ${gate.gateId}`);
  }

  private async notifyReviewRequested(gateId: string): Promise<void> {
    // TODO: Implement notification
    console.log(`Compliance review requested for gate ${gateId}`);
  }

  private async notifyGateApproved(gateId: string): Promise<void> {
    // TODO: Implement notification
    console.log(`Gate ${gateId} approved`);
  }

  private async notifyGateRejected(gateId: string): Promise<void> {
    // TODO: Implement notification
    console.log(`Gate ${gateId} rejected`);
  }

  private async notifyOverrideRequested(override: ComplianceOverride): Promise<void> {
    // TODO: Implement notification
    console.log(`Override requested: ${override.id}`);
  }

  private async notifyOverrideApproved(overrideId: string): Promise<void> {
    // TODO: Implement notification
    console.log(`Override ${overrideId} approved`);
  }

  private async notifyOverrideRejected(overrideId: string): Promise<void> {
    // TODO: Implement notification
    console.log(`Override ${overrideId} rejected`);
  }
}

export default HIPAAComplianceGateService;