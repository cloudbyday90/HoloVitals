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

  async syncPatientInbound(patientId: string): Promise<EClinicalWorksSyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];
    let resourcesProcessed = 0;
    let resourcesSucceeded = 0;
    let resourcesFailed = 0;

    try {
      const ecwPatient = await this.fetchPatientFromECW(patientId);
      resourcesProcessed++;

      const transformContext: TransformationContext = {
        ehrProvider: 'eclinicalworks',
        resourceType: 'Patient',
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

      const existingPatient = await prisma.patient.findFirst({
        where: { OR: [{ ecwId: patientId }, { mrn: transformResult.data.mrn }] },
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
          data: { ...transformResult.data, ecwId: patientId, lastSyncedAt: new Date() },
        });
      } else {
        await prisma.patient.create({
          data: { ...transformResult.data, ecwId: patientId, lastSyncedAt: new Date() },
        });
      }

      resourcesSucceeded++;
      await this.syncPatientClinicalData(patientId);

      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing patient from eClinicalWorks:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  async syncPatientOutbound(patientId: string): Promise<EClinicalWorksSyncResult> {
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
        ehrProvider: 'eclinicalworks',
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

      if (holoPatient.ecwId) {
        await this.updatePatientInECW(holoPatient.ecwId, transformResult.data);
      } else {
        const ecwId = await this.createPatientInECW(transformResult.data);
        await prisma.patient.update({ where: { id: patientId }, data: { ecwId } });
      }

      resourcesSucceeded++;
      return { success: true, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    } catch (error) {
      console.error('Error syncing patient to eClinicalWorks:', error);
      errors.push(error.message);
      resourcesFailed++;
      return { success: false, resourcesProcessed, resourcesSucceeded, resourcesFailed, errors, warnings, conflicts };
    }
  }

  private async syncPatientClinicalData(patientId: string): Promise<void> {
    console.log('Syncing clinical data for patient:', patientId);
  }

  private async fetchPatientFromECW(patientId: string): Promise<any> {
    const endpoint = this.config.useFHIR 
      ? `${this.config.baseUrl}/fhir/Patient/${patientId}`
      : `${this.config.baseUrl}/api/patients/${patientId}`;
    
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

  private async createPatientInECW(patientData: any): Promise<string> {
    const endpoint = this.config.useFHIR 
      ? `${this.config.baseUrl}/fhir/Patient`
      : `${this.config.baseUrl}/api/patients`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-API-Key': this.config.apiKey,
        'X-Customer-ID': this.config.customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    if (!response.ok) throw new Error(`eClinicalWorks API error: ${response.statusText}`);
    const result = await response.json();
    return result.id || result.patientId;
  }

  private async updatePatientInECW(patientId: string, patientData: any): Promise<void> {
    const endpoint = this.config.useFHIR 
      ? `${this.config.baseUrl}/fhir/Patient/${patientId}`
      : `${this.config.baseUrl}/api/patients/${patientId}`;
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'X-API-Key': this.config.apiKey,
        'X-Customer-ID': this.config.customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    if (!response.ok) throw new Error(`eClinicalWorks API error: ${response.statusText}`);
  }
}