/**
 * Department Service
 * Manages organizational departments
 */

import { prisma } from '@/lib/prisma';
import { Department, DepartmentType } from '@prisma/client';

export interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
  type: DepartmentType;
  managerId?: string;
  costCenter?: string;
  budget?: number;
}

export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  description?: string;
  type?: DepartmentType;
  managerId?: string;
  costCenter?: string;
  budget?: number;
  active?: boolean;
}

export class DepartmentService {
  /**
   * Create a new department
   */
  static async createDepartment(
    input: CreateDepartmentInput,
    createdBy: string
  ): Promise<Department> {
    // Validate department code is unique
    const existingCode = await prisma.department.findUnique({
      where: { code: input.code },
    });

    if (existingCode) {
      throw new Error(`Department code ${input.code} already exists`);
    }

    // Validate department name is unique
    const existingName = await prisma.department.findUnique({
      where: { name: input.name },
    });

    if (existingName) {
      throw new Error(`Department name ${input.name} already exists`);
    }

    // Validate manager exists if provided
    if (input.managerId) {
      const manager = await prisma.employee.findUnique({
        where: { id: input.managerId },
      });

      if (!manager) {
        throw new Error('Manager not found');
      }
    }

    return await prisma.department.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description,
        type: input.type,
        managerId: input.managerId,
        costCenter: input.costCenter,
        budget: input.budget,
      },
    });
  }

  /**
   * Get department by ID
   */
  static async getDepartmentById(departmentId: string) {
    return await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            employmentStatus: true,
          },
        },
      },
    });
  }

  /**
   * Get department by code
   */
  static async getDepartmentByCode(code: string) {
    return await prisma.department.findUnique({
      where: { code },
      include: {
        employees: true,
      },
    });
  }

  /**
   * Get all departments
   */
  static async getAllDepartments(includeInactive = false) {
    return await prisma.department.findMany({
      where: includeInactive ? undefined : { active: true },
      include: {
        employees: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get departments by type
   */
  static async getDepartmentsByType(type: DepartmentType) {
    return await prisma.department.findMany({
      where: { type, active: true },
      include: {
        employees: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Update department
   */
  static async updateDepartment(
    departmentId: string,
    input: UpdateDepartmentInput,
    updatedBy: string
  ): Promise<Department> {
    const existing = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!existing) {
      throw new Error('Department not found');
    }

    // Validate code uniqueness if being updated
    if (input.code && input.code !== existing.code) {
      const existingCode = await prisma.department.findUnique({
        where: { code: input.code },
      });

      if (existingCode) {
        throw new Error(`Department code ${input.code} already exists`);
      }
    }

    // Validate name uniqueness if being updated
    if (input.name && input.name !== existing.name) {
      const existingName = await prisma.department.findUnique({
        where: { name: input.name },
      });

      if (existingName) {
        throw new Error(`Department name ${input.name} already exists`);
      }
    }

    // Validate manager if being updated
    if (input.managerId) {
      const manager = await prisma.employee.findUnique({
        where: { id: input.managerId },
      });

      if (!manager) {
        throw new Error('Manager not found');
      }
    }

    return await prisma.department.update({
      where: { id: departmentId },
      data: input,
    });
  }

  /**
   * Delete department (soft delete)
   */
  static async deleteDepartment(
    departmentId: string,
    deletedBy: string
  ): Promise<void> {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        employees: true,
      },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    // Check if department has employees
    if (department.employees.length > 0) {
      throw new Error(
        `Cannot delete department with ${department.employees.length} employees. ` +
        'Please reassign employees first.'
      );
    }

    // Soft delete
    await prisma.department.update({
      where: { id: departmentId },
      data: { active: false },
    });
  }

  /**
   * Get department statistics
   */
  static async getDepartmentStatistics(departmentId: string) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        employees: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    const totalEmployees = department.employees.length;
    const activeEmployees = department.employees.filter(
      e => e.employmentStatus === 'ACTIVE'
    ).length;

    // Count by role
    const roleDistribution: Record<string, number> = {};
    department.employees.forEach(employee => {
      employee.roles.forEach(employeeRole => {
        const roleName = employeeRole.role.name;
        roleDistribution[roleName] = (roleDistribution[roleName] || 0) + 1;
      });
    });

    return {
      departmentId: department.id,
      departmentName: department.name,
      totalEmployees,
      activeEmployees,
      roleDistribution,
      budget: department.budget,
      costCenter: department.costCenter,
    };
  }

  /**
   * Get all department statistics
   */
  static async getAllDepartmentStatistics() {
    const departments = await prisma.department.findMany({
      where: { active: true },
      include: {
        employees: {
          select: {
            id: true,
            employmentStatus: true,
          },
        },
      },
    });

    return departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      type: dept.type,
      totalEmployees: dept.employees.length,
      activeEmployees: dept.employees.filter(e => e.employmentStatus === 'ACTIVE').length,
      budget: dept.budget,
      costCenter: dept.costCenter,
    }));
  }
}