# HoloVitals v1.5.0 Migration Guide

## 📋 Overview

This guide provides step-by-step instructions for migrating from HoloVitals v1.4.x to v1.5.0. The migration introduces database schema changes and new service management features.

**Migration Time**: 10-15 minutes  
**Downtime Required**: 5-10 minutes  
**Difficulty**: Easy to Moderate

---

## ⚠️ Before You Begin

### Prerequisites

- [ ] Administrative access to your server
- [ ] Database backup capability
- [ ] Access to .env.local file
- [ ] Node.js and npm installed
- [ ] PostgreSQL access

### What's Changing

**Database**:
- ✅ New tables: `service_configurations`, `github_configurations`
- ✅ No changes to existing tables
- ✅ No data loss

**Configuration**:
- ✅ New environment variable: `ENCRYPTION_KEY`
- ✅ Optional: Migrate `OPENAI_API_KEY` to admin console
- ✅ Backward compatible with existing .env.local

**Features**:
- ✅ New admin console at `/admin/settings`
- ✅ Database-driven service configuration
- ✅ Secure credential storage

---

## 🔄 Migration Steps

### Step 1: Backup Your System

**1.1 Backup Database**

```bash
# Navigate to your project directory
cd /path/to/HoloVitals

# Create backup directory
mkdir -p backups

# Backup PostgreSQL database
pg_dump -U holovitals holovitals > backups/holovitals_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backups/
```

**Expected Output**:
```
-rw-r--r-- 1 user user 15M Oct 5 12:00 holovitals_backup_20251005_120000.sql
```

**1.2 Backup Configuration Files**

```bash
# Backup .env.local
cp .env.local .env.local.backup_$(date +%Y%m%d_%H%M%S)

# Backup package.json
cp package.json package.json.backup

# Verify backups
ls -la *.backup*
```

**1.3 Document Current Configuration**

```bash
# Save current OpenAI key (if configured)
grep OPENAI_API_KEY .env.local > openai_key_backup.txt

# Save current environment
cat .env.local > env_backup_$(date +%Y%m%d_%H%M%S).txt
```

---

### Step 2: Stop the Application

```bash
# If using npm
pkill -f "npm run start"

# If using PM2
pm2 stop holovitals

# If using systemd
sudo systemctl stop holovitals

# Verify application is stopped
ps aux | grep node
```

**Expected Output**: No HoloVitals processes running

---

### Step 3: Pull Latest Changes

```bash
# Ensure you're on main branch
git branch

# Stash any local changes
git stash

# Pull latest changes
git pull origin main

# Verify version
git log --oneline -1
```

**Expected Output**:
```
<commit-hash> Release v1.5.0: Admin Console Service Management
```

---

### Step 4: Update Dependencies

```bash
# Install new dependencies
npm install

# Verify installation
npm list --depth=0
```

**Expected Output**: All dependencies installed successfully

---

### Step 5: Generate Prisma Client

```bash
# Generate Prisma client with new models
npx prisma generate
```

**Expected Output**:
```
✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client
```

---

### Step 6: Run Database Migration

**6.1 Review Migration**

```bash
# View migration SQL
cat prisma/migrations/20251004_add_service_configurations/migration.sql
```

**Expected Content**:
```sql
-- CreateTable: Service Configuration
CREATE TABLE "service_configurations" (
    "id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    ...
);

-- CreateTable: GitHub Configuration
CREATE TABLE "github_configurations" (
    "id" TEXT NOT NULL,
    "personal_access_token" TEXT NOT NULL,
    ...
);
```

**6.2 Run Migration**

```bash
# Apply migration
npx prisma migrate deploy
```

**Expected Output**:
```
1 migration found in prisma/migrations
Applying migration `20251004_add_service_configurations`
The following migration(s) have been applied:

migrations/
  └─ 20251004_add_service_configurations/
    └─ migration.sql

✔ All migrations have been successfully applied.
```

**6.3 Verify Migration**

```bash
# Connect to database
psql -U holovitals -d holovitals

# Check new tables
\dt service_configurations
\dt github_configurations

# Exit
\q
```

**Expected Output**: Both tables exist

---

### Step 7: Add Encryption Key

**7.1 Generate Encryption Key**

```bash
# Generate secure encryption key
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "Generated encryption key: $ENCRYPTION_KEY"
```

**7.2 Add to .env.local**

```bash
# Add encryption key to .env.local
echo "" >> .env.local
echo "# Encryption Key for Sensitive Data (GitHub PAT, Service Configs)" >> .env.local
echo "ENCRYPTION_KEY=&quot;$ENCRYPTION_KEY&quot;" >> .env.local
```

**7.3 Verify Addition**

```bash
# Check .env.local
grep ENCRYPTION_KEY .env.local
```

