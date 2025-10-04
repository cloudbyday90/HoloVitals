import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BetaCodeService } from '@/lib/services/BetaCodeService';

const betaCodeService = new BetaCodeService();

// GET - List all beta codes (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check
    // if (!session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await betaCodeService.getAllBetaCodes(page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching beta codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beta codes' },
      { status: 500 }
    );
  }
}

// POST - Create new beta code(s) (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check
    // if (!session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const body = await req.json();
    const {
      count = 1,
      maxUses = 1,
      expiresAt,
      tokenLimit = 3000000,
      storageLimit = 500,
      customCode,
    } = body;

    if (count > 1 && customCode) {
      return NextResponse.json(
        { error: 'Cannot use custom code with bulk creation' },
        { status: 400 }
      );
    }

    let codes;
    if (count > 1) {
      codes = await betaCodeService.createBulkBetaCodes(count, {
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        tokenLimit,
        storageLimit,
        createdBy: session.user.id,
      });
    } else {
      const code = await betaCodeService.createBetaCode({
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        tokenLimit,
        storageLimit,
        createdBy: session.user.id,
        customCode,
      });
      codes = [code];
    }

    return NextResponse.json({
      success: true,
      codes,
      count: codes.length,
    });
  } catch (error: any) {
    console.error('Error creating beta code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create beta code' },
      { status: 500 }
    );
  }
}