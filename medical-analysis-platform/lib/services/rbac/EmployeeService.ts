/**
 * Employee Service
 * Manages employee records, roles, and lifecycle
 */

import { prisma } from '@/lib/prisma';
import { Employee, EmploymentStatus, OnboardingStatus } from '@prisma/client';
import { RoleService } from './RoleService';
import { PermissionService } from './PermissionService';

export interface CreateEmployeeInput {
  // User account
  userId?: string; // If user already exists
  email: string;
  
  // Basic information
  employeeId: string; // Company employee ID
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  
  // Employment details
  departmentId: string;
  jobTitle: string;
  hireDate: Date;
  managerId?: string;
  
  // Contact information
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
    email?: string;
  };
  
  // Professional information
  licenseNumber?: string;
  licenseState?: string;
  licenseExpiresAt?: Date;
  certifications?: Array<{
    name: string;
    issuer: string;
    issuedDate: Date;
    expiresAt?: Date;
  }>;
  
  // Initial role assignment
  roleIds?: string[];
  
  // Notes
  notes?: string;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  departmentId?: string;
  jobTitle?: string;
  managerId?: string;
  employmentStatus?: EmploymentStatus;
  terminationDate?: Date;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  emergencyContact?: any;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpiresAt?: Date;
  certifications?: any;
  notes?: string;
}

export interface EmployeeSearchFilters {
  departmentId?: string;
  employmentStatus?: EmploymentStatus;
  onboardingStatus?: OnboardingStatus;
  roleId?: string;
  managerId?: string;
  searchTerm?: string; // Search in name, email, employeeId
}

