import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmployeeService } from '@/lib/services/EmployeeService';
import { OnboardingService } from '@/lib/services/OnboardingService';
import { AuditService } from '@/lib/services/AuditService';

/**
 * GET /api/staff/onboarding/[id]
 * Get onboarding details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current employee
    const currentEmployee = await EmployeeService.getEmployeeByUserId(session.user.id);
    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check permission (can view own onboarding or has onboarding:read permission)
    const onboarding = await OnboardingService.getOnboardingById(params.id);
    if (!onboarding) {
      return NextResponse.json({ error: 'Onboarding not found' }, { status: 404 });
    }

    const isOwnOnboarding = onboarding.employeeId === currentEmployee.id;
    const hasPermission = isOwnOnboarding || await EmployeeService.hasPermission(
      currentEmployee.id,
      'onboarding:read'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Log audit
    await AuditService.log({
      employeeId: currentEmployee.id,
      action: 'onboarding:read',
      resourceType: 'onboarding',
      resourceId: onboarding.id,
      details: { stage: onboarding.currentStage },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json(onboarding);
  } catch (error) {
    console.error('Error getting onboarding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}