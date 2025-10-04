/**
 * Error Alerts API
 * OWNER/ADMIN only - Get alert statistics and manage alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { errorAlertService } from '@/lib/services/ErrorAlertService';

export async function GET(req: NextRequest) {
  // Protect endpoint - ADMIN or higher
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { searchParams } = new URL(req.url);
    const hours = parseInt(searchParams.get('hours') || '24');

    // Get alert statistics
    const stats = await errorAlertService.getAlertStats(hours);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get alert stats:', error);
    return NextResponse.json(
      { error: 'Failed to get alert statistics' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Protect endpoint - ADMIN or higher
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const body = await req.json();
    const { action, config } = body;

    if (action === 'configure') {
      // Update alert configuration
      errorAlertService.configure(config);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to update alert config:', error);
    return NextResponse.json(
      { error: 'Failed to update alert configuration' },
      { status: 500 }
    );
  }
}