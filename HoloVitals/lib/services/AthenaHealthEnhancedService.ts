/**
 * athenahealth Enhanced Service
 * 
 * Provides enhanced integration with athenahealth EHR system including:
 * - Bulk data export using FHIR $export
 * - Enhanced resource types (DiagnosticReport, CarePlan, Encounter)
 * - Appointment scheduling integration
 * - Customer portal (athenaPatient) features
 * - Clinical documentation
 * - Rate limiting (8 requests/second)
 * 
 * Market Share: 6% of US healthcare
 * Customer Portal: athenaPatient
 * FHIR Version: R4
 */

import { PrismaClient } from '@prisma/client';
import { FHIRClient } from '../fhir/FHIRClient';

const prisma = new PrismaClient();

// athenahealth-specific resource types
export enum AthenaHealthResourceType {
  DIAGNOSTIC_REPORT = 'DiagnosticReport',
  CARE_PLAN = 'CarePlan',
  ENCOUNTER = 'Encounter',
  APPOINTMENT = 'Appointment',
  DOCUMENT_REFERENCE = 'DocumentReference',
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
  resourceTypes?: AthenaHealthResourceType[];
  since?: Date;
}

export class AthenaHealthEnhancedService {
  private fhirClient: FHIRClient;
  private rateLimitDelay = 125; // 8 requests/second = 125ms between requests

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
        'Appointment',
        'DocumentReference',
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
      const retryAfter = response.headers.get('Retry-After');
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
   * Enhanced sync with athenahealth-specific features
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
      resourceTypes = Object.values(AthenaHealthResourceType),
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
    resourceType: AthenaHealthResourceType,
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
   * Store enhanced resource with athenahealth-specific data extraction
   */
  private async storeEnhancedResource(
    resource: any,
    userId: string,
    resourceType: AthenaHealthResourceType
  ): Promise<void> {
    // Store base resource
    await this.storeResource(resource, userId);

    // Extract and store athenahealth-specific data
    const specificData: any = {
      resourceType,
      resourceId: resource.id,
    };

    switch (resourceType) {
      case AthenaHealthResourceType.DIAGNOSTIC_REPORT:
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

      case AthenaHealthResourceType.CARE_PLAN:
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

      case AthenaHealthResourceType.ENCOUNTER:
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

      case AthenaHealthResourceType.APPOINTMENT:
        specificData.status = resource.status;
        specificData.appointmentType = resource.appointmentType?.coding?.[0]?.display;
        specificData.reasonCode = resource.reasonCode?.[0]?.coding?.[0]?.display;
        specificData.description = resource.description;
        specificData.start = resource.start;
        specificData.end = resource.end;
        specificData.minutesDuration = resource.minutesDuration;
        specificData.comment = resource.comment;
        break;

      case AthenaHealthResourceType.DOCUMENT_REFERENCE:
        specificData.status = resource.status;
        specificData.type = resource.type?.coding?.[0]?.display;
        specificData.category = resource.category?.[0]?.coding?.[0]?.display;
        specificData.date = resource.date;
        specificData.description = resource.description;
        specificData.content = resource.content?.map((c: any) => ({
          attachment: {
            contentType: c.attachment?.contentType,
            url: c.attachment?.url,
            title: c.attachment?.title,
            size: c.attachment?.size,
          },
        }));
        break;
    }

    // Store athenahealth-specific data
    await prisma.athenaHealthSpecificData.upsert({
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
   * Get athenahealth capabilities
   */
  async getCapabilities(connectionId: string): Promise<{
    bulkExport: boolean;
    diagnosticReports: boolean;
    carePlans: boolean;
    encounters: boolean;
    appointments: boolean;
    documentReferences: boolean;
    rateLimit: string;
  }> {
    return {
      bulkExport: true,
      diagnosticReports: true,
      carePlans: true,
      encounters: true,
      appointments: true,
      documentReferences: true,
      rateLimit: '8 requests/second',
    };
  }
}

// Export singleton instance
let instance: AthenaHealthEnhancedService | null = null;

export function getAthenaHealthEnhancedService(): AthenaHealthEnhancedService {
  if (!instance) {
    instance = new AthenaHealthEnhancedService();
  }
  return instance;
}