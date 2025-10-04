import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmployeeService } from '@/lib/services/EmployeeService';
import { AuditService } from '@/lib/services/AuditService';

/**
 * POST /api/staff/employees/[id]/reactivate
 * Reactivate a terminated employee
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
      'employee:update'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get employee before reactivation
    const employee = await EmployeeService.getEmployeeById(params.id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Reactivate employee
    const reactivatedEmployee = await EmployeeService.reactivateEmployee(params.id);

    // Log audit
    await AuditService.log({
      employeeId: currentEmployee.id,
      action: 'employee:reactivate',
      resourceType: 'employee',
      resourceId: params.id,
      details: {
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json(reactivatedEmployee);
  } catch (error) {
    console.error('Error reactivating employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}