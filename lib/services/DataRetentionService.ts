/**
 * Data Retention Service
 * 
 * Manages data retention policies and automated data lifecycle:
 * - Policy management
 * - Automated archiving
 * - Automated deletion
 * - Compliance reporting
 */

import { PrismaClient } from '@prisma/client';
import { auditLogging } from './AuditLoggingService';

const prisma = new PrismaClient();

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface RetentionPolicy {
  name: string;
  description: string;
  dataType: string;
  category?: string;
  retentionPeriodDays: number;
  archiveAfterDays?: number;
  deleteAfterDays?: number;
  legalBasis?: string;
  jurisdiction?: string;
}

export interface RetentionReport {
  policyName: string;
  dataType: string;
  totalRecords: number;
  recordsToArchive: number;
  recordsToDelete: number;
  oldestRecord: Date;
  newestRecord: Date;
}

export interface DataLifecycleAction {
  action: 'ARCHIVE' | 'DELETE';
  dataType: string;
  recordCount: number;
  executedAt: Date;
  policyName: string;
}

// ============================================================================
// DATA RETENTION SERVICE
// ============================================================================

export class DataRetentionService {
  private static instance: DataRetentionService;

  private constructor() {}

  public static getInstance(): DataRetentionService {
    if (!DataRetentionService.instance) {
      DataRetentionService.instance = new DataRetentionService();
    }
    return DataRetentionService.instance;
  }

  // ==========================================================================
  // POLICY MANAGEMENT
  // ==========================================================================

  /**
   * Create retention policy
   */
  async createPolicy(policy: RetentionPolicy): Promise<string> {
    const policyRecord = await prisma.dataRetentionPolicy.create({
      data: {
        name: policy.name,
        description: policy.description,
        dataType: policy.dataType,
        category: policy.category,
        retentionPeriodDays: policy.retentionPeriodDays,
        archiveAfterDays: policy.archiveAfterDays,
        deleteAfterDays: policy.deleteAfterDays,
        legalBasis: policy.legalBasis,
        jurisdiction: policy.jurisdiction,
        active: true,
        createdBy: 'SYSTEM',
      },
    });

    // Log policy creation
    await auditLogging.logAdministrative(
      {
        userId: 'SYSTEM',
        userRole: 'SYSTEM',
        userName: 'System',
      },
      {
        action: 'CREATE_RETENTION_POLICY',
        resourceType: 'RETENTION_POLICY',
        resourceId: policyRecord.id,
        description: `Created retention policy: ${policy.name}`,
        changes: policy,
      }
    );

    return policyRecord.id;
  }

  /**
   * Update retention policy
   */
  async updatePolicy(policyId: string, updates: Partial<RetentionPolicy>): Promise<void> {
    await prisma.dataRetentionPolicy.update({
      where: { id: policyId },
      data: updates,
    });

    // Log policy update
    await auditLogging.logAdministrative(
      {
        userId: 'SYSTEM',
        userRole: 'SYSTEM',
        userName: 'System',
      },
      {
        action: 'UPDATE_RETENTION_POLICY',
        resourceType: 'RETENTION_POLICY',
        resourceId: policyId,
        description: 'Updated retention policy',
        changes: updates,
      }
    );
  }

