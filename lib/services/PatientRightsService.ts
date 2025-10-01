/**
 * Patient Rights Management Service
 * 
 * Implements HIPAA patient rights including:
 * - Right to access PHI
 * - Right to amend PHI
 * - Right to accounting of disclosures
 * - Right to restrict uses and disclosures
 * - Right to request confidential communications
 */

import { PrismaClient } from '@prisma/client';
import { auditLogging } from './AuditLoggingService';

const prisma = new PrismaClient();

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AccessRequest {
  patientId: string;
  requestType: 'FULL_RECORD' | 'SPECIFIC_RECORDS' | 'DATE_RANGE';
  specificRecords?: string[];
  startDate?: Date;
  endDate?: Date;
  deliveryMethod: 'ELECTRONIC' | 'PAPER' | 'PICKUP';
  deliveryAddress?: string;
}

export interface AmendmentRequest {
  patientId: string;
  recordId: string;
  recordType: string;
  currentValue: string;
  proposedValue: string;
  reason: string;
}

export interface DisclosureAccountingRequest {
  patientId: string;
  startDate: Date;
  endDate: Date;
}

export interface RestrictionRequest {
  patientId: string;
  restrictionType: 'USE' | 'DISCLOSURE' | 'BOTH';
  dataType: string;
  recipient?: string;
  reason: string;
}

export interface ConfidentialCommunicationRequest {
  patientId: string;
  communicationType: 'EMAIL' | 'PHONE' | 'MAIL';
  alternativeContact: string;
  reason: string;
}

// ============================================================================
// PATIENT RIGHTS SERVICE
// ============================================================================

export class PatientRightsService {
  private static instance: PatientRightsService;

  private constructor() {}

  public static getInstance(): PatientRightsService {
    if (!PatientRightsService.instance) {
      PatientRightsService.instance = new PatientRightsService();
    }
    return PatientRightsService.instance;
  }

  // ==========================================================================
  // RIGHT TO ACCESS
  // ==========================================================================

  /**
   * Request access to PHI
   */
  async requestAccess(request: AccessRequest): Promise<string> {
    try {
      // Create access request
      const accessRequest = await prisma.$queryRaw<any[]>`
        INSERT INTO patient_access_requests (
          patient_id, request_type, specific_records, start_date, end_date,
          delivery_method, delivery_address, status, requested_at
        ) VALUES (
          ${request.patientId}, ${request.requestType},
          ${JSON.stringify(request.specificRecords || [])},
          ${request.startDate}, ${request.endDate},
          ${request.deliveryMethod}, ${request.deliveryAddress},
          'PENDING', NOW()
        )
        RETURNING id
      `;

      const requestId = accessRequest[0].id;

      // Log request
      await auditLogging.log({
        context: {
          userId: request.patientId,
          userRole: 'PATIENT',
        },
        eventType: 'DATA_REQUEST',
        eventCategory: 'COMPLIANCE',
        action: 'REQUEST_PHI_ACCESS',
        outcome: 'SUCCESS',
        patientId: request.patientId,
        metadata: {
          requestId,
          requestType: request.requestType,
        },
      });

      return requestId;
    } catch (error) {
      console.error('Failed to create access request:', error);
      throw new Error('Failed to create access request');
    }
  }

