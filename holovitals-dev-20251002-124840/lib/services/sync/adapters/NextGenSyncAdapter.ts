/**
 * NextGen Healthcare EHR Sync Adapter
 * 
 * Handles bidirectional data synchronization with NextGen Healthcare EHR systems.
 * Supports NextGen API and FHIR R4.
 */

import { PrismaClient } from '@prisma/client';
import { dataTransformationService, TransformationContext, DataFormat } from '../DataTransformationService';
import { conflictResolutionService } from '../ConflictResolutionService';

const prisma = new PrismaClient();

export interface NextGenSyncConfig {
  ehrConnectionId: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  practiceId: string;
  useFHIR: boolean;
  enableWebhooks: boolean;
  webhookSecret?: string;
}

export interface NextGenSyncResult {
  success: boolean;
  resourcesProcessed: number;
  resourcesSucceeded: number;
  resourcesFailed: number;
  errors: string[];
  warnings: string[];
  conflicts: any[];
}

export class NextGenSyncAdapter {
  private config: NextGenSyncConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: NextGenSyncConfig) {
    this.config = config;
    this.accessToken = config.accessToken;
  }

  async syncPatientInbound(patientId: string): Promise<NextGenSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      await this.ensureValidToken();
      const nextgenPatient = await this.fetchPatientFromNextGen(patientId);
      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'nextgen',
        resourceType: 'Patient',
        direction: 'INBOUND',
        sourceFormat: this.config.useFHIR ? DataFormat.FHIR_R4 : DataFormat.CUSTOM_JSON,
        targetFormat: DataFormat.CUSTOM_JSON,
        options: { validateOutput: true, strictMode: false, preserveUnmapped: true },
      };

      const transformResult = await dataTransformationService.transform(nextgenPatient, transformContext);

      if (!transformResult.success) {
        errors.push(...transformResult.errors.map(e => e.message));
        resourcesFailed++;
        return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
      }

      warnings.push(...transformResult.warnings.map(w => w.message));

      const existingPatient = await prisma.patient.findFirst({
        where: { OR: [{ nextgenId: patientId }, { mrn: transformResult.data.mrn }] },
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
          data: { ...transformResult.data, nextgenId: patientId, lastSyncedAt: new Date() },
        });
      } else {
        await prisma.patient.create({
          data: { ...transformResult.data, nextgenId: patientId, lastSyncedAt: new Date() },
        });
      }

      resourcesSucceeded++;
      await this.syncPatientClinicalData(patientId);

      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing patient from NextGen:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  async syncPatientOutbound(patientId: string): Promise<NextGenSyncResult> {
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
        ehrProvider: 'nextgen',
        resourceType: 'Patient',
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

      if (holoPatient.nextgenId) {
        await this.updatePatientInNextGen(holoPatient.nextgenId, transformResult.data);
      } else {
        const nextgenId = await this.createPatientInNextGen(transformResult.data);
        await prisma.patient.update({ where: { id: patientId }, data: { nextgenId } });
      }

      resourcesSucceeded++;
      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing patient to NextGen:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  private async syncPatientClinicalData(patientId: string): Promise<void> {
    console.log('Syncing clinical data for patient:', patientId);
  }

  private async fetchPatientFromNextGen(patientId: string): Promise<any> {
    const endpoint = this.config.useFHIR 
      ? `${this.config.baseUrl}/fhir/Patient/${patientId}`
      : `${this.config.baseUrl}/api/patients/${patientId}`;
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Practice-ID': this.config.practiceId,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`NextGen API error: ${response.statusText}`);
    return await response.json();
  }

  private async createPatientInNextGen(patientData: any): Promise<string> {
    const endpoint = this.config.useFHIR 
      ? `${this.config.baseUrl}/fhir/Patient`
      : `${this.config.baseUrl}/api/patients`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Practice-ID': this.config.practiceId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    if (!response.ok) throw new Error(`NextGen API error: ${response.statusText}`);
    const result = await response.json();
    return result.id || result.patientId;
  }

  private async updatePatientInNextGen(patientId: string, patientData: any): Promise<void> {
    const endpoint = this.config.useFHIR 
      ? `${this.config.baseUrl}/fhir/Patient/${patientId}`
      : `${this.config.baseUrl}/api/patients/${patientId}`;
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Practice-ID': this.config.practiceId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    if (!response.ok) throw new Error(`NextGen API error: ${response.statusText}`);
  }

  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) return;
    if (this.config.refreshToken) {
      await this.refreshAccessToken();
    } else {
      throw new Error('No valid access token available');
    }
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken!,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });
    if (!response.ok) throw new Error('Failed to refresh access token');
    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
  }
}