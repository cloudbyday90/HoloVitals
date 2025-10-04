# Phase 2: Database Setup - Complete Guide

## Overview

Phase 2 focuses on setting up the complete database schema for HoloVitals, including all tables for the AI architecture, patient repositories, and existing platform features.

## What Was Completed

### 1. Database Schema Consolidation ✅

**File:** `medical-analysis-platform/prisma/schema.prisma`

**Total Tables:** 40+ tables organized into logical groups:

#### Core User Management (5 tables)
- `User` - User accounts with MFA support
- `Patient` - Patient profiles
- `UserSession` - Authentication sessions
- `ConsentGrant` - Consent management
- `AccessLog` - Consent-based access tracking

#### Document Management (6 tables)
- `Document` - Medical document storage
- `OcrResult` - OCR extraction results
- `ExtractedData` - Structured data extraction
- `DocumentLink` - Document relationships
- `DocumentEmbedding` - Vector embeddings
- `AnalysisSession` - Legacy analysis sessions

#### AI Chat System (2 tables)
- `ChatConversation` - Chat sessions
- `ChatMessage` - Individual messages with escalation tracking

#### Analysis Queue System (1 table)
- `AnalysisQueue` - Priority-based task queue with context optimization

#### Cloud Infrastructure (2 tables)
- `CloudInstance` - Ephemeral instance tracking
- `InstanceCost` - Instance cost tracking

#### Cost Tracking (2 tables)
- `ChatbotCost` - Lightweight chatbot costs
- `AnalysisCost` - Heavy analysis costs

#### Context Optimization (2 tables)
- `PromptOptimization` - Prompt optimization tracking
- `PromptSplit` - Split prompt management

#### Performance Monitoring (2 tables)
- `ModelPerformance` - AI model metrics
- `SystemHealth` - System component health

#### Patient Repository (9 tables)
- `PatientRepository` - Sandboxed patient data
- `PatientDiagnosis` - Medical diagnoses
- `PatientMedication` - Medications
- `PatientAllergy` - Allergies
- `PatientVitalSign` - Vital signs
- `PatientProcedure` - Procedures
- `PatientImmunization` - Immunizations
- `PatientFamilyHistory` - Family history
- `IdentityChallenge` - Identity verification

#### Audit & Compliance (4 tables)
- `AuditLog` - HIPAA-compliant audit trail
- `Notification` - User notifications
- `SecurityAlert` - Security alerts
- `AiInteraction` - Legacy AI interactions

### 2. Database Setup Scripts ✅

**Created Files:**

1. **`scripts/setup-database.sh`**
   - Automated database setup
   - Migration creation and application
   - Database seeding
   - Schema verification

2. **`prisma/seed.ts`**
   - Test user creation
   - Test patient creation
   - Model performance data
   - System health monitoring data

3. **`.env.example`** (updated)
   - Database configuration
   - AI service keys
   - Cloud provider credentials
   - Application settings

### 3. Package Configuration ✅

**Updated `package.json`:**
- Added `db:seed` script
- Added `db:setup` script (complete setup)
- Added Prisma seed configuration
- Installed `ts-node` and `@types/bcrypt`

### 4. Prisma Client Generation ✅

- Generated Prisma Client with all models
- Type-safe database access
- Auto-completion support

## Database Schema Highlights

### Key Features

#### 1. Dual AI Architecture Support
```prisma
// Lightweight chatbot
model ChatConversation {
  messages  ChatMessage[]
}

// Heavy-duty analysis
model AnalysisQueue {
  priority  Int
  status    String
  instance  CloudInstance?
}
```

#### 2. Ephemeral Instance Tracking
```prisma
model CloudInstance {
  provider     String
  instanceType String
  status       String
  createdAt    DateTime
  terminatedAt DateTime?
  totalCost    Float
}
```

#### 3. Comprehensive Cost Tracking
```prisma
model ChatbotCost {
  inputTokens  Int
  outputTokens Int
  cost         Float
}

model AnalysisCost {
  modelCost           Float
  infrastructureCost  Float
  totalCost           Float
}
```

