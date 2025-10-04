import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BetaCodeService } from '@/lib/services/BetaCodeService';

const betaCodeService = new BetaCodeService();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check

    const stats = await betaCodeService.getBetaCodeStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching beta stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beta stats' },
      { status: 500 }
    );
  }
}