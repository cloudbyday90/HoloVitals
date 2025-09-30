/**
 * Incident Management Service
 * 
 * Manages incidents from detection to resolution, including escalation,
 * communication, and post-incident reviews.
 */

import { PrismaClient, Incident, IncidentSeverity, IncidentStatus } from '@prisma/client';
import EmergencyRecoveryService from './EmergencyRecoveryService';
import ChangeManagementService from './ChangeManagementService';
import AIErrorDiagnosisService from './AIErrorDiagnosisService';

const prisma = new PrismaClient();

interface IncidentData {
  severity: IncidentSeverity;
  title: string;
  description: string;
  affectedServices: string[];
  affectedUsers?: number;
  businessImpact?: string;
  detectedBy: string;
  detectionMethod: string;
  errorEvents?: string[];
}

interface StatusUpdate {
  status: IncidentStatus;
  message: string;
  updatedBy: string;
}

interface ResolutionData {
  resolvedBy: string;
  resolutionMethod: string;
  resolutionSummary: string;
  changeRequestId?: string;
  restorationId?: string;
}

export class IncidentManagementService {
  private recoveryService: EmergencyRecoveryService;
  private changeService: ChangeManagementService;
  private diagnosisService: AIErrorDiagnosisService;

  constructor() {
    this.recoveryService = new EmergencyRecoveryService();
    this.changeService = new ChangeManagementService();
    this.diagnosisService = new AIErrorDiagnosisService();
  }

  /**
   * Create and respond to incident
   */
  async createIncident(data: IncidentData): Promise<Incident> {
    const incident = await prisma.incident.create({
      data: {
        severity: data.severity,
        title: data.title,
        description: data.description,
        affectedServices: data.affectedServices,
        affectedUsers: data.affectedUsers,
        businessImpact: data.businessImpact,
        detectedBy: data.detectedBy,
        detectionMethod: data.detectionMethod,
        errorEvents: data.errorEvents || [],
        status: IncidentStatus.DETECTED,
      },
    });

    // Immediate notification based on severity
    await this.notifyIncidentDetected(incident);

    // Auto-acknowledge SEV1 incidents
    if (incident.severity === IncidentSeverity.SEV1) {
      await this.acknowledgeIncident(incident.id, 'SYSTEM');
    }

    return incident;
  }

