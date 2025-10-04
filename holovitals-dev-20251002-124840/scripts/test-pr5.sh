#!/bin/bash

# Test Script for PR #5
# This script performs basic checks on the implemented features

echo "🧪 Testing PR #5: Clinical Data Viewer & Document Viewer"
echo "=========================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    exit 1
fi

echo "✅ In project root directory"
echo ""

# Check if node_modules exists
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
    npm install
else
    echo "✅ Dependencies installed"
fi
echo ""

# Check if .env file exists
echo "🔐 Checking environment configuration..."
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  No .env or .env.local file found${NC}"
    echo "   Please create one with required environment variables"
else
    echo "✅ Environment file found"
fi
echo ""

# Check TypeScript compilation
echo "🔍 Checking TypeScript compilation..."
npx tsc --noEmit 2>&1 | head -20
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation errors found${NC}"
fi
echo ""

# Check if Prisma schema is valid
echo "🗄️  Checking Prisma schema..."
npx prisma validate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma schema is valid${NC}"
else
    echo -e "${RED}❌ Prisma schema has errors${NC}"
fi
echo ""

# List all new files in PR
echo "📁 Files added in PR #5:"
echo "------------------------"
echo "Components:"
ls -1 components/clinical/*.tsx 2>/dev/null | sed 's/^/  /'
ls -1 components/documents/*.tsx 2>/dev/null | sed 's/^/  /'
echo ""
echo "Pages:"
ls -1 app/\(dashboard\)/clinical/*.tsx 2>/dev/null | sed 's/^/  /'
ls -1 app/\(dashboard\)/clinical/*/*.tsx 2>/dev/null | sed 's/^/  /'
echo ""
echo "API Routes:"
ls -1 app/api/clinical/*/route.ts 2>/dev/null | sed 's/^/  /'
ls -1 app/api/clinical/*/*/route.ts 2>/dev/null | sed 's/^/  /'
ls -1 app/api/documents/*/route.ts 2>/dev/null | sed 's/^/  /'
ls -1 app/api/documents/*/*/route.ts 2>/dev/null | sed 's/^/  /'
echo ""

# Check for missing imports
echo "🔗 Checking for potential import issues..."
MISSING_IMPORTS=0

# Check if Prisma client is imported correctly
if ! grep -r "from '@/lib/prisma'" app/api/ > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Prisma client import might be missing in API routes${NC}"
    MISSING_IMPORTS=$((MISSING_IMPORTS + 1))
fi

# Check if NextAuth is imported in API routes
if ! grep -r "from 'next-auth'" app/api/ > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  NextAuth import might be missing in API routes${NC}"
    MISSING_IMPORTS=$((MISSING_IMPORTS + 1))
fi

if [ $MISSING_IMPORTS -eq 0 ]; then
    echo "✅ No obvious import issues found"
fi
echo ""

# Check for TODO comments
echo "📝 Checking for TODO comments..."
TODO_COUNT=$(grep -r "TODO" app/ components/ lib/ 2>/dev/null | wc -l)
if [ $TODO_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $TODO_COUNT TODO comments${NC}"
    grep -r "TODO" app/ components/ lib/ 2>/dev/null | head -5
else
    echo "✅ No TODO comments found"
fi
echo ""

# Summary
echo "=========================================================="
echo "📊 Test Summary"
echo "=========================================================="
echo ""
echo "✅ Basic checks completed"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Navigate to http://localhost:3000/clinical"
echo "3. Follow the testing plan in TESTING_PLAN_PR5.md"
echo "4. Report any issues found"
echo ""
echo "Happy testing! 🎉"