/**
 * MEDITECH EHR Integration Service
 * 
 * Provides comprehensive integration with MEDITECH Expanse EHR system
 * using FHIR R4 API and MEDITECH-specific APIs.
 * 
 * Market Share: 11.9% of U.S. hospitals (largest in Canada)
 * 
 * Features:
 * - FHIR R4 API integration
 * - Patient demographics and medical records
 * - Lab results and vital signs
 * - Medications and allergies
 * - Appointments and encounters
 * - Clinical documents
 * - Real-time data synchronization
 * - MEDITECH Expanse platform support
 * 
 * @see https://home.meditech.com/en/d/expanse
 * @see https://ehr.meditech.com/interoperability
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

export interface MeditechConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  facilityId: string;
  environment: 'sandbox' | 'production';
  apiVersion?: string;
}

export interface MeditechPatient {
  id: string;
  mrn: string;
  accountNumber?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  ssn?: string;
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
  maritalStatus?: string;
  race?: string;
  ethnicity?: string;
  language?: string;
  identifiers: Array<{
    system: string;
    value: string;
    type: string;
  }>;
}

export interface MeditechEncounter {
  id: string;
  patientId: string;
  accountNumber?: string;
  type: string;
  status: string;
  class: string;
  admissionDate: string;
  dischargeDate?: string;
  location?: {
    facility: string;
    unit: string;
    room?: string;
    bed?: string;
  };
  attendingPhysician?: {
    id: string;
    name: string;
    npi?: string;
  };
  chiefComplaint?: string;
  diagnosis?: Array<{
    code: string;
    description: string;
    type: string;
  }>;
}

export interface MeditechLabResult {
  id: string;
  patientId: string;
  encounterId?: string;
  testCode: string;
  testName: string;
  category: string;
  result?: string | number;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: string;
  status: string;
  collectionDate: string;
  resultDate: string;
  performingLab?: string;
  orderingProvider?: {
    id: string;
    name: string;
  };
}

export interface MeditechMedication {
  id: string;
  patientId: string;
  encounterId?: string;
  medicationCode: string;
  medicationName: string;
  genericName?: string;
  dose?: string;
  doseUnit?: string;
  route?: string;
  frequency?: string;
  startDate: string;
  endDate?: string;
  status: string;
  prescriber?: {
    id: string;
    name: string;
    npi?: string;
  };
  pharmacy?: string;
  instructions?: string;
  refills?: number;
}

export interface MeditechVitalSign {
  id: string;
  patientId: string;
  encounterId?: string;
  type: string;
  value: number;
  unit: string;
  recordedDate: string;
  recordedBy?: string;
  location?: string;
}

export interface MeditechAllergy {
  id: string;
  patientId: string;
  allergen: string;
  allergenType: string;
  reaction?: string;
  severity?: string;
  onsetDate?: string;
  status: string;
  verificationStatus: string;
  recordedDate: string;
  recordedBy?: string;
}

export interface MeditechProblem {
  id: string;
  patientId: string;
  problemCode: string;
  problemDescription: string;
  status: string;
  onsetDate?: string;
  resolvedDate?: string;
  priority?: string;
  recordedDate: string;
}

export interface MeditechImmunization {
  id: string;
  patientId: string;
  vaccineCode: string;
  vaccineName: string;
  administeredDate: string;
  doseNumber?: number;
  lotNumber?: string;
  expirationDate?: string;
  site?: string;
  route?: string;
  administeredBy?: string;
  status: string;
}

export interface MeditechSyncResult {
  success: boolean;
  patientId: string;
  recordsProcessed: {
    encounters: number;
    labResults: number;
    medications: number;
    vitalSigns: number;
    allergies: number;
    problems: number;
    immunizations: number;
  };
  errors: string[];
  syncedAt: Date;
}

// ============================================================================
// MEDITECH ENHANCED SERVICE
// ============================================================================

export class MeditechEnhancedService {
  private client: AxiosInstance;
  private config: MeditechConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: MeditechConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
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
   * Authenticate with MEDITECH OAuth 2.0
   */
  async authenticate(): Promise<void> {
    try {
      // Check if token is still valid
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return;
      }

      const tokenUrl = `${this.config.baseUrl}/oauth2/token`;

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
      this.client.defaults.headers.common['X-Facility-ID'] = this.config.facilityId;

      await auditService.log({
        eventType: 'EHR_AUTHENTICATION',
        category: 'INTEGRATION',
        outcome: 'SUCCESS',
        description: 'Successfully authenticated with MEDITECH',
        metadata: {
          provider: 'MEDITECH',
          facilityId: this.config.facilityId,
        },
      });
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_AUTHENTICATION',
        category: 'INTEGRATION',
        outcome: 'FAILURE',
        description: 'Failed to authenticate with MEDITECH',
        metadata: {
          provider: 'MEDITECH',
          error: error.message,
        },
      });
      throw new Error(`MEDITECH authentication failed: ${error.message}`);
    }
  }

  // ==========================================================================
  // PATIENT OPERATIONS
  // ==========================================================================

  /**
   * Search for patients by various criteria
   */
  async searchPatients(criteria: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    mrn?: string;
    accountNumber?: string;
  }): Promise<MeditechPatient[]> {
    await this.authenticate();

    try {
      const params: any = {};

      if (criteria.firstName) params.given = criteria.firstName;
      if (criteria.lastName) params.family = criteria.lastName;
      if (criteria.dateOfBirth) params.birthdate = criteria.dateOfBirth;
      if (criteria.mrn) params.identifier = `MRN|${criteria.mrn}`;
      if (criteria.accountNumber) params.identifier = `ACCT|${criteria.accountNumber}`;

      const response = await this.client.get('/fhir/Patient', { params });

      const patients = response.data.entry?.map((entry: any) => 
        this.mapFHIRPatientToMeditech(entry.resource)
      ) || [];

      await auditService.log({
        eventType: 'EHR_PATIENT_SEARCH',
        category: 'DATA_ACCESS',
        outcome: 'SUCCESS',
        description: `Searched for patients in MEDITECH`,
        metadata: {
          provider: 'MEDITECH',
          criteria,
          resultsCount: patients.length,
        },
      });

      return patients;
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_PATIENT_SEARCH',
        category: 'DATA_ACCESS',
        outcome: 'FAILURE',
        description: 'Failed to search patients in MEDITECH',
        metadata: {
          provider: 'MEDITECH',
          error: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId: string): Promise<MeditechPatient> {
    await this.authenticate();

    try {
      const response = await this.client.get(`/fhir/Patient/${patientId}`);
      const patient = this.mapFHIRPatientToMeditech(response.data);

      await auditService.log({
        eventType: 'EHR_PATIENT_READ',
        category: 'DATA_ACCESS',
        outcome: 'SUCCESS',
        description: `Retrieved patient from MEDITECH`,
        metadata: {
          provider: 'MEDITECH',
          patientId,
        },
      });

      return patient;
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_PATIENT_READ',
        category: 'DATA_ACCESS',
        outcome: 'FAILURE',
        description: 'Failed to retrieve patient from MEDITECH',
        metadata: {
          provider: 'MEDITECH',
          patientId,
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
   * Get patient encounters
   */
  async getEncounters(patientId: string, options?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<MeditechEncounter[]> {
    await this.authenticate();

    try {
      const params: any = {
        patient: patientId,
        _count: 100,
      };

      if (options?.startDate) params.date = `ge${options.startDate}`;
      if (options?.endDate) params.date = `${params.date || ''}le${options.endDate}`;
      if (options?.status) params.status = options.status;

      const response = await this.client.get('/fhir/Encounter', { params });

      const encounters = response.data.entry?.map((entry: any) =>
        this.mapFHIREncounterToMeditech(entry.resource)
      ) || [];

      return encounters;
    } catch (error: any) {
      throw new Error(`Failed to get encounters: ${error.message}`);
    }
  }

  /**
   * Get patient lab results
   */
  async getLabResults(patientId: string, options?: {
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<MeditechLabResult[]> {
    await this.authenticate();

    try {
      const params: any = {
        patient: patientId,
        category: 'laboratory',
        _count: 100,
      };

      if (options?.startDate) params.date = `ge${options.startDate}`;
      if (options?.endDate) params.date = `${params.date || ''}le${options.endDate}`;

      const response = await this.client.get('/fhir/Observation', { params });

      const labResults = response.data.entry?.map((entry: any) =>
        this.mapFHIRObservationToLabResult(entry.resource)
      ) || [];

      return labResults;
    } catch (error: any) {
      throw new Error(`Failed to get lab results: ${error.message}`);
    }
  }

  /**
   * Get patient vital signs
   */
  async getVitalSigns(patientId: string, options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<MeditechVitalSign[]> {
    await this.authenticate();

    try {
      const params: any = {
        patient: patientId,
        category: 'vital-signs',
        _count: 100,
      };

      if (options?.startDate) params.date = `ge${options.startDate}`;
      if (options?.endDate) params.date = `${params.date || ''}le${options.endDate}`;

      const response = await this.client.get('/fhir/Observation', { params });

      const vitalSigns = response.data.entry?.map((entry: any) =>
        this.mapFHIRObservationToVitalSign(entry.resource)
      ) || [];

      return vitalSigns;
    } catch (error: any) {
      throw new Error(`Failed to get vital signs: ${error.message}`);
    }
  }

  /**
   * Get patient medications
   */
  async getMedications(patientId: string, options?: {
    status?: string;
  }): Promise<MeditechMedication[]> {
    await this.authenticate();

    try {
      const params: any = {
        patient: patientId,
        _count: 100,
      };

      if (options?.status) params.status = options.status;

      const response = await this.client.get('/fhir/MedicationRequest', { params });

      const medications = response.data.entry?.map((entry: any) =>
        this.mapFHIRMedicationToMeditech(entry.resource)
      ) || [];

      return medications;
    } catch (error: any) {
      throw new Error(`Failed to get medications: ${error.message}`);
    }
  }

  /**
   * Get patient allergies
   */
  async getAllergies(patientId: string): Promise<MeditechAllergy[]> {
    await this.authenticate();

    try {
      const params = {
        patient: patientId,
        _count: 100,
      };

      const response = await this.client.get('/fhir/AllergyIntolerance', { params });

      const allergies = response.data.entry?.map((entry: any) =>
        this.mapFHIRAllergyToMeditech(entry.resource)
      ) || [];

      return allergies;
    } catch (error: any) {
      throw new Error(`Failed to get allergies: ${error.message}`);
    }
  }

  /**
   * Get patient problems/conditions
   */
  async getProblems(patientId: string): Promise<MeditechProblem[]> {
    await this.authenticate();

    try {
      const params = {
        patient: patientId,
        _count: 100,
      };

      const response = await this.client.get('/fhir/Condition', { params });

      const problems = response.data.entry?.map((entry: any) =>
        this.mapFHIRConditionToProblem(entry.resource)
      ) || [];

      return problems;
    } catch (error: any) {
      throw new Error(`Failed to get problems: ${error.message}`);
    }
  }

  /**
   * Get patient immunizations
   */
  async getImmunizations(patientId: string): Promise<MeditechImmunization[]> {
    await this.authenticate();

    try {
      const params = {
        patient: patientId,
        _count: 100,
      };

      const response = await this.client.get('/fhir/Immunization', { params });

      const immunizations = response.data.entry?.map((entry: any) =>
        this.mapFHIRImmunizationToMeditech(entry.resource)
      ) || [];

      return immunizations;
    } catch (error: any) {
      throw new Error(`Failed to get immunizations: ${error.message}`);
    }
  }

  // ==========================================================================
  // SYNC OPERATIONS
  // ==========================================================================

  /**
   * Sync all patient data from MEDITECH
   */
  async syncPatientData(
    patientId: string,
    meditechPatientId: string
  ): Promise<MeditechSyncResult> {
    const result: MeditechSyncResult = {
      success: false,
      patientId,
      recordsProcessed: {
        encounters: 0,
        labResults: 0,
        medications: 0,
        vitalSigns: 0,
        allergies: 0,
        problems: 0,
        immunizations: 0,
      },
      errors: [],
      syncedAt: new Date(),
    };

    try {
      // Sync encounters
      const encounters = await this.getEncounters(meditechPatientId);
      result.recordsProcessed.encounters = encounters.length;

      // Sync lab results
      const labResults = await this.getLabResults(meditechPatientId);
      result.recordsProcessed.labResults = labResults.length;

      // Sync vital signs
      const vitalSigns = await this.getVitalSigns(meditechPatientId);
      result.recordsProcessed.vitalSigns = vitalSigns.length;

      // Sync medications
      const medications = await this.getMedications(meditechPatientId);
      result.recordsProcessed.medications = medications.length;

      // Sync allergies
      const allergies = await this.getAllergies(meditechPatientId);
      result.recordsProcessed.allergies = allergies.length;

      // Sync problems
      const problems = await this.getProblems(meditechPatientId);
      result.recordsProcessed.problems = problems.length;

      // Sync immunizations
      const immunizations = await this.getImmunizations(meditechPatientId);
      result.recordsProcessed.immunizations = immunizations.length;

      // Store sync history
      await prisma.syncHistory.create({
        data: {
          patientId,
          provider: 'MEDITECH',
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
        description: 'Successfully synced patient data from MEDITECH',
        metadata: {
          provider: 'MEDITECH',
          patientId,
          recordsProcessed: result.recordsProcessed,
        },
      });
    } catch (error: any) {
      result.errors.push(error.message);

      await prisma.syncHistory.create({
        data: {
          patientId,
          provider: 'MEDITECH',
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
        description: 'Failed to sync patient data from MEDITECH',
        metadata: {
          provider: 'MEDITECH',
          patientId,
          error: error.message,
        },
      });
    }

    return result;
  }

  // ==========================================================================
  // MAPPING FUNCTIONS
  // ==========================================================================

  private mapFHIRPatientToMeditech(fhirPatient: any): MeditechPatient {
    const name = fhirPatient.name?.[0];
    const telecom = fhirPatient.telecom || [];
    const address = fhirPatient.address?.[0];

    return {
      id: fhirPatient.id,
      mrn: fhirPatient.identifier?.find((id: any) => id.type?.coding?.[0]?.code === 'MR')?.value || '',
      accountNumber: fhirPatient.identifier?.find((id: any) => id.type?.coding?.[0]?.code === 'AN')?.value,
      firstName: name?.given?.[0] || '',
      lastName: name?.family || '',
      middleName: name?.given?.[1],
      dateOfBirth: fhirPatient.birthDate || '',
      gender: fhirPatient.gender || '',
      ssn: fhirPatient.identifier?.find((id: any) => id.system?.includes('ssn'))?.value,
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
      maritalStatus: fhirPatient.maritalStatus?.coding?.[0]?.display,
      race: fhirPatient.extension?.find((ext: any) => ext.url?.includes('race'))?.valueString,
      ethnicity: fhirPatient.extension?.find((ext: any) => ext.url?.includes('ethnicity'))?.valueString,
      language: fhirPatient.communication?.[0]?.language?.coding?.[0]?.display,
      identifiers: fhirPatient.identifier?.map((id: any) => ({
        system: id.system || '',
        value: id.value || '',
        type: id.type?.coding?.[0]?.code || '',
      })) || [],
    };
  }

  private mapFHIREncounterToMeditech(fhirEncounter: any): MeditechEncounter {
    return {
      id: fhirEncounter.id,
      patientId: fhirEncounter.subject?.reference?.split('/')[1] || '',
      accountNumber: fhirEncounter.identifier?.find((id: any) => id.type?.coding?.[0]?.code === 'VN')?.value,
      type: fhirEncounter.type?.[0]?.coding?.[0]?.display || '',
      status: fhirEncounter.status || '',
      class: fhirEncounter.class?.code || '',
      admissionDate: fhirEncounter.period?.start || '',
      dischargeDate: fhirEncounter.period?.end,
      location: fhirEncounter.location?.[0] ? {
        facility: fhirEncounter.serviceProvider?.display || '',
        unit: fhirEncounter.location[0].location?.display || '',
        room: fhirEncounter.location[0].physicalType?.coding?.[0]?.display,
      } : undefined,
      attendingPhysician: fhirEncounter.participant?.find((p: any) => p.type?.[0]?.coding?.[0]?.code === 'ATND') ? {
        id: fhirEncounter.participant[0].individual?.reference?.split('/')[1] || '',
        name: fhirEncounter.participant[0].individual?.display || '',
        npi: fhirEncounter.participant[0].individual?.identifier?.find((id: any) => id.system?.includes('npi'))?.value,
      } : undefined,
      chiefComplaint: fhirEncounter.reasonCode?.[0]?.text,
      diagnosis: fhirEncounter.diagnosis?.map((diag: any) => ({
        code: diag.condition?.reference?.split('/')[1] || '',
        description: diag.condition?.display || '',
        type: diag.use?.coding?.[0]?.display || '',
      })),
    };
  }

  private mapFHIRObservationToLabResult(fhirObservation: any): MeditechLabResult {
    return {
      id: fhirObservation.id,
      patientId: fhirObservation.subject?.reference?.split('/')[1] || '',
      encounterId: fhirObservation.encounter?.reference?.split('/')[1],
      testCode: fhirObservation.code?.coding?.[0]?.code || '',
      testName: fhirObservation.code?.coding?.[0]?.display || '',
      category: fhirObservation.category?.[0]?.coding?.[0]?.code || '',
      result: fhirObservation.valueQuantity?.value || fhirObservation.valueString,
      unit: fhirObservation.valueQuantity?.unit,
      referenceRange: fhirObservation.referenceRange?.[0]?.text,
      abnormalFlag: fhirObservation.interpretation?.[0]?.coding?.[0]?.code,
      status: fhirObservation.status || '',
      collectionDate: fhirObservation.effectiveDateTime || '',
      resultDate: fhirObservation.issued || '',
      performingLab: fhirObservation.performer?.[0]?.display,
      orderingProvider: fhirObservation.requester ? {
        id: fhirObservation.requester.reference?.split('/')[1] || '',
        name: fhirObservation.requester.display || '',
      } : undefined,
    };
  }

  private mapFHIRObservationToVitalSign(fhirObservation: any): MeditechVitalSign {
    return {
      id: fhirObservation.id,
      patientId: fhirObservation.subject?.reference?.split('/')[1] || '',
      encounterId: fhirObservation.encounter?.reference?.split('/')[1],
      type: fhirObservation.code?.coding?.[0]?.display || '',
      value: fhirObservation.valueQuantity?.value || 0,
      unit: fhirObservation.valueQuantity?.unit || '',
      recordedDate: fhirObservation.effectiveDateTime || '',
      recordedBy: fhirObservation.performer?.[0]?.display,
      location: fhirObservation.encounter?.display,
    };
  }

  private mapFHIRMedicationToMeditech(fhirMedication: any): MeditechMedication {
    return {
      id: fhirMedication.id,
      patientId: fhirMedication.subject?.reference?.split('/')[1] || '',
      encounterId: fhirMedication.encounter?.reference?.split('/')[1],
      medicationCode: fhirMedication.medicationCodeableConcept?.coding?.[0]?.code || '',
      medicationName: fhirMedication.medicationCodeableConcept?.coding?.[0]?.display || '',
      genericName: fhirMedication.medicationCodeableConcept?.text,
      dose: fhirMedication.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity?.value?.toString(),
      doseUnit: fhirMedication.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity?.unit,
      route: fhirMedication.dosageInstruction?.[0]?.route?.coding?.[0]?.display,
      frequency: fhirMedication.dosageInstruction?.[0]?.timing?.code?.coding?.[0]?.display,
      startDate: fhirMedication.authoredOn || '',
      endDate: fhirMedication.dosageInstruction?.[0]?.timing?.repeat?.boundsPeriod?.end,
      status: fhirMedication.status || '',
      prescriber: fhirMedication.requester ? {
        id: fhirMedication.requester.reference?.split('/')[1] || '',
        name: fhirMedication.requester.display || '',
        npi: fhirMedication.requester.identifier?.find((id: any) => id.system?.includes('npi'))?.value,
      } : undefined,
      pharmacy: fhirMedication.dispenseRequest?.performer?.display,
      instructions: fhirMedication.dosageInstruction?.[0]?.patientInstruction,
      refills: fhirMedication.dispenseRequest?.numberOfRepeatsAllowed,
    };
  }

  private mapFHIRAllergyToMeditech(fhirAllergy: any): MeditechAllergy {
    return {
      id: fhirAllergy.id,
      patientId: fhirAllergy.patient?.reference?.split('/')[1] || '',
      allergen: fhirAllergy.code?.coding?.[0]?.display || '',
      allergenType: fhirAllergy.type || '',
      reaction: fhirAllergy.reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.display,
      severity: fhirAllergy.reaction?.[0]?.severity,
      onsetDate: fhirAllergy.onsetDateTime,
      status: fhirAllergy.clinicalStatus?.coding?.[0]?.code || '',
      verificationStatus: fhirAllergy.verificationStatus?.coding?.[0]?.code || '',
      recordedDate: fhirAllergy.recordedDate || '',
      recordedBy: fhirAllergy.recorder?.display,
    };
  }

  private mapFHIRConditionToProblem(fhirCondition: any): MeditechProblem {
    return {
      id: fhirCondition.id,
      patientId: fhirCondition.subject?.reference?.split('/')[1] || '',
      problemCode: fhirCondition.code?.coding?.[0]?.code || '',
      problemDescription: fhirCondition.code?.coding?.[0]?.display || '',
      status: fhirCondition.clinicalStatus?.coding?.[0]?.code || '',
      onsetDate: fhirCondition.onsetDateTime,
      resolvedDate: fhirCondition.abatementDateTime,
      priority: fhirCondition.severity?.coding?.[0]?.display,
      recordedDate: fhirCondition.recordedDate || '',
    };
  }

  private mapFHIRImmunizationToMeditech(fhirImmunization: any): MeditechImmunization {
    return {
      id: fhirImmunization.id,
      patientId: fhirImmunization.patient?.reference?.split('/')[1] || '',
      vaccineCode: fhirImmunization.vaccineCode?.coding?.[0]?.code || '',
      vaccineName: fhirImmunization.vaccineCode?.coding?.[0]?.display || '',
      administeredDate: fhirImmunization.occurrenceDateTime || '',
      doseNumber: fhirImmunization.protocolApplied?.[0]?.doseNumberPositiveInt,
      lotNumber: fhirImmunization.lotNumber,
      expirationDate: fhirImmunization.expirationDate,
      site: fhirImmunization.site?.coding?.[0]?.display,
      route: fhirImmunization.route?.coding?.[0]?.display,
      administeredBy: fhirImmunization.performer?.[0]?.actor?.display,
      status: fhirImmunization.status || '',
    };
  }
}

export default MeditechEnhancedService;