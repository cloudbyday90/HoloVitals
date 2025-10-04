/**
 * Consent Management Service for HoloVitals
 * 
 * Manages patient consent for specialist access to PHI/PII data.
 * Features:
 * - Explicit patient consent required
 * - Time-based access (expires automatically)
 * - Granular permissions (read-only, specific data types)
 * - Audit logging of all access
 * - Revocation capability
 * - No data export allowed
 */

import { PrismaClient } from '@prisma/client';
import { auditLogger } from '../audit/AuditLogger';

const prisma = new PrismaClient();

export interface ConsentRequest {
  patientId: string;
  specialistId: string;
  reason: string;
  requestedPermissions: Permission[];
  requestedDuration: number; // in hours
  urgency: 'routine' | 'urgent' | 'emergency';
}

export interface ConsentGrant {
  id: string;
  patientId: string;
  specialistId: string;
  permissions: Permission[];
  reason: string;
  grantedAt: Date;
  expiresAt: Date;
  status: ConsentStatus;
  restrictions: AccessRestriction[];
}

export type ConsentStatus = 
  | 'pending'      // Awaiting patient approval
  | 'approved'     // Patient approved
  | 'active'       // Currently active
  | 'expired'      // Time expired
  | 'revoked'      // Patient revoked
  | 'denied';      // Patient denied

export interface Permission {
  resource: ResourceType;
  action: Action;
  scope?: string; // Optional: specific document IDs, date ranges, etc.
}

export type ResourceType = 
  | 'documents'
  | 'test_results'
  | 'medications'
  | 'allergies'
  | 'conditions'
  | 'imaging'
  | 'clinical_notes'
  | 'all_phi'; // Full PHI access

export type Action = 
  | 'read'         // View only
  | 'annotate'     // Add notes/comments
  | 'correct';     // Fix data errors

export interface AccessRestriction {
  type: RestrictionType;
  value: any;
  description: string;
}

export type RestrictionType = 
  | 'no_export'           // Cannot export data
  | 'no_copy'             // Cannot copy data
  | 'no_print'            // Cannot print
  | 'session_only'        // Access only during active session
  | 'ip_restricted'       // Specific IP addresses only
  | 'device_restricted'   // Specific devices only
  | 'view_only';          // Read-only, no modifications

export interface AccessLog {
  id: string;
  consentId: string;
  specialistId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
}

export interface ConsentNotification {
  patientId: string;
  type: 'request' | 'expiring' | 'expired' | 'accessed';
  message: string;
  timestamp: Date;
  requiresAction: boolean;
}

export class ConsentManagementService {
  private readonly MAX_CONSENT_DURATION = 72; // 72 hours maximum
  private readonly WARNING_BEFORE_EXPIRY = 2; // 2 hours warning

  /**
   * Request consent from patient
   */
  async requestConsent(request: ConsentRequest): Promise<string> {
    // Validate request
    this.validateConsentRequest(request);

    // Check if specialist exists and is verified
    await this.verifySpecialist(request.specialistId);

    // Calculate expiration
    const expiresAt = new Date(Date.now() + request.requestedDuration * 60 * 60 * 1000);

    // Create consent request
    const consentId = this.generateConsentId();
    
    await prisma.$executeRaw`
      INSERT INTO consent_grants (
        id, patient_id, specialist_id, permissions, reason, 
        requested_duration, urgency, status, expires_at, created_at
      ) VALUES (
        ${consentId}, ${request.patientId}, ${request.specialistId},
        ${JSON.stringify(request.requestedPermissions)}, ${request.reason},
        ${request.requestedDuration}, ${request.urgency}, 'pending',
        ${expiresAt}, NOW()
      )
    `;

    // Log the request
    await auditLogger.log({
      userId: request.specialistId,
      action: 'consent_requested',
      resource: 'patient_data',
      resourceId: request.patientId,
      details: {
        consentId,
        permissions: request.requestedPermissions,
        reason: request.reason,
        duration: request.requestedDuration
      },
      severity: 'medium'
    });

    // Notify patient
    await this.notifyPatient({
      patientId: request.patientId,
      type: 'request',
      message: `Specialist has requested access to your medical data. Reason: ${request.reason}`,
      timestamp: new Date(),
      requiresAction: true
    });

    return consentId;
  }

