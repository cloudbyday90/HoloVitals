# Employee Onboarding & RBAC System Architecture

## Overview

This document outlines the comprehensive Role-Based Access Control (RBAC) and Employee Onboarding system for HoloVitals. This system replaces the standalone HIPAA team configuration with a unified employee management approach that handles all staff members, including HIPAA compliance officers, clinical staff, administrative personnel, and support teams.

---

## 1. System Goals

### Primary Objectives
1. **Unified Employee Management**: Single system for all employee types
2. **Role-Based Access Control**: Granular permissions based on job roles
3. **Streamlined Onboarding**: Automated workflow for new employee setup
4. **HIPAA Compliance Integration**: HIPAA officers managed as specialized employee roles
5. **Audit Trail**: Complete tracking of access and changes
6. **HR System Integration**: Hooks for external HR platforms (monday.com, etc.)
7. **Development Environment Ready**: Functional system for dev/testing

### Key Principles
- **Separation of Concerns**: Clear distinction between public users and employees
- **Least Privilege**: Users only get permissions they need
- **Audit Everything**: All access and changes are logged
- **Flexible Roles**: Easy to add/modify roles and permissions
- **Self-Service**: Employees can manage their own profiles

---

## 2. Role Hierarchy

### Role Structure

```
SUPER_ADMIN (System Owner)
├── ADMIN (Platform Administrator)
│   ├── HR_MANAGER (Human Resources)
│   ├── COMPLIANCE_OFFICER (HIPAA Compliance)
│   ├── PRIVACY_OFFICER (HIPAA Privacy)
│   ├── SECURITY_OFFICER (HIPAA Security)
│   ├── CLINICAL_DIRECTOR (Clinical Operations)
│   │   ├── PHYSICIAN
│   │   ├── NURSE_PRACTITIONER
│   │   ├── REGISTERED_NURSE
│   │   └── MEDICAL_ASSISTANT
│   ├── IT_MANAGER (IT Operations)
│   │   ├── DEVELOPER
│   │   ├── DEVOPS_ENGINEER
│   │   └── IT_SUPPORT
│   ├── FINANCE_MANAGER (Financial Operations)
│   │   ├── ACCOUNTANT
│   │   └── BILLING_SPECIALIST
│   └── SUPPORT_MANAGER (Customer Support)
│       ├── SUPPORT_LEAD
│       └── SUPPORT_AGENT
└── PATIENT (Public User - Not an Employee)
```

### Role Definitions

#### Administrative Roles

**SUPER_ADMIN**
- Full system access
- Can create/delete any user
- Can modify system configuration
- Can access all data
- Cannot be deleted or modified by others

**ADMIN**
- Platform-wide administrative access
- Can manage most users (except SUPER_ADMIN)
- Can access admin dashboards
- Can view system logs and analytics

**HR_MANAGER**
- Manage employee records
- Initiate onboarding workflows
- Assign roles and permissions
- View employee directory
- Generate HR reports

#### HIPAA Compliance Roles

**COMPLIANCE_OFFICER**
- Oversee HIPAA compliance program
- Review compliance incidents
- Generate compliance reports
- Manage compliance policies
- Receive all HIPAA incident notifications

**PRIVACY_OFFICER**
- Manage patient privacy rights
- Handle privacy complaints
- Review PHI access logs
- Manage consent forms
- Receive privacy-related notifications

**SECURITY_OFFICER**
- Implement security measures
- Monitor security incidents
- Manage access controls
- Review security logs
- Receive security-related notifications

#### Clinical Roles

**CLINICAL_DIRECTOR**
- Oversee clinical operations
- Manage clinical staff
- Review clinical data
- Approve clinical protocols

**PHYSICIAN**
- Full clinical data access
- Can prescribe medications
- Can order lab tests
- Can create clinical notes

**NURSE_PRACTITIONER**
- Clinical data access
- Limited prescribing authority
- Can order lab tests
- Can create clinical notes

**REGISTERED_NURSE**
- Patient care access
- Can view clinical data
- Can document care
- Limited ordering capability

**MEDICAL_ASSISTANT**
- Basic clinical access
- Can schedule appointments
- Can document vitals
- Limited data access

#### IT Roles

**IT_MANAGER**
- Manage IT infrastructure
- Access system logs
- Manage IT staff
- Configure system settings

**DEVELOPER**
- Access development tools
- View system logs
- Deploy code changes
- Access databases (dev/staging only)

**DEVOPS_ENGINEER**
- Manage deployments
- Configure infrastructure
- Monitor system health
- Access production logs

