/**
 * EHR Sync Service
 * 
 * Handles synchronization of FHIR data from EHR systems
 * Supports incremental and full sync
 */

import { PrismaClient } from '@prisma/client';
import { EHRConnectionService } from './EHRConnectionService';
import { FHIRClient } from '../fhir/FHIRClient';
import { PricingService } from './PricingService';
import { TokenService } from './TokenService';

const prisma = new PrismaClient();

export interface SyncOptions {
  connectionId: string;
  syncType?: 'incremental' | 'full';
  resourceTypes?: string[];
  downloadDocuments?: boolean;
}

export interface SyncProgress {
  syncId: string;
  status: string;
  resourcesQueried: number;
  resourcesCreated: number;
  resourcesUpdated: number;
  documentsDownloaded: number;
  totalBytesDownloaded: number;
  tokensEstimated: number;
  currentResource?: string;
}

export class EHRSyncService {
  /**
   * Start a sync operation
   */
  static async startSync(options: SyncOptions): Promise<string> {
    const connection = await prisma.eHRConnection.findUnique({
      where: { id: options.connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    if (connection.status !== 'ACTIVE') {
      throw new Error('Connection is not active');
    }

    // Create sync history record
    const syncHistory = await prisma.syncHistory.create({
      data: {
        connectionId: options.connectionId,
        status: 'QUEUED',
        syncType: options.syncType || 'incremental',
      },
    });

    // Start sync in background (in production, use a job queue)
    this.performSync(syncHistory.id, options).catch(error => {
      console.error('Sync failed:', error);
      prisma.syncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });
    });

    return syncHistory.id;
  }

  /**
   * Perform the actual sync operation
   */
  private static async performSync(syncId: string, options: SyncOptions): Promise<void> {
    const startTime = Date.now();

    // Update status to syncing
    await prisma.syncHistory.update({
      where: { id: syncId },
      data: {
        status: 'SYNCING',
        startedAt: new Date(),
      },
    });

    try {
      // Get FHIR client
      const fhirClient = await EHRConnectionService.getFHIRClient(options.connectionId);
      
      const connection = await prisma.eHRConnection.findUnique({
        where: { id: options.connectionId },
      });

      if (!connection?.patientId) {
        throw new Error('No patient ID available');
      }

      // Define resource types to sync
      const resourceTypes = options.resourceTypes || [
        'DocumentReference',
        'Observation',
        'Condition',
        'MedicationRequest',
        'AllergyIntolerance',
        'Immunization',
        'Procedure',
      ];

      let totalQueried = 0;
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalFailed = 0;
      let documentsDownloaded = 0;
      let totalBytesDownloaded = 0;

      // Sync each resource type
      for (const resourceType of resourceTypes) {
        try {
          const result = await this.syncResourceType(
            fhirClient,
            connection.id,
            connection.patientId,
            resourceType,
            options.syncType === 'full' ? undefined : connection.lastSyncAt || undefined,
            options.downloadDocuments ?? true
          );

          totalQueried += result.queried;
          totalCreated += result.created;
          totalUpdated += result.updated;
          totalSkipped += result.skipped;
          totalFailed += result.failed;
          documentsDownloaded += result.documentsDownloaded;
          totalBytesDownloaded += result.bytesDownloaded;
        } catch (error: any) {
          console.error(`Failed to sync ${resourceType}:`, error);
          totalFailed++;
        }
      }

      // Calculate duration
      const duration = Math.floor((Date.now() - startTime) / 1000);

      // Update sync history
      await prisma.syncHistory.update({
        where: { id: syncId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration,
          resourcesQueried: totalQueried,
          resourcesCreated: totalCreated,
          resourcesUpdated: totalUpdated,
          resourcesSkipped: totalSkipped,
          resourcesFailed: totalFailed,
          documentsDownloaded,
          totalBytesDownloaded: BigInt(totalBytesDownloaded),
        },
      });

      // Update connection sync schedule
      await EHRConnectionService.updateSyncSchedule(options.connectionId);

    } catch (error: any) {
      const duration = Math.floor((Date.now() - startTime) / 1000);

      await prisma.syncHistory.update({
        where: { id: syncId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration,
          errorMessage: error.message,
          errorDetails: JSON.stringify({
            name: error.name,
            stack: error.stack,
          }),
        },
      });

      throw error;
    }
  }

  /**
   * Sync a specific resource type
   */
  private static async syncResourceType(
    fhirClient: FHIRClient,
    connectionId: string,
    patientId: string,
    resourceType: string,
    since?: Date,
    downloadDocuments: boolean = true
  ): Promise<{
    queried: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    documentsDownloaded: number;
    bytesDownloaded: number;
  }> {
    let queried = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let documentsDownloaded = 0;
    let bytesDownloaded = 0;

    try {
      // Build search parameters
      const searchParams: any = {};
      if (since) {
        searchParams._lastUpdated = `gt${since.toISOString()}`;
      }

      // Search for resources
      let resources: any[] = [];
      
      switch (resourceType) {
        case 'DocumentReference':
          resources = await fhirClient.getDocumentReferences(patientId, searchParams);
          break;
        case 'Observation':
          resources = await fhirClient.getObservations(patientId, searchParams);
          break;
        case 'Condition':
          resources = await fhirClient.getConditions(patientId, searchParams);
          break;
        case 'MedicationRequest':
          resources = await fhirClient.getMedicationRequests(patientId, searchParams);
          break;
        case 'AllergyIntolerance':
          resources = await fhirClient.getAllergyIntolerances(patientId, searchParams);
          break;
        case 'Immunization':
          resources = await fhirClient.getImmunizations(patientId, searchParams);
          break;
        case 'Procedure':
          resources = await fhirClient.getProcedures(patientId, searchParams);
          break;
        default:
          resources = await fhirClient.searchAll(resourceType, {
            patient: patientId,
            ...searchParams,
          });
      }

      queried = resources.length;

      // Process each resource
      for (const resource of resources) {
        try {
          const result = await this.saveResource(
            connectionId,
            resource,
            resourceType,
            fhirClient,
            downloadDocuments
          );

          if (result.created) created++;
          if (result.updated) updated++;
          if (result.skipped) skipped++;
          if (result.documentDownloaded) {
            documentsDownloaded++;
            bytesDownloaded += result.bytesDownloaded || 0;
          }
        } catch (error) {
          console.error(`Failed to save resource ${resource.id}:`, error);
          failed++;
        }
      }
    } catch (error) {
      console.error(`Failed to sync resource type ${resourceType}:`, error);
      throw error;
    }

    return {
      queried,
      created,
      updated,
      skipped,
      failed,
      documentsDownloaded,
      bytesDownloaded,
    };
  }

  /**
   * Save a FHIR resource to database
   */
  private static async saveResource(
    connectionId: string,
    resource: any,
    resourceType: string,
    fhirClient: FHIRClient,
    downloadDocuments: boolean
  ): Promise<{
    created: boolean;
    updated: boolean;
    skipped: boolean;
    documentDownloaded: boolean;
    bytesDownloaded?: number;
  }> {
    const fhirId = resource.id;
    if (!fhirId) {
      return { created: false, updated: false, skipped: true, documentDownloaded: false };
    }

    // Check if resource already exists
    const existing = await prisma.fHIRResource.findUnique({
      where: {
        connectionId_fhirId_resourceType: {
          connectionId,
          fhirId,
          resourceType: resourceType as any,
        },
      },
    });

    // Extract metadata
    const metadata = this.extractMetadata(resource, resourceType);

    // Handle document download
    let documentDownloaded = false;
    let bytesDownloaded = 0;
    let localFilePath: string | undefined;

    if (resourceType === 'DocumentReference' && downloadDocuments) {
      try {
        const buffer = await fhirClient.downloadDocument(resource);
        bytesDownloaded = buffer.length;
        
        // Save document to file system (in production, use cloud storage)
        const fileName = `${connectionId}_${fhirId}_${Date.now()}.pdf`;
        localFilePath = `/uploads/ehr/${fileName}`;
        
        // TODO: Actually save the file
        // fs.writeFileSync(localFilePath, buffer);
        
        documentDownloaded = true;
      } catch (error) {
        console.error('Failed to download document:', error);
      }
    }

    if (existing) {
      // Update existing resource
      await prisma.fHIRResource.update({
        where: { id: existing.id },
        data: {
          rawData: JSON.stringify(resource),
          ...metadata,
          documentDownloaded: documentDownloaded || existing.documentDownloaded,
          localFilePath: localFilePath || existing.localFilePath,
          updatedAt: new Date(),
        },
      });

      return {
        created: false,
        updated: true,
        skipped: false,
        documentDownloaded,
        bytesDownloaded,
      };
    } else {
      // Create new resource
      await prisma.fHIRResource.create({
        data: {
          connectionId,
          resourceType: resourceType as any,
          fhirId,
          rawData: JSON.stringify(resource),
          ...metadata,
          documentDownloaded,
          localFilePath,
        },
      });

      return {
        created: true,
        updated: false,
        skipped: false,
        documentDownloaded,
        bytesDownloaded,
      };
    }
  }

  /**
   * Extract metadata from FHIR resource
   */
  private static extractMetadata(resource: any, resourceType: string): any {
    const metadata: any = {
      title: undefined,
      description: undefined,
      date: undefined,
      category: undefined,
      status: resource.status,
      contentType: undefined,
      contentUrl: undefined,
      contentSize: undefined,
    };

    switch (resourceType) {
      case 'DocumentReference':
        metadata.title = resource.description || resource.type?.text;
        metadata.date = resource.date ? new Date(resource.date) : undefined;
        metadata.category = resource.category?.[0]?.text;
        
        const content = resource.content?.[0];
        if (content?.attachment) {
          metadata.contentType = content.attachment.contentType;
          metadata.contentUrl = content.attachment.url;
          metadata.contentSize = content.attachment.size;
        }
        break;

      case 'Observation':
        metadata.title = resource.code?.text || resource.code?.coding?.[0]?.display;
        metadata.date = resource.effectiveDateTime ? new Date(resource.effectiveDateTime) : undefined;
        metadata.category = resource.category?.[0]?.text;
        metadata.description = resource.valueString || resource.valueQuantity?.value?.toString();
        break;

      case 'Condition':
        metadata.title = resource.code?.text || resource.code?.coding?.[0]?.display;
        metadata.date = resource.recordedDate ? new Date(resource.recordedDate) : undefined;
        metadata.category = resource.category?.[0]?.text;
        break;

      case 'MedicationRequest':
        metadata.title = resource.medicationCodeableConcept?.text || 
                        resource.medicationCodeableConcept?.coding?.[0]?.display;
        metadata.date = resource.authoredOn ? new Date(resource.authoredOn) : undefined;
        break;

      case 'AllergyIntolerance':
        metadata.title = resource.code?.text || resource.code?.coding?.[0]?.display;
        metadata.date = resource.recordedDate ? new Date(resource.recordedDate) : undefined;
        metadata.category = resource.category?.[0];
        break;

      case 'Immunization':
        metadata.title = resource.vaccineCode?.text || resource.vaccineCode?.coding?.[0]?.display;
        metadata.date = resource.occurrenceDateTime ? new Date(resource.occurrenceDateTime) : undefined;
        break;

      case 'Procedure':
        metadata.title = resource.code?.text || resource.code?.coding?.[0]?.display;
        metadata.date = resource.performedDateTime ? new Date(resource.performedDateTime) : undefined;
        break;
    }

    return metadata;
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(syncId: string): Promise<any> {
    return prisma.syncHistory.findUnique({
      where: { id: syncId },
    });
  }

  /**
   * Get sync history for a connection
   */
  static async getSyncHistory(connectionId: string, limit: number = 10): Promise<any[]> {
    return prisma.syncHistory.findMany({
      where: { connectionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Cancel an ongoing sync
   */
  static async cancelSync(syncId: string): Promise<any> {
    return prisma.syncHistory.update({
      where: { id: syncId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Get synced resources for a connection
   */
  static async getSyncedResources(
    connectionId: string,
    resourceType?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ resources: any[]; total: number }> {
    const where: any = { connectionId };
    if (resourceType) {
      where.resourceType = resourceType;
    }

    const [resources, total] = await Promise.all([
      prisma.fHIRResource.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.fHIRResource.count({ where }),
    ]);

    return { resources, total };
  }
}