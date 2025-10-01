/**
 * User Activity API Endpoint
 * 
 * Get activity logs for a specific user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditLogging } from '@/lib/services/AuditLoggingService';

/**
 * GET /api/audit-logs/user/:userId
 * Get user activity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const activity = await auditLogging.getUserActivity(
      params.userId,
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      data: activity.logs,
      summary: activity.summary,
      userId: params.userId,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to get user activity:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user activity',
      },
      { status: 500 }
    );
  }
}