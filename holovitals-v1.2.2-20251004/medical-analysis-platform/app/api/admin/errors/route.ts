/**
 * Error Logs API
 * OWNER/ADMIN only - Get recent error logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { errorLogger, ErrorSeverity } from '@/lib/errors/ErrorLogger';

export async function GET(req: NextRequest) {
  // Protect endpoint - ADMIN or higher
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const severity = searchParams.get('severity') as ErrorSeverity | undefined;

    // Get recent errors
    const errors = await errorLogger.getRecentErrors(limit, severity);

    return NextResponse.json({
      errors,
      count: errors.length,
    });
  } catch (error) {
    console.error('Failed to get error logs:', error);
    return NextResponse.json(
      { error: 'Failed to get error logs' },
      { status: 500 }
    );
  }
}