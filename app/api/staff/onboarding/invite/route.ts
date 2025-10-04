import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmployeeService } from '@/lib/services/EmployeeService';
import { OnboardingService } from '@/lib/services/OnboardingService';
import { AuditService } from '@/lib/services/AuditService';

/**
 * POST /api/staff/onboarding/invite
 * Send onboarding invitation
 */
export async function POST(request: NextRequest) {
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

    // Check permission
    const hasPermission = await EmployeeService.hasPermission(
      currentEmployee.id,
      'onboarding:create'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { employeeId, email, firstName, lastName } = body;

    // Validate required fields
    if (!employeeId || !email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send invitation
    const invitation = await OnboardingService.sendInvitation(
      employeeId,
      email,
      firstName,
      lastName
    );

    // Log audit
    await AuditService.log({
      employeeId: currentEmployee.id,
      action: 'onboarding:invite',
      resourceType: 'onboarding',
      resourceId: invitation.id,
      details: { email, name: `${firstName} ${lastName}` },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}