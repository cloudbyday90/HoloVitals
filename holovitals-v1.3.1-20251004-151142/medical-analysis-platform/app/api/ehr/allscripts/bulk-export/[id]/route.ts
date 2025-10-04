/**
 * Allscripts Bulk Export Status API
 * GET /api/ehr/allscripts/bulk-export/:id - Check export status
 * POST /api/ehr/allscripts/bulk-export/:id/process - Process completed export
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { FHIRClient } from '@/lib/fhir/FHIRClient';
import { AllscriptsEnhancedService } from '@/lib/services/AllscriptsEnhancedService';

const prisma = new PrismaClient();

/**
 * GET /api/ehr/allscripts/bulk-export/:id
 * Check the status of a bulk export job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const jobId = params.id;

    // Get the job
    const job = await prisma.bulkExportJob.findUnique({
      where: { id: jobId },
      include: {
        connection: {
          select: {
            userId: true,
            fhirBaseUrl: true,
            accessToken: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify job belongs to user
    if (job.connection.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // If job is not completed, check status
    if (job.status === 'INITIATED' || job.status === 'IN_PROGRESS') {
      const fhirClient = new FHIRClient(
        job.connection.fhirBaseUrl,
        job.connection.accessToken || ''
      );
      const allscriptsService = new AllscriptsEnhancedService(fhirClient);

      const newStatus = await allscriptsService.checkBulkExportStatus(jobId);

      // Get updated job
      const updatedJob = await prisma.bulkExportJob.findUnique({
        where: { id: jobId },
      });

      return NextResponse.json({
        success: true,
        job: {
          id: updatedJob?.id,
          exportType: updatedJob?.exportType,
          status: updatedJob?.status,
          startedAt: updatedJob?.startedAt,
          completedAt: updatedJob?.completedAt,
          resourceCount: updatedJob?.resourceCount,
          totalSize: updatedJob?.totalSize.toString(),
          errorMessage: updatedJob?.errorMessage,
        },
      });
    }

    // Job is already in final state
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        exportType: job.exportType,
        status: job.status,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        resourceCount: job.resourceCount,
        totalSize: job.totalSize.toString(),
        errorMessage: job.errorMessage,
      },
    });
  } catch (error) {
    console.error('Error checking bulk export status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check export status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ehr/allscripts/bulk-export/:id/process
 * Process a completed bulk export (download and store resources)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const jobId = params.id;

    // Get the job
    const job = await prisma.bulkExportJob.findUnique({
      where: { id: jobId },
      include: {
        connection: {
          select: {
            userId: true,
            fhirBaseUrl: true,
            accessToken: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify job belongs to user
    if (job.connection.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Verify job is completed
    if (job.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Job is not completed yet' },
        { status: 400 }
      );
    }

    // Process the export files
    const fhirClient = new FHIRClient(
      job.connection.fhirBaseUrl,
      job.connection.accessToken || ''
    );
    const allscriptsService = new AllscriptsEnhancedService(fhirClient);

    await allscriptsService.processBulkExportFiles(jobId);

    // Get updated job
    const updatedJob = await prisma.bulkExportJob.findUnique({
      where: { id: jobId },
    });

    return NextResponse.json({
      success: true,
      message: 'Bulk export processed successfully',
      job: {
        id: updatedJob?.id,
        resourceCount: updatedJob?.resourceCount,
        totalSize: updatedJob?.totalSize.toString(),
      },
    });
  } catch (error) {
    console.error('Error processing bulk export:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process bulk export' },
      { status: 500 }
    );
  }
}