  /**
   * Patient approves consent request
   */
  async approveConsent(
    consentId: string, 
    patientId: string,
    customRestrictions?: AccessRestriction[]
  ): Promise<ConsentGrant> {
    // Get consent request
    const consent = await this.getConsent(consentId);

    if (!consent) {
      throw new Error('Consent request not found');
    }

    if (consent.patientId !== patientId) {
      throw new Error('Unauthorized: Not your consent request');
    }

    if (consent.status !== 'pending') {
      throw new Error('Consent request is not pending');
    }

    // Default restrictions (always applied)
    const defaultRestrictions: AccessRestriction[] = [
      {
        type: 'no_export',
        value: true,
        description: 'Data cannot be exported from the system'
      },
      {
        type: 'no_copy',
        value: true,
        description: 'Data cannot be copied to clipboard'
      },
      {
        type: 'session_only',
        value: true,
        description: 'Access only during active session'
      }
    ];

    const allRestrictions = [...defaultRestrictions, ...(customRestrictions || [])];

    // Update consent
    await prisma.$executeRaw`
      UPDATE consent_grants 
      SET status = 'approved',
          granted_at = NOW(),
          restrictions = ${JSON.stringify(allRestrictions)},
          updated_at = NOW()
      WHERE id = ${consentId}
    `;

    // Log approval
    await auditLogger.log({
      userId: patientId,
      action: 'consent_approved',
      resource: 'consent_grant',
      resourceId: consentId,
      details: {
        specialistId: consent.specialistId,
        permissions: consent.permissions,
        restrictions: allRestrictions
      },
      severity: 'high'
    });

    // Notify specialist
    await this.notifySpecialist(consent.specialistId, {
      type: 'approved',
      message: 'Patient has approved your access request',
      consentId
    });

    return await this.getConsent(consentId) as ConsentGrant;
  }

  /**
   * Patient denies consent request
   */
  async denyConsent(consentId: string, patientId: string, reason?: string): Promise<void> {
    const consent = await this.getConsent(consentId);

    if (!consent) {
      throw new Error('Consent request not found');
    }

    if (consent.patientId !== patientId) {
      throw new Error('Unauthorized: Not your consent request');
    }

    if (consent.status !== 'pending') {
      throw new Error('Consent request is not pending');
    }

    // Update consent
    await prisma.$executeRaw`
      UPDATE consent_grants 
      SET status = 'denied',
          denial_reason = ${reason},
          updated_at = NOW()
      WHERE id = ${consentId}
    `;

    // Log denial
    await auditLogger.log({
      userId: patientId,
      action: 'consent_denied',
      resource: 'consent_grant',
      resourceId: consentId,
      details: {
        specialistId: consent.specialistId,
        reason
      },
      severity: 'medium'
    });

    // Notify specialist
    await this.notifySpecialist(consent.specialistId, {
      type: 'denied',
      message: 'Patient has denied your access request',
      consentId
    });
  }

  /**
   * Patient revokes active consent
   */
  async revokeConsent(consentId: string, patientId: string, reason?: string): Promise<void> {
    const consent = await this.getConsent(consentId);

    if (!consent) {
      throw new Error('Consent not found');
    }

    if (consent.patientId !== patientId) {
      throw new Error('Unauthorized: Not your consent');
    }

    if (consent.status !== 'approved' && consent.status !== 'active') {
      throw new Error('Consent is not active');
    }

    // Revoke consent
    await prisma.$executeRaw`
      UPDATE consent_grants 
      SET status = 'revoked',
          revoked_at = NOW(),
          revocation_reason = ${reason},
          updated_at = NOW()
      WHERE id = ${consentId}
    `;

    // Log revocation
    await auditLogger.log({
      userId: patientId,
      action: 'consent_revoked',
      resource: 'consent_grant',
      resourceId: consentId,
      details: {
        specialistId: consent.specialistId,
        reason
      },
      severity: 'high'
    });

    // Terminate any active sessions
    await this.terminateSpecialistSessions(consent.specialistId, patientId);

    // Notify specialist
    await this.notifySpecialist(consent.specialistId, {
      type: 'revoked',
      message: 'Patient has revoked your access',
      consentId
    });
  }

