/**
 * Instance Statistics API Route
 * 
 * Endpoint:
 * - GET /api/instances/stats - Get instance statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import InstanceProvisionerService from '@/lib/services/InstanceProvisionerService';

const service = InstanceProvisionerService.getInstance();

/**
 * GET /api/instances/stats
 * Get instance statistics
 * 
 * Query params:
 * - userId: Filter by user ID (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const stats = await service.getStatistics(userId || undefined);

    return NextResponse.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}