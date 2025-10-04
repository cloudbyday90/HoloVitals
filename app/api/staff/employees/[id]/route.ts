import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmployeeService } from '@/lib/services/EmployeeService';
import { AuditService } from '@/lib/services/AuditService';
import { EmploymentType } from '@prisma/client';

/**
 * GET /api/staff/employees/[id]
 * Get employee details
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

    // Check permission (can view own profile or has employee:read permission)
    const isOwnProfile = currentEmployee.id === params.id;
    const hasPermission = isOwnProfile || await EmployeeService.hasPermission(
      currentEmployee.id,
      'employee:read'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get employee
    const employee = await EmployeeService.getEmployeeById(params.id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Log audit
    await AuditService.log({
      employeeId: currentEmployee.id,
      action: 'employee:read',
      resourceType: 'employee',
      resourceId: employee.id,
      details: { employeeId: employee.employeeId },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error getting employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/staff/employees/[id]
 * Update employee
 */
export async function PUT(
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

    // Parse request body
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      roleId,
      employmentType,
      jobTitle,
      salary,
      emergencyContact,
    } = body;

    // Update employee
    const employee = await EmployeeService.updateEmployee(params.id, {
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      roleId,
      employmentType: employmentType as EmploymentType,
      jobTitle,
      salary: salary ? parseFloat(salary) : undefined,
      emergencyContact,
    });

    // Log audit
    await AuditService.log({
      employeeId: currentEmployee.id,
      action: 'employee:update',
      resourceType: 'employee',
      resourceId: employee.id,
      details: { employeeId: employee.employeeId, changes: body },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staff/employees/[id]
 * Soft delete employee
 */
export async function DELETE(
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
      'employee:delete'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get employee before deletion
    const employee = await EmployeeService.getEmployeeById(params.id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Soft delete employee
    await EmployeeService.deleteEmployee(params.id);

    // Log audit
    await AuditService.log({
      employeeId: currentEmployee.id,
      action: 'employee:delete',
      resourceType: 'employee',
      resourceId: params.id,
      details: { employeeId: employee.employeeId, name: `${employee.firstName} ${employee.lastName}` },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}