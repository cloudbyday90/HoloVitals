# Quick Terminology Fix: Patient → Customer

## Files to Update for v1.4.1

### 1. Staff Header (View Switching)
**File**: `components/staff/StaffHeader.tsx`

**Change**:
```typescript
// OLD
"Switch to Patient View"
"Currently in Patient View"

// NEW
"Switch to Customer View"
"Currently in Customer View"
```

### 2. Staff Sidebar Navigation
**File**: `components/staff/StaffSidebar.tsx`

**Change**: Any references to "patients" should be "customers"

### 3. Documentation Updates

#### API Documentation
**File**: `docs/API_DOCUMENTATION_V1.4.0.md`

**Changes**:
- "Patient View" → "Customer View"
- "patient accounts" → "customer accounts"
- "patient portal" → "customer portal"

#### User Guide
**File**: `docs/STAFF_PORTAL_USER_GUIDE.md`

**Changes**:
- All references to "Patient View" → "Customer View"
- "patient-facing features" → "customer-facing features"

#### Changelog
**File**: `CHANGELOG_V1.4.0.md`

**Changes**:
- "View switching between patient and staff portals" → "View switching between customer and staff portals"

#### Architecture Docs
**File**: `docs/EMPLOYEE_ONBOARDING_RBAC_ARCHITECTURE.md`

**Changes**:
- "Patient accounts completely separate from employee accounts" → "Customer accounts completely separate from employee accounts"

### 4. README Updates
**File**: `README.md` (if exists)

**Changes**:
- Update any references to "patient" to "customer"
- Clarify business model: Medical AI Assistant platform, not healthcare provider

### 5. View Mode Utilities
**File**: `lib/utils/viewMode.ts` (if exists)

**Changes**:
```typescript
// OLD
export const VIEW_MODES = {
  PATIENT: 'patient',
  STAFF: 'staff'
}

// NEW
export const VIEW_MODES = {
  CUSTOMER: 'customer',
  STAFF: 'staff'
}
```

## Implementation Script

```bash
# Find all instances of "patient view" (case insensitive)
grep -ri "patient view" --include="*.tsx" --include="*.ts" --include="*.md"

# Find all instances of "patient portal"
grep -ri "patient portal" --include="*.tsx" --include="*.ts" --include="*.md"

# Find all instances of "patient-facing"
grep -ri "patient-facing" --include="*.tsx" --include="*.ts" --include="*.md"
```

## Testing Checklist

After making changes:
- [ ] Verify rocket button shows "Customer View" / "Staff View"
- [ ] Check all navigation labels
- [ ] Review all documentation
- [ ] Test view switching functionality
- [ ] Ensure no broken references

## Notes

- Keep internal variable names for now (backward compatibility)
- Focus on user-facing text only
- Database schema remains unchanged
- API endpoints remain unchanged
- This is a UI/documentation update only

---

**Priority**: High  
**Estimated Time**: 1-2 hours  
**Breaking Changes**: None  
**Version**: v1.4.1