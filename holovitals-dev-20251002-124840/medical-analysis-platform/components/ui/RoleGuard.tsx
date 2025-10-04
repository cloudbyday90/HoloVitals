'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * OwnerOnly Component
 * Only renders children if the user has the 'owner' role
 */
export function OwnerOnly({ children, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession();
  
  // Check if user has owner role
  const isOwner = session?.user?.role === 'owner';
  
  if (!isOwner) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * AdminOnly Component
 * Only renders children if the user has 'admin' or 'owner' role
 */
export function AdminOnly({ children, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession();
  
  // Check if user has admin or owner role
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'owner';
  
  if (!isAdmin) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * UserOnly Component
 * Only renders children if the user is authenticated (any role)
 */
export function UserOnly({ children, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession();
  
  if (!session) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * GuestOnly Component
 * Only renders children if the user is NOT authenticated
 */
export function GuestOnly({ children, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession();
  
  if (session) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * RoleGuard Component
 * Generic role guard that accepts an array of allowed roles
 */
interface GenericRoleGuardProps extends RoleGuardProps {
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles, fallback = null }: GenericRoleGuardProps) {
  const { data: session } = useSession();
  
  // Check if user's role is in the allowed roles
  const hasAccess = session?.user?.role && allowedRoles.includes(session.user.role);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Hook to check user role
 */
export function useUserRole() {
  const { data: session } = useSession();
  
  return {
    role: session?.user?.role || null,
    isOwner: session?.user?.role === 'owner',
    isAdmin: session?.user?.role === 'admin' || session?.user?.role === 'owner',
    isUser: !!session,
    isGuest: !session,
  };
}