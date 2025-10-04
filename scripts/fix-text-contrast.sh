#!/bin/bash

# Fix Text Contrast - Replace light gray text with darker, more readable colors
# This script updates all instances of hard-to-read gray text

echo "🎨 Fixing text contrast across the application..."

# Navigate to the medical-analysis-platform directory
cd "$(dirname "$0")/../medical-analysis-platform" || exit 1

# Backup count
TOTAL_CHANGES=0

# Replace text-gray-500 with text-gray-700 (darker, more readable)
echo "📝 Replacing text-gray-500 with text-gray-700..."
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/text-gray-500/text-gray-700/g' {} +
TOTAL_CHANGES=$((TOTAL_CHANGES + $(grep -r "text-gray-700" app components --include="*.tsx" --include="*.ts" | wc -l)))

# Replace text-gray-600 with text-gray-800 (much darker, highly readable)
echo "📝 Replacing text-gray-600 with text-gray-800..."
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/text-gray-600/text-gray-800/g' {} +
TOTAL_CHANGES=$((TOTAL_CHANGES + $(grep -r "text-gray-800" app components --include="*.tsx" --include="*.ts" | wc -l)))

# Replace text-gray-400 with text-gray-600 (darker)
echo "📝 Replacing text-gray-400 with text-gray-600..."
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/text-gray-400/text-gray-600/g' {} +

echo "✅ Text contrast improvements complete!"
echo "📊 Total instances updated: $TOTAL_CHANGES"
echo ""
echo "Changes made:"
echo "  - text-gray-500 → text-gray-700 (darker)"
echo "  - text-gray-600 → text-gray-800 (much darker)"
echo "  - text-gray-400 → text-gray-600 (darker)"
echo ""
echo "🔍 Review the changes with: git diff"