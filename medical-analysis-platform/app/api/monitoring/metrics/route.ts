/**
 * Server Metrics API
 * GET /api/monitoring/metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { serverMonitoring } from '@/lib/services/ServerMonitoringService';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('hours') || '24');

    // Get metrics
    const metrics = await serverMonitoring.getRecentMetrics(hours);

    return NextResponse.json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}