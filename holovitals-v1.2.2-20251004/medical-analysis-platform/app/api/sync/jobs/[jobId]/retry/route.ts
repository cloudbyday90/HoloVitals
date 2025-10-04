/**
 * Retry Sync Job API Endpoint
 * 
 * POST /api/sync/jobs/[jobId]/retry - Retry a failed sync job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { syncOrchestrationService } from '@/lib/services/sync/SyncOrchestrationService';

export async function POST(
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

    // Retry sync job
    await syncOrchestrationService.retrySyncJob(jobId);

    return NextResponse.json({
      success: true,
      message: 'Sync job retry initiated',
    });
  } catch (error) {
    console.error('Error retrying sync job:', error);
    return NextResponse.json(
      { error: 'Failed to retry sync job', details: error.message },
      { status: 500 }
    );
  }
}