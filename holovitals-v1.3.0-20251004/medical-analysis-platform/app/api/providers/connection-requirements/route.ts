/**
 * Connection Requirements API
 * POST /api/providers/connection-requirements - Get connection requirements for EHR system
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
    const { ehrSystem } = body;

    if (!ehrSystem) {
      return NextResponse.json(
        { error: 'EHR system is required' },
        { status: 400 }
      );
    }

    const requirements = providerOnboardingService.getConnectionRequirements(ehrSystem);

    return NextResponse.json({
      success: true,
      requirements,
    });
  } catch (error: any) {
    console.error('Error getting connection requirements:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get connection requirements' },
      { status: 500 }
    );
  }
}