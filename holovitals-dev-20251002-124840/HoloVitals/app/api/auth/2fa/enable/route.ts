/**
 * 2FA Enable API Endpoint
 * 
 * Enable 2FA after verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuth } from '@/lib/services/TwoFactorAuthService';

/**
 * POST /api/auth/2fa/enable
 * Enable TOTP after verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID and verification code are required',
        },
        { status: 400 }
      );
    }

    // Enable TOTP
    const enabled = await twoFactorAuth.enableTOTP(userId, code);

    if (!enabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification code',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been enabled successfully.',
    });
  } catch (error) {
    console.error('Failed to enable 2FA:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to enable 2FA',
      },
      { status: 500 }
    );
  }
}