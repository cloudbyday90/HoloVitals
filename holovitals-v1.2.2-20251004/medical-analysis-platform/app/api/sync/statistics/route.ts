/**
 * Sync Statistics API Endpoint
 * 
 * GET /api/sync/statistics - Get sync statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { syncOrchestrationService } from '@/lib/services/sync/SyncOrchestrationService';

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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!ehrConnectionId) {
      return NextResponse.json(
        { error: 'ehrConnectionId is required' },
        { status: 400 }
      );
    }

    // Get sync statistics
    const statistics = await syncOrchestrationService.getSyncStatistics(
      ehrConnectionId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error('Error fetching sync statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync statistics', details: error.message },
      { status: 500 }
    );
  }
}