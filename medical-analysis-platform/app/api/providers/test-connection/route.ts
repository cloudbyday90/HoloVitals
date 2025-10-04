/**
 * Test Connection API
 * POST /api/providers/test-connection - Test EHR connection
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
    const { ehrSystem, credentials } = body;

    if (!ehrSystem || !credentials) {
      return NextResponse.json(
        { error: 'EHR system and credentials are required' },
        { status: 400 }
      );
    }

    const result = await providerOnboardingService.testConnection(ehrSystem, credentials);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      details: result.details,
    });
  } catch (error: any) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to test connection' 
      },
      { status: 500 }
    );
  }
}