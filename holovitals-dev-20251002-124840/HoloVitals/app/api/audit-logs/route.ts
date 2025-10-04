/**
 * Audit Logs API Endpoints
 * 
 * Provides API endpoints for querying and managing audit logs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditLogging } from '@/lib/services/AuditLoggingService';

/**
 * GET /api/audit-logs
 * Query audit logs with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract filters from query parameters
    const filters = {
      userId: searchParams.get('userId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      eventCategory: searchParams.get('eventCategory') || undefined,
      outcome: searchParams.get('outcome') || undefined,
      riskLevel: searchParams.get('riskLevel') || undefined,
      phiAccessed: searchParams.get('phiAccessed') === 'true' ? true : undefined,
      startDate: searchParams.get('startDate') 
        ? new Date(searchParams.get('startDate')!) 
        : undefined,
      endDate: searchParams.get('endDate') 
        ? new Date(searchParams.get('endDate')!) 
        : undefined,
      limit: searchParams.get('limit') 
        ? parseInt(searchParams.get('limit')!) 
        : 100,
      offset: searchParams.get('offset') 
        ? parseInt(searchParams.get('offset')!) 
        : 0,
      orderBy: (searchParams.get('orderBy') as 'asc' | 'desc') || 'desc',
    };

    const result = await auditLogging.query(filters);

    return NextResponse.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: result.total > (filters.offset + filters.limit),
      },
    });
  } catch (error) {
    console.error('Failed to query audit logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to query audit logs',
      },
      { status: 500 }
    );
  }
}