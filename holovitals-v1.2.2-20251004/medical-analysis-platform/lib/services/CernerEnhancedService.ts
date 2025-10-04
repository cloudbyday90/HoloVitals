/**
 * Cerner Enhanced Service
 * 
 * Provides Cerner (Oracle Health) specific optimizations and features including:
 * - Additional resource types (DiagnosticReport, CarePlan, Encounter, Provenance, Coverage)
 * - Bulk Data Export ($export operation)
 * - Enhanced data extraction with Cerner extensions
 * - Cerner-specific rate limiting and optimizations
 * - Multi-tenant architecture support
 * 
 * Cerner (Oracle Health) serves 25% of US healthcare market
 */

import { PrismaClient, BulkExportType, BulkExportStatus, FHIRResourceType } from '@prisma/client';
import { FHIRClient } from '../fhir/FHIRClient';
import { EHRSyncService } from './EHRSyncService';

const prisma = new PrismaClient();

interface BulkExportRequest {
  connectionId: string;
  exportType: BulkExportType;
  resourceTypes?: string[];
  since?: Date;
  tenantId?: string; // Cerner multi-tenant support
}

interface BulkExportStatusResponse {
  transactionTime: string;
  request: string;
  requiresAccessToken: boolean;
  output: Array<{
    type: string;
    url: string;
    count?: number;
  }>;
  error?: Array<{
    type: string;
    url: string;
  }>;
}

interface DiagnosticReportData {
  id: string;
  status: string;
  category: string[];
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  subject: {
    reference: string;
  };
  effectiveDateTime?: string;
  issued?: string;
  result?: Array<{
    reference: string;
  }>;
  conclusion?: string;
  conclusionCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  presentedForm?: Array<{
    contentType: string;
    url?: string;
    data?: string;
    title?: string;
  }>;
}

interface CarePlanData {
  id: string;
  status: string;
  intent: string;
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  title?: string;
  description?: string;
  subject: {
    reference: string;
  };
  period?: {
    start?: string;
    end?: string;
  };
  activity?: Array<{
    detail?: {
      kind?: string;
      code?: {
        coding: Array<{
          system: string;
          code: string;
          display: string;
        }>;
      };
      status: string;
      description?: string;
    };
  }>;
  goal?: Array<{
    reference: string;
  }>;
}

interface EncounterData {
  id: string;
  status: string;
  class: {
    system: string;
    code: string;
    display: string;
  };
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  }>;
  subject: {
    reference: string;
  };
  period?: {
    start?: string;
    end?: string;
  };
  reasonCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  }>;
  diagnosis?: Array<{
    condition: {
      reference: string;
    };
    use?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
  }>;
  hospitalization?: {
    admitSource?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    dischargeDisposition?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
  };
}

interface ProvenanceData {
  id: string;
  target: Array<{
    reference: string;
  }>;
  recorded: string;
  agent: Array<{
    type?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    who: {
      reference: string;
      display?: string;
    };
    onBehalfOf?: {
      reference: string;
      display?: string;
    };
  }>;
  entity?: Array<{
    role: string;
    what: {
      reference: string;
    };
  }>;
}

interface CoverageData {
  id: string;
  status: string;
  type?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  subscriber?: {
    reference: string;
  };
  subscriberId?: string;
  beneficiary: {
    reference: string;
  };
  relationship?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  period?: {
    start?: string;
    end?: string;
  };
  payor: Array<{
    reference: string;
    display?: string;
  }>;
  class?: Array<{
    type: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    value: string;
    name?: string;
  }>;
}

export class CernerEnhancedService {
  private fhirClient: FHIRClient;
  private syncService: EHRSyncService;
  private rateLimitDelay = 110; // ~9 requests per second for Cerner
  private tenantId?: string; // Cerner multi-tenant support

  constructor(fhirClient: FHIRClient, tenantId?: string) {
    this.fhirClient = fhirClient;
    this.syncService = new EHRSyncService(fhirClient);
    this.tenantId = tenantId;
  }

