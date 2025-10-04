import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmployeeService } from '@/lib/services/EmployeeService';
import { AuditService } from '@/lib/services/AuditService';
import { EmployeeStatus, EmploymentType } from '@prisma/client';

/**
 * GET /api/staff/employees
 * List employees with filtering and pagination
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
      'employee:read'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;
    const status = searchParams.get('status') as EmployeeStatus | undefined;
    const employmentType = searchParams.get('employmentType') as EmploymentType | undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get employees
    const employees = await EmployeeService.searchEmployees({
      search,
      departmentId,
      status,
      employmentType,
      page,
      limit,
    });

    // Log audit
    await AuditService.log({
      employeeId: currentEmployee.id,
      action: 'employee:list',
      resourceType: 'employee',
      details: { filters: { search, departmentId, status, employmentType } },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error listing employees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff/employees
 * Create a new employee
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
      'employee:create'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      userId,
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      roleId,
      employmentType,
      startDate,
      jobTitle,
      salary,
      emergencyContact,
    } = body;

    // Validate required fields
    if (!userId || !employeeId || !firstName || !lastName || !email || !departmentId || !roleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create employee
    const employee = await EmployeeService.createEmployee({
      userId,
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      roleId,
      employmentType: employmentType || EmploymentType.FULL_TIME,
      startDate: startDate ? new Date(startDate) : new Date(),
      jobTitle,
      salary: salary ? parseFloat(salary) : undefined,
      emergencyContact,
    });

    // Log audit
    await AuditService.log({
      employeeId: currentEmployee.id,
      action: 'employee:create',
      resourceType: 'employee',
      resourceId: employee.id,
      details: { employeeId: employee.employeeId, name: `${firstName} ${lastName}` },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}