  /**
   * Get active policies
   */
  async getActivePolicies(): Promise<any[]> {
    return prisma.dataRetentionPolicy.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get policy by data type
   */
  async getPolicyByDataType(dataType: string): Promise<any | null> {
    return prisma.dataRetentionPolicy.findFirst({
      where: {
        dataType,
        active: true,
      },
    });
  }

  /**
   * Deactivate policy
   */
  async deactivatePolicy(policyId: string): Promise<void> {
    await prisma.dataRetentionPolicy.update({
      where: { id: policyId },
      data: {
        active: false,
        effectiveTo: new Date(),
      },
    });

    // Log policy deactivation
    await auditLogging.logAdministrative(
      {
        userId: 'SYSTEM',
        userRole: 'SYSTEM',
        userName: 'System',
      },
      {
        action: 'DEACTIVATE_RETENTION_POLICY',
        resourceType: 'RETENTION_POLICY',
        resourceId: policyId,
        description: 'Deactivated retention policy',
      }
    );
  }

  // ==========================================================================
  // DATA LIFECYCLE MANAGEMENT
  // ==========================================================================

  /**
   * Execute retention policies
   */
  async executeRetentionPolicies(): Promise<DataLifecycleAction[]> {
    const policies = await this.getActivePolicies();
    const actions: DataLifecycleAction[] = [];

    for (const policy of policies) {
      // Archive old data
      if (policy.archiveAfterDays) {
        const archived = await this.archiveData(policy);
        if (archived > 0) {
          actions.push({
            action: 'ARCHIVE',
            dataType: policy.dataType,
            recordCount: archived,
            executedAt: new Date(),
            policyName: policy.name,
          });
        }
      }

      // Delete expired data
      if (policy.deleteAfterDays) {
        const deleted = await this.deleteExpiredData(policy);
        if (deleted > 0) {
          actions.push({
            action: 'DELETE',
            dataType: policy.dataType,
            recordCount: deleted,
            executedAt: new Date(),
            policyName: policy.name,
          });
        }
      }
    }

    // Log execution
    await auditLogging.logSystemEvent({
      eventType: 'DATA_RETENTION_EXECUTED',
      action: 'EXECUTE_RETENTION_POLICIES',
      description: `Executed ${policies.length} retention policies`,
      outcome: 'SUCCESS',
      metadata: {
        policiesExecuted: policies.length,
        actions,
      },
    });

    return actions;
  }

  /**
   * Archive data based on policy
   */
  private async archiveData(policy: any): Promise<number> {
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - policy.archiveAfterDays);

    // Archive audit logs
    if (policy.dataType === 'audit_log') {
      const result = await prisma.auditLog.updateMany({
        where: {
          timestamp: { lt: archiveDate },
          archived: false,
        },
        data: {
          archived: true,
        },
      });

      if (result.count > 0) {
        await auditLogging.logSystemEvent({
          eventType: 'DATA_MIGRATION',
          action: 'ARCHIVE_AUDIT_LOGS',
          description: `Archived ${result.count} audit logs`,
          outcome: 'SUCCESS',
          metadata: {
            policyName: policy.name,
            recordCount: result.count,
            archiveDate: archiveDate.toISOString(),
          },
        });
      }

      return result.count;
    }

    // Add more data types as needed
    return 0;
  }

