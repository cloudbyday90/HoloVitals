#!/bin/bash

# HoloVitals Deployment Package Creator
# Creates a tarball with all necessary files for dev environment deployment

set -e

echo "=================================================="
echo "HoloVitals Deployment Package Creator"
echo "=================================================="
echo ""

# Configuration
PACKAGE_NAME="holovitals-dev-$(date +%Y%m%d-%H%M%S)"
PACKAGE_DIR="/tmp/${PACKAGE_NAME}"
TARBALL_NAME="${PACKAGE_NAME}.tar.gz"

# Create package directory
echo "Creating package directory..."
mkdir -p "${PACKAGE_DIR}"

# Copy application files
echo "Copying application files..."
rsync -av --exclude='node_modules' \
          --exclude='.next' \
          --exclude='.git' \
          --exclude='*.log' \
          --exclude='.env*' \
          --exclude='summarized_conversations' \
          --exclude='tmp' \
          ./ "${PACKAGE_DIR}/"

# Create .env.example if it doesn't exist
echo "Creating environment template..."
cat > "${PACKAGE_DIR}/.env.example" << 'EOF'
# Database
DATABASE_URL="postgresql://holovitals:YOUR_PASSWORD@localhost:5432/holovitals"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"

# Redis
REDIS_URL="redis://localhost:6379"

# OpenAI (Optional)
OPENAI_API_KEY=""

# Stripe (Optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# App Settings
NODE_ENV="development"
PORT=3000
EOF

# Copy installation scripts
echo "Creating installation scripts..."

# Copy dev installation script
if [ -f "scripts/install-dev-enhanced.sh" ]; then
    cp scripts/install-dev-enhanced.sh "${PACKAGE_DIR}/install-dev.sh"
else
    # Fallback to inline script if enhanced version not found
    cat > "${PACKAGE_DIR}/install-dev.sh" << 'INSTALL_SCRIPT'
#!/bin/bash

# HoloVitals Dev Environment Installation Script
# For Ubuntu/Debian systems

set -e

echo "=================================================="
echo "HoloVitals Dev Environment Installer"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "Please do not run as root. Run as your regular user."
   exit 1
fi

# Update system
echo "Updating system packages..."
sudo apt-get update

# Install Node.js 20
echo "Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Install PostgreSQL
echo "Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt-get install -y postgresql postgresql-contrib
fi

# Install Redis
echo "Installing Redis..."
if ! command -v redis-cli &> /dev/null; then
    sudo apt-get install -y redis-server
fi

# Start services
echo "Starting services..."
sudo systemctl start postgresql
sudo systemctl start redis-server
sudo systemctl enable postgresql
sudo systemctl enable redis-server

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Setup PostgreSQL database
echo "Setting up PostgreSQL database..."
sudo -u postgres psql << EOF
CREATE USER holovitals WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE holovitals OWNER holovitals;
GRANT ALL PRIVILEGES ON DATABASE holovitals TO holovitals;
\q
EOF

# Generate NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create .env.local file
echo "Creating .env.local file..."
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

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed database
echo "Seeding database..."
npx prisma db seed

echo ""
echo "=================================================="
echo "Installation Complete!"
echo "=================================================="
echo ""
echo "Database Credentials (SAVE THESE):"
echo "  Username: holovitals"
echo "  Password: $DB_PASSWORD"
echo "  Database: holovitals"
echo ""
echo "NextAuth Secret: $NEXTAUTH_SECRET"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "The application will be available at:"
echo "  http://localhost:3000"
echo ""
echo "To view logs:"
echo "  npm run dev | tee app.log"
echo ""
INSTALL_SCRIPT
fi

# Copy production installation script
if [ -f "scripts/install-with-nginx.sh" ]; then
    cp scripts/install-with-nginx.sh "${PACKAGE_DIR}/install-production.sh"
fi

# Copy hardened installation script
if [ -f "scripts/install-dev-hardened.sh" ]; then
    cp scripts/install-dev-hardened.sh "${PACKAGE_DIR}/install-hardened.sh"
fi

# Copy Cloudflare Tunnel installation script
if [ -f "scripts/install-production-cloudflare.sh" ]; then
    cp scripts/install-production-cloudflare.sh "${PACKAGE_DIR}/install-cloudflare.sh"
fi

