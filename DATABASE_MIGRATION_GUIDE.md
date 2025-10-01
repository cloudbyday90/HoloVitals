# HoloVitals Database Migration Guide

## Overview

This guide provides comprehensive instructions for setting up and migrating the HoloVitals database schema. The consolidated schema includes 92 models and 45 enums covering all platform features including HIPAA compliance, EHR integrations, medical standardization, and AI capabilities.

## Prerequisites

- PostgreSQL 14+ installed and running
- Node.js 18+ and npm installed
- Prisma CLI installed (`npm install -g prisma`)
- Database credentials and connection string
- Backup of existing database (if applicable)

## Schema Overview

### Total Database Objects
- **92 Models** covering all platform functionality
- **45 Enums** for type safety and data validation
- **Multiple Indexes** for query optimization
- **Foreign Key Constraints** for data integrity

### Key Feature Areas

1. **User Management & Authentication**
   - User, UserSession, User2FA
   - Role-based access control (RBAC)
   - Multi-factor authentication

2. **Patient Management**
   - Patient, PatientRepository
   - Medical records (diagnoses, medications, allergies, etc.)
   - Family history and vital signs

3. **Document Management**
   - Document, OcrResult, ExtractedData
   - Document embeddings for AI search
   - Secure file storage with encryption

4. **EHR Integrations**
   - Epic, Cerner, Athenahealth, eClinicalWorks
   - FHIR resource management
   - Sync history and bulk exports

5. **Medical Standardization**
   - LOINC codes for lab results
   - SNOMED, RxNorm, ICD-10, CPT codes
   - Reference ranges and unit conversions

6. **HIPAA Compliance**
   - Comprehensive audit logging (7-year retention)
   - Breach incident management
   - Patient consent tracking
   - Access control and security alerts
   - Data retention policies

7. **AI & Analysis**
   - Chat conversations and analysis sessions
   - Analysis queue and task management
   - Cost tracking and optimization
   - Model performance metrics

8. **Billing & Subscriptions**
   - Subscription management
   - Token-based billing
   - Payment processing

## Migration Steps

### Step 1: Environment Setup

Create a `.env` file in the project root:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/holovitals?schema=public"
SHADOW_DATABASE_URL="postgresql://username:password@localhost:5432/holovitals_shadow?schema=public"

# Encryption Keys (generate secure random keys)
ENCRYPTION_KEY="your-32-byte-encryption-key-here"
ENCRYPTION_IV="your-16-byte-iv-here"

# Session Configuration
SESSION_SECRET="your-session-secret-here"
JWT_SECRET="your-jwt-secret-here"

# File Storage
SECURE_FILE_STORAGE_PATH="/var/holovitals/secure-files"

# Two-Factor Authentication
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="your-twilio-phone"

# Email Configuration
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-email-password"
```

### Step 2: Generate Encryption Keys

Run this script to generate secure encryption keys:

```bash
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_IV=' + require('crypto').randomBytes(16).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

### Step 3: Initialize Prisma

```bash
# Navigate to project directory
cd /path/to/holovitals

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate
```

### Step 4: Create Migration

```bash
# Create initial migration
npx prisma migrate dev --name initial_schema

# This will:
# 1. Create the migration SQL file
# 2. Apply the migration to your database
# 3. Generate the Prisma Client
```

### Step 5: Verify Migration

```bash
# Check migration status
npx prisma migrate status

# View database schema
npx prisma db pull

# Open Prisma Studio to inspect data
npx prisma studio
```

### Step 6: Seed Initial Data

Create default roles, permissions, and system configurations:

```bash
# Run seed script
npx prisma db seed
```

