/**
 * 2FA Backup Codes API Endpoint
 * 
 * Regenerate backup codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuth } from '@/lib/services/TwoFactorAuthService';

/**
 * POST /api/auth/2fa/backup-codes
 * Regenerate backup codes
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

    // Regenerate backup codes
    const backupCodes = await twoFactorAuth.regenerateBackupCodes(userId);

    return NextResponse.json({
      success: true,
      data: {
        backupCodes,
      },
      message: 'Backup codes have been regenerated. Please store them securely.',
    });
  } catch (error) {
    console.error('Failed to regenerate backup codes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to regenerate backup codes',
      },
      { status: 500 }
    );
  }
}