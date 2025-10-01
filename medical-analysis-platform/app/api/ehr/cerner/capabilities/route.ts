/**
 * Cerner Capabilities API
 * GET /api/ehr/cerner/capabilities - Get Cerner-specific capabilities and features
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/ehr/cerner/capabilities
 * Get Cerner-specific capabilities and features
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const capabilities = {
      provider: 'Cerner (Oracle Health)',
      marketShare: '25%',
      fhirVersion: 'R4',
      patientPortal: 'HealtheLife',
      
      // Standard FHIR resources
      standardResources: [
        'Patient',
        'DocumentReference',
        'Observation',
        'Condition',
        'MedicationRequest',
        'AllergyIntolerance',
        'Immunization',
        'Procedure',
      ],
      
      // Cerner-specific resources
      cernerSpecificResources: [
        {
          type: 'DiagnosticReport',
          description: 'Lab results, imaging reports, and diagnostic findings',
          features: [
            'Clinical notes extraction',
            'Lab results with reference ranges',
            'Imaging study metadata',
            'PDF report download',
          ],
        },
        {
          type: 'CarePlan',
          description: 'Treatment plans and care coordination',
          features: [
            'Care plan activities',
            'Patient goals',
            'Care team information',
            'Timeline tracking',
          ],
        },
        {
          type: 'Encounter',
          description: 'Visits, appointments, and hospitalizations',
          features: [
            'Visit details',
            'Encounter diagnoses',
            'Procedures performed',
            'Hospitalization information',
          ],
        },
        {
          type: 'Provenance',
          description: 'Data source tracking and audit trail (unique to Cerner)',
          features: [
            'Data source identification',
            'Agent tracking (who created/modified)',
            'Entity relationships',
            'Timestamp tracking',
            'Audit trail for compliance',
          ],
        },
        {
          type: 'Coverage',
          description: 'Insurance coverage information (unique to Cerner)',
          features: [
            'Insurance plan details',
            'Subscriber information',
            'Coverage period tracking',
            'Payor information',
            'Benefit class details',
          ],
        },
      ],
      
      // Bulk data export
      bulkDataExport: {
        supported: true,
        exportTypes: ['PATIENT', 'GROUP', 'SYSTEM'],
        features: [
          'NDJSON format',
          'Incremental export (since parameter)',
          'Resource type filtering',
          'Asynchronous processing',
          'Large dataset support',
          'Multi-tenant support',
        ],
        estimatedTime: '5-30 minutes depending on data volume',
      },
      
      // Rate limiting
      rateLimiting: {
        requestsPerSecond: 9,
        burstLimit: 45,
        recommendation: 'Use bulk export for large datasets',
      },
      
      // Authentication
      authentication: {
        method: 'SMART on FHIR',
        flow: 'OAuth 2.0 Authorization Code',
        clientType: 'Public or Confidential',
        scopes: [
          'patient/*.read',
          'launch/patient',
          'offline_access',
        ],
      },
      
      // Multi-tenant architecture
      multiTenant: {
        supported: true,
        description: 'Cerner supports multi-tenant architecture with tenant ID',
        header: 'X-Tenant-Id',
        notes: 'Required for some Cerner implementations',
      },
      
      // Oracle Health Portal
      oracleHealth: {
        required: true,
        productionUrl: 'https://code.cerner.com',
        sandboxUrl: 'https://fhir.cerner.com/r4',
        registrationSteps: [
          'Create Oracle Health (Cerner) developer account',
          'Submit app for review',
          'Complete security assessment',
          'Obtain production credentials',
        ],
      },
      
      // Data quality
      dataQuality: {
        completeness: 'Very High',
        accuracy: 'Very High',
        timeliness: 'Real-time',
        notes: 'Cerner provides comprehensive and highly accurate data with real-time updates',
      },
      
      // Cost optimization
      costOptimization: {
        bulkExportSavings: '90% fewer API calls',
        incrementalSync: 'Only fetch new/updated data',
        rateLimitCompliance: 'Automatic rate limiting to avoid throttling',
      },
      
      // Unique features
      uniqueFeatures: [
        'Provenance tracking for data audit trail',
        'Coverage information for insurance details',
        'Multi-tenant architecture support',
        'Real-time data synchronization',
        'Comprehensive data quality',
      ],
    };

    return NextResponse.json({
      success: true,
      capabilities,
    });
  } catch (error) {
    console.error('Error getting Cerner capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to get Cerner capabilities' },
      { status: 500 }
    );
  }
}