  /**
   * Fulfill access request
   */
  async fulfillAccessRequest(
    requestId: string,
    fulfilledBy: string,
    notes?: string
  ): Promise<void> {
    try {
      // Update request status
      await prisma.$executeRaw`
        UPDATE patient_access_requests 
        SET status = 'FULFILLED', fulfilled_at = NOW(), 
            fulfilled_by = ${fulfilledBy}, notes = ${notes}
        WHERE id = ${requestId}
      `;

      // Get request details
      const request = await prisma.$queryRaw<any[]>`
        SELECT patient_id FROM patient_access_requests WHERE id = ${requestId}
      `;

      if (request.length > 0) {
        // Log fulfillment
        await auditLogging.log({
          context: {
            userId: fulfilledBy,
            userRole: 'STAFF',
          },
          eventType: 'DATA_DISCLOSURE',
          eventCategory: 'COMPLIANCE',
          action: 'FULFILL_ACCESS_REQUEST',
          outcome: 'SUCCESS',
          patientId: request[0].patient_id,
          metadata: {
            requestId,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fulfill access request:', error);
      throw new Error('Failed to fulfill access request');
    }
  }

  /**
   * Get access requests for patient
   */
  async getAccessRequests(patientId: string): Promise<any[]> {
    return prisma.$queryRaw<any[]>`
      SELECT * FROM patient_access_requests 
      WHERE patient_id = ${patientId}
      ORDER BY requested_at DESC
    `;
  }

  // ==========================================================================
  // RIGHT TO AMEND
  // ==========================================================================

  /**
   * Request amendment to PHI
   */
  async requestAmendment(request: AmendmentRequest): Promise<string> {
    try {
      // Create amendment request
      const amendmentRequest = await prisma.$queryRaw<any[]>`
        INSERT INTO patient_amendment_requests (
          patient_id, record_id, record_type, current_value,
          proposed_value, reason, status, requested_at
        ) VALUES (
          ${request.patientId}, ${request.recordId}, ${request.recordType},
          ${request.currentValue}, ${request.proposedValue}, ${request.reason},
          'PENDING', NOW()
        )
        RETURNING id
      `;

      const requestId = amendmentRequest[0].id;

      // Log request
      await auditLogging.log({
        context: {
          userId: request.patientId,
          userRole: 'PATIENT',
        },
        eventType: 'DATA_REQUEST',
        eventCategory: 'COMPLIANCE',
        action: 'REQUEST_AMENDMENT',
        outcome: 'SUCCESS',
        patientId: request.patientId,
        metadata: {
          requestId,
          recordId: request.recordId,
        },
      });

      return requestId;
    } catch (error) {
      console.error('Failed to create amendment request:', error);
      throw new Error('Failed to create amendment request');
    }
  }

  /**
   * Approve amendment request
   */
  async approveAmendment(
    requestId: string,
    approvedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      // Update request status
      await prisma.$executeRaw`
        UPDATE patient_amendment_requests 
        SET status = 'APPROVED', reviewed_at = NOW(), 
            reviewed_by = ${approvedBy}, review_notes = ${notes}
        WHERE id = ${requestId}
      `;

      // Get request details
      const request = await prisma.$queryRaw<any[]>`
        SELECT patient_id, record_id, proposed_value 
        FROM patient_amendment_requests WHERE id = ${requestId}
      `;

      if (request.length > 0) {
        // Log approval
        await auditLogging.log({
          context: {
            userId: approvedBy,
            userRole: 'STAFF',
          },
          eventType: 'PHI_UPDATED',
          eventCategory: 'DATA_MODIFICATION',
          action: 'APPROVE_AMENDMENT',
          outcome: 'SUCCESS',
          patientId: request[0].patient_id,
          metadata: {
            requestId,
            recordId: request[0].record_id,
          },
        });
      }
    } catch (error) {
      console.error('Failed to approve amendment:', error);
      throw new Error('Failed to approve amendment');
    }
  }

  /**
   * Deny amendment request
   */
  async denyAmendment(
    requestId: string,
    deniedBy: string,
    reason: string
  ): Promise<void> {
    try {
      // Update request status
      await prisma.$executeRaw`
        UPDATE patient_amendment_requests 
        SET status = 'DENIED', reviewed_at = NOW(), 
            reviewed_by = ${deniedBy}, review_notes = ${reason}
        WHERE id = ${requestId}
      `;

      // Get request details
      const request = await prisma.$queryRaw<any[]>`
        SELECT patient_id FROM patient_amendment_requests WHERE id = ${requestId}
      `;

      if (request.length > 0) {
        // Log denial
        await auditLogging.log({
          context: {
            userId: deniedBy,
            userRole: 'STAFF',
          },
          eventType: 'DATA_REQUEST',
          eventCategory: 'COMPLIANCE',
          action: 'DENY_AMENDMENT',
          outcome: 'SUCCESS',
          patientId: request[0].patient_id,
          metadata: {
            requestId,
            reason,
          },
        });
      }
    } catch (error) {
      console.error('Failed to deny amendment:', error);
      throw new Error('Failed to deny amendment');
    }
  }

  // ==========================================================================
  // RIGHT TO ACCOUNTING OF DISCLOSURES
  // ==========================================================================

  /**
   * Request accounting of disclosures
   */
  async requestDisclosureAccounting(
    request: DisclosureAccountingRequest
  ): Promise<any[]> {
    try {
      // Get disclosures from audit logs
      const disclosures = await prisma.auditLog.findMany({
        where: {
          patientId: request.patientId,
          eventType: {
            in: ['PHI_EXPORTED', 'PHI_PRINTED', 'DATA_DISCLOSURE'],
          },
          timestamp: {
            gte: request.startDate,
            lte: request.endDate,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      // Log accounting request
      await auditLogging.log({
        context: {
          userId: request.patientId,
          userRole: 'PATIENT',
        },
        eventType: 'DATA_REQUEST',
        eventCategory: 'COMPLIANCE',
        action: 'REQUEST_DISCLOSURE_ACCOUNTING',
        outcome: 'SUCCESS',
        patientId: request.patientId,
        metadata: {
          startDate: request.startDate,
          endDate: request.endDate,
          disclosureCount: disclosures.length,
        },
      });

      return disclosures.map(d => ({
        date: d.timestamp,
        recipient: d.userName || 'Unknown',
        purpose: d.accessReason || 'Not specified',
        description: d.action,
        dataDisclosed: d.dataAccessed,
      }));
    } catch (error) {
      console.error('Failed to get disclosure accounting:', error);
      throw new Error('Failed to get disclosure accounting');
    }
  }

  // ==========================================================================
  // RIGHT TO RESTRICT USES AND DISCLOSURES
  // ==========================================================================

  /**
   * Request restriction
   */
  async requestRestriction(request: RestrictionRequest): Promise<string> {
    try {
      // Create restriction request
      const restrictionRequest = await prisma.$queryRaw<any[]>`
        INSERT INTO patient_restriction_requests (
          patient_id, restriction_type, data_type, recipient,
          reason, status, requested_at
        ) VALUES (
          ${request.patientId}, ${request.restrictionType}, ${request.dataType},
          ${request.recipient}, ${request.reason}, 'PENDING', NOW()
        )
        RETURNING id
      `;

      const requestId = restrictionRequest[0].id;

      // Log request
      await auditLogging.log({
        context: {
          userId: request.patientId,
          userRole: 'PATIENT',
        },
        eventType: 'DATA_REQUEST',
        eventCategory: 'COMPLIANCE',
        action: 'REQUEST_RESTRICTION',
        outcome: 'SUCCESS',
        patientId: request.patientId,
        metadata: {
          requestId,
          restrictionType: request.restrictionType,
        },
      });

      return requestId;
    } catch (error) {
      console.error('Failed to create restriction request:', error);
      throw new Error('Failed to create restriction request');
    }
  }

  /**
   * Approve restriction
   */
  async approveRestriction(
    requestId: string,
    approvedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      // Update request status
      await prisma.$executeRaw`
        UPDATE patient_restriction_requests 
        SET status = 'APPROVED', reviewed_at = NOW(), 
            reviewed_by = ${approvedBy}, review_notes = ${notes}
        WHERE id = ${requestId}
      `;

      // Get request details
      const request = await prisma.$queryRaw<any[]>`
        SELECT patient_id FROM patient_restriction_requests WHERE id = ${requestId}
      `;

      if (request.length > 0) {
        // Log approval
        await auditLogging.log({
          context: {
            userId: approvedBy,
            userRole: 'STAFF',
          },
          eventType: 'DATA_REQUEST',
          eventCategory: 'COMPLIANCE',
          action: 'APPROVE_RESTRICTION',
          outcome: 'SUCCESS',
          patientId: request[0].patient_id,
          metadata: {
            requestId,
          },
        });
      }
    } catch (error) {
      console.error('Failed to approve restriction:', error);
      throw new Error('Failed to approve restriction');
    }
  }

  // ==========================================================================
  // RIGHT TO CONFIDENTIAL COMMUNICATIONS
  // ==========================================================================

  /**
   * Request confidential communication
   */
  async requestConfidentialCommunication(
    request: ConfidentialCommunicationRequest
  ): Promise<string> {
    try {
      // Create communication request
      const commRequest = await prisma.$queryRaw<any[]>`
        INSERT INTO patient_communication_requests (
          patient_id, communication_type, alternative_contact,
          reason, status, requested_at
        ) VALUES (
          ${request.patientId}, ${request.communicationType},
          ${request.alternativeContact}, ${request.reason},
          'PENDING', NOW()
        )
        RETURNING id
      `;

      const requestId = commRequest[0].id;

      // Log request
      await auditLogging.log({
        context: {
          userId: request.patientId,
          userRole: 'PATIENT',
        },
        eventType: 'DATA_REQUEST',
        eventCategory: 'COMPLIANCE',
        action: 'REQUEST_CONFIDENTIAL_COMMUNICATION',
        outcome: 'SUCCESS',
        patientId: request.patientId,
        metadata: {
          requestId,
          communicationType: request.communicationType,
        },
      });

      return requestId;
    } catch (error) {
      console.error('Failed to create communication request:', error);
      throw new Error('Failed to create communication request');
    }
  }

  /**
   * Approve confidential communication
   */
  async approveConfidentialCommunication(
    requestId: string,
    approvedBy: string
  ): Promise<void> {
    try {
      // Update request status
      await prisma.$executeRaw`
        UPDATE patient_communication_requests 
        SET status = 'APPROVED', reviewed_at = NOW(), reviewed_by = ${approvedBy}
        WHERE id = ${requestId}
      `;

      // Get request details
      const request = await prisma.$queryRaw<any[]>`
        SELECT patient_id FROM patient_communication_requests WHERE id = ${requestId}
      `;

      if (request.length > 0) {
        // Log approval
        await auditLogging.log({
          context: {
            userId: approvedBy,
            userRole: 'STAFF',
          },
          eventType: 'DATA_REQUEST',
          eventCategory: 'COMPLIANCE',
          action: 'APPROVE_CONFIDENTIAL_COMMUNICATION',
          outcome: 'SUCCESS',
          patientId: request[0].patient_id,
          metadata: {
            requestId,
          },
        });
      }
    } catch (error) {
      console.error('Failed to approve communication request:', error);
      throw new Error('Failed to approve communication request');
    }
  }

  // ==========================================================================
  // REPORTING
  // ==========================================================================

  /**
   * Get patient rights statistics
   */
  async getStatistics(startDate: Date, endDate: Date): Promise<any> {
    const [
      accessRequests,
      amendmentRequests,
      restrictionRequests,
      communicationRequests,
    ] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT status, COUNT(*) as count
        FROM patient_access_requests
        WHERE requested_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY status
      `,
      prisma.$queryRaw<any[]>`
        SELECT status, COUNT(*) as count
        FROM patient_amendment_requests
        WHERE requested_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY status
      `,
      prisma.$queryRaw<any[]>`
        SELECT status, COUNT(*) as count
        FROM patient_restriction_requests
        WHERE requested_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY status
      `,
      prisma.$queryRaw<any[]>`
        SELECT status, COUNT(*) as count
        FROM patient_communication_requests
        WHERE requested_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY status
      `,
    ]);

    return {
      accessRequests: this.formatStatusCounts(accessRequests),
      amendmentRequests: this.formatStatusCounts(amendmentRequests),
      restrictionRequests: this.formatStatusCounts(restrictionRequests),
      communicationRequests: this.formatStatusCounts(communicationRequests),
    };
  }

  /**
   * Format status counts
   */
  private formatStatusCounts(rows: any[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.status] = parseInt(row.count);
    }
    return result;
  }
}

// Export singleton instance
export const patientRights = PatientRightsService.getInstance();