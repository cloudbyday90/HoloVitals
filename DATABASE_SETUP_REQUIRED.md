# Database Setup Required

## Current Issue
The application is showing an "Internal Server Error" because **PostgreSQL database is not running**.

HoloVitals requires a PostgreSQL database to store:
- User accounts and authentication
- EHR connections and sync jobs
- Patient data and health records
- Audit logs and system data

---

## Quick Setup (5 minutes)

### Option 1: Docker (Recommended) ⭐

**Step 1: Start PostgreSQL Container**
```bash
docker run -d \
  --name holovitals-postgres \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=holovitals_dev_password_2024 \
  postgres:15
```

**Step 2: Create Databases**
```bash
# Wait 5 seconds for PostgreSQL to start
sleep 5

# Create main database
docker exec holovitals-postgres psql -U postgres \
  -c "CREATE DATABASE holovitals;"

# Create shadow database (for migrations)
docker exec holovitals-postgres psql -U postgres \
  -c "CREATE DATABASE holovitals_shadow;"
```

**Step 3: Run Migrations**
```bash
cd medical-analysis-platform
npx prisma migrate dev --name initial_setup
```

**Step 4: Seed Database (Optional)**
```bash
npx prisma db seed
```

**Step 5: Restart Application**
```bash
npm run dev
```

---

### Option 2: Local PostgreSQL Installation

**Step 1: Install PostgreSQL**

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-15
sudo systemctl start postgresql
```

**Windows:**
Download installer from: https://www.postgresql.org/download/windows/

**Step 2: Create User and Databases**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create databases
CREATE DATABASE holovitals;
CREATE DATABASE holovitals_shadow;

# Exit
\q
```

**Step 3: Update Password (if needed)**
```bash
psql -U postgres -c "ALTER USER postgres PASSWORD 'holovitals_dev_password_2024';"
```

**Step 4: Run Migrations**
```bash
cd medical-analysis-platform
npx prisma migrate dev --name initial_setup
```

**Step 5: Restart Application**
```bash
npm run dev
```

---

## Verify Setup

After completing the setup, verify everything works:

1. **Check Database Connection:**
   ```bash
   cd medical-analysis-platform
   npx prisma db pull
   ```
   Should show: "✔ Introspected 92 models"

2. **Check Tables:**
   ```bash
   npx prisma studio
   ```
   Opens a web interface to view your database

3. **Test Application:**
   - Navigate to: http://localhost:3000
   - Should load without "Internal Server Error"
   - All pages should work

---

## Environment Variables

The application is already configured with these environment variables in `.env.local`:

```env
DATABASE_URL="postgresql://postgres:holovitals_dev_password_2024@localhost:5432/holovitals?schema=public"
SHADOW_DATABASE_URL="postgresql://postgres:holovitals_dev_password_2024@localhost:5432/holovitals_shadow?schema=public"
```

If you use different credentials, update these values.

---

## Database Schema

The application uses **92 database models** including:

### Core Tables
- Users, Patients, Documents
- Authentication (NextAuth)
- Sessions and Tokens

### EHR Integration
- EHR Connections (7 providers)
- Sync Jobs, Sync Errors, Sync Conflicts
- Webhooks, Transformations
- Provider Configurations

### HIPAA Compliance
- Audit Logs, Access Logs
- Security Alerts, Consent Grants
- Identity Challenges

### Medical Data
- FHIR Resources
- Medications, Allergies, Diagnoses
- Vital Signs, Immunizations
- Lab Results, Procedures

### AI & Analytics
- AI Interactions, Analysis Sessions
- Model Performance, Prompt Optimizations
- Document Embeddings

### Payment & Billing
- Subscriptions, Payment Intents
- Token Balance, Usage Tracking
- Beta Codes

---

## Troubleshooting

### Issue: "Connection refused"
**Solution:** PostgreSQL is not running
```bash
# Docker
docker start holovitals-postgres

# Local (macOS)
brew services start postgresql@15

# Local (Linux)
sudo systemctl start postgresql
```

### Issue: "Database does not exist"
**Solution:** Create the databases
```bash
docker exec holovitals-postgres psql -U postgres \
  -c "CREATE DATABASE holovitals;"
```

### Issue: "Authentication failed"
**Solution:** Check password in .env.local matches PostgreSQL
```bash
# Reset password
docker exec holovitals-postgres psql -U postgres \
  -c "ALTER USER postgres PASSWORD 'holovitals_dev_password_2024';"
```

### Issue: "Migration failed"
**Solution:** Reset database and try again
```bash
cd medical-analysis-platform
npx prisma migrate reset
npx prisma migrate dev
```

---

## Docker Commands Reference

### Start Container
```bash
docker start holovitals-postgres
```

### Stop Container
```bash
docker stop holovitals-postgres
```

### View Logs
```bash
docker logs holovitals-postgres
```

### Connect to Database
```bash
docker exec -it holovitals-postgres psql -U postgres -d holovitals
```

### Remove Container (if needed)
```bash
docker stop holovitals-postgres
docker rm holovitals-postgres
```

---

## Production Deployment

For production, use a managed PostgreSQL service:

### Recommended Services
1. **Supabase** (Free tier available)
   - https://supabase.com
   - Includes PostgreSQL + Auth + Storage

2. **Neon** (Serverless PostgreSQL)
   - https://neon.tech
   - Free tier with 0.5GB storage

3. **Railway** (Simple deployment)
   - https://railway.app
   - PostgreSQL + App hosting

4. **AWS RDS** (Enterprise)
   - https://aws.amazon.com/rds/postgresql/
   - Fully managed, scalable

### Update Environment Variables
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

---

## Next Steps

After setting up the database:

1. ✅ Database running
2. ✅ Migrations applied
3. ✅ Application restarted
4. ⏳ Test all features:
   - User registration/login
   - Provider onboarding
   - EHR sync dashboard
   - Clinical data viewer
   - AI insights

---

## Summary

**Current Status:** Database not running (causing Internal Server Error)

**Required Action:** Set up PostgreSQL database

**Time Required:** 5 minutes with Docker, 10 minutes with local install

**Recommended:** Use Docker for quickest setup

**Commands:**
```bash
# 1. Start PostgreSQL
docker run -d --name holovitals-postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=holovitals_dev_password_2024 postgres:15

# 2. Create databases
sleep 5
docker exec holovitals-postgres psql -U postgres \
  -c "CREATE DATABASE holovitals; CREATE DATABASE holovitals_shadow;"

# 3. Run migrations
cd medical-analysis-platform
npx prisma migrate dev

# 4. Restart app
npm run dev
```

**After Setup:** Application will work correctly, no more Internal Server Error

---

**Need Help?** Check the troubleshooting section above or review the Prisma documentation at https://www.prisma.io/docs