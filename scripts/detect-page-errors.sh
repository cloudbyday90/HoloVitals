#!/bin/bash

# Error Detection Script for HoloVitals
# Scans all pages and checks for common Next.js errors

echo "🔍 Starting comprehensive error detection..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
TOTAL_PAGES=0
PAGES_WITH_ISSUES=0

# Function to check if page exists and has proper structure
check_page() {
    local file=$1
    local route=$2
    TOTAL_PAGES=$((TOTAL_PAGES + 1))
    
    echo "Checking: $route"
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        echo -e "${RED}  ❌ File not found${NC}"
        PAGES_WITH_ISSUES=$((PAGES_WITH_ISSUES + 1))
        return
    fi
    
    # Check for 'use client' directive
    if ! head -10 "$file" | grep -q "'use client'"; then
        echo -e "${YELLOW}  ⚠️  Missing 'use client' directive${NC}"
    fi
    
    # Check for common issues
    local issues=0
    
    # Check for export default
    if ! grep -q "export default" "$file"; then
        echo -e "${RED}  ❌ Missing 'export default'${NC}"
        issues=$((issues + 1))
    fi
    
    # Check for async without proper handling
    if grep -q "export default async function" "$file" && grep -q "'use client'" "$file"; then
        echo -e "${RED}  ❌ Async function in Client Component${NC}"
        issues=$((issues + 1))
    fi
    
    # Check for useState without 'use client'
    if grep -q "useState" "$file" && ! head -10 "$file" | grep -q "'use client'"; then
        echo -e "${RED}  ❌ useState without 'use client'${NC}"
        issues=$((issues + 1))
    fi
    
    # Check for onClick without 'use client'
    if grep -q "onClick=" "$file" && ! head -10 "$file" | grep -q "'use client'"; then
        echo -e "${RED}  ❌ onClick without 'use client'${NC}"
        issues=$((issues + 1))
    fi
    
    if [ $issues -eq 0 ]; then
        echo -e "${GREEN}  ✅ No issues detected${NC}"
    else
        PAGES_WITH_ISSUES=$((PAGES_WITH_ISSUES + 1))
    fi
    
    echo ""
}

echo "=== ADMIN CONSOLE PAGES ==="
echo ""

# Admin pages
check_page "medical-analysis-platform/app/admin/page.tsx" "/admin"
check_page "medical-analysis-platform/app/admin/users/page.tsx" "/admin/users"
check_page "medical-analysis-platform/app/admin/financials/page.tsx" "/admin/financials"
check_page "medical-analysis-platform/app/admin/beta/page.tsx" "/admin/beta"
check_page "medical-analysis-platform/app/admin/analytics/page.tsx" "/admin/analytics"
check_page "medical-analysis-platform/app/admin/system/page.tsx" "/admin/system"
check_page "medical-analysis-platform/app/admin/database/page.tsx" "/admin/database"
check_page "medical-analysis-platform/app/admin/settings/page.tsx" "/admin/settings"

echo "=== DEV CONSOLE PAGES ==="
echo ""

# Dev pages
check_page "medical-analysis-platform/app/dev/page.tsx" "/dev"
check_page "medical-analysis-platform/app/dev/errors/page.tsx" "/dev/errors"
check_page "medical-analysis-platform/app/dev/api/page.tsx" "/dev/api"
check_page "medical-analysis-platform/app/dev/database/page.tsx" "/dev/database"
check_page "medical-analysis-platform/app/dev/logs/page.tsx" "/dev/logs"
check_page "medical-analysis-platform/app/dev/testing/page.tsx" "/dev/testing"
check_page "medical-analysis-platform/app/dev/docs/page.tsx" "/dev/docs"
check_page "medical-analysis-platform/app/dev/settings/page.tsx" "/dev/settings"

echo "=== SUMMARY ==="
echo ""
echo "Total pages checked: $TOTAL_PAGES"
echo "Pages with issues: $PAGES_WITH_ISSUES"
echo "Pages OK: $((TOTAL_PAGES - PAGES_WITH_ISSUES))"
echo ""

if [ $PAGES_WITH_ISSUES -gt 0 ]; then
    echo -e "${RED}⚠️  Found $PAGES_WITH_ISSUES pages with issues${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All pages look good!${NC}"
    exit 0
fi