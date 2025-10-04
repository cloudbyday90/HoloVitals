/**
 * RBAC Seed Data Script
 * Creates sample departments, roles, permissions, and employees for development/testing
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting RBAC seed data...\n');

  // ============================================================================
  // 1. CREATE DEPARTMENTS
  // ============================================================================
  console.log('📁 Creating departments...');

  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: 'CLIN' },
      update: {},
      create: {
        name: 'Clinical Operations',
        code: 'CLIN',
        description: 'Clinical staff and healthcare providers',
        type: 'CLINICAL',
        costCenter: 'CC-1000',
        budget: 5000000,
      },
    }),
    prisma.department.upsert({
      where: { code: 'IT' },
      update: {},
      create: {
        name: 'Information Technology',
        code: 'IT',
        description: 'IT infrastructure and development',
        type: 'IT',
        costCenter: 'CC-2000',
        budget: 2000000,
      },
    }),
    prisma.department.upsert({
      where: { code: 'HR' },
      update: {},
      create: {
        name: 'Human Resources',
        code: 'HR',
        description: 'Employee management and recruitment',
        type: 'HR',
        costCenter: 'CC-3000',
        budget: 1000000,
      },
    }),
    prisma.department.upsert({
      where: { code: 'COMP' },
      update: {},
      create: {
        name: 'Compliance',
        code: 'COMP',
        description: 'HIPAA and regulatory compliance',
        type: 'COMPLIANCE',
        costCenter: 'CC-4000',
        budget: 800000,
      },
    }),
    prisma.department.upsert({
      where: { code: 'FIN' },
      update: {},
      create: {
        name: 'Finance',
        code: 'FIN',
        description: 'Financial operations and billing',
        type: 'FINANCE',
        costCenter: 'CC-5000',
        budget: 1500000,
      },
    }),
    prisma.department.upsert({
      where: { code: 'SUP' },
      update: {},
      create: {
        name: 'Customer Support',
        code: 'SUP',
        description: 'Customer service and support',
        type: 'SUPPORT',
        costCenter: 'CC-6000',
        budget: 750000,
      },
    }),
  ]);

  console.log(`✅ Created ${departments.length} departments\n`);

  // ============================================================================
  // 2. CREATE PERMISSIONS
  // ============================================================================
  console.log('🔐 Creating permissions...');

  const permissions = await Promise.all([
    // System permissions
    prisma.permission.upsert({
      where: { code: 'system.admin.full' },
      update: {},
      create: {
        name: 'Full System Access',
        code: 'system.admin.full',
        category: 'SYSTEM',
        description: 'Complete system administration access',
        resource: 'System',
        action: 'admin',
        scope: 'all',
      },
    }),
    
    // Employee management permissions
    prisma.permission.upsert({
      where: { code: 'employees.read' },
      update: {},
      create: {
        name: 'View Employees',
        code: 'employees.read',
        category: 'EMPLOYEE_MANAGEMENT',
        description: 'View employee information',
        resource: 'Employee',
        action: 'read',
        scope: 'all',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'employees.create' },
      update: {},
      create: {
        name: 'Create Employees',
        code: 'employees.create',
        category: 'EMPLOYEE_MANAGEMENT',
        description: 'Create new employees',
        resource: 'Employee',
        action: 'create',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'employees.update' },
      update: {},
      create: {
        name: 'Update Employees',
        code: 'employees.update',
        category: 'EMPLOYEE_MANAGEMENT',
        description: 'Update employee information',
        resource: 'Employee',
        action: 'update',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'employees.delete' },
      update: {},
      create: {
        name: 'Delete Employees',
        code: 'employees.delete',
        category: 'EMPLOYEE_MANAGEMENT',
        description: 'Delete employees',
        resource: 'Employee',
        action: 'delete',
      },
    }),

    // Clinical data permissions
    prisma.permission.upsert({
      where: { code: 'clinical.read.all' },
      update: {},
      create: {
        name: 'View All Clinical Data',
        code: 'clinical.read.all',
        category: 'CLINICAL_DATA',
        description: 'View all patient clinical data',
        resource: 'ClinicalData',
        action: 'read',
        scope: 'all',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'clinical.write' },
      update: {},
      create: {
        name: 'Write Clinical Data',
        code: 'clinical.write',
        category: 'CLINICAL_DATA',
        description: 'Create and modify clinical data',
        resource: 'ClinicalData',
        action: 'write',
      },
    }),

    // HIPAA permissions
    prisma.permission.upsert({
      where: { code: 'hipaa.incidents.read' },
      update: {},
      create: {
        name: 'View HIPAA Incidents',
        code: 'hipaa.incidents.read',
        category: 'HIPAA_COMPLIANCE',
        description: 'View HIPAA compliance incidents',
        resource: 'HIPAAIncident',
        action: 'read',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'hipaa.incidents.write' },
      update: {},
      create: {
        name: 'Manage HIPAA Incidents',
        code: 'hipaa.incidents.write',
        category: 'HIPAA_COMPLIANCE',
        description: 'Create and manage HIPAA incidents',
        resource: 'HIPAAIncident',
        action: 'write',
      },
    }),
  ]);

  console.log(`✅ Created ${permissions.length} permissions\n`);

  // ============================================================================
  // 3. CREATE ROLES
  // ============================================================================
  console.log('👥 Creating roles...');

  const roles = await Promise.all([
    // Super Admin
    prisma.role.upsert({
      where: { code: 'SUPER_ADMIN' },
      update: {},
      create: {
        name: 'Super Administrator',
        code: 'SUPER_ADMIN',
        description: 'Full system access with all permissions',
        level: 1,
        permissions: ['*'], // Wildcard - all permissions
        type: 'SYSTEM',
      },
    }),

    // Admin
    prisma.role.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: {
        name: 'Administrator',
        code: 'ADMIN',
        description: 'Platform administrator with broad access',
        level: 2,
        permissions: [
          'system.admin.full',
          'employees.read',
          'employees.create',
          'employees.update',
        ],
        type: 'SYSTEM',
      },
    }),

    // HR Manager
    prisma.role.upsert({
      where: { code: 'HR_MANAGER' },
      update: {},
      create: {
        name: 'HR Manager',
        code: 'HR_MANAGER',
        description: 'Human resources management',
        level: 3,
        permissions: [
          'employees.read',
          'employees.create',
          'employees.update',
        ],
        type: 'STANDARD',
      },
    }),

    // Compliance Officer
    prisma.role.upsert({
      where: { code: 'COMPLIANCE_OFFICER' },
      update: {},
      create: {
        name: 'Compliance Officer',
        code: 'COMPLIANCE_OFFICER',
        description: 'HIPAA compliance oversight',
        level: 3,
        permissions: [
          'hipaa.incidents.read',
          'hipaa.incidents.write',
          'employees.read',
        ],
        type: 'STANDARD',
      },
    }),

    // Privacy Officer
    prisma.role.upsert({
      where: { code: 'PRIVACY_OFFICER' },
      update: {},
      create: {
        name: 'Privacy Officer',
        code: 'PRIVACY_OFFICER',
        description: 'Patient privacy management',
        level: 3,
        permissions: [
          'hipaa.incidents.read',
          'hipaa.incidents.write',
          'clinical.read.all',
        ],
        type: 'STANDARD',
      },
    }),

    // Security Officer
    prisma.role.upsert({
      where: { code: 'SECURITY_OFFICER' },
      update: {},
      create: {
        name: 'Security Officer',
        code: 'SECURITY_OFFICER',
        description: 'Information security management',
        level: 3,
        permissions: [
          'hipaa.incidents.read',
          'hipaa.incidents.write',
        ],
        type: 'STANDARD',
      },
    }),

    // Physician
    prisma.role.upsert({
      where: { code: 'PHYSICIAN' },
      update: {},
      create: {
        name: 'Physician',
        code: 'PHYSICIAN',
        description: 'Medical doctor with full clinical access',
        level: 4,
        permissions: [
          'clinical.read.all',
          'clinical.write',
        ],
        type: 'STANDARD',
      },
    }),

    // Nurse
    prisma.role.upsert({
      where: { code: 'REGISTERED_NURSE' },
      update: {},
      create: {
        name: 'Registered Nurse',
        code: 'REGISTERED_NURSE',
        description: 'Registered nurse with clinical access',
        level: 5,
        permissions: [
          'clinical.read.all',
          'clinical.write',
        ],
        type: 'STANDARD',
      },
    }),

    // IT Manager
    prisma.role.upsert({
      where: { code: 'IT_MANAGER' },
      update: {},
      create: {
        name: 'IT Manager',
        code: 'IT_MANAGER',
        description: 'IT infrastructure management',
        level: 3,
        permissions: [
          'system.admin.full',
          'employees.read',
        ],
        type: 'STANDARD',
      },
    }),

    // Support Agent
    prisma.role.upsert({
      where: { code: 'SUPPORT_AGENT' },
      update: {},
      create: {
        name: 'Support Agent',
        code: 'SUPPORT_AGENT',
        description: 'Customer support representative',
        level: 6,
        permissions: [
          'employees.read',
        ],
        type: 'STANDARD',
      },
    }),
  ]);

  console.log(`✅ Created ${roles.length} roles\n`);

  // ============================================================================
  // 4. CREATE SAMPLE USERS & EMPLOYEES
  // ============================================================================
  console.log('👤 Creating sample employees...');

  // Helper function to create employee with user
  async function createEmployee(data: {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    departmentCode: string;
    jobTitle: string;
    roleCodes: string[];
  }) {
    // Create user account
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
        role: 'EMPLOYEE',
      },
    });

    // Get department
    const department = departments.find(d => d.code === data.departmentCode);
    if (!department) throw new Error(`Department ${data.departmentCode} not found`);

    // Create employee
    const employee = await prisma.employee.upsert({
      where: { employeeId: data.employeeId },
      update: {},
      create: {
        userId: user.id,
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        departmentId: department.id,
        jobTitle: data.jobTitle,
        hireDate: new Date('2024-01-01'),
        employmentStatus: 'ACTIVE',
        onboardingStatus: 'ACTIVE',
        createdBy: 'system',
      },
    });

    // Assign roles
    for (const roleCode of data.roleCodes) {
      const role = roles.find(r => r.code === roleCode);
      if (!role) {
        console.warn(`⚠️  Role ${roleCode} not found, skipping...`);
        continue;
      }

      await prisma.employeeRole.upsert({
        where: {
          employeeId_roleId: {
            employeeId: employee.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          employeeId: employee.id,
          roleId: role.id,
          assignedBy: 'system',
          isPrimary: data.roleCodes[0] === roleCode,
        },
      });
    }

    return employee;
  }

  // Create sample employees
  const employees = await Promise.all([
    // Super Admin
    createEmployee({
      employeeId: 'EMP-0001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@holovitals.com',
      departmentCode: 'IT',
      jobTitle: 'System Administrator',
      roleCodes: ['SUPER_ADMIN'],
    }),

    // HR Manager
    createEmployee({
      employeeId: 'EMP-1001',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@holovitals.com',
      departmentCode: 'HR',
      jobTitle: 'HR Manager',
      roleCodes: ['HR_MANAGER'],
    }),

    // HIPAA Officers
    createEmployee({
      employeeId: 'EMP-2001',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@holovitals.com',
      departmentCode: 'COMP',
      jobTitle: 'Compliance Officer',
      roleCodes: ['COMPLIANCE_OFFICER'],
    }),
    createEmployee({
      employeeId: 'EMP-2002',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.rodriguez@holovitals.com',
      departmentCode: 'COMP',
      jobTitle: 'Privacy Officer',
      roleCodes: ['PRIVACY_OFFICER'],
    }),
    createEmployee({
      employeeId: 'EMP-2003',
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@holovitals.com',
      departmentCode: 'COMP',
      jobTitle: 'Security Officer',
      roleCodes: ['SECURITY_OFFICER'],
    }),

    // Clinical Staff
    createEmployee({
      employeeId: 'EMP-3001',
      firstName: 'Dr. James',
      lastName: 'Wilson',
      email: 'james.wilson@holovitals.com',
      departmentCode: 'CLIN',
      jobTitle: 'Chief Medical Officer',
      roleCodes: ['PHYSICIAN'],
    }),
    createEmployee({
      employeeId: 'EMP-3002',
      firstName: 'Dr. Lisa',
      lastName: 'Martinez',
      email: 'lisa.martinez@holovitals.com',
      departmentCode: 'CLIN',
      jobTitle: 'Physician',
      roleCodes: ['PHYSICIAN'],
    }),
    createEmployee({
      employeeId: 'EMP-3003',
      firstName: 'Jennifer',
      lastName: 'Brown',
      email: 'jennifer.brown@holovitals.com',
      departmentCode: 'CLIN',
      jobTitle: 'Registered Nurse',
      roleCodes: ['REGISTERED_NURSE'],
    }),

    // IT Staff
    createEmployee({
      employeeId: 'EMP-4001',
      firstName: 'Robert',
      lastName: 'Taylor',
      email: 'robert.taylor@holovitals.com',
      departmentCode: 'IT',
      jobTitle: 'IT Manager',
      roleCodes: ['IT_MANAGER'],
    }),

    // Support Staff
    createEmployee({
      employeeId: 'EMP-5001',
      firstName: 'Amanda',
      lastName: 'White',
      email: 'amanda.white@holovitals.com',
      departmentCode: 'SUP',
      jobTitle: 'Support Agent',
      roleCodes: ['SUPPORT_AGENT'],
    }),
  ]);

  console.log(`✅ Created ${employees.length} employees\n`);

  // ============================================================================
  // 5. SUMMARY
  // ============================================================================
  console.log('📊 Seed Data Summary:');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Departments: ${departments.length}`);
  console.log(`✅ Permissions: ${permissions.length}`);
  console.log(`✅ Roles: ${roles.length}`);
  console.log(`✅ Employees: ${employees.length}`);
  console.log('═══════════════════════════════════════\n');

  console.log('🎉 Seed data completed successfully!\n');
  console.log('📝 Sample Login Credentials:');
  console.log('───────────────────────────────────────');
  console.log('Super Admin:');
  console.log('  Email: admin@holovitals.com');
  console.log('  Role: SUPER_ADMIN\n');
  console.log('HR Manager:');
  console.log('  Email: sarah.johnson@holovitals.com');
  console.log('  Role: HR_MANAGER\n');
  console.log('Compliance Officer:');
  console.log('  Email: michael.chen@holovitals.com');
  console.log('  Role: COMPLIANCE_OFFICER\n');
  console.log('───────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });