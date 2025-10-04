/**
 * EHR Detection API
 * POST /api/providers/detect-ehr - Detect EHR system for a provider
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
    const { provider } = body;

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider information is required' },
        { status: 400 }
      );
    }

    const detection = await providerOnboardingService.detectEHRSystem(provider);

    return NextResponse.json({
      success: true,
      ehrSystem: detection.system,
      confidence: detection.confidence,
    });
  } catch (error: any) {
    console.error('Error detecting EHR system:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to detect EHR system' },
      { status: 500 }
    );
  }
}