  /**
   * Delete expired data based on policy
   */
  private async deleteExpiredData(policy: any): Promise<number> {
    const deleteDate = new Date();
    deleteDate.setDate(deleteDate.getDate() - policy.deleteAfterDays);

    // Delete audit logs
    if (policy.dataType === 'audit_log') {
      const result = await prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: deleteDate },
          retentionDate: { lt: new Date() },
        },
      });

      if (result.count > 0) {
        await auditLogging.logSystemEvent({
          eventType: 'DATA_MIGRATION',
          action: 'DELETE_EXPIRED_AUDIT_LOGS',
          description: `Deleted ${result.count} expired audit logs`,
          outcome: 'SUCCESS',
          metadata: {
            policyName: policy.name,
            recordCount: result.count,
            deleteDate: deleteDate.toISOString(),
          },
        });
      }

      return result.count;
    }

    // Add more data types as needed
    return 0;
  }

  // ==========================================================================
  // REPORTING
  // ==========================================================================

  /**
   * Generate retention report
   */
  async generateRetentionReport(): Promise<RetentionReport[]> {
    const policies = await this.getActivePolicies();
    const reports: RetentionReport[] = [];

    for (const policy of policies) {
      const report = await this.generatePolicyReport(policy);
      if (report) {
        reports.push(report);
      }
    }

    return reports;
  }

  /**
   * Generate report for specific policy
   */
  private async generatePolicyReport(policy: any): Promise<RetentionReport | null> {
    if (policy.dataType === 'audit_log') {
      const archiveDate = policy.archiveAfterDays
        ? new Date(Date.now() - policy.archiveAfterDays * 24 * 60 * 60 * 1000)
        : null;
      
      const deleteDate = policy.deleteAfterDays
        ? new Date(Date.now() - policy.deleteAfterDays * 24 * 60 * 60 * 1000)
        : null;

      const [total, toArchive, toDelete, oldest, newest] = await Promise.all([
        prisma.auditLog.count(),
        archiveDate
          ? prisma.auditLog.count({
              where: {
                timestamp: { lt: archiveDate },
                archived: false,
              },
            })
          : 0,
        deleteDate
          ? prisma.auditLog.count({
              where: {
                timestamp: { lt: deleteDate },
              },
            })
          : 0,
        prisma.auditLog.findFirst({
          orderBy: { timestamp: 'asc' },
          select: { timestamp: true },
        }),
        prisma.auditLog.findFirst({
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true },
        }),
      ]);

      return {
        policyName: policy.name,
        dataType: policy.dataType,
        totalRecords: total,
        recordsToArchive: toArchive,
        recordsToDelete: toDelete,
        oldestRecord: oldest?.timestamp || new Date(),
        newestRecord: newest?.timestamp || new Date(),
      };
    }

    return null;
  }

  /**
   * Get retention statistics
   */
  async getRetentionStatistics() {
    const policies = await this.getActivePolicies();
    const reports = await this.generateRetentionReport();

    const totalRecords = reports.reduce((sum, r) => sum + r.totalRecords, 0);
    const recordsToArchive = reports.reduce((sum, r) => sum + r.recordsToArchive, 0);
    const recordsToDelete = reports.reduce((sum, r) => sum + r.recordsToDelete, 0);

    return {
      activePolicies: policies.length,
      totalRecords,
      recordsToArchive,
      recordsToDelete,
      reports,
    };
  }

  // ==========================================================================
  // DEFAULT POLICIES
  // ==========================================================================

  /**
   * Initialize default retention policies
   */
  async initializeDefaultPolicies(): Promise<void> {
    const defaultPolicies: RetentionPolicy[] = [
      {
        name: 'Audit Log Retention',
        description: 'HIPAA-compliant audit log retention (7 years)',
        dataType: 'audit_log',
        category: 'compliance',
        retentionPeriodDays: 2555, // 7 years
        archiveAfterDays: 365, // 1 year
        deleteAfterDays: 2555, // 7 years
        legalBasis: 'HIPAA Security Rule',
        jurisdiction: 'US',
      },
      {
        name: 'Patient Record Retention',
        description: 'Patient medical record retention (10 years)',
        dataType: 'patient_record',
        category: 'medical',
        retentionPeriodDays: 3650, // 10 years
        archiveAfterDays: 1825, // 5 years
        legalBasis: 'State Medical Record Laws',
        jurisdiction: 'US',
      },
      {
        name: 'Lab Result Retention',
        description: 'Laboratory result retention (7 years)',
        dataType: 'lab_result',
        category: 'medical',
        retentionPeriodDays: 2555, // 7 years
        archiveAfterDays: 1095, // 3 years
        legalBasis: 'CLIA Requirements',
        jurisdiction: 'US',
      },
      {
        name: 'Session Data Retention',
        description: 'User session data retention (90 days)',
        dataType: 'user_session',
        category: 'security',
        retentionPeriodDays: 90,
        deleteAfterDays: 90,
        legalBasis: 'Security Best Practices',
        jurisdiction: 'US',
      },
      {
        name: 'Security Alert Retention',
        description: 'Security alert retention (2 years)',
        dataType: 'security_alert',
        category: 'security',
        retentionPeriodDays: 730, // 2 years
        archiveAfterDays: 365, // 1 year
        deleteAfterDays: 730, // 2 years
        legalBasis: 'Security Incident Documentation',
        jurisdiction: 'US',
      },
    ];

    for (const policy of defaultPolicies) {
      // Check if policy already exists
      const existing = await prisma.dataRetentionPolicy.findFirst({
        where: { name: policy.name },
      });

      if (!existing) {
        await this.createPolicy(policy);
      }
    }
  }
}

// Export singleton instance
export const dataRetentionService = DataRetentionService.getInstance();