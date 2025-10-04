/**
 * eClinicalWorks Enhanced Service
 * 
 * Provides enhanced integration with eClinicalWorks EHR system including:
 * - Bulk data export using FHIR $export
 * - Enhanced resource types (DiagnosticReport, CarePlan, Encounter)
 * - Customer portal integration
 * - Clinical documentation
 * - Telehealth integration
 * - Rate limiting (7 requests/second)
 * 
 * Market Share: 5% of US healthcare
 * FHIR Version: R4
 */

import { PrismaClient } from '@prisma/client';
import { FHIRClient } from '../fhir/FHIRClient';

const prisma = new PrismaClient();

// eClinicalWorks-specific resource types
export enum EClinicalWorksResourceType {
  DIAGNOSTIC_REPORT = 'DiagnosticReport',
  CARE_PLAN = 'CarePlan',
  ENCOUNTER = 'Encounter',
  COMMUNICATION = 'Communication',
  TASK = 'Task',
}

// Bulk export job status
export enum BulkExportStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Bulk export type
export enum BulkExportType {
  CUSTOMER = 'Customer',
  GROUP = 'Group',
  SYSTEM = 'System',
}

interface BulkExportJob {
  id: string;
  connectionId: string;
  exportType: BulkExportType;
  status: BulkExportStatus;
  statusUrl?: string;
  outputUrls?: string[];
  errorMessage?: string;
  resourceTypes: string[];
  since?: Date;
  startedAt: Date;
  completedAt?: Date;
}

interface EnhancedSyncOptions {
  includeStandard?: boolean;
  includeEnhanced?: boolean;
  resourceTypes?: EClinicalWorksResourceType[];
  since?: Date;
}

export class EClinicalWorksEnhancedService {
  private fhirClient: FHIRClient;
  private rateLimitDelay = 143; // 7 requests/second = 143ms between requests

  constructor() {
    this.fhirClient = new FHIRClient();
  }

