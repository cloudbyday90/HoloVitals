/**
 * Role Service
 * Manages roles, role hierarchy, and role-permission mappings
 */

import { prisma } from '@/lib/prisma';
import { Role, RoleType } from '@prisma/client';

export interface CreateRoleInput {
  name: string;
  code: string;
  description?: string;
  level: number;
  parentRoleId?: string;
  permissions: string[];
  type?: RoleType;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  level?: number;
  parentRoleId?: string;
  permissions?: string[];
  active?: boolean;
}

export interface RoleWithHierarchy extends Role {
  parentRole?: Role | null;
  childRoles?: Role[];
  employeeCount?: number;
}

export class RoleService {
  /**
   * Create a new role
   */
  static async createRole(input: CreateRoleInput, createdBy: string): Promise<Role> {
    // Validate role code is unique
    const existing = await prisma.role.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new Error(`Role with code ${input.code} already exists`);
    }

    // Validate parent role exists if provided
    if (input.parentRoleId) {
      const parentRole = await prisma.role.findUnique({
        where: { id: input.parentRoleId },
      });

      if (!parentRole) {
        throw new Error('Parent role not found');
      }

      // Ensure child role has higher level number than parent
      if (input.level <= parentRole.level) {
        throw new Error('Child role must have higher level number than parent');
      }
    }

