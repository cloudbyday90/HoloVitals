/**
 * Token Purchase API
 * 
 * POST /api/tokens/purchase - Purchase additional tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/TokenService';
import { TOKEN_PACKAGES } from '@/lib/config/pricing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, packageIndex, paymentIntentId } = body;
    
    if (!userId || packageIndex === undefined || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, packageIndex, paymentIntentId' },
        { status: 400 }
      );
    }
    
    // Validate package index
    if (packageIndex < 0 || packageIndex >= TOKEN_PACKAGES.length) {
      return NextResponse.json(
        { error: 'Invalid package index' },
        { status: 400 }
      );
    }
    
    const tokenPackage = TOKEN_PACKAGES[packageIndex];
    
    // In production, verify payment with payment provider here
    // For now, we'll assume payment is successful
    
    const balance = await TokenService.purchaseTokens({
      userId,
      packageIndex,
      paymentIntentId,
    });
    
    return NextResponse.json({
      success: true,
      balance,
      package: tokenPackage,
      message: `Successfully purchased ${tokenPackage.displayName}`,
    });
  } catch (error: any) {
    console.error('Token purchase error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to purchase tokens' },
      { status: 500 }
    );
  }
}