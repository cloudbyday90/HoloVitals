/**
 * Log Cleanup API
 * POST /api/admin/logs/cleanup
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { logCleanupJob } from '@/lib/jobs/LogCleanupJob';

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

    // Trigger manual cleanup
    const results = await logCleanupJob.runCleanup();

    return NextResponse.json({
      success: true,
      message: 'Log cleanup completed successfully',
      results: {
        errorLogsDeleted: results.errorLogsDeleted,
        duplicatesPurged: results.duplicatesPurged,
      },
    });
  } catch (error) {
    console.error('Error during log cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup logs' },
      { status: 500 }
    );
  }
}