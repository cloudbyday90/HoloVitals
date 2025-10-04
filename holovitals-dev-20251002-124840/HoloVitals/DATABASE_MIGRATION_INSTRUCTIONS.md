# Database Migration Instructions

## 🎯 Quick Setup (Automated)

We've created an automated setup script that handles everything for you.

### Run the Setup Script

```bash
cd HoloVitals
chmod +x scripts/setup-beta-database.sh
./scripts/setup-beta-database.sh
```

This script will:
1. ✅ Backup your current schema
2. ✅ Merge beta system models
3. ✅ Generate Prisma Client
4. ✅ Create database migration
5. ✅ Verify tables were created

**That's it!** The script handles everything automatically.

---

## 🔧 Manual Setup (Alternative)

If you prefer to do it manually or the script doesn't work:

### Step 1: Backup Current Schema

```bash
cp prisma/schema.prisma prisma/schema.prisma.backup
```

### Step 2: Add Beta System Models

Open `prisma/schema.prisma` and add the following models at the end:

```prisma
// ============================================
// Beta Testing System Models
// ============================================

model BetaCode {
  id            String   @id @default(cuid())
  code          String   @unique
  maxUses       Int      @default(1)
  usedCount     Int      @default(0)
  expiresAt     DateTime?
  createdAt     DateTime @default(now())
  createdBy     String
  
  // Limits for this code (in MB for storage)
  tokenLimit    Int      @default(3000000)  // 3M tokens
  storageLimit  Int      @default(500)      // 500MB
  
  // Status
  isActive      Boolean  @default(true)
  
  // Relationships
  users         User[]
  
  @@index([code])
  @@index([isActive])
  @@index([createdAt])
}

// Add to User model (extend existing User model):
model User {
  // ... existing fields
  
  // Beta Testing
  betaCodeId    String?
  betaCode      BetaCode? @relation(fields: [betaCodeId], references: [id])
  isBetaTester  Boolean   @default(false)
  betaJoinedAt  DateTime?
  
  // Token Tracking
  tokensUsed    Int       @default(0)
  tokensLimit   Int       @default(0)
  tokensResetAt DateTime?
  
  // Storage Tracking (in MB)
  storageUsed   Int       @default(0)  // MB used
  storageLimit  Int       @default(0)  // MB limit
  
  // Relationships
  tokenUsage    TokenUsage[]
  fileUploads   FileUpload[]
  
  @@index([isBetaTester])
  @@index([betaCodeId])
}

model TokenUsage {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  tokensUsed    Int
  operation     String   // 'chat', 'analysis', 'insights', 'document_analysis', etc.
  metadata      Json?    // Additional context
  timestamp     DateTime @default(now())
  
  @@index([userId, timestamp])
  @@index([operation])
}

model FileUpload {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  fileName      String
  fileSize      Int      // Size in bytes
  fileSizeMB    Float    // Size in MB (for easier querying)
  fileType      String
  filePath      String
  uploadedAt    DateTime @default(now())
  
  // Metadata
  documentType  String?  // 'lab_result', 'prescription', 'medical_record', etc.
  isDeleted     Boolean  @default(false)
  deletedAt     DateTime?
  
  @@index([userId, uploadedAt])
  @@index([isDeleted])
}

model BetaFeedback {
  id            String   @id @default(cuid())
  userId        String
  
  // Feedback details
  type          String   // 'bug', 'feature_request', 'general', 'improvement'
  title         String
  description   String   @db.Text
  severity      String?  // 'low', 'medium', 'high', 'critical'
  
  // Status
  status        String   @default("open") // 'open', 'in_progress', 'resolved', 'closed'
  priority      String?  // 'low', 'medium', 'high'
  
  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  resolvedAt    DateTime?
  resolvedBy    String?
  
  // Additional context
  metadata      Json?    // Browser info, page URL, etc.
  
  @@index([userId, createdAt])
  @@index([status])
  @@index([type])
}

model BetaAnalytics {
  id            String   @id @default(cuid())
  userId        String
  
  // Event tracking
  eventType     String   // 'page_view', 'feature_used', 'error', 'conversion', etc.
  eventName     String
  eventData     Json?
  
  // Session info
  sessionId     String?
  timestamp     DateTime @default(now())
  
  // Context
  page          String?
  userAgent     String?
  ipAddress     String?
  
  @@index([userId, timestamp])
  @@index([eventType])
  @@index([sessionId])
}
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Create Migration

```bash
npx prisma migrate dev --name add_beta_system
```

When prompted, confirm the migration.

### Step 5: Verify Migration

```bash
npx prisma studio
```

Check that these tables exist:
- ✅ BetaCode
- ✅ TokenUsage
- ✅ FileUpload
- ✅ BetaFeedback
- ✅ BetaAnalytics

And verify User model has new fields:
- ✅ betaCodeId
- ✅ isBetaTester
- ✅ betaJoinedAt
- ✅ tokensUsed
- ✅ tokensLimit
- ✅ storageUsed
- ✅ storageLimit

---

## 🔍 Troubleshooting

### Issue: Migration Fails

**Solution:**
```bash
# Reset database (WARNING: This will delete all data)
npx prisma migrate reset

# Then run migration again
npx prisma migrate dev --name add_beta_system
```

### Issue: Tables Already Exist

**Solution:**
```bash
# Check current migrations
npx prisma migrate status

# If needed, mark as applied
npx prisma migrate resolve --applied add_beta_system
```

### Issue: Prisma Client Out of Sync

**Solution:**
```bash
# Regenerate Prisma Client
npx prisma generate

# Restart your dev server
npm run dev
```

### Issue: User Model Conflicts

**Solution:**
If you already have a User model, you need to add the beta fields to your existing User model instead of creating a new one. Just add the fields marked with "Add to User model" above.

---

## ✅ Verification Checklist

After migration, verify:

- [ ] Database migration completed successfully
- [ ] All 5 new tables created (BetaCode, TokenUsage, FileUpload, BetaFeedback, BetaAnalytics)
- [ ] User model has new beta fields
- [ ] Prisma Client regenerated
- [ ] No TypeScript errors
- [ ] Dev server starts successfully
- [ ] Can access `/admin/beta-codes` page

---

## 🚀 Next Steps

Once migration is complete:

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Access Admin Dashboard**
   Navigate to: `http://localhost:3000/admin/beta-codes`

3. **Generate Beta Codes**
   - Click "Create Codes"
   - Generate 50 codes
   - Set limits: 3M tokens, 500MB storage

4. **Test Beta Flow**
   - Sign up with new account
   - Enter beta code
   - Verify usage dashboard

5. **Launch Beta Program**
   - Send invitations
   - Monitor usage
   - Collect feedback

---

## 📚 Additional Resources

- **QUICK_START_GUIDE.md** - Complete beta launch guide
- **BETA_SYSTEM_IMPLEMENTATION_COMPLETE.md** - Technical details
- **CONSUMER_FOCUSED_PIVOT_PLAN.md** - Strategic overview

---

## 💡 Tips

1. **Backup First:** Always backup your database before migrations
2. **Test Locally:** Test migrations in development first
3. **Use Prisma Studio:** Great for verifying data
4. **Check Logs:** Review migration logs for issues
5. **Ask for Help:** Check documentation if stuck

---

**Need Help?** Review the comprehensive documentation or check the troubleshooting section above.