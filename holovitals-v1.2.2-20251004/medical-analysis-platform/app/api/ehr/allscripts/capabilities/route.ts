/**
 * Allscripts Capabilities API
 * GET /api/ehr/allscripts/capabilities - Get Allscripts-specific capabilities and features
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/ehr/allscripts/capabilities
 * Get Allscripts-specific capabilities and features
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
      provider: 'Allscripts',
      marketShare: '8%',
      fhirVersion: 'R4',
      patientPortal: 'FollowMyHealth',
      
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
      
      // Allscripts-specific resources
      allscriptsSpecificResources: [
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
          type: 'Goal',
          description: 'Patient health goals and targets',
          features: [
            'Goal tracking',
            'Target dates',
            'Achievement status',
            'Progress monitoring',
          ],
        },
        {
          type: 'ServiceRequest',
          description: 'Orders and referrals',
          features: [
            'Lab orders',
            'Imaging orders',
            'Referrals',
            'Order status tracking',
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
        ],
        estimatedTime: '5-30 minutes depending on data volume',
      },
      
      // Rate limiting
      rateLimiting: {
        requestsPerSecond: 6.7,
        burstLimit: 40,
        recommendation: 'Use bulk export for large datasets',
      },
      
      // Authentication
      authentication: {
        method: 'SMART on FHIR',
        flow: 'OAuth 2.0 Authorization Code',
        clientType: 'Confidential',
        scopes: [
          'patient/*.read',
          'launch/patient',
          'offline_access',
        ],
      },
      
      // FollowMyHealth Portal
      followMyHealth: {
        required: true,
        productionUrl: 'https://www.followmyhealth.com',
        sandboxUrl: 'https://sandbox.followmyhealth.com',
        registrationSteps: [
          'Create Allscripts developer account',
          'Submit app for review',
          'Complete security assessment',
          'Obtain production credentials',
        ],
      },
      
      // Data quality
      dataQuality: {
        completeness: 'High',
        accuracy: 'High',
        timeliness: 'Near real-time',
        notes: 'Allscripts provides comprehensive and accurate data with near real-time updates',
      },
      
      // Cost optimization
      costOptimization: {
        bulkExportSavings: '90% fewer API calls',
        incrementalSync: 'Only fetch new/updated data',
        rateLimitCompliance: 'Automatic rate limiting to avoid throttling',
      },
      
      // Unique features
      uniqueFeatures: [
        'Goal tracking and monitoring',
        'ServiceRequest order tracking',
        'Enhanced care coordination',
        'Comprehensive patient portal integration',
      ],
    };

    return NextResponse.json({
      success: true,
      capabilities,
    });
  } catch (error) {
    console.error('Error getting Allscripts capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to get Allscripts capabilities' },
      { status: 500 }
    );
  }
}