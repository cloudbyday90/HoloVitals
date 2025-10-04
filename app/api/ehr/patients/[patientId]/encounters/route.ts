/**
 * EHR Customer Encounters API Endpoint
 * 
 * GET /api/ehr/customers/:customerId/encounters
 * 
 * Retrieves customer encounters from the connected EHR system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UnifiedEHRService } from '@/lib/services/ehr/UnifiedEHRService';
import { AuditLoggingService } from '@/lib/services/compliance/AuditLoggingService';
import { z } from 'zod';

const auditService = new AuditLoggingService();

// Query validation schema
const encountersSchema = z.object({
  ehrPatientId: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get customerId from URL params
    const { customerId } = params;

    // 3. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      ehrPatientId: searchParams.get('ehrPatientId'),
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const validationResult = encountersSchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { ehrPatientId, ...options } = validationResult.data;

    // 4. Initialize EHR service
    const ehrService = new UnifiedEHRService();

    // 5. Get encounters
    const encounters = await ehrService.getEncounters(
      customerId,
      ehrPatientId,
      options
    );

    // 6. Log access
    await auditService.log({
      userId: session.user.id,
      eventType: 'EHR_ENCOUNTERS_ACCESS',
      category: 'DATA_ACCESS',
      outcome: 'SUCCESS',
      description: `Retrieved encounters for customer`,
      metadata: {
        customerId,
        ehrPatientId,
        encountersCount: encounters.length,
        filters: options,
      },
    });

    // 7. Return encounters
    return NextResponse.json(
      {
        success: true,
        data: {
          encounters,
          count: encounters.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Log error
    await auditService.log({
      userId: (await getServerSession(authOptions))?.user?.id,
      eventType: 'EHR_ENCOUNTERS_ACCESS',
      category: 'DATA_ACCESS',
      outcome: 'FAILURE',
      description: `Failed to retrieve encounters: ${error.message}`,
      metadata: {
        error: error.message,
      },
    });

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve encounters',
        message: error.message,
      },
      { status: 500 }
    );
  }
}