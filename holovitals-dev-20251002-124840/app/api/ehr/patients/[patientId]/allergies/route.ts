/**
 * EHR Patient Allergies API Endpoint
 * 
 * GET /api/ehr/patients/:patientId/allergies
 * 
 * Retrieves patient allergies from the connected EHR system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UnifiedEHRService } from '@/lib/services/ehr/UnifiedEHRService';
import { AuditLoggingService } from '@/lib/services/compliance/AuditLoggingService';
import { z } from 'zod';

const auditService = new AuditLoggingService();

// Query validation schema
const allergiesSchema = z.object({
  ehrPatientId: z.string().min(1),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
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

    // 2. Get patientId from URL params
    const { patientId } = params;

    // 3. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      ehrPatientId: searchParams.get('ehrPatientId'),
    };

    const validationResult = allergiesSchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { ehrPatientId } = validationResult.data;

    // 4. Initialize EHR service
    const ehrService = new UnifiedEHRService();

    // 5. Get allergies
    const allergies = await ehrService.getAllergies(patientId, ehrPatientId);

    // 6. Log access
    await auditService.log({
      userId: session.user.id,
      eventType: 'EHR_ALLERGIES_ACCESS',
      category: 'DATA_ACCESS',
      outcome: 'SUCCESS',
      description: `Retrieved allergies for patient`,
      metadata: {
        patientId,
        ehrPatientId,
        allergiesCount: allergies.length,
      },
    });

    // 7. Return allergies
    return NextResponse.json(
      {
        success: true,
        data: {
          allergies,
          count: allergies.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Log error
    await auditService.log({
      userId: (await getServerSession(authOptions))?.user?.id,
      eventType: 'EHR_ALLERGIES_ACCESS',
      category: 'DATA_ACCESS',
      outcome: 'FAILURE',
      description: `Failed to retrieve allergies: ${error.message}`,
      metadata: {
        error: error.message,
      },
    });

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve allergies',
        message: error.message,
      },
      { status: 500 }
    );
  }
}