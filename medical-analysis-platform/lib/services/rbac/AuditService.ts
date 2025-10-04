/**
 * Audit Service
 * Manages audit logging and compliance tracking
 */

import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

export interface AuditLogFilters {
  employeeId?: string;
  action?: AuditAction;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
}

export interface CreateAuditLogInput {
  employeeId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  changes?: any;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  endpoint?: string;
  success?: boolean;
  errorMessage?: string;
}

export class AuditService {
  /**
   * Create audit log entry
   */
  static async createAuditLog(input: CreateAuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          employeeId: input.employeeId,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          changes: input.changes ? JSON.stringify(input.changes) : undefined,
          details: input.details,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          method: input.method,
          endpoint: input.endpoint,
          success: input.success ?? true,
          errorMessage: input.errorMessage,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging failure shouldn't break operations
    }
  }

  /**
   * Get audit logs with filters
   */
  static async getAuditLogs(
    filters: AuditLogFilters,
    page = 1,
    pageSize = 50
  ) {
    const where: any = {};

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.resource) {
      where.resource = filters.resource;
    }

    if (filters.resourceId) {
      where.resourceId = filters.resourceId;
    }

    if (filters.success !== undefined) {
      where.success = filters.success;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get audit logs for a specific employee
   */
  static async getEmployeeAuditLogs(
    employeeId: string,
    page = 1,
    pageSize = 50
  ) {
    return await this.getAuditLogs({ employeeId }, page, pageSize);
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getResourceAuditLogs(
    resource: string,
    resourceId: string,
    page = 1,
    pageSize = 50
  ) {
    return await this.getAuditLogs({ resource, resourceId }, page, pageSize);
  }

  /**
   * Get recent audit logs
   */
  static async getRecentAuditLogs(limit = 100) {
    return await prisma.auditLog.findMany({
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [
      totalLogs,
      successfulLogs,
      failedLogs,
      byAction,
      byResource,
      topEmployees,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: { ...where, success: true } }),
      prisma.auditLog.count({ where: { ...where, success: false } }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['employeeId'],
        where,
        _count: true,
        orderBy: {
          _count: {
            employeeId: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      successfulLogs,
      failedLogs,
      successRate: totalLogs > 0 ? (successfulLogs / totalLogs) * 100 : 0,
      byAction,
      byResource,
      topEmployees,
    };
  }

  /**
   * Get failed operations
   */
  static async getFailedOperations(page = 1, pageSize = 50) {
    return await this.getAuditLogs({ success: false }, page, pageSize);
  }

  /**
   * Search audit logs
   */
  static async searchAuditLogs(
    searchTerm: string,
    page = 1,
    pageSize = 50
  ) {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { resource: { contains: searchTerm, mode: 'insensitive' } },
          { details: { contains: searchTerm, mode: 'insensitive' } },
          { endpoint: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.auditLog.count({
      where: {
        OR: [
          { resource: { contains: searchTerm, mode: 'insensitive' } },
          { details: { contains: searchTerm, mode: 'insensitive' } },
          { endpoint: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
    });

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Export audit logs
   */
  static async exportAuditLogs(
    filters: AuditLogFilters,
    format: 'json' | 'csv' = 'json'
  ) {
    const where: any = {};

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.resource) {
      where.resource = filters.resource;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV format
      const headers = [
        'Timestamp',
        'Employee',
        'Action',
        'Resource',
        'Resource ID',
        'Success',
        'IP Address',
        'Details',
      ];

      const rows = logs.map(log => [
        log.createdAt.toISOString(),
        log.employee
          ? `${log.employee.firstName} ${log.employee.lastName} (${log.employee.email})`
          : 'System',
        log.action,
        log.resource,
        log.resourceId || '',
        log.success ? 'Yes' : 'No',
        log.ipAddress || '',
        log.details || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return csv;
    }
  }

  /**
   * Clean up old audit logs
   */
  static async cleanupOldLogs(retentionDays = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Get compliance report
   */
  static async getComplianceReport(startDate: Date, endDate: Date) {
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Analyze logs for compliance
    const report = {
      period: {
        start: startDate,
        end: endDate,
      },
      totalActions: logs.length,
      uniqueEmployees: new Set(logs.map(l => l.employeeId)).size,
      actionBreakdown: {} as Record<string, number>,
      resourceBreakdown: {} as Record<string, number>,
      failedActions: logs.filter(l => !l.success).length,
      suspiciousActivity: [] as any[],
    };

    // Count actions and resources
    logs.forEach(log => {
      report.actionBreakdown[log.action] =
        (report.actionBreakdown[log.action] || 0) + 1;
      report.resourceBreakdown[log.resource] =
        (report.resourceBreakdown[log.resource] || 0) + 1;
    });

    // Detect suspicious activity (e.g., excessive failed logins)
    const employeeFailures: Record<string, number> = {};
    logs
      .filter(l => !l.success && l.action === 'LOGIN')
      .forEach(log => {
        if (log.employeeId) {
          employeeFailures[log.employeeId] =
            (employeeFailures[log.employeeId] || 0) + 1;
        }
      });

    Object.entries(employeeFailures).forEach(([employeeId, count]) => {
      if (count >= 5) {
        const employee = logs.find(l => l.employeeId === employeeId)?.employee;
        report.suspiciousActivity.push({
          type: 'excessive_failed_logins',
          employeeId,
          employeeName: employee
            ? `${employee.firstName} ${employee.lastName}`
            : 'Unknown',
          count,
        });
      }
    });

    return report;
  }
}