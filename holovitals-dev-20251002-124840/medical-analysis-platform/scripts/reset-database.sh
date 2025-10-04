#!/bin/bash

# HoloVitals Database Reset Script
# This script completely resets the database (WARNING: All data will be lost!)

set -e

echo "⚠️  HoloVitals Database Reset"
echo "=============================="
echo ""
echo "WARNING: This will delete ALL data in your database!"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ask for confirmation
read -p "Are you sure you want to reset the database? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Reset cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${RED}🗑️  Step 1: Stopping and removing containers...${NC}"
docker-compose down -v

echo ""
echo -e "${YELLOW}🔄 Step 2: Removing Prisma migrations...${NC}"
rm -rf prisma/migrations

echo ""
echo -e "${YELLOW}📦 Step 3: Starting fresh containers...${NC}"
docker-compose up -d

echo ""
echo -e "${YELLOW}⏳ Step 4: Waiting for PostgreSQL to be ready...${NC}"
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

echo -e "${YELLOW}📊 Step 5: Generating Prisma Client...${NC}"
npx prisma generate

echo ""
echo -e "${YELLOW}🔄 Step 6: Creating fresh migrations...${NC}"
npx prisma migrate dev --name initial_setup

echo ""
echo -e "${YELLOW}🌱 Step 7: Seeding database with initial data...${NC}"
npx prisma db seed

echo ""
echo -e "${GREEN}✅ Database reset complete!${NC}"
echo ""
echo "Your database has been completely reset with fresh data."