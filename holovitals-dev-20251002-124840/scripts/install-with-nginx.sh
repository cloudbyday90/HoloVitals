#!/bin/bash

# HoloVitals Production Installation Script with Nginx & SSL
# For Ubuntu/Debian systems

set -e

echo "=================================================="
echo "HoloVitals Production Installer with Nginx & SSL"
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

# Prompt for domain and email
echo "=================================================="
echo "Domain & SSL Configuration"
echo "=================================================="
echo ""

read -p "Enter your domain name (e.g., holovitals.com): " DOMAIN_NAME
read -p "Enter your email for SSL certificate: " SSL_EMAIL
read -p "Use www subdomain? (yes/no): " USE_WWW

if [ -z "$DOMAIN_NAME" ] || [ -z "$SSL_EMAIL" ]; then
    echo "❌ Domain name and email are required"
    exit 1
fi

# Validate email format
if ! [[ "$SSL_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo "❌ Invalid email format"
    exit 1
fi

# Set up domain list
if [ "$USE_WWW" = "yes" ]; then
    DOMAIN_LIST="$DOMAIN_NAME www.$DOMAIN_NAME"
    SERVER_NAME="$DOMAIN_NAME www.$DOMAIN_NAME"
else
    DOMAIN_LIST="$DOMAIN_NAME"
    SERVER_NAME="$DOMAIN_NAME"
fi

echo ""
echo "Configuration:"
echo "  Domain: $DOMAIN_NAME"
echo "  Email: $SSL_EMAIL"
echo "  WWW: $USE_WWW"
echo ""

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

# Install Nginx
echo "📦 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
fi

# Install Certbot for Let's Encrypt
echo "📦 Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
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
else
    echo "✅ User $CURRENT_USER already in 'holovitals' group"
fi

# Add current user to postgres group
if ! groups $CURRENT_USER | grep -q postgres; then
    echo "👤 Adding $CURRENT_USER to 'postgres' group..."
    sudo usermod -a -G postgres $CURRENT_USER
else
    echo "✅ User $CURRENT_USER already in 'postgres' group"
fi

# Add www-data to holovitals group (for nginx)
if ! groups www-data | grep -q holovitals; then
    echo "👤 Adding www-data to 'holovitals' group..."
    sudo usermod -a -G holovitals www-data
else
    echo "✅ User www-data already in 'holovitals' group"
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
sudo systemctl start nginx
sudo systemctl enable postgresql
sudo systemctl enable redis-server
sudo systemctl enable nginx

# Configure PostgreSQL
echo "🔧 Configuring PostgreSQL..."
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

if [ ! -f "$PG_HBA.backup" ]; then
    sudo cp "$PG_HBA" "$PG_HBA.backup"
fi

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

sudo -u postgres psql -c "DROP DATABASE IF EXISTS holovitals;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS holovitals;" 2>/dev/null || true

sudo -u postgres psql << EOF
CREATE USER holovitals WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE holovitals OWNER holovitals;
GRANT ALL PRIVILEGES ON DATABASE holovitals TO holovitals;
ALTER USER holovitals CREATEDB;
\q
EOF

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

# Create application directories
APP_DIR="$USER_HOME/HoloVitals"
LOGS_DIR="$USER_HOME/holovitals-logs"
BACKUPS_DIR="$USER_HOME/holovitals-backups"
SCRIPTS_DIR="$USER_HOME/holovitals-scripts"

echo "📁 Creating application directories..."
mkdir -p "$LOGS_DIR"
mkdir -p "$BACKUPS_DIR"
mkdir -p "$SCRIPTS_DIR"

# Set ownership and permissions
chown -R $CURRENT_USER:holovitals "$LOGS_DIR"
chown -R $CURRENT_USER:holovitals "$BACKUPS_DIR"
chown -R $CURRENT_USER:holovitals "$SCRIPTS_DIR"

chmod 750 "$LOGS_DIR"
chmod 750 "$BACKUPS_DIR"
chmod 750 "$SCRIPTS_DIR"

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
NEXTAUTH_URL="https://${DOMAIN_NAME}"
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
NODE_ENV="production"
PORT=3000
ENV_FILE

chmod 600 .env.local
chown $CURRENT_USER:holovitals .env.local

echo "✅ Environment file created"

echo ""
echo "=================================================="
echo "Phase 7: Node.js Dependencies & Build"
echo "=================================================="
echo ""

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build production application
echo "🔨 Building production application..."
npm run build

# Set proper ownership
chown -R $CURRENT_USER:holovitals node_modules
chown -R $CURRENT_USER:holovitals .next

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
echo "Phase 9: Nginx Configuration"
echo "=================================================="
echo ""

# Create Nginx configuration
echo "🔧 Creating Nginx configuration..."

sudo tee /etc/nginx/sites-available/holovitals > /dev/null << NGINX_CONFIG
# HoloVitals Nginx Configuration
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $SERVER_NAME;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS - Main configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $SERVER_NAME;

    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log $LOGS_DIR/nginx-access.log;
    error_log $LOGS_DIR/nginx-error.log;

    # Max upload size
    client_max_body_size 25M;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
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

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Public files
    location /public {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600";
    }
}
NGINX_CONFIG

# Enable site
sudo ln -sf /etc/nginx/sites-available/holovitals /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed"
    exit 1
fi

echo ""
echo "=================================================="
echo "Phase 10: SSL Certificate Setup"
echo "=================================================="
echo ""

# Stop Nginx temporarily for Certbot
sudo systemctl stop nginx

# Obtain SSL certificate
echo "🔐 Obtaining SSL certificate from Let's Encrypt..."
echo "   This may take a few moments..."

sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "$SSL_EMAIL" \
    -d $DOMAIN_LIST

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully"
else
    echo "❌ Failed to obtain SSL certificate"
    echo "   Please check:"
    echo "   1. Domain DNS is pointing to this server"
    echo "   2. Ports 80 and 443 are open"
    echo "   3. No other service is using port 80"
    exit 1
fi

# Setup auto-renewal
echo "🔄 Setting up automatic SSL renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Restart Nginx
sudo systemctl start nginx

echo ""
echo "=================================================="
echo "Phase 11: Systemd Service Setup"
echo "=================================================="
echo ""

# Create systemd service for HoloVitals
echo "🔧 Creating systemd service..."

sudo tee /etc/systemd/system/holovitals.service > /dev/null << SERVICE_FILE
[Unit]
Description=HoloVitals Application
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=$CURRENT_USER
Group=holovitals
WorkingDirectory=$USER_HOME/HoloVitals/medical-analysis-platform
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=append:$LOGS_DIR/holovitals.log
StandardError=append:$LOGS_DIR/holovitals-error.log

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=$LOGS_DIR $BACKUPS_DIR

[Install]
WantedBy=multi-user.target
SERVICE_FILE

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable holovitals
sudo systemctl start holovitals

echo "✅ Systemd service created and started"

echo ""
echo "=================================================="
echo "Phase 12: Firewall Configuration"
echo "=================================================="
echo ""

# Configure UFW firewall
echo "🔥 Configuring firewall..."

# Enable UFW if not already enabled
if ! sudo ufw status | grep -q "Status: active"; then
    sudo ufw --force enable
fi

# Allow SSH (important!)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Reload firewall
sudo ufw reload

echo "✅ Firewall configured"

echo ""
echo "=================================================="
echo "Phase 13: Log Rotation Setup"
echo "=================================================="
echo ""

# Create log rotation config
sudo tee /etc/logrotate.d/holovitals > /dev/null << LOGROTATE
$LOGS_DIR/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $CURRENT_USER holovitals
    sharedscripts
    postrotate
        systemctl reload holovitals > /dev/null 2>&1 || true
    endscript
}
LOGROTATE

