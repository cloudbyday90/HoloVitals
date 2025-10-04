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

echo "=================================================="
echo "HoloVitals v${VERSION} Production Installer"
echo "Comprehensive Terminology Update - Breaking Changes"
echo "=================================================="
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
    echo "❌ Please do not run as root. Run as your regular user."
    echo "   The script will use sudo when needed."
    exit 1
fi

# Get current user info
CURRENT_USER=$(whoami)
CURRENT_GROUP=$(id -gn)
USER_HOME=$(eval echo ~$CURRENT_USER)

echo "👤 Current user: $CURRENT_USER"
echo "👥 Primary group: $CURRENT_GROUP"
echo "🏠 Home directory: $USER_HOME"
echo ""

echo "=================================================="
echo "Domain & Configuration"
echo "=================================================="
echo ""

read -p "Enter your domain name (e.g., holovitals.com): " DOMAIN_NAME
read -p "Enter your email for notifications: " ADMIN_EMAIL

if [ -z "$DOMAIN_NAME" ] || [ -z "$ADMIN_EMAIL" ]; then
    echo "❌ Domain name and email are required"
    exit 1
fi

# Validate email format
if ! [[ "$ADMIN_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo "❌ Invalid email format"
    exit 1
fi

echo ""
echo "=================================================="
echo "Cloudflare Tunnel Setup"
echo "=================================================="
echo ""
echo "You will need your Cloudflare Tunnel token."
echo ""
echo "To get your tunnel token:"
echo "1. Go to https://one.dash.cloudflare.com/"
echo "2. Navigate to Networks > Tunnels"
echo "3. Create a new tunnel or select existing"
echo "4. Copy the tunnel token (starts with 'eyJ...')"
echo ""
read -p "Enter your Cloudflare Tunnel token: " CLOUDFLARE_TOKEN

if [ -z "$CLOUDFLARE_TOKEN" ]; then
    echo "❌ Cloudflare Tunnel token is required"
    exit 1
fi

echo ""
echo "Configuration Summary:"
echo "  Domain: $DOMAIN_NAME"
echo "  Admin Email: $ADMIN_EMAIL"
echo "  Tunnel: Configured"
echo ""

read -p "Continue with installation? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Installation cancelled"
    exit 1
fi

echo ""

echo "=================================================="
echo "Phase 1: Checking Prerequisites"
echo "=================================================="
echo ""

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
echo "=================================================="
echo "Phase 2: Repository Setup"
echo "=================================================="
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
echo "=================================================="
echo "Phase 3: Installing Dependencies"
echo "=================================================="
echo ""
print_status "Installing application dependencies..."
npm install

print_success "Dependencies installed"

echo ""
echo "=================================================="
echo "Phase 4: Environment Configuration"
echo "=================================================="
echo ""
# Generate secure database password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_NAME="holovitals"
DB_USER="holovitals"

print_status "Creating environment configuration..."

cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://$DOMAIN_NAME

# Admin
ADMIN_EMAIL=$ADMIN_EMAIL

# NextAuth
NEXTAUTH_URL=https://$DOMAIN_NAME
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Add your API keys here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
EOF

chmod 600 .env.local

print_success "Environment configuration created"

echo ""
echo "=================================================="
echo "Phase 5: Generating Prisma Client"
echo "=================================================="
echo ""
print_status "Generating Prisma client..."
npx prisma generate

print_success "Prisma client generated"

echo ""
echo "=================================================="
echo "Phase 6: Cloudflare Tunnel Setup"
echo "=================================================="
echo ""

# Install cloudflared
print_status "Installing Cloudflare Tunnel..."
if ! command -v cloudflared &> /dev/null; then
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared-linux-amd64.deb
    rm cloudflared-linux-amd64.deb
fi

# Create tunnel configuration
sudo mkdir -p /etc/cloudflared
sudo tee /etc/cloudflared/config.yml > /dev/null << EOF
tunnel: $CLOUDFLARE_TOKEN
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: $DOMAIN_NAME
    service: http://localhost:3000
  - service: http_status:404
EOF

# Install tunnel as a service
print_status "Installing Cloudflare Tunnel as system service..."
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

print_success "Cloudflare Tunnel configured"

echo ""
echo "=================================================="
echo "Phase 7: Build Application"
echo "=================================================="
echo ""

print_status "Building Next.js application..."
npm run build

print_success "Application built successfully"

echo ""
echo "=================================================="
echo "Phase 8: Next Steps & Instructions"
echo "=================================================="
echo ""
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
echo ""
echo "=================================================="
echo "Installation Complete! 🎉"
echo "=================================================="
echo ""
echo "✅ HoloVitals v${VERSION} is now running!"
echo ""
echo "📊 Application URL: https://$DOMAIN_NAME"
echo "📧 Admin Email: $ADMIN_EMAIL"
echo ""
echo "🔐 Database Credentials (SAVE THESE SECURELY):"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo ""
echo "⚠️  v1.4.1 includes BREAKING CHANGES!"
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
echo "📚 Documentation:"
echo "  • README.md"
echo "  • RELEASE_NOTES_V1.4.1.md"
echo "  • MIGRATION_GUIDE_V1.4.1.md"
echo ""
echo "🔗 Support:"
echo "  • GitHub: https://github.com/cloudbyday90/HoloVitals"
echo "  • Issues: https://github.com/cloudbyday90/HoloVitals/issues"
echo ""
echo "=================================================="
echo "Next Steps:"
echo "=================================================="
echo ""
echo "1. Update API keys in .env.local:"
echo "   nano .env.local"
echo ""
echo "2. Set up PostgreSQL database:"
echo "   sudo -u postgres psql"
echo "   CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
echo "   CREATE DATABASE $DB_NAME OWNER $DB_USER;"
echo "   GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
echo "   \\q"
echo ""
echo "3. Run database migrations:"
echo "   npx prisma migrate deploy"
echo ""
echo "4. Start the application:"
echo "   npm run dev"
echo ""
echo "5. Access your application:"
echo "   https://$DOMAIN_NAME"
echo ""
echo "=================================================="
echo "Happy coding! 🚀"
echo "=================================================="
echo ""