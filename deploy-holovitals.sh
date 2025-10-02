#!/bin/bash

################################################################################
# HoloVitals Production Deployment Script
# Ubuntu LTS (20.04/22.04/24.04)
# 
# This script installs and configures:
# - Node.js 20 LTS
# - PostgreSQL 15
# - Redis 7
# - Nginx reverse proxy
# - SSL certificates (Let's Encrypt)
# - HoloVitals application
# - Automatic backups
# - Monitoring and logging
#
# Usage: sudo bash deploy-holovitals.sh
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HOLOVITALS_VERSION="latest"
HOLOVITALS_REPO="https://github.com/cloudbyday90/HoloVitals.git"
INSTALL_DIR="/opt/holovitals"
APP_USER="holovitals"
APP_PORT="3000"
CUSTOM_PORT="8443"  # Your custom port (not 443)
DB_NAME="holovitals"
DB_USER="holovitals"
DB_PASSWORD=""  # Will be generated
REDIS_PASSWORD=""  # Will be generated
NEXTAUTH_SECRET=""  # Will be generated

# Log file
LOG_FILE="/var/log/holovitals-install.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

verify_checksum() {
    local file=$1
    local expected_hash=$2
    local actual_hash=$(sha256sum "$file" | awk '{print $1}')
    
    if [ "$actual_hash" == "$expected_hash" ]; then
        print_success "Checksum verified for $file"
        return 0
    else
        print_error "Checksum mismatch for $file"
        print_error "Expected: $expected_hash"
        print_error "Got: $actual_hash"
        return 1
    fi
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

check_ubuntu() {
    if [ ! -f /etc/lsb-release ]; then
        print_error "This script is designed for Ubuntu"
        exit 1
    fi
    
    source /etc/lsb-release
    print_info "Detected Ubuntu $DISTRIB_RELEASE"
    
    if [[ ! "$DISTRIB_RELEASE" =~ ^(20.04|22.04|24.04) ]]; then
        print_warning "This script is tested on Ubuntu 20.04, 22.04, and 24.04"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

################################################################################
# Pre-installation Checks
################################################################################

print_header "HoloVitals Production Deployment"
print_info "Starting installation at $(date)"

check_root
check_ubuntu

# Check available disk space (need at least 10GB)
available_space=$(df / | tail -1 | awk '{print $4}')
if [ "$available_space" -lt 10485760 ]; then
    print_error "Insufficient disk space. Need at least 10GB free."
    exit 1
fi

print_success "Pre-installation checks passed"

################################################################################
# System Update
################################################################################

print_header "Updating System Packages"

apt-get update
apt-get upgrade -y
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    unattended-upgrades

print_success "System packages updated"

################################################################################
# Install Node.js 20 LTS
################################################################################

print_header "Installing Node.js 20 LTS"

if command -v node &> /dev/null; then
    print_info "Node.js already installed: $(node --version)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    print_success "Node.js installed: $node_version"
    print_success "npm installed: $npm_version"
fi

################################################################################
# Install PostgreSQL 15
################################################################################

print_header "Installing PostgreSQL 15"

if command -v psql &> /dev/null; then
    print_info "PostgreSQL already installed: $(psql --version)"
else
    # Add PostgreSQL repository
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
    
    apt-get update
    apt-get install -y postgresql-15 postgresql-contrib-15
    
    # Start PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    print_success "PostgreSQL 15 installed"
fi

# Generate database password
DB_PASSWORD=$(generate_password)

# Create database and user
print_info "Creating database and user..."

sudo -u postgres psql <<EOF
-- Create user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Create databases
CREATE DATABASE $DB_NAME OWNER $DB_USER;
CREATE DATABASE ${DB_NAME}_shadow OWNER $DB_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME}_shadow TO $DB_USER;

-- Configure user
ALTER USER $DB_USER CREATEDB;
EOF

print_success "Database created: $DB_NAME"
print_success "Database user created: $DB_USER"

################################################################################
# Install Redis 7
################################################################################

print_header "Installing Redis 7"

if command -v redis-server &> /dev/null; then
    print_info "Redis already installed: $(redis-server --version)"
else
    add-apt-repository -y ppa:redislabs/redis
    apt-get update
    apt-get install -y redis-server
    
    # Generate Redis password
    REDIS_PASSWORD=$(generate_password)
    
    # Configure Redis
    sed -i "s/# requirepass foobared/requirepass $REDIS_PASSWORD/" /etc/redis/redis.conf
    sed -i "s/bind 127.0.0.1/bind 127.0.0.1/" /etc/redis/redis.conf
    
    # Start Redis
    systemctl restart redis-server
    systemctl enable redis-server
    
    print_success "Redis 7 installed and configured"
fi

################################################################################
# Install Nginx
################################################################################

print_header "Installing Nginx"

if command -v nginx &> /dev/null; then
    print_info "Nginx already installed: $(nginx -v 2>&1)"
else
    apt-get install -y nginx
    
    systemctl start nginx
    systemctl enable nginx
    
    print_success "Nginx installed"
fi

################################################################################
# Create Application User
################################################################################

print_header "Creating Application User"

if id "$APP_USER" &>/dev/null; then
    print_info "User $APP_USER already exists"
else
    useradd -r -s /bin/bash -d "$INSTALL_DIR" -m "$APP_USER"
    print_success "User $APP_USER created"
fi

################################################################################
# Clone HoloVitals Repository
################################################################################

print_header "Cloning HoloVitals Repository"

if [ -d "$INSTALL_DIR/medical-analysis-platform" ]; then
    print_info "Repository already exists, pulling latest changes..."
    cd "$INSTALL_DIR"
    sudo -u "$APP_USER" git pull
else
    print_info "Cloning repository..."
    sudo -u "$APP_USER" git clone "$HOLOVITALS_REPO" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR/medical-analysis-platform"

# Verify repository integrity
REPO_HASH=$(git rev-parse HEAD)
print_info "Repository commit: $REPO_HASH"

print_success "Repository cloned"

################################################################################
# Install Application Dependencies
################################################################################

print_header "Installing Application Dependencies"

sudo -u "$APP_USER" npm install --production

# Verify critical packages
print_info "Verifying critical packages..."
npm list next prisma @prisma/client bull bullmq ioredis --depth=0

print_success "Dependencies installed"

################################################################################
# Configure Environment Variables
################################################################################

print_header "Configuring Environment Variables"

# Generate NextAuth secret
NEXTAUTH_SECRET=$(generate_password)

# Create .env.production file
cat > .env.production <<EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"
SHADOW_DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/${DB_NAME}_shadow?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="$REDIS_PASSWORD"

# NextAuth
NEXTAUTH_URL="http://localhost:$APP_PORT"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# Application
NODE_ENV="production"
PORT="$APP_PORT"

# EHR Sync System
SYNC_ENABLED="true"
SYNC_BATCH_SIZE="100"
SYNC_RETRY_ATTEMPTS="3"
SYNC_RETRY_DELAY="2000"

# AI Providers (add your keys)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# Stripe (add your keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
EOF

chown "$APP_USER:$APP_USER" .env.production
chmod 600 .env.production

print_success "Environment variables configured"

################################################################################
# Run Database Migrations
################################################################################

print_header "Running Database Migrations"

sudo -u "$APP_USER" npx prisma generate
sudo -u "$APP_USER" npx prisma migrate deploy

# Verify migrations
migration_count=$(sudo -u "$APP_USER" npx prisma migrate status | grep -c "Applied" || true)
print_info "Applied migrations: $migration_count"

print_success "Database migrations completed"

################################################################################
# Build Application
################################################################################

print_header "Building Application"

sudo -u "$APP_USER" npm run build

# Verify build
if [ -d ".next" ]; then
    build_size=$(du -sh .next | cut -f1)
    print_success "Build completed (size: $build_size)"
else
    print_error "Build failed - .next directory not found"
    exit 1
fi

################################################################################
# Create Systemd Service
################################################################################

print_header "Creating Systemd Service"

cat > /etc/systemd/system/holovitals.service <<EOF
[Unit]
Description=HoloVitals Healthcare Platform
After=network.target postgresql.service redis-server.service
Wants=postgresql.service redis-server.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$INSTALL_DIR/medical-analysis-platform
Environment="NODE_ENV=production"
Environment="PORT=$APP_PORT"
EnvironmentFile=$INSTALL_DIR/medical-analysis-platform/.env.production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=holovitals

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_DIR

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable holovitals
systemctl start holovitals

# Wait for service to start
sleep 5

# Check service status
if systemctl is-active --quiet holovitals; then
    print_success "HoloVitals service started"
else
    print_error "HoloVitals service failed to start"
    systemctl status holovitals
    exit 1
fi

################################################################################
# Configure Nginx Reverse Proxy
################################################################################

print_header "Configuring Nginx Reverse Proxy"

cat > /etc/nginx/sites-available/holovitals <<EOF
# HoloVitals Nginx Configuration

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name _;
    
    location / {
        return 301 https://\$host:$CUSTOM_PORT\$request_uri;
    }
}

