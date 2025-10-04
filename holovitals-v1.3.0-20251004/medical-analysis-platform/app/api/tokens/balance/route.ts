/**
 * Token Balance API
 * 
 * GET /api/tokens/balance - Get user's token balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/TokenService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }
    
    const balance = await TokenService.getBalance(userId);
    
    return NextResponse.json({
      success: true,
      balance,
    });
  } catch (error: any) {
    console.error('Get token balance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get token balance' },
      { status: 500 }
    );
  }
}