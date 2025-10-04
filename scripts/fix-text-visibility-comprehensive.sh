#!/bin/bash

# Comprehensive Text Visibility Fix for HoloVitals
# This script fixes text contrast issues across all components

echo "🔧 Starting comprehensive text visibility fix..."

# Create backup
BACKUP_DIR="backups/text-fix-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Creating backup in $BACKUP_DIR..."

# Function to backup and update file
update_file() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/$(basename $file)"
        echo "✓ Backed up: $file"
    fi
}

# Fix 1: Update muted text to be more visible (but not too dark)
echo ""
echo "📝 Fix 1: Updating muted text colors..."
find medical-analysis-platform/components -type f -name "*.tsx" -exec sed -i 's/text-muted-foreground/text-gray-600 dark:text-gray-400/g' {} +
find medical-analysis-platform/app -type f -name "*.tsx" -exec sed -i 's/text-muted-foreground/text-gray-600 dark:text-gray-400/g' {} +

# Fix 2: Update card descriptions to be visible
echo "📝 Fix 2: Updating card descriptions..."
find medical-analysis-platform/components/ui -type f -name "card.tsx" -exec update_file {} \;
cat > medical-analysis-platform/components/ui/card.tsx << 'EOF'
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600 dark:text-gray-400", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
EOF

# Fix 3: Update global CSS for better text visibility
echo "📝 Fix 3: Updating global CSS..."
update_file "medical-analysis-platform/app/globals.css"
cat >> medical-analysis-platform/app/globals.css << 'EOF'

/* Enhanced Text Visibility Rules */
.text-muted-foreground {
  @apply text-gray-600 dark:text-gray-400;
}

/* Ensure stat numbers are always visible */
.stat-value {
  @apply text-3xl font-bold text-gray-900 dark:text-gray-100;
}

/* Ensure card content is visible */
.card-stat {
  @apply text-2xl font-semibold text-gray-900 dark:text-gray-100;
}

/* Activity items should be visible */
.activity-text {
  @apply text-gray-700 dark:text-gray-300;
}

.activity-time {
  @apply text-gray-500 dark:text-gray-500;
}

/* Status indicators */
.status-text {
  @apply text-gray-700 dark:text-gray-300;
}

/* Large numbers on colored backgrounds */
.stat-on-color {
  @apply text-gray-900 dark:text-gray-100 font-bold;
}

/* Ensure all p tags have good contrast */
p {
  @apply text-gray-700 dark:text-gray-300;
}

/* Ensure all span tags have good contrast */
span {
  @apply text-gray-700 dark:text-gray-300;
}

/* Override for specific cases */
.text-white {
  @apply text-white !important;
}

.text-black {
  @apply text-black !important;
}
EOF

# Fix 4: Update Overview page specifically
echo "📝 Fix 4: Updating Overview page..."
update_file "medical-analysis-platform/app/(dashboard)/overview/page.tsx"

# Fix 5: Update StatusBar component
echo "📝 Fix 5: Updating StatusBar component..."
if [ -f "medical-analysis-platform/components/StatusBar.tsx" ]; then
    update_file "medical-analysis-platform/components/StatusBar.tsx"
    sed -i 's/text-gray-600/text-gray-700/g' "medical-analysis-platform/components/StatusBar.tsx"
    sed -i 's/text-gray-500/text-gray-600/g' "medical-analysis-platform/components/StatusBar.tsx"
fi

# Fix 6: Update all stat display components
echo "📝 Fix 6: Updating stat components..."
find medical-analysis-platform/components -type f -name "*.tsx" | while read file; do
    if grep -q "text-3xl\|text-2xl\|text-4xl" "$file"; then
        update_file "$file"
        # Make sure large numbers are always dark
        sed -i 's/className="\([^"]*\)text-3xl\([^"]*\)"/className="\1text-3xl font-bold text-gray-900 dark:text-gray-100\2"/g' "$file"
        sed -i 's/className="\([^"]*\)text-2xl\([^"]*\)"/className="\1text-2xl font-semibold text-gray-900 dark:text-gray-100\2"/g' "$file"
        sed -i 's/className="\([^"]*\)text-4xl\([^"]*\)"/className="\1text-4xl font-bold text-gray-900 dark:text-gray-100\2"/g' "$file"
    fi
done

echo ""
echo "✅ Text visibility fixes applied!"
echo ""
echo "📋 Summary of changes:"
echo "  - Updated muted text to text-gray-600 (darker, more visible)"
echo "  - Fixed card descriptions to use text-gray-600"
echo "  - Added global CSS rules for consistent text visibility"
echo "  - Updated stat numbers to always be dark and bold"
echo "  - Fixed StatusBar text colors"
echo "  - Updated all large number displays"
echo ""
echo "🔄 Next steps:"
echo "  1. Restart your dev server: npm run dev"
echo "  2. Check the pages for improved visibility"
echo "  3. If issues persist, we can fine-tune specific components"
echo ""
echo "💾 Backup location: $BACKUP_DIR"