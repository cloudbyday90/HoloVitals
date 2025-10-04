/**
 * EHR Connection API
 * 
 * POST /api/ehr/connect - Initiate new EHR connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { EHRConnectionService } from '@/lib/services/EHRConnectionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      provider,
      providerName,
      fhirBaseUrl,
      authorizationUrl,
      tokenUrl,
      clientId,
      clientSecret,
      redirectUri,
    } = body;

    // Validate required fields
    if (!userId || !provider || !providerName || !fhirBaseUrl || !authorizationUrl || !tokenUrl || !clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initiate connection
    const result = await EHRConnectionService.initiateConnection({
      userId,
      provider,
      providerName,
      fhirBaseUrl,
      authorizationUrl,
      tokenUrl,
      clientId,
      clientSecret,
      redirectUri,
    });

    return NextResponse.json({
      success: true,
      connection: result.connection,
      authorizationUrl: result.authorizationUrl,
      state: result.state,
      message: 'Connection initiated. Redirect user to authorizationUrl to complete authorization.',
    });
  } catch (error: any) {
    console.error('EHR connection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate EHR connection' },
      { status: 500 }
    );
  }
}