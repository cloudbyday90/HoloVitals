# HoloVitals v1.4.1 Migration Guide

## Overview
Version 1.4.1 introduces a comprehensive terminology update from "patient" to "customer" throughout the entire codebase. This is a **breaking change** that affects database schema, API endpoints, and client code.

## Breaking Changes

### 1. Database Schema Changes

All Prisma models have been renamed from `Patient*` to `Customer*`:

| Old Model Name | New Model Name |
|----------------|----------------|
| `PatientAccessRequest` | `CustomerAccessRequest` |
| `PatientAllergy` | `CustomerAllergy` |
| `PatientAmendmentRequest` | `CustomerAmendmentRequest` |
| `PatientCommunicationRequest` | `CustomerCommunicationRequest` |
| `PatientConsent` | `CustomerConsent` |
| `PatientDiagnosis` | `CustomerDiagnosis` |
| `PatientFamilyHistory` | `CustomerFamilyHistory` |
| `PatientImmunization` | `CustomerImmunization` |
| `PatientMedication` | `CustomerMedication` |
| `PatientProcedure` | `CustomerProcedure` |
| `PatientRepository` | `CustomerRepository` |
| `PatientVitalSign` | `CustomerVitalSign` |

**Database table names remain unchanged** (using `@@map` directives) to preserve existing data:
- `patient_allergies` → `customer_allergies`
- `patient_medications` → `customer_medications`
- etc.

### 2. API Endpoint Changes

API routes have been updated to use "customer" terminology:

| Old Endpoint | New Endpoint |
|--------------|--------------|
| `/api/patients/*` | `/api/customers/*` |
| `/api/patient-rights/*` | `/api/customer-rights/*` |
| `/api/ehr/patients/*` | `/api/ehr/customers/*` |
| `/api/audit-logs/patient/*` | `/api/audit-logs/customer/*` |

### 3. Request/Response Field Changes

All API request and response fields have been updated:

| Old Field | New Field |
|-----------|-----------|
| `patientId` | `customerId` |
| `patientData` | `customerData` |
| `patientName` | `customerName` |
| `patientEmail` | `customerEmail` |
| `patients` | `customers` |

### 4. Service Class Changes

Service classes have been renamed:

| Old Service | New Service |
|-------------|-------------|
| `PatientRightsService` | `CustomerRightsService` |
| `PatientSearchService` | `CustomerSearchService` |

### 5. Component Changes

React components have been renamed:

| Old Component | New Component |
|---------------|---------------|
| `PatientCard` | `CustomerCard` |
| `PatientDetailView` | `CustomerDetailView` |
| `PatientList` | `CustomerList` |
| `PatientSearch` | `CustomerSearch` |
| `PatientSearchBar` | `CustomerSearchBar` |

## Migration Steps

### For Developers

#### 1. Update Your Local Repository

```bash
# Pull the latest changes
git checkout main
git pull origin main

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

#### 2. Run Database Migration

```bash
# Create migration
npx prisma migrate dev --name terminology_update_v1_4_1

# Or apply existing migration
npx prisma migrate deploy
```

#### 3. Update Your Code

If you have custom code that references the old terminology:

**TypeScript/JavaScript:**
```typescript
// Old
import { PatientSearchService } from '@/lib/services/PatientSearchService';
const patient = await prisma.patientAllergy.findMany();

// New
import { CustomerSearchService } from '@/lib/services/CustomerSearchService';
const customer = await prisma.customerAllergy.findMany();
```

**API Calls:**
```typescript
// Old
fetch('/api/patients/123')
fetch('/api/patient-rights/access')

// New
fetch('/api/customers/123')
fetch('/api/customer-rights/access')
```

**React Components:**
```tsx
// Old
import { PatientCard } from '@/components/patients/PatientCard';
<PatientCard patientId={id} />

// New
import { CustomerCard } from '@/components/patients/CustomerCard';
<CustomerCard customerId={id} />
```

### For API Consumers

#### 1. Update API Endpoints

All API endpoints using "patient" must be updated to use "customer":

```bash
# Old
GET /api/patients/search?query=john
POST /api/patients/123/medications

# New
GET /api/customers/search?query=john
POST /api/customers/123/medications
```

#### 2. Update Request Bodies

```json
// Old
{
  "patientId": "123",
  "patientName": "John Doe",
  "patientEmail": "john@example.com"
}

// New
{
  "customerId": "123",
  "customerName": "John Doe",
  "customerEmail": "john@example.com"
}
```

#### 3. Update Response Parsing

```typescript
// Old
const { patientId, patientData } = response.data;

// New
const { customerId, customerData } = response.data;
```

### For Database Administrators

#### 1. Backup Your Database

```bash
# PostgreSQL
pg_dump -U username -d holovitals > backup_before_v1.4.1.sql

# MySQL
mysqldump -u username -p holovitals > backup_before_v1.4.1.sql
```

#### 2. Review Migration SQL

Before applying the migration, review the generated SQL:

```bash
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script > migration_preview.sql
```

#### 3. Apply Migration

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

#### 4. Verify Migration

```sql
-- Check table names
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'customer_%';

-- Verify data integrity
SELECT COUNT(*) FROM customer_allergies;
SELECT COUNT(*) FROM customer_medications;
```

## Rollback Plan

If you need to rollback to v1.4.0:

### 1. Revert Code Changes

```bash
git checkout v1.4.0
npm install
npx prisma generate
```

### 2. Restore Database

```bash
# PostgreSQL
psql -U username -d holovitals < backup_before_v1.4.1.sql

# MySQL
mysql -u username -p holovitals < backup_before_v1.4.1.sql
```

### 3. Verify Rollback

```bash
# Check application health
npm run build
npm run test
```

## Testing Checklist

After migration, verify the following:

- [ ] Application builds successfully
- [ ] Database migrations applied without errors
- [ ] API endpoints respond correctly
- [ ] UI displays customer data properly
- [ ] Search functionality works
- [ ] EHR integrations function correctly
- [ ] Audit logs capture events properly
- [ ] RBAC permissions work as expected

## Common Issues

### Issue 1: Prisma Client Not Updated

**Symptom:** TypeScript errors about missing `customer*` models

**Solution:**
```bash
npx prisma generate
```

### Issue 2: API 404 Errors

**Symptom:** API calls return 404 Not Found

**Solution:** Update API endpoint URLs from `/api/patients/*` to `/api/customers/*`

### Issue 3: Database Migration Fails

**Symptom:** Migration errors during `prisma migrate deploy`

**Solution:**
1. Check database connection
2. Verify user permissions
3. Review migration SQL for conflicts
4. Restore from backup if necessary

## Support

If you encounter issues during migration:

1. Check the [GitHub Issues](https://github.com/cloudbyday90/HoloVitals/issues)
2. Review the [CHANGELOG](CHANGELOG_V1.4.1.md)
3. Contact the development team

## Timeline

- **v1.4.1 Release Date:** TBD
- **Migration Support Period:** 90 days
- **Deprecation of Old Endpoints:** None (breaking change)

## Additional Resources

- [Full Changelog](CHANGELOG_V1.4.1.md)
- [Breaking Changes Document](BREAKING_CHANGES_V1.4.1.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)