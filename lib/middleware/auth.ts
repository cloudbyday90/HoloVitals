/**
 * Authentication and Authorization Middleware
 * Protects routes and API endpoints based on user roles and permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { accessControl } from '../services/AccessControlService';
import { UserRole, Permission, ResourceType } from '../types/rbac';

// ============================================================================
// SESSION HELPERS
// ============================================================================

/**
 * Get current user session
 */
export async function getCurrentUser(req: NextRequest) {
  const session = await getServerSession();
  
  if (!session || !session.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role as UserRole,
  };
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Require authentication
 */
export async function requireAuth(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }

  return user;
}

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

/**
 * Require specific role
 */
export async function requireRole(req: NextRequest, requiredRole: UserRole) {
  const user = await requireAuth(req);
  
  if (user instanceof NextResponse) {
    return user; // Return error response
  }

  if (!accessControl.hasRoleLevel(user.role, requiredRole)) {
    await accessControl.logAccess(
      {
        userId: user.id,
        role: user.role,
        permissions: [],
      },
      `ACCESS_DENIED_ROLE`,
      {
        allowed: false,
        reason: `Required role: ${requiredRole}, User role: ${user.role}`,
        requiredRole,
      },
      {
        ipAddress: req.ip,
        userAgent: req.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json(
      {
        error: 'Forbidden - Insufficient role',
        required: requiredRole,
        current: user.role,
      },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Require owner role
 */
export async function requireOwner(req: NextRequest) {
  return requireRole(req, UserRole.OWNER);
}

/**
 * Require admin or higher
 */
export async function requireAdmin(req: NextRequest) {
  return requireRole(req, UserRole.ADMIN);
}

/**
 * Require specific permission
 */
export async function requirePermission(
  req: NextRequest,
  permission: Permission
) {
  const user = await requireAuth(req);
  
  if (user instanceof NextResponse) {
    return user;
  }

  if (!accessControl.hasPermission(user.role, permission)) {
    await accessControl.logAccess(
      {
        userId: user.id,
        role: user.role,
        permissions: [permission],
      },
      `ACCESS_DENIED_PERMISSION`,
      {
        allowed: false,
        reason: `Required permission: ${permission}`,
        requiredPermission: permission,
      },
      {
        ipAddress: req.ip,
        userAgent: req.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json(
      {
        error: 'Forbidden - Insufficient permissions',
        required: permission,
      },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(
  req: NextRequest,
  permissions: Permission[]
) {
  const user = await requireAuth(req);
  
  if (user instanceof NextResponse) {
    return user;
  }

  if (!accessControl.hasAnyPermission(user.role, permissions)) {
    await accessControl.logAccess(
      {
        userId: user.id,
        role: user.role,
        permissions,
      },
      `ACCESS_DENIED_PERMISSIONS`,
      {
        allowed: false,
        reason: `Required one of: ${permissions.join(', ')}`,
      },
      {
        ipAddress: req.ip,
        userAgent: req.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json(
      {
        error: 'Forbidden - Insufficient permissions',
        required: permissions,
      },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Require all of the specified permissions
 */
export async function requireAllPermissions(
  req: NextRequest,
  permissions: Permission[]
) {
  const user = await requireAuth(req);
  
  if (user instanceof NextResponse) {
    return user;
  }

  if (!accessControl.hasAllPermissions(user.role, permissions)) {
    await accessControl.logAccess(
      {
        userId: user.id,
        role: user.role,
        permissions,
      },
      `ACCESS_DENIED_PERMISSIONS`,
      {
        allowed: false,
        reason: `Required all of: ${permissions.join(', ')}`,
      },
      {
        ipAddress: req.ip,
        userAgent: req.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json(
      {
        error: 'Forbidden - Insufficient permissions',
        required: permissions,
      },
      { status: 403 }
    );
  }

  return user;
}

// ============================================================================
// RESOURCE ACCESS MIDDLEWARE
// ============================================================================

/**
 * Require resource access
 */
export async function requireResourceAccess(
  req: NextRequest,
  resourceType: ResourceType,
  resourceId: string,
  requiredPermissions: Permission[]
) {
  const user = await requireAuth(req);
  
  if (user instanceof NextResponse) {
    return user;
  }

  const decision = await accessControl.canAccessResource({
    userId: user.id,
    role: user.role,
    permissions: requiredPermissions,
    resourceType,
    resourceId,
  });

  if (!decision.allowed) {
    await accessControl.logAccess(
      {
        userId: user.id,
        role: user.role,
        permissions: requiredPermissions,
        resourceType,
        resourceId,
      },
      `ACCESS_DENIED_RESOURCE`,
      decision,
      {
        ipAddress: req.ip,
        userAgent: req.headers.get('user-agent') || undefined,
      }
    );

    return NextResponse.json(
      {
        error: 'Forbidden - Cannot access resource',
        reason: decision.reason,
      },
      { status: 403 }
    );
  }

  // Log successful access
  await accessControl.logAccess(
    {
      userId: user.id,
      role: user.role,
      permissions: requiredPermissions,
      resourceType,
      resourceId,
    },
    `ACCESS_GRANTED_RESOURCE`,
    decision,
    {
      ipAddress: req.ip,
      userAgent: req.headers.get('user-agent') || undefined,
    }
  );

  return user;
}

// ============================================================================
// FINANCIAL DATA PROTECTION
// ============================================================================

/**
 * Protect financial endpoints (OWNER only)
 */
export async function protectFinancialEndpoint(req: NextRequest) {
  const user = await requireOwner(req);
  
  if (user instanceof NextResponse) {
    return user;
  }

  // Log financial data access
  await accessControl.logAccess(
    {
      userId: user.id,
      role: user.role,
      permissions: [Permission.VIEW_FINANCIALS],
      resourceType: ResourceType.FINANCIAL,
    },
    'FINANCIAL_DATA_ACCESS',
    { allowed: true, reason: 'Owner accessing financial data' },
    {
      ipAddress: req.ip,
      userAgent: req.headers.get('user-agent') || undefined,
    }
  );

  return user;
}

/**
 * Protect cost endpoints (OWNER only)
 */
export async function protectCostEndpoint(req: NextRequest) {
  const user = await requireOwner(req);
  
  if (user instanceof NextResponse) {
    return user;
  }

  // Log cost data access
  await accessControl.logAccess(
    {
      userId: user.id,
      role: user.role,
      permissions: [Permission.VIEW_COSTS],
      resourceType: ResourceType.COST,
    },
    'COST_DATA_ACCESS',
    { allowed: true, reason: 'Owner accessing cost data' },
    {
      ipAddress: req.ip,
      userAgent: req.headers.get('user-agent') || undefined,
    }
  );

  return user;
}

// ============================================================================
// ROUTE PROTECTION HELPER
// ============================================================================

/**
 * Protect route based on path
 */
export async function protectRoute(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Check if route is protected
  if (!accessControl.isProtectedRoute(path)) {
    return null; // Not a protected route
  }

  const user = await requireAuth(req);
  
  if (user instanceof NextResponse) {
    return user;
  }

  // Get required permissions for this route
  const requiredPermissions = accessControl.getRoutePermissions(path);

  // Check if user has required permissions
  if (requiredPermissions.length > 0) {
    const hasPermissions = accessControl.hasAllPermissions(
      user.role,
      requiredPermissions
    );

    if (!hasPermissions) {
      await accessControl.logAccess(
        {
          userId: user.id,
          role: user.role,
          permissions: requiredPermissions,
        },
        `ROUTE_ACCESS_DENIED`,
        {
          allowed: false,
          reason: `Route requires: ${requiredPermissions.join(', ')}`,
        },
        {
          ipAddress: req.ip,
          userAgent: req.headers.get('user-agent') || undefined,
        }
      );

      return NextResponse.json(
        {
          error: 'Forbidden - Insufficient permissions for this route',
          required: requiredPermissions,
        },
        { status: 403 }
      );
    }
  }

  // Log successful route access
  await accessControl.logAccess(
    {
      userId: user.id,
      role: user.role,
      permissions: requiredPermissions,
    },
    `ROUTE_ACCESS_GRANTED`,
    { allowed: true, reason: 'User has required permissions' },
    {
      ipAddress: req.ip,
      userAgent: req.headers.get('user-agent') || undefined,
    }
  );

  return user;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Create success response with user context
 */
export function successResponse(data: any, user: any) {
  return NextResponse.json({
    ...data,
    _meta: {
      userId: user.id,
      role: user.role,
      timestamp: new Date().toISOString(),
    },
  });
}