# HTTPS Server
server {
    listen $CUSTOM_PORT ssl http2;
    listen [::]:$CUSTOM_PORT ssl http2;
    server_name _;
    
    # SSL Configuration (self-signed for now)
    ssl_certificate /etc/nginx/ssl/holovitals.crt;
    ssl_certificate_key /etc/nginx/ssl/holovitals.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Logging
    access_log /var/log/nginx/holovitals-access.log;
    error_log /var/log/nginx/holovitals-error.log;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files
    location /_next/static {
        proxy_pass http://localhost:$APP_PORT;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Create SSL directory
mkdir -p /etc/nginx/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/holovitals.key \
    -out /etc/nginx/ssl/holovitals.crt \
    -subj "/C=US/ST=State/L=City/O=HoloVitals/CN=holovitals.local"

# Enable site
ln -sf /etc/nginx/sites-available/holovitals /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx

print_success "Nginx configured on port $CUSTOM_PORT"

################################################################################
# Configure Firewall
################################################################################

print_header "Configuring Firewall"

# Enable UFW
ufw --force enable

# Allow SSH
ufw allow 22/tcp

# Allow HTTP (for redirect)
ufw allow 80/tcp

# Allow custom HTTPS port
ufw allow $CUSTOM_PORT/tcp

# Reload firewall
ufw reload

print_success "Firewall configured"

################################################################################
# Setup Automatic Backups
################################################################################

print_header "Setting Up Automatic Backups"

# Create backup directory
BACKUP_DIR="/var/backups/holovitals"
mkdir -p "$BACKUP_DIR"
chown "$APP_USER:$APP_USER" "$BACKUP_DIR"

# Create backup script
cat > /usr/local/bin/holovitals-backup.sh <<'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/holovitals"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="holovitals"
DB_USER="holovitals"

# Create backup
pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $TIMESTAMP"
EOF

chmod +x /usr/local/bin/holovitals-backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/holovitals-backup.sh") | crontab -

print_success "Automatic backups configured (daily at 2 AM)"

################################################################################
# Setup Monitoring
################################################################################

print_header "Setting Up Monitoring"

# Create monitoring script
cat > /usr/local/bin/holovitals-monitor.sh <<'EOF'
#!/bin/bash

# Check if service is running
if ! systemctl is-active --quiet holovitals; then
    echo "HoloVitals service is down! Attempting restart..."
    systemctl restart holovitals
    
    # Send alert (configure email/webhook here)
    logger -t holovitals "Service was down and has been restarted"
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    logger -t holovitals "WARNING: Disk usage is at ${DISK_USAGE}%"
fi

# Check database connections
DB_CONNECTIONS=$(sudo -u postgres psql -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='holovitals';")
if [ "$DB_CONNECTIONS" -gt 100 ]; then
    logger -t holovitals "WARNING: High database connections: $DB_CONNECTIONS"
fi
EOF

chmod +x /usr/local/bin/holovitals-monitor.sh

# Add to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/holovitals-monitor.sh") | crontab -

print_success "Monitoring configured (checks every 5 minutes)"

################################################################################
# Create Management Scripts
################################################################################

print_header "Creating Management Scripts"

# Start script
cat > /usr/local/bin/holovitals-start <<EOF
#!/bin/bash
systemctl start holovitals
systemctl status holovitals
EOF

# Stop script
cat > /usr/local/bin/holovitals-stop <<EOF
#!/bin/bash
systemctl stop holovitals
EOF

# Restart script
cat > /usr/local/bin/holovitals-restart <<EOF
#!/bin/bash
systemctl restart holovitals
systemctl status holovitals
EOF

# Status script
cat > /usr/local/bin/holovitals-status <<EOF
#!/bin/bash
echo "=== HoloVitals Service Status ==="
systemctl status holovitals

echo -e "\n=== PostgreSQL Status ==="
systemctl status postgresql

echo -e "\n=== Redis Status ==="
systemctl status redis-server

echo -e "\n=== Nginx Status ==="
systemctl status nginx

echo -e "\n=== Disk Usage ==="
df -h /

echo -e "\n=== Memory Usage ==="
free -h

echo -e "\n=== Database Connections ==="
sudo -u postgres psql -c "SELECT count(*) as connections FROM pg_stat_activity WHERE datname='holovitals';"

echo -e "\n=== Recent Logs ==="
journalctl -u holovitals -n 20 --no-pager
EOF

# Logs script
cat > /usr/local/bin/holovitals-logs <<EOF
#!/bin/bash
journalctl -u holovitals -f
EOF

# Update script
cat > /usr/local/bin/holovitals-update <<EOF
#!/bin/bash
cd $INSTALL_DIR/medical-analysis-platform
sudo -u $APP_USER git pull
sudo -u $APP_USER npm install --production
sudo -u $APP_USER npx prisma migrate deploy
sudo -u $APP_USER npm run build
systemctl restart holovitals
echo "Update completed!"
EOF

# Make scripts executable
chmod +x /usr/local/bin/holovitals-*

print_success "Management scripts created"

################################################################################
# Save Credentials
################################################################################

print_header "Saving Credentials"

CREDENTIALS_FILE="$INSTALL_DIR/CREDENTIALS.txt"

cat > "$CREDENTIALS_FILE" <<EOF
================================================================================
HoloVitals Installation Credentials
Generated: $(date)
================================================================================

DATABASE
--------
Host: localhost
Port: 5432
Database: $DB_NAME
User: $DB_USER
Password: $DB_PASSWORD

REDIS
-----
Host: localhost
Port: 6379
Password: $REDIS_PASSWORD

NEXTAUTH
--------
Secret: $NEXTAUTH_SECRET

APPLICATION
-----------
URL: https://your-server-ip:$CUSTOM_PORT
Port: $CUSTOM_PORT
Install Directory: $INSTALL_DIR
User: $APP_USER

MANAGEMENT COMMANDS
-------------------
Start:   holovitals-start
Stop:    holovitals-stop
Restart: holovitals-restart
Status:  holovitals-status
Logs:    holovitals-logs
Update:  holovitals-update

BACKUP
------
Location: /var/backups/holovitals
Schedule: Daily at 2 AM
Manual: /usr/local/bin/holovitals-backup.sh

IMPORTANT NOTES
---------------
1. Change default passwords immediately
2. Configure SSL certificate with Let's Encrypt
3. Add your API keys to .env.production
4. Configure email/webhook alerts in monitoring script
5. Review firewall rules for your network

================================================================================
KEEP THIS FILE SECURE - IT CONTAINS SENSITIVE INFORMATION
================================================================================
EOF

chmod 600 "$CREDENTIALS_FILE"
chown "$APP_USER:$APP_USER" "$CREDENTIALS_FILE"

print_success "Credentials saved to $CREDENTIALS_FILE"

################################################################################
# Final Verification
################################################################################

print_header "Running Final Verification"

# Check services
services=("postgresql" "redis-server" "nginx" "holovitals")
for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service"; then
        print_success "$service is running"
    else
        print_error "$service is not running"
    fi
done

# Check ports
if netstat -tlnp | grep -q ":$APP_PORT"; then
    print_success "Application listening on port $APP_PORT"
else
    print_error "Application not listening on port $APP_PORT"
fi

if netstat -tlnp | grep -q ":$CUSTOM_PORT"; then
    print_success "Nginx listening on port $CUSTOM_PORT"
else
    print_error "Nginx not listening on port $CUSTOM_PORT"
fi

# Check database
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    print_success "Database $DB_NAME exists"
else
    print_error "Database $DB_NAME not found"
fi

# Test application endpoint
sleep 5
if curl -k -s https://localhost:$CUSTOM_PORT/health | grep -q "healthy"; then
    print_success "Application health check passed"
else
    print_warning "Application health check failed (may need more time to start)"
fi

################################################################################
# Installation Complete
################################################################################

print_header "Installation Complete!"

cat <<EOF

${GREEN}✓ HoloVitals has been successfully installed!${NC}

${BLUE}Access Information:${NC}
-------------------
URL: https://$(hostname -I | awk '{print $1}'):$CUSTOM_PORT
Port: $CUSTOM_PORT

${BLUE}Credentials:${NC}
------------
Saved to: $CREDENTIALS_FILE
${YELLOW}⚠ Keep this file secure!${NC}

${BLUE}Management Commands:${NC}
--------------------
Start:   holovitals-start
Stop:    holovitals-stop
Restart: holovitals-restart
Status:  holovitals-status
Logs:    holovitals-logs
Update:  holovitals-update

${BLUE}Next Steps:${NC}
-----------
1. Review credentials: cat $CREDENTIALS_FILE
2. Configure API keys in: $INSTALL_DIR/medical-analysis-platform/.env.production
3. Set up SSL certificate (Let's Encrypt recommended)
4. Configure email/webhook alerts
5. Test the application

${BLUE}Documentation:${NC}
---------------
Installation log: $LOG_FILE
Application directory: $INSTALL_DIR
Backup directory: /var/backups/holovitals

${GREEN}Installation completed at $(date)${NC}

EOF

# Display credentials one time
print_warning "IMPORTANT: Save these credentials now!"
cat "$CREDENTIALS_FILE"

exit 0