**Expected Output**:
```
ENCRYPTION_KEY="<32-byte-base64-encoded-key>"
```

---

### Step 8: Rebuild Application

```bash
# Clean previous build
rm -rf .next

# Build application
npm run build
```

**Expected Output**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    ...      ...
└ ○ /admin/settings                      ...      ...
```

**Build Time**: 2-5 minutes

---

### Step 9: Start Application

```bash
# Start application
npm run start

# Or with PM2
pm2 start npm --name holovitals -- run start

# Or with systemd
sudo systemctl start holovitals
```

**Expected Output**:
```
> holovitals@1.5.0 start
> next start

  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Network:      http://0.0.0.0:3000

 ✓ Ready in 2s
```

---

### Step 10: Verify Migration

**10.1 Check Application Health**

```bash
# Test application is running
curl -I https://your-domain.com

# Expected: HTTP 200 OK
```

**10.2 Access Admin Console**

1. Navigate to `https://your-domain.com/admin/settings`
2. Verify page loads without errors
3. Check both tabs: "OpenAI" and "GitHub PAT"

**Expected**: Admin settings page loads successfully

**10.3 Test Database Connection**

```bash
# Check service configurations table
psql -U holovitals -d holovitals -c "SELECT COUNT(*) FROM service_configurations;"

# Expected: 0 (no services configured yet)
```

---

### Step 11: Migrate OpenAI Configuration (Optional)

**If you have `OPENAI_API_KEY` in .env.local:**

**11.1 Note Your Current Key**

```bash
# Save current OpenAI key
grep OPENAI_API_KEY .env.local
```

**11.2 Configure via Admin Console**

1. Navigate to `https://your-domain.com/admin/settings`
2. Click "OpenAI" tab
3. Toggle "Enable OpenAI" switch
4. Paste your API key
5. Optionally change model (default: gpt-3.5-turbo)
6. Click "Save OpenAI Configuration"

**Expected**: "OpenAI configuration saved successfully"

**11.3 Verify Configuration**

```bash
# Check database
psql -U holovitals -d holovitals -c "SELECT service_name, enabled FROM service_configurations WHERE service_name='openai';"
```

**Expected Output**:
```
 service_name | enabled 
--------------+---------
 openai       | t
```

**11.4 Remove from .env.local (Optional)**

```bash
# Comment out or remove OPENAI_API_KEY
sed -i 's/^OPENAI_API_KEY=/#OPENAI_API_KEY=/' .env.local

# Verify
grep OPENAI_API_KEY .env.local
```

**Note**: You can keep it in .env.local as backup. Admin console takes precedence.

---

### Step 12: Add GitHub PAT (Optional)

**If you need GitHub repository access:**

**12.1 Create GitHub PAT**

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`
4. Generate token
5. Copy token (starts with `ghp_`)

**12.2 Add via Admin Console**

1. Navigate to `https://your-domain.com/admin/settings`
2. Click "GitHub PAT" tab
3. Paste your PAT
4. Add token name (e.g., "Production Token")
5. Optionally add expiration date
6. Click "Save GitHub PAT"

**Expected**: "GitHub PAT saved successfully"

**12.3 Verify Configuration**

```bash
# Check database (PAT will be encrypted)
psql -U holovitals -d holovitals -c "SELECT token_name, is_active FROM github_configurations;"
```

**Expected Output**:
```
   token_name    | is_active 
-----------------+-----------
 Production Token| t
```

---

### Step 13: Final Verification

**13.1 Application Health Check**

```bash
# Check all services
curl https://your-domain.com/api/health

# Check admin access
curl -I https://your-domain.com/admin/settings
```

**13.2 Test OpenAI (if configured)**

```bash
# Test OpenAI endpoint (if you have chat routes)
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

**13.3 Check Logs**

```bash
# Check application logs
npm run start 2>&1 | tee logs/app.log

# Or with PM2
pm2 logs holovitals

# Look for errors
grep -i error logs/app.log
```

**Expected**: No critical errors

---

## 🔄 Rollback Procedure

**If migration fails, follow these steps:**

### Rollback Step 1: Stop Application

```bash
# Stop application
pkill -f "npm run start"
# or
pm2 stop holovitals
```

### Rollback Step 2: Restore Database

```bash
# Drop new tables
psql -U holovitals -d holovitals -c "DROP TABLE IF EXISTS service_configurations CASCADE;"
psql -U holovitals -d holovitals -c "DROP TABLE IF EXISTS github_configurations CASCADE;"

# Or restore full backup
psql -U holovitals -d holovitals < backups/holovitals_backup_YYYYMMDD_HHMMSS.sql
```

### Rollback Step 3: Restore Code

```bash
# Checkout previous version
git checkout v1.4.13

