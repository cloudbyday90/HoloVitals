# Role-Based Access Control (RBAC) Implementation

## Overview

HoloVitals implements a comprehensive Role-Based Access Control (RBAC) system to protect sensitive financial, administrative, and operational data. This ensures that only authorized users can access specific resources and functionality.

## User Roles

### Role Hierarchy

```
OWNER (Level 100)
  └── ADMIN (Level 80)
      └── DOCTOR (Level 60)
          └── SUPPORT (Level 40)
              └── ANALYST (Level 30)
                  └── PATIENT (Level 20)
```

### Role Definitions

#### 1. OWNER
- **Access Level:** Full access to everything
- **Primary Use:** Platform owner/founder
- **Key Permissions:**
  - View all financial data (costs, revenue, expenses)
  - Access system-wide statistics
  - Manage all users and roles
  - View and export all data
  - Configure system settings
  - Access audit logs

#### 2. ADMIN
- **Access Level:** Administrative access (no financial data)
- **Primary Use:** System administrators
- **Key Permissions:**
  - View system statistics
  - Manage users (except role changes)
  - Provision and manage cloud instances
  - Manage task queue
  - View all patient data (with consent)
  - Access audit logs

#### 3. DOCTOR
- **Access Level:** Medical professional access
- **Primary Use:** Healthcare providers
- **Key Permissions:**
  - View patient data (with explicit consent)
  - Upload and manage documents
  - Use AI chatbot
  - Provision instances for analysis
  - View own data and conversations

#### 4. PATIENT
- **Access Level:** Personal data only
- **Primary Use:** End users
- **Key Permissions:**
  - View and manage own data
  - Upload and manage own documents
  - Use AI chatbot
  - View own conversations
  - Grant/revoke consent to doctors

#### 5. SUPPORT
- **Access Level:** Customer support access
- **Primary Use:** Customer service representatives
- **Key Permissions:**
  - View all users (limited info)
  - View patient data (with consent)
  - View documents and conversations (read-only)
  - No modification permissions

#### 6. ANALYST
- **Access Level:** Anonymized data only
- **Primary Use:** Data analysts
- **Key Permissions:**
  - View anonymized analytics
  - Export anonymized data
  - View system statistics (no PII)
  - No access to individual patient data

---

## Protected Resources

### Financial Data (OWNER Only)

**Routes:**
- `/dashboard/costs` - Cost dashboard
- `/dashboard/financials` - Financial reports
- `/api/costs/*` - Cost API endpoints
- `/api/financials/*` - Financial API endpoints

**Data Protected:**
- Operating costs
- Revenue data
- Expense tracking
- Cost per user
- Profit margins
- Financial projections

### Administrative Data (OWNER/ADMIN)

**Routes:**
- `/dashboard/admin` - Admin dashboard
- `/dashboard/users` - User management
- `/api/admin/*` - Admin API endpoints

**Data Protected:**
- System-wide statistics
- User management
- System configuration
- Audit logs

### Infrastructure Management (OWNER/ADMIN)

**Routes:**
- `/dashboard/instances` - Instance management
- `/dashboard/queue` - Queue management
- `/api/instances/*` - Instance API endpoints
- `/api/queue/*` - Queue API endpoints

**Data Protected:**
- Cloud instance provisioning
- Task queue management
- Resource allocation
- System performance metrics

---

## Implementation Components

### 1. Type Definitions (`lib/types/rbac.ts`)

Defines:
- User roles enum
- Permissions enum
- Role-permission mappings
- Resource types
- Access control context
- Access decisions

### 2. Access Control Service (`lib/services/AccessControlService.ts`)

**Key Methods:**
- `hasPermission(role, permission)` - Check single permission
- `hasAnyPermission(role, permissions)` - Check if user has any permission
- `hasAllPermissions(role, permissions)` - Check if user has all permissions
- `canAccessResource(context)` - Check resource-specific access
- `logAccess(context, action, decision)` - Audit logging

**Resource Access Control:**
- Patient data access (with consent checking)
- Document access (ownership verification)
- Conversation access (ownership verification)
- Financial data access (OWNER only)
- Instance access (ownership or admin)

### 3. Authentication Middleware (`lib/middleware/auth.ts`)

