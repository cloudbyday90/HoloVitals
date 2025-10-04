/**
 * RBAC Middleware
 * Role-Based Access Control middleware for protecting routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { PermissionService } from '@/lib/services/rbac/PermissionService';
import { EmployeeService } from '@/lib/services/rbac/EmployeeService';
import { AuditService } from '@/lib/services/rbac/AuditService';

export interface RBACOptions {
  requiredPermissions?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user must have ANY permission
  requiredRoles?: string[];
  allowSuperAdmin?: boolean;
}

/**
 * RBAC Middleware - Protect routes with role and permission checks
 */
export async function withRBAC(
  request: NextRequest,
  options: RBACOptions = {}
) {
  const {
    requiredPermissions = [],
    requireAll = false,
    requiredRoles = [],
    allowSuperAdmin = true,
  } = options;

  try {
    // Get session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Get employee record
    const employee = await EmployeeService.getEmployeeByUserId(session.user.id);

    if (!employee) {
      // User is not an employee - deny access to staff portal
      await AuditService.createAuditLog({
        action: 'READ',
        resource: 'StaffPortal',
        success: false,
        errorMessage: 'User is not an employee',
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
        endpoint: request.nextUrl.pathname,
      });

      return NextResponse.json(
        { error: 'Forbidden - Employee access required' },
        { status: 403 }
      );
    }

    // Check if employee is active
    if (employee.employmentStatus !== 'ACTIVE') {
      await AuditService.createAuditLog({
        employeeId: employee.id,
        action: 'READ',
        resource: 'StaffPortal',
        success: false,
        errorMessage: `Employee status: ${employee.employmentStatus}`,
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
        endpoint: request.nextUrl.pathname,
      });

      return NextResponse.json(
        { error: 'Forbidden - Employee account is not active' },
        { status: 403 }
      );
    }

    // Check if employee has SUPER_ADMIN role (bypass all checks)
    if (allowSuperAdmin) {
      const hasSuperAdmin = employee.roles.some(
        er => er.role.code === 'SUPER_ADMIN'
      );

      if (hasSuperAdmin) {
        // Log access
        await AuditService.createAuditLog({
          employeeId: employee.id,
          action: 'READ',
          resource: 'StaffPortal',
          success: true,
          details: 'SUPER_ADMIN access',
          ipAddress: request.ip,
          userAgent: request.headers.get('user-agent') || undefined,
          endpoint: request.nextUrl.pathname,
        });

        // Add employee info to request headers for downstream use
        const response = NextResponse.next();
        response.headers.set('X-Employee-Id', employee.id);
        response.headers.set('X-Employee-Role', 'SUPER_ADMIN');
        return response;
      }
    }

    // Check required roles
    if (requiredRoles.length > 0) {
      const employeeRoleCodes = employee.roles.map(er => er.role.code);
      const hasRequiredRole = requiredRoles.some(role =>
        employeeRoleCodes.includes(role)
      );

      if (!hasRequiredRole) {
        await AuditService.createAuditLog({
          employeeId: employee.id,
          action: 'READ',
          resource: 'StaffPortal',
          success: false,
          errorMessage: `Required roles: ${requiredRoles.join(', ')}`,
          ipAddress: request.ip,
          userAgent: request.headers.get('user-agent') || undefined,
          endpoint: request.nextUrl.pathname,
        });

        return NextResponse.json(
          {
            error: 'Forbidden - Required role not found',
            requiredRoles,
          },
          { status: 403 }
        );
      }
    }

    // Check required permissions
    if (requiredPermissions.length > 0) {
      let hasPermission = false;

      if (requireAll) {
        // User must have ALL permissions
        hasPermission = await PermissionService.checkAllPermissions(
          employee.id,
          requiredPermissions
        );
      } else {
        // User must have ANY permission
        hasPermission = await PermissionService.checkAnyPermission(
          employee.id,
          requiredPermissions
        );
      }

      if (!hasPermission) {
        await AuditService.createAuditLog({
          employeeId: employee.id,
          action: 'READ',
          resource: 'StaffPortal',
          success: false,
          errorMessage: `Required permissions: ${requiredPermissions.join(', ')}`,
          ipAddress: request.ip,
          userAgent: request.headers.get('user-agent') || undefined,
          endpoint: request.nextUrl.pathname,
        });

        return NextResponse.json(
          {
            error: 'Forbidden - Required permission not found',
            requiredPermissions,
          },
          { status: 403 }
        );
      }
    }

    // Log successful access
    await AuditService.createAuditLog({
      employeeId: employee.id,
      action: 'READ',
      resource: 'StaffPortal',
      success: true,
      ipAddress: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
      endpoint: request.nextUrl.pathname,
    });

    // Add employee info to request headers
    const response = NextResponse.next();
    response.headers.set('X-Employee-Id', employee.id);
    response.headers.set(
      'X-Employee-Roles',
      employee.roles.map(er => er.role.code).join(',')
    );
    return response;
  } catch (error) {
    console.error('RBAC middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if user has permission (for use in API routes)
 */
export async function checkPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const employee = await EmployeeService.getEmployeeByUserId(userId);
    if (!employee) {
      return false;
    }

    const result = await PermissionService.checkPermission(
      employee.id,
      permission
    );
    return result.granted;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Check if user has role (for use in API routes)
 */
export async function checkRole(
  userId: string,
  roleCode: string
): Promise<boolean> {
  try {
    const employee = await EmployeeService.getEmployeeByUserId(userId);
    if (!employee) {
      return false;
    }

    return employee.roles.some(er => er.role.code === roleCode);
  } catch (error) {
    console.error('Role check error:', error);
    return false;
  }
}

/**
 * Get employee from user ID (for use in API routes)
 */
export async function getEmployeeFromUserId(userId: string) {
  try {
    return await EmployeeService.getEmployeeByUserId(userId);
  } catch (error) {
    console.error('Get employee error:', error);
    return null;
  }
}

/**
 * Require authentication (basic check)
 */
export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }

  return null; // No error, continue
}

/**
 * Require employee access (user must be an employee)
 */
export async function requireEmployee(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }

  const employee = await EmployeeService.getEmployeeByUserId(session.user.id);

  if (!employee) {
    return NextResponse.json(
      { error: 'Forbidden - Employee access required' },
      { status: 403 }
    );
  }

  if (employee.employmentStatus !== 'ACTIVE') {
    return NextResponse.json(
      { error: 'Forbidden - Employee account is not active' },
      { status: 403 }
    );
  }

  return null; // No error, continue
}

/**
 * Create RBAC middleware wrapper for API routes
 */
export function createRBACHandler(
  handler: (req: NextRequest, employee: any) => Promise<NextResponse>,
  options: RBACOptions = {}
) {
  return async (req: NextRequest) => {
    // Check RBAC
    const rbacResult = await withRBAC(req, options);
    
    // If RBAC check failed, return the error response
    if (rbacResult.status !== 200) {
      return rbacResult;
    }

    // Get employee info
    const session = await getServerSession(authOptions);
    const employee = await EmployeeService.getEmployeeByUserId(session!.user.id);

    // Call the actual handler with employee info
    return handler(req, employee);
  };
}