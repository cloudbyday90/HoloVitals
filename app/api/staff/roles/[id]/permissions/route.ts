import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmployeeService } from '@/lib/services/EmployeeService';
import { RoleService } from '@/lib/services/RoleService';
import { AuditService } from '@/lib/services/AuditService';

/**
 * POST /api/staff/roles/[id]/permissions
 * Assign permissions to a role
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
      'role:update'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { permissionIds } = body;

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: 'permissionIds must be an array' },
        { status: 400 }
      );
    }

    // Get role before update
    const role = await RoleService.getRoleById(params.id);
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Assign permissions
    const updatedRole = await RoleService.assignPermissionsToRole(
      params.id,
      permissionIds
    );

    // Log audit
    await AuditService.log({
      employeeId: currentEmployee.id,
      action: 'role:assign_permissions',
      resourceType: 'role',
      resourceId: params.id,
      details: {
        roleName: role.name,
        permissionCount: permissionIds.length,
        permissionIds,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error('Error assigning permissions to role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}