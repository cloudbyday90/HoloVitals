/**
 * 2FA Verification API Endpoint
 * 
 * Verify 2FA code during authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuth } from '@/lib/services/TwoFactorAuthService';

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, code, method } = body;

    if (!userId || !code) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID and code are required',
        },
        { status: 400 }
      );
    }

    // Verify 2FA code
    const verified = await twoFactorAuth.verify2FA({
      userId,
      code,
      method: method || '2FA_TOTP',
    });

    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification code',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication verified successfully.',
    });
  } catch (error) {
    console.error('Failed to verify 2FA:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify 2FA',
      },
      { status: 500 }
    );
  }
}