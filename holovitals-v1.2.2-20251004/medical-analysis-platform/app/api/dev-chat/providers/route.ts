/**
 * AI Provider Management API
 * 
 * Manage AI providers, switch between them, and configure settings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProviderManager } from '@/lib/providers/ProviderManager';
import { AIProviderConfig } from '@/lib/types/ai-provider';

/**
 * GET /api/dev-chat/providers
 * List all available providers
 */
export async function GET(request: NextRequest) {
  try {
    const providerManager = getProviderManager();
    const providers = providerManager.listProviders();
    const activeProvider = providerManager.getActiveProviderInfo();

    return NextResponse.json({
      providers,
      activeProvider
    }, { status: 200 });
  } catch (error: any) {
    console.error('Provider list error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dev-chat/providers
 * Register a new provider or switch active provider
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const providerManager = getProviderManager();

    // Check if this is a switch request
    if (body.action === 'switch' && body.providerName) {
      providerManager.switchProvider(body.providerName);
      
      return NextResponse.json({
        message: 'Provider switched successfully',
        activeProvider: providerManager.getActiveProviderInfo()
      }, { status: 200 });
    }

    // Check if this is a register request
    if (body.action === 'register' && body.name && body.config) {
      const config: AIProviderConfig = body.config;
      
      // Validate config
      if (!config.provider || !config.apiKey || !config.model) {
        return NextResponse.json(
          { error: 'Invalid provider configuration' },
          { status: 400 }
        );
      }

      providerManager.registerProvider(body.name, config);
      
      return NextResponse.json({
        message: 'Provider registered successfully',
        provider: providerManager.getProviderInfo(body.name)
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "switch" or "register"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Provider management error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dev-chat/providers?name=xxx
 * Update provider configuration
 */
export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Provider name is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const providerManager = getProviderManager();

    providerManager.updateProviderConfig(name, body);

    return NextResponse.json({
      message: 'Provider configuration updated',
      provider: providerManager.getProviderInfo(name)
    }, { status: 200 });
  } catch (error: any) {
    console.error('Provider update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dev-chat/providers?name=xxx
 * Remove a provider
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Provider name is required' },
        { status: 400 }
      );
    }

    const providerManager = getProviderManager();
    providerManager.removeProvider(name);

    return NextResponse.json({
      message: 'Provider removed successfully'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Provider removal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}