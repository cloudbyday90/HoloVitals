# Integration Plan - Beta System & Payment System

## 🎯 Overview

We need to integrate the beta code system and payment system into your existing `medical-analysis-platform` application.

## 📁 Current Structure

```
HoloVitals/
├── app/                          # Standalone pages (not integrated)
├── components/                   # Standalone components (not integrated)
├── lib/                         # Standalone services (not integrated)
├── medical-analysis-platform/   # YOUR MAIN APP ⭐
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── prisma/
│   └── package.json
```

## 🔄 Integration Steps

### Phase 1: Move Files to Main App (30 minutes)

#### 1.1 Backend Services
Move these to `medical-analysis-platform/lib/services/`:
- `lib/services/BetaCodeService.ts`
- `lib/services/StripePaymentService.ts` (if exists)

#### 1.2 Configuration
Move these to `medical-analysis-platform/lib/config/`:
- `lib/config/consumer-plans.ts`
- `lib/config/stripe.ts` (if exists)

#### 1.3 API Endpoints
Move these to `medical-analysis-platform/app/api/`:
- `app/api/beta/*` → `medical-analysis-platform/app/api/beta/`
- `app/api/payments/*` → `medical-analysis-platform/app/api/payments/`
- `app/api/webhooks/*` → `medical-analysis-platform/app/api/webhooks/`

#### 1.4 UI Components
Move these to `medical-analysis-platform/components/`:
- `components/beta/*` → `medical-analysis-platform/components/beta/`
- `components/billing/*` → `medical-analysis-platform/components/billing/`
- `components/admin/*` → `medical-analysis-platform/components/admin/`

#### 1.5 Dashboard Pages
Move these to `medical-analysis-platform/app/dashboard/`:
- `app/(dashboard)/billing/page.tsx` → `medical-analysis-platform/app/dashboard/billing/page.tsx`
- `app/(dashboard)/admin/beta-codes/page.tsx` → `medical-analysis-platform/app/dashboard/admin/beta-codes/page.tsx`

#### 1.6 Database Schema
Merge `prisma/schema-beta-system.prisma` into `medical-analysis-platform/prisma/schema.prisma`

### Phase 2: Update Imports (15 minutes)

After moving files, update all import paths:

**Before:**
```typescript
import { BetaCodeService } from '@/lib/services/BetaCodeService';
```

**After (if needed):**
```typescript
import { BetaCodeService } from '@/lib/services/BetaCodeService';
// Should work the same if @/ is configured correctly
```

### Phase 3: Update Navigation (10 minutes)

Add new routes to your main navigation in `medical-analysis-platform/app/dashboard/layout.tsx`:

```typescript
const navigation = [
  // ... existing routes
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Admin', href: '/dashboard/admin/beta-codes', icon: Settings }, // Admin only
];
```

### Phase 4: Database Migration (15 minutes)

```bash
cd medical-analysis-platform
npx prisma generate
npx prisma migrate dev --name add_beta_system
```

### Phase 5: Environment Variables (5 minutes)

Add to `medical-analysis-platform/.env.local`:
```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PERSONAL_PRICE_ID=price_...
STRIPE_FAMILY_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
```

### Phase 6: Test Integration (20 minutes)

1. Start dev server: `npm run dev`
2. Test beta code generation
3. Test beta code redemption
4. Test usage tracking
5. Test billing dashboard

---

## 🤖 Automated Integration Script

I can create a script to automate this entire process. Would you like me to:

1. **Create an automated integration script** that moves all files
2. **Do it manually step-by-step** with your guidance
3. **Create a new branch** and integrate everything there

Which approach would you prefer?

---

## 📋 Integration Checklist

### Before Integration
- [ ] Backup current code
- [ ] Create new branch: `git checkout -b integrate-beta-payment`
- [ ] Review current navigation structure
- [ ] Check existing auth setup

### During Integration
- [ ] Move all files to correct locations
- [ ] Update import paths
- [ ] Merge database schemas
- [ ] Add navigation links
- [ ] Update environment variables

### After Integration
- [ ] Run database migration
- [ ] Test all endpoints
- [ ] Test UI components
- [ ] Verify navigation works
- [ ] Test beta code flow
- [ ] Test billing flow

### Deployment
- [ ] Commit changes
- [ ] Push to GitHub
- [ ] Create pull request
- [ ] Review and merge
- [ ] Deploy to staging
- [ ] Test in staging
- [ ] Deploy to production

---

## 🚨 Potential Issues

### Issue 1: Import Path Conflicts
**Solution:** Ensure `tsconfig.json` has correct path aliases

### Issue 2: Duplicate Components
**Solution:** Check if components already exist, merge if needed

### Issue 3: Database Schema Conflicts
**Solution:** Review existing schema before merging

### Issue 4: Auth Integration
**Solution:** Ensure NextAuth is configured correctly

---

## 💡 Recommendation

I recommend we:
1. **Create an automated integration script** (saves time, reduces errors)
2. **Test in a new branch** (safe, can rollback if needed)
3. **Integrate step-by-step** (verify each step works)

Would you like me to proceed with creating the automated integration script?