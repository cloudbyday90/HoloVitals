# HoloVitals Staff Portal - User Guide v1.4.0

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Employee Management](#employee-management)
4. [Role Management](#role-management)
5. [Department Management](#department-management)
6. [Onboarding Management](#onboarding-management)
7. [Audit Logs](#audit-logs)
8. [Analytics Dashboard](#analytics-dashboard)
9. [Permissions Reference](#permissions-reference)

---

## Introduction

The HoloVitals Staff Portal is a comprehensive employee management system with role-based access control (RBAC). This guide will help you navigate and use all features of the staff portal.

### Key Features
- **Employee Directory**: Search, filter, and manage employee records
- **Role Management**: Create and manage roles with granular permissions
- **Department Management**: Organize employees into departments with budgets
- **Onboarding System**: Track new employee onboarding progress
- **Audit Logs**: Monitor all system activities for compliance
- **Analytics**: View organizational metrics and statistics

---

## Getting Started

### Accessing the Staff Portal

1. **Login**: Sign in to HoloVitals with your employee credentials
2. **Switch to Staff View**: Click the rocket icon (🚀) in the top-right corner
3. **Navigation**: Use the sidebar to access different sections

### View Switching

The rocket button allows you to switch between:
- **Patient View**: Access patient-facing features
- **Staff View**: Access employee management features

**Note**: Only employees with active accounts can access the staff portal.

### Dashboard Overview

The staff dashboard displays:
- Your employee information
- Quick statistics (total employees, departments, roles)
- Quick action buttons
- Recent activity

---

## Employee Management

### Viewing Employees

**Path**: `/staff/employees`

**Features**:
- Search by name, email, or employee ID
- Filter by department, status, or employment type
- View employee cards with key information
- Sort and paginate results

**Filters Available**:
- **Search**: Free-text search across name, email, and employee ID
- **Department**: Filter by specific department
- **Status**: ACTIVE, INACTIVE, ON_LEAVE, TERMINATED
- **Employment Type**: FULL_TIME, PART_TIME, CONTRACT, INTERN

### Viewing Employee Details

**Path**: `/staff/employees/{id}`

**Information Displayed**:
- Basic information (name, email, phone, employee ID)
- Job details (title, department, role)
- Employment information (type, start date, salary)
- Emergency contact
- Assigned permissions (inherited from role)

**Actions Available**:
- Edit employee information
- Terminate employee
- Reactivate terminated employee

### Creating a New Employee

**Path**: `/staff/employees/new`

**Required Permission**: `employee:create`

**Steps**:
1. Click "Add Employee" button on the employees page
2. Fill in the employee form:
   - **Basic Information**: Employee ID, name, email, phone
   - **Employment Details**: Department, role, employment type, start date
   - **Optional**: Job title, salary, emergency contact
3. Click "Create Employee"

**Required Fields**:
- Employee ID (must be unique)
- First Name
- Last Name
- Email
- Department
- Role
- Employment Type
- Start Date

### Editing an Employee

**Path**: `/staff/employees/{id}/edit`

**Required Permission**: `employee:update`

**Steps**:
1. Navigate to employee detail page
2. Click "Edit" button
3. Update desired fields
4. Click "Update Employee"

**Note**: Employee ID cannot be changed after creation.

### Terminating an Employee

**Required Permission**: `employee:terminate`

**Steps**:
1. Navigate to employee detail page
2. Click "Terminate" button
3. Enter termination date and reason
4. Confirm termination

**Effects**:
- Employee status changes to TERMINATED
- End date is set
- Employee loses access to the system
- Record is retained for audit purposes

### Reactivating an Employee

**Required Permission**: `employee:update`

**Steps**:
1. Navigate to terminated employee's detail page
2. Click "Reactivate" button
3. Confirm reactivation

**Effects**:
- Employee status changes to ACTIVE
- End date is cleared
- Employee regains system access

---

## Role Management

### Viewing Roles

**Path**: `/staff/roles`

**Features**:
- View role hierarchy
- See permission counts
- View employee counts per role
- Manage role relationships

**Role Hierarchy**:
Roles are organized in a hierarchy with parent-child relationships. Child roles inherit permissions from parent roles.

### Role Details

**Path**: `/staff/roles/{id}`

**Information Displayed**:
- Role name and description
- Role level (hierarchy position)
- Parent role (if applicable)
- Assigned permissions
- Number of employees with this role

### Creating a New Role

**Path**: `/staff/roles/new`

**Required Permission**: `role:create`

**Steps**:
1. Click "Create Role" button
2. Enter role information:
   - Name (e.g., "SENIOR_DEVELOPER")
   - Description
   - Level (1-100, higher = more authority)
   - Parent Role (optional)
3. Click "Create Role"
4. Assign permissions using "Assign Permissions" action

**Best Practices**:
- Use descriptive names in UPPER_SNAKE_CASE
- Set appropriate hierarchy levels
- Start with minimal permissions and add as needed
- Document role purposes in descriptions

### Editing a Role

**Required Permission**: `role:update`

**Steps**:
1. Navigate to role detail page
2. Click "Edit" button
3. Update role information
4. Click "Update Role"

### Assigning Permissions

**Required Permission**: `role:update`

**Steps**:
1. Navigate to role detail page
2. Click "Assign Permissions" button
3. Select permissions from the list
4. Click "Save Permissions"

**Permission Inheritance**:
- Roles inherit all permissions from parent roles
- Child roles automatically get parent permissions
- Wildcard permissions (e.g., `employee:*`) grant all related permissions

### Deleting a Role

**Required Permission**: `role:delete`

**Steps**:
1. Navigate to roles page
2. Click "Delete" button on the role card
3. Confirm deletion

**Warning**: Cannot delete roles that have employees assigned. Reassign employees first.

---

## Department Management

### Viewing Departments

**Path**: `/staff/departments`

**Features**:
- View all departments in card layout
- See employee counts
- View budget information
- See department managers

### Department Details

**Path**: `/staff/departments/{id}`

**Information Displayed**:
- Department name and description
- Manager information
- Budget and cost center
- Employee count
- List of employees in department

### Creating a New Department

**Path**: `/staff/departments/new`

**Required Permission**: `department:create`

**Steps**:
1. Click "Create Department" button
2. Enter department information:
   - Name (required)
   - Description
   - Manager (select from employees)
   - Budget (annual budget in USD)
   - Cost Center (accounting code)
3. Click "Create Department"

### Editing a Department

**Required Permission**: `department:update`

**Steps**:
1. Navigate to department detail page
2. Click "Edit" button
3. Update department information
4. Click "Update Department"

### Deleting a Department

**Required Permission**: `department:delete`

**Steps**:
1. Navigate to departments page
2. Click "Delete" button on the department card
3. Confirm deletion

**Warning**: Cannot delete departments with employees. Reassign employees first.

---

## Onboarding Management

### Viewing Onboarding Records

**Path**: `/staff/onboarding`

**Features**:
- View all onboarding records
- Filter by stage
- See progress bars
- Track completion status

**Onboarding Stages**:
1. **INVITATION_SENT**: Invitation email sent to new employee
2. **ACCOUNT_CREATED**: Employee created account
3. **PROFILE_COMPLETED**: Employee completed profile information
4. **DOCUMENTS_UPLOADED**: Required documents uploaded
5. **TRAINING_STARTED**: Employee started training modules
6. **TRAINING_COMPLETED**: All training completed
7. **REVIEW_PENDING**: HR review pending
8. **ACTIVE**: Onboarding complete, employee active

### Onboarding Details

**Path**: `/staff/onboarding/{id}`

**Information Displayed**:
- Current stage and progress
- Employee information
- Checklist items
- Uploaded documents
- Stage history

### Sending an Invitation

**Path**: `/staff/onboarding/invite`

**Required Permission**: `onboarding:create`

**Steps**:
1. Click "Send Invitation" button
2. Enter new employee information:
   - Employee ID
   - Email
   - First Name
   - Last Name
3. Click "Send Invitation"

**What Happens**:
- Onboarding record is created
- Invitation email is sent to employee
- Unique invitation token is generated
- Employee can use token to create account

### Advancing Onboarding Stage

**Required Permission**: `onboarding:update`

**Steps**:
1. Navigate to onboarding detail page
2. Review current stage requirements
3. Click "Advance to Next Stage" button
4. Confirm advancement

**Validation**:
- System validates stage requirements before advancing
- Some stages require specific actions (e.g., documents uploaded)

### Completing Onboarding

**Required Permission**: `onboarding:update`

**Steps**:
1. Navigate to onboarding detail page
2. Ensure all stages are complete
3. Click "Complete Onboarding" button
4. Confirm completion

**Effects**:
- Employee status changes to ACTIVE
- Onboarding record is marked complete
- Employee gains full system access

### Managing Documents

**Required Permission**: `onboarding:update` (or own onboarding)

**Steps**:
1. Navigate to onboarding detail page
2. Click "Upload Document" button
3. Enter document information:
   - Document name
   - Document URL (from file storage)
   - Document type
4. Click "Upload"

**Document Types**:
- Identification
- Tax forms
- Certifications
- Background check
- Other

### Managing Checklist

**Required Permission**: `onboarding:update` (or own onboarding)

**Steps**:
1. Navigate to onboarding detail page
2. View checklist items for current stage
3. Check/uncheck items as completed
4. System automatically saves changes

---

## Audit Logs

### Viewing Audit Logs

**Path**: `/staff/audit`

**Required Permission**: `audit:read`

**Features**:
- View all system activities
- Filter by multiple criteria
- Export logs for compliance
- Generate compliance reports

**Filters Available**:
- **Action**: Specific action type (e.g., employee:create)
- **Resource Type**: Type of resource (employee, role, department)
- **Status**: Success or failed actions
- **Date Range**: Start and end dates
- **Employee**: Filter by specific employee

### Audit Log Details

**Path**: `/staff/audit/{id}`

**Information Displayed**:
- Timestamp
- Employee who performed action
- Action type
- Resource affected
- Success/failure status
- IP address and user agent
- Detailed information (JSON)

### Exporting Audit Logs

**Required Permission**: `audit:export`

**Steps**:
1. Navigate to audit logs page
2. Apply desired filters
3. Click "Export CSV" or "Export JSON"
4. File downloads automatically

**Export Formats**:
- **CSV**: Spreadsheet format for analysis
- **JSON**: Structured format for processing

**Use Cases**:
- Compliance audits
- Security investigations
- Performance analysis
- Reporting to management

### Compliance Reports

**Required Permission**: `audit:read`

**Steps**:
1. Navigate to audit logs page
2. Click "Generate Compliance Report"
3. Select date range
4. View report summary

**Report Contents**:
- Total actions in period
- Success/failure rates
- Action breakdown by type
- Suspicious activity alerts
- Unique employee activity

---

## Analytics Dashboard

### Viewing Analytics

**Path**: `/staff/analytics`

**Required Permission**: `analytics:read` (or general staff access)

**Metrics Displayed**:

**Key Metrics**:
- Total Employees
- Active Employees
- On Leave Employees
- Terminated Employees

**Department Statistics**:
- Employees per department
- Department budgets
- Visual distribution charts

**Role Statistics**:
- Employees per role
- Role distribution
- Visual breakdown

**Onboarding Statistics**:
- Total onboarding records
- Completed onboarding
- In-progress onboarding
- Completion rate

**Use Cases**:
- Workforce planning
- Budget allocation
- Hiring decisions
- Performance tracking

---

## Permissions Reference

### Employee Permissions
- `employee:read` - View employee information
- `employee:create` - Create new employees
- `employee:update` - Update employee information
- `employee:delete` - Delete employees (soft delete)
- `employee:terminate` - Terminate employees

### Role Permissions
- `role:read` - View roles and permissions
- `role:create` - Create new roles
- `role:update` - Update roles and assign permissions
- `role:delete` - Delete roles

### Department Permissions
- `department:read` - View departments
- `department:create` - Create new departments
- `department:update` - Update department information
- `department:delete` - Delete departments

### Onboarding Permissions
- `onboarding:read` - View onboarding records
- `onboarding:create` - Send invitations
- `onboarding:update` - Manage onboarding progress
- `onboarding:complete` - Complete onboarding

### Audit Permissions
- `audit:read` - View audit logs
- `audit:export` - Export audit logs

### System Permissions
- `system:admin` - Full system administration (SUPER_ADMIN only)

### Wildcard Permissions
- `employee:*` - All employee permissions
- `role:*` - All role permissions
- `department:*` - All department permissions
- `onboarding:*` - All onboarding permissions
- `audit:*` - All audit permissions

---

## Troubleshooting

### Common Issues

**Cannot Access Staff Portal**
- Ensure you have an active employee account
- Check that your employee status is ACTIVE
- Verify you're logged in with correct credentials

**Permission Denied Errors**
- Check your role's assigned permissions
- Contact your administrator to request additional permissions
- Verify you're accessing the correct resource

**Cannot Create/Update Records**
- Ensure all required fields are filled
- Check for validation errors in form
- Verify you have the necessary permissions

**Onboarding Not Advancing**
- Ensure all stage requirements are met
- Check that required documents are uploaded
- Verify checklist items are completed

### Getting Help

**For Technical Issues**:
- Contact IT Support
- Check system status page
- Review error messages carefully

**For Permission Issues**:
- Contact your department manager
- Request access from HR
- Review your role's permissions

**For Training**:
- Review this user guide
- Attend staff training sessions
- Contact HR for onboarding support

---

## Best Practices

### Security
1. Never share your login credentials
2. Log out when finished using the system
3. Report suspicious activity immediately
4. Use strong passwords and enable 2FA

### Data Management
1. Keep employee information up to date
2. Document all significant actions
3. Review audit logs regularly
4. Export data for backup purposes

### Onboarding
1. Send invitations promptly for new hires
2. Monitor onboarding progress regularly
3. Complete stages in order
4. Maintain communication with new employees

### Role Management
1. Follow principle of least privilege
2. Review role permissions regularly
3. Document role purposes clearly
4. Maintain proper role hierarchy

---

**Version:** 1.4.0  
**Last Updated:** 2024-01-04  
**For Support:** Contact IT Support or HR Department