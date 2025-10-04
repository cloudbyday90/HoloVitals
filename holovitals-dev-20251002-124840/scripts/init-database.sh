#!/bin/bash

# HoloVitals Database Initialization Script
# This script sets up the database and runs initial migrations

set -e

echo "🚀 HoloVitals Database Initialization"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with database credentials."
    echo "See DATABASE_MIGRATION_GUIDE.md for details."
    exit 1
fi

# Load environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env file!"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Create migration
echo "📝 Creating database migration..."
read -p "Enter migration name (default: initial_schema): " MIGRATION_NAME
MIGRATION_NAME=${MIGRATION_NAME:-initial_schema}

npx prisma migrate dev --name "$MIGRATION_NAME"
echo "✅ Migration created and applied"
echo ""

# Run seed script
echo "🌱 Seeding database with initial data..."
npx prisma db seed
echo "✅ Database seeded"
echo ""

# Verify migration
echo "🔍 Verifying migration status..."
npx prisma migrate status
echo ""

echo "🎉 Database initialization complete!"
echo ""
echo "Next steps:"
echo "1. Review the migration in prisma/migrations/"
echo "2. Test database connection: npx prisma studio"
echo "3. Start your application"
echo ""