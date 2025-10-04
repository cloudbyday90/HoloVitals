#!/bin/bash

# HoloVitals Dev Environment Installation Script (Enhanced)
# For Ubuntu/Debian systems with proper permissions and security

set -e

echo "=================================================="
echo "HoloVitals Dev Environment Installer (Enhanced)"
echo "=================================================="
echo ""

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

# Confirm before proceeding
read -p "Continue with installation? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Installation cancelled"
    exit 1
fi

echo ""
echo "=================================================="
echo "Phase 1: System Updates & Package Installation"
echo "=================================================="
echo ""

# Update system
echo "📦 Updating system packages..."
sudo apt-get update

# Install Node.js 20
echo "📦 Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt-get install -y postgresql postgresql-contrib
fi

# Install Redis
echo "📦 Installing Redis..."
if ! command -v redis-cli &> /dev/null; then
    sudo apt-get install -y redis-server
fi

echo ""
echo "=================================================="
echo "Phase 2: User & Group Configuration"
echo "=================================================="
echo ""

# Create holovitals group if it doesn't exist
if ! getent group holovitals > /dev/null 2>&1; then
    echo "👥 Creating 'holovitals' group..."
    sudo groupadd holovitals
else
    echo "✅ Group 'holovitals' already exists"
fi

# Add current user to holovitals group
if ! groups $CURRENT_USER | grep -q holovitals; then
    echo "👤 Adding $CURRENT_USER to 'holovitals' group..."
    sudo usermod -a -G holovitals $CURRENT_USER
    echo "⚠️  You'll need to log out and back in for group changes to take effect"
else
    echo "✅ User $CURRENT_USER already in 'holovitals' group"
fi

# Add current user to postgres group for database access
if ! groups $CURRENT_USER | grep -q postgres; then
    echo "👤 Adding $CURRENT_USER to 'postgres' group..."
    sudo usermod -a -G postgres $CURRENT_USER
else
    echo "✅ User $CURRENT_USER already in 'postgres' group"
fi

echo ""
echo "=================================================="
echo "Phase 3: Service Configuration"
echo "=================================================="
echo ""

# Start services
echo "🚀 Starting services..."
sudo systemctl start postgresql
sudo systemctl start redis-server
sudo systemctl enable postgresql
sudo systemctl enable redis-server

# Configure PostgreSQL to allow local connections
echo "🔧 Configuring PostgreSQL..."
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

# Backup original pg_hba.conf
if [ ! -f "$PG_HBA.backup" ]; then
    sudo cp "$PG_HBA" "$PG_HBA.backup"
fi

# Ensure local connections are allowed
if ! sudo grep -q "local.*all.*all.*trust" "$PG_HBA"; then
    echo "local   all             all                                     trust" | sudo tee -a "$PG_HBA" > /dev/null
    sudo systemctl restart postgresql
fi

echo ""
echo "=================================================="
echo "Phase 4: Database Setup"
echo "=================================================="
echo ""

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Setup PostgreSQL database
echo "🗄️  Setting up PostgreSQL database..."

# Drop existing database and user if they exist
sudo -u postgres psql -c "DROP DATABASE IF EXISTS holovitals;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS holovitals;" 2>/dev/null || true

# Create new user and database
sudo -u postgres psql << EOF
CREATE USER holovitals WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE holovitals OWNER holovitals;
GRANT ALL PRIVILEGES ON DATABASE holovitals TO holovitals;
ALTER USER holovitals CREATEDB;
\q
EOF

# Grant schema permissions
sudo -u postgres psql -d holovitals << EOF
GRANT ALL ON SCHEMA public TO holovitals;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO holovitals;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO holovitals;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO holovitals;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO holovitals;
\q
EOF

echo "✅ Database created and configured"

echo ""
echo "=================================================="
echo "Phase 5: Application Directory Setup"
echo "=================================================="
echo ""

