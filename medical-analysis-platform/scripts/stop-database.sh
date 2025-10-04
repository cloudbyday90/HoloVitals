#!/bin/bash

# HoloVitals Database Stop Script
# This script stops the Docker PostgreSQL database

set -e

echo "🛑 Stopping HoloVitals Database"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Docker containers...${NC}"
docker-compose down

echo ""
echo -e "${GREEN}✅ Database stopped successfully!${NC}"
echo ""
echo "To start the database again, run: ./scripts/setup-database.sh"
echo "To remove all data, run: docker-compose down -v"