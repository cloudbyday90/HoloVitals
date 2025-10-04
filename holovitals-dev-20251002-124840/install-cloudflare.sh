#!/bin/bash

# HoloVitals Production Installation with Cloudflare Tunnel
# For Ubuntu/Debian systems

set -e

echo "=================================================="
echo "HoloVitals Production Installer"
echo "with Cloudflare Tunnel Integration"
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

echo "=================================================="
echo "Domain & Cloudflare Tunnel Configuration"
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
echo "Configuration:"
echo "  Domain: $DOMAIN_NAME"
echo "  Email: $ADMIN_EMAIL"
echo "  Tunnel: Configured"
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
sudo apt-get upgrade -y

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

# Install Cloudflared
echo "📦 Installing Cloudflared..."
if ! command -v cloudflared &> /dev/null; then
    # Add cloudflare gpg key
    sudo mkdir -p --mode=0755 /usr/share/keyrings
    curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
    
    # Add cloudflare repo
    echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
    
    # Update and install
    sudo apt-get update
    sudo apt-get install -y cloudflared
fi

CLOUDFLARED_VERSION=$(cloudflared --version)
echo "✅ Cloudflared version: $CLOUDFLARED_VERSION"

echo ""
echo "=================================================="
echo "Phase 2: User & Group Configuration"
echo "=================================================="
echo ""

# Create holovitals group
if ! getent group holovitals > /dev/null 2>&1; then
    echo "👥 Creating 'holovitals' group..."
    sudo groupadd holovitals
fi

# Add users to groups
for user in $CURRENT_USER www-data; do
    if ! groups $user | grep -q holovitals; then
        echo "👤 Adding $user to 'holovitals' group..."
        sudo usermod -a -G holovitals $user
    fi
done

if ! groups $CURRENT_USER | grep -q postgres; then
    echo "👤 Adding $CURRENT_USER to 'postgres' group..."
    sudo usermod -a -G postgres $CURRENT_USER
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

# Create directories
APP_DIR="$USER_HOME/HoloVitals"
LOGS_DIR="$USER_HOME/holovitals-logs"
BACKUPS_DIR="$USER_HOME/holovitals-backups"
SCRIPTS_DIR="$USER_HOME/holovitals-scripts"

echo "📁 Creating application directories..."
sudo mkdir -p "$LOGS_DIR"
sudo mkdir -p "$BACKUPS_DIR"
sudo mkdir -p "$SCRIPTS_DIR"

# Set ownership and permissions
sudo chown -R $CURRENT_USER:holovitals "$LOGS_DIR"
sudo chown -R $CURRENT_USER:holovitals "$BACKUPS_DIR"
sudo chown -R $CURRENT_USER:holovitals "$SCRIPTS_DIR"

sudo chmod 750 "$LOGS_DIR"
sudo chmod 750 "$BACKUPS_DIR"
sudo chmod 750 "$SCRIPTS_DIR"

# Copy application files to APP_DIR
echo "📦 Copying application files..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sudo mkdir -p "$APP_DIR"
sudo cp -r "$SCRIPT_DIR/medical-analysis-platform/"* "$APP_DIR/"
sudo chown -R $CURRENT_USER:holovitals "$APP_DIR"
sudo chmod -R 750 "$APP_DIR"

# Change to application directory
cd "$APP_DIR"
echo "✅ Application files copied to $APP_DIR"


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

sudo chmod 600 .env.local
sudo chown $CURRENT_USER:holovitals .env.local

echo "✅ Environment file created"

echo ""
echo "=================================================="
echo "Phase 7: Node.js Dependencies & Build"
echo "=================================================="
echo ""

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Generate Prisma client BEFORE building
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build production application
# Apply build fixes
bash apply-build-fixes.sh

echo "🔨 Building production application..."
npm run build

# Set proper ownership
sudo chown -R $CURRENT_USER:holovitals node_modules
sudo chown -R $CURRENT_USER:holovitals .next

echo ""
echo "=================================================="
echo "Phase 8: Database Initialization"
echo "=================================================="
echo ""

# Prisma client already generated in Phase 7
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
# HoloVitals Nginx Configuration for Cloudflare Tunnel
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cloudflare real IP
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2a06:98c0::/29;
    set_real_ip_from 2c0f:f248::/32;
    real_ip_header CF-Connecting-IP;

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

# Restart Nginx
sudo systemctl restart nginx

echo ""
echo "=================================================="
echo "Phase 10: Cloudflare Tunnel Setup"
echo "=================================================="
echo ""

echo "🔧 Configuring Cloudflare Tunnel..."

# Create cloudflared config directory
sudo mkdir -p /etc/cloudflared

