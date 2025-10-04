/**
 * Conflict Statistics API Endpoint
 * 
 * GET /api/sync/conflicts/statistics - Get conflict statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { conflictResolutionService } from '@/lib/services/sync/ConflictResolutionService';

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
    const resourceType = searchParams.get('resourceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get conflict statistics
    const statistics = await conflictResolutionService.getConflictStatistics(
      resourceType || undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error('Error fetching conflict statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflict statistics', details: error.message },
      { status: 500 }
    );
  }
}