**Functions:**
- `requireAuth(req)` - Require authentication
- `requireRole(req, role)` - Require specific role
- `requireOwner(req)` - Require OWNER role
- `requireAdmin(req)` - Require ADMIN or higher
- `requirePermission(req, permission)` - Require specific permission
- `requireResourceAccess(req, resourceType, resourceId, permissions)` - Require resource access
- `protectFinancialEndpoint(req)` - Protect financial endpoints
- `protectCostEndpoint(req)` - Protect cost endpoints

### 4. Global Middleware (`middleware.ts`)

**Features:**
- Route-based protection
- Automatic role checking
- Redirect to access denied page
- API endpoint protection (401/403 responses)
- User context injection into request headers

### 5. UI Components

#### RoleGuard Component (`components/ui/RoleGuard.tsx`)

**Usage:**
```tsx
// Require specific role
<RoleGuard requiredRole={UserRole.OWNER}>
  <FinancialDashboard />
</RoleGuard>

// Require specific permission
<RoleGuard requiredPermission={Permission.VIEW_COSTS}>
  <CostChart />
</RoleGuard>

// Require any permission
<RoleGuard requiredPermissions={[Permission.VIEW_COSTS, Permission.VIEW_FINANCIALS]} requireAll={false}>
  <FinancialData />
</RoleGuard>
```

**Convenience Components:**
```tsx
<OwnerOnly>
  <FinancialDashboard />
</OwnerOnly>

<AdminOnly>
  <UserManagement />
</AdminOnly>

<DoctorOnly>
  <PatientRecords />
</DoctorOnly>

<HasPermission permission={Permission.VIEW_COSTS}>
  <CostChart />
</HasPermission>
```

#### useRoleGuard Hook

```tsx
const { isOwner, isAdmin, hasPermission } = useRoleGuard();

if (isOwner) {
  // Show owner-only content
}

if (hasPermission(Permission.VIEW_COSTS)) {
  // Show cost data
}
```

### 6. Access Denied Page (`app/dashboard/access-denied/page.tsx`)

**Features:**
- Shows attempted path
- Displays current vs required role
- Provides explanation
- Offers navigation back to dashboard
- Contact support option

---

## API Protection Examples

### Protecting Cost Endpoints

```typescript
// app/api/costs/route.ts
import { protectCostEndpoint } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  // Protect endpoint - OWNER only
  const user = await protectCostEndpoint(req);
  if (user instanceof NextResponse) {
    return user; // Return error response
  }

  // User is OWNER, proceed with logic
  const costs = await getCostData();
  return NextResponse.json(costs);
}
```

### Protecting Admin Endpoints

```typescript
// app/api/admin/users/route.ts
import { requireAdmin } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) {
    return user;
  }

  // User is ADMIN or OWNER
  const users = await getAllUsers();
  return NextResponse.json(users);
}
```

### Protecting Resource Access

```typescript
// app/api/documents/[id]/route.ts
import { requireResourceAccess } from '@/lib/middleware/auth';
import { ResourceType, Permission } from '@/lib/types/rbac';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireResourceAccess(
    req,
    ResourceType.DOCUMENT,
    params.id,
    [Permission.VIEW_OWN_DOCUMENTS]
  );
  
  if (user instanceof NextResponse) {
    return user;
  }

  // User has access to this document
  const document = await getDocument(params.id);
  return NextResponse.json(document);
}
```

---

## UI Protection Examples

### Sidebar Navigation

```tsx
// components/layout/Sidebar.tsx
const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home, public: true },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText, public: true },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare, public: true },
  { name: 'Queue', href: '/dashboard/queue', icon: ListTodo, adminOnly: true },
  { name: 'Instances', href: '/dashboard/instances', icon: Server, adminOnly: true },
  { name: 'Costs', href: '/dashboard/costs', icon: DollarSign, ownerOnly: true },
];

// Render with protection
{navigation.map((item) => {
  if (item.ownerOnly) {
    return (
      <OwnerOnly key={item.name}>
        <NavLink {...item} />
      </OwnerOnly>
    );
  }
  
  if (item.adminOnly) {
    return (
      <AdminOnly key={item.name}>
        <NavLink {...item} />
      </AdminOnly>
    );
  }
  
  return <NavLink key={item.name} {...item} />;
})}
```

### Dashboard Components

```tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div>
      {/* Public stats - everyone can see */}
      <StatsCard title="My Documents" value={documents.length} />
      
      {/* Admin stats - ADMIN and OWNER only */}
      <AdminOnly>
        <StatsCard title="Total Users" value={totalUsers} />
        <StatsCard title="Active Tasks" value={activeTasks} />
      </AdminOnly>
      
      {/* Financial stats - OWNER only */}
      <OwnerOnly>
        <StatsCard title="Monthly Revenue" value={revenue} />
        <StatsCard title="Operating Costs" value={costs} />
      </OwnerOnly>
    </div>
  );
}
```

---

## Audit Logging

### Access Logging

All access attempts are logged with:
- User ID and role
- Action performed
- Resource type and ID
- Permission checked
- Access decision (allowed/denied)
- Reason for decision
- IP address
- User agent
- Timestamp

### Suspicious Activity Detection

The system automatically detects:
- Multiple failed access attempts (>5 in 1 hour)
- Unusual access patterns
- Access to resources outside normal scope
- Rapid sequential access attempts

### Audit Log Queries

```typescript
// Get user access logs
const logs = await accessControl.getUserAccessLogs(userId, 100);

// Get suspicious access patterns
const suspicious = await accessControl.getSuspiciousAccess(60); // Last 60 minutes
```

---

## Security Best Practices

### 1. Principle of Least Privilege
- Users only get permissions they need
- Default to most restrictive access
- Explicit permission grants required

### 2. Defense in Depth
- Multiple layers of protection:
  1. Global middleware (route-level)
  2. API middleware (endpoint-level)
  3. Service-level checks (resource-level)
  4. UI guards (component-level)

### 3. Audit Everything
- All access attempts logged
- Failed attempts tracked
- Suspicious patterns detected
- Complete audit trail maintained

### 4. Explicit Consent
- Doctors need patient consent
- Time-limited access grants
- Revocable at any time
- Complete consent audit trail

### 5. Data Segregation
- Financial data completely isolated
- Only OWNER can access
- No shared access with other roles
- Separate API endpoints

---

## Testing Access Control

### Unit Tests

```typescript
describe('AccessControlService', () => {
  it('should allow OWNER to access financial data', () => {
    const decision = accessControl.canAccessFinancialData(UserRole.OWNER);
    expect(decision.allowed).toBe(true);
  });

  it('should deny ADMIN access to financial data', () => {
    const decision = accessControl.canAccessFinancialData(UserRole.ADMIN);
    expect(decision.allowed).toBe(false);
  });

  it('should allow PATIENT to access own documents', async () => {
    const decision = await accessControl.canAccessDocument(
      UserRole.PATIENT,
      'user-123',
      'doc-owned-by-user-123'
    );
    expect(decision.allowed).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Cost API', () => {
  it('should return 403 for non-owner users', async () => {
    const response = await fetch('/api/costs', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(response.status).toBe(403);
  });

  it('should return cost data for owner', async () => {
    const response = await fetch('/api/costs', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.costs).toBeDefined();
  });
});
```

---

## Migration Guide

### Adding New Protected Routes

1. **Define route in middleware.ts:**
```typescript
const PROTECTED_ROUTES = {
  OWNER_ONLY: [
    '/dashboard/costs',
    '/dashboard/financials',
    '/your-new-route', // Add here
  ],
};
```

2. **Protect API endpoint:**
```typescript
export async function GET(req: NextRequest) {
  const user = await requireOwner(req);
  if (user instanceof NextResponse) return user;
  // Your logic here
}
```

3. **Protect UI component:**
```tsx
<OwnerOnly>
  <YourNewComponent />
</OwnerOnly>
```

### Adding New Permissions

1. **Add to Permission enum:**
```typescript
export enum Permission {
  // ... existing permissions
  YOUR_NEW_PERMISSION = 'YOUR_NEW_PERMISSION',
}
```

2. **Add to role mappings:**
```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
    // ... existing permissions
    Permission.YOUR_NEW_PERMISSION,
  ],
};
```

3. **Use in code:**
```typescript
const user = await requirePermission(req, Permission.YOUR_NEW_PERMISSION);
```

---

## Summary

The RBAC system provides:
- ✅ **Complete financial data protection** (OWNER only)
- ✅ **Administrative access control** (OWNER/ADMIN)
- ✅ **Resource-level permissions** (ownership verification)
- ✅ **Comprehensive audit logging** (all access tracked)
- ✅ **UI and API protection** (multiple layers)
- ✅ **Flexible permission system** (easy to extend)
- ✅ **HIPAA compliance** (consent management, audit trails)

This ensures that sensitive business information remains private while maintaining proper access control for all user types.