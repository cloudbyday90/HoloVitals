import { NextRequest, NextResponse } from 'next/server';
import { BetaCodeService } from '@/lib/services/BetaCodeService';

const betaCodeService = new BetaCodeService();

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Beta code is required' },
        { status: 400 }
      );
    }

    const validation = await betaCodeService.validateBetaCode(code);

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, error: validation.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: {
        tokenLimit: validation.code?.tokenLimit,
        storageLimit: validation.code?.storageLimit,
      },
    });
  } catch (error) {
    console.error('Error validating beta code:', error);
    return NextResponse.json(
      { error: 'Failed to validate beta code' },
      { status: 500 }
    );
  }
}