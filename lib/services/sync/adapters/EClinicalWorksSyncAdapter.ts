/**
 * eClinicalWorks EHR Sync Adapter
 * 
 * Handles bidirectional data synchronization with eClinicalWorks EHR systems.
 * Supports eClinicalWorks API and FHIR.
 */

import { PrismaClient } from '@prisma/client';
import { dataTransformationService, TransformationContext, DataFormat } from '../DataTransformationService';
import { conflictResolutionService } from '../ConflictResolutionService';

const prisma = new PrismaClient();

export interface EClinicalWorksSyncConfig {
  ehrConnectionId: string;
  baseUrl: string;
  apiKey: string;
  customerId: string;
  useFHIR: boolean;
  enableWebhooks: boolean;
  webhookSecret?: string;
}

export interface EClinicalWorksSyncResult {
  success: boolean;
  resourcesProcessed: number;
  resourcesSucceeded: number;
  resourcesFailed: number;
  errors: string[];
  warnings: string[];
  conflicts: any[];
}

export class EClinicalWorksSyncAdapter {
  private config: EClinicalWorksSyncConfig;

  constructor(config: EClinicalWorksSyncConfig) {
    this.config = config;
  }

  async syncPatientInbound(customerId: string): Promise<EClinicalWorksSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      const ecwPatient = await this.fetchPatientFromECW(customerId);
      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'eclinicalworks',
        resourceType: 'Customer',
        direction: 'INBOUND',
        sourceFormat: this.config.useFHIR ? DataFormat.FHIR_R4 : DataFormat.CUSTOM_JSON,
        targetFormat: DataFormat.CUSTOM_JSON,
        options: { validateOutput: true, strictMode: false, preserveUnmapped: true },
      };

      const transformResult = await dataTransformationService.transform(ecwPatient, transformContext);

      if (!transformResult.success) {
        errors.push(...transformResult.errors.map(e => e.message));
        resourcesFailed++;
        return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
      }

      warnings.push(...transformResult.warnings.map(w => w.message));

      const existingPatient = await prisma.customer.findFirst({
        where: { OR: [{ ecwId: customerId }, { mrn: transformResult.data.mrn }] },
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
          data: { ...transformResult.data, ecwId: customerId, lastSyncedAt: new Date() },
        });
      } else {
        await prisma.customer.create({
          data: { ...transformResult.data, ecwId: customerId, lastSyncedAt: new Date() },
        });
      }

      resourcesSucceeded++;
      await this.syncPatientClinicalData(customerId);

      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing customer from eClinicalWorks:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  async syncPatientOutbound(customerId: string): Promise<EClinicalWorksSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      const holoPatient = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!holoPatient) throw new Error('Customer not found in HoloVitals');

      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'eclinicalworks',
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

      if (holoPatient.ecwId) {
        await this.updatePatientInECW(holoPatient.ecwId, transformResult.data);
      } else {
        const ecwId = await this.createPatientInECW(transformResult.data);
        await prisma.customer.update({ where: { id: customerId }, data: { ecwId } });
      }

      resourcesSucceeded++;
      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing customer to eClinicalWorks:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  private async syncPatientClinicalData(customerId: string): Promise<void> {
    console.log('Syncing clinical data for customer:', customerId);
  }

  private async fetchPatientFromECW(customerId: string): Promise<any> {
    const endpoint = this.config.useFHIR 
      ? `${this.config.baseUrl}/fhir/Customer/${customerId}`
      : `${this.config.baseUrl}/api/customers/${customerId}`;
    
    const response = await fetch(endpoint, {
      headers: {
        'X-API-Key': this.config.apiKey,
        'X-Customer-ID': this.config.customerId,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`eClinicalWorks API error: ${response.statusText}`);
    return await response.json();
  }

  private async createPatientInECW(customerData: any): Promise<string> {
    const endpoint = this.config.useFHIR 
      ? `${this.config.baseUrl}/fhir/Customer`
      : `${this.config.baseUrl}/api/customers`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-API-Key': this.config.apiKey,
        'X-Customer-ID': this.config.customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });
    if (!response.ok) throw new Error(`eClinicalWorks API error: ${response.statusText}`);
    const result = await response.json();
    return result.id || result.customerId;
  }

  private async updatePatientInECW(customerId: string, customerData: any): Promise<void> {
    const endpoint = this.config.useFHIR 
      ? `${this.config.baseUrl}/fhir/Customer/${customerId}`
      : `${this.config.baseUrl}/api/customers/${customerId}`;
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'X-API-Key': this.config.apiKey,
        'X-Customer-ID': this.config.customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });
    if (!response.ok) throw new Error(`eClinicalWorks API error: ${response.statusText}`);
  }
}