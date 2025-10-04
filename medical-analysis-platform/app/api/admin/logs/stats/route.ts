/**
 * Log Statistics API
 * GET /api/admin/logs/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { enhancedErrorLogger } from '@/lib/errors/EnhancedErrorLogger';
import { logRotationService } from '@/lib/logging/LogRotationService';
import { MASTER_ERROR_CODES } from '@/lib/errors/MasterErrorCodes';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get time range from query params (default 24 hours)
    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get('timeRange') || '24');

    // Get error statistics
    const errorStats = await enhancedErrorLogger.getErrorStats(timeRange);

    // Get log file statistics
    const logStats = await logRotationService.getLogStats();

    // Get log rotation configuration
    const config = logRotationService.getConfig();

    // Calculate percentages
    const currentLogPercentage = (logStats.currentLogSizeMB / config.maxLogFileSizeMB) * 100;
    const totalLogPercentage = (logStats.totalArchiveSizeMB / config.maxTotalLogSizeMB) * 100;

    return NextResponse.json({
      timeRange,
      errors: {
        total: errorStats.total,
        totalOccurrences: errorStats.totalOccurrences,
        bySeverity: errorStats.bySeverity,
        byMasterCode: errorStats.byMasterCode,
        topErrors: errorStats.topErrors,
      },
      logs: {
        current: {
          sizeMB: parseFloat(logStats.currentLogSizeMB.toFixed(2)),
          maxSizeMB: config.maxLogFileSizeMB,
          percentage: parseFloat(currentLogPercentage.toFixed(2)),
          rotationThreshold: config.rotationThreshold * 100,
        },
        archives: {
          count: logStats.archiveCount,
          totalSizeMB: parseFloat(logStats.totalArchiveSizeMB.toFixed(2)),
          maxSizeMB: config.maxTotalLogSizeMB,
          percentage: parseFloat(totalLogPercentage.toFixed(2)),
          oldest: logStats.oldestArchive,
          newest: logStats.newestArchive,
        },
        retention: {
          days: config.retentionDays,
          compressionEnabled: config.compressionEnabled,
        },
      },
      masterErrorCodes: Object.keys(MASTER_ERROR_CODES).length,
    });
  } catch (error) {
    console.error('Error fetching log statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch log statistics' },
      { status: 500 }
    );
  }
}