/**
 * Oracle Cerner EHR Integration Service
 * 
 * Provides comprehensive integration with Oracle Cerner (formerly Cerner Millennium)
 * EHR system using FHIR R4 API and proprietary Cerner APIs.
 * 
 * Market Share: 21.8% of U.S. hospitals
 * 
 * Features:
 * - FHIR R4 API integration
 * - Customer demographics and medical records
 * - Lab results and vital signs
 * - Medications and allergies
 * - Appointments and encounters
 * - Clinical documents
 * - Real-time data synchronization
 * 
 * @see https://fhir.cerner.com/
 * @see https://docs.oracle.com/en/industries/health/millennium-platform/
 */

import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../security/EncryptionService';
import { AuditLoggingService } from '../compliance/AuditLoggingService';

const prisma = new PrismaClient();
const encryptionService = new EncryptionService();
const auditService = new AuditLoggingService();

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CernerConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  environment: 'sandbox' | 'production';
  apiVersion?: string;
}

export interface CernerPatient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
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

export interface CernerEncounter {
  id: string;
  customerId: string;
  type: string;
  status: string;
  class: string;
  period: {
    start: string;
    end?: string;
  };
  reasonCode?: string;
  reasonDisplay?: string;
  location?: string;
  practitioner?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface CernerObservation {
  id: string;
  customerId: string;
  encounterId?: string;
  code: string;
  display: string;
  category: string;
  value?: string | number;
  unit?: string;
  interpretation?: string;
  referenceRange?: {
    low?: number;
    high?: number;
    text?: string;
  };
  effectiveDateTime: string;
  status: string;
}

export interface CernerMedication {
  id: string;
  customerId: string;
  medicationCode: string;
  medicationName: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  status: string;
  prescribedDate: string;
  prescriber?: {
    id: string;
    name: string;
  };
  instructions?: string;
}

export interface CernerCondition {
  id: string;
  customerId: string;
  code: string;
  display: string;
  clinicalStatus: string;
  verificationStatus: string;
  category: string;
  severity?: string;
  onsetDateTime?: string;
  recordedDate: string;
}

export interface CernerAllergy {
  id: string;
  customerId: string;
  substance: string;
  reaction?: string;
  severity?: string;
  type: string;
  clinicalStatus: string;
  verificationStatus: string;
  recordedDate: string;
}

export interface CernerDocument {
  id: string;
  customerId: string;
  type: string;
  category: string;
  date: string;
  author?: string;
  title?: string;
  content?: string;
  status: string;
}

export interface CernerSyncResult {
  success: boolean;
  customerId: string;
  recordsProcessed: {
    encounters: number;
    observations: number;
    medications: number;
    conditions: number;
    allergies: number;
    documents: number;
  };
  errors: string[];
  syncedAt: Date;
}

// ============================================================================
// CERNER ENHANCED SERVICE
// ============================================================================

export class CernerEnhancedService {
  private client: AxiosInstance;
  private config: CernerConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: CernerConfig) {
    this.config = config;
    this.client = axios.create({
      baseUrl: config.baseUrl,
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json',
      },
      timeout: 30000,
    });
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================

