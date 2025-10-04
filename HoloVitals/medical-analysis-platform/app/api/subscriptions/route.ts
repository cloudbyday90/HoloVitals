/**
 * Subscription API Routes
 * 
 * POST /api/subscriptions - Create or upgrade subscription
 * GET /api/subscriptions - Get current subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/SubscriptionService';
import { SubscriptionTier } from '@/lib/config/pricing';
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

    const body = await request.json();
    const { userId, tier, paymentMethodId, trialPeriod, action } = body;
    
    if (!userId || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, tier' },
        { status: 400 }
      );
    }
    
    // Validate tier
    if (!Object.values(SubscriptionTier).includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }
    
    if (action === 'upgrade' || action === 'downgrade') {
      // Change existing subscription
      const { immediate = false } = body;
      
      const subscription = await SubscriptionService.changeSubscriptionTier({
        userId,
        newTier: tier,
        immediate,
      });
      
      return NextResponse.json({
        success: true,
        subscription,
        message: immediate
          ? `Subscription ${action}d to ${tier} immediately`
          : `Subscription ${action} to ${tier} scheduled for next billing cycle`,
      });
    } else {
      // Create new subscription
      const result = await SubscriptionService.createSubscription({
        userId,
        tier,
        paymentMethodId,
        trialPeriod: trialPeriod || false,
      });
      
      return NextResponse.json({
        success: true,
        subscription: result.subscription,
        tokenBalance: result.tokenBalance,
        message: trialPeriod
          ? 'Trial subscription created successfully'
          : 'Subscription created successfully',
      });
    }
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Payment system is not configured. Stripe integration is disabled in development mode.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }
    
    const subscription = await SubscriptionService.getSubscription(userId);
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get subscription' },
      { status: 500 }
    );
  }
}