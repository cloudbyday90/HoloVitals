import { NextRequest, NextResponse } from 'next/server';
import { UserRole, hasRole } from '@/lib/types/roles';

export interface RoleCheckOptions {
  requiredRole: UserRole;
  redirectTo?: string;
}

export async function checkRole(
  request: NextRequest,
  options: RoleCheckOptions
): Promise<{ authorized: boolean; user?: any; response?: NextResponse }> {
  // TODO: Get user from session (NextAuth)
  // For now, we'll use a mock user
  const mockUser = {
    id: '1',
    email: 'admin@holovitals.com',
    name: 'Admin User',
    role: UserRole.ADMIN, // Change this to test different roles
  };

  const authorized = hasRole(mockUser.role, options.requiredRole);

  if (!authorized) {
    const redirectUrl = options.redirectTo || '/dashboard';
    return {
      authorized: false,
      response: NextResponse.redirect(new URL(redirectUrl, request.url)),
    };
  }

  return {
    authorized: true,
    user: mockUser,
  };
}

export function requireRole(requiredRole: UserRole) {
  return async (request: NextRequest) => {
    return checkRole(request, { requiredRole });
  };
}