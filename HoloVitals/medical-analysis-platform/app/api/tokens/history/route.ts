/**
 * Token Transaction History API
 * 
 * GET /api/tokens/history - Get token transaction history
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/TokenService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }
    
    const history = await TokenService.getTransactionHistory(userId, limit, offset);
    
    return NextResponse.json({
      success: true,
      ...history,
    });
  } catch (error: any) {
    console.error('Get token history error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get token history' },
      { status: 500 }
    );
  }
}