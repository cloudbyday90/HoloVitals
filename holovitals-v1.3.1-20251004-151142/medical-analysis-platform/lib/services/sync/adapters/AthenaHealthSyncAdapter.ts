/**
 * athenahealth EHR Sync Adapter
 * 
 * Handles bidirectional data synchronization with athenahealth EHR systems.
 * Supports athenaNet API.
 */

import { PrismaClient } from '@prisma/client';
import { dataTransformationService, TransformationContext, DataFormat } from '../DataTransformationService';
import { conflictResolutionService } from '../ConflictResolutionService';

const prisma = new PrismaClient();

export interface AthenaHealthSyncConfig {
  ehrConnectionId: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  practiceId: string;
  enableWebhooks: boolean;
  webhookSecret?: string;
}

export interface AthenaHealthSyncResult {
  success: boolean;
  resourcesProcessed: number;
  resourcesSucceeded: number;
  resourcesFailed: number;
  errors: string[];
  warnings: string[];
  conflicts: any[];
}

export class AthenaHealthSyncAdapter {
  private config: AthenaHealthSyncConfig;
  private accessToken?: string;

  constructor(config: AthenaHealthSyncConfig) {
    this.config = config;
    this.accessToken = config.accessToken;
  }

  async syncPatientInbound(patientId: string): Promise<AthenaHealthSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      await this.ensureValidToken();
      const athenaPatient = await this.fetchPatientFromAthena(patientId);
      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'athenahealth',
        resourceType: 'Patient',
        direction: 'INBOUND',
        sourceFormat: DataFormat.CUSTOM_JSON,
        targetFormat: DataFormat.CUSTOM_JSON,
        options: { validateOutput: true, strictMode: false, preserveUnmapped: true },
      };

      const transformResult = await dataTransformationService.transform(athenaPatient, transformContext);

      if (!transformResult.success) {
        errors.push(...transformResult.errors.map(e => e.message));
        resourcesFailed++;
        return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
      }

      warnings.push(...transformResult.warnings.map(w => w.message));

      const existingPatient = await prisma.patient.findFirst({
        where: { OR: [{ athenaId: patientId }, { mrn: transformResult.data.mrn }] },
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
          data: { ...transformResult.data, athenaId: patientId, lastSyncedAt: new Date() },
        });
      } else {
        await prisma.patient.create({
          data: { ...transformResult.data, athenaId: patientId, lastSyncedAt: new Date() },
        });
      }

      resourcesSucceeded++;
      await this.syncPatientClinicalData(patientId);

      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing patient from athenahealth:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  async syncPatientOutbound(patientId: string): Promise<AthenaHealthSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      await this.ensureValidToken();
      const holoPatient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!holoPatient) throw new Error('Patient not found in HoloVitals');

      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'athenahealth',
        resourceType: 'Patient',
        direction: 'OUTBOUND',
        sourceFormat: DataFormat.CUSTOM_JSON,
        targetFormat: DataFormat.CUSTOM_JSON,
        options: { validateOutput: true, strictMode: true },
      };

      const transformResult = await dataTransformationService.transform(holoPatient, transformContext);

      if (!transformResult.success) {
        errors.push(...transformResult.errors.map(e => e.message));
        resourcesFailed++;
        return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
      }

      warnings.push(...transformResult.warnings.map(w => w.message));

      if (holoPatient.athenaId) {
        await this.updatePatientInAthena(holoPatient.athenaId, transformResult.data);
      } else {
        const athenaId = await this.createPatientInAthena(transformResult.data);
        await prisma.patient.update({ where: { id: patientId }, data: { athenaId } });
      }

      resourcesSucceeded++;
      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing patient to athenahealth:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  private async syncPatientClinicalData(patientId: string): Promise<void> {
    console.log('Syncing clinical data for patient:', patientId);
  }

  private async fetchPatientFromAthena(patientId: string): Promise<any> {
    const response = await fetch(
      `${this.config.baseUrl}/v1/${this.config.practiceId}/patients/${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
        },
      }
    );
    if (!response.ok) throw new Error(`athenahealth API error: ${response.statusText}`);
    return await response.json();
  }

  private async createPatientInAthena(patientData: any): Promise<string> {
    const response = await fetch(
      `${this.config.baseUrl}/v1/${this.config.practiceId}/patients`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(patientData),
      }
    );
    if (!response.ok) throw new Error(`athenahealth API error: ${response.statusText}`);
    const result = await response.json();
    return result.patientid;
  }

  private async updatePatientInAthena(patientId: string, patientData: any): Promise<void> {
    const response = await fetch(
      `${this.config.baseUrl}/v1/${this.config.practiceId}/patients/${patientId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(patientData),
      }
    );
    if (!response.ok) throw new Error(`athenahealth API error: ${response.statusText}`);
  }

  private async ensureValidToken(): Promise<void> {
    if (this.accessToken) return;
    
    const response = await fetch(`${this.config.baseUrl}/oauth2/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });
    if (!response.ok) throw new Error('Failed to get access token');
    const data = await response.json();
    this.accessToken = data.access_token;
  }
}