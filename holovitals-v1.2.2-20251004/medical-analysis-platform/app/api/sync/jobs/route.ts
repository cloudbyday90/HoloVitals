/**
 * Sync Jobs API Endpoints
 * 
 * POST /api/sync/jobs - Create a new sync job
 * GET /api/sync/jobs - List sync jobs with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { syncOrchestrationService, SyncJobType, SyncDirection, SyncJobPriority } from '@/lib/services/sync/SyncOrchestrationService';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      type,
      direction,
      priority,
      ehrProvider,
      ehrConnectionId,
      patientId,
      resourceType,
      resourceIds,
      filters,
      options,
    } = body;

    // Validate required fields
    if (!type || !direction || !ehrProvider || !ehrConnectionId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, direction, ehrProvider, ehrConnectionId' },
        { status: 400 }
      );
    }

    // Create sync job
    const jobId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const syncJobId = await syncOrchestrationService.createSyncJob({
      jobId,
      type: type as SyncJobType,
      direction: direction as SyncDirection,
      priority: priority || SyncJobPriority.NORMAL,
      ehrProvider,
      ehrConnectionId,
      userId: session.user.id || session.user.email || 'unknown',
      patientId,
      resourceType,
      resourceIds,
      filters,
      options,
    });

    return NextResponse.json({
      success: true,
      jobId: syncJobId,
      message: 'Sync job created successfully',
    });
  } catch (error) {
    console.error('Error creating sync job:', error);
    return NextResponse.json(
      { error: 'Failed to create sync job', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const ehrConnectionId = searchParams.get('ehrConnectionId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get sync jobs
    let jobs;
    if (status === 'active') {
      jobs = await syncOrchestrationService.getActiveSyncJobs(ehrConnectionId || undefined);
    } else {
      const result = await syncOrchestrationService.getSyncHistory(
        ehrConnectionId || '',
        limit,
        offset
      );
      jobs = result.jobs;
    }

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error('Error fetching sync jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync jobs', details: error.message },
      { status: 500 }
    );
  }
}