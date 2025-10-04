/**
 * Unified EHR Service
 * 
 * Provides a single, consistent interface for interacting with multiple EHR systems.
 * Abstracts away provider-specific implementations and provides unified data models.
 * 
 * Supported EHR Systems:
 * - Epic (41.3% market share)
 * - Oracle Cerner (21.8% market share)
 * - MEDITECH (11.9% market share)
 * - athenahealth (1.1% market share)
 * - eClinicalWorks
 * - Allscripts/Veradigm
 * - NextGen Healthcare
 * 
 * Features:
 * - Provider-agnostic API
 * - Automatic provider detection
 * - Unified data models
 * - Comprehensive error handling
 * - Audit logging
 * - Connection management
 */

import { PrismaClient } from '@prisma/client';
import { AuditLoggingService } from '../compliance/AuditLoggingService';
import EpicEnhancedService from './EpicEnhancedService';
import CernerEnhancedService from './CernerEnhancedService';
import MeditechEnhancedService from './MeditechEnhancedService';
import AthenaHealthEnhancedService from './AthenaHealthEnhancedService';
import EClinicalWorksEnhancedService from './EClinicalWorksEnhancedService';
import AllscriptsEnhancedService from './AllscriptsEnhancedService';
import NextGenEnhancedService from './NextGenEnhancedService';

const prisma = new PrismaClient();
const auditService = new AuditLoggingService();

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type EHRProvider = 
  | 'EPIC'
  | 'CERNER'
  | 'MEDITECH'
  | 'ATHENAHEALTH'
  | 'ECLINICALWORKS'
  | 'ALLSCRIPTS'
  | 'NEXTGEN';

export interface UnifiedPatient {
  id: string;
  ehrProvider: EHRProvider;
  ehrPatientId: string;
  mrn: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  identifiers: Array<{
    system: string;
    value: string;
    type: string;
  }>;
}

export interface UnifiedEncounter {
  id: string;
  ehrProvider: EHRProvider;
  customerId: string;
  type: string;
  status: string;
  startDate: string;
  endDate?: string;
  location?: string;
  provider?: {
    id: string;
    name: string;
  };
  diagnoses?: Array<{
    code: string;
    description: string;
  }>;
}

export interface UnifiedObservation {
  id: string;
  ehrProvider: EHRProvider;
  customerId: string;
  code: string;
  display: string;
  category: string;
  value?: string | number;
  unit?: string;
  effectiveDateTime: string;
  status: string;
}

export interface UnifiedMedication {
  id: string;
  ehrProvider: EHRProvider;
  customerId: string;
  medicationCode: string;
  medicationName: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  status: string;
  startDate: string;
}

export interface UnifiedAllergy {
  id: string;
  ehrProvider: EHRProvider;
  customerId: string;
  substance: string;
  reaction?: string;
  severity?: string;
  status: string;
}

export interface UnifiedSyncResult {
  success: boolean;
  customerId: string;
  ehrProvider: EHRProvider;
  recordsProcessed: {
    encounters: number;
    observations: number;
    medications: number;
    allergies: number;
    total: number;
  };
  errors: string[];
  syncedAt: Date;
}

export interface EHRConnectionConfig {
  provider: EHRProvider;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  additionalConfig?: Record<string, any>;
}

// ============================================================================
// UNIFIED EHR SERVICE
// ============================================================================

export class UnifiedEHRService {
  private connections: Map<string, any> = new Map();

