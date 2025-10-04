# Breaking Changes in v1.4.1

## Overview
Version 1.4.1 introduces comprehensive terminology changes from "patient" to "customer" throughout the entire HoloVitals platform. This is a **major breaking change** that affects all layers of the application.

## Impact Summary

- **Severity:** HIGH
- **Affected Components:** Database, API, Services, UI
- **Migration Required:** YES
- **Backward Compatibility:** NO
- **Estimated Migration Time:** 2-4 hours

## Detailed Breaking Changes

### 1. Database Schema (HIGH IMPACT)

#### Model Name Changes
All Prisma models with "Patient" prefix have been renamed to "Customer":

```prisma
// BEFORE
model PatientAllergy { ... }
model PatientMedication { ... }
model PatientDiagnosis { ... }

// AFTER
model CustomerAllergy { ... }
model CustomerMedication { ... }
model CustomerDiagnosis { ... }
```

**Impact:** 
- Requires Prisma client regeneration
- Requires database migration
- All Prisma queries must be updated

**Migration Required:** YES

#### Table Mappings
Database table names have been updated:

```sql
-- BEFORE
patient_allergies
patient_medications
patient_diagnoses

-- AFTER
customer_allergies
customer_medications
customer_diagnoses
```

**Impact:**
- Requires database migration
- Existing data will be preserved
- Foreign key relationships maintained

**Migration Required:** YES

### 2. API Endpoints (HIGH IMPACT)

#### Endpoint Path Changes

All API routes containing "patient" have been updated to "customer":

```
BEFORE                              AFTER
/api/patients                    → /api/customers
/api/patients/:id                → /api/customers/:id
/api/patients/search             → /api/customers/search
/api/patient-rights              → /api/customer-rights
/api/ehr/patients                → /api/ehr/customers
/api/audit-logs/patient/:id      → /api/audit-logs/customer/:id
```

**Impact:**
- All API clients must update endpoint URLs
- No backward compatibility provided
- 404 errors for old endpoints

**Migration Required:** YES

#### Request/Response Schema Changes

All request and response fields have been updated:

```typescript
// BEFORE
interface PatientRequest {
  patientId: string;
  patientData: PatientData;
  patientName: string;
}

// AFTER
interface CustomerRequest {
  customerId: string;
  customerData: CustomerData;
  customerName: string;
}
```

**Impact:**
- All API consumers must update field names
- Type definitions must be updated
- Validation schemas updated

**Migration Required:** YES

### 3. Service Layer (MEDIUM IMPACT)

#### Service Class Renames

```typescript
// BEFORE
import { PatientSearchService } from '@/lib/services/PatientSearchService';
import { PatientRightsService } from '@/lib/services/PatientRightsService';

// AFTER
import { CustomerSearchService } from '@/lib/services/CustomerSearchService';
import { CustomerRightsService } from '@/lib/services/CustomerRightsService';
```

**Impact:**
- Import statements must be updated
- Service instantiation code must be updated
- Method signatures remain the same

**Migration Required:** YES (for custom code)

#### Method Parameter Changes

```typescript
// BEFORE
searchService.findPatient(patientId);
rightsService.getPatientRights(patientId);

// AFTER
searchService.findCustomer(customerId);
rightsService.getCustomerRights(customerId);
```

**Impact:**
- Method calls must be updated
- Parameter names must be updated

**Migration Required:** YES (for custom code)

### 4. Frontend Components (MEDIUM IMPACT)

#### Component Renames

```tsx
// BEFORE
import { PatientCard } from '@/components/patients/PatientCard';
import { PatientList } from '@/components/patients/PatientList';
import { PatientSearch } from '@/components/patients/PatientSearch';

// AFTER
import { CustomerCard } from '@/components/patients/CustomerCard';
import { CustomerList } from '@/components/patients/CustomerList';
import { CustomerSearch } from '@/components/patients/CustomerSearch';
```

