/**
 * Customer Audit History API Endpoint
 * 
 * Get audit history for a specific customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditLogging } from '@/lib/services/AuditLoggingService';

/**
 * GET /api/audit-logs/customer/:customerId
 * Get customer access history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') 
      ? parseInt(searchParams.get('limit')!) 
      : 100;

    const logs = await auditLogging.getPatientAccessHistory(params.customerId, limit);

    return NextResponse.json({
      success: true,
      data: logs,
      customerId: params.customerId,
      count: logs.length,
    });
  } catch (error) {
    console.error('Failed to get customer access history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get customer access history',
      },
      { status: 500 }
    );
  }
}