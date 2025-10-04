# RBAC Middleware & View Switching - Complete

## Date: October 4, 2025

---

## ✅ Completed Implementation

### RBAC Middleware System

All middleware components for Role-Based Access Control and view switching have been successfully implemented:

---

## 1. Core RBAC Middleware (`lib/middleware/rbac.ts`)

**Purpose**: Protect routes with role and permission checks

**Key Features**:
- Route protection with permission checks
- Role-based access control
- Employee verification
- Audit logging integration
- SUPER_ADMIN bypass support
- Request header injection for downstream use

**Main Functions**:

### `withRBAC(request, options)`
Main middleware function for protecting routes
- Checks authentication
- Verifies employee status
- Validates permissions and roles
- Logs all access attempts
- Returns appropriate error responses

**Options**:
```typescript
{
  requiredPermissions?: string[];  // Permissions needed
  requireAll?: boolean;            // Must have ALL or ANY
  requiredRoles?: string[];        // Roles needed
  allowSuperAdmin?: boolean;       // Bypass for SUPER_ADMIN
}
```

### Helper Functions:
- `checkPermission(userId, permission)` - Check if user has permission
- `checkRole(userId, roleCode)` - Check if user has role
- `getEmployeeFromUserId(userId)` - Get employee record
- `requireAuth(request)` - Basic authentication check
- `requireEmployee(request)` - Verify employee access
- `createRBACHandler(handler, options)` - Wrapper for API routes

**Usage Example**:
```typescript
// In API route
import { withRBAC } from '@/lib/middleware/rbac';

export async function GET(request: NextRequest) {
  const rbacCheck = await withRBAC(request, {
    requiredPermissions: ['employees.read'],
    requiredRoles: ['HR_MANAGER', 'ADMIN'],
  });
  
  if (rbacCheck.status !== 200) {
    return rbacCheck; // Return error response
  }
  
  // Continue with protected logic
}
```

---

## 2. View Switching System

### Server-Side Utilities (`lib/utils/viewSwitcher.ts`)

**Purpose**: Manage switching between patient and staff views

**Functions**:
- `getViewMode()` - Get current view mode from cookies
- `setViewMode(mode)` - Set view mode cookie
- `toggleViewMode()` - Toggle between views
- `isStaffView()` - Check if in staff view
- `isPatientView()` - Check if in patient view
- `getViewRedirectUrl(mode)` - Get redirect URL for view

**Client-Side Utilities**:
- `ViewSwitcherClient.getViewMode()` - Get from localStorage
- `ViewSwitcherClient.setViewMode(mode)` - Set in localStorage
- `ViewSwitcherClient.toggleViewMode()` - Toggle view
- `ViewSwitcherClient.isStaffView()` - Check staff view
- `ViewSwitcherClient.isPatientView()` - Check patient view

---

## 3. View Mode API (`app/api/view-mode/route.ts`)

**Purpose**: API endpoint for switching views

### GET Endpoint
Returns current view mode and employee information:
```json
{
  "currentMode": "patient" | "staff",
  "isEmployee": boolean,
  "canSwitchToStaff": boolean,
  "employeeInfo": {
    "id": "...",
    "name": "...",
    "jobTitle": "...",
    "department": "...",
    "roles": [...]
  }
}
```

### POST Endpoint
Switch view mode:
```json
// Request
{
  "mode": "patient" | "staff"
}

// Response
{
  "success": true,
  "mode": "staff",
  "redirectUrl": "/staff/dashboard"
}
```

**Security**:
- Verifies user is employee before allowing staff view
- Checks employee status is ACTIVE
- Sets secure HTTP-only cookie
- Returns appropriate redirect URL

---

## 4. View Switcher Components

### Full Component (`components/ui/ViewSwitcher.tsx`)

**Purpose**: Complete view switcher with employee info

**Features**:
- Shows current view mode
- Displays employee information in staff view
- Loading states
- Error handling
- Automatic redirect after switch

**Usage**:
```tsx
import { ViewSwitcher } from '@/components/ui/ViewSwitcher';

<ViewSwitcher className="..." />
```

### Compact Component (`ViewSwitcherCompact`)

**Purpose**: Minimal view switcher for headers/navbars

**Features**:
- Icon-only display
- Tooltip on hover
- Minimal space usage
- Same functionality as full component