**Impact:**
- Component imports must be updated
- JSX usage must be updated
- Props remain the same structure

**Migration Required:** YES (for custom code)

#### Props Changes

```tsx
// BEFORE
<PatientCard patientId={id} patientData={data} />

// AFTER
<CustomerCard customerId={id} customerData={data} />
```

**Impact:**
- Prop names must be updated
- Component usage must be updated

**Migration Required:** YES (for custom code)

### 5. Type Definitions (MEDIUM IMPACT)

#### Interface Renames

```typescript
// BEFORE
interface PatientData { ... }
interface PatientSearchResult { ... }
interface PatientDetails { ... }

// AFTER
interface CustomerData { ... }
interface CustomerSearchResult { ... }
interface CustomerDetails { ... }
```

**Impact:**
- Type imports must be updated
- Type annotations must be updated
- Generic type parameters must be updated

**Migration Required:** YES (for custom code)

### 6. URL Routes (LOW IMPACT)

#### Frontend Routes

```typescript
// BEFORE
/dashboard/patients
/dashboard/patients/:id

// AFTER
/dashboard/customers
/dashboard/customers/:id
```

**Impact:**
- Navigation links must be updated
- Bookmarks will break
- Deep links will break

**Migration Required:** YES

## Migration Checklist

### Required Actions

- [ ] **Backup database** before migration
- [ ] **Update API client code** to use new endpoints
- [ ] **Regenerate Prisma client** (`npx prisma generate`)
- [ ] **Run database migration** (`npx prisma migrate deploy`)
- [ ] **Update custom code** using old terminology
- [ ] **Update environment variables** if referencing old names
- [ ] **Update documentation** and API specs
- [ ] **Test all integrations** thoroughly
- [ ] **Update monitoring/logging** queries
- [ ] **Notify API consumers** of breaking changes

### Optional Actions

- [ ] Update internal documentation
- [ ] Update training materials
- [ ] Update user guides
- [ ] Update marketing materials

## Compatibility Matrix

| Component | v1.4.0 | v1.4.1 | Compatible |
|-----------|--------|--------|------------|
| Database Schema | Patient* | Customer* | ❌ NO |
| API Endpoints | /patients | /customers | ❌ NO |
| Prisma Models | Patient* | Customer* | ❌ NO |
| Services | Patient* | Customer* | ❌ NO |
| Components | Patient* | Customer* | ❌ NO |
| Types | Patient* | Customer* | ❌ NO |

## Risk Assessment

### High Risk Areas

1. **Database Migration**
   - Risk: Data loss or corruption
   - Mitigation: Comprehensive backup before migration
   - Rollback: Restore from backup

2. **API Breaking Changes**
   - Risk: Service disruption for API consumers
   - Mitigation: Coordinate migration timing
   - Rollback: Revert to v1.4.0

3. **Third-party Integrations**
   - Risk: Integration failures
   - Mitigation: Test all integrations
   - Rollback: Update integration configs

### Medium Risk Areas

1. **Custom Code**
   - Risk: Compilation errors
   - Mitigation: Update all references
   - Rollback: Git revert

2. **Frontend Routes**
   - Risk: Broken bookmarks/links
   - Mitigation: Implement redirects
   - Rollback: Restore old routes

### Low Risk Areas

1. **UI Text**
   - Risk: Minimal
   - Mitigation: None required
   - Rollback: Simple text changes

## Timeline

- **Announcement:** 2 weeks before release
- **Migration Window:** 4 hours
- **Support Period:** 90 days
- **Old Version Support:** None (breaking change)

## Support

For migration assistance:
- GitHub Issues: https://github.com/cloudbyday90/HoloVitals/issues
- Documentation: See MIGRATION_GUIDE_V1.4.1.md
- Email: support@holovitals.com

## Acknowledgments

This breaking change aligns HoloVitals with consumer-focused terminology and improves clarity throughout the platform. We understand the migration effort required and have provided comprehensive documentation to assist with the transition.