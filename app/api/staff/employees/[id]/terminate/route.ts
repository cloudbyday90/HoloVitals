import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmployeeService } from '@/lib/services/EmployeeService';
import { AuditService } from '@/lib/services/AuditService';

/**
 * POST /api/staff/employees/[id]/terminate
 * Terminate an employee
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

    // Check permission
    const hasPermission = await EmployeeService.hasPermission(
      currentEmployee.id,
      'employee:terminate'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { terminationDate, reason } = body;

    if (!terminationDate || !reason) {
      return NextResponse.json(
        { error: 'Termination date and reason are required' },
        { status: 400 }
      );
    }

    // Get employee before termination
    const employee = await EmployeeService.getEmployeeById(params.id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Terminate employee
    const terminatedEmployee = await EmployeeService.terminateEmployee(
      params.id,
      new Date(terminationDate),
      reason
    );

    // Log audit
    await AuditService.log({
      employeeId: currentEmployee.id,
      action: 'employee:terminate',
      resourceType: 'employee',
      resourceId: params.id,
      details: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        terminationDate,
        reason,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json(terminatedEmployee);
  } catch (error) {
    console.error('Error terminating employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}