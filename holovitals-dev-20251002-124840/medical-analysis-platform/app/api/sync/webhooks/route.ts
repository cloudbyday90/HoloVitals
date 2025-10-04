/**
 * Webhook Management API Endpoints
 * 
 * POST /api/sync/webhooks - Register a webhook
 * GET /api/sync/webhooks - List webhooks
 * DELETE /api/sync/webhooks - Delete a webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { webhookService, WebhookEventType } from '@/lib/services/sync/WebhookService';

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
    const {
      ehrProvider,
      ehrConnectionId,
      endpoint,
      secret,
      events,
      retryAttempts,
      retryDelay,
      timeout,
      signatureHeader,
      signatureAlgorithm,
      customHeaders,
    } = body;

    // Validate required fields
    if (!ehrProvider || !ehrConnectionId || !endpoint || !secret || !events) {
      return NextResponse.json(
        { error: 'Missing required fields: ehrProvider, ehrConnectionId, endpoint, secret, events' },
        { status: 400 }
      );
    }

    // Register webhook
    await webhookService.registerWebhook({
      ehrProvider,
      ehrConnectionId,
      endpoint,
      secret,
      enabled: true,
      events: events as WebhookEventType[],
      retryAttempts: retryAttempts || 3,
      retryDelay: retryDelay || 2000,
      timeout: timeout || 30000,
      signatureHeader,
      signatureAlgorithm,
      customHeaders,
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook registered successfully',
    });
  } catch (error) {
    console.error('Error registering webhook:', error);
    return NextResponse.json(
      { error: 'Failed to register webhook', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const ehrProvider = searchParams.get('ehrProvider');
    const ehrConnectionId = searchParams.get('ehrConnectionId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get webhook logs
    const result = await webhookService.getWebhookLogs(
      ehrProvider || undefined,
      ehrConnectionId || undefined,
      status as any,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const ehrProvider = searchParams.get('ehrProvider');
    const ehrConnectionId = searchParams.get('ehrConnectionId');

    if (!ehrProvider || !ehrConnectionId) {
      return NextResponse.json(
        { error: 'ehrProvider and ehrConnectionId are required' },
        { status: 400 }
      );
    }

    // Delete webhook
    await webhookService.deleteWebhook(ehrProvider, ehrConnectionId);

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook', details: error.message },
      { status: 500 }
    );
  }
}