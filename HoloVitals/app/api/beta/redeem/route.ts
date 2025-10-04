import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BetaCodeService } from '@/lib/services/BetaCodeService';
import { AuditLoggingService } from '@/lib/services/AuditLoggingService';

const betaCodeService = new BetaCodeService();
const auditService = new AuditLoggingService();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Beta code is required' },
        { status: 400 }
      );
    }

    // Redeem the code
    await betaCodeService.redeemBetaCode(code, session.user.id);

    // Log audit event
    await auditService.logEvent({
      userId: session.user.id,
      action: 'BETA_CODE_REDEEMED',
      resourceType: 'BETA_CODE',
      resourceId: code,
      details: {
        code,
        timestamp: new Date().toISOString(),
      },
      ipAddress: req.headers.get('x-forwarded-for') || '',
      userAgent: req.headers.get('user-agent') || '',
    });

    return NextResponse.json({
      success: true,
      message: 'Beta code redeemed successfully! Welcome to the beta program.',
    });
  } catch (error: any) {
    console.error('Error redeeming beta code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to redeem beta code' },
      { status: 400 }
    );
  }
}