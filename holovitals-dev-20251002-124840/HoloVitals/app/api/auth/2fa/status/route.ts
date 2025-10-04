/**
 * 2FA Status API Endpoint
 * 
 * Get 2FA status for user
 */

import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuth } from '@/lib/services/TwoFactorAuthService';

/**
 * GET /api/auth/2fa/status
 * Get 2FA status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Get 2FA status
    const status = await twoFactorAuth.get2FAStatus(userId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Failed to get 2FA status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get 2FA status',
      },
      { status: 500 }
    );
  }
}