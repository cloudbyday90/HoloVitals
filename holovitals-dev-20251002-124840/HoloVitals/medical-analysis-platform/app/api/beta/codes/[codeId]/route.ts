import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BetaCodeService } from '@/lib/services/BetaCodeService';

const betaCodeService = new BetaCodeService();

// GET - Get beta code details (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { codeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check

    const code = await betaCodeService.getBetaCodeById(params.codeId);

    if (!code) {
      return NextResponse.json({ error: 'Beta code not found' }, { status: 404 });
    }

    // Get users who used this code
    const users = await betaCodeService.getUsersByBetaCode(params.codeId);

    return NextResponse.json({
      code,
      users,
    });
  } catch (error) {
    console.error('Error fetching beta code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beta code' },
      { status: 500 }
    );
  }
}

// PATCH - Update beta code (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { codeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check

    const body = await req.json();
    const { maxUses, expiresAt, isActive, tokenLimit, storageLimit } = body;

    const updatedCode = await betaCodeService.updateBetaCode(params.codeId, {
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive,
      tokenLimit,
      storageLimit,
    });

    return NextResponse.json({
      success: true,
      code: updatedCode,
    });
  } catch (error) {
    console.error('Error updating beta code:', error);
    return NextResponse.json(
      { error: 'Failed to update beta code' },
      { status: 500 }
    );
  }
}

// DELETE - Delete beta code (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { codeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check

    await betaCodeService.deleteBetaCode(params.codeId);

    return NextResponse.json({
      success: true,
      message: 'Beta code deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting beta code:', error);
    return NextResponse.json(
      { error: 'Failed to delete beta code' },
      { status: 500 }
    );
  }
}