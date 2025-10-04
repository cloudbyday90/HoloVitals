/**
 * eClinicalWorks Bulk Export Status API Endpoint
 * 
 * GET /api/ehr/eclinicalworks/bulk-export/:jobId - Check export status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEClinicalWorksEnhancedService } from '@/lib/services/EClinicalWorksEnhancedService';

const service = getEClinicalWorksEnhancedService();

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
    console.error('Error checking eClinicalWorks bulk export status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}