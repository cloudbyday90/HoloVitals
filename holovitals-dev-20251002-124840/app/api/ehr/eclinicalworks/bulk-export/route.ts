/**
 * eClinicalWorks Bulk Export API Endpoint
 * 
 * POST /api/ehr/eclinicalworks/bulk-export - Initiate bulk export
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEClinicalWorksEnhancedService } from '@/lib/services/EClinicalWorksEnhancedService';

const service = getEClinicalWorksEnhancedService();

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
    console.error('Error initiating eClinicalWorks bulk export:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}