/**
 * Error Statistics API
 * OWNER/ADMIN only - Get error statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { errorLogger } from '@/lib/errors/ErrorLogger';

export async function GET(req: NextRequest) {
  // Protect endpoint - ADMIN or higher
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '24h';

    // Convert range to hours
    let hours = 24;
    switch (range) {
      case '1h':
        hours = 1;
        break;
      case '24h':
        hours = 24;
        break;
      case '7d':
        hours = 24 * 7;
        break;
      case '30d':
        hours = 24 * 30;
        break;
    }

    // Get error statistics
    const stats = await errorLogger.getErrorStats(hours);

    // Calculate trend (compare with previous period)
    const previousStats = await errorLogger.getErrorStats(hours * 2);
    const previousTotal = previousStats.total - stats.total;
    const trend = {
      current: stats.total,
      previous: previousTotal,
      change: previousTotal > 0 
        ? Math.round(((stats.total - previousTotal) / previousTotal) * 100)
        : 0,
    };

    return NextResponse.json({
      ...stats,
      trend,
    });
  } catch (error) {
    console.error('Failed to get error stats:', error);
    return NextResponse.json(
      { error: 'Failed to get error statistics' },
      { status: 500 }
    );
  }
}