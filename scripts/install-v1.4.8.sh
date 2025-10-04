#!/bin/bash

# HoloVitals v1.4.8 One-Line Installer
# Installation: wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.8.sh && chmod +x install-v1.4.8.sh && ./install-v1.4.8.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Version
VERSION="1.4.8"

echo "=================================================="
echo "HoloVitals v${VERSION} Production Installer"
echo "Feature Release - Development Mode Support"
echo "=================================================="
echo ""
echo "⚠️  Current user: $(whoami)"
echo "📁 Primary group: $(id -gn)"
echo "🏠 Home directory: $HOME"
echo ""
echo "=================================================="
echo "Domain & Configuration"
echo "=================================================="
echo ""
echo "❌ Domain name and email are required"

# Get domain name
while true; do
    read -p "Enter your domain name (e.g., holovitals.example.com): " DOMAIN_NAME
    if [[ -n "$DOMAIN_NAME" ]]; then
        break
    else
        echo -e "${RED}❌ Domain name cannot be empty${NC}"
    fi
done

# Get admin email
while true; do
    read -p "Enter admin email address: " ADMIN_EMAIL
    if [[ "$ADMIN_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        break
    else
        echo -e "${RED}❌ Invalid email format${NC}"
    fi
done

# Ask if this is a development or production installation
echo ""
echo -e "${YELLOW}⚠${NC} Installation Type"
echo "Development: For testing and visual representation (no Stripe, no Cloudflare Tunnel)"
echo "Production: Full deployment with Stripe and Cloudflare Tunnel"
echo ""
read -p "Is this a development installation? (y/n): " IS_DEV

if [[ "$IS_DEV" == "y" || "$IS_DEV" == "Y" ]]; then
    INSTALL_TYPE="development"
    CF_TUNNEL_TOKEN=""
    echo -e "${GREEN}✓${NC} Development mode selected"
else
    INSTALL_TYPE="production"
    # Get Cloudflare Tunnel token for production
    while true; do
        read -p "Enter Cloudflare Tunnel token: " CF_TUNNEL_TOKEN
        if [[ -n "$CF_TUNNEL_TOKEN" ]]; then
            break
        else
            echo -e "${RED}❌ Cloudflare Tunnel token cannot be empty${NC}"
        fi
    done
fi

# Get GitHub Personal Access Token (for private repository)
echo ""
echo -e "${YELLOW}⚠${NC} GitHub Personal Access Token Required"
echo "The HoloVitals repository is private and requires authentication."
echo "Create a PAT at: https://github.com/settings/tokens"
echo "Required scopes: repo (Full control of private repositories)"
echo ""
while true; do
    read -p "Enter GitHub Personal Access Token (PAT): " GITHUB_PAT
    if [[ -n "$GITHUB_PAT" ]]; then
        break
    else
        echo -e "${RED}❌ GitHub PAT cannot be empty${NC}"
    fi
done

echo ""
echo "=================================================="
echo "Configuration Summary"
echo "=================================================="
echo "Installation Type: $INSTALL_TYPE"
echo "Domain: $DOMAIN_NAME"
echo "Admin Email: $ADMIN_EMAIL"
if [[ "$INSTALL_TYPE" == "production" ]]; then
    echo "Cloudflare Tunnel: Configured"
else
    echo "Cloudflare Tunnel: Skipped (Development Mode)"
fi
echo "GitHub Authentication: Configured"
echo ""
read -p "Proceed with installation? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo -e "${RED}Installation cancelled${NC}"
    exit 1
fi

# Generate secure database password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

echo ""
echo "=================================================="
echo "Phase 1: Checking Prerequisites"
echo "=================================================="

# Check for required tools
echo "Checking for required tools..."
for tool in git node npm; do
    if ! command -v $tool &> /dev/null; then
        echo -e "${RED}❌ $tool is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} $tool is installed"
done

echo ""
echo "=================================================="
echo "Phase 2: Repository Setup"
echo "=================================================="

# Clone repository with authentication
if [ -d "HoloVitals" ]; then
    echo "HoloVitals directory exists..."
    cd HoloVitals
    # Check if it's a git repository
    if [ -d ".git" ]; then
        echo "Updating existing repository..."
        git pull https://${GITHUB_PAT}@github.com/cloudbyday90/HoloVitals.git main
    else
        echo "Directory exists but is not a git repository. Removing and cloning fresh..."
        cd ..
        rm -rf HoloVitals
        git clone https://${GITHUB_PAT}@github.com/cloudbyday90/HoloVitals.git
        cd HoloVitals
    fi
else
    echo "Cloning HoloVitals repository..."
    git clone https://${GITHUB_PAT}@github.com/cloudbyday90/HoloVitals.git
    cd HoloVitals
fi

# Stay on main branch (v1.4.1 tag doesn't have the application code)
echo "Using main branch..."
git checkout main

# Navigate to the application directory
echo "Navigating to medical-analysis-platform..."
cd medical-analysis-platform

echo ""
echo "=================================================="
echo "Phase 3: Installing Dependencies"
echo "=================================================="

# Check if node_modules exists and has packages
if [ -d "node_modules" ] && [ "$(ls -A node_modules 2>/dev/null)" ]; then
    echo -e "${YELLOW}⚠${NC} Dependencies appear to be already installed"
    read -p "Reinstall dependencies? (y/n): " REINSTALL
    if [[ "$REINSTALL" != "y" && "$REINSTALL" != "Y" ]]; then
        echo "Skipping dependency installation..."
        echo -e "${GREEN}✓${NC} Using existing dependencies"
    else
        echo "Installing npm packages..."
        npm install
    fi
else
    echo "Installing npm packages..."
    npm install
fi

echo ""
echo "=================================================="
echo "Phase 4: Environment Configuration"
echo "=================================================="

# Create .env.local in the medical-analysis-platform directory
echo "Creating .env.local configuration..."
if [[ "$INSTALL_TYPE" == "development" ]]; then
    # Development configuration (no Stripe)
    cat > .env.local << EOF
# Database Configuration
DATABASE_URL="postgresql://holovitals:${DB_PASSWORD}@localhost:5432/holovitals?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Application Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Admin Configuration
ADMIN_EMAIL="${ADMIN_EMAIL}"

# Feature Flags
NEXT_PUBLIC_ENABLE_CUSTOMER_PORTAL=true
NEXT_PUBLIC_ENABLE_STAFF_PORTAL=true
NEXT_PUBLIC_ENABLE_RBAC=true

# Development Mode
NODE_ENV="development"

# API Keys (Update these with your actual keys)
OPENAI_API_KEY="your-openai-api-key-here"
ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Stripe (Development - Not Required)
# STRIPE_SECRET_KEY="sk_test_..."
# STRIPE_PUBLISHABLE_KEY="pk_test_..."
# STRIPE_WEBHOOK_SECRET="whsec_..."
EOF
else
    # Production configuration (with Stripe)
    cat > .env.local << EOF
# Database Configuration
DATABASE_URL="postgresql://holovitals:${DB_PASSWORD}@localhost:5432/holovitals?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="https://${DOMAIN_NAME}"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Application Configuration
NEXT_PUBLIC_APP_URL="https://${DOMAIN_NAME}"
NEXT_PUBLIC_API_URL="https://${DOMAIN_NAME}/api"

# Admin Configuration
ADMIN_EMAIL="${ADMIN_EMAIL}"

# Feature Flags
NEXT_PUBLIC_ENABLE_CUSTOMER_PORTAL=true
NEXT_PUBLIC_ENABLE_STAFF_PORTAL=true
NEXT_PUBLIC_ENABLE_RBAC=true

# Production Mode
NODE_ENV="production"

# API Keys (Update these with your actual keys)
OPENAI_API_KEY="your-openai-api-key-here"
ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Stripe (Production - Required)
STRIPE_SECRET_KEY="your-stripe-secret-key-here"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key-here"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret-here"
EOF
fi

echo -e "${GREEN}✓${NC} Environment configuration created"

echo ""
echo "=================================================="
echo "Phase 5: Generating Prisma Client"
echo "=================================================="

# Check if Prisma client is already generated
if [ -d "node_modules/.prisma/client" ] || [ -d "node_modules/@prisma/client" ]; then
    echo -e "${YELLOW}⚠${NC} Prisma client appears to be already generated"
    read -p "Regenerate Prisma client? (y/n): " REGENERATE
    if [[ "$REGENERATE" != "y" && "$REGENERATE" != "Y" ]]; then
        echo "Skipping Prisma client generation..."
        echo -e "${GREEN}✓${NC} Using existing Prisma client"
    else
        echo "Generating Prisma client..."
        npx prisma generate
    fi
else
    echo "Generating Prisma client..."
    npx prisma generate
fi

echo ""
echo "=================================================="
echo "Phase 6: Cloudflare Tunnel Setup"
echo "=================================================="

if [[ "$INSTALL_TYPE" == "development" ]]; then
    echo -e "${YELLOW}⚠${NC} Development mode - Skipping Cloudflare Tunnel setup"
    echo "Application will be accessible at http://localhost:3000"
    echo -e "${GREEN}✓${NC} Cloudflare Tunnel skipped (Development Mode)"
else
    # Production mode - install Cloudflare Tunnel
    # Check if cloudflared service is already running
    if systemctl is-active --quiet cloudflared 2>/dev/null; then
        echo -e "${YELLOW}⚠${NC} Cloudflare Tunnel service is already running"
        echo "Skipping Cloudflare Tunnel setup..."
        echo -e "${GREEN}✓${NC} Using existing Cloudflare Tunnel configuration"
    else
        # Install cloudflared if not present
        if ! command -v cloudflared &> /dev/null; then
            echo "Installing cloudflared..."
            wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
            sudo dpkg -i cloudflared-linux-amd64.deb
            rm cloudflared-linux-amd64.deb
            echo -e "${GREEN}✓${NC} cloudflared installed"
        else
            echo -e "${GREEN}✓${NC} cloudflared already installed"
        fi

        # Configure tunnel only if service is not running
        echo "Configuring Cloudflare Tunnel..."
        sudo cloudflared service install $CF_TUNNEL_TOKEN
        echo -e "${GREEN}✓${NC} Cloudflare Tunnel configured"
    fi
fi

echo ""
echo "=================================================="
echo "Phase 7: Build Application"
echo "=================================================="

# Check if application is already built
if [ -d ".next" ]; then
    echo -e "${YELLOW}⚠${NC} Application appears to be already built"
    read -p "Rebuild application? (y/n): " REBUILD
    if [[ "$REBUILD" != "y" && "$REBUILD" != "Y" ]]; then
        echo "Skipping build..."
        echo -e "${GREEN}✓${NC} Using existing build"
    else
        echo "Building HoloVitals application..."
        npm run build
    fi
else
    echo "Building HoloVitals application..."
    npm run build
fi

echo ""
echo "=================================================="
echo "Phase 8: Next Steps & Instructions"
echo "=================================================="

echo ""
echo -e "${GREEN}✓ Installation Complete!${NC}"
echo ""
echo "Database credentials:"
echo "  Username: holovitals"
echo "  Password: ${DB_PASSWORD}"
echo "  Database: holovitals"
echo ""
echo "Next steps:"
echo "1. Set up PostgreSQL database:"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE holovitals;"
echo "   CREATE USER holovitals WITH PASSWORD '${DB_PASSWORD}';"
echo "   GRANT ALL PRIVILEGES ON DATABASE holovitals TO holovitals;"
echo "   \\q"
echo ""
echo "2. Navigate to the application directory:"
echo "   cd HoloVitals/medical-analysis-platform"
echo ""
echo "3. Run database migrations:"
echo "   npx prisma migrate deploy"
echo ""
if [[ "$INSTALL_TYPE" == "development" ]]; then
    echo "4. Update API keys in .env.local (optional for development):"
    echo "   - OPENAI_API_KEY"
    echo "   - ANTHROPIC_API_KEY"
    echo ""
    echo "5. Start the development server:"
    echo "   npm run dev"
    echo ""
    echo "6. Access your application at:"
    echo "   http://localhost:3000"
    echo ""
    echo "Note: Stripe payment features are disabled in development mode."
    echo "      Payment UI is for visual representation only."
else
    echo "4. Update API keys in .env.local:"
    echo "   - OPENAI_API_KEY"
    echo "   - ANTHROPIC_API_KEY"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - STRIPE_PUBLISHABLE_KEY"
    echo "   - STRIPE_WEBHOOK_SECRET"
    echo ""
    echo "5. Start the application:"
    echo "   npm run start"
    echo ""
    echo "6. Access your application at:"
    echo "   https://${DOMAIN_NAME}"
fi
echo ""
echo "⚠️  IMPORTANT: Save your database password securely!"
echo ""
echo "For support, visit: https://github.com/cloudbyday90/HoloVitals"
echo "=================================================="