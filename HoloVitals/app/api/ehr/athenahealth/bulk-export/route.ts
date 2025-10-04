/**
 * athenahealth Bulk Export API Endpoint
 * 
 * POST /api/ehr/athenahealth/bulk-export - Initiate bulk export
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAthenaHealthEnhancedService } from '@/lib/services/AthenaHealthEnhancedService';

const service = getAthenaHealthEnhancedService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, exportType, resourceTypes, since } = body;

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'connectionId is required' },
        { status: 400 }
      );
    }

    const job = await service.initiateBulkExport(connectionId, {
      exportType,
      resourceTypes,
      since: since ? new Date(since) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    console.error('Error initiating athenahealth bulk export:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}