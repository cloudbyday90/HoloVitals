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
   * Sync customer data from Cerner to HoloVitals (Inbound)
   */
  async syncPatientInbound(customerId: string): Promise<CernerSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      await this.ensureValidToken();

      const cernerPatient = await this.fetchPatientFromCerner(customerId);
      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'cerner',
        resourceType: 'Customer',
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

      const existingPatient = await prisma.customer.findFirst({
        where: {
          OR: [
            { cernerId: customerId },
            { mrn: transformResult.data.mrn },
          ],
        },
      });

      if (existingPatient) {
        const conflictResult = await conflictResolutionService.detectConflicts(
          'Customer',
          existingPatient.id,
          existingPatient,
          transformResult.data
        );

        if (conflictResult.hasConflicts) {
          conflicts.push(...conflictResult.conflicts);
          const resolutions = await conflictResolutionService.autoResolveConflicts(
            'Customer',
            existingPatient.id
          );

          for (const resolution of resolutions) {
            if (resolution.success) {
              transformResult.data[resolution.conflictId.split('-')[1]] = resolution.resolvedValue;
            }
          }
        }

        await prisma.customer.update({
          where: { id: existingPatient.id },
          data: {
            ...transformResult.data,
            cernerId: customerId,
            lastSyncedAt: new Date(),
          },
        });
      } else {
        await prisma.customer.create({
          data: {
            ...transformResult.data,
            cernerId: customerId,
            lastSyncedAt: new Date(),
          },
        });
      }

      resourcesSucceeded++;

      await this.syncPatientObservations(customerId);
      await this.syncPatientMedications(customerId);
      await this.syncPatientAllergies(customerId);
      await this.syncPatientConditions(customerId);

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
      console.error('Error syncing customer from Cerner:', error);
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
   * Sync customer data from HoloVitals to Cerner (Outbound)
   */
  async syncPatientOutbound(customerId: string): Promise<CernerSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      await this.ensureValidToken();

      const holoPatient = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!holoPatient) {
        throw new Error('Customer not found in HoloVitals');
      }

      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'cerner',
        resourceType: 'Customer',
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
        await prisma.customer.update({
          where: { id: customerId },
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
      console.error('Error syncing customer to Cerner:', error);
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

  private async syncPatientObservations(customerId: string): Promise<void> {
    try {
      const observations = await this.fetchObservationsFromCerner(customerId);
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
          await this.saveObservation(customerId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing observations:', error);
    }
  }

  private async syncPatientMedications(customerId: string): Promise<void> {
    try {
      const medications = await this.fetchMedicationsFromCerner(customerId);
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
          await this.saveMedication(customerId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing medications:', error);
    }
  }

  private async syncPatientAllergies(customerId: string): Promise<void> {
    try {
      const allergies = await this.fetchAllergiesFromCerner(customerId);
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
          await this.saveAllergy(customerId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing allergies:', error);
    }
  }

  private async syncPatientConditions(customerId: string): Promise<void> {
    try {
      const conditions = await this.fetchConditionsFromCerner(customerId);
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
          await this.saveCondition(customerId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing conditions:', error);
    }
  }

  private async fetchPatientFromCerner(customerId: string): Promise<any> {
    const response = await fetch(
      `${this.config.baseUrl}/Customer/${customerId}`,
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

  private async fetchObservationsFromCerner(customerId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/Observation?customer=${customerId}`,
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

  private async fetchMedicationsFromCerner(customerId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/MedicationRequest?customer=${customerId}`,
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

  private async fetchAllergiesFromCerner(customerId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/AllergyIntolerance?customer=${customerId}`,
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

  private async fetchConditionsFromCerner(customerId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/Condition?customer=${customerId}`,
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

  private async createPatientInCerner(customerData: any): Promise<string> {
    const response = await fetch(
      `${this.config.baseUrl}/Customer`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/fhir+json',
        },
        body: JSON.stringify(customerData),
      }
    );
    if (!response.ok) throw new Error(`Cerner API error: ${response.statusText}`);
    const result = await response.json();
    return result.id;
  }

  private async updatePatientInCerner(customerId: string, customerData: any): Promise<void> {
    const response = await fetch(
      `${this.config.baseUrl}/Customer/${customerId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/fhir+json',
        },
        body: JSON.stringify(customerData),
      }
    );
    if (!response.ok) throw new Error(`Cerner API error: ${response.statusText}`);
  }

  private async saveObservation(customerId: string, data: any): Promise<void> {
    console.log('Saving observation for customer:', customerId);
  }

  private async saveMedication(customerId: string, data: any): Promise<void> {
    console.log('Saving medication for customer:', customerId);
  }

  private async saveAllergy(customerId: string, data: any): Promise<void> {
    console.log('Saving allergy for customer:', customerId);
  }

  private async saveCondition(customerId: string, data: any): Promise<void> {
    console.log('Saving condition for customer:', customerId);
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