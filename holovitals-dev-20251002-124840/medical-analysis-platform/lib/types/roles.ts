export enum UserRole {
  USER = 'USER',
  DEVELOPER = 'DEVELOPER',
  ADMIN = 'ADMIN',
}

export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const roleHierarchy = {
  [UserRole.USER]: 0,
  [UserRole.DEVELOPER]: 1,
  [UserRole.ADMIN]: 2,
};

export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const canAccessAdminConsole = (role: UserRole): boolean => {
  return role === UserRole.ADMIN;
};

export const canAccessDevConsole = (role: UserRole): boolean => {
  return role === UserRole.ADMIN || role === UserRole.DEVELOPER;
};