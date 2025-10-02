/**
 * Individual Sync Job API Endpoints
 * 
 * GET /api/sync/jobs/[jobId] - Get sync job status
 * DELETE /api/sync/jobs/[jobId] - Cancel sync job
 * POST /api/sync/jobs/[jobId]/retry - Retry failed sync job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { syncOrchestrationService } from '@/lib/services/sync/SyncOrchestrationService';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { jobId } = params;

    // Get sync job status
    const result = await syncOrchestrationService.getSyncJobStatus(jobId);

    if (!result) {
      return NextResponse.json(
        { error: 'Sync job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: result,
    });
  } catch (error) {
    console.error('Error fetching sync job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync job', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { jobId } = params;

    // Cancel sync job
    await syncOrchestrationService.cancelSyncJob(jobId);

    return NextResponse.json({
      success: true,
      message: 'Sync job cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling sync job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel sync job', details: error.message },
      { status: 500 }
    );
  }
}