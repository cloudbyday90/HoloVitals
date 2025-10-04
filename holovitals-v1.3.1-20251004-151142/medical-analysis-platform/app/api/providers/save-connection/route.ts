/**
 * Save Connection API
 * POST /api/providers/save-connection - Save EHR connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { providerOnboardingService } from '@/lib/services/ProviderOnboardingService';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { providerInfo, ehrSystem, credentials } = body;

    if (!providerInfo || !ehrSystem || !credentials) {
      return NextResponse.json(
        { error: 'Provider info, EHR system, and credentials are required' },
        { status: 400 }
      );
    }

    const connection = await providerOnboardingService.saveConnection(
      session.user.id,
      providerInfo,
      ehrSystem,
      credentials
    );

    return NextResponse.json({
      success: true,
      connection,
      message: 'Connection saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving connection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save connection' },
      { status: 500 }
    );
  }
}