**IT_SUPPORT**
- Help desk access
- Basic troubleshooting
- User account management
- Limited system access

#### Financial Roles

**FINANCE_MANAGER**
- Access financial reports
- Manage billing
- Approve payments
- View revenue data

**ACCOUNTANT**
- Process payments
- Generate invoices
- Reconcile accounts
- View financial data

**BILLING_SPECIALIST**
- Create invoices
- Process claims
- Handle billing inquiries
- Limited financial access

#### Support Roles

**SUPPORT_MANAGER**
- Manage support team
- Access all tickets
- View support metrics
- Escalate issues

**SUPPORT_LEAD**
- Handle escalated tickets
- Mentor support agents
- Access customer data
- Generate reports

**SUPPORT_AGENT**
- Handle customer tickets
- Basic customer data access
- Create support notes
- Limited system access

---

## 3. Permission Matrix

### Permission Categories

1. **System Administration**
   - `system.admin.full` - Full system access
   - `system.config.read` - View system configuration
   - `system.config.write` - Modify system configuration
   - `system.logs.read` - View system logs
   - `system.logs.write` - Modify/delete logs

2. **User Management**
   - `users.read` - View user information
   - `users.create` - Create new users
   - `users.update` - Modify user information
   - `users.delete` - Delete users
   - `users.roles.assign` - Assign roles to users

3. **Employee Management**
   - `employees.read` - View employee information
   - `employees.create` - Create new employees
   - `employees.update` - Modify employee information
   - `employees.delete` - Delete employees
   - `employees.onboard` - Manage onboarding process
   - `employees.directory.read` - View employee directory

4. **Clinical Data**
   - `clinical.read.all` - View all clinical data
   - `clinical.read.assigned` - View assigned patient data
   - `clinical.write` - Create/modify clinical data
   - `clinical.delete` - Delete clinical data
   - `clinical.prescribe` - Prescribe medications
   - `clinical.order` - Order lab tests/procedures

5. **HIPAA Compliance**
   - `hipaa.incidents.read` - View HIPAA incidents
   - `hipaa.incidents.write` - Create/modify incidents
   - `hipaa.reports.generate` - Generate compliance reports
   - `hipaa.policies.manage` - Manage compliance policies
   - `hipaa.audit.read` - View audit logs

6. **Financial**
   - `finance.read` - View financial data
   - `finance.write` - Create/modify financial records
   - `finance.approve` - Approve payments
   - `finance.reports.generate` - Generate financial reports

7. **Support**
   - `support.tickets.read` - View support tickets
   - `support.tickets.write` - Create/modify tickets
   - `support.tickets.assign` - Assign tickets
   - `support.customer.read` - View customer data

8. **Development**
   - `dev.tools.access` - Access development tools
   - `dev.logs.read` - View development logs
   - `dev.database.read` - Read database
   - `dev.database.write` - Modify database
   - `dev.deploy` - Deploy code changes

### Role-Permission Mapping

```typescript
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'], // All permissions
  
  ADMIN: [
    'system.config.read',
    'system.logs.read',
    'users.read',
    'users.create',
    'users.update',
    'users.roles.assign',
    'employees.read',
    'employees.create',
    'employees.update',
    'employees.onboard',
    'employees.directory.read',
  ],
  
  HR_MANAGER: [
    'employees.read',
    'employees.create',
    'employees.update',
    'employees.onboard',
    'employees.directory.read',
    'users.read',
    'users.create',
    'users.update',
    'users.roles.assign',
  ],
  
  COMPLIANCE_OFFICER: [
    'hipaa.incidents.read',
    'hipaa.incidents.write',
    'hipaa.reports.generate',
    'hipaa.policies.manage',
    'hipaa.audit.read',
    'employees.directory.read',
  ],
  
  PRIVACY_OFFICER: [
    'hipaa.incidents.read',
    'hipaa.incidents.write',
    'hipaa.audit.read',
    'clinical.read.all',
    'employees.directory.read',
  ],
  
  SECURITY_OFFICER: [
    'hipaa.incidents.read',
    'hipaa.incidents.write',
    'system.logs.read',
    'hipaa.audit.read',
    'employees.directory.read',
  ],
  
  CLINICAL_DIRECTOR: [
    'clinical.read.all',
    'clinical.write',
    'clinical.prescribe',
    'clinical.order',
    'employees.read',
    'employees.directory.read',
  ],
  
  PHYSICIAN: [
    'clinical.read.assigned',
    'clinical.write',
    'clinical.prescribe',
    'clinical.order',
  ],
  
  // ... (other roles)
};
```

