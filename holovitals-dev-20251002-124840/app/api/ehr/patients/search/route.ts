/**
 * EHR Patient Search API Endpoint
 * 
 * GET /api/ehr/patients/search
 * 
 * Searches for patients across the connected EHR system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UnifiedEHRService } from '@/lib/services/ehr/UnifiedEHRService';
import { AuditLoggingService } from '@/lib/services/compliance/AuditLoggingService';
import { z } from 'zod';

const auditService = new AuditLoggingService();

// Query validation schema
const searchSchema = z.object({
  patientId: z.string().uuid(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  mrn: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      patientId: searchParams.get('patientId'),
      firstName: searchParams.get('firstName') || undefined,
      lastName: searchParams.get('lastName') || undefined,
      dateOfBirth: searchParams.get('dateOfBirth') || undefined,
      mrn: searchParams.get('mrn') || undefined,
    };

    const validationResult = searchSchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { patientId, ...searchCriteria } = validationResult.data;

    // 3. Check if at least one search criterion is provided
    if (!searchCriteria.firstName && !searchCriteria.lastName && 
        !searchCriteria.dateOfBirth && !searchCriteria.mrn) {
      return NextResponse.json(
        { error: 'At least one search criterion is required' },
        { status: 400 }
      );
    }

    // 4. Initialize EHR service
    const ehrService = new UnifiedEHRService();

    // 5. Search for patients
    const patients = await ehrService.searchPatients(patientId, searchCriteria);

    // 6. Log search
    await auditService.log({
      userId: session.user.id,
      eventType: 'EHR_PATIENT_SEARCH',
      category: 'DATA_ACCESS',
      outcome: 'SUCCESS',
      description: `Searched for patients in EHR`,
      metadata: {
        patientId,
        searchCriteria,
        resultsCount: patients.length,
      },
    });

    // 7. Return results
    return NextResponse.json(
      {
        success: true,
        data: {
          patients,
          count: patients.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Log error
    await auditService.log({
      userId: (await getServerSession(authOptions))?.user?.id,
      eventType: 'EHR_PATIENT_SEARCH',
      category: 'DATA_ACCESS',
      outcome: 'FAILURE',
      description: `Failed to search patients: ${error.message}`,
      metadata: {
        error: error.message,
      },
    });

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search patients',
        message: error.message,
      },
      { status: 500 }
    );
  }
}