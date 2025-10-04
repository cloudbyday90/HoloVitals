/**
 * Role Guard Component
 * Conditionally renders content based on user role and permissions
 */

'use client';

import { useSession } from 'next-auth/react';
import { UserRole, Permission } from '@/lib/types/rbac';
import { accessControl } from '@/lib/services/AccessControlService';

// ============================================================================
// ROLE GUARD COMPONENT
// ============================================================================

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, requires ALL permissions; if false, requires ANY
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export function RoleGuard({
  children,
  requiredRole,
  requiredPermission,
  requiredPermissions,
  requireAll = true,
  fallback = null,
  showFallback = false,
}: RoleGuardProps) {
  const { data: session, status } = useSession();

  // Loading state
  if (status === 'loading') {
    return showFallback ? <>{fallback}</> : null;
  }

  // Not authenticated
  if (!session || !session.user) {
    return showFallback ? <>{fallback}</> : null;
  }

  const userRole = session.user.role as UserRole;

  // Check role requirement
  if (requiredRole) {
    if (!accessControl.hasRoleLevel(userRole, requiredRole)) {
      return showFallback ? <>{fallback}</> : null;
    }
  }

  // Check single permission
  if (requiredPermission) {
    if (!accessControl.hasPermission(userRole, requiredPermission)) {
      return showFallback ? <>{fallback}</> : null;
    }
  }

  // Check multiple permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermissions = requireAll
      ? accessControl.hasAllPermissions(userRole, requiredPermissions)
      : accessControl.hasAnyPermission(userRole, requiredPermissions);

    if (!hasPermissions) {
      return showFallback ? <>{fallback}</> : null;
    }
  }

  // User has required access
  return <>{children}</>;
}

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/**
 * Show content only to OWNER
 */
export function OwnerOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard requiredRole={UserRole.OWNER} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Show content only to ADMIN or higher
 */
export function AdminOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard requiredRole={UserRole.ADMIN} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Show content only to DOCTOR or higher
 */
export function DoctorOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard requiredRole={UserRole.DOCTOR} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Show content to authenticated users
 */
export function AuthenticatedOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return fallback ? <>{fallback}</> : null;
  }

  if (!session) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Show content based on permission
 */
export function HasPermission({
  children,
  permission,
  fallback,
}: {
  children: React.ReactNode;
  permission: Permission;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard requiredPermission={permission} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Show content if user has ANY of the permissions
 */
export function HasAnyPermission({
  children,
  permissions,
  fallback,
}: {
  children: React.ReactNode;
  permissions: Permission[];
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard
      requiredPermissions={permissions}
      requireAll={false}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Show content if user has ALL of the permissions
 */
export function HasAllPermissions({
  children,
  permissions,
  fallback,
}: {
  children: React.ReactNode;
  permissions: Permission[];
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard
      requiredPermissions={permissions}
      requireAll={true}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

// ============================================================================
// HOOK FOR PROGRAMMATIC ACCESS
// ============================================================================

export function useRoleGuard() {
  const { data: session } = useSession();

  const userRole = session?.user?.role as UserRole | undefined;

  return {
    isOwner: userRole === UserRole.OWNER,
    isAdmin: userRole === UserRole.ADMIN || userRole === UserRole.OWNER,
    isDoctor: userRole === UserRole.DOCTOR || userRole === UserRole.ADMIN || userRole === UserRole.OWNER,
    isPatient: userRole === UserRole.CUSTOMER,
    role: userRole,
    hasRole: (requiredRole: UserRole) => {
      if (!userRole) return false;
      return accessControl.hasRoleLevel(userRole, requiredRole);
    },
    hasPermission: (permission: Permission) => {
      if (!userRole) return false;
      return accessControl.hasPermission(userRole, permission);
    },
    hasAnyPermission: (permissions: Permission[]) => {
      if (!userRole) return false;
      return accessControl.hasAnyPermission(userRole, permissions);
    },
    hasAllPermissions: (permissions: Permission[]) => {
      if (!userRole) return false;
      return accessControl.hasAllPermissions(userRole, permissions);
    },
  };
}