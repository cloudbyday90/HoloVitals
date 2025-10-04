/**
 * Audit Logging Service
 * 
 * Provides comprehensive audit logging capabilities for HIPAA compliance.
 * Tracks all access to PHI and system activities.
 */

import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AuditContext {
  userId?: string;
  userRole?: string;
  userName?: string;
  userEmail?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  location?: string;
}

export interface AuditLogOptions {
  context: AuditContext;
  eventType: string;
  eventCategory: string;
  action: string;
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
  requestDetails?: {
    requestId?: string;
    method?: string;
    path?: string;
    body?: any;
    responseCode?: number;
  };
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  securityFlags?: string[];
  metadata?: any;
  tags?: string[];
}

// ============================================================================
// AUDIT LOGGING SERVICE
// ============================================================================

export class AuditLoggingService {
  private static instance: AuditLoggingService;
  private retentionPeriodDays: number = 2555; // 7 years

  private constructor() {}

  public static getInstance(): AuditLoggingService {
    if (!AuditLoggingService.instance) {
      AuditLoggingService.instance = new AuditLoggingService();
    }
    return AuditLoggingService.instance;
  }

  /**
   * Create audit log entry
   */
  async log(options: AuditLogOptions): Promise<string> {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() + this.retentionPeriodDays);

      const auditLog = await prisma.auditLog.create({
        data: {
          eventType: options.eventType as any,
          eventCategory: options.eventCategory as any,
          userId: options.context.userId,
          userRole: options.context.userRole,
          userName: options.context.userName,
          userEmail: options.context.userEmail,
          sessionId: options.context.sessionId,
          ipAddress: options.context.ipAddress,
          userAgent: options.context.userAgent,
          deviceId: options.context.deviceId,
          location: options.context.location,
          action: options.action,
          actionDetails: options.metadata,
          resourceType: options.resourceType,
          resourceId: options.resourceId,
          resourceName: options.resourceName,
          outcome: options.outcome as any,
          outcomeReason: options.outcomeReason,
          errorMessage: options.errorMessage,
          phiAccessed: options.phiAccessed || false,
          customerId: options.customerId,
          accessReason: options.accessReason,
          dataAccessed: options.dataAccessed,
          requestId: options.requestDetails?.requestId,
          requestMethod: options.requestDetails?.method,
          requestPath: options.requestDetails?.path,
          requestBody: options.requestDetails?.body,
          responseCode: options.requestDetails?.responseCode,
          riskLevel: (options.riskLevel as any) || 'LOW',
          securityFlags: options.securityFlags,
          metadata: options.metadata,
          tags: options.tags || [],
          retentionDate,
        },
      });

