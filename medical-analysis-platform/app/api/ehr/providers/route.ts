/**
 * EHR Providers API
 * 
 * GET /api/ehr/providers - List available EHR providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProviderDiscoveryService } from '@/lib/services/ProviderDiscoveryService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const popular = searchParams.get('popular') === 'true';
    const includeDisabled = searchParams.get('includeDisabled') === 'true';
    const includeSandbox = searchParams.get('includeSandbox') === 'true';

    let providers;

    if (search) {
      // Search providers by name
      providers = await ProviderDiscoveryService.searchProvidersByName(search);
    } else if (popular) {
      // Get popular providers sorted by market share
      providers = await ProviderDiscoveryService.getPopularProviders();
    } else {
      // Get all supported providers
      providers = await ProviderDiscoveryService.getSupportedProviders();
    }

    // Also get database configurations
    const configurations = await ProviderDiscoveryService.getProviderConfigurations(
      includeDisabled,
      includeSandbox
    );

    return NextResponse.json({
      success: true,
      providers,
      configurations,
      total: providers.length,
    });
  } catch (error: any) {
    console.error('Get providers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get providers' },
      { status: 500 }
    );
  }
}