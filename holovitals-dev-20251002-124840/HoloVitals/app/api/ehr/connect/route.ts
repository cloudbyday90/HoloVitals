/**
 * EHR Connection API Endpoint
 * 
 * POST /api/ehr/connect
 * 
 * Establishes a connection to an EHR system for a patient.
 * Supports all 7 EHR providers (Epic, Cerner, MEDITECH, athenahealth, 
 * eClinicalWorks, Allscripts, NextGen).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UnifiedEHRService, EHRProvider } from '@/lib/services/ehr/UnifiedEHRService';
import { AuditLoggingService } from '@/lib/services/compliance/AuditLoggingService';
import { z } from 'zod';

const auditService = new AuditLoggingService();

// Request validation schema
const connectSchema = z.object({
  patientId: z.string().uuid(),
  provider: z.enum([
    'EPIC',
    'CERNER',
    'MEDITECH',
    'ATHENAHEALTH',
    'ECLINICALWORKS',
    'ALLSCRIPTS',
    'NEXTGEN',
  ]),
  config: z.object({
    baseUrl: z.string().url(),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    additionalConfig: z.record(z.any()).optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = connectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { patientId, provider, config } = validationResult.data;

    // 3. Verify user has permission to connect EHR for this patient
    // TODO: Add proper authorization check
    // For now, we'll assume the user is authorized

    // 4. Initialize EHR service
    const ehrService = new UnifiedEHRService();

    // 5. Attempt to connect
    await ehrService.initializeConnection(patientId, {
      provider: provider as EHRProvider,
      baseUrl: config.baseUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      additionalConfig: config.additionalConfig,
    });

    // 6. Log successful connection
    await auditService.log({
      userId: session.user.id,
      eventType: 'EHR_CONNECTION_ESTABLISHED',
      category: 'INTEGRATION',
      outcome: 'SUCCESS',
      description: `Successfully connected to ${provider} for patient ${patientId}`,
      metadata: {
        patientId,
        provider,
        baseUrl: config.baseUrl,
      },
    });

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        message: `Successfully connected to ${provider}`,
        data: {
          patientId,
          provider,
          connectedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Log error
    await auditService.log({
      userId: (await getServerSession(authOptions))?.user?.id,
      eventType: 'EHR_CONNECTION_FAILED',
      category: 'INTEGRATION',
      outcome: 'FAILURE',
      description: `Failed to connect to EHR: ${error.message}`,
      metadata: {
        error: error.message,
        stack: error.stack,
      },
    });

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to EHR system',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve connection configuration (without secrets)
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

    // 2. Get patientId from query params
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 }
      );
    }

    // 3. Get connection status
    const ehrService = new UnifiedEHRService();
    const status = await ehrService.getConnectionStatus(patientId);

    // 4. Return connection info (without sensitive data)
    return NextResponse.json(
      {
        success: true,
        data: status,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve connection status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}