  /**
   * Initiate a bulk data export operation
   */
  async initiateBulkExport(request: BulkExportRequest): Promise<string> {
    const connection = await prisma.eHRConnection.findUnique({
      where: { id: request.connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    // Construct the $export endpoint
    let exportUrl = `${connection.fhirBaseUrl}/`;
    
    switch (request.exportType) {
      case 'PATIENT':
        exportUrl += `Patient/${connection.patientId}/$export`;
        break;
      case 'GROUP':
        exportUrl += `Group/$export`;
        break;
      case 'SYSTEM':
        exportUrl += `$export`;
        break;
    }

    // Add query parameters
    const params = new URLSearchParams();
    if (request.resourceTypes && request.resourceTypes.length > 0) {
      params.append('_type', request.resourceTypes.join(','));
    }
    if (request.since) {
      params.append('_since', request.since.toISOString());
    }

    const fullUrl = `${exportUrl}?${params.toString()}`;

    // Make the kickoff request with Cerner-specific headers
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${connection.accessToken}`,
      'Accept': 'application/fhir+json',
      'Prefer': 'respond-async',
    };

    // Add tenant ID header if provided (Cerner multi-tenant)
    if (request.tenantId || this.tenantId) {
      headers['X-Tenant-Id'] = request.tenantId || this.tenantId || '';
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });

    if (response.status !== 202) {
      throw new Error(`Bulk export kickoff failed: ${response.statusText}`);
    }

    // Get the status URL from Content-Location header
    const statusUrl = response.headers.get('Content-Location');
    if (!statusUrl) {
      throw new Error('No status URL returned from bulk export kickoff');
    }

    // Create the bulk export job
    const job = await prisma.bulkExportJob.create({
      data: {
        connectionId: request.connectionId,
        exportType: request.exportType,
        status: 'INITIATED',
        kickoffUrl: fullUrl,
        statusUrl,
        resourceTypes: request.resourceTypes ? JSON.stringify(request.resourceTypes) : null,
        since: request.since,
        metadata: request.tenantId ? JSON.stringify({ tenantId: request.tenantId }) : null,
      },
    });

    return job.id;
  }

  /**
   * Check the status of a bulk export job
   */
  async checkBulkExportStatus(jobId: string): Promise<BulkExportStatus> {
    const job = await prisma.bulkExportJob.findUnique({
      where: { id: jobId },
      include: { connection: true },
    });

    if (!job) {
      throw new Error('Bulk export job not found');
    }

    if (!job.statusUrl) {
      throw new Error('No status URL for this job');
    }

    // Extract tenant ID from metadata if present
    const metadata = job.metadata ? JSON.parse(job.metadata) : {};
    const tenantId = metadata.tenantId || this.tenantId;

    // Check the status with Cerner-specific headers
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${job.connection.accessToken}`,
      'Accept': 'application/fhir+json',
    };

    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const response = await fetch(job.statusUrl, {
      method: 'GET',
      headers,
    });

    if (response.status === 202) {
      // Still in progress
      await prisma.bulkExportJob.update({
        where: { id: jobId },
        data: { status: 'IN_PROGRESS' },
      });
      return 'IN_PROGRESS';
    }

    if (response.status === 200) {
      // Completed
      const statusData: BulkExportStatusResponse = await response.json();
      
      await prisma.bulkExportJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          outputUrls: JSON.stringify(statusData.output),
          resourceCount: statusData.output.reduce((sum, o) => sum + (o.count || 0), 0),
        },
      });
      
      return 'COMPLETED';
    }

