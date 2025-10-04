/**
 * Pricing Information API
 * 
 * GET /api/pricing - Get pricing tiers and packages
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  TIER_CONFIGS,
  TOKEN_PACKAGES,
  TOKEN_COSTS,
  PRICING_RULES,
  getAnnualPrice,
} from '@/lib/config/pricing';

export async function GET(request: NextRequest) {
  try {
    const tiers = Object.values(TIER_CONFIGS).map(tier => ({
      ...tier,
      annualPrice: getAnnualPrice(tier.name as any),
      annualSavings: (tier.monthlyPrice * 12) - getAnnualPrice(tier.name as any),
    }));
    
    return NextResponse.json({
      success: true,
      tiers,
      tokenPackages: TOKEN_PACKAGES,
      tokenCosts: TOKEN_COSTS,
      pricingRules: PRICING_RULES,
    });
  } catch (error: any) {
    console.error('Get pricing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get pricing information' },
      { status: 500 }
    );
  }
}