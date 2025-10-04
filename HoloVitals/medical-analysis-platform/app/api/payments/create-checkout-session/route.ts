/**
 * Create Checkout Session API Endpoint
 * POST /api/payments/create-checkout-session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import StripePaymentService from '@/lib/services/StripePaymentService';
import { CreateCheckoutSessionRequest } from '@/lib/types/payment';
import { isStripeConfigured } from '@/lib/config/stripe';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Payment system is not configured. Stripe integration is disabled in development mode.' },
        { status: 503 }
      );
    }

    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateCheckoutSessionRequest = await request.json();
    const { plan, successUrl, cancelUrl, trialDays, couponCode } = body;

    if (!plan || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create checkout session
    const { sessionId, url } = await StripePaymentService.createCheckoutSession(
      session.user.id,
      session.user.email!,
      {
        plan,
        successUrl,
        cancelUrl,
        trialDays,
        couponCode,
      }
    );

    return NextResponse.json({
      success: true,
      sessionId,
      url,
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}