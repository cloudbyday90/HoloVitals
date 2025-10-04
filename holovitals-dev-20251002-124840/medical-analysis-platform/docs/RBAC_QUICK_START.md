# RBAC Quick Start Guide

## For Developers

### Protecting an API Endpoint

```typescript
// app/api/your-endpoint/route.ts
import { requireOwner, requireAdmin, requirePermission } from '@/lib/middleware/auth';
import { Permission } from '@/lib/types/rbac';

// OWNER only
export async function GET(req: NextRequest) {
  const user = await requireOwner(req);
  if (user instanceof NextResponse) return user;
  
  // Your logic here
}

// ADMIN or higher
export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;
  
  // Your logic here
}

// Specific permission
export async function PUT(req: NextRequest) {
  const user = await requirePermission(req, Permission.MANAGE_USERS);
  if (user instanceof NextResponse) return user;
  
  // Your logic here
}
```

### Protecting UI Components

```tsx
import { OwnerOnly, AdminOnly, HasPermission } from '@/components/ui/RoleGuard';
import { Permission } from '@/lib/types/rbac';

export default function MyPage() {
  return (
    <div>
      {/* Everyone can see this */}
      <PublicContent />
      
      {/* Only OWNER can see this */}
      <OwnerOnly>
        <FinancialDashboard />
      </OwnerOnly>
      
      {/* ADMIN and OWNER can see this */}
      <AdminOnly>
        <UserManagement />
      </AdminOnly>
      
      {/* Users with specific permission */}
      <HasPermission permission={Permission.VIEW_COSTS}>
        <CostChart />
      </HasPermission>
    </div>
  );
}
```

### Using the Hook

```tsx
import { useRoleGuard } from '@/components/ui/RoleGuard';
import { Permission } from '@/lib/types/rbac';

export default function MyComponent() {
  const { isOwner, isAdmin, hasPermission } = useRoleGuard();
  
  return (
    <div>
      {isOwner && <OwnerControls />}
      {isAdmin && <AdminControls />}
      {hasPermission(Permission.VIEW_COSTS) && <CostData />}
    </div>
  );
}
```

## For System Administrators

### Setting User Roles

```sql
-- Set user as OWNER (only one owner should exist)
UPDATE "User" SET "role" = 'OWNER' WHERE "email" = 'owner@holovitals.com';

-- Set user as ADMIN
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'admin@holovitals.com';

-- Set user as DOCTOR
UPDATE "User" SET "role" = 'DOCTOR' WHERE "email" = 'doctor@holovitals.com';

-- Set user as PATIENT (default)
UPDATE "User" SET "role" = 'PATIENT' WHERE "email" = 'patient@holovitals.com';
```

### Viewing Access Logs

```sql
-- View all access attempts by a user
SELECT * FROM "AccessLog" 
WHERE "userId" = 'user-id-here' 
ORDER BY "timestamp" DESC 
LIMIT 100;

-- View failed access attempts
SELECT * FROM "AccessLog" 
WHERE "allowed" = false 
ORDER BY "timestamp" DESC 
LIMIT 100;

-- View financial data access
SELECT * FROM "AccessLog" 
WHERE "resourceType" = 'FINANCIAL' 
ORDER BY "timestamp" DESC;
```

## Protected Routes Reference

### OWNER Only
- `/dashboard/costs` - Cost dashboard
- `/dashboard/financials` - Financial reports
- `/api/costs/*` - Cost API endpoints
- `/api/financials/*` - Financial API endpoints

### ADMIN or OWNER
- `/dashboard/admin` - Admin dashboard
- `/dashboard/users` - User management
- `/dashboard/instances` - Instance management
- `/dashboard/queue` - Queue management
- `/api/admin/*` - Admin API endpoints
- `/api/instances/*` - Instance API endpoints
- `/api/queue/*` - Queue API endpoints

### All Authenticated Users
- `/dashboard` - Overview
- `/dashboard/documents` - Document management
- `/dashboard/chat` - AI chat interface
- `/api/documents/*` - Document API endpoints
- `/api/chat/*` - Chat API endpoints

## Common Scenarios

### Scenario 1: User tries to access costs page
- **User Role:** PATIENT
- **Result:** Redirected to `/dashboard/access-denied`
- **Logged:** Yes, with reason "Required role: OWNER, User role: PATIENT"

### Scenario 2: Admin tries to access financial API
- **User Role:** ADMIN
- **Result:** 403 Forbidden response
- **Logged:** Yes, with reason "Only owner can access financial data"

### Scenario 3: Owner accesses cost data
- **User Role:** OWNER
- **Result:** Success, data returned
- **Logged:** Yes, with reason "Owner accessing financial data"

## Troubleshooting

### User can't access a page they should have access to

1. Check user role in database:
```sql
SELECT "id", "email", "role" FROM "User" WHERE "email" = 'user@example.com';
```

2. Check access logs:
```sql
SELECT * FROM "AccessLog" 
WHERE "userId" = 'user-id' 
ORDER BY "timestamp" DESC 
LIMIT 10;
```

3. Verify role permissions in code:
```typescript
import { ROLE_PERMISSIONS } from '@/lib/types/rbac';
console.log(ROLE_PERMISSIONS[UserRole.ADMIN]);
```

### Access logs not being created

1. Check if AccessLog table exists:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'AccessLog';
```

2. Run migration if needed:
```bash
cd medical-analysis-platform
psql -U holovitals_user -d holovitals -f prisma/migrations/add_user_roles.sql
```

### Role changes not taking effect

1. Clear user session:
```typescript
// In your code
await signOut();
```

2. Verify role in database:
```sql
SELECT "role" FROM "User" WHERE "id" = 'user-id';
```

3. Check middleware is running:
```typescript
// middleware.ts should be in root of project
// Verify it's being executed by adding console.log
```

## Security Checklist

- [ ] Only ONE user should have OWNER role
- [ ] OWNER credentials are secure and not shared
- [ ] All financial endpoints use `protectCostEndpoint` or `requireOwner`
- [ ] All admin endpoints use `requireAdmin` or higher
- [ ] UI components use appropriate guards (OwnerOnly, AdminOnly)
- [ ] Access logs are being created for sensitive operations
- [ ] Regular audit of access logs for suspicious activity
- [ ] User roles are reviewed periodically
- [ ] Unused admin/owner accounts are disabled

## Next Steps

1. **Set up your OWNER account:**
   ```sql
   UPDATE "User" SET "role" = 'OWNER' WHERE "email" = 'your-email@example.com';
   ```

2. **Test access control:**
   - Try accessing `/dashboard/costs` as PATIENT (should be denied)
   - Try accessing `/dashboard/costs` as OWNER (should work)

3. **Review access logs:**
   ```sql
   SELECT * FROM "AccessLog" ORDER BY "timestamp" DESC LIMIT 20;
   ```

4. **Set up additional admins if needed:**
   ```sql
   UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'admin@example.com';
   ```

For more details, see [RBAC_IMPLEMENTATION.md](./RBAC_IMPLEMENTATION.md)