/**
 * Retry Webhook API Endpoint
 * 
 * POST /api/sync/webhooks/[webhookId]/retry - Retry a failed webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { webhookService } from '@/lib/services/sync/WebhookService';

export async function POST(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { webhookId } = params;

    // Retry webhook
    const result = await webhookService.retryWebhook(webhookId);

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error) {
    console.error('Error retrying webhook:', error);
    return NextResponse.json(
      { error: 'Failed to retry webhook', details: error.message },
      { status: 500 }
    );
  }
}