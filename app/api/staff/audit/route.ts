import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmployeeService } from '@/lib/services/EmployeeService';
import { AuditService } from '@/lib/services/AuditService';

/**
 * GET /api/staff/audit
 * List audit logs with filtering
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
      'audit:read'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId') || undefined;
    const action = searchParams.get('action') || undefined;
    const resourceType = searchParams.get('resourceType') || undefined;
    const resourceId = searchParams.get('resourceId') || undefined;
    const success = searchParams.get('success') === 'true' ? true : 
                    searchParams.get('success') === 'false' ? false : undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get audit logs
    const logs = await AuditService.searchLogs({
      employeeId,
      action,
      resourceType,
      resourceId,
      success,
      startDate,
      endDate,
      page,
      limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error listing audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}