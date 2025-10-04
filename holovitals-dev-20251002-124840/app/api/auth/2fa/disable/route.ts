/**
 * 2FA Disable API Endpoint
 * 
 * Disable 2FA for user
 */

import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuth } from '@/lib/services/TwoFactorAuthService';

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, method } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Disable 2FA
    await twoFactorAuth.disable2FA(userId, method);

    return NextResponse.json({
      success: true,
      message: method 
        ? `${method} has been disabled successfully.`
        : 'Two-factor authentication has been disabled successfully.',
    });
  } catch (error) {
    console.error('Failed to disable 2FA:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disable 2FA',
      },
      { status: 500 }
    );
  }
}