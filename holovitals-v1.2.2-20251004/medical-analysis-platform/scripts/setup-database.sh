#!/bin/bash

# HoloVitals Database Setup Script
# This script sets up the Docker PostgreSQL database and runs migrations

set -e

echo "🚀 HoloVitals Database Setup"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Step 1: Starting Docker containers...${NC}"
docker-compose up -d

echo ""
echo -e "${YELLOW}⏳ Step 2: Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Wait for PostgreSQL to be healthy
max_attempts=30
attempt=0
until docker exec holovitals-db pg_isready -U postgres > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}❌ PostgreSQL failed to start after $max_attempts attempts${NC}"
        exit 1
    fi
    echo "Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
    sleep 2
done

echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
echo ""

echo -e "${YELLOW}📊 Step 3: Generating Prisma Client...${NC}"
npx prisma generate

echo ""
echo -e "${YELLOW}🔄 Step 4: Running database migrations...${NC}"
npx prisma migrate dev --name initial_setup

echo ""
echo -e "${YELLOW}🌱 Step 5: Seeding database with initial data...${NC}"
npx prisma db seed

echo ""
echo -e "${GREEN}✅ Database setup complete!${NC}"
echo ""
echo "=============================="
echo "📋 Database Information:"
echo "=============================="
echo "Database URL: postgresql://postgres:holovitals_dev_password_2024@localhost:5432/holovitals"
echo "PostgreSQL Port: 5432"
echo "pgAdmin URL: http://localhost:5050"
echo "pgAdmin Email: admin@holovitals.local"
echo "pgAdmin Password: admin"
echo ""
echo "=============================="
echo "🎯 Next Steps:"
echo "=============================="
echo "1. Start the development server: npm run dev"
echo "2. Access pgAdmin at http://localhost:5050 to view your database"
echo "3. Configure Stripe keys in .env.local for payment features"
echo "4. Configure AI provider keys (OpenAI/Anthropic) in .env.local"
echo ""
echo -e "${GREEN}🎉 Happy coding!${NC}"