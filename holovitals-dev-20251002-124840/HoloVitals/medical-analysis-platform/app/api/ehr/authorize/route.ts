/**
 * EHR Authorization Callback API
 * 
 * POST /api/ehr/authorize - Complete OAuth authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { EHRConnectionService } from '@/lib/services/EHRConnectionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, code, state, codeVerifier } = body;

    // Validate required fields
    if (!connectionId || !code || !state || !codeVerifier) {
      return NextResponse.json(
        { error: 'Missing required fields: connectionId, code, state, codeVerifier' },
        { status: 400 }
      );
    }

    // Complete authorization
    const connection = await EHRConnectionService.authorizeConnection({
      connectionId,
      code,
      state,
      codeVerifier,
    });

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        provider: connection.provider,
        providerName: connection.providerName,
        status: connection.status,
        patientId: connection.patientId,
        patientName: connection.patientName,
      },
      message: 'Authorization completed successfully. Connection is now active.',
    });
  } catch (error: any) {
    console.error('EHR authorization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete authorization' },
      { status: 500 }
    );
  }
}