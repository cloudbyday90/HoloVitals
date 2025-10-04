/**
 * Log Rotation API
 * POST /api/admin/logs/rotate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { logRotationService } from '@/lib/logging/LogRotationService';

export async function POST(request: NextRequest) {
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

    // Trigger manual log rotation
    await logRotationService.manualRotate();

    // Get updated statistics
    const stats = await logRotationService.getLogStats();

    return NextResponse.json({
      success: true,
      message: 'Log rotation completed successfully',
      stats: {
        currentLogSizeMB: parseFloat(stats.currentLogSizeMB.toFixed(2)),
        totalArchiveSizeMB: parseFloat(stats.totalArchiveSizeMB.toFixed(2)),
        archiveCount: stats.archiveCount,
      },
    });
  } catch (error) {
    console.error('Error rotating logs:', error);
    return NextResponse.json(
      { error: 'Failed to rotate logs' },
      { status: 500 }
    );
  }
}