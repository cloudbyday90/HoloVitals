/**
 * Provider Search API
 * POST /api/providers/search - Search for healthcare providers
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
    const { query, limit = 10 } = body;

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const providers = await providerOnboardingService.searchProviders(query, limit);

    return NextResponse.json({
      success: true,
      providers,
      count: providers.length,
    });
  } catch (error: any) {
    console.error('Error searching providers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search providers' },
      { status: 500 }
    );
  }
}