  /**
   * Acknowledge incident
   */
  async acknowledgeIncident(incidentId: string, acknowledgedBy: string): Promise<Incident> {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    const timeToAcknowledge = Math.floor(
      (Date.now() - incident.detectedAt.getTime()) / (1000 * 60)
    );

    const updatedIncident = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: IncidentStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedBy,
        timeToAcknowledge,
      },
    });

    await this.notifyIncidentAcknowledged(updatedIncident);

    return updatedIncident;
  }

  /**
   * Start incident investigation
   */
  async startInvestigation(incidentId: string, respondedBy: string): Promise<any> {
    const incident = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: IncidentStatus.INVESTIGATING,
        respondedAt: new Date(),
        respondedBy,
        timeToRespond: Math.floor(
          (Date.now() - (await prisma.incident.findUnique({ where: { id: incidentId } }))!.detectedAt.getTime()) / (1000 * 60)
        ),
      },
    });

    // If error events are associated, get AI diagnosis
    if (incident.errorEvents.length > 0) {
      const diagnoses = await Promise.all(
        incident.errorEvents.map(errorId => 
          this.diagnosisService.getErrorDiagnosis(errorId)
        )
      );

      return {
        incident,
        diagnoses: diagnoses.filter(d => d !== null),
      };
    }

    return { incident };
  }

  /**
   * Identify root cause
   */
  async identifyRootCause(incidentId: string, rootCause: string): Promise<Incident> {
    const incident = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: IncidentStatus.IDENTIFIED,
      },
    });

    await this.addStatusUpdate(incidentId, {
      status: IncidentStatus.IDENTIFIED,
      message: `Root cause identified: ${rootCause}`,
      updatedBy: 'SYSTEM',
    });

    return incident;
  }

  /**
   * Resolve incident
   */
  async resolveIncident(incidentId: string, resolution: ResolutionData): Promise<Incident> {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    const timeToResolve = Math.floor(
      (Date.now() - incident.detectedAt.getTime()) / (1000 * 60)
    );

    const resolvedIncident = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: IncidentStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: resolution.resolvedBy,
        resolutionMethod: resolution.resolutionMethod,
        resolutionSummary: resolution.resolutionSummary,
        timeToResolve,
        totalDuration: timeToResolve,
        changeRequests: resolution.changeRequestId ? [resolution.changeRequestId] : [],
        restorations: resolution.restorationId ? [resolution.restorationId] : [],
      },
    });

    // Mark associated errors as resolved
    if (incident.errorEvents.length > 0) {
      await prisma.errorEvent.updateMany({
        where: { id: { in: incident.errorEvents } },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolutionMethod: resolution.resolutionMethod,
          incidentId,
        },
      });
    }

    await this.notifyIncidentResolved(resolvedIncident);

    // Determine if post-mortem is required
    const requiresPostMortem = this.requiresPostMortem(resolvedIncident);
    if (requiresPostMortem) {
      await prisma.incident.update({
        where: { id: incidentId },
        data: { postMortemRequired: true },
      });
    }

    return resolvedIncident;
  }

  /**
   * Close incident with post-mortem
   */
  async closeIncident(incidentId: string, postMortemUrl?: string, lessonsLearned?: string, actionItems?: any[]): Promise<Incident> {
    return await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: IncidentStatus.CLOSED,
        closedAt: new Date(),
        postMortemCompleted: !!postMortemUrl,
        postMortemUrl,
        lessonsLearned,
        actionItems,
      },
    });
  }

  /**
   * Add status update
   */
  async addStatusUpdate(incidentId: string, update: StatusUpdate): Promise<void> {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    const statusUpdates = (incident.statusUpdates as any[]) || [];
    statusUpdates.push({
      timestamp: new Date(),
      status: update.status,
      message: update.message,
      updatedBy: update.updatedBy,
    });

    await prisma.incident.update({
      where: { id: incidentId },
      data: {
        statusUpdates,
        status: update.status,
      },
    });
  }

  /**
   * Escalate incident
   */
  async escalateIncident(incidentId: string, escalatedBy: string, reason: string): Promise<void> {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    // Upgrade severity if not already SEV1
    let newSeverity = incident.severity;
    if (incident.severity !== IncidentSeverity.SEV1) {
      const severityLevels = [IncidentSeverity.SEV4, IncidentSeverity.SEV3, IncidentSeverity.SEV2, IncidentSeverity.SEV1];
      const currentIndex = severityLevels.indexOf(incident.severity);
      newSeverity = severityLevels[Math.max(0, currentIndex - 1)];
    }

    await prisma.incident.update({
      where: { id: incidentId },
      data: {
        severity: newSeverity,
      },
    });

    await this.addStatusUpdate(incidentId, {
      status: incident.status,
      message: `Incident escalated: ${reason}`,
      updatedBy: escalatedBy,
    });

    await this.notifyIncidentEscalated(incident, reason);
  }

  /**
   * Automated incident response
   */
  async automatedIncidentResponse(incidentId: string): Promise<any> {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    const actions = [];

    // 1. Get AI diagnosis if error events exist
    if (incident.errorEvents.length > 0) {
      const diagnoses = await Promise.all(
        incident.errorEvents.map(errorId => 
          this.diagnosisService.getErrorDiagnosis(errorId)
        )
      );
      actions.push({ action: 'AI_DIAGNOSIS', result: diagnoses });
    }

    // 2. For SEV1, attempt automated recovery
    if (incident.severity === IncidentSeverity.SEV1) {
      try {
        const rollback = await this.recoveryService.emergencyRollback(
          'SYSTEM',
          `Automated response to incident ${incidentId}`
        );
        actions.push({ action: 'EMERGENCY_ROLLBACK', result: rollback });

        // If rollback successful, resolve incident
        if (rollback.success) {
          await this.resolveIncident(incidentId, {
            resolvedBy: 'SYSTEM',
            resolutionMethod: 'AUTOMATED_ROLLBACK',
            resolutionSummary: 'System automatically rolled back to last known good state',
            restorationId: rollback.restoration.id,
          });
        }
      } catch (error: any) {
        actions.push({ action: 'EMERGENCY_ROLLBACK', error: error.message });
      }
    }

    // 3. Create emergency change request if needed
    if (incident.severity === IncidentSeverity.SEV1 || incident.severity === IncidentSeverity.SEV2) {
      const changeRequest = await this.changeService.submitEmergencyChange({
        title: `Emergency fix for: ${incident.title}`,
        description: incident.description,
        justification: `Critical incident requiring immediate resolution`,
        affectedServices: incident.affectedServices,
        implementationPlan: 'To be determined based on diagnosis',
        rollbackPlan: 'Restore from snapshot',
        requestedBy: 'SYSTEM',
        requestedByName: 'Automated Incident Response',
        requestedByEmail: 'system@holovitals.com',
        incidentId,
      });
      actions.push({ action: 'EMERGENCY_CHANGE_REQUEST', result: changeRequest });
    }

    return {
      incident,
      automatedActions: actions,
    };
  }

  /**
   * Get incident statistics
   */
  async getIncidentStatistics(): Promise<any> {
    const [
      totalIncidents,
      activeIncidents,
      sev1Incidents,
      incidentsBySeverity,
      incidentsByStatus,
      averageTimeToAcknowledge,
      averageTimeToResolve,
      mttr,
    ] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({
        where: {
          status: {
            in: [IncidentStatus.DETECTED, IncidentStatus.ACKNOWLEDGED, IncidentStatus.INVESTIGATING, IncidentStatus.IDENTIFIED, IncidentStatus.RESOLVING],
          },
        },
      }),
      prisma.incident.count({ where: { severity: IncidentSeverity.SEV1 } }),
      this.getIncidentCountBySeverity(),
      this.getIncidentCountByStatus(),
      this.calculateAverageTimeToAcknowledge(),
      this.calculateAverageTimeToResolve(),
      this.calculateMTTR(),
    ]);

    return {
      total: totalIncidents,
      active: activeIncidents,
      sev1: sev1Incidents,
      bySeverity: incidentsBySeverity,
      byStatus: incidentsByStatus,
      averageTimeToAcknowledge,
      averageTimeToResolve,
      mttr,
    };
  }

  /**
   * Get active incidents
   */
  async getActiveIncidents(): Promise<Incident[]> {
    return await prisma.incident.findMany({
      where: {
        status: {
          in: [IncidentStatus.DETECTED, IncidentStatus.ACKNOWLEDGED, IncidentStatus.INVESTIGATING, IncidentStatus.IDENTIFIED, IncidentStatus.RESOLVING],
        },
      },
      orderBy: [
        { severity: 'asc' },
        { detectedAt: 'asc' },
      ],
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private requiresPostMortem(incident: Incident): boolean {
    // Post-mortem required for:
    // - All SEV1 incidents
    // - SEV2 incidents lasting > 1 hour
    // - Any incident affecting > 100 users
    
    if (incident.severity === IncidentSeverity.SEV1) return true;
    
    if (incident.severity === IncidentSeverity.SEV2 && incident.timeToResolve && incident.timeToResolve > 60) {
      return true;
    }
    
    if (incident.affectedUsers && incident.affectedUsers > 100) return true;
    
    return false;
  }

  private async notifyIncidentDetected(incident: Incident): Promise<void> {
    // TODO: Implement notification
    console.log(`Incident detected: ${incident.id} - ${incident.title}`);
  }

  private async notifyIncidentAcknowledged(incident: Incident): Promise<void> {
    // TODO: Implement notification
    console.log(`Incident acknowledged: ${incident.id}`);
  }

  private async notifyIncidentResolved(incident: Incident): Promise<void> {
    // TODO: Implement notification
    console.log(`Incident resolved: ${incident.id}`);
  }

  private async notifyIncidentEscalated(incident: Incident, reason: string): Promise<void> {
    // TODO: Implement notification
    console.log(`Incident escalated: ${incident.id} - ${reason}`);
  }

  private async getIncidentCountBySeverity(): Promise<any> {
    const counts = await prisma.incident.groupBy({
      by: ['severity'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.severity] = curr._count;
      return acc;
    }, {} as any);
  }

  private async getIncidentCountByStatus(): Promise<any> {
    const counts = await prisma.incident.groupBy({
      by: ['status'],
      _count: true,
    });
    return counts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as any);
  }

  private async calculateAverageTimeToAcknowledge(): Promise<number> {
    const incidents = await prisma.incident.findMany({
      where: {
        timeToAcknowledge: { not: null },
      },
    });

    if (incidents.length === 0) return 0;

    const totalTime = incidents.reduce((sum, incident) => sum + (incident.timeToAcknowledge || 0), 0);
    return Math.round(totalTime / incidents.length);
  }

  private async calculateAverageTimeToResolve(): Promise<number> {
    const incidents = await prisma.incident.findMany({
      where: {
        timeToResolve: { not: null },
      },
    });

    if (incidents.length === 0) return 0;

    const totalTime = incidents.reduce((sum, incident) => sum + (incident.timeToResolve || 0), 0);
    return Math.round(totalTime / incidents.length);
  }

  private async calculateMTTR(): Promise<number> {
    // Mean Time To Recovery - average time to resolve incidents
    return await this.calculateAverageTimeToResolve();
  }
}

export default IncidentManagementService;