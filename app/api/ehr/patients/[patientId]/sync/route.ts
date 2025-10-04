/**
 * EHR Customer Data Sync API Endpoint
 * 
 * POST /api/ehr/customers/:customerId/sync
 * 
 * Synchronizes all customer data from the connected EHR system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UnifiedEHRService } from '@/lib/services/ehr/UnifiedEHRService';
import { AuditLoggingService } from '@/lib/services/compliance/AuditLoggingService';
import { z } from 'zod';

const auditService = new AuditLoggingService();

// Request validation schema
const syncSchema = z.object({
  ehrPatientId: z.string().min(1),
});

export async function POST(
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

    // 3. Parse and validate request body
    const body = await request.json();
    const validationResult = syncSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { ehrPatientId } = validationResult.data;

    // 4. Initialize EHR service
    const ehrService = new UnifiedEHRService();

    // 5. Start sync process
    const syncResult = await ehrService.syncPatientData(customerId, ehrPatientId);

    // 6. Log sync result
    await auditService.log({
      userId: session.user.id,
      eventType: 'EHR_DATA_SYNC',
      category: 'DATA_SYNC',
      outcome: syncResult.success ? 'SUCCESS' : 'FAILURE',
      description: `Synced customer data from EHR`,
      metadata: {
        customerId,
        ehrPatientId,
        recordsProcessed: syncResult.recordsProcessed,
        errors: syncResult.errors,
      },
    });

    // 7. Return sync result
    return NextResponse.json(
      {
        success: syncResult.success,
        data: {
          customerId,
          ehrPatientId,
          ehrProvider: syncResult.ehrProvider,
          recordsProcessed: syncResult.recordsProcessed,
          syncedAt: syncResult.syncedAt,
          errors: syncResult.errors,
        },
      },
      { status: syncResult.success ? 200 : 207 } // 207 = Multi-Status (partial success)
    );
  } catch (error: any) {
    // Log error
    await auditService.log({
      userId: (await getServerSession(authOptions))?.user?.id,
      eventType: 'EHR_DATA_SYNC',
      category: 'DATA_SYNC',
      outcome: 'FAILURE',
      description: `Failed to sync customer data: ${error.message}`,
      metadata: {
        error: error.message,
      },
    });

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync customer data',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve sync history
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

    // 3. Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 4. Fetch sync history from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const syncHistory = await prisma.syncHistory.findMany({
      where: { customerId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.syncHistory.count({
      where: { customerId },
    });

    await prisma.$disconnect();

    // 5. Return sync history
    return NextResponse.json(
      {
        success: true,
        data: {
          syncHistory,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve sync history',
        message: error.message,
      },
      { status: 500 }
    );
  }
}