---

## 4. Employee Onboarding Workflow

### Onboarding Stages

```
1. INVITATION
   ├── HR creates employee record
   ├── System generates invitation email
   └── Employee receives invitation link

2. ACCOUNT_SETUP
   ├── Employee clicks invitation link
   ├── Sets password
   ├── Completes profile information
   └── Uploads required documents

3. ROLE_ASSIGNMENT
   ├── HR assigns role(s)
   ├── System provisions permissions
   └── Access controls activated

4. TRAINING
   ├── Complete required training modules
   ├── HIPAA compliance training
   ├── System orientation
   └── Role-specific training

5. COMPLIANCE
   ├── Sign confidentiality agreement
   ├── Acknowledge policies
   ├── Complete background check
   └── Verify credentials

6. PROVISIONING
   ├── Create email account
   ├── Assign equipment
   ├── Configure access badges
   └── Set up workstation

7. ACTIVE
   ├── Full system access granted
   ├── Added to employee directory
   ├── Onboarding complete
   └── Regular employee status
```

### Onboarding Checklist

Each employee type has a customized checklist:

**All Employees:**
- [ ] Complete profile information
- [ ] Set up two-factor authentication
- [ ] Sign confidentiality agreement
- [ ] Complete HIPAA training
- [ ] Acknowledge company policies
- [ ] Emergency contact information
- [ ] Direct deposit setup

**Clinical Staff Additional:**
- [ ] Verify medical license
- [ ] Complete clinical protocols training
- [ ] Review patient privacy policies
- [ ] Shadow experienced staff member
- [ ] Complete EHR system training

**HIPAA Officers Additional:**
- [ ] Complete advanced HIPAA training
- [ ] Review compliance procedures
- [ ] Set up incident notification preferences
- [ ] Access compliance dashboard
- [ ] Review audit log procedures

**IT Staff Additional:**
- [ ] Complete security training
- [ ] Set up development environment
- [ ] Review system architecture
- [ ] Access granted to repositories
- [ ] Complete deployment procedures training

---

## 5. Database Schema

### Core Models

```prisma
// Employee Model
model Employee {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  
  // Basic Information
  employeeId        String   @unique // Company employee ID
  firstName         String
  lastName          String
  email             String   @unique
  phone             String?
  dateOfBirth       DateTime?
  
  // Employment Details
  department        Department @relation(fields: [departmentId], references: [id])
  departmentId      String
  jobTitle          String
  hireDate          DateTime
  terminationDate   DateTime?
  employmentStatus  EmploymentStatus @default(ACTIVE)
  
  // Role and Permissions
  roles             EmployeeRole[]
  permissions       EmployeePermission[]
  
  // Onboarding
  onboardingStatus  OnboardingStatus @default(INVITED)
  onboarding        EmployeeOnboarding?
  
  // Contact Information
  address           String?
  city              String?
  state             String?
  zipCode           String?
  emergencyContact  Json? // {name, phone, relationship}
  
  // Compliance
  hipaaTrainingDate DateTime?
  backgroundCheckDate DateTime?
  confidentialityAgreementDate DateTime?
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  createdBy         String
  lastModifiedBy    String?
  
  // Relations
  auditLogs         AuditLog[]
  managedEmployees  Employee[] @relation("ManagerRelation")
  manager           Employee?  @relation("ManagerRelation", fields: [managerId], references: [id])
  managerId         String?
  
  @@index([email])
  @@index([employeeId])
  @@index([departmentId])
}

// Department Model
model Department {
  id          String     @id @default(cuid())
  name        String     @unique
  description String?
  managerId   String?
  employees   Employee[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

// Role Model
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  permissions String[] // Array of permission strings
  level       Int      // Hierarchy level (1 = highest)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  employees   EmployeeRole[]
}

// Employee-Role Junction
model EmployeeRole {
  id         String   @id @default(cuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])
  roleId     String
  role       Role     @relation(fields: [roleId], references: [id])
  assignedAt DateTime @default(now())
  assignedBy String
  expiresAt  DateTime?
  
  @@unique([employeeId, roleId])
}

// Permission Model
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  category    String
  description String?
  createdAt   DateTime @default(now())
  
  employees   EmployeePermission[]
}

// Employee-Permission Junction (for custom permissions)
model EmployeePermission {
  id           String     @id @default(cuid())
  employeeId   String
  employee     Employee   @relation(fields: [employeeId], references: [id])
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id])
  grantedAt    DateTime   @default(now())
  grantedBy    String
  expiresAt    DateTime?
  
  @@unique([employeeId, permissionId])
}

// Employee Onboarding Model
model EmployeeOnboarding {
  id                String   @id @default(cuid())
  employeeId        String   @unique
  employee          Employee @relation(fields: [employeeId], references: [id])
  
  // Invitation
  invitationToken   String   @unique
  invitationSentAt  DateTime?
  invitationExpires DateTime?
  invitationAcceptedAt DateTime?
  
  // Checklist
  checklist         Json // Array of checklist items with completion status
  checklistProgress Int @default(0) // Percentage complete
  
  // Stages
  currentStage      OnboardingStage @default(INVITATION)
  stageHistory      Json // Array of stage transitions
  
  // Documents
  documentsRequired Json // Array of required documents
  documentsUploaded Json // Array of uploaded documents
  
  // Training
  trainingModules   Json // Array of training modules
  trainingProgress  Int @default(0)
  
  // Completion
  completedAt       DateTime?
  completedBy       String?
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([invitationToken])
}

// Audit Log Model
model AuditLog {
  id          String   @id @default(cuid())
  employeeId  String?
  employee    Employee? @relation(fields: [employeeId], references: [id])
  
  action      String   // CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  resource    String   // What was accessed/modified
  resourceId  String?  // ID of the resource
  details     Json?    // Additional details
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime @default(now())
  
  @@index([employeeId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
}

// Enums
enum EmploymentStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  TERMINATED
  ON_LEAVE
}

enum OnboardingStatus {
  INVITED
  ACCOUNT_SETUP
  ROLE_ASSIGNMENT
  TRAINING
  COMPLIANCE
  PROVISIONING
  ACTIVE
  INCOMPLETE
  CANCELLED
}

enum OnboardingStage {
  INVITATION
  ACCOUNT_SETUP
  ROLE_ASSIGNMENT
  TRAINING
  COMPLIANCE
  PROVISIONING
  ACTIVE
}
```

