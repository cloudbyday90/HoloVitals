#!/bin/bash

# HoloVitals Beta & Payment System Integration Script
# This script integrates the beta code system and payment system into medical-analysis-platform

set -e  # Exit on error

echo "🚀 HoloVitals Integration Script"
echo "================================"
echo ""
echo "This script will integrate the beta code system and payment system"
echo "into your medical-analysis-platform application."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "medical-analysis-platform" ]; then
    echo -e "${RED}❌ Error: medical-analysis-platform directory not found.${NC}"
    echo "Please run this script from the HoloVitals root directory."
    exit 1
fi

echo -e "${YELLOW}⚠️  This will modify your medical-analysis-platform code.${NC}"
echo "It's recommended to create a backup or work in a new branch."
echo ""
read -p "Do you want to continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Integration cancelled."
    exit 0
fi

echo ""
echo "📋 Step 1: Creating backup..."
BACKUP_DIR="medical-analysis-platform-backup-$(date +%Y%m%d-%H%M%S)"
cp -r medical-analysis-platform "$BACKUP_DIR"
echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"

echo ""
echo "📋 Step 2: Creating directories..."
mkdir -p medical-analysis-platform/lib/services
mkdir -p medical-analysis-platform/lib/config
mkdir -p medical-analysis-platform/components/beta
mkdir -p medical-analysis-platform/components/billing
mkdir -p medical-analysis-platform/components/admin
mkdir -p medical-analysis-platform/app/api/beta
mkdir -p medical-analysis-platform/app/api/payments
mkdir -p medical-analysis-platform/app/api/webhooks
mkdir -p medical-analysis-platform/app/dashboard/billing
mkdir -p medical-analysis-platform/app/dashboard/admin/beta-codes
echo -e "${GREEN}✅ Directories created${NC}"

echo ""
echo "📋 Step 3: Moving backend services..."
if [ -f "lib/services/BetaCodeService.ts" ]; then
    cp lib/services/BetaCodeService.ts medical-analysis-platform/lib/services/
    echo "  ✓ BetaCodeService.ts"
fi
if [ -f "lib/services/StripePaymentService.ts" ]; then
    cp lib/services/StripePaymentService.ts medical-analysis-platform/lib/services/
    echo "  ✓ StripePaymentService.ts"
fi
echo -e "${GREEN}✅ Backend services moved${NC}"

echo ""
echo "📋 Step 4: Moving configuration files..."
if [ -f "lib/config/consumer-plans.ts" ]; then
    cp lib/config/consumer-plans.ts medical-analysis-platform/lib/config/
    echo "  ✓ consumer-plans.ts"
fi
if [ -f "lib/config/stripe.ts" ]; then
    cp lib/config/stripe.ts medical-analysis-platform/lib/config/
    echo "  ✓ stripe.ts"
fi
echo -e "${GREEN}✅ Configuration files moved${NC}"

