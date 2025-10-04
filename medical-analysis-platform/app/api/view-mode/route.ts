/**
 * View Mode API
 * Switch between patient and staff views
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { EmployeeService } from '@/lib/services/rbac/EmployeeService';
import { cookies } from 'next/headers';

const VIEW_MODE_COOKIE = 'holovitals_view_mode';

/**
 * GET - Get current view mode
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is an employee
    const employee = await EmployeeService.getEmployeeByUserId(session.user.id);
    const isEmployee = !!employee && employee.employmentStatus === 'ACTIVE';

    // Get current view mode
    const cookieStore = cookies();
    const currentMode = cookieStore.get(VIEW_MODE_COOKIE)?.value || 'patient';

    return NextResponse.json({
      currentMode,
      isEmployee,
      canSwitchToStaff: isEmployee,
      employeeInfo: isEmployee ? {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        jobTitle: employee.jobTitle,
        department: employee.department.name,
        roles: employee.roles.map(er => ({
          id: er.role.id,
          name: er.role.name,
          code: er.role.code,
        })),
      } : null,
    });
  } catch (error) {
    console.error('Error getting view mode:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Switch view mode
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { mode } = await request.json();

    if (!mode || !['patient', 'staff'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid view mode. Must be "patient" or "staff"' },
        { status: 400 }
      );
    }

    // If switching to staff view, verify user is an employee
    if (mode === 'staff') {
      const employee = await EmployeeService.getEmployeeByUserId(session.user.id);

      if (!employee) {
        return NextResponse.json(
          { error: 'You must be an employee to access staff view' },
          { status: 403 }
        );
      }

      if (employee.employmentStatus !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Your employee account is not active' },
          { status: 403 }
        );
      }
    }

    // Set cookie
    const response = NextResponse.json({
      success: true,
      mode,
      redirectUrl: mode === 'staff' ? '/staff/dashboard' : '/dashboard',
    });

    response.cookies.set(VIEW_MODE_COOKIE, mode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error switching view mode:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}