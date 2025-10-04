#!/bin/bash

echo "🔧 Fixing dashboard text visibility..."

# Backup the file
cp medical-analysis-platform/app/dashboard/page.tsx medical-analysis-platform/app/dashboard/page.tsx.backup

# Fix all stat numbers to be visible
sed -i 's/<div className="text-2xl font-bold">/<div className="text-2xl font-bold text-gray-900 dark:text-gray-100">/g' medical-analysis-platform/app/dashboard/page.tsx

# Fix the large numbers in Cost Savings card
sed -i 's/<p className="text-3xl font-bold text-green-600">/<p className="text-3xl font-bold text-gray-900 dark:text-gray-100">/g' medical-analysis-platform/app/dashboard/page.tsx

# Fix activity item titles
sed -i 's/<p className="text-sm font-medium truncate">/<p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">/g' medical-analysis-platform/app/dashboard/page.tsx

# Fix system status labels
sed -i 's/<span className="text-sm">/<span className="text-sm text-gray-700 dark:text-gray-300">/g' medical-analysis-platform/app/dashboard/page.tsx

# Fix the welcome subtitle
sed -i 's/<p className="text-gray-800">/<p className="text-gray-700 dark:text-gray-300">/g' medical-analysis-platform/app/dashboard/page.tsx

# Fix small text in cards
sed -i 's/<p className="text-sm text-gray-800 mb-1">/<p className="text-sm text-gray-700 dark:text-gray-300 mb-1">/g' medical-analysis-platform/app/dashboard/page.tsx

echo "✅ Dashboard visibility fixed!"
echo "📝 Changes made:"
echo "  - All stat numbers now use text-gray-900 (dark and visible)"
echo "  - Activity items now have proper text colors"
echo "  - System status labels now visible"
echo "  - Welcome subtitle improved"
echo ""
echo "💾 Backup saved to: medical-analysis-platform/app/dashboard/page.tsx.backup"