#!/bin/bash

# HoloVitals Server Deployment Script
# This script is executed by GitHub Actions on the server

set -e

echo "🚀 Starting HoloVitals deployment..."

# Configuration
APP_DIR="$HOME/HoloVitals"
BACKUP_DIR="$HOME/holovitals-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MAX_BACKUPS=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Navigate to application directory
cd "$APP_DIR" || exit 1

log_info "Current directory: $(pwd)"
log_info "Current commit: $(git rev-parse --short HEAD)"

# Step 1: Create backup
log_info "Creating backup..."
if [ -d ".next" ] && [ -d "node_modules" ]; then
    tar -czf "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" .next node_modules .env.local 2>/dev/null || true
    log_info "Backup created: backup_${TIMESTAMP}.tar.gz"
else
    log_warn "No existing build to backup"
fi

# Clean old backups (keep last 10)
log_info "Cleaning old backups..."
cd "$BACKUP_DIR"
ls -t backup_*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
cd "$APP_DIR"

# Step 2: Stop application
log_info "Stopping application..."
pm2 stop holovitals 2>/dev/null || log_warn "Application not running"

# Step 3: Pull latest code
log_info "Pulling latest code from GitHub..."
git fetch origin
CURRENT_COMMIT=$(git rev-parse HEAD)
git reset --hard origin/main
NEW_COMMIT=$(git rev-parse HEAD)

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    log_info "No new changes to deploy"
else
    log_info "Deploying changes: $CURRENT_COMMIT -> $NEW_COMMIT"
fi

# Step 4: Install dependencies
log_info "Installing dependencies..."
npm ci --production=false

# Step 5: Generate Prisma client
log_info "Generating Prisma client..."
npx prisma generate

# Step 6: Run database migrations
log_info "Running database migrations..."
npx prisma migrate deploy

# Step 7: Build application
log_info "Building application..."
npm run build

# Step 8: Start application
log_info "Starting application..."
pm2 start npm --name holovitals -- start 2>/dev/null || pm2 restart holovitals

# Step 9: Health check
log_info "Performing health check..."
sleep 5

if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    log_info "✅ Health check passed!"
else
    log_error "❌ Health check failed!"
    log_error "Rolling back to previous version..."
    
    # Rollback
    git reset --hard "$CURRENT_COMMIT"
    npm ci
    npx prisma generate
    npm run build
    pm2 restart holovitals
    
    exit 1
fi

# Step 10: Save deployment info
log_info "Saving deployment info..."
cat > "$APP_DIR/deployment-info.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "commit": "$NEW_COMMIT",
  "previous_commit": "$CURRENT_COMMIT",
  "deployed_by": "GitHub Actions",
  "status": "success"
}
EOF

log_info "✅ Deployment completed successfully!"
log_info "Application is running at: https://holovitals.net"
log_info "Commit: $NEW_COMMIT"

# Show PM2 status
pm2 status holovitals