**Usage**:
```tsx
import { ViewSwitcherCompact } from '@/components/ui/ViewSwitcher';

<ViewSwitcherCompact className="..." />
```

---

## 5. Staff Portal Structure

### Staff Layout (`app/staff/layout.tsx`)

**Purpose**: Layout wrapper for all staff portal pages

**Features**:
- Authentication check
- Employee verification
- Automatic redirect for non-employees
- Staff sidebar and header
- Consistent layout across staff pages

**Security Checks**:
1. User must be authenticated
2. User must be an employee
3. Employee status must be ACTIVE
4. Redirects to patient portal if checks fail

### Staff Dashboard (`app/staff/dashboard/page.tsx`)

**Purpose**: Main dashboard for staff portal

**Features**:
- Welcome message with employee info
- Quick statistics cards
- Employee information display
- Role and permission display
- Quick action links
- Department information

**Statistics Displayed**:
- Total employees
- Active employees
- Departments count
- Onboarding in progress
- User's roles

### Staff Sidebar (`components/staff/StaffSidebar.tsx`)

**Purpose**: Navigation sidebar for staff portal

**Features**:
- Dynamic navigation based on roles
- Active route highlighting
- Role-based menu items
- Employee info at bottom
- Responsive design

**Navigation Items**:

**Base (All Staff)**:
- Dashboard
- Employee Directory
- Departments
- My Profile

**Admin Only**:
- Manage Employees
- Roles & Permissions
- Onboarding
- Audit Logs
- Analytics

**HIPAA Officers**:
- HIPAA Compliance

### Staff Header (`components/staff/StaffHeader.tsx`)

**Purpose**: Header bar for staff portal

**Features**:
- Logo and branding
- Search bar
- View switcher (compact)
- Notifications
- Settings link
- User menu with sign out
- Employee name and title display

---

## 📊 Implementation Statistics

### Files Created
- **RBAC Middleware**: 1 file (~400 LOC)
- **View Switching**: 2 files (~300 LOC)
- **API Endpoints**: 1 file (~150 LOC)
- **Components**: 3 files (~400 LOC)
- **Staff Portal**: 3 files (~350 LOC)

**Total**: 10 files, ~1,600 lines of code

### Features Implemented
- ✅ Complete RBAC middleware system
- ✅ Permission and role checking
- ✅ View mode switching (patient/staff)
- ✅ Staff portal layout
- ✅ Staff dashboard
- ✅ Dynamic navigation based on roles
- ✅ Audit logging integration
- ✅ Security checks throughout

---

## 🔐 Security Features

### Authentication & Authorization
- ✅ Session-based authentication
- ✅ Employee verification
- ✅ Role-based access control
- ✅ Permission-based authorization
- ✅ SUPER_ADMIN bypass option
- ✅ Active employee status check

### Audit & Compliance
- ✅ All access attempts logged
- ✅ Failed access attempts tracked
- ✅ IP address and user agent logging
- ✅ Endpoint tracking
- ✅ Success/failure status

### Data Protection
- ✅ HTTP-only cookies for view mode
- ✅ Secure cookies in production
- ✅ SameSite cookie protection
- ✅ 30-day cookie expiration
- ✅ Automatic cleanup on sign out

---

## 🎯 Usage Patterns

### Protecting API Routes

**Basic Protection**:
```typescript
import { requireEmployee } from '@/lib/middleware/rbac';

export async function GET(request: NextRequest) {
  const authCheck = await requireEmployee(request);
  if (authCheck) return authCheck;
  
  // Protected logic here
}
```

**Permission-Based Protection**:
```typescript
import { withRBAC } from '@/lib/middleware/rbac';

export async function GET(request: NextRequest) {
  const rbacCheck = await withRBAC(request, {
    requiredPermissions: ['employees.read'],
  });
  
  if (rbacCheck.status !== 200) return rbacCheck;
  
  // Protected logic here
}
```

**Role-Based Protection**:
```typescript
import { withRBAC } from '@/lib/middleware/rbac';

export async function POST(request: NextRequest) {
  const rbacCheck = await withRBAC(request, {
    requiredRoles: ['HR_MANAGER', 'ADMIN'],
  });
  
  if (rbacCheck.status !== 200) return rbacCheck;
  
  // Protected logic here
}
```