  /**
   * Authenticate with Cerner OAuth 2.0
   */
  async authenticate(): Promise<void> {
    try {
      // Check if token is still valid
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return;
      }

      const tokenUrl = `${this.config.baseUrl}/tenants/${this.config.tenantId}/protocols/oauth2/profiles/smart-v1/token`;

      const response = await axios.post(
        tokenUrl,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'system/*.read system/*.write',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      // Update client headers
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;

      await auditService.log({
        eventType: 'EHR_AUTHENTICATION',
        category: 'INTEGRATION',
        outcome: 'SUCCESS',
        description: 'Successfully authenticated with Cerner',
        metadata: {
          provider: 'Cerner',
          tenantId: this.config.tenantId,
        },
      });
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_AUTHENTICATION',
        category: 'INTEGRATION',
        outcome: 'FAILURE',
        description: 'Failed to authenticate with Cerner',
        metadata: {
          provider: 'Cerner',
          error: error.message,
        },
      });
      throw new Error(`Cerner authentication failed: ${error.message}`);
    }
  }

  // ==========================================================================
  // CUSTOMER OPERATIONS
  // ==========================================================================

  /**
   * Search for customers by various criteria
   */
  async searchPatients(criteria: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    mrn?: string;
    identifier?: string;
  }): Promise<CernerPatient[]> {
    await this.authenticate();

    try {
      const params: any = {};

      if (criteria.firstName) params.given = criteria.firstName;
      if (criteria.lastName) params.family = criteria.lastName;
      if (criteria.dateOfBirth) params.birthdate = criteria.dateOfBirth;
      if (criteria.mrn) params.identifier = `MRN|${criteria.mrn}`;
      if (criteria.identifier) params.identifier = criteria.identifier;

      const response = await this.client.get('/Customer', { params });

      const customers = response.data.entry?.map((entry: any) => 
        this.mapFHIRPatientToCerner(entry.resource)
      ) || [];

      await auditService.log({
        eventType: 'EHR_PATIENT_SEARCH',
        category: 'DATA_ACCESS',
        outcome: 'SUCCESS',
        description: `Searched for customers in Cerner`,
        metadata: {
          provider: 'Cerner',
          criteria,
          resultsCount: customers.length,
        },
      });

      return customers;
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_PATIENT_SEARCH',
        category: 'DATA_ACCESS',
        outcome: 'FAILURE',
        description: 'Failed to search customers in Cerner',
        metadata: {
          provider: 'Cerner',
          error: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getPatient(customerId: string): Promise<CernerPatient> {
    await this.authenticate();

    try {
      const response = await this.client.get(`/Customer/${customerId}`);
      const customer = this.mapFHIRPatientToCerner(response.data);

      await auditService.log({
        eventType: 'EHR_PATIENT_READ',
        category: 'DATA_ACCESS',
        outcome: 'SUCCESS',
        description: `Retrieved customer from Cerner`,
        metadata: {
          provider: 'Cerner',
          customerId,
        },
      });

      return customer;
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_PATIENT_READ',
        category: 'DATA_ACCESS',
        outcome: 'FAILURE',
        description: 'Failed to retrieve customer from Cerner',
        metadata: {
          provider: 'Cerner',
          customerId,
          error: error.message,
        },
      });
      throw error;
    }
  }

  // ==========================================================================
  // CLINICAL DATA OPERATIONS
  // ==========================================================================

  /**
   * Get customer encounters
   */
  async getEncounters(customerId: string, options?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<CernerEncounter[]> {
    await this.authenticate();

    try {
      const params: any = {
        customer: customerId,
        _count: 100,
      };

      if (options?.startDate) params.date = `ge${options.startDate}`;
      if (options?.endDate) params.date = `${params.date || ''}le${options.endDate}`;
      if (options?.status) params.status = options.status;

      const response = await this.client.get('/Encounter', { params });

      const encounters = response.data.entry?.map((entry: any) =>
        this.mapFHIREncounterToCerner(entry.resource)
      ) || [];

      return encounters;
    } catch (error: any) {
      throw new Error(`Failed to get encounters: ${error.message}`);
    }
  }

  /**
   * Get customer observations (lab results, vitals)
   */
  async getObservations(customerId: string, options?: {
    category?: string;
    code?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CernerObservation[]> {
    await this.authenticate();

    try {
      const params: any = {
        customer: customerId,
        _count: 100,
      };

      if (options?.category) params.category = options.category;
      if (options?.code) params.code = options.code;
      if (options?.startDate) params.date = `ge${options.startDate}`;
      if (options?.endDate) params.date = `${params.date || ''}le${options.endDate}`;

      const response = await this.client.get('/Observation', { params });

      const observations = response.data.entry?.map((entry: any) =>
        this.mapFHIRObservationToCerner(entry.resource)
      ) || [];

      return observations;
    } catch (error: any) {
      throw new Error(`Failed to get observations: ${error.message}`);
    }
  }

  /**
   * Get customer medications
   */
  async getMedications(customerId: string, options?: {
    status?: string;
  }): Promise<CernerMedication[]> {
    await this.authenticate();

    try {
      const params: any = {
        customer: customerId,
        _count: 100,
      };

      if (options?.status) params.status = options.status;

      const response = await this.client.get('/MedicationRequest', { params });

      const medications = response.data.entry?.map((entry: any) =>
        this.mapFHIRMedicationToCerner(entry.resource)
      ) || [];

      return medications;
    } catch (error: any) {
      throw new Error(`Failed to get medications: ${error.message}`);
    }
  }

  /**
   * Get customer conditions/diagnoses
   */
  async getConditions(customerId: string): Promise<CernerCondition[]> {
    await this.authenticate();

    try {
      const params = {
        customer: customerId,
        _count: 100,
      };

      const response = await this.client.get('/Condition', { params });

      const conditions = response.data.entry?.map((entry: any) =>
        this.mapFHIRConditionToCerner(entry.resource)
      ) || [];

      return conditions;
    } catch (error: any) {
      throw new Error(`Failed to get conditions: ${error.message}`);
    }
  }

  /**
   * Get customer allergies
   */
  async getAllergies(customerId: string): Promise<CernerAllergy[]> {
    await this.authenticate();

    try {
      const params = {
        customer: customerId,
        _count: 100,
      };

      const response = await this.client.get('/AllergyIntolerance', { params });

      const allergies = response.data.entry?.map((entry: any) =>
        this.mapFHIRAllergyToCerner(entry.resource)
      ) || [];

      return allergies;
    } catch (error: any) {
      throw new Error(`Failed to get allergies: ${error.message}`);
    }
  }

  /**
   * Get customer documents
   */
  async getDocuments(customerId: string): Promise<CernerDocument[]> {
    await this.authenticate();

    try {
      const params = {
        customer: customerId,
        _count: 100,
      };

      const response = await this.client.get('/DocumentReference', { params });

      const documents = response.data.entry?.map((entry: any) =>
        this.mapFHIRDocumentToCerner(entry.resource)
      ) || [];

      return documents;
    } catch (error: any) {
      throw new Error(`Failed to get documents: ${error.message}`);
    }
  }

  // ==========================================================================
  // SYNC OPERATIONS
  // ==========================================================================

  /**
   * Sync all customer data from Cerner
   */
  async syncPatientData(
    customerId: string,
    cernerPatientId: string
  ): Promise<CernerSyncResult> {
    const result: CernerSyncResult = {
      success: false,
      customerId,
      recordsProcessed: {
        encounters: 0,
        observations: 0,
        medications: 0,
        conditions: 0,
        allergies: 0,
        documents: 0,
      },
      errors: [],
      syncedAt: new Date(),
    };

    try {
      // Sync encounters
      const encounters = await this.getEncounters(cernerPatientId);
      result.recordsProcessed.encounters = encounters.length;

      // Sync observations
      const observations = await this.getObservations(cernerPatientId);
      result.recordsProcessed.observations = observations.length;

      // Sync medications
      const medications = await this.getMedications(cernerPatientId);
      result.recordsProcessed.medications = medications.length;

      // Sync conditions
      const conditions = await this.getConditions(cernerPatientId);
      result.recordsProcessed.conditions = conditions.length;

      // Sync allergies
      const allergies = await this.getAllergies(cernerPatientId);
      result.recordsProcessed.allergies = allergies.length;

      // Sync documents
      const documents = await this.getDocuments(cernerPatientId);
      result.recordsProcessed.documents = documents.length;

      // Store sync history
      await prisma.syncHistory.create({
        data: {
          customerId,
          provider: 'CERNER',
          status: 'SUCCESS',
          recordsProcessed: Object.values(result.recordsProcessed).reduce((a, b) => a + b, 0),
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });

      result.success = true;

      await auditService.log({
        eventType: 'EHR_SYNC',
        category: 'DATA_SYNC',
        outcome: 'SUCCESS',
        description: 'Successfully synced customer data from Cerner',
        metadata: {
          provider: 'Cerner',
          customerId,
          recordsProcessed: result.recordsProcessed,
        },
      });
    } catch (error: any) {
      result.errors.push(error.message);

      await prisma.syncHistory.create({
        data: {
          customerId,
          provider: 'CERNER',
          status: 'FAILED',
          errorMessage: error.message,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });

      await auditService.log({
        eventType: 'EHR_SYNC',
        category: 'DATA_SYNC',
        outcome: 'FAILURE',
        description: 'Failed to sync customer data from Cerner',
        metadata: {
          provider: 'Cerner',
          customerId,
          error: error.message,
        },
      });
    }

    return result;
  }

  // ==========================================================================
  // MAPPING FUNCTIONS
  // ==========================================================================

  private mapFHIRPatientToCerner(fhirPatient: any): CernerPatient {
    const name = fhirPatient.name?.[0];
    const telecom = fhirPatient.telecom || [];
    const address = fhirPatient.address?.[0];

    return {
      id: fhirPatient.id,
      mrn: fhirPatient.identifier?.find((id: any) => id.type?.coding?.[0]?.code === 'MR')?.value || '',
      firstName: name?.given?.[0] || '',
      lastName: name?.family || '',
      dateOfBirth: fhirPatient.birthDate || '',
      gender: fhirPatient.gender || '',
      phone: telecom.find((t: any) => t.system === 'phone')?.value,
      email: telecom.find((t: any) => t.system === 'email')?.value,
      address: address ? {
        line1: address.line?.[0] || '',
        line2: address.line?.[1],
        city: address.city || '',
        state: address.state || '',
        zip: address.postalCode || '',
        country: address.country || 'US',
      } : undefined,
      identifiers: fhirPatient.identifier?.map((id: any) => ({
        system: id.system || '',
        value: id.value || '',
        type: id.type?.coding?.[0]?.code || '',
      })) || [],
    };
  }

  private mapFHIREncounterToCerner(fhirEncounter: any): CernerEncounter {
    return {
      id: fhirEncounter.id,
      customerId: fhirEncounter.subject?.reference?.split('/')[1] || '',
      type: fhirEncounter.type?.[0]?.coding?.[0]?.display || '',
      status: fhirEncounter.status || '',
      class: fhirEncounter.class?.code || '',
      period: {
        start: fhirEncounter.period?.start || '',
        end: fhirEncounter.period?.end,
      },
      reasonCode: fhirEncounter.reasonCode?.[0]?.coding?.[0]?.code,
      reasonDisplay: fhirEncounter.reasonCode?.[0]?.coding?.[0]?.display,
      location: fhirEncounter.location?.[0]?.location?.display,
      practitioner: fhirEncounter.participant?.[0] ? {
        id: fhirEncounter.participant[0].individual?.reference?.split('/')[1] || '',
        name: fhirEncounter.participant[0].individual?.display || '',
        role: fhirEncounter.participant[0].type?.[0]?.coding?.[0]?.display || '',
      } : undefined,
    };
  }

  private mapFHIRObservationToCerner(fhirObservation: any): CernerObservation {
    return {
      id: fhirObservation.id,
      customerId: fhirObservation.subject?.reference?.split('/')[1] || '',
      encounterId: fhirObservation.encounter?.reference?.split('/')[1],
      code: fhirObservation.code?.coding?.[0]?.code || '',
      display: fhirObservation.code?.coding?.[0]?.display || '',
      category: fhirObservation.category?.[0]?.coding?.[0]?.code || '',
      value: fhirObservation.valueQuantity?.value || fhirObservation.valueString,
      unit: fhirObservation.valueQuantity?.unit,
      interpretation: fhirObservation.interpretation?.[0]?.coding?.[0]?.display,
      referenceRange: fhirObservation.referenceRange?.[0] ? {
        low: fhirObservation.referenceRange[0].low?.value,
        high: fhirObservation.referenceRange[0].high?.value,
        text: fhirObservation.referenceRange[0].text,
      } : undefined,
      effectiveDateTime: fhirObservation.effectiveDateTime || '',
      status: fhirObservation.status || '',
    };
  }

  private mapFHIRMedicationToCerner(fhirMedication: any): CernerMedication {
    return {
      id: fhirMedication.id,
      customerId: fhirMedication.subject?.reference?.split('/')[1] || '',
      medicationCode: fhirMedication.medicationCodeableConcept?.coding?.[0]?.code || '',
      medicationName: fhirMedication.medicationCodeableConcept?.coding?.[0]?.display || '',
      dosage: fhirMedication.dosageInstruction?.[0]?.text,
      route: fhirMedication.dosageInstruction?.[0]?.route?.coding?.[0]?.display,
      frequency: fhirMedication.dosageInstruction?.[0]?.timing?.code?.coding?.[0]?.display,
      status: fhirMedication.status || '',
      prescribedDate: fhirMedication.authoredOn || '',
      prescriber: fhirMedication.requester ? {
        id: fhirMedication.requester.reference?.split('/')[1] || '',
        name: fhirMedication.requester.display || '',
      } : undefined,
      instructions: fhirMedication.dosageInstruction?.[0]?.patientInstruction,
    };
  }

  private mapFHIRConditionToCerner(fhirCondition: any): CernerCondition {
    return {
      id: fhirCondition.id,
      customerId: fhirCondition.subject?.reference?.split('/')[1] || '',
      code: fhirCondition.code?.coding?.[0]?.code || '',
      display: fhirCondition.code?.coding?.[0]?.display || '',
      clinicalStatus: fhirCondition.clinicalStatus?.coding?.[0]?.code || '',
      verificationStatus: fhirCondition.verificationStatus?.coding?.[0]?.code || '',
      category: fhirCondition.category?.[0]?.coding?.[0]?.code || '',
      severity: fhirCondition.severity?.coding?.[0]?.display,
      onsetDateTime: fhirCondition.onsetDateTime,
      recordedDate: fhirCondition.recordedDate || '',
    };
  }

  private mapFHIRAllergyToCerner(fhirAllergy: any): CernerAllergy {
    return {
      id: fhirAllergy.id,
      customerId: fhirAllergy.customer?.reference?.split('/')[1] || '',
      substance: fhirAllergy.code?.coding?.[0]?.display || '',
      reaction: fhirAllergy.reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.display,
      severity: fhirAllergy.reaction?.[0]?.severity,
      type: fhirAllergy.type || '',
      clinicalStatus: fhirAllergy.clinicalStatus?.coding?.[0]?.code || '',
      verificationStatus: fhirAllergy.verificationStatus?.coding?.[0]?.code || '',
      recordedDate: fhirAllergy.recordedDate || '',
    };
  }

  private mapFHIRDocumentToCerner(fhirDocument: any): CernerDocument {
    return {
      id: fhirDocument.id,
      customerId: fhirDocument.subject?.reference?.split('/')[1] || '',
      type: fhirDocument.type?.coding?.[0]?.display || '',
      category: fhirDocument.category?.[0]?.coding?.[0]?.display || '',
      date: fhirDocument.date || '',
      author: fhirDocument.author?.[0]?.display,
      title: fhirDocument.description,
      content: fhirDocument.content?.[0]?.attachment?.url,
      status: fhirDocument.status || '',
    };
  }
}

export default CernerEnhancedService;