    // Create the role
    const role = await prisma.role.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description,
        level: input.level,
        parentRoleId: input.parentRoleId,
        permissions: input.permissions,
        type: input.type || RoleType.STANDARD,
      },
    });

    // Log the action
    await this.logAction('CREATE', role.id, createdBy, { role });

    return role;
  }

  /**
   * Get role by ID
   */
  static async getRoleById(roleId: string): Promise<RoleWithHierarchy | null> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        parentRole: true,
        childRoles: true,
        employees: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!role) {
      return null;
    }

    return {
      ...role,
      employeeCount: role.employees.length,
    };
  }

  /**
   * Get role by code
   */
  static async getRoleByCode(code: string): Promise<Role | null> {
    return await prisma.role.findUnique({
      where: { code },
    });
  }

  /**
   * Get all roles
   */
  static async getAllRoles(includeInactive = false): Promise<RoleWithHierarchy[]> {
    const roles = await prisma.role.findMany({
      where: includeInactive ? undefined : { active: true },
      include: {
        parentRole: true,
        childRoles: true,
        employees: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' },
      ],
    });

    return roles.map(role => ({
      ...role,
      employeeCount: role.employees.length,
    }));
  }

  /**
   * Get roles by type
   */
  static async getRolesByType(type: RoleType): Promise<Role[]> {
    return await prisma.role.findMany({
      where: { type, active: true },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Get role hierarchy (tree structure)
   */
  static async getRoleHierarchy(): Promise<RoleWithHierarchy[]> {
    const allRoles = await this.getAllRoles();
    
    // Build tree structure - get root roles (no parent)
    const rootRoles = allRoles.filter(role => !role.parentRoleId);
    
    // Recursively build hierarchy
    const buildTree = (role: RoleWithHierarchy): RoleWithHierarchy => {
      const children = allRoles.filter(r => r.parentRoleId === role.id);
      return {
        ...role,
        childRoles: children.map(buildTree),
      };
    };

    return rootRoles.map(buildTree);
  }

  /**
   * Update role
   */
  static async updateRole(
    roleId: string,
    input: UpdateRoleInput,
    updatedBy: string
  ): Promise<Role> {
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      throw new Error('Role not found');
    }

    // Prevent modification of system roles
    if (existingRole.type === RoleType.SYSTEM) {
      throw new Error('Cannot modify system roles');
    }

    // Validate parent role if being updated
    if (input.parentRoleId) {
      const parentRole = await prisma.role.findUnique({
        where: { id: input.parentRoleId },
      });

      if (!parentRole) {
        throw new Error('Parent role not found');
      }

      // Prevent circular references
      if (input.parentRoleId === roleId) {
        throw new Error('Role cannot be its own parent');
      }

      // Ensure child role has higher level number than parent
      const newLevel = input.level || existingRole.level;
      if (newLevel <= parentRole.level) {
        throw new Error('Child role must have higher level number than parent');
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: input.name,
        description: input.description,
        level: input.level,
        parentRoleId: input.parentRoleId,
        permissions: input.permissions,
        active: input.active,
      },
    });

    // Log the action
    await this.logAction('UPDATE', roleId, updatedBy, {
      before: existingRole,
      after: updatedRole,
    });

    return updatedRole;
  }

  /**
   * Delete role (soft delete by setting active = false)
   */
  static async deleteRole(roleId: string, deletedBy: string): Promise<void> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        employees: true,
        childRoles: true,
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Prevent deletion of system roles
    if (role.type === RoleType.SYSTEM) {
      throw new Error('Cannot delete system roles');
    }

    // Check if role has employees
    if (role.employees.length > 0) {
      throw new Error(
        `Cannot delete role with ${role.employees.length} assigned employees. ` +
        'Please reassign employees first.'
      );
    }

    // Check if role has child roles
    if (role.childRoles.length > 0) {
      throw new Error(
        `Cannot delete role with ${role.childRoles.length} child roles. ` +
        'Please reassign or delete child roles first.'
      );
    }

    // Soft delete
    await prisma.role.update({
      where: { id: roleId },
      data: { active: false },
    });

    // Log the action
    await this.logAction('DELETE', roleId, deletedBy, { role });
  }

  /**
   * Add permission to role
   */
  static async addPermission(
    roleId: string,
    permission: string,
    addedBy: string
  ): Promise<Role> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Check if permission already exists
    if (role.permissions.includes(permission)) {
      throw new Error('Permission already exists on this role');
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: [...role.permissions, permission],
      },
    });

    // Log the action
    await this.logAction('GRANT', roleId, addedBy, {
      permission,
      role: updatedRole,
    });

    return updatedRole;
  }

  /**
   * Remove permission from role
   */
  static async removePermission(
    roleId: string,
    permission: string,
    removedBy: string
  ): Promise<Role> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Check if permission exists
    if (!role.permissions.includes(permission)) {
      throw new Error('Permission does not exist on this role');
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: role.permissions.filter(p => p !== permission),
      },
    });

    // Log the action
    await this.logAction('REVOKE', roleId, removedBy, {
      permission,
      role: updatedRole,
    });

    return updatedRole;
  }

  /**
   * Get all permissions for a role (including inherited from parent roles)
   */
  static async getRolePermissions(roleId: string): Promise<string[]> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        parentRole: true,
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const permissions = new Set<string>(role.permissions);

    // Recursively get parent permissions
    let currentRole = role;
    while (currentRole.parentRole) {
      currentRole.parentRole.permissions.forEach(p => permissions.add(p));
      
      // Get next parent
      const parent = await prisma.role.findUnique({
        where: { id: currentRole.parentRole!.id },
        include: { parentRole: true },
      });
      
      if (!parent) break;
      currentRole = parent;
    }

    return Array.from(permissions);
  }

  /**
   * Check if role has permission (including inherited)
   */
  static async hasPermission(roleId: string, permission: string): Promise<boolean> {
    const permissions = await this.getRolePermissions(roleId);
    
    // Check for wildcard permission
    if (permissions.includes('*')) {
      return true;
    }

    // Check for exact match
    if (permissions.includes(permission)) {
      return true;
    }

    // Check for wildcard patterns (e.g., "clinical.*" matches "clinical.read")
    const wildcardPermissions = permissions.filter(p => p.endsWith('.*'));
    for (const wildcardPerm of wildcardPermissions) {
      const prefix = wildcardPerm.slice(0, -2); // Remove ".*"
      if (permission.startsWith(prefix + '.')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get employees with a specific role
   */
  static async getEmployeesWithRole(roleId: string) {
    return await prisma.employeeRole.findMany({
      where: { roleId },
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
  }

  /**
   * Log audit action
   */
  private static async logAction(
    action: string,
    roleId: string,
    performedBy: string,
    details: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          employeeId: performedBy,
          action: action as any,
          resource: 'Role',
          resourceId: roleId,
          details: JSON.stringify(details),
          success: true,
        },
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
      // Don't throw - logging failure shouldn't break the operation
    }
  }
}