  /**
   * Initialize bulk data export
   * Uses FHIR $export operation for efficient data retrieval
   */
  async initiateBulkExport(
    connectionId: string,
    options: {
      exportType?: BulkExportType;
      resourceTypes?: string[];
      since?: Date;
    } = {}
  ): Promise<BulkExportJob> {
    const connection = await this.getConnection(connectionId);
    
    const {
      exportType = BulkExportType.CUSTOMER,
      resourceTypes = [
        'Customer',
        'Observation',
        'Condition',
        'MedicationRequest',
        'AllergyIntolerance',
        'Immunization',
        'Procedure',
        'DiagnosticReport',
        'CarePlan',
        'Encounter',
        'Communication',
        'Task',
      ],
      since,
    } = options;

    // Construct export URL based on type
    let exportUrl = `${connection.fhirEndpoint}`;
    if (exportType === BulkExportType.CUSTOMER) {
      exportUrl += `/Customer/$export`;
    } else if (exportType === BulkExportType.GROUP) {
      exportUrl += `/Group/${connection.userId}/$export`;
    } else {
      exportUrl += `/$export`;
    }

    // Add parameters
    const params = new URLSearchParams();
    params.append('_type', resourceTypes.join(','));
    if (since) {
      params.append('_since', since.toISOString());
    }

    // Initiate export
    const response = await fetch(`${exportUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
        'Accept': 'application/fhir+json',
        'Prefer': 'respond-async',
      },
    });

    if (response.status !== 202) {
      throw new Error(`Bulk export initiation failed: ${response.statusText}`);
    }

    const statusUrl = response.headers.get('Content-Location');
    if (!statusUrl) {
      throw new Error('No status URL returned from bulk export');
    }

    // Create job record
    const job = await prisma.bulkExportJob.create({
      data: {
        connectionId,
        exportType,
        status: BulkExportStatus.IN_PROGRESS,
        statusUrl,
        resourceTypes,
        since,
        startedAt: new Date(),
      },
    });

    return job as any;
  }

  /**
   * Check bulk export status
   */
  async checkBulkExportStatus(jobId: string): Promise<BulkExportJob> {
    const job = await prisma.bulkExportJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Bulk export job not found');
    }

    if (job.status === BulkExportStatus.COMPLETED || job.status === BulkExportStatus.FAILED) {
      return job as any;
    }

    const connection = await this.getConnection(job.connectionId);

    // Check status
    const response = await fetch(job.statusUrl!, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
        'Accept': 'application/fhir+json',
      },
    });

    if (response.status === 202) {
      // Still in progress
      return {
        ...job,
        status: BulkExportStatus.IN_PROGRESS,
      } as any;
    }

    if (response.status === 200) {
      // Completed
      const result = await response.json();
      
      const outputUrls = result.output?.map((o: any) => o.url) || [];

      const updatedJob = await prisma.bulkExportJob.update({
        where: { id: jobId },
        data: {
          status: BulkExportStatus.COMPLETED,
          outputUrls,
          completedAt: new Date(),
        },
      });

      return updatedJob as any;
    }

    // Failed
    const updatedJob = await prisma.bulkExportJob.update({
      where: { id: jobId },
      data: {
        status: BulkExportStatus.FAILED,
        errorMessage: `Export failed with status ${response.status}`,
        completedAt: new Date(),
      },
    });

    return updatedJob as any;
  }

  /**
   * Download and process bulk export data
   */
  async processBulkExportData(jobId: string): Promise<void> {
    const job = await this.checkBulkExportStatus(jobId);

    if (job.status !== BulkExportStatus.COMPLETED) {
      throw new Error(`Job not completed. Current status: ${job.status}`);
    }

    const connection = await this.getConnection(job.connectionId);

    // Process each output file
    for (const url of job.outputUrls || []) {
      await this.processNDJSONFile(url, connection.accessToken!, connection.userId);
      
      // Rate limiting
      await this.delay(this.rateLimitDelay);
    }
  }

  /**
   * Process NDJSON file from bulk export
   */
  private async processNDJSONFile(
    url: string,
    accessToken: string,
    userId: string
  ): Promise<void> {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const resource = JSON.parse(line);
        await this.storeResource(resource, userId);
      } catch (error) {
        console.error('Error processing NDJSON line:', error);
      }
    }
  }

  /**
   * Enhanced sync with eClinicalWorks-specific features
   */
  async enhancedSync(
    connectionId: string,
    options: EnhancedSyncOptions = {}
  ): Promise<{
    standardResources: number;
    enhancedResources: number;
    total: number;
  }> {
    const {
      includeStandard = true,
      includeEnhanced = true,
      resourceTypes = Object.values(EClinicalWorksResourceType),
      since,
    } = options;

    let standardCount = 0;
    let enhancedCount = 0;

    // Sync standard resources if requested
    if (includeStandard) {
      standardCount = await this.syncStandardResources(connectionId, since);
    }

    // Sync enhanced resources if requested
    if (includeEnhanced) {
      for (const resourceType of resourceTypes) {
        const count = await this.syncEnhancedResource(connectionId, resourceType, since);
        enhancedCount += count;
        
        // Rate limiting
        await this.delay(this.rateLimitDelay);
      }
    }

    return {
      standardResources: standardCount,
      enhancedResources: enhancedCount,
      total: standardCount + enhancedCount,
    };
  }

  /**
   * Sync standard FHIR resources
   */
  private async syncStandardResources(
    connectionId: string,
    since?: Date
  ): Promise<number> {
    const connection = await this.getConnection(connectionId);
    const resourceTypes = [
      'Customer',
      'Observation',
      'Condition',
      'MedicationRequest',
      'AllergyIntolerance',
      'Immunization',
      'Procedure',
    ];

    let count = 0;
    for (const resourceType of resourceTypes) {
      const resources = await this.fhirClient.searchResources(
        connection.fhirEndpoint!,
        connection.accessToken!,
        resourceType,
        {
          customer: connection.userId,
          _since: since?.toISOString(),
        }
      );

      for (const resource of resources) {
        await this.storeResource(resource, connection.userId);
        count++;
      }

      // Rate limiting
      await this.delay(this.rateLimitDelay);
    }

    return count;
  }

  /**
   * Sync enhanced resource type
   */
  private async syncEnhancedResource(
    connectionId: string,
    resourceType: EClinicalWorksResourceType,
    since?: Date
  ): Promise<number> {
    const connection = await this.getConnection(connectionId);

    const resources = await this.fhirClient.searchResources(
      connection.fhirEndpoint!,
      connection.accessToken!,
      resourceType,
      {
        customer: connection.userId,
        _since: since?.toISOString(),
      }
    );

    let count = 0;
    for (const resource of resources) {
      await this.storeEnhancedResource(resource, connection.userId, resourceType);
      count++;
    }

    return count;
  }

  /**
   * Store enhanced resource with eClinicalWorks-specific data extraction
   */
  private async storeEnhancedResource(
    resource: any,
    userId: string,
    resourceType: EClinicalWorksResourceType
  ): Promise<void> {
    // Store base resource
    await this.storeResource(resource, userId);

    // Extract and store eClinicalWorks-specific data
    const specificData: any = {
      resourceType,
      resourceId: resource.id,
    };

    switch (resourceType) {
      case EClinicalWorksResourceType.DIAGNOSTIC_REPORT:
        specificData.reportType = resource.code?.text;
        specificData.status = resource.status;
        specificData.category = resource.category?.[0]?.coding?.[0]?.display;
        specificData.effectiveDateTime = resource.effectiveDateTime;
        specificData.issued = resource.issued;
        specificData.conclusion = resource.conclusion;
        specificData.presentedForm = resource.presentedForm?.map((pf: any) => ({
          contentType: pf.contentType,
          url: pf.url,
          title: pf.title,
        }));
        break;

      case EClinicalWorksResourceType.CARE_PLAN:
        specificData.status = resource.status;
        specificData.intent = resource.intent;
        specificData.title = resource.title;
        specificData.description = resource.description;
        specificData.period = {
          start: resource.period?.start,
          end: resource.period?.end,
        };
        specificData.activities = resource.activity?.map((a: any) => ({
          detail: {
            description: a.detail?.description,
            status: a.detail?.status,
            scheduledTiming: a.detail?.scheduledTiming,
          },
        }));
        break;

      case EClinicalWorksResourceType.ENCOUNTER:
        specificData.status = resource.status;
        specificData.class = resource.class?.display;
        specificData.type = resource.type?.[0]?.coding?.[0]?.display;
        specificData.period = {
          start: resource.period?.start,
          end: resource.period?.end,
        };
        specificData.reasonCode = resource.reasonCode?.map((rc: any) => 
          rc.coding?.[0]?.display
        );
        specificData.diagnosis = resource.diagnosis?.map((d: any) => ({
          condition: d.condition?.display,
          use: d.use?.coding?.[0]?.display,
        }));
        specificData.hospitalization = resource.hospitalization;
        break;

      case EClinicalWorksResourceType.COMMUNICATION:
        specificData.status = resource.status;
        specificData.category = resource.category?.[0]?.coding?.[0]?.display;
        specificData.priority = resource.priority;
        specificData.medium = resource.medium?.map((m: any) => 
          m.coding?.[0]?.display
        );
        specificData.subject = resource.subject?.display;
        specificData.topic = resource.topic?.text;
        specificData.sent = resource.sent;
        specificData.received = resource.received;
        specificData.payload = resource.payload?.map((p: any) => ({
          contentString: p.contentString,
          contentAttachment: p.contentAttachment,
        }));
        break;

      case EClinicalWorksResourceType.TASK:
        specificData.status = resource.status;
        specificData.intent = resource.intent;
        specificData.priority = resource.priority;
        specificData.code = resource.code?.coding?.[0]?.display;
        specificData.description = resource.description;
        specificData.authoredOn = resource.authoredOn;
        specificData.lastModified = resource.lastModified;
        specificData.executionPeriod = {
          start: resource.executionPeriod?.start,
          end: resource.executionPeriod?.end,
        };
        specificData.note = resource.note?.map((n: any) => n.text);
        break;
    }

    // Store eClinicalWorks-specific data
    await prisma.eClinicalWorksSpecificData.upsert({
      where: {
        resourceId: resource.id,
      },
      update: specificData,
      create: {
        ...specificData,
        userId,
      },
    });
  }

  /**
   * Store standard FHIR resource
   */
  private async storeResource(resource: any, userId: string): Promise<void> {
    await prisma.fHIRResource.upsert({
      where: {
        resourceId_resourceType: {
          resourceId: resource.id,
          resourceType: resource.resourceType,
        },
      },
      update: {
        data: resource,
        lastUpdated: new Date(),
      },
      create: {
        resourceId: resource.id,
        resourceType: resource.resourceType,
        data: resource,
        userId,
      },
    });
  }

  /**
   * Get EHR connection
   */
  private async getConnection(connectionId: string) {
    const connection = await prisma.eHRConnection.findUnique({
      where: { id: connectionId },
      include: { user: true },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    return connection;
  }

  /**
   * Rate limiting delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get eClinicalWorks capabilities
   */
  async getCapabilities(connectionId: string): Promise<{
    bulkExport: boolean;
    diagnosticReports: boolean;
    carePlans: boolean;
    encounters: boolean;
    communications: boolean;
    tasks: boolean;
    rateLimit: string;
  }> {
    return {
      bulkExport: true,
      diagnosticReports: true,
      carePlans: true,
      encounters: true,
      communications: true,
      tasks: true,
      rateLimit: '7 requests/second',
    };
  }
}

// Export singleton instance
let instance: EClinicalWorksEnhancedService | null = null;

export function getEClinicalWorksEnhancedService(): EClinicalWorksEnhancedService {
  if (!instance) {
    instance = new EClinicalWorksEnhancedService();
  }
  return instance;
}