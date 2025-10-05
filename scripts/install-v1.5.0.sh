#!/bin/bash

# HoloVitals v1.5.0 One-Line Installer
# Installation: wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.5.0.sh && chmod +x install-v1.5.0.sh && ./install-v1.5.0.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Version
VERSION="1.5.0"
SCRIPT_BUILD="20251005-fix2"

echo "=================================================="
echo "HoloVitals v${VERSION} Production Installer"
echo "Feature Release - Admin Console Service Management"
echo "Script Build: ${SCRIPT_BUILD}"
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
echo "Development: For testing and development"
echo "  - All external services (Stripe, SMTP, OpenAI) are OPTIONAL"
echo "  - Configure services later via admin console"
echo "  - Application builds and runs without any service keys"
echo ""
echo "Production: Full deployment"
echo "  - All external services (Stripe, SMTP, OpenAI) are OPTIONAL"
echo "  - Configure services later via admin console"
echo "  - Application builds and runs without any service keys"
echo ""
echo "Note: Both modes use Cloudflare Tunnel and nginx"
echo "Note: All service API keys can be added post-install via admin console"
echo ""
read -p "Is this a development installation? (y/n): " IS_DEV

if [[ "$IS_DEV" == "y" || "$IS_DEV" == "Y" ]]; then
    INSTALL_TYPE="development"
    echo -e "${GREEN}✓${NC} Development mode selected"
    echo -e "${YELLOW}⚠${NC} All services optional - configure via admin console when ready"
else
    INSTALL_TYPE="production"
    echo -e "${GREEN}✓${NC} Production mode selected"
    echo -e "${YELLOW}⚠${NC} All services optional - configure via admin console when ready"
fi

# Get Cloudflare Tunnel token (required for both modes)
echo ""
echo -e "${YELLOW}⚠${NC} Cloudflare Tunnel Configuration"
echo "Cloudflare Tunnel is required for both development and production"
echo ""
while true; do
    read -p "Enter Cloudflare Tunnel token: " CF_TUNNEL_TOKEN
    if [[ -n "$CF_TUNNEL_TOKEN" ]]; then
        break
    else
        echo -e "${RED}❌ Cloudflare Tunnel token cannot be empty${NC}"
    fi
done

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
echo "Cloudflare Tunnel: Configured (Required)"
echo "GitHub Authentication: Configured"
echo ""
echo "External Services (Configure post-install via admin console):"
echo "  - Stripe: Optional (for payment processing)"
echo "  - SMTP: Optional (for email notifications)"
echo "  - OpenAI: Optional (for AI features)"
echo ""
echo "Application will build and run successfully without any service keys."
echo "Add service API keys later via the admin console when ready."
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

# Stay on main branch
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
cat > .env.local << EOF
# Database Configuration
DATABASE_URL="postgresql://holovitals:${DB_PASSWORD}@localhost:5432/holovitals?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="https://${DOMAIN_NAME}"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Application URLs
NEXT_PUBLIC_APP_URL="https://${DOMAIN_NAME}"
NEXT_PUBLIC_API_URL="https://${DOMAIN_NAME}/api"

# Admin Configuration
ADMIN_EMAIL="${ADMIN_EMAIL}"

# Node Environment
NODE_ENV=${INSTALL_TYPE}

# ============================================================
# EXTERNAL SERVICES (Configure via Admin Console)
# ============================================================
# All external service API keys are OPTIONAL during installation.
# The application will build and run successfully without them.
# Configure these services later via the admin console when ready.

# Stripe Configuration (Optional - Configure via Admin Console)
# Uncomment and add your keys when ready to enable payment processing:
# STRIPE_SECRET_KEY=your_stripe_secret_key_here
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
# STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# OpenAI Configuration (Managed via Admin Console)
# OpenAI is DISABLED by default. Enable and configure at:
# https://${DOMAIN_NAME}/admin/settings

# Email/SMTP Configuration (Managed via Admin Console)
# SMTP is DISABLED by default. Configure via Admin Console when needed.

# Encryption Key for Sensitive Data (GitHub PAT, Service Configs)
ENCRYPTION_KEY="$(openssl rand -base64 32)"
EOF

echo -e "${GREEN}✓${NC} Environment configuration created"
echo ""
echo -e "${YELLOW}⚠${NC} IMPORTANT: External Service Configuration"
echo "All external services are OPTIONAL and can be configured later:"
echo ""
echo "Via Admin Console (Recommended):"
echo "  1. Access admin console at https://${DOMAIN_NAME}/admin"
echo "  2. Navigate to Settings > External Services"
echo "  3. Add API keys for services you want to enable:"
echo "     - Stripe (for payment processing)"
echo "     - OpenAI (for AI features)"
echo "     - SMTP (for email notifications)"
echo ""
echo "Via .env.local (Alternative):"
echo "  1. Edit: cd $(pwd) && nano .env.local"
echo "  2. Uncomment and add keys for services you want"
echo "  3. Restart application: npm run dev (or npm run start)"
echo ""
echo "The application will run successfully without any service keys."

echo ""
echo "=================================================="
echo "Phase 5: Generating Prisma Client"
echo "=================================================="

# Check if Prisma client is already generated
if [ -d "node_modules/.prisma/client" ]; then
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

# Cloudflare Tunnel is required for both development and production
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

    # Configure tunnel
    echo "Configuring Cloudflare Tunnel..."
    sudo cloudflared service install $CF_TUNNEL_TOKEN
    echo -e "${GREEN}✓${NC} Cloudflare Tunnel configured"
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
echo "Installation Complete!"
echo "=================================================="
echo ""
echo -e "${GREEN}✓${NC} HoloVitals v${VERSION} has been installed successfully"
echo ""
echo "Installation Type: $INSTALL_TYPE"
echo "Application URL: https://${DOMAIN_NAME}"
echo ""
echo "=================================================="
echo "Next Steps"
echo "=================================================="
echo ""
echo "1. Set up PostgreSQL database:"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE holovitals;"
echo "   CREATE USER holovitals WITH PASSWORD '${DB_PASSWORD}';"
echo "   GRANT ALL PRIVILEGES ON DATABASE holovitals TO holovitals;"
echo "   \\q"
echo ""
echo "2. Run database migrations:"
echo "   npx prisma migrate deploy"
echo ""
echo "3. Start the application:"
if [[ "$INSTALL_TYPE" == "development" ]]; then
    echo "   npm run dev"
else
    echo "   npm run start"
fi
echo ""
echo "4. Access your application:"
echo "   https://${DOMAIN_NAME}"
echo ""
echo "5. Configure external services (OPTIONAL):"
echo "   - Access admin console: https://${DOMAIN_NAME}/admin/settings"
echo "   - Configure OpenAI for AI features"
echo "   - Add GitHub PAT for repository operations"
echo "   - Configure Stripe for payments (if needed)"
echo "   - All services are disabled by default and work independently"
echo ""
echo "=================================================="
echo "Support & Documentation"
echo "=================================================="
echo ""
echo "Documentation: https://github.com/cloudbyday90/HoloVitals"
echo "Issues: https://github.com/cloudbyday90/HoloVitals/issues"
echo ""
echo "=================================================="