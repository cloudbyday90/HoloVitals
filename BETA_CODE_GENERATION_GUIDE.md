# Beta Code Generation Guide

## Quick Start

### Option 1: Using the Script (Recommended)

```bash
cd medical-analysis-platform

# Generate 100 codes (default, expires in 90 days)
./scripts/generate-beta-codes.sh

# Generate 50 codes
./scripts/generate-beta-codes.sh 50

# Generate 200 codes that expire in 180 days
./scripts/generate-beta-codes.sh 200 180
```

### Option 2: Using TypeScript Directly

```bash
cd medical-analysis-platform

# Generate 100 codes (default)
npx ts-node scripts/generate-beta-codes.ts

# Generate 50 codes
npx ts-node scripts/generate-beta-codes.ts --count=50

# Generate 200 codes that expire in 180 days
npx ts-node scripts/generate-beta-codes.ts --count=200 --expires=180
```

### Option 3: Using SQL (Quick & Simple)

```bash
# Connect to database
psql -U postgres -d holovitals

# Generate 100 codes
INSERT INTO "BetaCode" (code, "maxRedemptions", "expiresAt", "createdAt", "updatedAt")
SELECT 
  'HOLO-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
  1,
  NOW() + INTERVAL '90 days',
  NOW(),
  NOW()
FROM generate_series(1, 100);

# Export to CSV
\copy (SELECT code, "maxRedemptions", "expiresAt", 'Active' as status FROM "BetaCode" WHERE "redeemedCount" = 0 ORDER BY "createdAt" DESC LIMIT 100) TO 'beta-codes.csv' WITH CSV HEADER;
```

## What Happens When You Generate Codes

1. **Unique codes generated** in format: `HOLO-XXXXXXXX`
2. **Stored in database** in the `BetaCode` table
3. **Exported to CSV** in `beta-codes/` directory
4. **Sample codes displayed** in terminal (first 10)

## Code Format

- **Prefix**: `HOLO-`
- **Length**: 13 characters total
- **Format**: `HOLO-XXXXXXXX` (8 random hex characters)
- **Example**: `HOLO-A3F2B9C1`

## Code Properties

- **Max Redemptions**: 1 (each code can be used once)
- **Expiration**: 90 days by default (configurable)
- **Status**: Active until redeemed or expired
- **Tracking**: Redemption count, redeemed by user, redeemed at timestamp

## Output Files

Generated codes are saved to:
```
medical-analysis-platform/beta-codes/
└── beta-codes-2025-10-01T20-30-45.csv
```

CSV format:
```csv
Code,Max Redemptions,Expires At,Status
HOLO-A3F2B9C1,1,2025-12-30T20:30:45.000Z,Active
HOLO-B7E4D2F8,1,2025-12-30T20:30:45.000Z,Active
...
```

## Distribution Methods

### Method 1: Email Distribution
1. Export codes to CSV
2. Import into email marketing tool (Mailchimp, SendGrid, etc.)
3. Send personalized emails with unique codes

### Method 2: Manual Distribution
1. Copy codes from CSV
2. Send individually via email, DM, or messaging apps
3. Track distribution in a spreadsheet

### Method 3: Landing Page
1. Create a waitlist landing page
2. Auto-send codes upon signup
3. Use API endpoint to validate and redeem

### Method 4: Social Media
1. Post codes publicly (limited quantity)
2. First-come, first-served basis
3. Monitor redemption rate

## Monitoring Beta Codes

### Check Code Status

```bash
# Connect to database
psql -U postgres -d holovitals

# View all codes
SELECT code, "redeemedCount", "maxRedemptions", "expiresAt", "isActive" 
FROM "BetaCode" 
ORDER BY "createdAt" DESC 
LIMIT 20;

# View redeemed codes
SELECT bc.code, bc."redeemedAt", u.email 
FROM "BetaCode" bc 
JOIN "User" u ON bc."redeemedBy" = u.id 
WHERE bc."redeemedCount" > 0 
ORDER BY bc."redeemedAt" DESC;

# Count active codes
SELECT COUNT(*) as active_codes 
FROM "BetaCode" 
WHERE "isActive" = true 
AND "redeemedCount" < "maxRedemptions" 
AND "expiresAt" > NOW();
```

### API Endpoints

**Check code validity:**
```bash
curl http://localhost:3000/api/beta/validate?code=HOLO-A3F2B9C1
```

**Get statistics:**
```bash
curl http://localhost:3000/api/beta/stats
```

## Troubleshooting

### "Database connection failed"
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql
```

### "Prisma client not generated"
```bash
cd medical-analysis-platform
npx prisma generate
```

### "Permission denied"
```bash
# Make script executable
chmod +x scripts/generate-beta-codes.sh
```

### "Duplicate code error"
- Very rare (1 in 4 billion chance)
- Script automatically generates new code if duplicate found
- No action needed

## Best Practices

### Initial Launch (Week 1)
- Generate 50-100 codes
- Distribute to close friends/family
- Monitor usage closely
- Gather initial feedback

### Growth Phase (Week 2-4)
- Generate 100-200 codes per week
- Expand to wider audience
- Track redemption rate
- Adjust based on demand

### Scale Phase (Week 5-8)
- Generate 500-1000 codes
- Open to public waitlist
- Implement automated distribution
- Monitor system performance

## Security Considerations

- ✅ Codes are cryptographically random
- ✅ One-time use by default
- ✅ Expiration dates enforced
- ✅ Redemption tracking enabled
- ✅ User association recorded
- ✅ Audit trail maintained

## Example Workflow

```bash
# 1. Generate codes
cd medical-analysis-platform
./scripts/generate-beta-codes.sh 100

# 2. Check output
ls -la beta-codes/

# 3. Open CSV
cat beta-codes/beta-codes-*.csv | head -20

# 4. Distribute codes
# (Copy codes and send to testers)

# 5. Monitor redemptions
psql -U postgres -d holovitals -c "SELECT COUNT(*) FROM &quot;BetaCode&quot; WHERE &quot;redeemedCount&quot; > 0;"

# 6. Check statistics
curl http://localhost:3000/api/beta/stats
```

## Next Steps After Generation

1. ✅ **Test a code** - Redeem one code yourself to verify flow
2. ✅ **Distribute codes** - Send to initial beta testers
3. ✅ **Monitor usage** - Track redemption rate and user activity
4. ✅ **Gather feedback** - Set up feedback collection method
5. ✅ **Generate more** - Create additional batches as needed

---

**Ready to generate your first batch of beta codes?**

Run: `./scripts/generate-beta-codes.sh 100`