export class EmployeeService {
  /**
   * Create a new employee
   */
  static async createEmployee(
    input: CreateEmployeeInput,
    createdBy: string
  ): Promise<Employee> {
    // Validate employee ID is unique
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId: input.employeeId },
    });

    if (existingEmployee) {
      throw new Error(`Employee ID ${input.employeeId} already exists`);
    }

    // Validate email is unique
    const existingEmail = await prisma.employee.findUnique({
      where: { email: input.email },
    });

    if (existingEmail) {
      throw new Error(`Email ${input.email} already in use`);
    }

    // Validate department exists
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
    });

    if (!department) {
      throw new Error('Department not found');
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

    // Create or link user account
    let userId = input.userId;
    if (!userId) {
      // Create a new user account for the employee
      const user = await prisma.user.create({
        data: {
          email: input.email,
          name: `${input.firstName} ${input.lastName}`,
          role: 'EMPLOYEE', // Default role for employees
        },
      });
      userId = user.id;
    }

    // Create employee record
    const employee = await prisma.employee.create({
      data: {
        userId,
        employeeId: input.employeeId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth,
        departmentId: input.departmentId,
        jobTitle: input.jobTitle,
        hireDate: input.hireDate,
        managerId: input.managerId,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        country: input.country || 'USA',
        emergencyContact: input.emergencyContact as any,
        licenseNumber: input.licenseNumber,
        licenseState: input.licenseState,
        licenseExpiresAt: input.licenseExpiresAt,
        certifications: input.certifications as any,
        notes: input.notes,
        createdBy,
        employmentStatus: EmploymentStatus.ACTIVE,
        onboardingStatus: OnboardingStatus.INVITED,
      },
    });

    // Assign initial roles if provided
    if (input.roleIds && input.roleIds.length > 0) {
      for (const roleId of input.roleIds) {
        await this.assignRole(employee.id, roleId, createdBy);
      }
    }

    // Log the action
    await this.logAction('CREATE', employee.id, createdBy, { employee });

    return employee;
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(employeeId: string) {
    return await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
          },
        },
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
        onboarding: true,
        managedEmployees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
          },
        },
      },
    });
  }

  /**
   * Get employee by employee ID (company ID)
   */
  static async getEmployeeByEmployeeId(employeeId: string) {
    return await prisma.employee.findUnique({
      where: { employeeId },
      include: {
        user: true,
        department: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get employee by email
   */
  static async getEmployeeByEmail(email: string) {
    return await prisma.employee.findUnique({
      where: { email },
      include: {
        user: true,
        department: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get employee by user ID
   */
  static async getEmployeeByUserId(userId: string) {
    return await prisma.employee.findUnique({
      where: { userId },
      include: {
        department: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Search employees
   */
  static async searchEmployees(
    filters: EmployeeSearchFilters,
    page = 1,
    pageSize = 50
  ) {
    const where: any = {};

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.employmentStatus) {
      where.employmentStatus = filters.employmentStatus;
    }

    if (filters.onboardingStatus) {
      where.onboardingStatus = filters.onboardingStatus;
    }

    if (filters.managerId) {
      where.managerId = filters.managerId;
    }

    if (filters.roleId) {
      where.roles = {
        some: {
          roleId: filters.roleId,
        },
      };
    }

    if (filters.searchTerm) {
      where.OR = [
        { firstName: { contains: filters.searchTerm, mode: 'insensitive' } },
        { lastName: { contains: filters.searchTerm, mode: 'insensitive' } },
        { email: { contains: filters.searchTerm, mode: 'insensitive' } },
        { employeeId: { contains: filters.searchTerm, mode: 'insensitive' } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          department: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' },
        ],
      }),
      prisma.employee.count({ where }),
    ]);

    return {
      employees,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Update employee
   */
  static async updateEmployee(
    employeeId: string,
    input: UpdateEmployeeInput,
    updatedBy: string
  ): Promise<Employee> {
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!existingEmployee) {
      throw new Error('Employee not found');
    }

    // Validate department if being updated
    if (input.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: input.departmentId },
      });

      if (!department) {
        throw new Error('Department not found');
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

      // Prevent circular manager relationships
      if (input.managerId === employeeId) {
        throw new Error('Employee cannot be their own manager');
      }
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...input,
        lastModifiedBy: updatedBy,
      },
    });

    // Log the action
    await this.logAction('UPDATE', employeeId, updatedBy, {
      before: existingEmployee,
      after: updatedEmployee,
    });

    return updatedEmployee;
  }

  /**
   * Terminate employee
   */
  static async terminateEmployee(
    employeeId: string,
    terminationDate: Date,
    terminatedBy: string,
    reason?: string
  ): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        employmentStatus: EmploymentStatus.TERMINATED,
        terminationDate,
        notes: reason
          ? `${employee.notes || ''}\n\nTermination Reason: ${reason}`
          : employee.notes,
        lastModifiedBy: terminatedBy,
      },
    });

    // Log the action
    await this.logAction('UPDATE', employeeId, terminatedBy, {
      action: 'terminate',
      terminationDate,
      reason,
    });
  }

  /**
   * Assign role to employee
   */
  static async assignRole(
    employeeId: string,
    roleId: string,
    assignedBy: string,
    isPrimary = false,
    expiresAt?: Date
  ): Promise<void> {
    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Check if role already assigned
    const existing = await prisma.employeeRole.findUnique({
      where: {
        employeeId_roleId: {
          employeeId,
          roleId,
        },
      },
    });

    if (existing) {
      // Update existing assignment
      await prisma.employeeRole.update({
        where: { id: existing.id },
        data: {
          isPrimary,
          expiresAt,
        },
      });
    } else {
      // Create new role assignment
      await prisma.employeeRole.create({
        data: {
          employeeId,
          roleId,
          assignedBy,
          isPrimary,
          expiresAt,
        },
      });
    }

    // If this is primary role, unset other primary roles
    if (isPrimary) {
      await prisma.employeeRole.updateMany({
        where: {
          employeeId,
          roleId: { not: roleId },
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Log the action
    await this.logAction('ASSIGN', employeeId, assignedBy, {
      roleId,
      roleName: role.name,
      isPrimary,
      expiresAt,
    });
  }

  /**
   * Remove role from employee
   */
  static async removeRole(
    employeeId: string,
    roleId: string,
    removedBy: string
  ): Promise<void> {
    await prisma.employeeRole.deleteMany({
      where: {
        employeeId,
        roleId,
      },
    });

    // Log the action
    await this.logAction('UNASSIGN', employeeId, removedBy, {
      roleId,
    });
  }

  /**
   * Get employee directory
   */
  static async getEmployeeDirectory(departmentId?: string) {
    const where: any = {
      employmentStatus: EmploymentStatus.ACTIVE,
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    return await prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        jobTitle: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });
  }

  /**
   * Get employees by department
   */
  static async getEmployeesByDepartment(departmentId: string) {
    return await prisma.employee.findMany({
      where: {
        departmentId,
        employmentStatus: EmploymentStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });
  }

  /**
   * Get employees by manager
   */
  static async getEmployeesByManager(managerId: string) {
    return await prisma.employee.findMany({
      where: {
        managerId,
        employmentStatus: EmploymentStatus.ACTIVE,
      },
      include: {
        department: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });
  }

  /**
   * Get employee statistics
   */
  static async getEmployeeStatistics() {
    const [
      totalEmployees,
      activeEmployees,
      onboardingEmployees,
      terminatedEmployees,
      byDepartment,
      byStatus,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({
        where: { employmentStatus: EmploymentStatus.ACTIVE },
      }),
      prisma.employee.count({
        where: {
          onboardingStatus: {
            not: OnboardingStatus.ACTIVE,
          },
        },
      }),
      prisma.employee.count({
        where: { employmentStatus: EmploymentStatus.TERMINATED },
      }),
      prisma.employee.groupBy({
        by: ['departmentId'],
        _count: true,
      }),
      prisma.employee.groupBy({
        by: ['employmentStatus'],
        _count: true,
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      onboardingEmployees,
      terminatedEmployees,
      byDepartment,
      byStatus,
    };
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
          resource: 'Employee',
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