echo "✅ Log rotation configured"

echo ""
echo "=================================================="
echo "Phase 14: Backup Configuration"
echo "=================================================="
echo ""

# Create backup script
cat > "$SCRIPTS_DIR/backup-production.sh" << 'BACKUP_SCRIPT'
#!/bin/bash
# Production backup script

BACKUP_DIR="$HOME/holovitals-backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/holovitals-$DATE.sql"

# Backup database
pg_dump -U holovitals holovitals > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Keep only last 30 backups
cd "$BACKUP_DIR"
ls -t holovitals-*.sql.gz | tail -n +31 | xargs -r rm

echo "Backup complete: $BACKUP_FILE.gz"
BACKUP_SCRIPT

chmod +x "$SCRIPTS_DIR/backup-production.sh"

# Setup daily backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * $SCRIPTS_DIR/backup-production.sh") | crontab -

echo "✅ Daily backups configured (2 AM)"

echo ""
echo "=================================================="
echo "Phase 15: Health Monitoring Setup"
echo "=================================================="
echo ""

# Create health check script
cat > "$SCRIPTS_DIR/health-check-production.sh" << 'HEALTH_SCRIPT'
#!/bin/bash
# Production health check

# Check application
if ! systemctl is-active --quiet holovitals; then
    echo "ERROR: HoloVitals service is not running"
    systemctl restart holovitals