---

## 6. API Endpoints

### Employee Management

```
POST   /api/admin/employees                    - Create new employee
GET    /api/admin/employees                    - List all employees
GET    /api/admin/employees/:id                - Get employee details
PUT    /api/admin/employees/:id                - Update employee
DELETE /api/admin/employees/:id                - Delete employee
POST   /api/admin/employees/:id/invite         - Send invitation
POST   /api/admin/employees/:id/roles          - Assign role
DELETE /api/admin/employees/:id/roles/:roleId  - Remove role
GET    /api/admin/employees/:id/permissions    - Get permissions
POST   /api/admin/employees/:id/permissions    - Grant permission
DELETE /api/admin/employees/:id/permissions/:permissionId - Revoke permission
```

### Onboarding

```
GET    /api/onboarding/invitation/:token       - Get invitation details
POST   /api/onboarding/accept                  - Accept invitation
GET    /api/onboarding/checklist               - Get onboarding checklist
PUT    /api/onboarding/checklist/:itemId       - Update checklist item
POST   /api/onboarding/documents               - Upload document
GET    /api/onboarding/training                - Get training modules
POST   /api/onboarding/training/:moduleId      - Complete training module
POST   /api/onboarding/complete                - Complete onboarding
```

### Roles & Permissions

```
GET    /api/admin/roles                        - List all roles
POST   /api/admin/roles                        - Create role
GET    /api/admin/roles/:id                    - Get role details
PUT    /api/admin/roles/:id                    - Update role
DELETE /api/admin/roles/:id                    - Delete role
GET    /api/admin/permissions                  - List all permissions
POST   /api/admin/permissions                  - Create permission
```

### Employee Directory

```
GET    /api/employees/directory                - Get employee directory
GET    /api/employees/search                   - Search employees
GET    /api/employees/profile/:id              - Get employee profile
PUT    /api/employees/profile                  - Update own profile
```

### Audit Logs

```
GET    /api/admin/audit-logs                   - Get audit logs
GET    /api/admin/audit-logs/employee/:id      - Get employee audit logs
GET    /api/admin/audit-logs/export            - Export audit logs
```

---

## 7. Integration with HIPAA Compliance

### HIPAA Officers as Employees

Instead of a standalone HIPAA team configuration page, HIPAA officers are now managed as employees with specialized roles:

1. **Compliance Officer** - Employee with `COMPLIANCE_OFFICER` role
2. **Privacy Officer** - Employee with `PRIVACY_OFFICER` role
3. **Security Officer** - Employee with `SECURITY_OFFICER` role

### Automatic Notification Setup

When an employee is assigned a HIPAA officer role:
1. System automatically enables HIPAA incident notifications
2. Employee email is added to HIPAA notification list
3. Employee gains access to HIPAA compliance dashboard
4. Employee receives HIPAA-specific training modules

### Migration from Standalone HIPAA Team Page

The standalone `/admin/hipaa-team` page will be removed. Instead:
- HIPAA officers are managed through `/admin/employees`
- Filter employees by role to see HIPAA officers
- Assign HIPAA roles during employee onboarding
- Update HIPAA officer information through employee profile

---

## 8. HR System Integration

### Integration Points

The system provides hooks for external HR platforms (monday.com, BambooHR, etc.):

1. **Webhooks**
   - Employee created
   - Employee updated
   - Employee terminated
   - Onboarding completed
   - Role assigned

2. **API Endpoints**
   - Sync employee data
   - Import employee records
   - Export employee data
   - Update employment status

3. **Data Export**
   - CSV export of employee directory
   - JSON export for API integration
   - Scheduled sync jobs

### monday.com Integration Example

```typescript
// Webhook handler for monday.com
POST /api/integrations/monday/webhook
{
  "event": "employee_created",
  "data": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "department": "Clinical",
    "jobTitle": "Physician",
    "hireDate": "2025-10-15"
  }
}

// Response: Create employee in HoloVitals and send invitation
```

---

## 9. Development Environment Considerations

### Dev Environment Features

1. **Seed Data**
   - Pre-populated employee records
   - Sample roles and permissions
   - Test HIPAA officers
   - Demo onboarding workflows

2. **Testing Tools**
   - Employee creation wizard
   - Role assignment simulator
   - Permission testing interface
   - Onboarding workflow tester

3. **Mock Integrations**
   - Simulated HR system webhooks
   - Mock email notifications
   - Test invitation flows
   - Demo training modules

4. **Data Reset**
   - Easy reset of employee data
   - Preserve system configuration
   - Quick setup for testing

---

## 10. Security Considerations

### Access Control

1. **Authentication**
   - Two-factor authentication required for all employees
   - Session management with timeout
   - Password complexity requirements
   - Account lockout after failed attempts

2. **Authorization**
   - Role-based access control enforced at API level
   - Permission checks on every request
   - Audit logging of all access
   - Principle of least privilege

3. **Data Protection**
   - Encryption at rest and in transit
   - PHI access logging
   - Data retention policies
   - Secure document storage

### Compliance

1. **HIPAA**
   - All employee access logged
   - PHI access requires justification
   - Automatic access reviews
   - Incident reporting

2. **SOC 2**
   - Access control policies
   - Change management
   - Incident response
   - Audit trails

---

## 11. Implementation Phases

### Phase 1: Core RBAC (Week 1)
- [ ] Database schema
- [ ] Role and permission models
- [ ] Basic RBAC middleware
- [ ] Employee CRUD operations

### Phase 2: Onboarding System (Week 2)
- [ ] Invitation system
- [ ] Onboarding workflow
- [ ] Checklist management
- [ ] Document upload

### Phase 3: Admin Interface (Week 3)
- [ ] Employee management dashboard
- [ ] Role assignment interface
- [ ] Employee directory
- [ ] Onboarding tracking

### Phase 4: Integration & Testing (Week 4)
- [ ] HIPAA officer integration
- [ ] HR system hooks
- [ ] Comprehensive testing
- [ ] Documentation

---

## 12. Success Metrics

### Key Performance Indicators

1. **Onboarding Efficiency**
   - Average time to complete onboarding
   - Checklist completion rate
   - Training completion rate

2. **Access Control**
   - Permission violations (should be 0)
   - Unauthorized access attempts
   - Role assignment accuracy

3. **User Adoption**
   - Employee directory usage
   - Self-service profile updates
   - Training module completion

4. **Compliance**
   - HIPAA training completion rate
   - Audit log completeness
   - Incident response time

---

## Conclusion

This comprehensive RBAC and Employee Onboarding system provides a unified approach to managing all staff members in HoloVitals, from HIPAA compliance officers to clinical staff to support teams. By integrating HIPAA officer management into the broader employee system, we achieve better consistency, easier maintenance, and more flexibility for future growth.

The system is designed to work in both development and production environments, with appropriate safeguards and testing capabilities for each context.