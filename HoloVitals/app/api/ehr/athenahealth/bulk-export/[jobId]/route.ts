/**
 * athenahealth Bulk Export Status API Endpoint
 * 
 * GET /api/ehr/athenahealth/bulk-export/:jobId - Check export status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAthenaHealthEnhancedService } from '@/lib/services/AthenaHealthEnhancedService';

const service = getAthenaHealthEnhancedService();

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = await service.checkBulkExportStatus(params.jobId);

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    console.error('Error checking athenahealth bulk export status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}