/**
 * Webhook Receiver Endpoint
 * 
 * POST /api/sync/webhooks/receive - Receive webhooks from EHR providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { webhookService } from '@/lib/services/sync/WebhookService';

export async function POST(request: NextRequest) {
  try {
    // Get EHR provider and connection ID from headers or query params
    const ehrProvider = request.headers.get('x-ehr-provider') || request.nextUrl.searchParams.get('provider');
    const ehrConnectionId = request.headers.get('x-ehr-connection-id') || request.nextUrl.searchParams.get('connectionId');

    if (!ehrProvider || !ehrConnectionId) {
      return NextResponse.json(
        { error: 'Missing ehrProvider or ehrConnectionId' },
        { status: 400 }
      );
    }

    // Get all headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Get body
    const body = await request.json();

    // Process webhook
    const result = await webhookService.processWebhook(
      ehrProvider,
      ehrConnectionId,
      headers,
      body
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        webhookId: result.webhookId,
        syncJobId: result.syncJobId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          webhookId: result.webhookId,
          errors: result.errors,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error.message },
      { status: 500 }
    );
  }
}