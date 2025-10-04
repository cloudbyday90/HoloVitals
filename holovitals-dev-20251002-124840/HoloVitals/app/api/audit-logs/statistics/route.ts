/**
 * Audit Statistics API Endpoint
 * 
 * Get audit log statistics and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditLogging } from '@/lib/services/AuditLoggingService';

/**
 * GET /api/audit-logs/statistics
 * Get audit log statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const statistics = await auditLogging.getStatistics(startDate, endDate);

    return NextResponse.json({
      success: true,
      data: statistics,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to get audit statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get audit statistics',
      },
      { status: 500 }
    );
  }
}