**Combined Protection**:
```typescript
import { withRBAC } from '@/lib/middleware/rbac';

export async function DELETE(request: NextRequest) {
  const rbacCheck = await withRBAC(request, {
    requiredPermissions: ['employees.delete'],
    requiredRoles: ['HR_MANAGER'],
    requireAll: true, // Must have both permission AND role
  });
  
  if (rbacCheck.status !== 200) return rbacCheck;
  
  // Protected logic here
}
```

### Using RBAC Handler Wrapper

```typescript
import { createRBACHandler } from '@/lib/middleware/rbac';

export const GET = createRBACHandler(
  async (req, employee) => {
    // employee is automatically injected
    // RBAC checks already passed
    
    return NextResponse.json({
      message: 'Success',
      employee: employee.firstName,
    });
  },
  {
    requiredPermissions: ['employees.read'],
  }
);
```

---

## 🔄 View Switching Flow

### Patient → Staff View

1. User clicks "Switch to Staff View" button
2. API checks if user is an employee
3. API verifies employee status is ACTIVE
4. Cookie is set with view mode = "staff"
5. User is redirected to `/staff/dashboard`
6. Staff layout loads with employee verification
7. Staff portal displays with role-based navigation

### Staff → Patient View

1. User clicks "Switch to Patient View" button
2. Cookie is set with view mode = "patient"
3. User is redirected to `/dashboard`
4. Patient portal loads
5. Normal patient features available

### Automatic Redirects

- Non-employees trying to access `/staff/*` → Redirected to `/dashboard`
- Inactive employees trying to access `/staff/*` → Redirected to `/dashboard`
- Unauthenticated users → Redirected to `/auth/signin`

---

## 🎨 UI/UX Features

### View Switcher Button
- Shows current mode (Patient/Staff)
- Icon changes based on mode
- Loading state during switch
- Error handling with alerts
- Smooth transitions

### Staff Portal Design
- Clean, professional interface
- Consistent with patient portal
- Role-based navigation
- Quick access to common tasks
- Employee info always visible

### Navigation
- Active route highlighting
- Icon-based menu items
- Grouped by function
- Role-based visibility
- Responsive design

---

## 📚 Integration Points

### With Core Services
- ✅ EmployeeService for employee lookup
- ✅ PermissionService for permission checks
- ✅ RoleService for role validation
- ✅ AuditService for logging

### With Authentication
- ✅ NextAuth session management
- ✅ User ID to employee mapping
- ✅ Automatic session validation

### With Patient Portal
- ✅ Seamless view switching
- ✅ Shared authentication
- ✅ Consistent user experience
- ✅ Single sign-on

---

## 🎯 Next Steps

### Phase 1: API Endpoints (Next Priority)
- [ ] Employee management endpoints
- [ ] Role management endpoints
- [ ] Permission management endpoints
- [ ] Department management endpoints
- [ ] Onboarding workflow endpoints
- [ ] Audit log endpoints

### Phase 2: Staff Portal Pages
- [ ] Employee directory page
- [ ] Employee management page
- [ ] Role management page
- [ ] Onboarding tracking page
- [ ] Audit log viewer
- [ ] Analytics dashboard

### Phase 3: Seed Data
- [ ] Create seed data script
- [ ] Sample departments
- [ ] Sample roles
- [ ] Sample employees
- [ ] Sample HIPAA officers

---

## ✅ Quality Assurance

### Security
- ✅ All routes protected
- ✅ Employee verification
- ✅ Permission checks
- ✅ Audit logging
- ✅ Secure cookies

### Performance
- ✅ Efficient database queries
- ✅ Minimal middleware overhead
- ✅ Cached employee lookups
- ✅ Optimized redirects

### User Experience
- ✅ Smooth view switching
- ✅ Clear error messages
- ✅ Loading states
- ✅ Intuitive navigation
- ✅ Responsive design

---

## 🎉 Summary

Successfully implemented complete RBAC middleware system with:

- **RBAC Middleware** for route protection
- **View Switching** between patient and staff portals
- **Staff Portal** with layout, dashboard, and navigation
- **Security Checks** throughout
- **Audit Logging** integration
- **Role-Based Navigation** in staff portal

**Total**: 10 files, ~1,600 LOC

**Status**: ✅ **COMPLETE AND READY FOR API ENDPOINTS**

Next phase: Build API endpoints for employee management, roles, permissions, and onboarding.