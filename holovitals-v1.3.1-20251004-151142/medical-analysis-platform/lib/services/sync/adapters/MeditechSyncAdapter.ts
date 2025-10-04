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

  async syncPatientInbound(patientId: string): Promise<MeditechSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      const meditechPatient = await this.fetchPatientFromMeditech(patientId);
      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'meditech',
        resourceType: 'Patient',
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

      const existingPatient = await prisma.patient.findFirst({
        where: { OR: [{ meditechId: patientId }, { mrn: transformResult.data.mrn }] },
      });

      if (existingPatient) {
        const conflictResult = await conflictResolutionService.detectConflicts(
          'Patient', existingPatient.id, existingPatient, transformResult.data
        );
        if (conflictResult.hasConflicts) {
          conflicts.push(...conflictResult.conflicts);
          const resolutions = await conflictResolutionService.autoResolveConflicts('Patient', existingPatient.id);
          for (const resolution of resolutions) {
            if (resolution.success) {
              transformResult.data[resolution.conflictId.split('-')[1]] = resolution.resolvedValue;
            }
          }
        }
        await prisma.patient.update({
          where: { id: existingPatient.id },
          data: { ...transformResult.data, meditechId: patientId, lastSyncedAt: new Date() },
        });
      } else {
        await prisma.patient.create({
          data: { ...transformResult.data, meditechId: patientId, lastSyncedAt: new Date() },
        });
      }

      resourcesSucceeded++;
      await this.syncPatientClinicalData(patientId);

      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing patient from MEDITECH:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  async syncPatientOutbound(patientId: string): Promise<MeditechSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      const holoPatient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!holoPatient) throw new Error('Patient not found in HoloVitals');

      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'meditech',
        resourceType: 'Patient',
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
        await prisma.patient.update({ where: { id: patientId }, data: { meditechId } });
      }

      resourcesSucceeded++;
      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing patient to MEDITECH:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  private async syncPatientClinicalData(patientId: string): Promise<void> {
    // Sync observations, medications, allergies, conditions
    console.log('Syncing clinical data for patient:', patientId);
  }

  private async fetchPatientFromMeditech(patientId: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/patients/${patientId}`, {
      headers: { 'X-API-Key': this.config.apiKey, 'X-Facility-ID': this.config.facilityId },
    });
    if (!response.ok) throw new Error(`MEDITECH API error: ${response.statusText}`);
    return await response.json();
  }

  private async createPatientInMeditech(patientData: any): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/patients`, {
      method: 'POST',
      headers: { 'X-API-Key': this.config.apiKey, 'X-Facility-ID': this.config.facilityId, 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    if (!response.ok) throw new Error(`MEDITECH API error: ${response.statusText}`);
    const result = await response.json();
    return result.id;
  }

  private async updatePatientInMeditech(patientId: string, patientData: any): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/patients/${patientId}`, {
      method: 'PUT',
      headers: { 'X-API-Key': this.config.apiKey, 'X-Facility-ID': this.config.facilityId, 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    if (!response.ok) throw new Error(`MEDITECH API error: ${response.statusText}`);
  }
}