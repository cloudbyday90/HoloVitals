import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BetaCodeService } from '@/lib/services/BetaCodeService';
import { prisma } from '@/lib/prisma';

const betaCodeService = new BetaCodeService();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get token usage
    const tokenUsage = await betaCodeService.getTokenUsage(session.user.id);

    // Get storage usage
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        storageUsed: true,
        storageLimit: true,
      },
    });

    const storageUsage = {
      storageUsed: user?.storageUsed || 0,
      storageLimit: user?.storageLimit || 0,
      storageRemaining: Math.max(0, (user?.storageLimit || 0) - (user?.storageUsed || 0)),
      percentageUsed: user?.storageLimit 
        ? Math.round(((user.storageUsed || 0) / user.storageLimit) * 10000) / 100
        : 0,
    };

    // Get file upload count
    const fileCount = await prisma.fileUpload.count({
      where: {
        userId: session.user.id,
        isDeleted: false,
      },
    });

    return NextResponse.json({
      tokens: tokenUsage,
      storage: storageUsage,
      fileCount,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}