# Create application directories with proper permissions
APP_DIR="$USER_HOME/HoloVitals"
LOGS_DIR="$USER_HOME/holovitals-logs"
BACKUPS_DIR="$USER_HOME/holovitals-backups"
SCRIPTS_DIR="$USER_HOME/holovitals-scripts"

echo "📁 Creating application directories..."
mkdir -p "$LOGS_DIR"
mkdir -p "$BACKUPS_DIR"
mkdir -p "$SCRIPTS_DIR"

# Set ownership
echo "👤 Setting directory ownership..."
chown -R $CURRENT_USER:holovitals "$LOGS_DIR"
chown -R $CURRENT_USER:holovitals "$BACKUPS_DIR"
chown -R $CURRENT_USER:holovitals "$SCRIPTS_DIR"

# Set permissions
echo "🔒 Setting directory permissions..."
chmod 750 "$LOGS_DIR"      # rwxr-x---
chmod 750 "$BACKUPS_DIR"   # rwxr-x---
chmod 750 "$SCRIPTS_DIR"   # rwxr-x---

echo ""
echo "=================================================="
echo "Phase 6: Environment Configuration"
echo "=================================================="
echo ""

# Generate NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create .env.local file
echo "📝 Creating .env.local file..."
cat > .env.local << ENV_FILE
# Database
DATABASE_URL="postgresql://holovitals:${DB_PASSWORD}@localhost:5432/holovitals"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# Redis
REDIS_URL="redis://localhost:6379"

# OpenAI (Optional - add your key)
OPENAI_API_KEY=""

# Stripe (Optional - add your keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# App Settings
NODE_ENV="development"
PORT=3000
ENV_FILE

# Set proper permissions on .env.local
chmod 600 .env.local
chown $CURRENT_USER:holovitals .env.local

echo "✅ Environment file created with secure permissions (600)"

echo ""
echo "=================================================="
echo "Phase 7: Node.js Dependencies"
echo "=================================================="
echo ""

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Set proper ownership of node_modules
echo "👤 Setting node_modules ownership..."
chown -R $CURRENT_USER:holovitals node_modules
chmod -R 750 node_modules

echo ""
echo "=================================================="
echo "Phase 8: Database Initialization"
echo "=================================================="
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Seed database
echo "🌱 Seeding database..."
npx prisma db seed

echo ""
echo "=================================================="
echo "Phase 9: Log Files Setup"
echo "=================================================="
echo ""

# Create log files with proper permissions
touch "$LOGS_DIR/holovitals.log"
touch "$LOGS_DIR/error.log"
touch "$LOGS_DIR/access.log"

# Set ownership and permissions
chown $CURRENT_USER:holovitals "$LOGS_DIR"/*.log
chmod 640 "$LOGS_DIR"/*.log

# Create log rotation config
sudo tee /etc/logrotate.d/holovitals > /dev/null << EOF
$LOGS_DIR/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 $CURRENT_USER holovitals
    sharedscripts
}
EOF

echo "✅ Log files configured with rotation"

echo ""
echo "=================================================="
echo "Phase 10: Redis Configuration"
echo "=================================================="
echo ""

# Configure Redis for local access only
REDIS_CONF="/etc/redis/redis.conf"
if [ -f "$REDIS_CONF" ]; then
    sudo cp "$REDIS_CONF" "$REDIS_CONF.backup"
    
    # Ensure Redis binds to localhost only
    sudo sed -i 's/^bind .*/bind 127.0.0.1 ::1/' "$REDIS_CONF"
    
    # Disable protected mode for local development
    sudo sed -i 's/^protected-mode yes/protected-mode no/' "$REDIS_CONF"
    
    sudo systemctl restart redis-server
    echo "✅ Redis configured for local access"
fi

echo ""
echo "=================================================="
echo "Phase 11: File Permissions Audit"
echo "=================================================="
echo ""

echo "🔍 Setting final permissions..."

# Application files
find . -type f -name "*.ts" -exec chmod 640 {} \;
find . -type f -name "*.tsx" -exec chmod 640 {} \;
find . -type f -name "*.js" -exec chmod 640 {} \;
find . -type f -name "*.json" -exec chmod 640 {} \;
find . -type f -name "*.md" -exec chmod 640 {} \;

