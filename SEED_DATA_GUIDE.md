# RBAC Seed Data Guide

## Overview

This guide explains the seed data created for the Employee Onboarding & RBAC system. The seed data provides a complete set of sample departments, roles, permissions, and employees for development and testing.

---

## Running the Seed Script

### Prerequisites
- PostgreSQL database running
- Prisma schema migrated
- Environment variables configured

### Execute Seed Script

```bash
cd medical-analysis-platform
npm run seed:rbac
```

Or manually:
```bash
ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-rbac.ts
```

---

## Seed Data Contents

### 1. Departments (6 Total)

| Code | Name | Type | Budget | Cost Center |
|------|------|------|--------|-------------|
| CLIN | Clinical Operations | CLINICAL | $5,000,000 | CC-1000 |
| IT | Information Technology | IT | $2,000,000 | CC-2000 |
| HR | Human Resources | HR | $1,000,000 | CC-3000 |
| COMP | Compliance | COMPLIANCE | $800,000 | CC-4000 |
| FIN | Finance | FINANCE | $1,500,000 | CC-5000 |
| SUP | Customer Support | SUPPORT | $750,000 | CC-6000 |

---

### 2. Permissions (10 Total)

#### System Permissions
- `system.admin.full` - Full system administration access

#### Employee Management
- `employees.read` - View employee information
- `employees.create` - Create new employees
- `employees.update` - Update employee information
- `employees.delete` - Delete employees

#### Clinical Data
- `clinical.read.all` - View all patient clinical data
- `clinical.write` - Create and modify clinical data

#### HIPAA Compliance
- `hipaa.incidents.read` - View HIPAA compliance incidents
- `hipaa.incidents.write` - Create and manage HIPAA incidents

---

### 3. Roles (10 Total)

#### System Roles

**SUPER_ADMIN** (Level 1)
- Permissions: `*` (all permissions)
- Type: SYSTEM
- Description: Full system access with all permissions

**ADMIN** (Level 2)
- Permissions: system.admin.full, employees.read, employees.create, employees.update
- Type: SYSTEM
- Description: Platform administrator with broad access

#### Standard Roles

**HR_MANAGER** (Level 3)
- Permissions: employees.read, employees.create, employees.update
- Type: STANDARD
- Description: Human resources management

**COMPLIANCE_OFFICER** (Level 3)
- Permissions: hipaa.incidents.read, hipaa.incidents.write, employees.read
- Type: STANDARD
- Description: HIPAA compliance oversight

**PRIVACY_OFFICER** (Level 3)
- Permissions: hipaa.incidents.read, hipaa.incidents.write, clinical.read.all
- Type: STANDARD
- Description: Patient privacy management

**SECURITY_OFFICER** (Level 3)
- Permissions: hipaa.incidents.read, hipaa.incidents.write
- Type: STANDARD
- Description: Information security management

**PHYSICIAN** (Level 4)
- Permissions: clinical.read.all, clinical.write
- Type: STANDARD
- Description: Medical doctor with full clinical access

**REGISTERED_NURSE** (Level 5)
- Permissions: clinical.read.all, clinical.write
- Type: STANDARD
- Description: Registered nurse with clinical access

**IT_MANAGER** (Level 3)
- Permissions: system.admin.full, employees.read
- Type: STANDARD
- Description: IT infrastructure management

**SUPPORT_AGENT** (Level 6)
- Permissions: employees.read
- Type: STANDARD
- Description: Customer support representative

---

### 4. Sample Employees (10 Total)

#### Super Administrator
- **Employee ID**: EMP-0001
- **Name**: Admin User
- **Email**: admin@holovitals.com
- **Department**: Information Technology
- **Job Title**: System Administrator
- **Role**: SUPER_ADMIN

#### HR Manager
- **Employee ID**: EMP-1001
- **Name**: Sarah Johnson
- **Email**: sarah.johnson@holovitals.com
- **Department**: Human Resources
- **Job Title**: HR Manager
- **Role**: HR_MANAGER

#### HIPAA Compliance Team

**Compliance Officer**
- **Employee ID**: EMP-2001
- **Name**: Michael Chen
- **Email**: michael.chen@holovitals.com
- **Department**: Compliance
- **Job Title**: Compliance Officer
- **Role**: COMPLIANCE_OFFICER

**Privacy Officer**
- **Employee ID**: EMP-2002
- **Name**: Emily Rodriguez
- **Email**: emily.rodriguez@holovitals.com
- **Department**: Compliance
- **Job Title**: Privacy Officer
- **Role**: PRIVACY_OFFICER

**Security Officer**
- **Employee ID**: EMP-2003
- **Name**: David Kim
- **Email**: david.kim@holovitals.com
- **Department**: Compliance
- **Job Title**: Security Officer
- **Role**: SECURITY_OFFICER

#### Clinical Staff

**Chief Medical Officer**
- **Employee ID**: EMP-3001
- **Name**: Dr. James Wilson
- **Email**: james.wilson@holovitals.com
- **Department**: Clinical Operations
- **Job Title**: Chief Medical Officer
- **Role**: PHYSICIAN

**Physician**
- **Employee ID**: EMP-3002
- **Name**: Dr. Lisa Martinez
- **Email**: lisa.martinez@holovitals.com
- **Department**: Clinical Operations
- **Job Title**: Physician
- **Role**: PHYSICIAN

**Registered Nurse**
- **Employee ID**: EMP-3003
- **Name**: Jennifer Brown
- **Email**: jennifer.brown@holovitals.com
- **Department**: Clinical Operations
- **Job Title**: Registered Nurse
- **Role**: REGISTERED_NURSE

#### IT Staff

