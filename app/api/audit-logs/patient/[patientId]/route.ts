/**
 * Patient Audit History API Endpoint
 * 
 * Get audit history for a specific patient
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditLogging } from '@/lib/services/AuditLoggingService';

/**
 * GET /api/audit-logs/patient/:patientId
 * Get patient access history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') 
      ? parseInt(searchParams.get('limit')!) 
      : 100;

    const logs = await auditLogging.getPatientAccessHistory(params.patientId, limit);

    return NextResponse.json({
      success: true,
      data: logs,
      patientId: params.patientId,
      count: logs.length,
    });
  } catch (error) {
    console.error('Failed to get patient access history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get patient access history',
      },
      { status: 500 }
    );
  }
}