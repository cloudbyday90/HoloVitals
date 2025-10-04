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
   * Sync customer data from Epic to HoloVitals (Inbound)
   */
  async syncPatientInbound(customerId: string): Promise<EpicSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      // Ensure we have a valid access token
      await this.ensureValidToken();

      // Fetch customer data from Epic
      const epicPatient = await this.fetchPatientFromEpic(customerId);
      resourcesProcessed++;

      // Transform Epic FHIR data to HoloVitals format
      const transformContext: TransformationContext = {
        ehrProvider: 'epic',
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

      // Check for existing customer in HoloVitals
      const existingPatient = await prisma.customer.findFirst({
        where: {
          OR: [
            { epicId: customerId },
            { mrn: transformResult.data.mrn },
          ],
        },
      });

      if (existingPatient) {
        // Detect conflicts
        const conflictResult = await conflictResolutionService.detectConflicts(
          'Customer',
          existingPatient.id,
          existingPatient,
          transformResult.data
        );

        if (conflictResult.hasConflicts) {
          conflicts.push(...conflictResult.conflicts);

          // Auto-resolve conflicts
          const resolutions = await conflictResolutionService.autoResolveConflicts(
            'Customer',
            existingPatient.id
          );

          // Apply resolved values
          for (const resolution of resolutions) {
            if (resolution.success) {
              transformResult.data[resolution.conflictId.split('-')[1]] = resolution.resolvedValue;
            }
          }
        }

        // Update existing customer
        await prisma.customer.update({
          where: { id: existingPatient.id },
          data: {
            ...transformResult.data,
            epicId: customerId,
            lastSyncedAt: new Date(),
          },
        });
      } else {
        // Create new customer
        await prisma.customer.create({
          data: {
            ...transformResult.data,
            epicId: customerId,
            lastSyncedAt: new Date(),
          },
        });
      }

      resourcesSucceeded++;

      // Sync related resources
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
      console.error('Error syncing customer from Epic:', error);
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
   * Sync customer data from HoloVitals to Epic (Outbound)
   */
  async syncPatientOutbound(customerId: string): Promise<EpicSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      // Ensure we have a valid access token
      await this.ensureValidToken();

      // Fetch customer from HoloVitals
      const holoPatient = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!holoPatient) {
        throw new Error('Customer not found in HoloVitals');
      }

      resourcesProcessed++;

      // Transform HoloVitals data to Epic FHIR format
      const transformContext: TransformationContext = {
        ehrProvider: 'epic',
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

      // Send to Epic
      if (holoPatient.epicId) {
        // Update existing customer in Epic
        await this.updatePatientInEpic(holoPatient.epicId, transformResult.data);
      } else {
        // Create new customer in Epic
        const epicId = await this.createPatientInEpic(transformResult.data);
        
        // Update HoloVitals customer with Epic ID
        await prisma.customer.update({
          where: { id: customerId },
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
      console.error('Error syncing customer to Epic:', error);
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
   * Sync customer observations
   */
  private async syncPatientObservations(customerId: string): Promise<void> {
    try {
      const observations = await this.fetchObservationsFromEpic(customerId);
      
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
          await this.saveObservation(customerId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing observations:', error);
    }
  }

  /**
   * Sync customer medications
   */
  private async syncPatientMedications(customerId: string): Promise<void> {
    try {
      const medications = await this.fetchMedicationsFromEpic(customerId);
      
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
          await this.saveMedication(customerId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing medications:', error);
    }
  }

  /**
   * Sync customer allergies
   */
  private async syncPatientAllergies(customerId: string): Promise<void> {
    try {
      const allergies = await this.fetchAllergiesFromEpic(customerId);
      
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
          await this.saveAllergy(customerId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing allergies:', error);
    }
  }

  /**
   * Sync customer conditions
   */
  private async syncPatientConditions(customerId: string): Promise<void> {
    try {
      const conditions = await this.fetchConditionsFromEpic(customerId);
      
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
          await this.saveCondition(customerId, transformResult.data);
        }
      }
    } catch (error) {
      console.error('Error syncing conditions:', error);
    }
  }

  /**
   * Fetch customer from Epic FHIR API
   */
  private async fetchPatientFromEpic(customerId: string): Promise<any> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/Customer/${customerId}`,
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
  private async fetchObservationsFromEpic(customerId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/Observation?customer=${customerId}`,
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
  private async fetchMedicationsFromEpic(customerId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/MedicationRequest?customer=${customerId}`,
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
  private async fetchAllergiesFromEpic(customerId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/AllergyIntolerance?customer=${customerId}`,
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
  private async fetchConditionsFromEpic(customerId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/Condition?customer=${customerId}`,
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
   * Create customer in Epic
   */
  private async createPatientInEpic(customerData: any): Promise<string> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/Customer`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/fhir+json',
        },
        body: JSON.stringify(customerData),
      }
    );

    if (!response.ok) {
      throw new Error(`Epic API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id;
  }

  /**
   * Update customer in Epic
   */
  private async updatePatientInEpic(customerId: string, customerData: any): Promise<void> {
    const response = await fetch(
      `${this.config.baseUrl}/api/FHIR/R4/Customer/${customerId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/fhir+json',
        },
        body: JSON.stringify(customerData),
      }
    );

    if (!response.ok) {
      throw new Error(`Epic API error: ${response.statusText}`);
    }
  }

  /**
   * Save observation to database
   */
  private async saveObservation(customerId: string, data: any): Promise<void> {
    // Implementation would save to appropriate database table
    console.log('Saving observation for customer:', customerId);
  }

  /**
   * Save medication to database
   */
  private async saveMedication(customerId: string, data: any): Promise<void> {
    // Implementation would save to appropriate database table
    console.log('Saving medication for customer:', customerId);
  }

  /**
   * Save allergy to database
   */
  private async saveAllergy(customerId: string, data: any): Promise<void> {
    // Implementation would save to appropriate database table
    console.log('Saving allergy for customer:', customerId);
  }

  /**
   * Save condition to database
   */
  private async saveCondition(customerId: string, data: any): Promise<void> {
    // Implementation would save to appropriate database table
    console.log('Saving condition for customer:', customerId);
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