/**
 * Epic EHR Sync Adapter
 * 
 * Handles bidirectional data synchronization with Epic EHR systems.
 * Supports FHIR R4 API and Epic-specific extensions.
 */

import { PrismaClient } from '@prisma/client';
import { dataTransformationService, TransformationContext, DataFormat } from '../DataTransformationService';
import { conflictResolutionService } from '../ConflictResolutionService';

const prisma = new PrismaClient();

// Epic-specific types
export interface EpicSyncConfig {
  ehrConnectionId: string;
  baseUrl: string;
  clientId: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  fhirVersion: 'R4' | 'STU3';
  enableWebhooks: boolean;
  webhookSecret?: string;
}

export interface EpicSyncResult {
  success: boolean;
  resourcesProcessed: number;
  resourcesSucceeded: number;
  resourcesFailed: number;
  errors: string[];
  warnings: string[];
  conflicts: any[];
}

/**
 * Epic Sync Adapter
 */
export class EpicSyncAdapter {
  private config: EpicSyncConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: EpicSyncConfig) {
    this.config = config;
    this.accessToken = config.accessToken;
  }

  /**
   * Sync patient data from Epic to HoloVitals (Inbound)
   */
  async syncPatientInbound(patientId: string): Promise<EpicSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      // Ensure we have a valid access token
      await this.ensureValidToken();

      // Fetch patient data from Epic
      const epicPatient = await this.fetchPatientFromEpic(patientId);
      resourcesProcessed++;

      // Transform Epic FHIR data to HoloVitals format
      const transformContext: TransformationContext = {
        ehrProvider: 'epic',
        resourceType: 'Patient',
        direction: 'INBOUND',
        sourceFormat: DataFormat.FHIR_R4,
        targetFormat: DataFormat.CUSTOM_JSON,
        options: {
          validateOutput: true,
          strictMode: false,
          preserveUnmapped: true,
        },
      };

      const transformResult = await dataTransformationService.transform(
        epicPatient,
        transformContext
      );

      if (!transformResult.success) {
        errors.push(...transformResult.errors.map(e => e.message));
        resourcesFailed++;
        return {
          success: false,
          resourcesProcessed,
          resourcesSucceeded,
          resourcesFailed,
          errors,
          warnings,
          conflicts,
        };
      }

      warnings.push(...transformResult.warnings.map(w => w.message));

      // Check for existing patient in HoloVitals
      const existingPatient = await prisma.patient.findFirst({
        where: {
          OR: [
            { epicId: patientId },
            { mrn: transformResult.data.mrn },
          ],
        },
      });

      if (existingPatient) {
        // Detect conflicts
        const conflictResult = await conflictResolutionService.detectConflicts(
          'Patient',
          existingPatient.id,
          existingPatient,
          transformResult.data
        );

        if (conflictResult.hasConflicts) {
          conflicts.push(...conflictResult.conflicts);

          // Auto-resolve conflicts
          const resolutions = await conflictResolutionService.autoResolveConflicts(
            'Patient',
            existingPatient.id
          );

          // Apply resolved values
          for (const resolution of resolutions) {
            if (resolution.success) {
              transformResult.data[resolution.conflictId.split('-')[1]] = resolution.resolvedValue;
            }
          }
        }

        // Update existing patient
        await prisma.patient.update({
          where: { id: existingPatient.id },
          data: {
            ...transformResult.data,
            epicId: patientId,
            lastSyncedAt: new Date(),
          },
        });
      } else {
        // Create new patient
        await prisma.patient.create({
          data: {
            ...transformResult.data,
            epicId: patientId,
            lastSyncedAt: new Date(),
          },
        });
      }

      resourcesSucceeded++;

      // Sync related resources
      await this.syncPatientObservations(patientId);
      await this.syncPatientMedications(patientId);
      await this.syncPatientAllergies(patientId);
      await this.syncPatientConditions(patientId);

      return {
        success: true,
        resourcesProcessed,
        resourcesSucceeded,
        resourcesFailed,
        errors,
        warnings,
        conflicts,
      };
    } catch (error) {
      console.error('Error syncing patient from Epic:', error);
      errors.push(error.message);
      resourcesFailed++;

      return {
        success: false,
        resourcesProcessed,
        resourcesSucceeded,
        resourcesFailed,
        errors,
        warnings,
        conflicts,
      };
    }
  }

  /**
   * Sync patient data from HoloVitals to Epic (Outbound)
   */
  async syncPatientOutbound(patientId: string): Promise<EpicSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      // Ensure we have a valid access token
      await this.ensureValidToken();

      // Fetch patient from HoloVitals
      const holoPatient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!holoPatient) {
        throw new Error('Patient not found in HoloVitals');
      }

      resourcesProcessed++;

      // Transform HoloVitals data to Epic FHIR format
      const transformContext: TransformationContext = {
        ehrProvider: 'epic',
        resourceType: 'Patient',
        direction: 'OUTBOUND',
        sourceFormat: DataFormat.CUSTOM_JSON,
        targetFormat: DataFormat.FHIR_R4,
        options: {
          validateOutput: true,
          strictMode: true,
        },
      };

      const transformResult = await dataTransformationService.transform(
        holoPatient,
        transformContext
      );

      if (!transformResult.success) {
        errors.push(...transformResult.errors.map(e => e.message));
        resourcesFailed++;
        return {
          success: false,
          resourcesProcessed,
          resourcesSucceeded,
          resourcesFailed,
          errors,
          warnings,
          conflicts,
        };
      }

      warnings.push(...transformResult.warnings.map(w => w.message));

      // Send to Epic
      if (holoPatient.epicId) {
        // Update existing patient in Epic
        await this.updatePatientInEpic(holoPatient.epicId, transformResult.data);
      } else {
        // Create new patient in Epic
        const epicId = await this.createPatientInEpic(transformResult.data);
        
        // Update HoloVitals patient with Epic ID
        await prisma.patient.update({
          where: { id: patientId },
          data: { epicId },
        });
      }

      resourcesSucceeded++;

      return {
        success: true,
        resourcesProcessed,
        resourcesSucceeded,
        resourcesFailed,
        errors,
        warnings,
        conflicts,
      };
    } catch (error) {
      console.error('Error syncing patient to Epic:', error);
      errors.push(error.message);
      resourcesFailed++;

      return {
        success: false,
        resourcesProcessed,
        resourcesSucceeded,
        resourcesFailed,
        errors,
        warnings,
        conflicts,
      };
    }
  }

  /**
   * Sync patient observations
   */
  private async syncPatientObservations(patientId: string): Promise<void> {
    try {
      const observations = await this.fetchObservationsFromEpic(patientId);
      
      for (const observation of observations) {
        const transformContext: TransformationContext = {
          ehrProvider: 'epic',
          resourceType: 'Observation',
          direction: 'INBOUND',
          sourceFormat: DataFormat.FHIR_R4,
          targetFormat: DataFormat.CUSTOM_JSON,
        };

        const transformResult = await dataTransformationService.transform(
          observation,
          transformContext
        );

        if (transformResult.success) {
          // Save observation to database
          await this.saveObservation(patientId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing observations:', error);
    }
  }

  /**
   * Sync patient medications
   */
  private async syncPatientMedications(patientId: string): Promise<void> {
    try {
      const medications = await this.fetchMedicationsFromEpic(patientId);
      
      for (const medication of medications) {
        const transformContext: TransformationContext = {
          ehrProvider: 'epic',
          resourceType: 'MedicationRequest',
          direction: 'INBOUND',
          sourceFormat: DataFormat.FHIR_R4,
          targetFormat: DataFormat.CUSTOM_JSON,
        };

        const transformResult = await dataTransformationService.transform(
          medication,
          transformContext
        );

        if (transformResult.success) {
          await this.saveMedication(patientId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing medications:', error);
    }
  }

  /**
   * Sync patient allergies
   */
  private async syncPatientAllergies(patientId: string): Promise<void> {
    try {
      const allergies = await this.fetchAllergiesFromEpic(patientId);
      
      for (const allergy of allergies) {
        const transformContext: TransformationContext = {
          ehrProvider: 'epic',
          resourceType: 'AllergyIntolerance',
          direction: 'INBOUND',
          sourceFormat: DataFormat.FHIR_R4,
          targetFormat: DataFormat.CUSTOM_JSON,
        };

        const transformResult = await dataTransformationService.transform(
          allergy,
          transformContext
        );

        if (transformResult.success) {
          await this.saveAllergy(patientId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing allergies:', error);
    }
  }

  /**
   * Sync patient conditions
   */
  private async syncPatientConditions(patientId: string): Promise<void> {
    try {
      const conditions = await this.fetchConditionsFromEpic(patientId);
      
      for (const condition of conditions) {
        const transformContext: TransformationContext = {
          ehrProvider: 'epic',
          resourceType: 'Condition',
          direction: 'INBOUND',
          sourceFormat: DataFormat.FHIR_R4,
          targetFormat: DataFormat.CUSTOM_JSON,
        };

        const transformResult = await dataTransformationService.transform(
          condition,
          transformContext
        );

        if (transformResult.success) {
          await this.saveCondition(patientId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing conditions:', error);
    }
  }

  /**
   * Fetch patient from Epic FHIR API
   */
  private async fetchPatientFromEpic(patientId: string): Promise<any> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/Patient/${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/fhir+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Epic API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetch observations from Epic
   */
  private async fetchObservationsFromEpic(patientId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/Observation?patient=${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/fhir+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Epic API error: ${response.statusText}`);
    }

    const bundle = await response.json();
    return bundle.entry?.map((e: any) => e.resource) || [];
  }

  /**
   * Fetch medications from Epic
   */
  private async fetchMedicationsFromEpic(patientId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/MedicationRequest?patient=${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/fhir+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Epic API error: ${response.statusText}`);
    }

    const bundle = await response.json();
    return bundle.entry?.map((e: any) => e.resource) || [];
  }

  /**
   * Fetch allergies from Epic
   */
  private async fetchAllergiesFromEpic(patientId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/AllergyIntolerance?patient=${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/fhir+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Epic API error: ${response.statusText}`);
    }

    const bundle = await response.json();
    return bundle.entry?.map((e: any) => e.resource) || [];
  }

  /**
   * Fetch conditions from Epic
   */
  private async fetchConditionsFromEpic(patientId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/Condition?patient=${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/fhir+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Epic API error: ${response.statusText}`);
    }

    const bundle = await response.json();
    return bundle.entry?.map((e: any) => e.resource) || [];
  }

  /**
   * Create patient in Epic
   */
  private async createPatientInEpic(patientData: any): Promise<string> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/Patient`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/fhir+json',
        },
        body: JSON.stringify(patientData),
      }
    );

    if (!response.ok) {
      throw new Error(`Epic API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id;
  }

  /**
   * Update patient in Epic
   */
  private async updatePatientInEpic(patientId: string, patientData: any): Promise<void> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/Patient/${patientId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/fhir+json',
        },
        body: JSON.stringify(patientData),
      }
    );

    if (!response.ok) {
      throw new Error(`Epic API error: ${response.statusText}`);
    }
  }

  /**
   * Save observation to database
   */
  private async saveObservation(patientId: string, data: any): Promise<void> {
    // Implementation would save to appropriate database table
    console.log('Saving observation for patient:', patientId);
  }

  /**
   * Save medication to database
   */
  private async saveMedication(patientId: string, data: any): Promise<void> {
    // Implementation would save to appropriate database table
    console.log('Saving medication for patient:', patientId);
  }

  /**
   * Save allergy to database
   */
  private async saveAllergy(patientId: string, data: any): Promise<void> {
    // Implementation would save to appropriate database table
    console.log('Saving allergy for patient:', patientId);
  }

  /**
   * Save condition to database
   */
  private async saveCondition(patientId: string, data: any): Promise<void> {
    // Implementation would save to appropriate database table
    console.log('Saving condition for patient:', patientId);
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return;
    }

    // Refresh token if we have one
    if (this.config.refreshToken) {
      await this.refreshAccessToken();
    } else {
      throw new Error('No valid access token available');
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<void> {
    const response = await fetch(
      `${this.config.baseUrl}/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken!,
          client_id: this.config.clientId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
  }
}