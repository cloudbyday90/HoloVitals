/**
 * HIPAA Incident Service
 * Separate system for tracking HIPAA violations and compliance incidents
 * 
 * CRITICAL: This is NOT part of the general error logging system
 * Every HIPAA incident is tracked individually with NO deduplication
 */

import { prisma } from '../prisma';
import crypto from 'crypto';

// ============================================================================
// HIPAA VIOLATION CATEGORIES
// ============================================================================

export enum HIPAAViolationCategory {
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PHI_DISCLOSURE = 'PHI_DISCLOSURE',
  INSUFFICIENT_ENCRYPTION = 'INSUFFICIENT_ENCRYPTION',
  MISSING_AUDIT_LOGS = 'MISSING_AUDIT_LOGS',
  INADEQUATE_ACCESS_CONTROLS = 'INADEQUATE_ACCESS_CONTROLS',
  BREACH_NOTIFICATION_FAILURE = 'BREACH_NOTIFICATION_FAILURE',
  BAA_VIOLATION = 'BAA_VIOLATION',
  MINIMUM_NECESSARY_VIOLATION = 'MINIMUM_NECESSARY_VIOLATION',
  PATIENT_RIGHTS_VIOLATION = 'PATIENT_RIGHTS_VIOLATION',
  SECURITY_RISK_ANALYSIS_FAILURE = 'SECURITY_RISK_ANALYSIS_FAILURE',
}

// ============================================================================
// HIPAA INCIDENT SEVERITY
// ============================================================================

export enum HIPAAIncidentSeverity {
  CRITICAL = 'CRITICAL', // Immediate threat, PHI exposed, requires OCR reporting
  HIGH = 'HIGH',         // Significant risk, potential PHI exposure
  MEDIUM = 'MEDIUM',     // Policy violation, no PHI exposure
  LOW = 'LOW',           // Minor compliance issue
}

// ============================================================================
// HIPAA INCIDENT STATUS
// ============================================================================

export enum HIPAAIncidentStatus {
  NEW = 'NEW',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
}

// ============================================================================
// HIPAA INCIDENT INTERFACE
// ============================================================================

export interface HIPAAIncident {
  id?: string;
  incidentNumber: string;
  timestamp: Date;
  severity: HIPAAIncidentSeverity;
  category: HIPAAViolationCategory;
  description: string;
  
  // PHI Information
  phiExposed: boolean;
  phiType?: string[];
  numberOfRecordsAffected?: number;
  patientIds?: string[];
  
  // Context
  userId?: string;
  userRole?: string;
  ipAddress?: string;
  endpoint?: string;
  action?: string;
  stackTrace?: string;
  
  // Investigation
  status: HIPAAIncidentStatus;
  assignedTo?: string;
  investigationNotes?: string;
  resolutionNotes?: string;
  
  // Compliance
  reportedToOCR: boolean;
  reportedDate?: Date;
  breachNotificationSent: boolean;
  breachNotificationDate?: Date;
  
  // Audit
  createdAt?: Date;
  updatedAt?: Date;
  closedAt?: Date;
}

// ============================================================================
// HIPAA INCIDENT SERVICE
// ============================================================================

export class HIPAAIncidentService {
  private static instance: HIPAAIncidentService;

  private constructor() {}

  public static getInstance(): HIPAAIncidentService {
    if (!HIPAAIncidentService.instance) {
      HIPAAIncidentService.instance = new HIPAAIncidentService();
    }
    return HIPAAIncidentService.instance;
  }

  /**
   * Generate unique incident number
   * Format: HIPAA-YYYY-NNNN
   */
  private async generateIncidentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `HIPAA-${year}-`;
    
    // Get the latest incident number for this year
    const latestIncident = await prisma.hipaaIncident.findFirst({
      where: {
        incidentNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        incidentNumber: 'desc',
      },
    });