**IT Manager**
- **Employee ID**: EMP-4001
- **Name**: Robert Taylor
- **Email**: robert.taylor@holovitals.com
- **Department**: Information Technology
- **Job Title**: IT Manager
- **Role**: IT_MANAGER

#### Support Staff

**Support Agent**
- **Employee ID**: EMP-5001
- **Name**: Amanda White
- **Email**: amanda.white@holovitals.com
- **Department**: Customer Support
- **Job Title**: Support Agent
- **Role**: SUPPORT_AGENT

---

## Testing the Seed Data

### 1. Verify Departments
```bash
# In Prisma Studio or psql
SELECT * FROM departments;
```

### 2. Verify Roles
```bash
SELECT name, code, level FROM roles ORDER BY level;
```

### 3. Verify Employees
```bash
SELECT employee_id, first_name, last_name, email, job_title 
FROM employees 
ORDER BY employee_id;
```

### 4. Verify Role Assignments
```bash
SELECT 
  e.employee_id,
  e.first_name,
  e.last_name,
  r.name as role_name
FROM employees e
JOIN employee_roles er ON e.id = er.employee_id
JOIN roles r ON er.role_id = r.id
ORDER BY e.employee_id;
```

---

## Using Seed Data for Testing

### Login as Different Users

Since this is a development environment, you can test different roles by logging in with different employee emails:

1. **Super Admin Access**
   - Email: admin@holovitals.com
   - Test: Full system access, all permissions

2. **HR Manager Access**
   - Email: sarah.johnson@holovitals.com
   - Test: Employee management, onboarding

3. **HIPAA Officer Access**
   - Email: michael.chen@holovitals.com
   - Test: HIPAA compliance dashboard, incident management

4. **Clinical Staff Access**
   - Email: james.wilson@holovitals.com
   - Test: Clinical data access, patient records

5. **Support Agent Access**
   - Email: amanda.white@holovitals.com
   - Test: Limited access, employee directory only

### Testing View Switching

1. Login as any employee (e.g., admin@holovitals.com)
2. Click the rocket button in the header
3. Select "Staff Portal"
4. Verify you're redirected to `/staff/dashboard`
5. Verify navigation shows role-appropriate menu items
6. Click rocket button again
7. Select "Patient Portal"
8. Verify you're redirected back to `/dashboard`

### Testing Permissions

1. Login as Support Agent (amanda.white@holovitals.com)
2. Try to access `/staff/admin/employees`
3. Should be denied (no permission)
4. Login as HR Manager (sarah.johnson@holovitals.com)
5. Try to access `/staff/admin/employees`
6. Should be allowed (has employees.read permission)

---

## Customizing Seed Data

### Adding More Employees

Edit `prisma/seed-rbac.ts` and add to the employees array:

```typescript
createEmployee({
  employeeId: 'EMP-XXXX',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@holovitals.com',
  departmentCode: 'IT',
  jobTitle: 'Developer',
  roleCodes: ['DEVELOPER'], // Must exist in roles
}),
```

### Adding More Roles

Add to the roles array:

```typescript
prisma.role.upsert({
  where: { code: 'DEVELOPER' },
  update: {},
  create: {
    name: 'Developer',
    code: 'DEVELOPER',
    description: 'Software developer',
    level: 5,
    permissions: ['system.admin.full'],
    type: 'STANDARD',
  },
}),
```

### Adding More Permissions

Add to the permissions array:

```typescript
prisma.permission.upsert({
  where: { code: 'reports.generate' },
  update: {},
  create: {
    name: 'Generate Reports',
    code: 'reports.generate',
    category: 'REPORTING',
    description: 'Generate system reports',
    resource: 'Report',
    action: 'generate',
  },
}),
```

---

## Resetting Seed Data

To reset and re-run seed data:

```bash
# Option 1: Reset entire database
npx prisma migrate reset

# Option 2: Delete specific data
# In psql or Prisma Studio, delete from:
# - employee_roles
# - employees
# - roles
# - permissions
# - departments

# Then re-run seed
npm run seed:rbac
```

---

## Troubleshooting

### Error: "User already exists"
The seed script uses `upsert` which should handle existing records. If you still get this error, the user table might have conflicting data. Reset the database or manually delete conflicting users.

### Error: "Department not found"
Ensure departments are created before employees. The seed script creates them in order, but if you're running partial seeds, create departments first.

### Error: "Role not found"
Similar to departments, ensure roles exist before assigning them to employees.

### Seed Script Doesn't Run
Ensure you have ts-node installed:
```bash
npm install -D ts-node
```

---

## Production Considerations

**⚠️ IMPORTANT**: This seed data is for development/testing only!

For production:
1. **DO NOT** use these sample employees
2. **DO NOT** use these email addresses
3. **DO** create real employee records through the HR onboarding process
4. **DO** use strong, unique passwords
5. **DO** implement proper authentication
6. **DO** use environment-specific seed data

---

## Next Steps

After seeding:
1. ✅ Test login with sample employees
2. ✅ Test view switching (patient ↔ staff)
3. ✅ Test role-based navigation
4. ✅ Test permission checks
5. ✅ Build API endpoints for employee management
6. ✅ Build staff portal pages
7. ✅ Implement onboarding workflow

---

## Summary

The seed data provides:
- ✅ 6 departments across all business functions
- ✅ 10 permissions covering key operations
- ✅ 10 roles from SUPER_ADMIN to SUPPORT_AGENT
- ✅ 10 sample employees with realistic data
- ✅ Complete HIPAA compliance team
- ✅ Clinical, IT, HR, and support staff
- ✅ Ready for immediate testing and development

Run `npm run seed:rbac` to get started!