chmod +x "${PACKAGE_DIR}/install-dev.sh"
chmod +x "${PACKAGE_DIR}/install-production.sh" 2>/dev/null || true
chmod +x "${PACKAGE_DIR}/install-hardened.sh" 2>/dev/null || true
chmod +x "${PACKAGE_DIR}/install-cloudflare.sh" 2>/dev/null || true

# Create README for deployment
echo "Creating deployment README..."
cat > "${PACKAGE_DIR}/DEPLOYMENT_README.md" << 'README'
# HoloVitals Dev Environment Deployment

## Prerequisites
- Ubuntu 20.04 LTS or newer (or Debian-based system)
- At least 2GB RAM
- At least 10GB free disk space
- SSH access to your server

## Transfer Package to Server

### Option 1: Using SCP
```bash
scp holovitals-dev-*.tar.gz your-username@your-server-ip:/home/your-username/
```

### Option 2: Using SFTP
```bash
sftp your-username@your-server-ip
put holovitals-dev-*.tar.gz
exit
```

### Option 3: Using rsync
```bash
rsync -avz holovitals-dev-*.tar.gz your-username@your-server-ip:/home/your-username/
```

## Installation Steps

1. **SSH into your server:**
```bash
ssh your-username@your-server-ip
```

2. **Extract the package:**
```bash
tar -xzf holovitals-dev-*.tar.gz
cd holovitals-dev-*
```

3. **Run the installation script:**
```bash
chmod +x install-dev.sh
./install-dev.sh
```

4. **Save the credentials** displayed at the end of installation

5. **Start the development server:**
```bash
npm run dev
```

6. **Access the application:**
- If on the server: http://localhost:3000
- If remote: Set up SSH tunnel or configure firewall

## SSH Tunnel (for remote access)

If you want to access the app from your local machine:

```bash
ssh -L 3000:localhost:3000 your-username@your-server-ip
```

Then open http://localhost:3000 in your local browser.

## Firewall Configuration (optional)

To allow direct access on port 3000:

```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

Then access via: http://your-server-ip:3000

## Management Commands

### Start development server:
```bash
npm run dev
```

### View logs:
```bash
npm run dev | tee app.log
```

### Stop server:
Press `Ctrl+C` in the terminal

### Restart services:
```bash
sudo systemctl restart postgresql
sudo systemctl restart redis-server
```

### Check service status:
```bash
sudo systemctl status postgresql
sudo systemctl status redis-server
```

### View database:
```bash
psql -U holovitals -d holovitals
```

## Troubleshooting

### Port already in use:
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database connection issues:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Redis connection issues:
```bash
# Check Redis is running
sudo systemctl status redis-server

# Restart Redis
sudo systemctl restart redis-server
```

## Environment Variables

Edit `.env.local` to add API keys:

```bash
nano .env.local
```

Add your keys:
- `OPENAI_API_KEY` - For AI features
- `STRIPE_SECRET_KEY` - For payment features
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - For payment features

Then restart the server.

## Updating the Application

1. Transfer new package to server
2. Extract to new directory
3. Copy `.env.local` from old directory
4. Run `npm install` and `npx prisma migrate deploy`
5. Restart server

## Support

For issues, check:
- Application logs: `app.log`
- PostgreSQL logs: `sudo journalctl -u postgresql`
- Redis logs: `sudo journalctl -u redis-server`
- System logs: `sudo journalctl -xe`
README

# Create tarball
echo "Creating tarball..."
cd /tmp
tar -czf "${TARBALL_NAME}" "${PACKAGE_NAME}"

# Move to workspace
mv "${TARBALL_NAME}" /workspace/

# Cleanup
rm -rf "${PACKAGE_DIR}"

echo ""
echo "=================================================="
echo "Package Created Successfully!"
echo "=================================================="
echo ""
echo "Package location: /workspace/${TARBALL_NAME}"
echo "Package size: $(du -h /workspace/${TARBALL_NAME} | cut -f1)"
echo ""
echo "Next steps:"
echo "1. Download the package from /workspace/${TARBALL_NAME}"
echo "2. Transfer to your server using SCP/SFTP/rsync"
echo "3. Extract and run install-dev.sh"
echo ""
echo "See DEPLOYMENT_README.md inside the package for detailed instructions"
echo ""