#### 4. Context Optimization
```prisma
model PromptOptimization {
  originalTokens   Int
  optimizedTokens  Int
  tokenReduction   Int
  reductionPercent Float
}

model PromptSplit {
  taskId       String
  splitId      String
  order        Int
  dependencies Json
}
```

#### 5. Patient Repository (Sandboxed)
```prisma
model PatientRepository {
  userId                String @unique
  compositeIdentityHash String @unique
  encryptedPersonalInfo String
  
  diagnoses      PatientDiagnosis[]
  medications    PatientMedication[]
  allergies      PatientAllergy[]
  vitalSigns     PatientVitalSign[]
}
```

#### 6. HIPAA Compliance
```prisma
model AuditLog {
  userId     String
  action     String
  resource   String
  severity   String
  timestamp  DateTime
}

model ConsentGrant {
  patientId    String
  specialistId String
  permissions  String
  expiresAt    DateTime
  status       String
}
```

## Setup Instructions

### Prerequisites

1. **PostgreSQL 14+** installed and running
2. **Node.js 18+** installed
3. **npm** or **yarn** package manager

### Step 1: Environment Configuration

Create `.env` file from template:

```bash
cp .env.example .env
```

Update the following variables:

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/holovitals"
OPENAI_API_KEY="sk-..."

# Optional (for full functionality)
AZURE_OPENAI_KEY="..."
ANTHROPIC_API_KEY="..."
AZURE_SUBSCRIPTION_ID="..."
```

### Step 2: Install Dependencies

```bash
cd medical-analysis-platform
npm install
```

### Step 3: Database Setup

**Option A: Automated Setup (Recommended)**

```bash
npm run db:setup
```

This will:
1. Generate Prisma Client
2. Create and apply migrations
3. Seed the database with test data

**Option B: Manual Setup**

```bash
# Generate Prisma Client
npm run db:generate

# Create migration
npm run db:migrate

# Seed database
npm run db:seed
```

**Option C: Using Shell Script**

```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

### Step 4: Verify Setup