  /**
   * Check if specialist has permission to access resource
   */
  async checkPermission(
    specialistId: string,
    patientId: string,
    resource: ResourceType,
    action: Action
  ): Promise<boolean> {
    // Get active consents
    const consents = await this.getActiveConsents(specialistId, patientId);

    if (consents.length === 0) {
      return false;
    }

    // Check if any consent grants the required permission
    for (const consent of consents) {
      for (const permission of consent.permissions) {
        if (
          (permission.resource === resource || permission.resource === 'all_phi') &&
          (permission.action === action || permission.action === 'read' && action === 'read')
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Log access to patient data
   */
  async logAccess(
    consentId: string,
    specialistId: string,
    action: string,
    resource: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    const accessLogId = this.generateAccessLogId();

    await prisma.$executeRaw`
      INSERT INTO access_logs (
        id, consent_id, specialist_id, action, resource,
        ip_address, user_agent, details, timestamp, success
      ) VALUES (
        ${accessLogId}, ${consentId}, ${specialistId}, ${action}, ${resource},
        ${ipAddress}, ${userAgent}, ${JSON.stringify(details)}, NOW(), true
      )
    `;

    // Also log to audit system
    await auditLogger.log({
      userId: specialistId,
      action: `specialist_${action}`,
      resource,
      resourceId: consentId,
      details: {
        consentId,
        ipAddress,
        userAgent,
        ...details
      },
      severity: 'high',
      requiresReview: true
    });

    // Update consent last accessed
    await prisma.$executeRaw`
      UPDATE consent_grants 
      SET last_accessed = NOW(),
          access_count = access_count + 1,
          status = 'active'
      WHERE id = ${consentId}
    `;
  }

  /**
   * Get all consents for a patient
   */
  async getPatientConsents(patientId: string): Promise<ConsentGrant[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM consent_grants 
      WHERE patient_id = ${patientId}
      ORDER BY created_at DESC
    `;

    return results.map(this.mapToConsentGrant);
  }

  /**
   * Get active consents for specialist accessing patient data
   */
  async getActiveConsents(specialistId: string, patientId: string): Promise<ConsentGrant[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM consent_grants 
      WHERE specialist_id = ${specialistId}
        AND patient_id = ${patientId}
        AND status IN ('approved', 'active')
        AND expires_at > NOW()
    `;

    return results.map(this.mapToConsentGrant);
  }

  /**
   * Get consent by ID
   */
  async getConsent(consentId: string): Promise<ConsentGrant | null> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM consent_grants WHERE id = ${consentId}
    `;

    if (!results || results.length === 0) {
      return null;
    }

    return this.mapToConsentGrant(results[0]);
  }

  /**
   * Get access logs for a consent
   */
  async getAccessLogs(consentId: string): Promise<AccessLog[]> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM access_logs 
      WHERE consent_id = ${consentId}
      ORDER BY timestamp DESC
    `;

    return results.map(log => ({
      id: log.id,
      consentId: log.consent_id,
      specialistId: log.specialist_id,
      action: log.action,
      resource: log.resource,
      timestamp: log.timestamp,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      success: log.success,
      details: log.details ? JSON.parse(log.details) : null
    }));
  }

  /**
   * Check and expire old consents
   */
  async expireOldConsents(): Promise<number> {
    const result = await prisma.$executeRaw`
      UPDATE consent_grants 
      SET status = 'expired',
          updated_at = NOW()
      WHERE status IN ('approved', 'active')
        AND expires_at < NOW()
    `;

    // Notify patients of expired consents
    const expiredConsents = await prisma.$queryRaw<any[]>`
      SELECT patient_id, id FROM consent_grants 
      WHERE status = 'expired' 
        AND updated_at > NOW() - INTERVAL '1 minute'
    `;

    for (const consent of expiredConsents) {
      await this.notifyPatient({
        patientId: consent.patient_id,
        type: 'expired',
        message: 'Specialist access to your data has expired',
        timestamp: new Date(),
        requiresAction: false
      });
    }

    return result as unknown as number;
  }

  /**
   * Send expiration warnings
   */
  async sendExpirationWarnings(): Promise<void> {
    const warningTime = new Date(Date.now() + this.WARNING_BEFORE_EXPIRY * 60 * 60 * 1000);

    const expiringConsents = await prisma.$queryRaw<any[]>`
      SELECT * FROM consent_grants 
      WHERE status IN ('approved', 'active')
        AND expires_at < ${warningTime}
        AND expires_at > NOW()
        AND expiration_warning_sent = false
    `;

    for (const consent of expiringConsents) {
      await this.notifyPatient({
        patientId: consent.patient_id,
        type: 'expiring',
        message: `Specialist access will expire in ${this.WARNING_BEFORE_EXPIRY} hours`,
        timestamp: new Date(),
        requiresAction: false
      });

      // Mark warning as sent
      await prisma.$executeRaw`
        UPDATE consent_grants 
        SET expiration_warning_sent = true
        WHERE id = ${consent.id}
      `;
    }
  }

  // Private helper methods

  private validateConsentRequest(request: ConsentRequest): void {
    if (request.requestedDuration > this.MAX_CONSENT_DURATION) {
      throw new Error(`Maximum consent duration is ${this.MAX_CONSENT_DURATION} hours`);
    }

    if (request.requestedDuration < 1) {
      throw new Error('Minimum consent duration is 1 hour');
    }

    if (!request.reason || request.reason.trim().length < 10) {
      throw new Error('Detailed reason is required (minimum 10 characters)');
    }

    if (!request.requestedPermissions || request.requestedPermissions.length === 0) {
      throw new Error('At least one permission must be requested');
    }
  }

  private async verifySpecialist(specialistId: string): Promise<void> {
    // In production, verify specialist credentials, license, etc.
    const specialist = await prisma.user.findUnique({
      where: { id: specialistId }
    });

    if (!specialist) {
      throw new Error('Specialist not found');
    }

    // Additional verification logic here
  }

  private async terminateSpecialistSessions(specialistId: string, patientId: string): Promise<void> {
    // Terminate any active sessions where specialist is viewing patient data
    await prisma.$executeRaw`
      DELETE FROM user_sessions 
      WHERE user_id = ${specialistId}
        AND session_data LIKE ${`%${patientId}%`}
    `;
  }

  private async notifyPatient(notification: ConsentNotification): Promise<void> {
    // In production, send email, SMS, push notification, etc.
    console.log(`[ConsentManagement] Notifying patient ${notification.patientId}:`, notification.message);
    
    // Store notification in database
    await prisma.$executeRaw`
      INSERT INTO notifications (patient_id, type, message, requires_action, created_at)
      VALUES (${notification.patientId}, ${notification.type}, ${notification.message}, 
              ${notification.requiresAction}, NOW())
    `;
  }

  private async notifySpecialist(specialistId: string, notification: any): Promise<void> {
    // In production, send notification to specialist
    console.log(`[ConsentManagement] Notifying specialist ${specialistId}:`, notification.message);
  }

  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  private generateAccessLogId(): string {
    return `access_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  private mapToConsentGrant(row: any): ConsentGrant {
    return {
      id: row.id,
      patientId: row.patient_id,
      specialistId: row.specialist_id,
      permissions: JSON.parse(row.permissions),
      reason: row.reason,
      grantedAt: row.granted_at,
      expiresAt: row.expires_at,
      status: row.status,
      restrictions: row.restrictions ? JSON.parse(row.restrictions) : []
    };
  }
}

export const consentManagementService = new ConsentManagementService();