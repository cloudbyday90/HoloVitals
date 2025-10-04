import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmployeeService } from '@/lib/services/EmployeeService';
import { OnboardingService } from '@/lib/services/OnboardingService';
import { AuditService } from '@/lib/services/AuditService';

/**
 * POST /api/staff/onboarding/[id]/checklist
 * Update onboarding checklist
 */
export async function POST(
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

    // Get onboarding record
    const onboarding = await OnboardingService.getOnboardingById(params.id);
    if (!onboarding) {
      return NextResponse.json({ error: 'Onboarding not found' }, { status: 404 });
    }

    // Check permission (can update own onboarding or has onboarding:update permission)
    const isOwnOnboarding = onboarding.employeeId === currentEmployee.id;
    const hasPermission = isOwnOnboarding || await EmployeeService.hasPermission(
      currentEmployee.id,
      'onboarding:update'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { itemId, completed } = body;

    // Validate required fields
    if (!itemId || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Item ID and completed status are required' },
        { status: 400 }
      );
    }

    // Update checklist
    const updatedOnboarding = await OnboardingService.updateChecklistItem(
      params.id,
      itemId,
      completed
    );

    // Log audit
    await AuditService.log({
      employeeId: currentEmployee.id,
      action: 'onboarding:update_checklist',
      resourceType: 'onboarding',
      resourceId: params.id,
      details: { itemId, completed },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json(updatedOnboarding);
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}