# Create tunnel configuration
sudo tee /etc/cloudflared/config.yml > /dev/null << TUNNEL_CONFIG
tunnel: $CLOUDFLARE_TOKEN
credentials-file: /etc/cloudflared/cert.json

ingress:
  - hostname: $DOMAIN_NAME
    service: http://localhost:80
  - hostname: www.$DOMAIN_NAME
    service: http://localhost:80
  - service: http_status:404
TUNNEL_CONFIG

# Create credentials file
echo "$CLOUDFLARE_TOKEN" | sudo tee /etc/cloudflared/cert.json > /dev/null
sudo chmod 600 /etc/cloudflared/cert.json

# Install cloudflared as a service
echo "🔧 Installing Cloudflare Tunnel service..."
sudo cloudflared service install

# Start and enable the service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Wait for tunnel to connect
echo "⏳ Waiting for tunnel to connect..."
sleep 5

# Check tunnel status
if sudo systemctl is-active --quiet cloudflared; then
    echo "✅ Cloudflare Tunnel is running"
else
    echo "⚠️  Cloudflare Tunnel may need manual configuration"
    echo "   Check status: sudo systemctl status cloudflared"
fi

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

# Note: We don't need to open ports 80/443 since Cloudflare Tunnel handles this
echo "✅ Firewall configured (SSH only - Cloudflare Tunnel handles web traffic)"

# Reload firewall
sudo ufw reload

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

sudo chmod +x "$SCRIPTS_DIR/backup-production.sh"

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

# Check Cloudflare Tunnel
if ! systemctl is-active --quiet cloudflared; then
    echo "ERROR: Cloudflare Tunnel is not running"
    systemctl restart cloudflared
fi

# Check disk space
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage is at ${DISK_USAGE}%"
fi
HEALTH_SCRIPT

sudo chmod +x "$SCRIPTS_DIR/health-check-production.sh"

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

sudo chmod 600 .env.local
sudo chmod 644 package.json

sudo chown -R $CURRENT_USER:holovitals .

echo "✅ Permissions set"

echo ""
echo "=================================================="
echo "Installation Complete!"
echo "=================================================="
echo ""
echo "🎉 HoloVitals is now running in production with Cloudflare Tunnel!"
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
echo "  https://www.$DOMAIN_NAME"
echo ""
echo "🔒 Security Features:"
echo "  ✅ Cloudflare Tunnel (no open ports!)"
echo "  ✅ Nginx reverse proxy"
echo "  ✅ Cloudflare SSL/TLS"
echo "  ✅ Firewall (SSH only)"
echo "  ✅ Systemd service (auto-restart)"
echo "  ✅ Daily backups (2 AM)"
echo "  ✅ Health monitoring (every 5 minutes)"
echo ""
echo "📋 Service Management:"
echo "  sudo systemctl status holovitals    # Check app status"
echo "  sudo systemctl restart holovitals   # Restart app"
echo "  sudo systemctl status cloudflared   # Check tunnel status"
echo "  sudo systemctl restart cloudflared  # Restart tunnel"
echo "  sudo systemctl status nginx         # Check nginx status"
echo ""
echo "📋 View Logs:"
echo "  sudo journalctl -u holovitals -f    # Application logs"
echo "  sudo journalctl -u cloudflared -f   # Tunnel logs"
echo "  tail -f $LOGS_DIR/nginx-access.log  # Nginx access logs"
echo "  tail -f $LOGS_DIR/nginx-error.log   # Nginx error logs"
echo ""
echo "🔄 Cloudflare Tunnel:"
echo "  Status: sudo systemctl status cloudflared"
echo "  Logs: sudo journalctl -u cloudflared -f"
echo "  Config: /etc/cloudflared/config.yml"
echo ""
echo "💾 Backups:"
echo "  Daily automatic backups at 2 AM"
echo "  Location: $BACKUPS_DIR"
echo "  Retention: 30 days"
echo ""
echo "🏥 Health Monitoring:"
echo "  Automatic health checks every 5 minutes"
echo "  Auto-restart on failure"
echo "  Monitors: App, Nginx, PostgreSQL, Redis, Cloudflare Tunnel"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "  1. Save the credentials above securely"
echo "  2. Test your site: https://$DOMAIN_NAME"
echo "  3. Verify Cloudflare Tunnel: sudo systemctl status cloudflared"
echo "  4. Configure API keys in .env.local if needed"
echo "  5. Review logs for any errors"
echo ""
echo "📖 Cloudflare Dashboard:"
echo "  Go to: https://one.dash.cloudflare.com/"
echo "  Navigate to: Networks > Tunnels"
echo "  You should see your tunnel connected"
echo ""
echo "✅ Installation complete! Your site is live via Cloudflare Tunnel! 🚀"
echo ""