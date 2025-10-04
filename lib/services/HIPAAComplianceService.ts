/**
 * HIPAA Compliance Service
 * 
 * This service provides comprehensive HIPAA compliance features including:
 * - Audit logging for all PHI access
 * - Access control and authorization
 * - Data encryption and protection
 * - Breach detection and notification
 * - Compliance monitoring and reporting
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AuditLogEntry {
  eventType: string;
  eventCategory: string;
  userId?: string;
  userRole?: string;
  userName?: string;
  userEmail?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  actionDetails?: any;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL_SUCCESS' | 'DENIED' | 'ERROR';
  outcomeReason?: string;
  errorMessage?: string;
  phiAccessed?: boolean;
  customerId?: string;
  accessReason?: string;
  dataAccessed?: string[];
  requestId?: string;
  requestMethod?: string;
  requestPath?: string;
  requestBody?: any;
  responseCode?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  securityFlags?: string[];
  metadata?: any;
  tags?: string[];
}

export interface AccessControlCheck {
  userId: string;
  resourceType: string;
  resourceId: string;
  action: string;
  context?: {
    customerId?: string;
    departmentId?: string;
    organizationId?: string;
    emergency?: boolean;
    reason?: string;
  };
}

export interface AccessControlResult {
  granted: boolean;
  reason?: string;
  conditions?: string[];
  auditLogId?: string;
}

export interface EncryptionOptions {
  algorithm?: string;
  keyId?: string;
  encoding?: BufferEncoding;
}

export interface BreachNotification {
  incidentNumber: string;
  breachType: string;
  description: string;
  causeOfBreach: string;
  affectedRecords: number;
  affectedIndividuals: number;
  dataTypes: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskAssessment: string;
  affectedCustomerIds: string[];
  affectedUserIds: string[];
}

export interface ComplianceCheckResult {
  compliant: boolean;
  issues: ComplianceIssue[];
  score: number;
  recommendations: string[];
}

export interface ComplianceIssue {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  description: string;
  recommendation: string;
  affectedResources?: string[];
}

// ============================================================================
// HIPAA COMPLIANCE SERVICE
// ============================================================================

export class HIPAAComplianceService {
  private static instance: HIPAAComplianceService;
  private encryptionKey: string;
  private retentionPeriodDays: number = 2555; // 7 years (HIPAA requirement)

  private constructor() {
    // Initialize encryption key from environment or generate
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
  }

  public static getInstance(): HIPAAComplianceService {
    if (!HIPAAComplianceService.instance) {
      HIPAAComplianceService.instance = new HIPAAComplianceService();
    }
    return HIPAAComplianceService.instance;
  }

  // ==========================================================================
  // AUDIT LOGGING
  // ==========================================================================

  /**
   * Create an audit log entry
   */
  async createAuditLog(entry: AuditLogEntry): Promise<string> {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() + this.retentionPeriodDays);

      const auditLog = await prisma.auditLog.create({
        data: {
          eventType: entry.eventType as any,
          eventCategory: entry.eventCategory as any,
          userId: entry.userId,
          userRole: entry.userRole,
          userName: entry.userName,
          userEmail: entry.userEmail,
          sessionId: entry.sessionId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          action: entry.action,
          actionDetails: entry.actionDetails,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          resourceName: entry.resourceName,
          outcome: entry.outcome as any,
          outcomeReason: entry.outcomeReason,
          errorMessage: entry.errorMessage,
          phiAccessed: entry.phiAccessed || false,
          customerId: entry.customerId,
          accessReason: entry.accessReason,
          dataAccessed: entry.dataAccessed,
          requestId: entry.requestId,
          requestMethod: entry.requestMethod,
          requestPath: entry.requestPath,
          requestBody: entry.requestBody,
          responseCode: entry.responseCode,
          riskLevel: (entry.riskLevel as any) || 'LOW',
          securityFlags: entry.securityFlags,
          metadata: entry.metadata,
          tags: entry.tags || [],
          retentionDate,
        },
      });

      return auditLog.id;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw new Error('Audit logging failed');
    }
  }

  /**
   * Log PHI access
   */
  async logPHIAccess(params: {
    userId: string;
    userRole: string;
    customerId: string;
    dataAccessed: string[];
    accessReason: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string> {
    return this.createAuditLog({
      eventType: 'PHI_VIEWED',
      eventCategory: 'DATA_ACCESS',
      userId: params.userId,
      userRole: params.userRole,
      action: 'VIEW_PHI',
      outcome: 'SUCCESS',
      phiAccessed: true,
      customerId: params.customerId,
      accessReason: params.accessReason,
      dataAccessed: params.dataAccessed,
      sessionId: params.sessionId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      resourceType: 'PATIENT_RECORD',
      resourceId: params.customerId,
      riskLevel: 'MEDIUM',
    });
  }

  /**
   * Log authentication event
   */
  async logAuthentication(params: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT';
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    reason?: string;
  }): Promise<string> {
    return this.createAuditLog({
      eventType: params.eventType,
      eventCategory: 'AUTHENTICATION',
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      action: params.eventType,
      outcome: params.eventType === 'LOGIN_FAILURE' ? 'FAILURE' : 'SUCCESS',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      sessionId: params.sessionId,
      outcomeReason: params.reason,
      riskLevel: params.eventType === 'LOGIN_FAILURE' ? 'MEDIUM' : 'LOW',
    });
  }

  /**
   * Log authorization event
   */
  async logAuthorization(params: {
    userId: string;
    userRole: string;
    action: string;
    resourceType: string;
    resourceId: string;
    granted: boolean;
    reason?: string;
    sessionId?: string;
  }): Promise<string> {
    return this.createAuditLog({
      eventType: params.granted ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
      eventCategory: 'AUTHORIZATION',
      userId: params.userId,
      userRole: params.userRole,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      outcome: params.granted ? 'SUCCESS' : 'DENIED',
      outcomeReason: params.reason,
      sessionId: params.sessionId,
      riskLevel: params.granted ? 'LOW' : 'MEDIUM',
    });
  }

  /**
   * Query audit logs
   */
  async queryAuditLogs(filters: {
    userId?: string;
    customerId?: string;
    eventType?: string;
    eventCategory?: string;
    startDate?: Date;
    endDate?: Date;
    outcome?: string;
    riskLevel?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.eventCategory) where.eventCategory = filters.eventCategory;
    if (filters.outcome) where.outcome = filters.outcome;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  // ==========================================================================
  // ACCESS CONTROL
  // ==========================================================================

  /**
   * Check if user has access to a resource
   */
  async checkAccess(check: AccessControlCheck): Promise<AccessControlResult> {
    try {
      // Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: {
          userId: check.userId,
          active: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (userRoles.length === 0) {
        await this.logAuthorization({
          userId: check.userId,
          userRole: 'NONE',
          action: check.action,
          resourceType: check.resourceType,
          resourceId: check.resourceId,
          granted: false,
          reason: 'No active roles',
        });

        return {
          granted: false,
          reason: 'User has no active roles',
        };
      }

      // Check permissions
      let hasPermission = false;
      let permissionScope: string | null = null;

      for (const userRole of userRoles) {
        for (const rolePermission of userRole.role.permissions) {
          const permission = rolePermission.permission;

          if (
            permission.resource === check.resourceType &&
            permission.action === check.action
          ) {
            hasPermission = true;
            permissionScope = permission.scope;
            break;
          }
        }
        if (hasPermission) break;
      }

      if (!hasPermission) {
        await this.logAuthorization({
          userId: check.userId,
          userRole: userRoles[0].role.name,
          action: check.action,
          resourceType: check.resourceType,
          resourceId: check.resourceId,
          granted: false,
          reason: 'Insufficient permissions',
        });

        return {
          granted: false,
          reason: 'User does not have required permission',
        };
      }

      // Check scope-based access
      if (permissionScope === 'OWN' && check.userId !== check.resourceId) {
        await this.logAuthorization({
          userId: check.userId,
          userRole: userRoles[0].role.name,
          action: check.action,
          resourceType: check.resourceType,
          resourceId: check.resourceId,
          granted: false,
          reason: 'Scope restriction: OWN only',
        });

        return {
          granted: false,
          reason: 'User can only access their own resources',
        };
      }

      // Log successful authorization
      const auditLogId = await this.logAuthorization({
        userId: check.userId,
        userRole: userRoles[0].role.name,
        action: check.action,
        resourceType: check.resourceType,
        resourceId: check.resourceId,
        granted: true,
      });

      return {
        granted: true,
        auditLogId,
      };
    } catch (error) {
      console.error('Access check failed:', error);
      return {
        granted: false,
        reason: 'Access check failed due to system error',
      };
    }
  }

  /**
   * Request emergency access
   */
  async requestEmergencyAccess(params: {
    userId: string;
    userName: string;
    userRole: string;
    resourceType: string;
    resourceId: string;
    reason: string;
    customerId?: string;
  }): Promise<string> {
    const accessRequest = await prisma.accessRequest.create({
      data: {
        requesterId: params.userId,
        requesterName: params.userName,
        requesterRole: params.userRole,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        accessType: 'emergency',
        reason: params.reason,
        urgency: 'EMERGENCY',
        isEmergency: true,
        emergencyReason: params.reason,
        status: 'APPROVED', // Auto-approve emergency access
        approvedAt: new Date(),
        approvedBy: 'SYSTEM',
        accessStartTime: new Date(),
        accessEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Log emergency access
    await this.createAuditLog({
      eventType: 'EMERGENCY_ACCESS',
      eventCategory: 'AUTHORIZATION',
      userId: params.userId,
      userRole: params.userRole,
      userName: params.userName,
      action: 'EMERGENCY_ACCESS_GRANTED',
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      outcome: 'SUCCESS',
      customerId: params.customerId,
      accessReason: params.reason,
      riskLevel: 'HIGH',
      metadata: {
        accessRequestId: accessRequest.id,
      },
    });

    return accessRequest.id;
  }

  // ==========================================================================
  // DATA ENCRYPTION
  // ==========================================================================

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string, options?: EncryptionOptions): string {
    const algorithm = options?.algorithm || 'aes-256-gcm';
    const key = Buffer.from(this.encryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = (cipher as any).getAuthTag();
    
    // Return IV + AuthTag + Encrypted Data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string, options?: EncryptionOptions): string {
    const algorithm = options?.algorithm || 'aes-256-gcm';
    const key = Buffer.from(this.encryptionKey, 'hex');
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    (decipher as any).setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // ==========================================================================
  // BREACH DETECTION AND NOTIFICATION
  // ==========================================================================

  /**
   * Detect potential breach
   */
  async detectBreach(params: {
    userId?: string;
    customerId?: string;
    eventType: string;
    indicators: any;
  }): Promise<boolean> {
    // Analyze indicators for breach patterns
    const riskScore = this.calculateRiskScore(params.indicators);

    if (riskScore >= 70) {
      // Create security alert
      await prisma.securityAlert.create({
        data: {
          alertType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          severity: riskScore >= 90 ? 'CRITICAL' : 'HIGH',
          title: 'Potential Data Breach Detected',
          description: `Suspicious activity detected: ${params.eventType}`,
          source: 'breach_detection',
          userId: params.userId,
          resourceType: 'PATIENT_RECORD',
          resourceId: params.customerId,
          indicators: params.indicators,
          status: 'NEW',
        },
      });

      return true;
    }

    return false;
  }

  /**
   * Report breach incident
   */
  async reportBreach(notification: BreachNotification): Promise<string> {
    const incident = await prisma.breachIncident.create({
      data: {
        incidentNumber: notification.incidentNumber,
        discoveredAt: new Date(),
        breachType: notification.breachType as any,
        description: notification.description,
        causeOfBreach: notification.causeOfBreach,
        affectedRecords: notification.affectedRecords,
        affectedIndividuals: notification.affectedIndividuals,
        dataTypes: notification.dataTypes,
        riskLevel: notification.riskLevel as any,
        riskAssessment: notification.riskAssessment,
        affectedCustomerIds: notification.affectedCustomerIds,
        affectedUserIds: notification.affectedUserIds,
        notificationStatus: 'PENDING',
        investigationStatus: 'ONGOING',
        createdBy: 'SYSTEM',
      },
    });

    // Log breach notification
    await this.createAuditLog({
      eventType: 'BREACH_NOTIFICATION',
      eventCategory: 'COMPLIANCE',
      action: 'BREACH_REPORTED',
      outcome: 'SUCCESS',
      resourceType: 'BREACH_INCIDENT',
      resourceId: incident.id,
      riskLevel: notification.riskLevel,
      metadata: {
        incidentNumber: notification.incidentNumber,
        affectedIndividuals: notification.affectedIndividuals,
      },
    });

    return incident.id;
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(indicators: any): number {
    let score = 0;

    // Failed login attempts
    if (indicators.failedLoginAttempts > 5) score += 30;
    else if (indicators.failedLoginAttempts > 3) score += 20;

    // Unusual access patterns
    if (indicators.unusualAccessTime) score += 20;
    if (indicators.unusualLocation) score += 25;
    if (indicators.unusualDataVolume) score += 30;

    // Suspicious activities
    if (indicators.multiplePatientAccess) score += 25;
    if (indicators.rapidDataAccess) score += 20;
    if (indicators.unauthorizedExport) score += 40;

    return Math.min(score, 100);
  }

  // ==========================================================================
  // COMPLIANCE MONITORING
  // ==========================================================================

  /**
   * Run compliance check
   */
  async runComplianceCheck(): Promise<ComplianceCheckResult> {
    const issues: ComplianceIssue[] = [];
    let score = 100;

    // Check audit logging coverage
    const recentLogs = await prisma.auditLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentLogs === 0) {
      issues.push({
        severity: 'HIGH',
        category: 'AUDIT_LOGGING',
        description: 'No audit logs found in the last 24 hours',
        recommendation: 'Verify audit logging is functioning correctly',
      });
      score -= 20;
    }

    // Check for expired sessions
    const expiredSessions = await prisma.userSession.count({
      where: {
        active: true,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (expiredSessions > 0) {
      issues.push({
        severity: 'MEDIUM',
        category: 'SESSION_MANAGEMENT',
        description: `${expiredSessions} expired sessions still marked as active`,
        recommendation: 'Clean up expired sessions',
      });
      score -= 10;
    }

    // Check for unresolved security alerts
    const unresolvedAlerts = await prisma.securityAlert.count({
      where: {
        status: {
          in: ['NEW', 'ACKNOWLEDGED'],
        },
        severity: {
          in: ['HIGH', 'CRITICAL'],
        },
      },
    });

    if (unresolvedAlerts > 0) {
      issues.push({
        severity: 'HIGH',
        category: 'SECURITY_MONITORING',
        description: `${unresolvedAlerts} unresolved high/critical security alerts`,
        recommendation: 'Review and resolve security alerts promptly',
      });
      score -= 15;
    }

    // Check for pending breach notifications
    const pendingBreaches = await prisma.breachIncident.count({
      where: {
        notificationStatus: 'PENDING',
        discoveredAt: {
          lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days
        },
      },
    });

    if (pendingBreaches > 0) {
      issues.push({
        severity: 'CRITICAL',
        category: 'BREACH_NOTIFICATION',
        description: `${pendingBreaches} breach incidents exceed 60-day notification deadline`,
        recommendation: 'Complete breach notifications immediately',
      });
      score -= 30;
    }

    const recommendations: string[] = [];
    if (score < 80) {
      recommendations.push('Address high and critical issues immediately');
    }
    if (issues.length > 0) {
      recommendations.push('Review and resolve all compliance issues');
    }
    recommendations.push('Conduct regular compliance audits');
    recommendations.push('Maintain comprehensive documentation');

    return {
      compliant: score >= 80,
      issues,
      score: Math.max(score, 0),
      recommendations,
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(params: {
    reportType: string;
    startDate: Date;
    endDate: Date;
    generatedBy: string;
  }): Promise<string> {
    const complianceCheck = await this.runComplianceCheck();

    // Gather statistics
    const stats = await this.gatherComplianceStatistics(params.startDate, params.endDate);

    const report = await prisma.complianceReport.create({
      data: {
        reportType: params.reportType as any,
        reportPeriodStart: params.startDate,
        reportPeriodEnd: params.endDate,
        summary: {
          totalAuditLogs: stats.totalAuditLogs,
          phiAccessCount: stats.phiAccessCount,
          securityAlerts: stats.securityAlerts,
          breachIncidents: stats.breachIncidents,
          complianceScore: complianceCheck.score,
        },
        findings: {
          issues: complianceCheck.issues,
          statistics: stats,
        },
        recommendations: complianceCheck.recommendations,
        overallStatus: complianceCheck.compliant ? 'COMPLIANT' : 'NON_COMPLIANT',
        score: complianceCheck.score,
        generatedBy: params.generatedBy,
      },
    });

    return report.id;
  }

  /**
   * Gather compliance statistics
   */
  private async gatherComplianceStatistics(startDate: Date, endDate: Date) {
    const [
      totalAuditLogs,
      phiAccessCount,
      securityAlerts,
      breachIncidents,
      failedLogins,
      emergencyAccess,
    ] = await Promise.all([
      prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
      prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          phiAccessed: true,
        },
      }),
      prisma.securityAlert.count({
        where: {
          detectedAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.breachIncident.count({
        where: {
          discoveredAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          eventType: 'LOGIN_FAILURE',
        },
      }),
      prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          eventType: 'EMERGENCY_ACCESS',
        },
      }),
    ]);

    return {
      totalAuditLogs,
      phiAccessCount,
      securityAlerts,
      breachIncidents,
      failedLogins,
      emergencyAccess,
    };
  }
}

// Export singleton instance
export const hipaaCompliance = HIPAAComplianceService.getInstance();