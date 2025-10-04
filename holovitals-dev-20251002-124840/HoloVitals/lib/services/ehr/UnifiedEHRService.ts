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
  patientId: string;
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
  patientId: string;
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
  patientId: string;
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
  patientId: string;
  substance: string;
  reaction?: string;
  severity?: string;
  status: string;
}

export interface UnifiedSyncResult {
  success: boolean;
  patientId: string;
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
    patientId: string,
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
      this.connections.set(patientId, {
        provider: config.provider,
        service,
      });

      // Store connection in database
      await prisma.eHRConnection.upsert({
        where: {
          patientId_provider: {
            patientId,
            provider: config.provider,
          },
        },
        update: {
          status: 'ACTIVE',
          lastSyncedAt: new Date(),
        },
        create: {
          patientId,
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
        description: `Initialized EHR connection for patient`,
        metadata: {
          patientId,
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
          patientId,
          provider: config.provider,
          error: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Get EHR service for a patient
   */
  private getService(patientId: string): { provider: EHRProvider; service: any } {
    const connection = this.connections.get(patientId);
    if (!connection) {
      throw new Error(`No EHR connection found for patient: ${patientId}`);
    }
    return connection;
  }

  /**
   * Search for patients across EHR system
   */
  async searchPatients(
    patientId: string,
    criteria: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      mrn?: string;
    }
  ): Promise<UnifiedPatient[]> {
    const { provider, service } = this.getService(patientId);

    try {
      const patients = await service.searchPatients(criteria);
      
      return patients.map((patient: any) => ({
        id: patient.id,
        ehrProvider: provider,
        ehrPatientId: patient.id,
        mrn: patient.mrn,
        firstName: patient.firstName,
        lastName: patient.lastName,
        middleName: patient.middleName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        identifiers: patient.identifiers,
      }));
    } catch (error: any) {
      throw new Error(`Failed to search patients: ${error.message}`);
    }
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId: string, ehrPatientId: string): Promise<UnifiedPatient> {
    const { provider, service } = this.getService(patientId);

    try {
      const patient = await service.getPatient(ehrPatientId);
      
      return {
        id: patient.id,
        ehrProvider: provider,
        ehrPatientId: patient.id,
        mrn: patient.mrn,
        firstName: patient.firstName,
        lastName: patient.lastName,
        middleName: patient.middleName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        identifiers: patient.identifiers,
      };
    } catch (error: any) {
      throw new Error(`Failed to get patient: ${error.message}`);
    }
  }

  /**
   * Get patient encounters
   */
  async getEncounters(
    patientId: string,
    ehrPatientId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      status?: string;
    }
  ): Promise<UnifiedEncounter[]> {
    const { provider, service } = this.getService(patientId);

    try {
      const encounters = await service.getEncounters(ehrPatientId, options);
      
      return encounters.map((encounter: any) => ({
        id: encounter.id,
        ehrProvider: provider,
        patientId: encounter.patientId,
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
   * Get patient observations (lab results, vitals)
   */
  async getObservations(
    patientId: string,
    ehrPatientId: string,
    options?: {
      category?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<UnifiedObservation[]> {
    const { provider, service } = this.getService(patientId);

    try {
      const observations = await service.getObservations(ehrPatientId, options);
      
      return observations.map((obs: any) => ({
        id: obs.id,
        ehrProvider: provider,
        patientId: obs.patientId,
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
   * Get patient medications
   */
  async getMedications(
    patientId: string,
    ehrPatientId: string,
    options?: {
      status?: string;
    }
  ): Promise<UnifiedMedication[]> {
    const { provider, service } = this.getService(patientId);

    try {
      const medications = await service.getMedications(ehrPatientId, options);
      
      return medications.map((med: any) => ({
        id: med.id,
        ehrProvider: provider,
        patientId: med.patientId,
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
   * Get patient allergies
   */
  async getAllergies(
    patientId: string,
    ehrPatientId: string
  ): Promise<UnifiedAllergy[]> {
    const { provider, service } = this.getService(patientId);

    try {
      const allergies = await service.getAllergies(ehrPatientId);
      
      return allergies.map((allergy: any) => ({
        id: allergy.id,
        ehrProvider: provider,
        patientId: allergy.patientId,
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
   * Sync all patient data from EHR
   */
  async syncPatientData(
    patientId: string,
    ehrPatientId: string
  ): Promise<UnifiedSyncResult> {
    const { provider, service } = this.getService(patientId);

    try {
      const result = await service.syncPatientData(patientId, ehrPatientId);
      
      const totalRecords = Object.values(result.recordsProcessed).reduce(
        (sum: number, count: number) => sum + count,
        0
      );

      return {
        success: result.success,
        patientId: result.patientId,
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
      throw new Error(`Failed to sync patient data: ${error.message}`);
    }
  }

  /**
   * Get connection status for a patient
   */
  async getConnectionStatus(patientId: string): Promise<{
    connected: boolean;
    provider?: EHRProvider;
    lastSyncedAt?: Date;
  }> {
    try {
      const connection = await prisma.eHRConnection.findFirst({
        where: { patientId },
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
  async disconnect(patientId: string): Promise<void> {
    try {
      // Remove from memory
      this.connections.delete(patientId);

      // Update database
      await prisma.eHRConnection.updateMany({
        where: { patientId },
        data: {
          status: 'DISCONNECTED',
        },
      });

      await auditService.log({
        eventType: 'EHR_CONNECTION_DISCONNECTED',
        category: 'INTEGRATION',
        outcome: 'SUCCESS',
        description: `Disconnected EHR connection for patient`,
        metadata: {
          patientId,
        },
      });
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_CONNECTION_DISCONNECTED',
        category: 'INTEGRATION',
        outcome: 'FAILURE',
        description: `Failed to disconnect EHR connection`,
        metadata: {
          patientId,
          error: error.message,
        },
      });
      throw error;
    }
  }
}

export default UnifiedEHRService;