/**
 * EHR Customer Search API Endpoint
 * 
 * GET /api/ehr/customers/search
 * 
 * Searches for customers across the connected EHR system.
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
  customerId: z.string().uuid(),
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
      customerId: searchParams.get('customerId'),
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

    const { customerId, ...searchCriteria } = validationResult.data;

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

    // 5. Search for customers
    const customers = await ehrService.searchPatients(customerId, searchCriteria);

    // 6. Log search
    await auditService.log({
      userId: session.user.id,
      eventType: 'EHR_PATIENT_SEARCH',
      category: 'DATA_ACCESS',
      outcome: 'SUCCESS',
      description: `Searched for customers in EHR`,
      metadata: {
        customerId,
        searchCriteria,
        resultsCount: customers.length,
      },
    });

    // 7. Return results
    return NextResponse.json(
      {
        success: true,
        data: {
          customers,
          count: customers.length,
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
      description: `Failed to search customers: ${error.message}`,
      metadata: {
        error: error.message,
      },
    });

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search customers',
        message: error.message,
      },
      { status: 500 }
    );
  }
}