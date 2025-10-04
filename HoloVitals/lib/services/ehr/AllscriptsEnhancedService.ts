/**
 * Allscripts/Veradigm EHR Integration Service
 * 
 * Provides comprehensive integration with Allscripts (now Veradigm) EHR systems
 * including Sunrise, TouchWorks, and Professional EHR using FHIR R4 API.
 * 
 * Features:
 * - FHIR R4 API integration
 * - Customer demographics and medical records
 * - Lab results and vital signs
 * - Medications and allergies
 * - Appointments and encounters
 * - Clinical documents
 * - Real-time data synchronization
 * - Support for multiple Allscripts platforms
 * 
 * @see https://developer.veradigm.com/
 * @see https://developer.allscripts.com/
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

export interface AllscriptsConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  appName: string;
  platform: 'sunrise' | 'touchworks' | 'professional';
  environment: 'sandbox' | 'production';
  apiVersion?: string;
}

export interface AllscriptsPatient {
  id: string;
  mrn: string;
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
  identifiers: Array<{
    system: string;
    value: string;
    type: string;
  }>;
}

export interface AllscriptsEncounter {
  id: string;
  customerId: string;
  type: string;
  status: string;
  class: string;
  startDate: string;
  endDate?: string;
  location?: string;
  provider?: {
    id: string;
    name: string;
    specialty?: string;
  };
  reasonForVisit?: string;
  diagnoses?: Array<{
    code: string;
    description: string;
    type: string;
  }>;
}

export interface AllscriptsObservation {
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
  performer?: string;
}

export interface AllscriptsMedication {
  id: string;
  customerId: string;
  medicationCode: string;
  medicationName: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  status: string;
  startDate: string;
  endDate?: string;
  prescriber?: {
    id: string;
    name: string;
  };
  instructions?: string;
  refills?: number;
}

export interface AllscriptsCondition {
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

export interface AllscriptsAllergy {
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

export interface AllscriptsAppointment {
  id: string;
  customerId: string;
  status: string;
  appointmentType: string;
  startTime: string;
  endTime: string;
  provider?: {
    id: string;
    name: string;
  };
  location?: string;
  reasonForVisit?: string;
  notes?: string;
}

export interface AllscriptsSyncResult {
  success: boolean;
  customerId: string;
  recordsProcessed: {
    encounters: number;
    observations: number;
    medications: number;
    conditions: number;
    allergies: number;
    appointments: number;
  };
  errors: string[];
  syncedAt: Date;
}

// ============================================================================
// ALLSCRIPTS ENHANCED SERVICE
// ============================================================================

export class AllscriptsEnhancedService {
  private client: AxiosInstance;
  private config: AllscriptsConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: AllscriptsConfig) {
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
   * Authenticate with Allscripts/Veradigm OAuth 2.0
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
      this.client.defaults.headers.common['X-App-Name'] = this.config.appName;

      await auditService.log({
        eventType: 'EHR_AUTHENTICATION',
        category: 'INTEGRATION',
        outcome: 'SUCCESS',
        description: 'Successfully authenticated with Allscripts',
        metadata: {
          provider: 'Allscripts',
          platform: this.config.platform,
        },
      });
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_AUTHENTICATION',
        category: 'INTEGRATION',
        outcome: 'FAILURE',
        description: 'Failed to authenticate with Allscripts',
        metadata: {
          provider: 'Allscripts',
          error: error.message,
        },
      });
      throw new Error(`Allscripts authentication failed: ${error.message}`);
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
  }): Promise<AllscriptsPatient[]> {
    await this.authenticate();

    try {
      const params: any = {};

      if (criteria.firstName) params.given = criteria.firstName;
      if (criteria.lastName) params.family = criteria.lastName;
      if (criteria.dateOfBirth) params.birthdate = criteria.dateOfBirth;
      if (criteria.mrn) params.identifier = `MRN|${criteria.mrn}`;
      if (criteria.identifier) params.identifier = criteria.identifier;

      const response = await this.client.get('/fhir/Customer', { params });

      const customers = response.data.entry?.map((entry: any) => 
        this.mapFHIRPatientToAllscripts(entry.resource)
      ) || [];

      await auditService.log({
        eventType: 'EHR_PATIENT_SEARCH',
        category: 'DATA_ACCESS',
        outcome: 'SUCCESS',
        description: `Searched for customers in Allscripts`,
        metadata: {
          provider: 'Allscripts',
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
        description: 'Failed to search customers in Allscripts',
        metadata: {
          provider: 'Allscripts',
          error: error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getPatient(customerId: string): Promise<AllscriptsPatient> {
    await this.authenticate();

    try {
      const response = await this.client.get(`/fhir/Customer/${customerId}`);
      const customer = this.mapFHIRPatientToAllscripts(response.data);

      await auditService.log({
        eventType: 'EHR_PATIENT_READ',
        category: 'DATA_ACCESS',
        outcome: 'SUCCESS',
        description: `Retrieved customer from Allscripts`,
        metadata: {
          provider: 'Allscripts',
          customerId,
        },
      });

      return customer;
    } catch (error: any) {
      await auditService.log({
        eventType: 'EHR_PATIENT_READ',
        category: 'DATA_ACCESS',
        outcome: 'FAILURE',
        description: 'Failed to retrieve customer from Allscripts',
        metadata: {
          provider: 'Allscripts',
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
  }): Promise<AllscriptsEncounter[]> {
    await this.authenticate();

    try {
      const params: any = {
        customer: customerId,
        _count: 100,
      };

      if (options?.startDate) params.date = `ge${options.startDate}`;
      if (options?.endDate) params.date = `${params.date || ''}le${options.endDate}`;
      if (options?.status) params.status = options.status;

      const response = await this.client.get('/fhir/Encounter', { params });

      const encounters = response.data.entry?.map((entry: any) =>
        this.mapFHIREncounterToAllscripts(entry.resource)
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
  }): Promise<AllscriptsObservation[]> {
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

      const response = await this.client.get('/fhir/Observation', { params });

      const observations = response.data.entry?.map((entry: any) =>
        this.mapFHIRObservationToAllscripts(entry.resource)
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
  }): Promise<AllscriptsMedication[]> {
    await this.authenticate();

    try {
      const params: any = {
        customer: customerId,
        _count: 100,
      };

      if (options?.status) params.status = options.status;

      const response = await this.client.get('/fhir/MedicationRequest', { params });

      const medications = response.data.entry?.map((entry: any) =>
        this.mapFHIRMedicationToAllscripts(entry.resource)
      ) || [];

      return medications;
    } catch (error: any) {
      throw new Error(`Failed to get medications: ${error.message}`);
    }
  }

  /**
   * Get customer conditions/diagnoses
   */
  async getConditions(customerId: string): Promise<AllscriptsCondition[]> {
    await this.authenticate();

    try {
      const params = {
        customer: customerId,
        _count: 100,
      };

      const response = await this.client.get('/fhir/Condition', { params });

      const conditions = response.data.entry?.map((entry: any) =>
        this.mapFHIRConditionToAllscripts(entry.resource)
      ) || [];

      return conditions;
    } catch (error: any) {
      throw new Error(`Failed to get conditions: ${error.message}`);
    }
  }

  /**
   * Get customer allergies
   */
  async getAllergies(customerId: string): Promise<AllscriptsAllergy[]> {
    await this.authenticate();

    try {
      const params = {
        customer: customerId,
        _count: 100,
      };

      const response = await this.client.get('/fhir/AllergyIntolerance', { params });

      const allergies = response.data.entry?.map((entry: any) =>
        this.mapFHIRAllergyToAllscripts(entry.resource)
      ) || [];

      return allergies;
    } catch (error: any) {
      throw new Error(`Failed to get allergies: ${error.message}`);
    }
  }

  /**
   * Get customer appointments
   */
  async getAppointments(customerId: string, options?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<AllscriptsAppointment[]> {
    await this.authenticate();

    try {
      const params: any = {
        customer: customerId,
        _count: 100,
      };

      if (options?.startDate) params.date = `ge${options.startDate}`;
      if (options?.endDate) params.date = `${params.date || ''}le${options.endDate}`;
      if (options?.status) params.status = options.status;

      const response = await this.client.get('/fhir/Appointment', { params });

      const appointments = response.data.entry?.map((entry: any) =>
        this.mapFHIRAppointmentToAllscripts(entry.resource)
      ) || [];

      return appointments;
    } catch (error: any) {
      throw new Error(`Failed to get appointments: ${error.message}`);
    }
  }

  // ==========================================================================
  // SYNC OPERATIONS
  // ==========================================================================

  /**
   * Sync all customer data from Allscripts
   */
  async syncPatientData(
    customerId: string,
    allscriptsPatientId: string
  ): Promise<AllscriptsSyncResult> {
    const result: AllscriptsSyncResult = {
      success: false,
      customerId,
      recordsProcessed: {
        encounters: 0,
        observations: 0,
        medications: 0,
        conditions: 0,
        allergies: 0,
        appointments: 0,
      },
      errors: [],
      syncedAt: new Date(),
    };

    try {
      // Sync encounters
      const encounters = await this.getEncounters(allscriptsPatientId);
      result.recordsProcessed.encounters = encounters.length;

      // Sync observations
      const observations = await this.getObservations(allscriptsPatientId);
      result.recordsProcessed.observations = observations.length;

      // Sync medications
      const medications = await this.getMedications(allscriptsPatientId);
      result.recordsProcessed.medications = medications.length;

      // Sync conditions
      const conditions = await this.getConditions(allscriptsPatientId);
      result.recordsProcessed.conditions = conditions.length;

      // Sync allergies
      const allergies = await this.getAllergies(allscriptsPatientId);
      result.recordsProcessed.allergies = allergies.length;

      // Sync appointments
      const appointments = await this.getAppointments(allscriptsPatientId);
      result.recordsProcessed.appointments = appointments.length;

      // Store sync history
      await prisma.syncHistory.create({
        data: {
          customerId,
          provider: 'ALLSCRIPTS',
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
        description: 'Successfully synced customer data from Allscripts',
        metadata: {
          provider: 'Allscripts',
          customerId,
          recordsProcessed: result.recordsProcessed,
        },
      });
    } catch (error: any) {
      result.errors.push(error.message);

      await prisma.syncHistory.create({
        data: {
          customerId,
          provider: 'ALLSCRIPTS',
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
        description: 'Failed to sync customer data from Allscripts',
        metadata: {
          provider: 'Allscripts',
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

  private mapFHIRPatientToAllscripts(fhirPatient: any): AllscriptsPatient {
    const name = fhirPatient.name?.[0];
    const telecom = fhirPatient.telecom || [];
    const address = fhirPatient.address?.[0];

    return {
      id: fhirPatient.id,
      mrn: fhirPatient.identifier?.find((id: any) => id.type?.coding?.[0]?.code === 'MR')?.value || '',
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
      identifiers: fhirPatient.identifier?.map((id: any) => ({
        system: id.system || '',
        value: id.value || '',
        type: id.type?.coding?.[0]?.code || '',
      })) || [],
    };
  }

  private mapFHIREncounterToAllscripts(fhirEncounter: any): AllscriptsEncounter {
    return {
      id: fhirEncounter.id,
      customerId: fhirEncounter.subject?.reference?.split('/')[1] || '',
      type: fhirEncounter.type?.[0]?.coding?.[0]?.display || '',
      status: fhirEncounter.status || '',
      class: fhirEncounter.class?.code || '',
      startDate: fhirEncounter.period?.start || '',
      endDate: fhirEncounter.period?.end,
      location: fhirEncounter.location?.[0]?.location?.display,
      provider: fhirEncounter.participant?.[0] ? {
        id: fhirEncounter.participant[0].individual?.reference?.split('/')[1] || '',
        name: fhirEncounter.participant[0].individual?.display || '',
        specialty: fhirEncounter.participant[0].type?.[0]?.coding?.[0]?.display,
      } : undefined,
      reasonForVisit: fhirEncounter.reasonCode?.[0]?.text,
      diagnoses: fhirEncounter.diagnosis?.map((diag: any) => ({
        code: diag.condition?.reference?.split('/')[1] || '',
        description: diag.condition?.display || '',
        type: diag.use?.coding?.[0]?.display || '',
      })),
    };
  }

  private mapFHIRObservationToAllscripts(fhirObservation: any): AllscriptsObservation {
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
      performer: fhirObservation.performer?.[0]?.display,
    };
  }

  private mapFHIRMedicationToAllscripts(fhirMedication: any): AllscriptsMedication {
    return {
      id: fhirMedication.id,
      customerId: fhirMedication.subject?.reference?.split('/')[1] || '',
      medicationCode: fhirMedication.medicationCodeableConcept?.coding?.[0]?.code || '',
      medicationName: fhirMedication.medicationCodeableConcept?.coding?.[0]?.display || '',
      dosage: fhirMedication.dosageInstruction?.[0]?.text,
      route: fhirMedication.dosageInstruction?.[0]?.route?.coding?.[0]?.display,
      frequency: fhirMedication.dosageInstruction?.[0]?.timing?.code?.coding?.[0]?.display,
      status: fhirMedication.status || '',
      startDate: fhirMedication.authoredOn || '',
      endDate: fhirMedication.dosageInstruction?.[0]?.timing?.repeat?.boundsPeriod?.end,
      prescriber: fhirMedication.requester ? {
        id: fhirMedication.requester.reference?.split('/')[1] || '',
        name: fhirMedication.requester.display || '',
      } : undefined,
      instructions: fhirMedication.dosageInstruction?.[0]?.patientInstruction,
      refills: fhirMedication.dispenseRequest?.numberOfRepeatsAllowed,
    };
  }

  private mapFHIRConditionToAllscripts(fhirCondition: any): AllscriptsCondition {
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

  private mapFHIRAllergyToAllscripts(fhirAllergy: any): AllscriptsAllergy {
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

  private mapFHIRAppointmentToAllscripts(fhirAppointment: any): AllscriptsAppointment {
    return {
      id: fhirAppointment.id,
      customerId: fhirAppointment.participant?.find((p: any) => p.actor?.reference?.includes('Customer'))?.actor?.reference?.split('/')[1] || '',
      status: fhirAppointment.status || '',
      appointmentType: fhirAppointment.appointmentType?.coding?.[0]?.display || '',
      startTime: fhirAppointment.start || '',
      endTime: fhirAppointment.end || '',
      provider: fhirAppointment.participant?.find((p: any) => p.actor?.reference?.includes('Practitioner')) ? {
        id: fhirAppointment.participant.find((p: any) => p.actor?.reference?.includes('Practitioner')).actor?.reference?.split('/')[1] || '',
        name: fhirAppointment.participant.find((p: any) => p.actor?.reference?.includes('Practitioner')).actor?.display || '',
      } : undefined,
      location: fhirAppointment.participant?.find((p: any) => p.actor?.reference?.includes('Location'))?.actor?.display,
      reasonForVisit: fhirAppointment.reasonCode?.[0]?.text,
      notes: fhirAppointment.comment,
    };
  }
}

export default AllscriptsEnhancedService;