    // Failed
    await prisma.bulkExportJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: `Export failed with status ${response.status}`,
      },
    });
    
    return 'FAILED';
  }

  /**
   * Download and process bulk export files
   */
  async processBulkExportFiles(jobId: string): Promise<void> {
    const job = await prisma.bulkExportJob.findUnique({
      where: { id: jobId },
      include: { connection: true },
    });

    if (!job || job.status !== 'COMPLETED') {
      throw new Error('Job not ready for processing');
    }

    const outputUrls = JSON.parse(job.outputUrls || '[]') as Array<{
      type: string;
      url: string;
      count?: number;
    }>;

    // Extract tenant ID from metadata
    const metadata = job.metadata ? JSON.parse(job.metadata) : {};
    const tenantId = metadata.tenantId || this.tenantId;

    let totalSize = 0;
    let processedCount = 0;

    for (const output of outputUrls) {
      // Download the NDJSON file with Cerner-specific headers
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${job.connection.accessToken}`,
      };

      if (tenantId) {
        headers['X-Tenant-Id'] = tenantId;
      }

      const response = await fetch(output.url, { headers });

      if (!response.ok) {
        console.error(`Failed to download ${output.url}: ${response.statusText}`);
        continue;
      }

      const ndjsonData = await response.text();
      totalSize += ndjsonData.length;

      // Parse NDJSON (newline-delimited JSON)
      const lines = ndjsonData.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const resource = JSON.parse(line);
          
          // Store the resource
          await this.storeResource(job.connectionId, resource);
          processedCount++;

          // Rate limiting
          await this.sleep(this.rateLimitDelay);
        } catch (error) {
          console.error('Error processing resource:', error);
        }
      }
    }

    // Update job with final metrics
    await prisma.bulkExportJob.update({
      where: { id: jobId },
      data: {
        totalSize: BigInt(totalSize),
        resourceCount: processedCount,
      },
    });
  }

  /**
   * Sync DiagnosticReport resources (lab results, imaging reports)
   */
  async syncDiagnosticReports(connectionId: string, patientId: string): Promise<number> {
    const resources = await this.fhirClient.searchResources(
      'DiagnosticReport',
      { patient: patientId, _sort: '-date' }
    );

    let count = 0;
    for (const resource of resources) {
      await this.storeDiagnosticReport(connectionId, resource as DiagnosticReportData);
      count++;
      await this.sleep(this.rateLimitDelay);
    }

    return count;
  }

  /**
   * Sync CarePlan resources (treatment plans)
   */
  async syncCarePlans(connectionId: string, patientId: string): Promise<number> {
    const resources = await this.fhirClient.searchResources(
      'CarePlan',
      { patient: patientId, _sort: '-date' }
    );

    let count = 0;
    for (const resource of resources) {
      await this.storeCarePlan(connectionId, resource as CarePlanData);
      count++;
      await this.sleep(this.rateLimitDelay);
    }

    return count;
  }

  /**
   * Sync Encounter resources (visits, appointments)
   */
  async syncEncounters(connectionId: string, patientId: string): Promise<number> {
    const resources = await this.fhirClient.searchResources(
      'Encounter',
      { patient: patientId, _sort: '-date' }
    );

    let count = 0;
    for (const resource of resources) {
      await this.storeEncounter(connectionId, resource as EncounterData);
      count++;
      await this.sleep(this.rateLimitDelay);
    }

    return count;
  }

  /**
   * Sync Provenance resources (data source tracking - unique to Cerner)
   */
  async syncProvenance(connectionId: string, patientId: string): Promise<number> {
    const resources = await this.fhirClient.searchResources(
      'Provenance',
      { patient: patientId, _sort: '-recorded' }
    );

    let count = 0;
    for (const resource of resources) {
      await this.storeProvenance(connectionId, resource as ProvenanceData);
      count++;
      await this.sleep(this.rateLimitDelay);
    }

    return count;
  }

  /**
   * Sync Coverage resources (insurance information - unique to Cerner)
   */
  async syncCoverage(connectionId: string, patientId: string): Promise<number> {
    const resources = await this.fhirClient.searchResources(
      'Coverage',
      { patient: patientId }
    );

    let count = 0;
    for (const resource of resources) {
      await this.storeCoverage(connectionId, resource as CoverageData);
      count++;
      await this.sleep(this.rateLimitDelay);
    }

    return count;
  }

  /**
   * Perform enhanced sync with all Cerner-specific resources
   */
  async performEnhancedSync(connectionId: string): Promise<{
    diagnosticReports: number;
    carePlans: number;
    encounters: number;
    provenance: number;
    coverage: number;
    standardResources: number;
  }> {
    const connection = await prisma.eHRConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection || !connection.patientId) {
      throw new Error('Connection or patient ID not found');
    }

    // Perform standard sync first
    const standardCount = await this.syncService.syncConnection(connectionId);

    // Sync Cerner-specific resources
    const diagnosticReports = await this.syncDiagnosticReports(connectionId, connection.patientId);
    const carePlans = await this.syncCarePlans(connectionId, connection.patientId);
    const encounters = await this.syncEncounters(connectionId, connection.patientId);
    const provenance = await this.syncProvenance(connectionId, connection.patientId);
    const coverage = await this.syncCoverage(connectionId, connection.patientId);

    return {
      diagnosticReports,
      carePlans,
      encounters,
      provenance,
      coverage,
      standardResources: standardCount,
    };
  }

  /**
   * Store a DiagnosticReport with enhanced data extraction
   */
  private async storeDiagnosticReport(connectionId: string, resource: DiagnosticReportData): Promise<void> {
    // Extract clinical notes from presentedForm
    let clinicalNotes = resource.conclusion || '';
    if (resource.presentedForm && resource.presentedForm.length > 0) {
      const form = resource.presentedForm[0];
      if (form.data) {
        try {
          clinicalNotes += '\n\n' + Buffer.from(form.data, 'base64').toString('utf-8');
        } catch (e) {
          clinicalNotes += '\n\n' + form.data;
        }
      }
    }

    // Store the base resource
    const fhirResource = await prisma.fHIRResource.upsert({
      where: {
        connectionId_fhirId_resourceType: {
          connectionId,
          fhirId: resource.id,
          resourceType: 'DIAGNOSTIC_REPORT' as FHIRResourceType,
        },
      },
      create: {
        connectionId,
        fhirId: resource.id,
        resourceType: 'DIAGNOSTIC_REPORT' as FHIRResourceType,
        rawData: JSON.stringify(resource),
        title: resource.code.text,
        description: resource.conclusion,
        date: resource.effectiveDateTime ? new Date(resource.effectiveDateTime) : null,
        status: resource.status,
        category: resource.category.join(', '),
      },
      update: {
        rawData: JSON.stringify(resource),
        title: resource.code.text,
        description: resource.conclusion,
        date: resource.effectiveDateTime ? new Date(resource.effectiveDateTime) : null,
        status: resource.status,
        category: resource.category.join(', '),
      },
    });

    // Store Cerner-specific data (reusing EpicSpecificData table)
    await prisma.epicSpecificData.upsert({
      where: { resourceId: fhirResource.id },
      create: {
        resourceId: fhirResource.id,
        clinicalNotes,
        labResultDetails: resource.result ? JSON.stringify(resource.result) : null,
      },
      update: {
        clinicalNotes,
        labResultDetails: resource.result ? JSON.stringify(resource.result) : null,
      },
    });
  }

  /**
   * Store a CarePlan with enhanced data extraction
   */
  private async storeCarePlan(connectionId: string, resource: CarePlanData): Promise<void> {
    const carePlanDetails = {
      activities: resource.activity?.map(a => ({
        kind: a.detail?.kind,
        code: a.detail?.code?.coding[0]?.display,
        status: a.detail?.status,
        description: a.detail?.description,
      })) || [],
      goals: resource.goal?.map(g => g.reference) || [],
    };

    const fhirResource = await prisma.fHIRResource.upsert({
      where: {
        connectionId_fhirId_resourceType: {
          connectionId,
          fhirId: resource.id,
          resourceType: 'CARE_PLAN' as FHIRResourceType,
        },
      },
      create: {
        connectionId,
        fhirId: resource.id,
        resourceType: 'CARE_PLAN' as FHIRResourceType,
        rawData: JSON.stringify(resource),
        title: resource.title,
        description: resource.description,
        date: resource.period?.start ? new Date(resource.period.start) : null,
        status: resource.status,
        category: resource.category?.[0]?.coding[0]?.display,
      },
      update: {
        rawData: JSON.stringify(resource),
        title: resource.title,
        description: resource.description,
        date: resource.period?.start ? new Date(resource.period.start) : null,
        status: resource.status,
        category: resource.category?.[0]?.coding[0]?.display,
      },
    });

    await prisma.epicSpecificData.upsert({
      where: { resourceId: fhirResource.id },
      create: {
        resourceId: fhirResource.id,
        carePlanDetails: JSON.stringify(carePlanDetails),
      },
      update: {
        carePlanDetails: JSON.stringify(carePlanDetails),
      },
    });
  }

  /**
   * Store an Encounter with enhanced data extraction
   */
  private async storeEncounter(connectionId: string, resource: EncounterData): Promise<void> {
    const encounterDetails = {
      class: resource.class.display,
      type: resource.type?.[0]?.coding[0]?.display,
      reasonCode: resource.reasonCode?.map(r => r.coding[0]?.display) || [],
      diagnoses: resource.diagnosis?.map(d => ({
        condition: d.condition.reference,
        use: d.use?.coding[0]?.display,
      })) || [],
      hospitalization: resource.hospitalization,
    };

    const fhirResource = await prisma.fHIRResource.upsert({
      where: {
        connectionId_fhirId_resourceType: {
          connectionId,
          fhirId: resource.id,
          resourceType: 'ENCOUNTER' as FHIRResourceType,
        },
      },
      create: {
        connectionId,
        fhirId: resource.id,
        resourceType: 'ENCOUNTER' as FHIRResourceType,
        rawData: JSON.stringify(resource),
        title: resource.type?.[0]?.text || resource.class.display,
        description: resource.reasonCode?.[0]?.text,
        date: resource.period?.start ? new Date(resource.period.start) : null,
        status: resource.status,
        category: resource.class.display,
      },
      update: {
        rawData: JSON.stringify(resource),
        title: resource.type?.[0]?.text || resource.class.display,
        description: resource.reasonCode?.[0]?.text,
        date: resource.period?.start ? new Date(resource.period.start) : null,
        status: resource.status,
        category: resource.class.display,
      },
    });

    await prisma.epicSpecificData.upsert({
      where: { resourceId: fhirResource.id },
      create: {
        resourceId: fhirResource.id,
        encounterDetails: JSON.stringify(encounterDetails),
      },
      update: {
        encounterDetails: JSON.stringify(encounterDetails),
      },
    });
  }

  /**
   * Store a Provenance resource (data source tracking - unique to Cerner)
   */
  private async storeProvenance(connectionId: string, resource: ProvenanceData): Promise<void> {
    const provenanceDetails = {
      targets: resource.target.map(t => t.reference),
      recorded: resource.recorded,
      agents: resource.agent.map(a => ({
        type: a.type?.coding[0]?.display,
        who: a.who.display || a.who.reference,
        onBehalfOf: a.onBehalfOf?.display || a.onBehalfOf?.reference,
      })),
      entities: resource.entity?.map(e => ({
        role: e.role,
        what: e.what.reference,
      })) || [],
    };

    const fhirResource = await prisma.fHIRResource.upsert({
      where: {
        connectionId_fhirId_resourceType: {
          connectionId,
          fhirId: resource.id,
          resourceType: 'OTHER' as FHIRResourceType, // Provenance not in enum yet
        },
      },
      create: {
        connectionId,
        fhirId: resource.id,
        resourceType: 'OTHER' as FHIRResourceType,
        rawData: JSON.stringify(resource),
        title: 'Data Provenance',
        description: `Recorded: ${resource.recorded}`,
        date: new Date(resource.recorded),
        status: 'active',
        category: 'Provenance',
      },
      update: {
        rawData: JSON.stringify(resource),
        title: 'Data Provenance',
        description: `Recorded: ${resource.recorded}`,
        date: new Date(resource.recorded),
        status: 'active',
        category: 'Provenance',
      },
    });

    await prisma.epicSpecificData.upsert({
      where: { resourceId: fhirResource.id },
      create: {
        resourceId: fhirResource.id,
        metadata: JSON.stringify({ type: 'Provenance', ...provenanceDetails }),
      },
      update: {
        metadata: JSON.stringify({ type: 'Provenance', ...provenanceDetails }),
      },
    });
  }

  /**
   * Store a Coverage resource (insurance information - unique to Cerner)
   */
  private async storeCoverage(connectionId: string, resource: CoverageData): Promise<void> {
    const coverageDetails = {
      status: resource.status,
      type: resource.type?.text || resource.type?.coding[0]?.display,
      subscriberId: resource.subscriberId,
      relationship: resource.relationship?.coding[0]?.display,
      period: resource.period,
      payor: resource.payor.map(p => p.display || p.reference),
      classes: resource.class?.map(c => ({
        type: c.type.coding[0]?.display,
        value: c.value,
        name: c.name,
      })) || [],
    };

    const fhirResource = await prisma.fHIRResource.upsert({
      where: {
        connectionId_fhirId_resourceType: {
          connectionId,
          fhirId: resource.id,
          resourceType: 'OTHER' as FHIRResourceType, // Coverage not in enum yet
        },
      },
      create: {
        connectionId,
        fhirId: resource.id,
        resourceType: 'OTHER' as FHIRResourceType,
        rawData: JSON.stringify(resource),
        title: resource.type?.text || 'Insurance Coverage',
        description: `Payor: ${resource.payor[0]?.display || 'Unknown'}`,
        date: resource.period?.start ? new Date(resource.period.start) : null,
        status: resource.status,
        category: 'Coverage',
      },
      update: {
        rawData: JSON.stringify(resource),
        title: resource.type?.text || 'Insurance Coverage',
        description: `Payor: ${resource.payor[0]?.display || 'Unknown'}`,
        date: resource.period?.start ? new Date(resource.period.start) : null,
        status: resource.status,
        category: 'Coverage',
      },
    });

    await prisma.epicSpecificData.upsert({
      where: { resourceId: fhirResource.id },
      create: {
        resourceId: fhirResource.id,
        metadata: JSON.stringify({ type: 'Coverage', ...coverageDetails }),
      },
      update: {
        metadata: JSON.stringify({ type: 'Coverage', ...coverageDetails }),
      },
    });
  }

  /**
   * Store a generic resource from bulk export
   */
  private async storeResource(connectionId: string, resource: any): Promise<void> {
    const resourceType = resource.resourceType;
    
    // Map FHIR resource type to our enum
    const typeMap: Record<string, FHIRResourceType> = {
      'Patient': 'PATIENT',
      'DocumentReference': 'DOCUMENT_REFERENCE',
      'Observation': 'OBSERVATION',
      'Condition': 'CONDITION',
      'MedicationRequest': 'MEDICATION_REQUEST',
      'AllergyIntolerance': 'ALLERGY_INTOLERANCE',
      'Immunization': 'IMMUNIZATION',
      'Procedure': 'PROCEDURE',
      'DiagnosticReport': 'DIAGNOSTIC_REPORT',
      'CarePlan': 'CARE_PLAN',
      'Encounter': 'ENCOUNTER',
    };

    const mappedType = typeMap[resourceType] || 'OTHER';

    // Store the resource
    await prisma.fHIRResource.upsert({
      where: {
        connectionId_fhirId_resourceType: {
          connectionId,
          fhirId: resource.id,
          resourceType: mappedType,
        },
      },
      create: {
        connectionId,
        fhirId: resource.id,
        resourceType: mappedType,
        rawData: JSON.stringify(resource),
      },
      update: {
        rawData: JSON.stringify(resource),
      },
    });
  }

  /**
   * Sleep for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}