fi

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    echo "ERROR: Nginx is not running"
    systemctl restart nginx
fi

# Check PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    echo "ERROR: PostgreSQL is not running"
    systemctl restart postgresql
fi

# Check Redis
if ! systemctl is-active --quiet redis-server; then
    echo "ERROR: Redis is not running"
    systemctl restart redis-server
fi

# Check disk space
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage is at ${DISK_USAGE}%"
fi
HEALTH_SCRIPT

chmod +x "$SCRIPTS_DIR/health-check-production.sh"

# Setup health check cron job (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * $SCRIPTS_DIR/health-check-production.sh >> $LOGS_DIR/health-check.log 2>&1") | crontab -

echo "✅ Health monitoring configured"

echo ""
echo "=================================================="
echo "Phase 16: Final Security Hardening"
echo "=================================================="
echo ""

# Set final permissions
echo "🔒 Setting final permissions..."

find . -type f -name "*.ts" -exec chmod 640 {} \;
find . -type f -name "*.tsx" -exec chmod 640 {} \;
find . -type f -name "*.js" -exec chmod 640 {} \;
find . -type f -name "*.json" -exec chmod 640 {} \;
find . -type f -name "*.sh" -exec chmod 750 {} \;
find . -type d -exec chmod 750 {} \;

chmod 600 .env.local
chmod 644 package.json

chown -R $CURRENT_USER:holovitals .

echo "✅ Permissions set"

echo ""
echo "=================================================="
echo "Installation Complete!"
echo "=================================================="
echo ""
echo "🎉 HoloVitals is now running in production!"
echo ""
echo "📊 Installation Summary:"
echo "  Domain: https://$DOMAIN_NAME"
echo "  User: $CURRENT_USER"
echo "  Application: $(pwd)"
echo "  Logs: $LOGS_DIR"
echo "  Backups: $BACKUPS_DIR"
echo ""
echo "🔐 Database Credentials (SAVE THESE):"
echo "  Username: holovitals"
echo "  Password: $DB_PASSWORD"
echo "  Database: holovitals"
echo ""
echo "🔑 NextAuth Secret: $NEXTAUTH_SECRET"
echo ""
echo "🌐 Your application is now available at:"
echo "  https://$DOMAIN_NAME"
echo ""
echo "📋 Service Management:"
echo "  sudo systemctl status holovitals    # Check status"
echo "  sudo systemctl restart holovitals   # Restart app"
echo "  sudo systemctl stop holovitals      # Stop app"
echo "  sudo systemctl start holovitals     # Start app"
echo ""
echo "📋 View Logs:"
echo "  sudo journalctl -u holovitals -f    # Application logs"
echo "  tail -f $LOGS_DIR/nginx-access.log  # Nginx access logs"
echo "  tail -f $LOGS_DIR/nginx-error.log   # Nginx error logs"
echo ""
echo "🔄 SSL Certificate:"
echo "  Auto-renewal enabled"
echo "  Expires: $(sudo certbot certificates | grep "Expiry Date" | head -1)"
echo ""
echo "💾 Backups:"
echo "  Daily automatic backups at 2 AM"
echo "  Location: $BACKUPS_DIR"
echo "  Retention: 30 days"
echo ""
echo "🏥 Health Monitoring:"
echo "  Automatic health checks every 5 minutes"
echo "  Auto-restart on failure"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "  1. Save the credentials above securely"
echo "  2. Test your site: https://$DOMAIN_NAME"
echo "  3. Configure API keys in .env.local if needed"
echo "  4. Review logs for any errors"
echo "  5. Set up monitoring alerts (optional)"
echo ""
echo "✅ Installation complete! Your site is live! 🚀"
echo ""