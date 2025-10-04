/**
 * 2FA Setup API Endpoints
 * 
 * Endpoints for setting up two-factor authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuth } from '@/lib/services/TwoFactorAuthService';

/**
 * POST /api/auth/2fa/setup
 * Setup TOTP for user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Setup TOTP
    const result = await twoFactorAuth.setupTOTP(userId);

    return NextResponse.json({
      success: true,
      data: {
        secret: result.secret,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
      },
      message: 'TOTP setup initiated. Please scan the QR code with your authenticator app.',
    });
  } catch (error) {
    console.error('Failed to setup 2FA:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup 2FA',
      },
      { status: 500 }
    );
  }
}