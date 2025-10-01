#!/bin/bash

# HoloVitals Beta Code Generator
# Usage: ./scripts/generate-beta-codes.sh [count] [expires_in_days]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
COUNT=${1:-100}
EXPIRES=${2:-90}

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   HoloVitals Beta Code Generator      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from medical-analysis-platform directory${NC}"
    exit 1
fi

# Check if database is running
echo -e "${YELLOW}🔍 Checking database connection...${NC}"
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo -e "${YELLOW}💡 Start it with: sudo systemctl start postgresql${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database is running${NC}"
echo ""

# Generate Prisma client if needed
if [ ! -d "node_modules/.prisma" ]; then
    echo -e "${YELLOW}📦 Generating Prisma client...${NC}"
    npx prisma generate
    echo ""
fi

# Run the generator
echo -e "${BLUE}🚀 Generating ${COUNT} beta codes (expires in ${EXPIRES} days)...${NC}"
echo ""

npx ts-node scripts/generate-beta-codes.ts --count=${COUNT} --expires=${EXPIRES}

echo ""
echo -e "${GREEN}✨ Done! Check the beta-codes/ directory for the CSV file${NC}"
echo ""