  /**
   * Initialize connection to an EHR system
   */
  async initializeConnection(
    customerId: string,
    config: EHRConnectionConfig
  ): Promise<void> {
    try {
      let service: any;

      switch (config.provider) {
        case 'EPIC':
          service = new EpicEnhancedService({
            baseUrl: config.baseUrl,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            environment: config.additionalConfig?.environment || 'production',
          });
          break;

        case 'CERNER':
          service = new CernerEnhancedService({
            baseUrl: config.baseUrl,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            tenantId: config.additionalConfig?.tenantId || '',
            environment: config.additionalConfig?.environment || 'production',
          });
          break;

        case 'MEDITECH':
          service = new MeditechEnhancedService({
            baseUrl: config.baseUrl,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            facilityId: config.additionalConfig?.facilityId || '',
            environment: config.additionalConfig?.environment || 'production',
          });
          break;

        case 'ATHENAHEALTH':
          service = new AthenaHealthEnhancedService({
            baseUrl: config.baseUrl,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            practiceId: config.additionalConfig?.practiceId || '',
            environment: config.additionalConfig?.environment || 'production',
          });
          break;

        case 'ECLINICALWORKS':
          service = new EClinicalWorksEnhancedService({
            baseUrl: config.baseUrl,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            practiceId: config.additionalConfig?.practiceId || '',
            environment: config.additionalConfig?.environment || 'production',
          });
          break;

        case 'ALLSCRIPTS':
          service = new AllscriptsEnhancedService({
            baseUrl: config.baseUrl,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            appName: config.additionalConfig?.appName || '',
            platform: config.additionalConfig?.platform || 'touchworks',
            environment: config.additionalConfig?.environment || 'production',
          });
          break;

        case 'NEXTGEN':
          service = new NextGenEnhancedService({
            baseUrl: config.baseUrl,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            practiceId: config.additionalConfig?.practiceId || '',
            environment: config.additionalConfig?.environment || 'production',
          });
          break;

        default:
          throw new Error(`Unsupported EHR provider: ${config.provider}`);
      }

      // Authenticate
      await service.authenticate();

      // Store connection
      this.connections.set(customerId, {
        provider: config.provider,
        service,
      });

      // Store connection in database
      await prisma.eHRConnection.upsert({
        where: {
          customerId_provider: {
            customerId,
            provider: config.provider,
          },
        },
        update: {
          status: 'ACTIVE',
          lastSyncedAt: new Date(),
        },
        create: {
          customerId,
          provider: config.provider,
          status: 'ACTIVE',
          credentials: JSON.stringify({
            baseUrl: config.baseUrl,
            clientId: config.clientId,
          }),
        },
      });

      await auditService.log({
        eventType: 'EHR_CONNECTION_INITIALIZED',
        category: 'INTEGRATION',
        outcome: 'SUCCESS',
        description: `Initialized EHR connection for customer`,
        metadata: {
          customerId,
          provider: config.provider,
        },
      });
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_CONNECTION_INITIALIZED',
        category: 'INTEGRATION',
        outcome: 'FAILURE',
        description: `Failed to initialize EHR connection`,
        metadata: {
          customerId,
          provider: config.provider,
          error: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Get EHR service for a customer
   */
  private getService(customerId: string): { provider: EHRProvider; service: any } {
    const connection = this.connections.get(customerId);
    if (!connection) {
      throw new Error(`No EHR connection found for customer: ${customerId}`);
    }
    return connection;
  }

  /**
   * Search for customers across EHR system
   */
  async searchPatients(
    customerId: string,
    criteria: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      mrn?: string;
    }
  ): Promise<UnifiedPatient[]> {
    const { provider, service } = this.getService(customerId);

    try {
      const customers = await service.searchPatients(criteria);
      
      return customers.map((customer: any) => ({
        id: customer.id,
        ehrProvider: provider,
        ehrPatientId: customer.id,
        mrn: customer.mrn,
        firstName: customer.firstName,
        lastName: customer.lastName,
        middleName: customer.middleName,
        dateOfBirth: customer.dateOfBirth,
        gender: customer.gender,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        identifiers: customer.identifiers,
      }));
    } catch (error: any) {
      throw new Error(`Failed to search customers: ${error.message}`);
    }
  }

  /**
   * Get customer by ID
   */
  async getPatient(customerId: string, ehrPatientId: string): Promise<UnifiedPatient> {
    const { provider, service } = this.getService(customerId);

    try {
      const customer = await service.getPatient(ehrPatientId);
      
      return {
        id: customer.id,
        ehrProvider: provider,
        ehrPatientId: customer.id,
        mrn: customer.mrn,
        firstName: customer.firstName,
        lastName: customer.lastName,
        middleName: customer.middleName,
        dateOfBirth: customer.dateOfBirth,
        gender: customer.gender,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        identifiers: customer.identifiers,
      };
    } catch (error: any) {
      throw new Error(`Failed to get customer: ${error.message}`);
    }
  }

  /**
   * Get customer encounters
   */
  async getEncounters(
    customerId: string,
    ehrPatientId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      status?: string;
    }
  ): Promise<UnifiedEncounter[]> {
    const { provider, service } = this.getService(customerId);

    try {
      const encounters = await service.getEncounters(ehrPatientId, options);
      
      return encounters.map((encounter: any) => ({
        id: encounter.id,
        ehrProvider: provider,
        customerId: encounter.customerId,
        type: encounter.type,
        status: encounter.status,
        startDate: encounter.startDate || encounter.admissionDate || encounter.period?.start,
        endDate: encounter.endDate || encounter.dischargeDate || encounter.period?.end,
        location: encounter.location?.name || encounter.location?.facility || encounter.location,
        provider: encounter.provider || encounter.attendingPhysician,
        diagnoses: encounter.diagnoses || encounter.diagnosis,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get encounters: ${error.message}`);
    }
  }

  /**
   * Get customer observations (lab results, vitals)
   */
  async getObservations(
    customerId: string,
    ehrPatientId: string,
    options?: {
      category?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<UnifiedObservation[]> {
    const { provider, service } = this.getService(customerId);

    try {
      const observations = await service.getObservations(ehrPatientId, options);
      
      return observations.map((obs: any) => ({
        id: obs.id,
        ehrProvider: provider,
        customerId: obs.customerId,
        code: obs.code || obs.testCode,
        display: obs.display || obs.testName || obs.type,
        category: obs.category,
        value: obs.value || obs.result,
        unit: obs.unit,
        effectiveDateTime: obs.effectiveDateTime || obs.collectionDate || obs.recordedDate,
        status: obs.status,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get observations: ${error.message}`);
    }
  }

  /**
   * Get customer medications
   */
  async getMedications(
    customerId: string,
    ehrPatientId: string,
    options?: {
      status?: string;
    }
  ): Promise<UnifiedMedication[]> {
    const { provider, service } = this.getService(customerId);

    try {
      const medications = await service.getMedications(ehrPatientId, options);
      
      return medications.map((med: any) => ({
        id: med.id,
        ehrProvider: provider,
        customerId: med.customerId,
        medicationCode: med.medicationCode,
        medicationName: med.medicationName,
        dosage: med.dosage || med.dose,
        route: med.route,
        frequency: med.frequency,
        status: med.status,
        startDate: med.startDate || med.prescribedDate,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get medications: ${error.message}`);
    }
  }

  /**
   * Get customer allergies
   */
  async getAllergies(
    customerId: string,
    ehrPatientId: string
  ): Promise<UnifiedAllergy[]> {
    const { provider, service } = this.getService(customerId);

    try {
      const allergies = await service.getAllergies(ehrPatientId);
      
      return allergies.map((allergy: any) => ({
        id: allergy.id,
        ehrProvider: provider,
        customerId: allergy.customerId,
        substance: allergy.substance || allergy.allergen,
        reaction: allergy.reaction,
        severity: allergy.severity,
        status: allergy.status || allergy.clinicalStatus,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get allergies: ${error.message}`);
    }
  }

  /**
   * Sync all customer data from EHR
   */
  async syncPatientData(
    customerId: string,
    ehrPatientId: string
  ): Promise<UnifiedSyncResult> {
    const { provider, service } = this.getService(customerId);

    try {
      const result = await service.syncPatientData(customerId, ehrPatientId);
      
      const totalRecords = Object.values(result.recordsProcessed).reduce(
        (sum: number, count: number) => sum + count,
        0
      );

      return {
        success: result.success,
        customerId: result.customerId,
        ehrProvider: provider,
        recordsProcessed: {
          encounters: result.recordsProcessed.encounters || 0,
          observations: result.recordsProcessed.observations || result.recordsProcessed.labResults || result.recordsProcessed.vitalSigns || 0,
          medications: result.recordsProcessed.medications || 0,
          allergies: result.recordsProcessed.allergies || 0,
          total: totalRecords,
        },
        errors: result.errors,
        syncedAt: result.syncedAt,
      };
    } catch (error: any) {
      throw new Error(`Failed to sync customer data: ${error.message}`);
    }
  }

  /**
   * Get connection status for a customer
   */
  async getConnectionStatus(customerId: string): Promise<{
    connected: boolean;
    provider?: EHRProvider;
    lastSyncedAt?: Date;
  }> {
    try {
      const connection = await prisma.eHRConnection.findFirst({
        where: { customerId },
      });

      if (!connection) {
        return { connected: false };
      }

      return {
        connected: connection.status === 'ACTIVE',
        provider: connection.provider as EHRProvider,
        lastSyncedAt: connection.lastSyncedAt || undefined,
      };
    } catch (error: any) {
      throw new Error(`Failed to get connection status: ${error.message}`);
    }
  }

  /**
   * Disconnect from EHR system
   */
  async disconnect(customerId: string): Promise<void> {
    try {
      // Remove from memory
      this.connections.delete(customerId);

      // Update database
      await prisma.eHRConnection.updateMany({
        where: { customerId },
        data: {
          status: 'DISCONNECTED',
        },
      });

      await auditService.log({
        eventType: 'EHR_CONNECTION_DISCONNECTED',
        category: 'INTEGRATION',
        outcome: 'SUCCESS',
        description: `Disconnected EHR connection for customer`,
        metadata: {
          customerId,
        },
      });
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_CONNECTION_DISCONNECTED',
        category: 'INTEGRATION',
        outcome: 'FAILURE',
        description: `Failed to disconnect EHR connection`,
        metadata: {
          customerId,
          error: error.message,
        },
      });
      throw error;
    }
  }
}

export default UnifiedEHRService;