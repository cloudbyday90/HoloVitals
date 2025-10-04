/**
 * Create Billing Portal Session API Endpoint
 * POST /api/payments/create-billing-portal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import StripePaymentService from '@/lib/services/StripePaymentService';
import { CreateBillingPortalRequest } from '@/lib/types/payment';
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
    const body: CreateBillingPortalRequest = await request.json();
    const { returnUrl } = body;

    if (!returnUrl) {
      return NextResponse.json(
        { success: false, error: 'Return URL is required' },
        { status: 400 }
      );
    }

    // Create billing portal session
    const url = await StripePaymentService.createBillingPortalSession(
      session.user.id,
      { returnUrl }
    );

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error) {
    console.error('Create billing portal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}