echo ""
echo "📋 Step 5: Moving API endpoints..."
if [ -d "app/api/beta" ]; then
    cp -r app/api/beta/* medical-analysis-platform/app/api/beta/
    echo "  ✓ Beta API endpoints"
fi
if [ -d "app/api/payments" ]; then
    cp -r app/api/payments/* medical-analysis-platform/app/api/payments/
    echo "  ✓ Payment API endpoints"
fi
if [ -d "app/api/webhooks" ]; then
    cp -r app/api/webhooks/* medical-analysis-platform/app/api/webhooks/
    echo "  ✓ Webhook endpoints"
fi
echo -e "${GREEN}✅ API endpoints moved${NC}"

echo ""
echo "📋 Step 6: Moving UI components..."
if [ -d "components/beta" ]; then
    cp -r components/beta/* medical-analysis-platform/components/beta/
    echo "  ✓ Beta components"
fi
if [ -d "components/billing" ]; then
    cp -r components/billing/* medical-analysis-platform/components/billing/
    echo "  ✓ Billing components"
fi
if [ -d "components/admin" ]; then
    cp -r components/admin/* medical-analysis-platform/components/admin/
    echo "  ✓ Admin components"
fi
echo -e "${GREEN}✅ UI components moved${NC}"

echo ""
echo "📋 Step 7: Moving dashboard pages..."
if [ -f "app/(dashboard)/billing/page.tsx" ]; then
    cp "app/(dashboard)/billing/page.tsx" medical-analysis-platform/app/dashboard/billing/
    echo "  ✓ Billing page"
fi
if [ -f "app/(dashboard)/admin/beta-codes/page.tsx" ]; then
    cp "app/(dashboard)/admin/beta-codes/page.tsx" medical-analysis-platform/app/dashboard/admin/beta-codes/
    echo "  ✓ Beta codes admin page"
fi
echo -e "${GREEN}✅ Dashboard pages moved${NC}"

echo ""
echo "📋 Step 8: Copying utility files..."
if [ -f "lib/utils.ts" ]; then
    # Check if utils.ts already exists
    if [ -f "medical-analysis-platform/lib/utils.ts" ]; then
        echo -e "${YELLOW}  ⚠️  lib/utils.ts already exists, skipping${NC}"
    else
        cp lib/utils.ts medical-analysis-platform/lib/
        echo "  ✓ utils.ts"
    fi
fi
if [ -d "lib/utils" ]; then
    mkdir -p medical-analysis-platform/lib/utils
    cp -r lib/utils/* medical-analysis-platform/lib/utils/
    echo "  ✓ utils directory"
fi
echo -e "${GREEN}✅ Utility files copied${NC}"

echo ""
echo "📋 Step 9: Handling database schema..."
if [ -f "prisma/schema-beta-system.prisma" ]; then
    echo -e "${YELLOW}⚠️  Beta system schema found.${NC}"
    echo "You need to manually merge this into medical-analysis-platform/prisma/schema.prisma"
    echo "Schema file location: prisma/schema-beta-system.prisma"
    echo ""
    echo "Run this after integration:"
    echo "  cd medical-analysis-platform"
    echo "  # Add beta system models to prisma/schema.prisma"
    echo "  npx prisma generate"
    echo "  npx prisma migrate dev --name add_beta_system"
fi

echo ""
echo "📋 Step 10: Creating integration summary..."
cat > medical-analysis-platform/INTEGRATION_SUMMARY.md << 'EOF'
# Integration Summary

## ✅ Files Integrated

### Backend Services
- lib/services/BetaCodeService.ts
- lib/services/StripePaymentService.ts (if exists)

### Configuration
- lib/config/consumer-plans.ts
- lib/config/stripe.ts (if exists)

### API Endpoints
- app/api/beta/* (6 endpoints)
- app/api/payments/* (3 endpoints)
- app/api/webhooks/* (1 endpoint)

### UI Components
- components/beta/* (2 components)
- components/billing/* (5 components)
- components/admin/* (1 component)

### Dashboard Pages
- app/dashboard/billing/page.tsx
- app/dashboard/admin/beta-codes/page.tsx

## 🔧 Next Steps

### 1. Update Navigation
Add to your dashboard layout navigation:
```typescript
{ name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
{ name: 'Admin', href: '/dashboard/admin/beta-codes', icon: Settings },
```

### 2. Merge Database Schema
Add models from `../prisma/schema-beta-system.prisma` to `prisma/schema.prisma`

### 3. Run Database Migration
```bash
npx prisma generate
npx prisma migrate dev --name add_beta_system
```

### 4. Add Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PERSONAL_PRICE_ID=price_...
STRIPE_FAMILY_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
```

### 5. Test Integration
```bash
npm run dev
# Visit http://localhost:3000/dashboard/billing
# Visit http://localhost:3000/dashboard/admin/beta-codes
```

## 📚 Documentation
- QUICK_START_GUIDE.md - Beta launch guide
- BETA_SYSTEM_IMPLEMENTATION_COMPLETE.md - Technical details
- PAYMENT_SYSTEM_COMPLETE.md - Payment system details
EOF

echo -e "${GREEN}✅ Integration summary created${NC}"

echo ""
echo "🎉 Integration Complete!"
echo ""
echo "📁 Backup Location: $BACKUP_DIR"
echo "📄 Integration Summary: medical-analysis-platform/INTEGRATION_SUMMARY.md"
echo ""
echo "🔧 Next Steps:"
echo "1. cd medical-analysis-platform"
echo "2. Review INTEGRATION_SUMMARY.md"
echo "3. Update navigation in app/dashboard/layout.tsx"
echo "4. Merge database schema from ../prisma/schema-beta-system.prisma"
echo "5. Run: npx prisma generate && npx prisma migrate dev"
echo "6. Add environment variables to .env.local"
echo "7. Test: npm run dev"
echo ""
echo "📚 Documentation:"
echo "- ../QUICK_START_GUIDE.md"
echo "- ../BETA_SYSTEM_IMPLEMENTATION_COMPLETE.md"
echo "- ../PAYMENT_SYSTEM_COMPLETE.md"
echo ""
echo "✨ Happy coding!"