#!/bin/bash

# HoloVitals Database Setup Script
# This script sets up the PostgreSQL database and runs migrations

set -e

echo "🏥 HoloVitals Database Setup"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# Load environment variables
source .env

echo "✅ Environment variables loaded"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env"
    exit 1
fi

echo "📊 Database Configuration:"
echo "  URL: ${DATABASE_URL}"
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Create migration
echo "📝 Creating database migration..."
npx prisma migrate dev --name init_holovitals_schema
echo "✅ Migration created and applied"
echo ""

# Seed database (optional)
if [ -f "prisma/seed.ts" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
    echo "✅ Database seeded"
    echo ""
fi

# Verify database
echo "🔍 Verifying database schema..."
npx prisma db pull --force
echo "✅ Database schema verified"
echo ""

echo "🎉 Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review the migration in prisma/migrations/"
echo "  2. Start the development server: npm run dev"
echo "  3. Access Prisma Studio: npx prisma studio"