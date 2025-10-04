/**
 * eClinicalWorks Enhanced Sync API Endpoint
 * 
 * POST /api/ehr/eclinicalworks/enhanced-sync - Sync with enhanced features
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEClinicalWorksEnhancedService } from '@/lib/services/EClinicalWorksEnhancedService';

const service = getEClinicalWorksEnhancedService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, includeStandard, includeEnhanced, resourceTypes, since } = body;

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'connectionId is required' },
        { status: 400 }
      );
    }

    const result = await service.enhancedSync(connectionId, {
      includeStandard,
      includeEnhanced,
      resourceTypes,
      since: since ? new Date(since) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error performing eClinicalWorks enhanced sync:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}