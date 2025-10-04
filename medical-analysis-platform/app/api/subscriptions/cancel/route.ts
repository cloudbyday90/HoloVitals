/**
 * Subscription Cancellation API
 * 
 * POST /api/subscriptions/cancel - Cancel subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/SubscriptionService';


// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reason, immediate = false } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }
    
    const subscription = await SubscriptionService.cancelSubscription({
      userId,
      reason,
      immediate,
    });
    
    return NextResponse.json({
      success: true,
      subscription,
      message: immediate
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of the billing cycle',
    });
  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}