# Scripts should be executable
find . -type f -name "*.sh" -exec chmod 750 {} \;

# Directories
find . -type d -exec chmod 750 {} \;

# Special files
chmod 600 .env.local 2>/dev/null || true
chmod 600 .env 2>/dev/null || true
chmod 644 package.json
chmod 644 package-lock.json

# Set ownership recursively
chown -R $CURRENT_USER:holovitals .

echo "✅ File permissions set"

echo ""
echo "=================================================="
echo "Phase 12: Security Hardening"
echo "=================================================="
echo ""

# Create .gitignore for sensitive files
cat > .gitignore << 'GITIGNORE'
# Environment files
.env
.env.local
.env.*.local

# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local files
*.local
*.log
.DS_Store

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Database
*.db
*.sqlite

# Backups
*.backup
*.bak
GITIGNORE

chmod 644 .gitignore

# Create security checklist
cat > "$USER_HOME/SECURITY_CHECKLIST.md" << 'SECURITY'
# HoloVitals Security Checklist

## Completed During Installation
- [x] Secure password generation (25 characters)
- [x] NextAuth secret auto-generated
- [x] Database local-only access
- [x] Redis local-only access
- [x] Proper file permissions (640 for files, 750 for dirs)
- [x] Sensitive files protected (600 for .env)
- [x] User groups configured
- [x] Log rotation enabled

## Manual Steps Required
- [ ] Change default passwords
- [ ] Configure firewall (ufw)
- [ ] Setup SSL/TLS certificates
- [ ] Enable fail2ban
- [ ] Configure backup schedule
- [ ] Review and update security policies
- [ ] Setup monitoring and alerts

## Regular Maintenance
- [ ] Update system packages weekly
- [ ] Review logs daily
- [ ] Backup database daily
- [ ] Update npm packages monthly
- [ ] Review access logs weekly
- [ ] Audit user permissions monthly
SECURITY

chmod 644 "$USER_HOME/SECURITY_CHECKLIST.md"

echo "✅ Security hardening complete"

echo ""
echo "=================================================="
echo "Installation Complete!"
echo "=================================================="
echo ""
echo "📊 Installation Summary:"
echo "  User: $CURRENT_USER"
echo "  Groups: $(groups $CURRENT_USER)"
echo "  Application: $(pwd)"
echo "  Logs: $LOGS_DIR"
echo "  Backups: $BACKUPS_DIR"
echo "  Scripts: $SCRIPTS_DIR"
echo ""
echo "🔐 Database Credentials (SAVE THESE):"
echo "  Username: holovitals"
echo "  Password: $DB_PASSWORD"
echo "  Database: holovitals"
echo "  Host: localhost"
echo "  Port: 5432"
echo ""
echo "🔑 NextAuth Secret: $NEXTAUTH_SECRET"
echo ""
echo "📁 File Permissions:"
echo "  Application files: 640 (rw-r-----)"
echo "  Directories: 750 (rwxr-x---)"
echo "  Scripts: 750 (rwxr-x---)"
echo "  .env files: 600 (rw-------)"
echo "  Logs: 640 (rw-r-----)"
echo ""
echo "👥 Ownership:"
echo "  Owner: $CURRENT_USER"
echo "  Group: holovitals"
echo ""
echo "⚠️  IMPORTANT:"
echo "  1. Save the credentials above securely"
echo "  2. Log out and back in for group changes to take effect"
echo "  3. Review $USER_HOME/SECURITY_CHECKLIST.md"
echo ""
echo "🚀 To start the development server:"
echo "  npm run dev"
echo ""
echo "📋 To view logs:"
echo "  tail -f $LOGS_DIR/holovitals.log"
echo ""
echo "🌐 The application will be available at:"
echo "  http://localhost:3000"
echo ""
echo "✅ Installation complete! Happy coding! 🎉"
echo ""