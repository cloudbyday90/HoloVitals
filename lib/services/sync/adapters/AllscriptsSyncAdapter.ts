/**
 * Allscripts/Veradigm EHR Sync Adapter
 * 
 * Handles bidirectional data synchronization with Allscripts/Veradigm EHR systems.
 * Supports Unity API and FHIR R4.
 */

import { PrismaClient } from '@prisma/client';
import { dataTransformationService, TransformationContext, DataFormat } from '../DataTransformationService';
import { conflictResolutionService } from '../ConflictResolutionService';

const prisma = new PrismaClient();

export interface AllscriptsSyncConfig {
  ehrConnectionId: string;
  baseUrl: string;
  appName: string;
  appUsername: string;
  appPassword: string;
  accessToken?: string;
  useFHIR: boolean;
  enableWebhooks: boolean;
  webhookSecret?: string;
}

export interface AllscriptsSyncResult {
  success: boolean;
  resourcesProcessed: number;
  resourcesSucceeded: number;
  resourcesFailed: number;
  errors: string[];
  warnings: string[];
  conflicts: any[];
}

export class AllscriptsSyncAdapter {
  private config: AllscriptsSyncConfig;
  private accessToken?: string;

  constructor(config: AllscriptsSyncConfig) {
    this.config = config;
    this.accessToken = config.accessToken;
  }

  async syncPatientInbound(customerId: string): Promise<AllscriptsSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      await this.ensureValidToken();
      const allscriptsPatient = await this.fetchPatientFromAllscripts(customerId);
      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'allscripts',
        resourceType: 'Customer',
        direction: 'INBOUND',
        sourceFormat: this.config.useFHIR ? DataFormat.FHIR_R4 : DataFormat.CUSTOM_JSON,
        targetFormat: DataFormat.CUSTOM_JSON,
        options: { validateOutput: true, strictMode: false, preserveUnmapped: true },
      };

      const transformResult = await dataTransformationService.transform(allscriptsPatient, transformContext);

      if (!transformResult.success) {
        errors.push(...transformResult.errors.map(e => e.message));
        resourcesFailed++;
        return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
      }

      warnings.push(...transformResult.warnings.map(w => w.message));

      const existingPatient = await prisma.customer.findFirst({
        where: { OR: [{ allscriptsId: customerId }, { mrn: transformResult.data.mrn }] },
      });

      if (existingPatient) {
        const conflictResult = await conflictResolutionService.detectConflicts(
          'Customer', existingPatient.id, existingPatient, transformResult.data
        );
        if (conflictResult.hasConflicts) {
          conflicts.push(...conflictResult.conflicts);
          const resolutions = await conflictResolutionService.autoResolveConflicts('Customer', existingPatient.id);
          for (const resolution of resolutions) {
            if (resolution.success) {
              transformResult.data[resolution.conflictId.split('-')[1]] = resolution.resolvedValue;
            }
          }
        }
        await prisma.customer.update({
          where: { id: existingPatient.id },
          data: { ...transformResult.data, allscriptsId: customerId, lastSyncedAt: new Date() },
        });
      } else {
        await prisma.customer.create({
          data: { ...transformResult.data, allscriptsId: customerId, lastSyncedAt: new Date() },
        });
      }

      resourcesSucceeded++;
      await this.syncPatientClinicalData(customerId);

      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing customer from Allscripts:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  async syncPatientOutbound(customerId: string): Promise<AllscriptsSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      await this.ensureValidToken();
      const holoPatient = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!holoPatient) throw new Error('Customer not found in HoloVitals');

      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'allscripts',
        resourceType: 'Customer',
        direction: 'OUTBOUND',
        sourceFormat: DataFormat.CUSTOM_JSON,
        targetFormat: this.config.useFHIR ? DataFormat.FHIR_R4 : DataFormat.CUSTOM_JSON,
        options: { validateOutput: true, strictMode: true },
      };

      const transformResult = await dataTransformationService.transform(holoPatient, transformContext);

      if (!transformResult.success) {
        errors.push(...transformResult.errors.map(e => e.message));
        resourcesFailed++;
        return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
      }

      warnings.push(...transformResult.warnings.map(w => w.message));

      if (holoPatient.allscriptsId) {
        await this.updatePatientInAllscripts(holoPatient.allscriptsId, transformResult.data);
      } else {
        const allscriptsId = await this.createPatientInAllscripts(transformResult.data);
        await prisma.customer.update({ where: { id: customerId }, data: { allscriptsId } });
      }

      resourcesSucceeded++;
      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing customer to Allscripts:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  private async syncPatientClinicalData(customerId: string): Promise<void> {
    console.log('Syncing clinical data for customer:', customerId);
  }

  private async fetchPatientFromAllscripts(customerId: string): Promise<any> {
    const endpoint = this.config.useFHIR 
      ? `${this.config.baseUrl}/fhir/Customer/${customerId}`
      : `${this.config.baseUrl}/Unity/GetPatient`;
    
    const response = await fetch(endpoint, {
      method: this.config.useFHIR ? 'GET' : 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: this.config.useFHIR ? undefined : JSON.stringify({ PatientID: customerId }),
    });
    if (!response.ok) throw new Error(`Allscripts API error: ${response.statusText}`);
    return await response.json();
  }

  private async createPatientInAllscripts(customerData: any): Promise<string> {
    const endpoint = this.config.useFHIR 
      ? `${this.config.baseUrl}/fhir/Customer`
      : `${this.config.baseUrl}/Unity/SavePatient`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });
    if (!response.ok) throw new Error(`Allscripts API error: ${response.statusText}`);
    const result = await response.json();
    return result.id || result.PatientID;
  }

  private async updatePatientInAllscripts(customerId: string, customerData: any): Promise<void> {
    const endpoint = this.config.useFHIR 
      ? `${this.config.baseUrl}/fhir/Customer/${customerId}`
      : `${this.config.baseUrl}/Unity/SavePatient`;
    
    const response = await fetch(endpoint, {
      method: this.config.useFHIR ? 'PUT' : 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });
    if (!response.ok) throw new Error(`Allscripts API error: ${response.statusText}`);
  }

  private async ensureValidToken(): Promise<void> {
    if (this.accessToken) return;
    
    const response = await fetch(`${this.config.baseUrl}/Unity/GetToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        AppName: this.config.appName,
        Username: this.config.appUsername,
        Password: this.config.appPassword,
      }),
    });
    if (!response.ok) throw new Error('Failed to get access token');
    const data = await response.json();
    this.accessToken = data.Token;
  }
}