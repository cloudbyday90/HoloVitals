import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmployeeService } from '@/lib/services/EmployeeService';
import { OnboardingService } from '@/lib/services/OnboardingService';
import { AuditService } from '@/lib/services/AuditService';
import { OnboardingStage } from '@prisma/client';

/**
 * GET /api/staff/onboarding
 * List onboarding records with filtering
 */
export async function GET(request: NextRequest) {
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
      'onboarding:read'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get('stage') as OnboardingStage | undefined;
    const departmentId = searchParams.get('departmentId') || undefined;

    // Get onboarding records
    const records = await OnboardingService.getOnboardingRecords({
      stage,
      departmentId,
    });

    // Log audit
    await AuditService.log({
      employeeId: currentEmployee.id,
      action: 'onboarding:list',
      resourceType: 'onboarding',
      details: { filters: { stage, departmentId }, count: records.length },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error listing onboarding records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}