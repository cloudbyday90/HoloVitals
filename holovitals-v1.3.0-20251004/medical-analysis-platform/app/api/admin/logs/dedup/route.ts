/**
 * Error Deduplication API
 * POST /api/admin/logs/dedup
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

    // Trigger manual deduplication
    const purged = await logCleanupJob.runDeduplication();

    return NextResponse.json({
      success: true,
      message: 'Error deduplication completed successfully',
      duplicatesPurged: purged,
    });
  } catch (error) {
    console.error('Error during deduplication:', error);
    return NextResponse.json(
      { error: 'Failed to deduplicate errors' },
      { status: 500 }
    );
  }
}