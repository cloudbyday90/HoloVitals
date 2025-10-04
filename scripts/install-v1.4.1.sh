#!/bin/bash

# HoloVitals v1.4.1 One-Line Installation Script
# Usage: curl -fsSL https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.1.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERSION="v1.4.1"
REPO_URL="https://github.com/cloudbyday90/HoloVitals.git"
INSTALL_DIR="holovitals-v1.4.1"

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  HoloVitals v1.4.1 Installer  ${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# Main installation
main() {
    print_header
    
    print_info "Starting HoloVitals v1.4.1 installation..."
    echo ""
    
    # Check system requirements
    print_info "Checking system requirements..."
    
    REQUIREMENTS_MET=true
    
    if ! check_command "node"; then
        print_error "Node.js is required. Please install Node.js 18+ from https://nodejs.org/"
        REQUIREMENTS_MET=false
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
            REQUIREMENTS_MET=false
        else
            print_success "Node.js version: $(node -v)"
        fi
    fi
    
    if ! check_command "npm"; then
        print_error "npm is required"
        REQUIREMENTS_MET=false
    fi
    
    if ! check_command "git"; then
        print_error "git is required"
        REQUIREMENTS_MET=false
    fi
    
    if ! check_command "psql"; then
        print_warning "PostgreSQL client not found. You'll need to set up the database manually."
    fi
    
    echo ""
    
    if [ "$REQUIREMENTS_MET" = false ]; then
        print_error "System requirements not met. Please install missing dependencies."
        exit 1
    fi
    
    # Clone repository
    print_info "Cloning HoloVitals repository..."
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Directory $INSTALL_DIR already exists. Removing..."
        rm -rf "$INSTALL_DIR"
    fi
    
    git clone --branch main --depth 1 "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    print_success "Repository cloned"
    echo ""
    
    # Install dependencies
    print_info "Installing dependencies (this may take a few minutes)..."
    npm install --silent
    print_success "Dependencies installed"
    echo ""
    
    # Set up environment
    print_info "Setting up environment..."
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
            print_warning "Please edit .env file with your configuration"
        else
            print_warning "No .env.example found. You'll need to create .env manually"
        fi
    else
        print_info ".env file already exists"
    fi
    echo ""
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    npx prisma generate
    print_success "Prisma client generated"
    echo ""
    
    # Database setup instructions
    print_info "Database setup:"
    echo ""
    echo "  Before running migrations, ensure:"
    echo "  1. PostgreSQL is running"
    echo "  2. Database is created"
    echo "  3. DATABASE_URL is set in .env"
    echo ""
    echo "  Then run:"
    echo "    cd $INSTALL_DIR"
    echo "    npx prisma migrate deploy"
    echo ""
    
    # Installation complete
    echo ""
    print_success "Installation complete!"
    echo ""
    print_info "Next steps:"
    echo ""
    echo "  1. Configure your environment:"
    echo "     cd $INSTALL_DIR"
    echo "     nano .env"
    echo ""
    echo "  2. Set up the database:"
    echo "     npx prisma migrate deploy"
    echo ""
    echo "  3. Start the development server:"
    echo "     npm run dev"
    echo ""
    echo "  4. Open your browser:"
    echo "     http://localhost:3000"
    echo ""
    print_warning "IMPORTANT: v1.4.1 includes breaking changes!"
    echo "  If upgrading from v1.4.0, please review:"
    echo "  - MIGRATION_GUIDE_V1.4.1.md"
    echo "  - BREAKING_CHANGES_V1.4.1.md"
    echo ""
    print_info "Documentation:"
    echo "  - README.md"
    echo "  - RELEASE_NOTES_V1.4.1.md"
    echo "  - MIGRATION_GUIDE_V1.4.1.md"
    echo ""
    print_info "Support:"
    echo "  - GitHub: https://github.com/cloudbyday90/HoloVitals"
    echo "  - Issues: https://github.com/cloudbyday90/HoloVitals/issues"
    echo ""
    print_success "Happy coding! 🚀"
}

# Run main function
main