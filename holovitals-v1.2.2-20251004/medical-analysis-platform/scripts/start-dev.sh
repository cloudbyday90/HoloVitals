#!/bin/bash

# HoloVitals Development Server Start Script

set -e

echo "🚀 Starting HoloVitals Development Server"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${YELLOW}📊 Checking PostgreSQL status...${NC}"
if ! sudo service postgresql status > /dev/null 2>&1; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    sudo service postgresql start
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Check if database exists
echo -e "${YELLOW}🔍 Checking database connection...${NC}"
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw holovitals; then
    echo -e "${RED}❌ Database 'holovitals' not found!${NC}"
    echo "Please run the database setup first:"
    echo "  ./scripts/setup-database.sh"
    exit 1
fi
echo -e "${GREEN}✅ Database connection verified${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Generate Prisma Client
echo -e "${YELLOW}🔄 Generating Prisma Client...${NC}"
npx prisma generate > /dev/null 2>&1
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 Starting development server...${NC}"
echo "=========================================="
echo ""
echo "Application will be available at:"
echo "  🌐 http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev