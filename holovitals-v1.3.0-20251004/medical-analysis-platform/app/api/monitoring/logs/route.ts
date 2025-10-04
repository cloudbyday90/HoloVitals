/**
 * Server Logs API
 * GET /api/monitoring/logs
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
    const level = searchParams.get('level') as 'info' | 'warn' | 'error' | 'debug' | undefined;

    // Get logs
    const logs = await serverMonitoring.getRecentLogs(hours, level);

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}