# Restore dependencies
npm install

# Rebuild
npm run build
```

### Rollback Step 4: Restore Configuration

```bash
# Restore .env.local
cp .env.local.backup_YYYYMMDD_HHMMSS .env.local
```

### Rollback Step 5: Restart Application

```bash
# Start application
npm run start
```

---

## 🐛 Troubleshooting

### Issue: Migration Fails

**Symptom**: `npx prisma migrate deploy` fails

**Solution**:
```bash
# Check database connection
psql -U holovitals -d holovitals -c "SELECT 1"

# Check migration status
npx prisma migrate status

# Force reset (CAUTION: Development only)
npx prisma migrate reset

# Retry migration
npx prisma migrate deploy
```

### Issue: Encryption Key Not Working

**Symptom**: "Failed to decrypt data" errors

**Solution**:
```bash
# Regenerate encryption key
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Update .env.local
sed -i "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=&quot;$ENCRYPTION_KEY&quot;/" .env.local

# Restart application
npm run start
```

### Issue: Admin Console Not Accessible

**Symptom**: 404 or 403 on `/admin/settings`

**Solution**:
```bash
# Check build
npm run build

# Check user role
psql -U holovitals -d holovitals -c "SELECT email, role FROM users WHERE role IN ('ADMIN', 'OWNER');"

# Verify route exists
ls -la app/\(dashboard\)/admin/settings/
```

### Issue: OpenAI Configuration Not Saving

**Symptom**: "Failed to save OpenAI configuration"

**Solution**:
```bash
# Check API key format
# Must start with 'sk-'

# Test OpenAI connection manually
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"

# Check database permissions
psql -U holovitals -d holovitals -c "INSERT INTO service_configurations (id, service_name, enabled) VALUES ('test', 'test', false);"
```

### Issue: GitHub PAT Not Working

**Symptom**: "Failed to save GitHub PAT"

**Solution**:
```bash
# Check PAT format
# Must start with 'ghp_', 'gho_', or 'ghs_'

# Test PAT manually
curl -H "Authorization: token YOUR_PAT" https://api.github.com/user

# Check required scopes
# Must have: repo, workflow
```

---

## ✅ Post-Migration Checklist

- [ ] Database backup created
- [ ] Configuration files backed up
- [ ] Application stopped
- [ ] Code updated to v1.5.0
- [ ] Dependencies installed
- [ ] Prisma client generated
- [ ] Database migration applied
- [ ] Encryption key added
- [ ] Application rebuilt
- [ ] Application started
- [ ] Admin console accessible
- [ ] OpenAI configured (if needed)
- [ ] GitHub PAT added (if needed)
- [ ] All services working
- [ ] No errors in logs
- [ ] Backup files retained

---

## 📊 Migration Verification

### Database Verification

```sql
-- Connect to database
psql -U holovitals -d holovitals

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('service_configurations', 'github_configurations');

-- Check service configurations
SELECT service_name, enabled, updated_at 
FROM service_configurations;

-- Check GitHub configurations (PATs are encrypted)
SELECT token_name, is_active, created_at 
FROM github_configurations;

-- Exit
\q
```

### Application Verification

```bash
# Check application version
grep '"version"' package.json

# Check running processes
ps aux | grep node

# Check listening ports
netstat -tlnp | grep 3000

# Check application logs
tail -f logs/app.log
```

### Feature Verification

1. **Admin Console**: Navigate to `/admin/settings` - should load
2. **OpenAI Tab**: Should show enable/disable toggle
3. **GitHub PAT Tab**: Should show add PAT form
4. **Service Status**: Should show current configuration
5. **Validation**: Try invalid API key - should show error

---

## 📞 Support

### Need Help?

**Documentation**: https://github.com/cloudbyday90/HoloVitals

**Issue Tracker**: https://github.com/cloudbyday90/HoloVitals/issues

**Common Questions**:

**Q: How long does migration take?**  
A: 10-15 minutes including backups and verification.

**Q: Will I lose data?**  
A: No, migration only adds new tables. Existing data is preserved.

**Q: Can I rollback?**  
A: Yes, follow the rollback procedure above.

**Q: Do I need to migrate OpenAI key?**  
A: No, it's optional. Existing .env.local keys continue to work.

**Q: What if migration fails?**  
A: Follow the rollback procedure and contact support.

---

## 🎉 Migration Complete!

Congratulations! You've successfully migrated to HoloVitals v1.5.0.

**Next Steps**:
1. Explore the new admin console
2. Configure additional services as needed
3. Test all functionality
4. Provide feedback

**Enjoy the new features!** 🚀

---

*Migration Guide for HoloVitals v1.5.0 - October 5, 2025*