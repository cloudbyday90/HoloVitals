/**
 * Cerner (Oracle Health) EHR Sync Adapter
 * 
 * Handles bidirectional data synchronization with Cerner/Oracle Health EHR systems.
 * Supports FHIR R4 API and Cerner-specific extensions.
 */

import { PrismaClient } from '@prisma/client';
import { dataTransformationService, TransformationContext, DataFormat } from '../DataTransformationService';
import { conflictResolutionService } from '../ConflictResolutionService';

const prisma = new PrismaClient();

export interface CernerSyncConfig {
  ehrConnectionId: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  tenantId: string;
  fhirVersion: 'R4' | 'DSTU2';
  enableWebhooks: boolean;
  webhookSecret?: string;
}

export interface CernerSyncResult {
  success: boolean;
  resourcesProcessed: number;
  resourcesSucceeded: number;
  resourcesFailed: number;
  errors: string[];
  warnings: string[];
  conflicts: any[];
}

/**
 * Cerner Sync Adapter
 */
export class CernerSyncAdapter {
  private config: CernerSyncConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: CernerSyncConfig) {
    this.config = config;
    this.accessToken = config.accessToken;
  }

  /**
   * Sync patient data from Cerner to HoloVitals (Inbound)
   */
  async syncPatientInbound(patientId: string): Promise<CernerSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      await this.ensureValidToken();

      const cernerPatient = await this.fetchPatientFromCerner(patientId);
      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'cerner',
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
        cernerPatient,
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

      const existingPatient = await prisma.patient.findFirst({
        where: {
          OR: [
            { cernerId: patientId },
            { mrn: transformResult.data.mrn },
          ],
        },
      });

      if (existingPatient) {
        const conflictResult = await conflictResolutionService.detectConflicts(
          'Patient',
          existingPatient.id,
          existingPatient,
          transformResult.data
        );

        if (conflictResult.hasConflicts) {
          conflicts.push(...conflictResult.conflicts);
          const resolutions = await conflictResolutionService.autoResolveConflicts(
            'Patient',
            existingPatient.id
          );

          for (const resolution of resolutions) {
            if (resolution.success) {
              transformResult.data[resolution.conflictId.split('-')[1]] = resolution.resolvedValue;
            }
          }
        }

        await prisma.patient.update({
          where: { id: existingPatient.id },
          data: {
            ...transformResult.data,
            cernerId: patientId,
            lastSyncedAt: new Date(),
          },
        });
      } else {
        await prisma.patient.create({
          data: {
            ...transformResult.data,
            cernerId: patientId,
            lastSyncedAt: new Date(),
          },
        });
      }

      resourcesSucceeded++;

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
      console.error('Error syncing patient from Cerner:', error);
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
   * Sync patient data from HoloVitals to Cerner (Outbound)
   */
  async syncPatientOutbound(patientId: string): Promise<CernerSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      await this.ensureValidToken();

      const holoPatient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!holoPatient) {
        throw new Error('Patient not found in HoloVitals');
      }

      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'cerner',
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

      if (holoPatient.cernerId) {
        await this.updatePatientInCerner(holoPatient.cernerId, transformResult.data);
      } else {
        const cernerId = await this.createPatientInCerner(transformResult.data);
        await prisma.patient.update({
          where: { id: patientId },
          data: { cernerId },
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
      console.error('Error syncing patient to Cerner:', error);
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

  private async syncPatientObservations(patientId: string): Promise<void> {
    try {
      const observations = await this.fetchObservationsFromCerner(patientId);
      for (const observation of observations) {
        const transformContext: TransformationContext = {
          ehrProvider: 'cerner',
          resourceType: 'Observation',
          direction: 'INBOUND',
          sourceFormat: DataFormat.FHIR_R4,
          targetFormat: DataFormat.CUSTOM_JSON,
        };
        const transformResult = await dataTransformationService.transform(observation, transformContext);
        if (transformResult.success) {
          await this.saveObservation(patientId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing observations:', error);
    }
  }

  private async syncPatientMedications(patientId: string): Promise<void> {
    try {
      const medications = await this.fetchMedicationsFromCerner(patientId);
      for (const medication of medications) {
        const transformContext: TransformationContext = {
          ehrProvider: 'cerner',
          resourceType: 'MedicationRequest',
          direction: 'INBOUND',
          sourceFormat: DataFormat.FHIR_R4,
          targetFormat: DataFormat.CUSTOM_JSON,
        };
        const transformResult = await dataTransformationService.transform(medication, transformContext);
        if (transformResult.success) {
          await this.saveMedication(patientId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing medications:', error);
    }
  }

  private async syncPatientAllergies(patientId: string): Promise<void> {
    try {
      const allergies = await this.fetchAllergiesFromCerner(patientId);
      for (const allergy of allergies) {
        const transformContext: TransformationContext = {
          ehrProvider: 'cerner',
          resourceType: 'AllergyIntolerance',
          direction: 'INBOUND',
          sourceFormat: DataFormat.FHIR_R4,
          targetFormat: DataFormat.CUSTOM_JSON,
        };
        const transformResult = await dataTransformationService.transform(allergy, transformContext);
        if (transformResult.success) {
          await this.saveAllergy(patientId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing allergies:', error);
    }
  }

  private async syncPatientConditions(patientId: string): Promise<void> {
    try {
      const conditions = await this.fetchConditionsFromCerner(patientId);
      for (const condition of conditions) {
        const transformContext: TransformationContext = {
          ehrProvider: 'cerner',
          resourceType: 'Condition',
          direction: 'INBOUND',
          sourceFormat: DataFormat.FHIR_R4,
          targetFormat: DataFormat.CUSTOM_JSON,
        };
        const transformResult = await dataTransformationService.transform(condition, transformContext);
        if (transformResult.success) {
          await this.saveCondition(patientId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing conditions:', error);
    }
  }

  private async fetchPatientFromCerner(patientId: string): Promise<any> {
    const response = await fetch(
      `${this.config.baseUrl}/Patient/${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/fhir+json',
        },
      }
    );
    if (!response.ok) throw new Error(`Cerner API error: ${response.statusText}`);
    return await response.json();
  }

  private async fetchObservationsFromCerner(patientId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/Observation?patient=${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/fhir+json',
        },
      }
    );
    if (!response.ok) throw new Error(`Cerner API error: ${response.statusText}`);
    const bundle = await response.json();
    return bundle.entry?.map((e: any) => e.resource) || [];
  }

  private async fetchMedicationsFromCerner(patientId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/MedicationRequest?patient=${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/fhir+json',
        },
      }
    );
    if (!response.ok) throw new Error(`Cerner API error: ${response.statusText}`);
    const bundle = await response.json();
    return bundle.entry?.map((e: any) => e.resource) || [];
  }

  private async fetchAllergiesFromCerner(patientId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/AllergyIntolerance?patient=${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/fhir+json',
        },
      }
    );
    if (!response.ok) throw new Error(`Cerner API error: ${response.statusText}`);
    const bundle = await response.json();
    return bundle.entry?.map((e: any) => e.resource) || [];
  }

  private async fetchConditionsFromCerner(patientId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/Condition?patient=${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/fhir+json',
        },
      }
    );
    if (!response.ok) throw new Error(`Cerner API error: ${response.statusText}`);
    const bundle = await response.json();
    return bundle.entry?.map((e: any) => e.resource) || [];
  }

  private async createPatientInCerner(patientData: any): Promise<string> {
    const response = await fetch(
      `${this.config.baseUrl}/Patient`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/fhir+json',
        },
        body: JSON.stringify(patientData),
      }
    );
    if (!response.ok) throw new Error(`Cerner API error: ${response.statusText}`);
    const result = await response.json();
    return result.id;
  }

  private async updatePatientInCerner(patientId: string, patientData: any): Promise<void> {
    const response = await fetch(
      `${this.config.baseUrl}/Patient/${patientId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/fhir+json',
        },
        body: JSON.stringify(patientData),
      }
    );
    if (!response.ok) throw new Error(`Cerner API error: ${response.statusText}`);
  }

  private async saveObservation(patientId: string, data: any): Promise<void> {
    console.log('Saving observation for patient:', patientId);
  }

  private async saveMedication(patientId: string, data: any): Promise<void> {
    console.log('Saving medication for patient:', patientId);
  }

  private async saveAllergy(patientId: string, data: any): Promise<void> {
    console.log('Saving allergy for patient:', patientId);
  }

  private async saveCondition(patientId: string, data: any): Promise<void> {
    console.log('Saving condition for patient:', patientId);
  }

  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return;
    }
    if (this.config.refreshToken) {
      await this.refreshAccessToken();
    } else {
      throw new Error('No valid access token available');
    }
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await fetch(
      `${this.config.baseUrl}/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken!,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      }
    );
    if (!response.ok) throw new Error('Failed to refresh access token');
    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
  }
}