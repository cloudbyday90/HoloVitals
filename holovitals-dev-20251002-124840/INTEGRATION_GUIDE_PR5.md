# Integration Guide for PR #5

## 🎯 Overview

PR #5 contains code for the Clinical Data Viewer and Document Viewer. The code is currently in the `/workspace` root directory and needs to be integrated with the existing Next.js application in `medical-analysis-platform/`.

---

## 📁 Current Structure

```
/workspace/
├── app/                                    # New Next.js app directory
│   ├── (dashboard)/clinical/              # Clinical dashboard pages
│   └── api/                                # API routes
├── components/                             # New React components
│   ├── clinical/                           # Clinical data components
│   └── documents/                          # Document viewer components
├── lib/types/                              # TypeScript type definitions
├── prisma/                                 # Prisma schema
└── medical-analysis-platform/              # Existing Next.js app
    ├── app/
    ├── components/
    ├── lib/
    └── prisma/
```

---

## 🔄 Integration Steps

### Option 1: Merge into Existing App (Recommended)

This option integrates the new code into the existing `medical-analysis-platform` directory.

#### Step 1: Copy Files

```bash
# Navigate to workspace root
cd /workspace

# Copy app directory contents
cp -r app/* medical-analysis-platform/app/

# Copy components
cp -r components/* medical-analysis-platform/components/

# Copy lib/types
mkdir -p medical-analysis-platform/lib/types
cp -r lib/types/* medical-analysis-platform/lib/types/

# Copy prisma schema (merge with existing)
# Note: You'll need to manually merge the schema files
cp prisma/schema.prisma medical-analysis-platform/prisma/schema-new.prisma
```

#### Step 2: Merge Prisma Schemas

The new code uses the consolidated Prisma schema. You'll need to:

1. Review the existing schema in `medical-analysis-platform/prisma/schema.prisma`
2. Compare with the new schema in `prisma/schema.prisma`
3. Merge any new models or changes
4. Run `npx prisma generate` to update the Prisma client

#### Step 3: Install Dependencies

```bash
cd medical-analysis-platform

# Install any new dependencies (if needed)
npm install

# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push
```

#### Step 4: Update Imports

Check all import paths and update if necessary:

```typescript
// Update imports to match the medical-analysis-platform structure
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
```

#### Step 5: Test

```bash
# Start development server
npm run dev

# Navigate to http://localhost:3000/clinical
# Test all features according to TESTING_PLAN_PR5.md
```

---

### Option 2: Keep Separate (Development)

This option keeps the code separate for development and testing.

#### Step 1: Create Package.json

```bash
cd /workspace

# Create a minimal package.json
cat > package.json << 'EOF'
{
  "name": "holovitals-clinical-viewer",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@prisma/client": "^5.0.0",
    "next-auth": "^4.24.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0",
    "prisma": "^5.0.0"
  }
}
EOF
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Create Next.js Config

```bash
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
EOF
```

#### Step 4: Run Development Server

```bash
npm run dev
```

---

## 🔍 Verification Checklist

After integration, verify:

- [ ] All pages load without errors
- [ ] API routes are accessible
- [ ] Database queries work correctly
- [ ] Authentication works
- [ ] Components render properly
- [ ] TypeScript compilation succeeds
- [ ] No import errors
- [ ] Prisma client is generated
- [ ] Environment variables are set

---

## 🐛 Common Issues

### Issue 1: Import Errors

**Problem:** `Cannot find module '@/lib/prisma'`

**Solution:** 
- Check that `tsconfig.json` has the correct path mappings
- Verify the file exists at the expected location
- Restart the TypeScript server

### Issue 2: Prisma Client Not Found

**Problem:** `@prisma/client` not found

**Solution:**
```bash
npx prisma generate
```

### Issue 3: Database Connection Error

**Problem:** Cannot connect to database

**Solution:**
- Check `DATABASE_URL` in `.env` file
- Verify database is running
- Run `npx prisma db push` to sync schema

### Issue 4: Authentication Error

**Problem:** NextAuth session not found

**Solution:**
- Check `NEXTAUTH_URL` and `NEXTAUTH_SECRET` in `.env`
- Verify NextAuth configuration
- Check API route protection

### Issue 5: Missing UI Components

**Problem:** Shadcn UI components not found

**Solution:**
```bash
# Install Shadcn UI components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input select tabs badge
```

---

## 📝 Environment Variables

Ensure these environment variables are set:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Optional: File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="26214400" # 25MB in bytes
```

---

## 🧪 Testing After Integration

Follow the comprehensive testing plan in `TESTING_PLAN_PR5.md`:

1. **Basic Navigation**
   - Visit `/clinical`
   - Check all dashboard links work

2. **Clinical Data Pages**
   - Test `/clinical/labs`
   - Test `/clinical/medications`
   - Test `/clinical/timeline`
   - Test `/clinical/allergies`
   - Test `/clinical/conditions`

3. **Document Viewer**
   - Test `/clinical/documents`
   - Test document upload
   - Test PDF viewer
   - Test image viewer

4. **API Endpoints**
   - Test all clinical data APIs
   - Test document management APIs

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth Documentation](https://next-auth.js.org)
- [Shadcn UI Documentation](https://ui.shadcn.com)

---

## 🆘 Need Help?

If you encounter issues during integration:

1. Check the error messages carefully
2. Review the integration steps
3. Check the common issues section
4. Verify all dependencies are installed
5. Check environment variables
6. Review the testing plan

---

## ✅ Integration Complete

Once integration is complete:

1. ✅ All files copied/merged
2. ✅ Dependencies installed
3. ✅ Prisma schema updated
4. ✅ Database migrated
5. ✅ Environment variables set
6. ✅ Development server running
7. ✅ All tests passing

**Ready for production deployment!** 🚀