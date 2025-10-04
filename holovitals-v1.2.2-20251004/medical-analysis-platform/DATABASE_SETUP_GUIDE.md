# HoloVitals Database Setup Guide

This guide will help you set up the Docker PostgreSQL database for local development and testing.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- Node.js 18+ installed
- npm or yarn package manager

## Quick Start

### 1. Start the Database

Run the setup script to start PostgreSQL and run all migrations:

```bash
cd medical-analysis-platform
./scripts/setup-database.sh
```

This script will:
- ✅ Start Docker containers (PostgreSQL + pgAdmin)
- ✅ Wait for PostgreSQL to be ready
- ✅ Generate Prisma Client
- ✅ Run database migrations
- ✅ Seed initial data

### 2. Verify Database Connection

The database should now be running with the following configuration:

- **Database URL**: `postgresql://postgres:holovitals_dev_password_2024@localhost:5432/holovitals`
- **PostgreSQL Port**: `5432`
- **pgAdmin URL**: `http://localhost:5050`
- **pgAdmin Email**: `admin@holovitals.local`
- **pgAdmin Password**: `admin`

### 3. Access pgAdmin (Optional)

1. Open your browser and go to `http://localhost:5050`
2. Login with:
   - Email: `admin@holovitals.local`
   - Password: `admin`
3. Add a new server:
   - Name: `HoloVitals Local`
   - Host: `postgres` (use the service name from docker-compose)
   - Port: `5432`
   - Username: `postgres`
   - Password: `holovitals_dev_password_2024`

## Database Management Scripts

### Start Database
```bash
./scripts/setup-database.sh
```

### Stop Database
```bash
./scripts/stop-database.sh
```

### Reset Database (⚠️ Deletes all data)
```bash
./scripts/reset-database.sh
```

### View Database Logs
```bash
docker logs holovitals-db
```

### Access PostgreSQL CLI
```bash
docker exec -it holovitals-db psql -U postgres -d holovitals
```

## Manual Database Operations

### Generate Prisma Client
```bash
npx prisma generate
```

### Create a New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Apply Migrations
```bash
npx prisma migrate deploy
```

### Seed Database
```bash
npx prisma db seed
```

### View Database Schema
```bash
npx prisma studio
```

This will open Prisma Studio at `http://localhost:5555` where you can view and edit your database.

## Database Schema Overview

The HoloVitals database includes the following main models:

### User Management
- `User` - User accounts
- `Account` - OAuth accounts
- `Session` - User sessions
- `VerificationToken` - Email verification

### Patient Data
- `Patient` - Patient records
- `FHIRResource` - FHIR-compliant health records
- `LabResult` - Laboratory test results
- `Medication` - Medication records
- `Allergy` - Allergy information
- `Condition` - Medical conditions

### EHR Integration
- `EHRConnection` - EHR system connections
- `EHRSyncHistory` - Sync operation history
- `EHRProvider` - EHR provider information

### Medical Standardization
- `LOINCCode` - LOINC codes for lab tests
- `SNOMEDCode` - SNOMED CT codes
- `ICD10Code` - ICD-10 diagnosis codes
- `CPTCode` - CPT procedure codes

### AI & Analytics
- `AIHealthInsight` - AI-generated health insights
- `HealthRiskAssessment` - Risk assessments
- `TrendAnalysis` - Health trend analysis
- `PersonalizedRecommendation` - Health recommendations

### Payment & Billing
- `Subscription` - User subscriptions
- `Payment` - Payment records
- `Invoice` - Billing invoices
- `PaymentMethod` - Stored payment methods

### Beta Testing
- `BetaCode` - Beta access codes
- `TokenUsage` - Token usage tracking
- `FileUpload` - File upload tracking
- `BetaFeedback` - User feedback
- `BetaAnalytics` - Beta program analytics

### HIPAA Compliance
- `AuditLog` - Comprehensive audit logging
- `SecurityAlert` - Security alerts
- `BreachIncident` - Breach tracking
- `ConsentRecord` - Patient consent records

## Environment Variables

The `.env.local` file contains all necessary configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:holovitals_dev_password_2024@localhost:5432/holovitals?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="holovitals-dev-secret-change-in-production-2024"

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_key_here"
STRIPE_SECRET_KEY="sk_test_your_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# AI Providers
OPENAI_API_KEY="your-openai-api-key-here"
ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Troubleshooting

### Port 5432 Already in Use

If you have another PostgreSQL instance running:

```bash
# Stop the conflicting service
sudo systemctl stop postgresql

# Or change the port in docker-compose.yml
ports:
  - "5433:5432"  # Use port 5433 instead

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://postgres:holovitals_dev_password_2024@localhost:5433/holovitals?schema=public"
```

### Docker Container Won't Start

```bash
# Check Docker logs
docker logs holovitals-db

# Remove and recreate containers
docker-compose down -v
docker-compose up -d
```

### Migration Errors

```bash
# Reset migrations and start fresh
./scripts/reset-database.sh
```

### Connection Refused

```bash
# Check if PostgreSQL is running
docker ps | grep holovitals-db

# Check if PostgreSQL is ready
docker exec holovitals-db pg_isready -U postgres

# Restart containers
docker-compose restart
```

## Production Deployment

For production, you should:

1. **Use Supabase or managed PostgreSQL**
   - Supabase: https://supabase.com
   - AWS RDS: https://aws.amazon.com/rds/
   - Google Cloud SQL: https://cloud.google.com/sql
   - Azure Database: https://azure.microsoft.com/en-us/products/postgresql

2. **Update environment variables**
   - Use strong, unique passwords
   - Use production Stripe keys
   - Configure proper NEXTAUTH_SECRET
   - Set up proper SMTP for emails

3. **Enable SSL**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
   ```

4. **Set up backups**
   - Configure automated backups
   - Test restore procedures
   - Monitor database health

## Next Steps

After setting up the database:

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Access the application**
   - Open `http://localhost:3000`
   - Create a user account
   - Explore the features

3. **Configure integrations**
   - Set up Stripe for payments
   - Add OpenAI/Anthropic API keys
   - Configure EHR connections

4. **Generate beta codes**
   - Access admin panel
   - Generate beta access codes
   - Start testing

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Docker logs: `docker logs holovitals-db`
- Check Prisma logs: `npx prisma studio`
- Review application logs in the terminal

---

**Happy coding! 🚀**