## Seed Data Script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'OWNER' },
      update: {},
      create: {
        name: 'OWNER',
        description: 'Platform owner with full access',
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Administrator with elevated privileges',
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'DOCTOR' },
      update: {},
      create: {
        name: 'DOCTOR',
        description: 'Healthcare provider',
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'PATIENT' },
      update: {},
      create: {
        name: 'PATIENT',
        description: 'Patient user',
        isSystem: true,
      },
    }),
  ]);

  console.log(`✅ Created ${roles.length} default roles`);

  // Create default permissions
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { name: 'READ_PHI' },
      update: {},
      create: {
        name: 'READ_PHI',
        description: 'Read protected health information',
        scope: 'PHI',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'WRITE_PHI' },
      update: {},
      create: {
        name: 'WRITE_PHI',
        description: 'Write protected health information',
        scope: 'PHI',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'DELETE_PHI' },
      update: {},
      create: {
        name: 'DELETE_PHI',
        description: 'Delete protected health information',
        scope: 'PHI',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'MANAGE_USERS' },
      update: {},
      create: {
        name: 'MANAGE_USERS',
        description: 'Manage user accounts',
        scope: 'SYSTEM',
      },
    }),
  ]);

  console.log(`✅ Created ${permissions.length} default permissions`);

  // Create default data retention policies
  const retentionPolicies = await Promise.all([
    prisma.dataRetentionPolicy.upsert({
      where: { name: 'AUDIT_LOGS' },
      update: {},
      create: {
        name: 'AUDIT_LOGS',
        description: 'HIPAA-compliant audit log retention',
        retentionPeriodDays: 2555, // 7 years
        dataType: 'AUDIT_LOG',
        isActive: true,
      },
    }),
    prisma.dataRetentionPolicy.upsert({
      where: { name: 'MEDICAL_RECORDS' },
      update: {},
      create: {
        name: 'MEDICAL_RECORDS',
        description: 'Medical record retention',
        retentionPeriodDays: 3650, // 10 years
        dataType: 'MEDICAL_RECORD',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${retentionPolicies.length} retention policies`);

  // Create default security configuration
  const securityConfig = await prisma.securityConfiguration.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      passwordMinLength: 12,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true,
      passwordExpiryDays: 90,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 30,
      sessionTimeoutMinutes: 30,
      requireMfa: false,
      allowedIpRanges: [],
      isActive: true,
    },
  });

  console.log('✅ Created default security configuration');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

## Migration for Production

### Step 1: Backup Existing Database

```bash
# PostgreSQL backup
pg_dump -h localhost -U username -d holovitals > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Prisma
npx prisma db pull --schema=./prisma/backup-schema.prisma
```

### Step 2: Deploy Migration

```bash
# Deploy to production (does not prompt)
npx prisma migrate deploy

# This will:
# 1. Apply all pending migrations
# 2. Not generate Prisma Client (do this separately)
```

### Step 3: Generate Prisma Client

```bash
# Generate client for production
npx prisma generate
```

## Rollback Procedures

### Rollback Last Migration

```bash
# Resolve and rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Then apply previous state
npx prisma migrate deploy
```

### Restore from Backup

```bash
# Drop current database
dropdb holovitals

# Create new database
createdb holovitals

# Restore from backup
psql -h localhost -U username -d holovitals < backup_20250101_120000.sql
```

## Common Issues and Solutions

### Issue 1: Migration Conflicts

**Problem:** Multiple developers created migrations simultaneously

**Solution:**
```bash
# Reset migration history
npx prisma migrate reset

# Create new baseline migration
npx prisma migrate dev --name baseline
```

### Issue 2: Schema Drift

**Problem:** Database schema doesn't match Prisma schema

**Solution:**
```bash
# Pull current database state
npx prisma db pull

# Review differences
git diff prisma/schema.prisma

# Create migration to align
npx prisma migrate dev --name fix_schema_drift
```

### Issue 3: Failed Migration

**Problem:** Migration failed mid-execution

**Solution:**
```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration-name>

# Fix the issue in schema
# Create new migration
npx prisma migrate dev --name fix_migration
```

## Performance Optimization

### Indexes

The schema includes indexes on frequently queried fields:

- User email, role
- Patient userId, mrn
- Document patientId, type
- AuditLog userId, timestamp, eventType
- EHRConnection patientId, provider
- LOINCCode loincNumber, commonName

### Query Optimization Tips

1. Use `select` to fetch only needed fields
2. Use `include` judiciously to avoid N+1 queries
3. Implement pagination for large result sets
4. Use database views for complex queries
5. Monitor slow queries with Prisma logging

## Monitoring and Maintenance

### Database Health Checks

```bash
# Check connection
npx prisma db execute --stdin <<< "SELECT 1"

# Check table sizes
npx prisma db execute --stdin <<< "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Regular Maintenance

1. **Weekly:** Review audit logs and security alerts
2. **Monthly:** Archive old audit logs per retention policy
3. **Quarterly:** Review and optimize slow queries
4. **Annually:** Review data retention policies

## Security Considerations

1. **Encryption at Rest:** Enable PostgreSQL encryption
2. **Encryption in Transit:** Use SSL/TLS for database connections
3. **Access Control:** Limit database user permissions
4. **Backup Encryption:** Encrypt database backups
5. **Audit Logging:** Enable PostgreSQL audit logging

## Support and Resources

- **Prisma Documentation:** https://www.prisma.io/docs
- **PostgreSQL Documentation:** https://www.postgresql.org/docs
- **HIPAA Compliance Guide:** See HIPAA_COMPLIANCE_DOCUMENTATION.md
- **API Documentation:** See API documentation files

## Next Steps

After completing the migration:

1. ✅ Verify all tables created successfully
2. ✅ Run seed script to populate initial data
3. ✅ Test database connections from application
4. ✅ Configure backup schedules
5. ✅ Set up monitoring and alerts
6. ✅ Document any custom configurations
7. ✅ Train team on database access procedures

---

**Last Updated:** 2025-01-01
**Version:** 1.0.0
**Maintainer:** HoloVitals Development Team