    let nextNumber = 1;
    if (latestIncident) {
      const currentNumber = parseInt(latestIncident.incidentNumber.split('-')[2]);
      nextNumber = currentNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Create a new HIPAA incident
   * CRITICAL: Every incident is tracked separately, NO deduplication
   */
  public async createIncident(incident: Omit<HIPAAIncident, 'id' | 'incidentNumber' | 'createdAt' | 'updatedAt'>): Promise<HIPAAIncident> {
    const incidentNumber = await this.generateIncidentNumber();
    const timestamp = new Date();

    console.error('🚨 HIPAA INCIDENT DETECTED:', {
      incidentNumber,
      severity: incident.severity,
      category: incident.category,
      phiExposed: incident.phiExposed,
      description: incident.description,
    });

    // Create incident in database
    const createdIncident = await prisma.hipaaIncident.create({
      data: {
        incidentNumber,
        timestamp,
        severity: incident.severity,
        category: incident.category,
        description: incident.description,
        phiExposed: incident.phiExposed,
        phiType: incident.phiType ? JSON.stringify(incident.phiType) : null,
        numberOfRecordsAffected: incident.numberOfRecordsAffected,
        patientIds: incident.patientIds ? JSON.stringify(incident.patientIds) : null,
        userId: incident.userId,
        userRole: incident.userRole,
        ipAddress: incident.ipAddress,
        endpoint: incident.endpoint,
        action: incident.action,
        stackTrace: incident.stackTrace,
        status: incident.status || HIPAAIncidentStatus.NEW,
        assignedTo: incident.assignedTo,
        investigationNotes: incident.investigationNotes,
        resolutionNotes: incident.resolutionNotes,
        reportedToOCR: incident.reportedToOCR || false,
        reportedDate: incident.reportedDate,
        breachNotificationSent: incident.breachNotificationSent || false,
        breachNotificationDate: incident.breachNotificationDate,
      },
    });

    // Create audit log entry
    await this.createAuditLogEntry(createdIncident.id, 'INCIDENT_CREATED', null, {
      incidentNumber,
      severity: incident.severity,
      category: incident.category,
    });

    // Send immediate notifications
    await this.sendImmediateNotifications(createdIncident);

    return this.mapToIncident(createdIncident);
  }

  /**
   * Update incident
   */
  public async updateIncident(
    incidentId: string,
    updates: Partial<HIPAAIncident>,
    performedBy?: string,
    notes?: string
  ): Promise<HIPAAIncident> {
    // Get current state
    const currentIncident = await prisma.hipaaIncident.findUnique({
      where: { id: incidentId },
    });

    if (!currentIncident) {
      throw new Error(`HIPAA incident ${incidentId} not found`);
    }

    // Update incident
    const updatedIncident = await prisma.hipaaIncident.update({
      where: { id: incidentId },
      data: {
        ...updates,
        phiType: updates.phiType ? JSON.stringify(updates.phiType) : undefined,
        patientIds: updates.patientIds ? JSON.stringify(updates.patientIds) : undefined,
        updatedAt: new Date(),
      },
    });

    // Create audit log entry
    await this.createAuditLogEntry(
      incidentId,
      'INCIDENT_UPDATED',
      currentIncident,
      updatedIncident,
      performedBy,
      notes
    );

    return this.mapToIncident(updatedIncident);
  }

  /**
   * Get incident by ID
   */
  public async getIncident(incidentId: string): Promise<HIPAAIncident | null> {
    const incident = await prisma.hipaaIncident.findUnique({
      where: { id: incidentId },
    });

    return incident ? this.mapToIncident(incident) : null;
  }

  /**
   * Get incident by incident number
   */
  public async getIncidentByNumber(incidentNumber: string): Promise<HIPAAIncident | null> {
    const incident = await prisma.hipaaIncident.findUnique({
      where: { incidentNumber },
    });

    return incident ? this.mapToIncident(incident) : null;
  }

  /**
   * Get all incidents with filters
   */
  public async getIncidents(filters?: {
    status?: HIPAAIncidentStatus;
    severity?: HIPAAIncidentSeverity;
    category?: HIPAAViolationCategory;
    assignedTo?: string;
    phiExposed?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ incidents: HIPAAIncident[]; total: number }> {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.category) where.category = filters.category;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters?.phiExposed !== undefined) where.phiExposed = filters.phiExposed;
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [incidents, total] = await Promise.all([
      prisma.hipaaIncident.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
      }),
      prisma.hipaaIncident.count({ where }),
    ]);

    return {
      incidents: incidents.map(i => this.mapToIncident(i)),
      total,
    };
  }

  /**
   * Get incident statistics
   */
  public async getIncidentStats(timeRange?: number): Promise<{
    total: number;
    bySeverity: Record<HIPAAIncidentSeverity, number>;
    byCategory: Record<HIPAAViolationCategory, number>;
    byStatus: Record<HIPAAIncidentStatus, number>;
    phiExposedCount: number;
    totalRecordsAffected: number;
    averageResolutionTime: number;
  }> {
    const where: any = {};
    if (timeRange) {
      const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);
      where.timestamp = { gte: since };
    }

    const incidents = await prisma.hipaaIncident.findMany({ where });

    const stats = {
      total: incidents.length,
      bySeverity: {
        [HIPAAIncidentSeverity.CRITICAL]: 0,
        [HIPAAIncidentSeverity.HIGH]: 0,
        [HIPAAIncidentSeverity.MEDIUM]: 0,
        [HIPAAIncidentSeverity.LOW]: 0,
      },
      byCategory: {} as Record<HIPAAViolationCategory, number>,
      byStatus: {
        [HIPAAIncidentStatus.NEW]: 0,
        [HIPAAIncidentStatus.INVESTIGATING]: 0,
        [HIPAAIncidentStatus.RESOLVED]: 0,
        [HIPAAIncidentStatus.ESCALATED]: 0,
      },
      phiExposedCount: 0,
      totalRecordsAffected: 0,
      averageResolutionTime: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    incidents.forEach(incident => {
      // Count by severity
      stats.bySeverity[incident.severity as HIPAAIncidentSeverity]++;

      // Count by category
      const category = incident.category as HIPAAViolationCategory;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // Count by status
      stats.byStatus[incident.status as HIPAAIncidentStatus]++;

      // PHI exposure
      if (incident.phiExposed) {
        stats.phiExposedCount++;
        stats.totalRecordsAffected += incident.numberOfRecordsAffected || 0;
      }

      // Resolution time
      if (incident.status === HIPAAIncidentStatus.RESOLVED && incident.closedAt) {
        const resolutionTime = incident.closedAt.getTime() - incident.timestamp.getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    if (resolvedCount > 0) {
      stats.averageResolutionTime = totalResolutionTime / resolvedCount / (1000 * 60 * 60); // hours
    }

    return stats;
  }

  /**
   * Get incident audit log
   */
  public async getIncidentAuditLog(incidentId: string): Promise<any[]> {
    return await prisma.hipaaIncidentAuditLog.findMany({
      where: { incidentId },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Create audit log entry
   */
  private async createAuditLogEntry(
    incidentId: string,
    action: string,
    previousState: any,
    newState: any,
    performedBy?: string,
    notes?: string
  ): Promise<void> {
    await prisma.hipaaIncidentAuditLog.create({
      data: {
        incidentId,
        action,
        previousState: previousState ? JSON.stringify(previousState) : null,
        newState: JSON.stringify(newState),
        performedBy,
        notes,
      },
    });
  }

  /**
   * Send immediate notifications for critical incidents
   */
  private async sendImmediateNotifications(incident: any): Promise<void> {
    // Get compliance team members
    const complianceTeam = await prisma.hipaaComplianceTeam.findMany({
      where: { active: true },
    });

    // Determine who to notify based on severity
    let recipientsToNotify = complianceTeam;
    
    if (incident.severity === HIPAAIncidentSeverity.CRITICAL) {
      // Notify everyone for critical incidents
      recipientsToNotify = complianceTeam;
    } else if (incident.severity === HIPAAIncidentSeverity.HIGH) {
      // Notify officers for high severity
      recipientsToNotify = complianceTeam.filter(member => 
        member.role.includes('OFFICER')
      );
    }

    // Send notifications
    for (const member of recipientsToNotify) {
      try {
        // Log notification (actual sending would be done by notification service)
        await prisma.hipaaNotification.create({
          data: {
            incidentId: incident.id,
            notificationType: incident.severity === HIPAAIncidentSeverity.CRITICAL ? 'CRITICAL_ALERT' : 'INCIDENT_NOTIFICATION',
            recipientId: member.userId,
            recipientEmail: member.email,
          },
        });

        console.error(`📧 HIPAA notification sent to ${member.email} for incident ${incident.incidentNumber}`);
      } catch (error) {
        console.error(`Failed to send HIPAA notification to ${member.email}:`, error);
      }
    }
  }

  /**
   * Map database record to HIPAAIncident interface
   */
  private mapToIncident(record: any): HIPAAIncident {
    return {
      id: record.id,
      incidentNumber: record.incidentNumber,
      timestamp: record.timestamp,
      severity: record.severity as HIPAAIncidentSeverity,
      category: record.category as HIPAAViolationCategory,
      description: record.description,
      phiExposed: record.phiExposed,
      phiType: record.phiType ? JSON.parse(record.phiType) : undefined,
      numberOfRecordsAffected: record.numberOfRecordsAffected,
      patientIds: record.patientIds ? JSON.parse(record.patientIds) : undefined,
      userId: record.userId,
      userRole: record.userRole,
      ipAddress: record.ipAddress,
      endpoint: record.endpoint,
      action: record.action,
      stackTrace: record.stackTrace,
      status: record.status as HIPAAIncidentStatus,
      assignedTo: record.assignedTo,
      investigationNotes: record.investigationNotes,
      resolutionNotes: record.resolutionNotes,
      reportedToOCR: record.reportedToOCR,
      reportedDate: record.reportedDate,
      breachNotificationSent: record.breachNotificationSent,
      breachNotificationDate: record.breachNotificationDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      closedAt: record.closedAt,
    };
  }

  /**
   * CRITICAL: Check if error is HIPAA-related
   * This should be called BEFORE general error logging
   */
  public static isHIPAARelated(error: Error | any): boolean {
    const hipaaKeywords = [
      'hipaa',
      'phi',
      'protected health information',
      'unauthorized access',
      'patient data',
      'medical record',
      'breach',
      'encryption',
      'audit log',
      'baa',
      'business associate',
    ];

    const errorString = JSON.stringify({
      message: error.message,
      code: error.code,
      stack: error.stack,
    }).toLowerCase();

    return hipaaKeywords.some(keyword => errorString.includes(keyword));
  }
}

// Export singleton instance
export const hipaaIncidentService = HIPAAIncidentService.getInstance();