```bash
# Open Prisma Studio to view data
npm run db:studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all tables
- Browse seeded data
- Test queries
- Verify relationships

### Step 5: Test Database Connection

Create a test file `test-db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Test user query
  const users = await prisma.user.findMany();
  console.log('Users:', users.length);
  
  // Test model performance query
  const models = await prisma.modelPerformance.findMany();
  console.log('Models:', models.length);
  
  // Test system health query
  const health = await prisma.systemHealth.findMany();
  console.log('Health checks:', health.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run test:

```bash
npx ts-node test-db.ts
```

## Database Migrations

### Creating New Migrations

When you modify the schema:

```bash
npm run db:migrate
```

This will:
1. Detect schema changes
2. Generate migration SQL
3. Apply migration to database
4. Update Prisma Client

### Migration Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations** in development first
3. **Review generated SQL** before applying
4. **Use descriptive names** for migrations
5. **Never edit** applied migrations

### Rollback Migrations

If needed, rollback to a previous migration:

```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

## Database Seeding

### Default Seed Data

The seed script creates:

1. **Test User**
   - Email: `test@holovitals.com`
   - Password: `TestPassword123!`
   - MFA: Disabled

2. **Test Patient**
   - Name: John Doe
   - DOB: 1990-01-01

3. **Model Performance Data**
   - GPT-3.5 Turbo
   - GPT-4 Turbo
   - Claude 3 Opus
   - Claude 3 Sonnet

4. **System Health Data**
   - All components (chatbot, queue, provisioner, etc.)
   - Initial healthy status

### Custom Seeding

Add custom seed data in `prisma/seed.ts`:

```typescript
// Add your custom seed data
const customUser = await prisma.user.create({
  data: {
    email: 'custom@example.com',
    passwordHash: await bcrypt.hash('password', 12),
  },
});
```

Run seed:

```bash
npm run db:seed
```

## Database Maintenance

### Backup Database

```bash
# PostgreSQL backup
pg_dump holovitals > backup.sql

# Restore from backup
psql holovitals < backup.sql
```

### Reset Database

**⚠️ Warning: This deletes all data!**

```bash
# Reset and reseed
npx prisma migrate reset
```

### Update Prisma Client

After schema changes:

```bash
npm run db:generate
```

## Common Issues & Solutions

### Issue 1: Connection Refused

**Error:** `Can't reach database server`

**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Check firewall settings
4. Ensure PostgreSQL accepts connections

### Issue 2: Migration Failed

**Error:** `Migration failed to apply`

**Solution:**
1. Check database logs
2. Verify schema syntax
3. Rollback and retry
4. Check for conflicting data

### Issue 3: Seed Failed

**Error:** `Unique constraint failed`

**Solution:**
1. Reset database: `npx prisma migrate reset`
2. Check for duplicate data
3. Update seed script

### Issue 4: Prisma Client Out of Sync

**Error:** `Prisma Client is out of sync`

**Solution:**
```bash
npm run db:generate
```

## Performance Optimization

### Indexes

The schema includes indexes on:
- Foreign keys
- Frequently queried fields
- Date/timestamp fields
- Status fields

### Query Optimization

```typescript
// Use select to limit fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
  },
});

// Use include for relations
const userWithPatients = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    patients: true,
  },
});

// Use pagination
const users = await prisma.user.findMany({
  take: 10,
  skip: 0,
});
```

### Connection Pooling

Configure in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/holovitals?connection_limit=10"
```

## Security Considerations

### 1. Environment Variables

- Never commit `.env` to version control
- Use different credentials per environment
- Rotate credentials regularly

### 2. Database Access

- Use least privilege principle
- Create separate database users for different services
- Enable SSL for production connections

### 3. Data Encryption

- Encrypt sensitive fields (already implemented in schema)
- Use encrypted connections (SSL/TLS)
- Implement field-level encryption where needed

### 4. Audit Logging

- All PHI access is logged
- Audit logs retained for 7 years
- Regular audit log reviews

## Next Steps

### Phase 3: Service Implementation

Now that the database is set up, proceed to:

1. **Implement LightweightChatbotService**
   - Uses `ChatConversation` and `ChatMessage` tables
   - Tracks costs in `ChatbotCost` table

2. **Implement ContextOptimizerService**
   - Uses `PromptOptimization` and `PromptSplit` tables
   - Optimizes token usage

3. **Implement AnalysisQueueService**
   - Uses `AnalysisQueue` table
   - Manages priority-based processing

4. **Implement InstanceProvisionerService**
   - Uses `CloudInstance` and `InstanceCost` tables
   - Manages ephemeral instances

See [Phase 3 Documentation](./PHASE_3_SERVICES.md) for details.

## Database Schema Diagram

```
Users
  ├─ Patients
  ├─ Documents
  │   ├─ OcrResults
  │   ├─ ExtractedData
  │   └─ DocumentEmbeddings
  ├─ ChatConversations
  │   └─ ChatMessages
  ├─ AnalysisQueue
  │   └─ CloudInstance
  ├─ UserSessions
  ├─ ConsentGrants
  │   └─ AccessLogs
  └─ AuditLogs

PatientRepository (Sandboxed)
  ├─ PatientDiagnosis
  ├─ PatientMedication
  ├─ PatientAllergy
  ├─ PatientVitalSign
  ├─ PatientProcedure
  ├─ PatientImmunization
  └─ PatientFamilyHistory

System Monitoring
  ├─ ModelPerformance
  ├─ SystemHealth
  ├─ ChatbotCost
  ├─ AnalysisCost
  └─ InstanceCost
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [HoloVitals Architecture](./AI_ARCHITECTURE.md)
- [Database Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## Support

For issues or questions:
1. Check [Common Issues](#common-issues--solutions)
2. Review Prisma logs: `npx prisma --help`
3. Create a GitHub issue
4. Contact the development team

---

**Phase 2 Status:** ✅ Complete

**Next Phase:** [Phase 3 - Service Implementation](./PHASE_3_SERVICES.md)