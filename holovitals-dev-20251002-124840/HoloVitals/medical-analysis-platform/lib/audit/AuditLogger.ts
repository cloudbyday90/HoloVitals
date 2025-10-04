/**
 * Audit Logger for HoloVitals
 * 
 * Comprehensive audit logging system for HIPAA compliance.
 * Logs all access to PHI/PII data with:
 * - Who accessed (user ID)
 * - What was accessed (resource)
 * - When (timestamp)
 * - Where (IP address, location)
 * - Why (action, reason)
 * - Result (success/failure)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity: AuditSeverity;
  requiresReview?: boolean;
  consentId?: string;
}

export type AuditAction = 
  // Authentication
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'password_changed'
  | 'account_locked'
  
  // Data Access
  | 'data_viewed'
  | 'data_created'
  | 'data_updated'
  | 'data_deleted'
  | 'data_exported'
  | 'data_printed'
  
  // Consent
  | 'consent_requested'
  | 'consent_approved'
  | 'consent_denied'
  | 'consent_revoked'
  
  // Specialist Access
  | 'specialist_access_granted'
  | 'specialist_access_denied'
  | 'specialist_data_viewed'
  | 'specialist_data_corrected'
  
  // System
  | 'system_error'
  | 'security_violation'
  | 'unauthorized_access_attempt'
  | 'suspicious_activity';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditQuery {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: AuditSeverity;
  requiresReview?: boolean;
  limit?: number;
}

export interface AuditReport {
  totalEntries: number;
  entriesBySeverity: Record<AuditSeverity, number>;
  entriesByAction: Record<string, number>;
  suspiciousActivities: AuditLogEntry[];
  requiresReview: AuditLogEntry[];
  dateRange: { start: Date; end: Date };
}

export class AuditLogger {
  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<string> {
    const logId = this.generateLogId();
    const timestamp = new Date();

    try {
      await prisma.$executeRaw`
        INSERT INTO audit_logs (
          id, user_id, action, resource, resource_id, details,
          ip_address, user_agent, session_id, severity, 
          requires_review, consent_id, timestamp, created_at
        ) VALUES (
          ${logId}, ${entry.userId}, ${entry.action}, ${entry.resource},
          ${entry.resourceId}, ${JSON.stringify(entry.details || {})},
          ${entry.ipAddress}, ${entry.userAgent}, ${entry.sessionId},
          ${entry.severity}, ${entry.requiresReview || false},
          ${entry.consentId}, ${timestamp}, NOW()
        )
      `;

      // Check for suspicious patterns
      await this.checkSuspiciousActivity(entry);

      // Alert if critical
      if (entry.severity === 'critical') {
        await this.sendCriticalAlert(entry);
      }

      return logId;
    } catch (error) {
      console.error('[AuditLogger] Failed to log audit entry:', error);
      // In production, this should never fail - use fallback logging
      throw error;
    }
  }

  /**
   * Log PHI/PII access
   */
  async logPHIAccess(
    userId: string,
    patientId: string,
    dataType: string,
    action: 'view' | 'edit' | 'delete',
    consentId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return await this.log({
      userId,
      action: action === 'view' ? 'data_viewed' : 
              action === 'edit' ? 'data_updated' : 'data_deleted',
      resource: 'patient_phi',
      resourceId: patientId,
      details: {
        dataType,
        patientId,
        consentId
      },
      ipAddress,
      userAgent,
      severity: 'high',
      requiresReview: true,
      consentId
    });
  }

  /**
   * Log specialist access
   */
  async logSpecialistAccess(
    specialistId: string,
    patientId: string,
    action: string,
    consentId: string,
    details: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return await this.log({
      userId: specialistId,
      action: 'specialist_data_viewed',
      resource: 'patient_data',
      resourceId: patientId,
      details: {
        ...details,
        consentId,
        specialistAccess: true
      },
      ipAddress,
      userAgent,
      severity: 'high',
      requiresReview: true,
      consentId
    });
  }

  /**
   * Log security violation
   */
  async logSecurityViolation(
    userId: string,
    violation: string,
    details: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return await this.log({
      userId,
      action: 'security_violation',
      resource: 'security',
      resourceId: userId,
      details: {
        violation,
        ...details
      },
      ipAddress,
      userAgent,
      severity: 'critical',
      requiresReview: true
    });
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(
    userId: string,
    attemptedResource: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return await this.log({
      userId,
      action: 'unauthorized_access_attempt',
      resource: attemptedResource,
      resourceId: userId,
      details: {
        reason,
        attemptedResource
      },
      ipAddress,
      userAgent,
      severity: 'high',
      requiresReview: true
    });
  }

  /**
   * Query audit logs
   */
  async query(query: AuditQuery): Promise<AuditLogEntry[]> {
    let sql = `SELECT * FROM audit_logs WHERE 1=1`;
    const params: any[] = [];

    if (query.userId) {
      sql += ` AND user_id = ?`;
      params.push(query.userId);
    }

    if (query.action) {
      sql += ` AND action = ?`;
      params.push(query.action);
    }

    if (query.resource) {
      sql += ` AND resource = ?`;
      params.push(query.resource);
    }

    if (query.startDate) {
      sql += ` AND timestamp >= ?`;
      params.push(query.startDate);
    }

    if (query.endDate) {
      sql += ` AND timestamp <= ?`;
      params.push(query.endDate);
    }

    if (query.severity) {
      sql += ` AND severity = ?`;
      params.push(query.severity);
    }

    if (query.requiresReview !== undefined) {
      sql += ` AND requires_review = ?`;
      params.push(query.requiresReview);
    }

    sql += ` ORDER BY timestamp DESC`;

    if (query.limit) {
      sql += ` LIMIT ?`;
      params.push(query.limit);
    }

    const results = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

    return results.map(this.mapToAuditLogEntry);
  }

  /**
   * Get audit logs for a patient
   */
  async getPatientAuditLogs(patientId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM audit_logs 
      WHERE resource_id = ${patientId}
        OR details LIKE ${`%${patientId}%`}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return results.map(this.mapToAuditLogEntry);
  }

  /**
   * Get audit logs requiring review
   */
  async getLogsRequiringReview(limit: number = 50): Promise<AuditLogEntry[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM audit_logs 
      WHERE requires_review = true
        AND reviewed = false
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return results.map(this.mapToAuditLogEntry);
  }

  /**
   * Mark audit log as reviewed
   */
  async markAsReviewed(logId: string, reviewerId: string, notes?: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE audit_logs 
      SET reviewed = true,
          reviewed_by = ${reviewerId},
          reviewed_at = NOW(),
          review_notes = ${notes}
      WHERE id = ${logId}
    `;
  }

  /**
   * Generate audit report
   */
  async generateReport(startDate: Date, endDate: Date): Promise<AuditReport> {
    const logs = await this.query({ startDate, endDate });

    const entriesBySeverity: Record<AuditSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    const entriesByAction: Record<string, number> = {};

    for (const log of logs) {
      entriesBySeverity[log.severity]++;
      entriesByAction[log.action] = (entriesByAction[log.action] || 0) + 1;
    }

    const suspiciousActivities = logs.filter(log => 
      log.action === 'suspicious_activity' || 
      log.action === 'security_violation' ||
      log.action === 'unauthorized_access_attempt'
    );

    const requiresReview = logs.filter(log => log.requiresReview);

    return {
      totalEntries: logs.length,
      entriesBySeverity,
      entriesByAction,
      suspiciousActivities,
      requiresReview,
      dateRange: { start: startDate, end: endDate }
    };
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await this.query({ userId, startDate });

    const actionCounts: Record<string, number> = {};
    const dailyActivity: Record<string, number> = {};

    for (const log of logs) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

      const date = new Date(log.details.timestamp || Date.now()).toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    }

    return {
      userId,
      period: `${days} days`,
      totalActions: logs.length,
      actionCounts,
      dailyActivity,
      securityViolations: logs.filter(l => l.action === 'security_violation').length,
      unauthorizedAttempts: logs.filter(l => l.action === 'unauthorized_access_attempt').length
    };
  }

  /**
   * Check for suspicious activity patterns
   */
  private async checkSuspiciousActivity(entry: AuditLogEntry): Promise<void> {
    // Check for rapid repeated access
    const recentLogs = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM audit_logs 
      WHERE user_id = ${entry.userId}
        AND action = ${entry.action}
        AND timestamp > NOW() - INTERVAL '5 minutes'
    `;

    if (recentLogs[0].count > 20) {
      await this.log({
        userId: entry.userId,
        action: 'suspicious_activity',
        resource: 'security',
        resourceId: entry.userId,
        details: {
          pattern: 'rapid_repeated_access',
          count: recentLogs[0].count,
          action: entry.action
        },
        severity: 'high',
        requiresReview: true
      });
    }

    // Check for access from multiple IPs
    if (entry.ipAddress) {
      const recentIPs = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT ip_address FROM audit_logs 
        WHERE user_id = ${entry.userId}
          AND timestamp > NOW() - INTERVAL '1 hour'
      `;

      if (recentIPs.length > 3) {
        await this.log({
          userId: entry.userId,
          action: 'suspicious_activity',
          resource: 'security',
          resourceId: entry.userId,
          details: {
            pattern: 'multiple_ip_addresses',
            ipCount: recentIPs.length,
            ips: recentIPs.map(r => r.ip_address)
          },
          severity: 'high',
          requiresReview: true
        });
      }
    }

    // Check for unusual access times (e.g., 2 AM - 5 AM)
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 5 && entry.action.includes('data_')) {
      await this.log({
        userId: entry.userId,
        action: 'suspicious_activity',
        resource: 'security',
        resourceId: entry.userId,
        details: {
          pattern: 'unusual_access_time',
          hour,
          action: entry.action
        },
        severity: 'medium',
        requiresReview: true
      });
    }
  }

  /**
   * Send critical alert
   */
  private async sendCriticalAlert(entry: AuditLogEntry): Promise<void> {
    // In production, send alerts via email, SMS, Slack, PagerDuty, etc.
    console.error('[AuditLogger] CRITICAL ALERT:', {
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      details: entry.details
    });

    // Store alert
    await prisma.$executeRaw`
      INSERT INTO security_alerts (user_id, action, details, created_at)
      VALUES (${entry.userId}, ${entry.action}, ${JSON.stringify(entry.details)}, NOW())
    `;
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Map database row to AuditLogEntry
   */
  private mapToAuditLogEntry(row: any): AuditLogEntry {
    return {
      userId: row.user_id,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id,
      details: row.details ? JSON.parse(row.details) : {},
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      sessionId: row.session_id,
      severity: row.severity,
      requiresReview: row.requires_review,
      consentId: row.consent_id
    };
  }
}

export const auditLogger = new AuditLogger();