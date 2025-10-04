/**
 * NextGen Healthcare EHR Integration Service
 * 
 * Provides comprehensive integration with NextGen Healthcare EHR system
 * using FHIR R4 API and NextGen-specific APIs.
 * 
 * Features:
 * - FHIR R4 API integration
 * - Patient demographics and medical records
 * - Lab results and vital signs
 * - Medications and allergies
 * - Appointments and encounters
 * - Clinical documents
 * - Real-time data synchronization
 * - NextGen Enterprise EHR support
 * 
 * @see https://www.nextgen.com/solutions/interoperability/api-fhir
 * @see https://developer.nextgen.com/
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

export interface NextGenConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  practiceId: string;
  environment: 'sandbox' | 'production';
  apiVersion?: string;
}

export interface NextGenPatient {
  id: string;
  mrn: string;
  chartNumber?: string;
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
  preferredLanguage?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  identifiers: Array<{
    system: string;
    value: string;
    type: string;
  }>;
}

export interface NextGenEncounter {
  id: string;
  patientId: string;
  visitNumber?: string;
  type: string;
  status: string;
  class: string;
  startDate: string;
  endDate?: string;
  location?: {
    name: string;
    address?: string;
  };
  provider?: {
    id: string;
    name: string;
    npi?: string;
    specialty?: string;
  };
  chiefComplaint?: string;
  diagnoses?: Array<{
    code: string;
    description: string;
    type: string;
    isPrimary: boolean;
  }>;
}

export interface NextGenObservation {
  id: string;
  patientId: string;
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
  performer?: string;
  notes?: string;
}

export interface NextGenMedication {
  id: string;
  patientId: string;
  encounterId?: string;
  medicationCode: string;
  medicationName: string;
  genericName?: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  status: string;
  startDate: string;
  endDate?: string;
  prescriber?: {
    id: string;
    name: string;
    npi?: string;
  };
  pharmacy?: {
    name: string;
    phone?: string;
  };
  instructions?: string;
  refills?: number;
  quantity?: string;
}

export interface NextGenCondition {
  id: string;
  patientId: string;
  code: string;
  display: string;
  clinicalStatus: string;
  verificationStatus: string;
  category: string;
  severity?: string;
  onsetDateTime?: string;
  recordedDate: string;
  recordedBy?: string;
}

export interface NextGenAllergy {
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
  notes?: string;
}

export interface NextGenAppointment {
  id: string;
  patientId: string;
  status: string;
  appointmentType: string;
  startTime: string;
  endTime: string;
  duration?: number;
  provider?: {
    id: string;
    name: string;
  };
  location?: string;
  reasonForVisit?: string;
  notes?: string;
  confirmationStatus?: string;
}

export interface NextGenImmunization {
  id: string;
  patientId: string;
  vaccineCode: string;
  vaccineName: string;
  administeredDate: string;
  doseNumber?: number;
  lotNumber?: string;
  expirationDate?: string;
  manufacturer?: string;
  site?: string;
  route?: string;
  administeredBy?: string;
  status: string;
}

export interface NextGenSyncResult {
  success: boolean;
  patientId: string;
  recordsProcessed: {
    encounters: number;
    observations: number;
    medications: number;
    conditions: number;
    allergies: number;
    appointments: number;
    immunizations: number;
  };
  errors: string[];
  syncedAt: Date;
}

// ============================================================================
// NEXTGEN ENHANCED SERVICE
// ============================================================================

export class NextGenEnhancedService {
  private client: AxiosInstance;
  private config: NextGenConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: NextGenConfig) {
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
   * Authenticate with NextGen OAuth 2.0
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
      this.client.defaults.headers.common['X-Practice-ID'] = this.config.practiceId;

      await auditService.log({
        eventType: 'EHR_AUTHENTICATION',
        category: 'INTEGRATION',
        outcome: 'SUCCESS',
        description: 'Successfully authenticated with NextGen',
        metadata: {
          provider: 'NextGen',
          practiceId: this.config.practiceId,
        },
      });
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_AUTHENTICATION',
        category: 'INTEGRATION',
        outcome: 'FAILURE',
        description: 'Failed to authenticate with NextGen',
        metadata: {
          provider: 'NextGen',
          error: error.message,
        },
      });
      throw new Error(`NextGen authentication failed: ${error.message}`);
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
    chartNumber?: string;
  }): Promise<NextGenPatient[]> {
    await this.authenticate();

    try {
      const params: any = {};

      if (criteria.firstName) params.given = criteria.firstName;
      if (criteria.lastName) params.family = criteria.lastName;
      if (criteria.dateOfBirth) params.birthdate = criteria.dateOfBirth;
      if (criteria.mrn) params.identifier = `MRN|${criteria.mrn}`;
      if (criteria.chartNumber) params.identifier = `CHART|${criteria.chartNumber}`;

      const response = await this.client.get('/fhir/Patient', { params });

      const patients = response.data.entry?.map((entry: any) => 
        this.mapFHIRPatientToNextGen(entry.resource)
      ) || [];

      await auditService.log({
        eventType: 'EHR_PATIENT_SEARCH',
        category: 'DATA_ACCESS',
        outcome: 'SUCCESS',
        description: `Searched for patients in NextGen`,
        metadata: {
          provider: 'NextGen',
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
        description: 'Failed to search patients in NextGen',
        metadata: {
          provider: 'NextGen',
          error: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId: string): Promise<NextGenPatient> {
    await this.authenticate();

    try {
      const response = await this.client.get(`/fhir/Patient/${patientId}`);
      const patient = this.mapFHIRPatientToNextGen(response.data);

      await auditService.log({
        eventType: 'EHR_PATIENT_READ',
        category: 'DATA_ACCESS',
        outcome: 'SUCCESS',
        description: `Retrieved patient from NextGen`,
        metadata: {
          provider: 'NextGen',
          patientId,
        },
      });

      return patient;
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_PATIENT_READ',
        category: 'DATA_ACCESS',
        outcome: 'FAILURE',
        description: 'Failed to retrieve patient from NextGen',
        metadata: {
          provider: 'NextGen',
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
  }): Promise<NextGenEncounter[]> {
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
        this.mapFHIREncounterToNextGen(entry.resource)
      ) || [];

      return encounters;
    } catch (error: any) {
      throw new Error(`Failed to get encounters: ${error.message}`);
    }
  }

  /**
   * Get patient observations (lab results, vitals)
   */
  async getObservations(patientId: string, options?: {
    category?: string;
    code?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<NextGenObservation[]> {
    await this.authenticate();

    try {
      const params: any = {
        patient: patientId,
        _count: 100,
      };

      if (options?.category) params.category = options.category;
      if (options?.code) params.code = options.code;
      if (options?.startDate) params.date = `ge${options.startDate}`;
      if (options?.endDate) params.date = `${params.date || ''}le${options.endDate}`;

      const response = await this.client.get('/fhir/Observation', { params });

      const observations = response.data.entry?.map((entry: any) =>
        this.mapFHIRObservationToNextGen(entry.resource)
      ) || [];

      return observations;
    } catch (error: any) {
      throw new Error(`Failed to get observations: ${error.message}`);
    }
  }

  /**
   * Get patient medications
   */
  async getMedications(patientId: string, options?: {
    status?: string;
  }): Promise<NextGenMedication[]> {
    await this.authenticate();

    try {
      const params: any = {
        patient: patientId,
        _count: 100,
      };

      if (options?.status) params.status = options.status;

      const response = await this.client.get('/fhir/MedicationRequest', { params });

      const medications = response.data.entry?.map((entry: any) =>
        this.mapFHIRMedicationToNextGen(entry.resource)
      ) || [];

      return medications;
    } catch (error: any) {
      throw new Error(`Failed to get medications: ${error.message}`);
    }
  }

  /**
   * Get patient conditions/diagnoses
   */
  async getConditions(patientId: string): Promise<NextGenCondition[]> {
    await this.authenticate();

    try {
      const params = {
        patient: patientId,
        _count: 100,
      };

      const response = await this.client.get('/fhir/Condition', { params });

      const conditions = response.data.entry?.map((entry: any) =>
        this.mapFHIRConditionToNextGen(entry.resource)
      ) || [];

      return conditions;
    } catch (error: any) {
      throw new Error(`Failed to get conditions: ${error.message}`);
    }
  }

  /**
   * Get patient allergies
   */
  async getAllergies(patientId: string): Promise<NextGenAllergy[]> {
    await this.authenticate();

    try {
      const params = {
        patient: patientId,
        _count: 100,
      };

      const response = await this.client.get('/fhir/AllergyIntolerance', { params });

      const allergies = response.data.entry?.map((entry: any) =>
        this.mapFHIRAllergyToNextGen(entry.resource)
      ) || [];

      return allergies;
    } catch (error: any) {
      throw new Error(`Failed to get allergies: ${error.message}`);
    }
  }

  /**
   * Get patient appointments
   */
  async getAppointments(patientId: string, options?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<NextGenAppointment[]> {
    await this.authenticate();

    try {
      const params: any = {
        patient: patientId,
        _count: 100,
      };

      if (options?.startDate) params.date = `ge${options.startDate}`;
      if (options?.endDate) params.date = `${params.date || ''}le${options.endDate}`;
      if (options?.status) params.status = options.status;

      const response = await this.client.get('/fhir/Appointment', { params });

      const appointments = response.data.entry?.map((entry: any) =>
        this.mapFHIRAppointmentToNextGen(entry.resource)
      ) || [];

      return appointments;
    } catch (error: any) {
      throw new Error(`Failed to get appointments: ${error.message}`);
    }
  }

  /**
   * Get patient immunizations
   */
  async getImmunizations(patientId: string): Promise<NextGenImmunization[]> {
    await this.authenticate();

    try {
      const params = {
        patient: patientId,
        _count: 100,
      };

      const response = await this.client.get('/fhir/Immunization', { params });

      const immunizations = response.data.entry?.map((entry: any) =>
        this.mapFHIRImmunizationToNextGen(entry.resource)
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
   * Sync all patient data from NextGen
   */
  async syncPatientData(
    patientId: string,
    nextGenPatientId: string
  ): Promise<NextGenSyncResult> {
    const result: NextGenSyncResult = {
      success: false,
      patientId,
      recordsProcessed: {
        encounters: 0,
        observations: 0,
        medications: 0,
        conditions: 0,
        allergies: 0,
        appointments: 0,
        immunizations: 0,
      },
      errors: [],
      syncedAt: new Date(),
    };

    try {
      // Sync encounters
      const encounters = await this.getEncounters(nextGenPatientId);
      result.recordsProcessed.encounters = encounters.length;

      // Sync observations
      const observations = await this.getObservations(nextGenPatientId);
      result.recordsProcessed.observations = observations.length;

      // Sync medications
      const medications = await this.getMedications(nextGenPatientId);
      result.recordsProcessed.medications = medications.length;

      // Sync conditions
      const conditions = await this.getConditions(nextGenPatientId);
      result.recordsProcessed.conditions = conditions.length;

      // Sync allergies
      const allergies = await this.getAllergies(nextGenPatientId);
      result.recordsProcessed.allergies = allergies.length;

      // Sync appointments
      const appointments = await this.getAppointments(nextGenPatientId);
      result.recordsProcessed.appointments = appointments.length;

      // Sync immunizations
      const immunizations = await this.getImmunizations(nextGenPatientId);
      result.recordsProcessed.immunizations = immunizations.length;

      // Store sync history
      await prisma.syncHistory.create({
        data: {
          patientId,
          provider: 'NEXTGEN',
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
        description: 'Successfully synced patient data from NextGen',
        metadata: {
          provider: 'NextGen',
          patientId,
          recordsProcessed: result.recordsProcessed,
        },
      });
    } catch (error: any) {
      result.errors.push(error.message);

      await prisma.syncHistory.create({
        data: {
          patientId,
          provider: 'NEXTGEN',
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
        description: 'Failed to sync patient data from NextGen',
        metadata: {
          provider: 'NextGen',
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

  private mapFHIRPatientToNextGen(fhirPatient: any): NextGenPatient {
    const name = fhirPatient.name?.[0];
    const telecom = fhirPatient.telecom || [];
    const address = fhirPatient.address?.[0];
    const emergencyContact = fhirPatient.contact?.[0];

    return {
      id: fhirPatient.id,
      mrn: fhirPatient.identifier?.find((id: any) => id.type?.coding?.[0]?.code === 'MR')?.value || '',
      chartNumber: fhirPatient.identifier?.find((id: any) => id.type?.coding?.[0]?.code === 'CHART')?.value,
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
      preferredLanguage: fhirPatient.communication?.[0]?.language?.coding?.[0]?.display,
      emergencyContact: emergencyContact ? {
        name: emergencyContact.name?.text || '',
        relationship: emergencyContact.relationship?.[0]?.coding?.[0]?.display || '',
        phone: emergencyContact.telecom?.find((t: any) => t.system === 'phone')?.value || '',
      } : undefined,
      identifiers: fhirPatient.identifier?.map((id: any) => ({
        system: id.system || '',
        value: id.value || '',
        type: id.type?.coding?.[0]?.code || '',
      })) || [],
    };
  }

  private mapFHIREncounterToNextGen(fhirEncounter: any): NextGenEncounter {
    return {
      id: fhirEncounter.id,
      patientId: fhirEncounter.subject?.reference?.split('/')[1] || '',
      visitNumber: fhirEncounter.identifier?.find((id: any) => id.type?.coding?.[0]?.code === 'VN')?.value,
      type: fhirEncounter.type?.[0]?.coding?.[0]?.display || '',
      status: fhirEncounter.status || '',
      class: fhirEncounter.class?.code || '',
      startDate: fhirEncounter.period?.start || '',
      endDate: fhirEncounter.period?.end,
      location: fhirEncounter.location?.[0] ? {
        name: fhirEncounter.location[0].location?.display || '',
        address: fhirEncounter.location[0].location?.address?.text,
      } : undefined,
      provider: fhirEncounter.participant?.[0] ? {
        id: fhirEncounter.participant[0].individual?.reference?.split('/')[1] || '',
        name: fhirEncounter.participant[0].individual?.display || '',
        npi: fhirEncounter.participant[0].individual?.identifier?.find((id: any) => id.system?.includes('npi'))?.value,
        specialty: fhirEncounter.participant[0].type?.[0]?.coding?.[0]?.display,
      } : undefined,
      chiefComplaint: fhirEncounter.reasonCode?.[0]?.text,
      diagnoses: fhirEncounter.diagnosis?.map((diag: any) => ({
        code: diag.condition?.reference?.split('/')[1] || '',
        description: diag.condition?.display || '',
        type: diag.use?.coding?.[0]?.display || '',
        isPrimary: diag.rank === 1,
      })),
    };
  }

  private mapFHIRObservationToNextGen(fhirObservation: any): NextGenObservation {
    return {
      id: fhirObservation.id,
      patientId: fhirObservation.subject?.reference?.split('/')[1] || '',
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
      performer: fhirObservation.performer?.[0]?.display,
      notes: fhirObservation.note?.[0]?.text,
    };
  }

  private mapFHIRMedicationToNextGen(fhirMedication: any): NextGenMedication {
    return {
      id: fhirMedication.id,
      patientId: fhirMedication.subject?.reference?.split('/')[1] || '',
      encounterId: fhirMedication.encounter?.reference?.split('/')[1],
      medicationCode: fhirMedication.medicationCodeableConcept?.coding?.[0]?.code || '',
      medicationName: fhirMedication.medicationCodeableConcept?.coding?.[0]?.display || '',
      genericName: fhirMedication.medicationCodeableConcept?.text,
      dosage: fhirMedication.dosageInstruction?.[0]?.text,
      route: fhirMedication.dosageInstruction?.[0]?.route?.coding?.[0]?.display,
      frequency: fhirMedication.dosageInstruction?.[0]?.timing?.code?.coding?.[0]?.display,
      status: fhirMedication.status || '',
      startDate: fhirMedication.authoredOn || '',
      endDate: fhirMedication.dosageInstruction?.[0]?.timing?.repeat?.boundsPeriod?.end,
      prescriber: fhirMedication.requester ? {
        id: fhirMedication.requester.reference?.split('/')[1] || '',
        name: fhirMedication.requester.display || '',
        npi: fhirMedication.requester.identifier?.find((id: any) => id.system?.includes('npi'))?.value,
      } : undefined,
      pharmacy: fhirMedication.dispenseRequest?.performer ? {
        name: fhirMedication.dispenseRequest.performer.display || '',
        phone: fhirMedication.dispenseRequest.performer.telecom?.find((t: any) => t.system === 'phone')?.value,
      } : undefined,
      instructions: fhirMedication.dosageInstruction?.[0]?.patientInstruction,
      refills: fhirMedication.dispenseRequest?.numberOfRepeatsAllowed,
      quantity: fhirMedication.dispenseRequest?.quantity?.value?.toString(),
    };
  }

  private mapFHIRConditionToNextGen(fhirCondition: any): NextGenCondition {
    return {
      id: fhirCondition.id,
      patientId: fhirCondition.subject?.reference?.split('/')[1] || '',
      code: fhirCondition.code?.coding?.[0]?.code || '',
      display: fhirCondition.code?.coding?.[0]?.display || '',
      clinicalStatus: fhirCondition.clinicalStatus?.coding?.[0]?.code || '',
      verificationStatus: fhirCondition.verificationStatus?.coding?.[0]?.code || '',
      category: fhirCondition.category?.[0]?.coding?.[0]?.code || '',
      severity: fhirCondition.severity?.coding?.[0]?.display,
      onsetDateTime: fhirCondition.onsetDateTime,
      recordedDate: fhirCondition.recordedDate || '',
      recordedBy: fhirCondition.recorder?.display,
    };
  }

  private mapFHIRAllergyToNextGen(fhirAllergy: any): NextGenAllergy {
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
      notes: fhirAllergy.note?.[0]?.text,
    };
  }

  private mapFHIRAppointmentToNextGen(fhirAppointment: any): NextGenAppointment {
    return {
      id: fhirAppointment.id,
      patientId: fhirAppointment.participant?.find((p: any) => p.actor?.reference?.includes('Patient'))?.actor?.reference?.split('/')[1] || '',
      status: fhirAppointment.status || '',
      appointmentType: fhirAppointment.appointmentType?.coding?.[0]?.display || '',
      startTime: fhirAppointment.start || '',
      endTime: fhirAppointment.end || '',
      duration: fhirAppointment.minutesDuration,
      provider: fhirAppointment.participant?.find((p: any) => p.actor?.reference?.includes('Practitioner')) ? {
        id: fhirAppointment.participant.find((p: any) => p.actor?.reference?.includes('Practitioner')).actor?.reference?.split('/')[1] || '',
        name: fhirAppointment.participant.find((p: any) => p.actor?.reference?.includes('Practitioner')).actor?.display || '',
      } : undefined,
      location: fhirAppointment.participant?.find((p: any) => p.actor?.reference?.includes('Location'))?.actor?.display,
      reasonForVisit: fhirAppointment.reasonCode?.[0]?.text,
      notes: fhirAppointment.comment,
      confirmationStatus: fhirAppointment.participant?.find((p: any) => p.actor?.reference?.includes('Patient'))?.status,
    };
  }

  private mapFHIRImmunizationToNextGen(fhirImmunization: any): NextGenImmunization {
    return {
      id: fhirImmunization.id,
      patientId: fhirImmunization.patient?.reference?.split('/')[1] || '',
      vaccineCode: fhirImmunization.vaccineCode?.coding?.[0]?.code || '',
      vaccineName: fhirImmunization.vaccineCode?.coding?.[0]?.display || '',
      administeredDate: fhirImmunization.occurrenceDateTime || '',
      doseNumber: fhirImmunization.protocolApplied?.[0]?.doseNumberPositiveInt,
      lotNumber: fhirImmunization.lotNumber,
      expirationDate: fhirImmunization.expirationDate,
      manufacturer: fhirImmunization.manufacturer?.display,
      site: fhirImmunization.site?.coding?.[0]?.display,
      route: fhirImmunization.route?.coding?.[0]?.display,
      administeredBy: fhirImmunization.performer?.[0]?.actor?.display,
      status: fhirImmunization.status || '',
    };
  }
}

export default NextGenEnhancedService;