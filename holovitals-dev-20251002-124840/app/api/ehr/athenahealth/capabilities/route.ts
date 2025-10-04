/**
 * athenahealth Capabilities API Endpoint
 * 
 * GET /api/ehr/athenahealth/capabilities - Get provider capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAthenaHealthEnhancedService } from '@/lib/services/AthenaHealthEnhancedService';

const service = getAthenaHealthEnhancedService();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'connectionId is required' },
        { status: 400 }
      );
    }

    const capabilities = await service.getCapabilities(connectionId);

    return NextResponse.json({
      success: true,
      data: capabilities,
    });
  } catch (error: any) {
    console.error('Error getting athenahealth capabilities:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}