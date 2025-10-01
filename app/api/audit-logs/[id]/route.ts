/**
 * Audit Log Detail API Endpoint
 * 
 * Get a specific audit log by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditLogging } from '@/lib/services/AuditLoggingService';

/**
 * GET /api/audit-logs/:id
 * Get audit log by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auditLog = await auditLogging.getById(params.id);

    if (!auditLog) {
      return NextResponse.json(
        {
          success: false,
          error: 'Audit log not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: auditLog,
    });
  } catch (error) {
    console.error('Failed to get audit log:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get audit log',
      },
      { status: 500 }
    );
  }
}