      return auditLog.id;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break application flow
      return '';
    }
  }

  /**
   * Extract audit context from Express request
   */
  extractContext(req: Request, additionalContext?: Partial<AuditContext>): AuditContext {
    return {
      userId: (req as any).user?.id,
      userRole: (req as any).user?.role,
      userName: (req as any).user?.name,
      userEmail: (req as any).user?.email,
      sessionId: (req as any).sessionId,
      ipAddress: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'] as string,
      location: req.headers['x-user-location'] as string,
      ...additionalContext,
    };
  }

  /**
   * Get client IP address
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    context: AuditContext,
    eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET',
    details?: {
      reason?: string;
      mfaUsed?: boolean;
      sessionId?: string;
    }
  ): Promise<string> {
    return this.log({
      context,
      eventType,
      eventCategory: 'AUTHENTICATION',
      action: eventType,
      outcome: eventType.includes('FAILURE') ? 'FAILURE' : 'SUCCESS',
      outcomeReason: details?.reason,
      riskLevel: eventType.includes('FAILURE') ? 'MEDIUM' : 'LOW',
      metadata: {
        mfaUsed: details?.mfaUsed,
      },
      tags: ['authentication'],
    });
  }

  /**
   * Log authorization event
   */
  async logAuthorization(
    context: AuditContext,
    granted: boolean,
    details: {
      action: string;
      resourceType: string;
      resourceId: string;
      reason?: string;
    }
  ): Promise<string> {
    return this.log({
      context,
      eventType: granted ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
      eventCategory: 'AUTHORIZATION',
      action: details.action,
      resourceType: details.resourceType,
      resourceId: details.resourceId,
      outcome: granted ? 'SUCCESS' : 'DENIED',
      outcomeReason: details.reason,
      riskLevel: granted ? 'LOW' : 'MEDIUM',
      tags: ['authorization'],
    });
  }

  /**
   * Log PHI access
   */
  async logPHIAccess(
    context: AuditContext,
    details: {
      customerId: string;
      dataAccessed: string[];
      accessReason: string;
      action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'PRINT';
    }
  ): Promise<string> {
    const eventTypeMap = {
      VIEW: 'PHI_VIEWED',
      CREATE: 'PHI_CREATED',
      UPDATE: 'PHI_UPDATED',
      DELETE: 'PHI_DELETED',
      EXPORT: 'PHI_EXPORTED',
      PRINT: 'PHI_PRINTED',
    };

    return this.log({
      context,
      eventType: eventTypeMap[details.action],
      eventCategory: 'DATA_ACCESS',
      action: `${details.action}_PHI`,
      outcome: 'SUCCESS',
      phiAccessed: true,
      customerId: details.customerId,
      accessReason: details.accessReason,
      dataAccessed: details.dataAccessed,
      resourceType: 'PATIENT_RECORD',
      resourceId: details.customerId,
      riskLevel: details.action === 'EXPORT' || details.action === 'DELETE' ? 'HIGH' : 'MEDIUM',
      tags: ['phi', 'data-access'],
    });
  }

  /**
   * Log data modification
   */
  async logDataModification(
    context: AuditContext,
    details: {
      action: 'CREATE' | 'UPDATE' | 'DELETE';
      resourceType: string;
      resourceId: string;
      resourceName?: string;
      changes?: any;
      phiInvolved?: boolean;
      customerId?: string;
    }
  ): Promise<string> {
    return this.log({
      context,
      eventType: `PHI_${details.action}D` as any,
      eventCategory: 'DATA_MODIFICATION',
      action: `${details.action}_${details.resourceType}`,
      resourceType: details.resourceType,
      resourceId: details.resourceId,
      resourceName: details.resourceName,
      outcome: 'SUCCESS',
      phiAccessed: details.phiInvolved || false,
      customerId: details.customerId,
      metadata: {
        changes: details.changes,
      },
      riskLevel: details.action === 'DELETE' ? 'HIGH' : 'MEDIUM',
      tags: ['data-modification'],
    });
  }

  /**
   * Log administrative action
   */
  async logAdministrative(
    context: AuditContext,
    details: {
      action: string;
      resourceType?: string;
      resourceId?: string;
      description: string;
      changes?: any;
    }
  ): Promise<string> {
    return this.log({
      context,
      eventType: 'CONFIG_CHANGED',
      eventCategory: 'ADMINISTRATIVE',
      action: details.action,
      resourceType: details.resourceType,
      resourceId: details.resourceId,
      outcome: 'SUCCESS',
      metadata: {
        description: details.description,
        changes: details.changes,
      },
      riskLevel: 'MEDIUM',
      tags: ['administrative'],
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    context: AuditContext,
    details: {
      eventType: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      description: string;
      indicators?: any;
      resourceType?: string;
      resourceId?: string;
    }
  ): Promise<string> {
    return this.log({
      context,
      eventType: details.eventType as any,
      eventCategory: 'SECURITY',
      action: details.eventType,
      resourceType: details.resourceType,
      resourceId: details.resourceId,
      outcome: 'FAILURE',
      outcomeReason: details.description,
      riskLevel: details.severity,
      metadata: {
        indicators: details.indicators,
      },
      securityFlags: [details.eventType],
      tags: ['security', 'alert'],
    });
  }

  /**
   * Log system event
   */
  async logSystemEvent(
    details: {
      eventType: string;
      action: string;
      description: string;
      outcome: 'SUCCESS' | 'FAILURE' | 'ERROR';
      metadata?: any;
    }
  ): Promise<string> {
    return this.log({
      context: {
        userId: 'SYSTEM',
        userRole: 'SYSTEM',
        userName: 'System',
      },
      eventType: details.eventType as any,
      eventCategory: 'SYSTEM',
      action: details.action,
      outcome: details.outcome,
      outcomeReason: details.description,
      metadata: details.metadata,
      riskLevel: 'LOW',
      tags: ['system'],
    });
  }

  /**
   * Query audit logs
   */
  async query(filters: {
    userId?: string;
    customerId?: string;
    eventType?: string;
    eventCategory?: string;
    startDate?: Date;
    endDate?: Date;
    outcome?: string;
    riskLevel?: string;
    phiAccessed?: boolean;
    limit?: number;
    offset?: number;
    orderBy?: 'asc' | 'desc';
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.eventCategory) where.eventCategory = filters.eventCategory;
    if (filters.outcome) where.outcome = filters.outcome;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.phiAccessed !== undefined) where.phiAccessed = filters.phiAccessed;

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: filters.orderBy || 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Get audit log by ID
   */
  async getById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
    });
  }

  /**
   * Get customer access history
   */
  async getPatientAccessHistory(customerId: string, limit: number = 100) {
    return prisma.auditLog.findMany({
      where: {
        customerId,
        phiAccessed: true,
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, startDate: Date, endDate: Date) {
    const [logs, phiAccessCount, failedAttempts] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.count({
        where: {
          userId,
          phiAccessed: true,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          userId,
          outcome: 'FAILURE',
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    return {
      logs,
      summary: {
        totalActions: logs.length,
        phiAccessCount,
        failedAttempts,
      },
    };
  }

  /**
   * Get audit statistics
   */
  async getStatistics(startDate: Date, endDate: Date) {
    const [
      totalLogs,
      phiAccessCount,
      uniqueUsers,
      uniquePatients,
      failedAttempts,
      securityEvents,
      eventsByCategory,
      eventsByType,
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
      prisma.auditLog.findMany({
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.auditLog.findMany({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          phiAccessed: true,
        },
        select: { customerId: true },
        distinct: ['customerId'],
      }),
      prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          outcome: 'FAILURE',
        },
      }),
      prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          eventCategory: 'SECURITY',
        },
      }),
      prisma.auditLog.groupBy({
        by: ['eventCategory'],
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['eventType'],
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
        _count: true,
        orderBy: {
          _count: {
            eventType: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      phiAccessCount,
      uniqueUsers: uniqueUsers.length,
      uniquePatients: uniquePatients.filter(p => p.customerId).length,
      failedAttempts,
      securityEvents,
      eventsByCategory: eventsByCategory.map(e => ({
        category: e.eventCategory,
        count: e._count,
      })),
      topEventTypes: eventsByType.map(e => ({
        type: e.eventType,
        count: e._count,
      })),
    };
  }

  /**
   * Archive old logs
   */
  async archiveOldLogs(beforeDate: Date): Promise<number> {
    const result = await prisma.auditLog.updateMany({
      where: {
        timestamp: { lt: beforeDate },
        archived: false,
      },
      data: {
        archived: true,
      },
    });

    return result.count;
  }

  /**
   * Delete logs past retention period
   */
  async deleteExpiredLogs(): Promise<number> {
    const result = await prisma.auditLog.deleteMany({
      where: {
        retentionDate: { lt: new Date() },
      },
    });

    return result.count;
  }
}

// Export singleton instance
export const auditLogging = AuditLoggingService.getInstance();