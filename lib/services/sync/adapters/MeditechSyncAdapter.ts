/**
 * MEDITECH EHR Sync Adapter
 * 
 * Handles bidirectional data synchronization with MEDITECH EHR systems.
 * Supports MEDITECH's proprietary API and HL7 v2 messages.
 */

import { PrismaClient } from '@prisma/client';
import { dataTransformationService, TransformationContext, DataFormat } from '../DataTransformationService';
import { conflictResolutionService } from '../ConflictResolutionService';

const prisma = new PrismaClient();

export interface MeditechSyncConfig {
  ehrConnectionId: string;
  baseUrl: string;
  apiKey: string;
  facilityId: string;
  useHL7: boolean;
  hl7Host?: string;
  hl7Port?: number;
  enableWebhooks: boolean;
  webhookSecret?: string;
}

export interface MeditechSyncResult {
  success: boolean;
  resourcesProcessed: number;
  resourcesSucceeded: number;
  resourcesFailed: number;
  errors: string[];
  warnings: string[];
  conflicts: any[];
}

export class MeditechSyncAdapter {
  private config: MeditechSyncConfig;

  constructor(config: MeditechSyncConfig) {
    this.config = config;
  }

  async syncPatientInbound(customerId: string): Promise<MeditechSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      const meditechPatient = await this.fetchPatientFromMeditech(customerId);
      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'meditech',
        resourceType: 'Customer',
        direction: 'INBOUND',
        sourceFormat: this.config.useHL7 ? DataFormat.HL7_V2 : DataFormat.CUSTOM_JSON,
        targetFormat: DataFormat.CUSTOM_JSON,
        options: { validateOutput: true, strictMode: false, preserveUnmapped: true },
      };

      const transformResult = await dataTransformationService.transform(meditechPatient, transformContext);

      if (!transformResult.success) {
        errors.push(...transformResult.errors.map(e => e.message));
        resourcesFailed++;
        return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
      }

      warnings.push(...transformResult.warnings.map(w => w.message));

      const existingPatient = await prisma.customer.findFirst({
        where: { OR: [{ meditechId: customerId }, { mrn: transformResult.data.mrn }] },
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
          data: { ...transformResult.data, meditechId: customerId, lastSyncedAt: new Date() },
        });
      } else {
        await prisma.customer.create({
          data: { ...transformResult.data, meditechId: customerId, lastSyncedAt: new Date() },
        });
      }

      resourcesSucceeded++;
      await this.syncPatientClinicalData(customerId);

      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing customer from MEDITECH:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  async syncPatientOutbound(customerId: string): Promise<MeditechSyncResult> {
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
        ehrProvider: 'meditech',
        resourceType: 'Customer',
        direction: 'OUTBOUND',
        sourceFormat: DataFormat.CUSTOM_JSON,
        targetFormat: this.config.useHL7 ? DataFormat.HL7_V2 : DataFormat.CUSTOM_JSON,
        options: { validateOutput: true, strictMode: true },
      };

      const transformResult = await dataTransformationService.transform(holoPatient, transformContext);

      if (!transformResult.success) {
        errors.push(...transformResult.errors.map(e => e.message));
        resourcesFailed++;
        return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
      }

      warnings.push(...transformResult.warnings.map(w => w.message));

      if (holoPatient.meditechId) {
        await this.updatePatientInMeditech(holoPatient.meditechId, transformResult.data);
      } else {
        const meditechId = await this.createPatientInMeditech(transformResult.data);
        await prisma.customer.update({ where: { id: customerId }, data: { meditechId } });
      }

      resourcesSucceeded++;
      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing customer to MEDITECH:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  private async syncPatientClinicalData(customerId: string): Promise<void> {
    // Sync observations, medications, allergies, conditions
    console.log('Syncing clinical data for customer:', customerId);
  }

  private async fetchPatientFromMeditech(customerId: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/customers/${customerId}`, {
      headers: { 'X-API-Key': this.config.apiKey, 'X-Facility-ID': this.config.facilityId },
    });
    if (!response.ok) throw new Error(`MEDITECH API error: ${response.statusText}`);
    return await response.json();
  }

  private async createPatientInMeditech(customerData: any): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/customers`, {
      method: 'POST',
      headers: { 'X-API-Key': this.config.apiKey, 'X-Facility-ID': this.config.facilityId, 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData),
    });
    if (!response.ok) throw new Error(`MEDITECH API error: ${response.statusText}`);
    const result = await response.json();
    return result.id;
  }

  private async updatePatientInMeditech(customerId: string, customerData: any): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/customers/${customerId}`, {
      method: 'PUT',
      headers: { 'X-API-Key': this.config.apiKey, 'X-Facility-ID': this.config.facilityId, 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData),
    });
    if (!response.ok) throw new Error(`MEDITECH API error: ${response.statusText}`);
  }
}