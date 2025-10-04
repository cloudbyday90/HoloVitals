/**
 * Analysis Queue Statistics API
 * 
 * Endpoint for getting queue statistics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { analysisQueue } from '@/lib/services/AnalysisQueueService';

/**
 * GET /api/analysis-queue/statistics
 * Get queue statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await analysisQueue.getQueueStatistics();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Failed to get queue statistics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get queue statistics' },
      { status: 500 }
    );
  }
}