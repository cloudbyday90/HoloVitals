#!/bin/bash

# HoloVitals v1.4.1 One-Line Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.1.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Version
VERSION="1.4.1"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║           HoloVitals v${VERSION} Installation Script          ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║  Comprehensive Terminology Update - Breaking Changes      ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print status messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "Running as root. Consider using a non-root user for security."
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi
print_success "npm $(npm -v) detected"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL client not found. Make sure PostgreSQL is accessible."
else
    print_success "PostgreSQL client detected"
fi

# Check git
if ! command -v git &> /dev/null; then
    print_error "git is not installed. Please install git first."
    exit 1
fi
print_success "git detected"

echo ""

# Installation directory
INSTALL_DIR="${INSTALL_DIR:-holovitals-v${VERSION}}"

print_status "Installation directory: ${INSTALL_DIR}"
echo ""

# Clone or update repository
if [ -d "$INSTALL_DIR" ]; then
    print_warning "Directory ${INSTALL_DIR} already exists."
    print_status "Removing existing directory..."
    rm -rf "$INSTALL_DIR"
fi

print_status "Cloning HoloVitals repository..."
git clone --branch main --depth 1 https://github.com/cloudbyday90/HoloVitals.git "$INSTALL_DIR"
cd "$INSTALL_DIR"

print_success "Repository cloned"
echo ""

# Install dependencies
print_status "Installing dependencies (this may take a few minutes)..."
npm install --legacy-peer-deps

print_success "Dependencies installed"
echo ""

# Setup environment file
if [ ! -f .env ]; then
    print_status "Creating .env file..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success ".env file created from .env.example"
        print_warning "Please configure your .env file with your database credentials"
    else
        print_warning "No .env.example found. You'll need to create .env manually"
    fi
else
    print_success ".env file already exists"
fi

echo ""

# Generate Prisma Client
print_status "Generating Prisma client..."
npx prisma generate

print_success "Prisma client generated"
echo ""

# Database setup
print_status "Database setup instructions..."
echo ""
echo "To complete the installation, run the following commands:"
echo ""
echo -e "${YELLOW}1. Configure your database in .env file${NC}"
echo -e "   ${BLUE}cd ${INSTALL_DIR}${NC}"
echo -e "   ${BLUE}nano .env${NC}"
echo ""
echo -e "${YELLOW}2. Run database migrations${NC}"
echo -e "   ${BLUE}npx prisma migrate deploy${NC}"
echo ""
echo -e "${YELLOW}3. Start the development server${NC}"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo -e "${YELLOW}4. Open your browser${NC}"
echo -e "   ${BLUE}http://localhost:3000${NC}"
echo ""

# Important notes
echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                    IMPORTANT NOTES                         ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⚠️  v1.4.1 includes BREAKING CHANGES!${NC}"
echo ""
echo "If upgrading from v1.4.0, please review:"
echo "  • MIGRATION_GUIDE_V1.4.1.md"
echo "  • BREAKING_CHANGES_V1.4.1.md"
echo ""
echo "Key changes:"
echo "  • All 'patient' terminology changed to 'customer'"
echo "  • Database models renamed"
echo "  • API endpoints updated"
echo "  • Migration required"
echo ""

# Success message
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Installation Complete!                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  • README.md"
echo "  • RELEASE_NOTES_V1.4.1.md"
echo "  • MIGRATION_GUIDE_V1.4.1.md"
echo ""
echo -e "${BLUE}Support:${NC}"
echo "  • GitHub: https://github.com/cloudbyday90/HoloVitals"
echo "  • Issues: https://github.com/cloudbyday90/HoloVitals/issues"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""