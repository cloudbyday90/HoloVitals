/**
 * Token Usage Analytics API
 * 
 * GET /api/tokens/analytics - Get token usage analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/TokenService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }
    
    const analytics = await TokenService.getUsageAnalytics(userId, days);
    
    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    console.error('Get token analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get token analytics' },
      { status: 500 }
    );
  }
}