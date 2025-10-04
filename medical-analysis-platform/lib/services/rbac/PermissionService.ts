/**
 * Permission Service
 * Manages permissions and permission checks for employees
 */

import { prisma } from '@/lib/prisma';
import { Permission, PermissionCategory } from '@prisma/client';
import { RoleService } from './RoleService';

export interface CreatePermissionInput {
  name: string;
  code: string;
  category: PermissionCategory;
  description?: string;
  resource: string;
  action: string;
  scope?: string;
}

export interface PermissionCheckResult {
  granted: boolean;
  source: 'role' | 'custom' | 'denied';
  roleId?: string;
  roleName?: string;
}

export class PermissionService {
  /**
   * Create a new permission
   */
  static async createPermission(input: CreatePermissionInput): Promise<Permission> {
    // Validate permission code is unique
    const existing = await prisma.permission.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new Error(`Permission with code ${input.code} already exists`);
    }

    return await prisma.permission.create({
      data: {
        name: input.name,
        code: input.code,
        category: input.category,
        description: input.description,
        resource: input.resource,
        action: input.action,
        scope: input.scope,
      },
    });
  }

  /**
   * Get all permissions
   */
  static async getAllPermissions(includeInactive = false): Promise<Permission[]> {
    return await prisma.permission.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Get permissions by category
   */
  static async getPermissionsByCategory(
    category: PermissionCategory
  ): Promise<Permission[]> {
    return await prisma.permission.findMany({
      where: { category, active: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get permission by code
   */
  static async getPermissionByCode(code: string): Promise<Permission | null> {
    return await prisma.permission.findUnique({
      where: { code },
    });
  }

  /**
   * Check if employee has permission
   */
  static async checkPermission(
    employeeId: string,
    permissionCode: string
  ): Promise<PermissionCheckResult> {
    // Get employee with roles
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        customPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!employee) {
      return { granted: false, source: 'denied' };
    }

    // Check custom permissions first (explicit grants)
    const customPermission = employee.customPermissions.find(
      cp => cp.permission.code === permissionCode
    );

    if (customPermission) {
      // Check if permission is expired
      if (customPermission.expiresAt && customPermission.expiresAt < new Date()) {
        return { granted: false, source: 'denied' };
      }
      return { granted: true, source: 'custom' };
    }

    // Check role permissions
    for (const employeeRole of employee.roles) {
      // Check if role assignment is expired
      if (employeeRole.expiresAt && employeeRole.expiresAt < new Date()) {
        continue;
      }

      const hasPermission = await RoleService.hasPermission(
        employeeRole.roleId,
        permissionCode
      );

      if (hasPermission) {
        return {
          granted: true,
          source: 'role',
          roleId: employeeRole.roleId,
          roleName: employeeRole.role.name,
        };
      }
    }

    return { granted: false, source: 'denied' };
  }

  /**
   * Check multiple permissions (returns true if employee has ANY of the permissions)
   */
  static async checkAnyPermission(
    employeeId: string,
    permissionCodes: string[]
  ): Promise<boolean> {
    for (const code of permissionCodes) {
      const result = await this.checkPermission(employeeId, code);
      if (result.granted) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check multiple permissions (returns true if employee has ALL of the permissions)
   */
  static async checkAllPermissions(
    employeeId: string,
    permissionCodes: string[]
  ): Promise<boolean> {
    for (const code of permissionCodes) {
      const result = await this.checkPermission(employeeId, code);
      if (!result.granted) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all permissions for an employee (from roles and custom)
   */
  static async getEmployeePermissions(employeeId: string): Promise<string[]> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        customPermissions: {
          include: {
            permission: true,
          },
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
      },
    });

    if (!employee) {
      return [];
    }

    const permissions = new Set<string>();

    // Add custom permissions
    employee.customPermissions.forEach(cp => {
      permissions.add(cp.permission.code);
    });

    // Add role permissions
    for (const employeeRole of employee.roles) {
      // Skip expired roles
      if (employeeRole.expiresAt && employeeRole.expiresAt < new Date()) {
        continue;
      }

      const rolePermissions = await RoleService.getRolePermissions(
        employeeRole.roleId
      );
      rolePermissions.forEach(p => permissions.add(p));
    }

    return Array.from(permissions);
  }

  /**
   * Grant custom permission to employee
   */
  static async grantPermission(
    employeeId: string,
    permissionCode: string,
    grantedBy: string,
    expiresAt?: Date,
    reason?: string
  ): Promise<void> {
    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify permission exists
    const permission = await prisma.permission.findUnique({
      where: { code: permissionCode },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    // Check if permission already granted
    const existing = await prisma.employeePermission.findUnique({
      where: {
        employeeId_permissionId: {
          employeeId,
          permissionId: permission.id,
        },
      },
    });

    if (existing) {
      // Update expiration if exists
      await prisma.employeePermission.update({
        where: { id: existing.id },
        data: {
          expiresAt,
          reason,
        },
      });
    } else {
      // Create new permission grant
      await prisma.employeePermission.create({
        data: {
          employeeId,
          permissionId: permission.id,
          grantedBy,
          expiresAt,
          reason,
        },
      });
    }

    // Log the action
    await this.logAction('GRANT', employeeId, grantedBy, {
      permission: permissionCode,
      expiresAt,
      reason,
    });
  }

  /**
   * Revoke custom permission from employee
   */
  static async revokePermission(
    employeeId: string,
    permissionCode: string,
    revokedBy: string
  ): Promise<void> {
    // Get permission
    const permission = await prisma.permission.findUnique({
      where: { code: permissionCode },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    // Delete the permission grant
    await prisma.employeePermission.deleteMany({
      where: {
        employeeId,
        permissionId: permission.id,
      },
    });

    // Log the action
    await this.logAction('REVOKE', employeeId, revokedBy, {
      permission: permissionCode,
    });
  }

  /**
   * Get employees with a specific permission
   */
  static async getEmployeesWithPermission(permissionCode: string) {
    const permission = await prisma.permission.findUnique({
      where: { code: permissionCode },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    // Get employees with custom permission
    const customGrants = await prisma.employeePermission.findMany({
      where: {
        permissionId: permission.id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            department: true,
          },
        },
      },
    });

    // Get employees with permission through roles
    const roles = await prisma.role.findMany({
      where: {
        permissions: {
          has: permissionCode,
        },
        active: true,
      },
      include: {
        employees: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
                department: true,
              },
            },
          },
        },
      },
    });

    // Combine and deduplicate
    const employeeMap = new Map();

    customGrants.forEach(grant => {
      employeeMap.set(grant.employee.id, {
        ...grant.employee,
        permissionSource: 'custom',
      });
    });

    roles.forEach(role => {
      role.employees.forEach(employeeRole => {
        if (!employeeMap.has(employeeRole.employee.id)) {
          employeeMap.set(employeeRole.employee.id, {
            ...employeeRole.employee,
            permissionSource: 'role',
            roleName: role.name,
          });
        }
      });
    });

    return Array.from(employeeMap.values());
  }

  /**
   * Validate permission code format
   */
  static validatePermissionCode(code: string): boolean {
    // Format: category.action or category.resource.action
    const parts = code.split('.');
    return parts.length >= 2 && parts.length <= 3;
  }

  /**
   * Parse permission code into components
   */
  static parsePermissionCode(code: string): {
    category: string;
    resource?: string;
    action: string;
  } {
    const parts = code.split('.');
    
    if (parts.length === 2) {
      return {
        category: parts[0],
        action: parts[1],
      };
    } else if (parts.length === 3) {
      return {
        category: parts[0],
        resource: parts[1],
        action: parts[2],
      };
    }
    
    throw new Error('Invalid permission code format');
  }

  /**
   * Log audit action
   */
  private static async logAction(
    action: string,
    employeeId: string,
    performedBy: string,
    details: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          employeeId: performedBy,
          action: action as any,
          resource: 'Permission',
          resourceId: employeeId,
          details: JSON.stringify(details),
          success: true,
        },
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }
}