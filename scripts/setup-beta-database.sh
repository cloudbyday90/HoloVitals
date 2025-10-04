#!/bin/bash

# HoloVitals Beta System Database Setup Script
# This script sets up the database for the beta testing system

set -e  # Exit on error

echo "🚀 HoloVitals Beta System Database Setup"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the HoloVitals root directory."
    exit 1
fi

# Check if Prisma is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm first."
    exit 1
fi

echo "📋 Step 1: Backing up current schema..."
if [ -f "prisma/schema.prisma" ]; then
    cp prisma/schema.prisma prisma/schema.prisma.backup
    echo "✅ Schema backed up to prisma/schema.prisma.backup"
else
    echo "⚠️  Warning: No existing schema found. Creating new one."
fi

echo ""
echo "📋 Step 2: Merging beta system schema..."

# Check if beta schema exists
if [ ! -f "prisma/schema-beta-system.prisma" ]; then
    echo "❌ Error: prisma/schema-beta-system.prisma not found."
    exit 1
fi

# Append beta schema to main schema (if not already added)
if ! grep -q "model BetaCode" prisma/schema.prisma 2>/dev/null; then
    echo "" >> prisma/schema.prisma
    echo "// ============================================" >> prisma/schema.prisma
    echo "// Beta Testing System Models" >> prisma/schema.prisma
    echo "// ============================================" >> prisma/schema.prisma
    echo "" >> prisma/schema.prisma
    cat prisma/schema-beta-system.prisma >> prisma/schema.prisma
    echo "✅ Beta system models added to schema"
else
    echo "ℹ️  Beta system models already in schema"
fi

echo ""
echo "📋 Step 3: Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"

echo ""
echo "📋 Step 4: Creating database migration..."
echo "ℹ️  You'll be prompted to name the migration. Suggested name: add_beta_system"
echo ""

# Run migration
npx prisma migrate dev --name add_beta_system

echo ""
echo "✅ Database migration complete!"
echo ""
echo "📋 Step 5: Verifying database..."

# Check if tables were created
echo "ℹ️  Checking for beta system tables..."
npx prisma db execute --stdin <<EOF
SELECT 
    table_name 
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
    AND table_name IN ('BetaCode', 'TokenUsage', 'FileUpload', 'BetaFeedback', 'BetaAnalytics');
EOF

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Start your development server: npm run dev"
echo "2. Navigate to: http://localhost:3000/admin/beta-codes"
echo "3. Generate your first batch of beta codes"
echo ""
echo "📚 Documentation:"
echo "- QUICK_START_GUIDE.md - How to launch beta"
echo "- BETA_SYSTEM_IMPLEMENTATION_COMPLETE.md - Beta system details"
echo ""
echo "Happy beta testing! 🚀"