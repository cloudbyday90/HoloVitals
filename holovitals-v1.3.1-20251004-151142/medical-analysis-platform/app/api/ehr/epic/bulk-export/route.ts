/**
 * Epic Bulk Export API
 * POST /api/ehr/epic/bulk-export - Initiate bulk export
 * GET /api/ehr/epic/bulk-export - List bulk export jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, BulkExportType } from '@prisma/client';
import { FHIRClient } from '@/lib/fhir/FHIRClient';
import { EpicEnhancedService } from '@/lib/services/EpicEnhancedService';

const prisma = new PrismaClient();

/**
 * POST /api/ehr/epic/bulk-export
 * Initiate a bulk data export
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { connectionId, exportType, resourceTypes, since } = body;

    // Validate input
    if (!connectionId || !exportType) {
      return NextResponse.json(
        { error: 'Missing required fields: connectionId, exportType' },
        { status: 400 }
      );
    }

    if (!['PATIENT', 'GROUP', 'SYSTEM'].includes(exportType)) {
      return NextResponse.json(
        { error: 'Invalid exportType. Must be PATIENT, GROUP, or SYSTEM' },
        { status: 400 }
      );
    }

    // Verify connection belongs to user
    const connection = await prisma.eHRConnection.findFirst({
      where: {
        id: connectionId,
        userId: session.user.id,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Verify connection is to Epic
    if (connection.provider !== 'EPIC') {
      return NextResponse.json(
        { error: 'Bulk export is only supported for Epic connections' },
        { status: 400 }
      );
    }

    // Initialize Epic service
    const fhirClient = new FHIRClient(
      connection.fhirBaseUrl,
      connection.accessToken || ''
    );
    const epicService = new EpicEnhancedService(fhirClient);

    // Initiate bulk export
    const jobId = await epicService.initiateBulkExport({
      connectionId,
      exportType: exportType as BulkExportType,
      resourceTypes,
      since: since ? new Date(since) : undefined,
    });

    // Get the created job
    const job = await prisma.bulkExportJob.findUnique({
      where: { id: jobId },
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job?.id,
        status: job?.status,
        exportType: job?.exportType,
        statusUrl: job?.statusUrl,
        startedAt: job?.startedAt,
      },
    });
  } catch (error) {
    console.error('Error initiating bulk export:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate bulk export' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ehr/epic/bulk-export
 * List bulk export jobs for a connection
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

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Missing connectionId parameter' },
        { status: 400 }
      );
    }

    // Verify connection belongs to user
    const connection = await prisma.eHRConnection.findFirst({
      where: {
        id: connectionId,
        userId: session.user.id,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Get all bulk export jobs for this connection
    const jobs = await prisma.bulkExportJob.findMany({
      where: { connectionId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        exportType: job.exportType,
        status: job.status,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        resourceCount: job.resourceCount,
        totalSize: job.totalSize.toString(),
        errorMessage: job.errorMessage,
      })),
    });
  } catch (error) {
    console.error('Error listing bulk export jobs:', error);
    return NextResponse.json(
      { error: 'Failed to list bulk export jobs' },
      { status: 500 }
    );
  }
}