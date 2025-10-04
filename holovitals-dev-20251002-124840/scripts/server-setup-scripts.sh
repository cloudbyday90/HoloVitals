#!/bin/bash

# HoloVitals Server Development Scripts Generator
# This script creates all helper scripts for server management

echo "=================================================="
echo "Creating HoloVitals Server Management Scripts"
echo "=================================================="
echo ""

# Create scripts directory in home
SCRIPTS_DIR="$HOME/holovitals-scripts"
mkdir -p "$SCRIPTS_DIR"

# 1. Sync to GitHub Script
cat > "$SCRIPTS_DIR/sync-to-github.sh" << 'EOF'
#!/bin/bash
# Quick sync changes to GitHub

cd ~/HoloVitals

echo "📊 Checking for changes..."
git status

echo ""
read -p "Commit message: " message

if [ -z "$message" ]; then
    echo "❌ Commit message required"
    exit 1
fi

echo "📝 Adding changes..."
git add .

echo "💾 Committing..."
git commit -m "$message"

echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Done!"
EOF

# 2. Pull from GitHub Script
cat > "$SCRIPTS_DIR/pull-from-github.sh" << 'EOF'
#!/bin/bash
# Pull latest changes from GitHub

cd ~/HoloVitals

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
cd medical-analysis-platform
npm install

echo "🔄 Restarting server..."
pkill -f "next dev"
sleep 2
npm run dev > ~/holovitals.log 2>&1 &

echo "✅ Server restarted!"
echo "📋 View logs: tail -f ~/holovitals.log"
EOF

# 3. Server Management Script
cat > "$SCRIPTS_DIR/holovitals-manage.sh" << 'EOF'
#!/bin/bash
# Manage HoloVitals server

case "$1" in
    start)
        cd ~/HoloVitals/medical-analysis-platform
        npm run dev > ~/holovitals.log 2>&1 &
        echo "✅ Server started"
        echo "📋 View logs: tail -f ~/holovitals.log"
        ;;
    stop)
        pkill -f "next dev"
        echo "⏹️  Server stopped"
        ;;
    restart)
        pkill -f "next dev"
        sleep 2
        cd ~/HoloVitals/medical-analysis-platform
        npm run dev > ~/holovitals.log 2>&1 &
        echo "🔄 Server restarted"
        ;;
    status)
        if pgrep -f "next dev" > /dev/null; then
            echo "✅ Server is running"
            echo "PID: $(pgrep -f 'next dev')"
        else
            echo "❌ Server is not running"
        fi
        ;;
    logs)
        tail -f ~/holovitals.log
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
EOF

# 4. Database Backup Script
cat > "$SCRIPTS_DIR/backup-database.sh" << 'EOF'
#!/bin/bash
# Backup HoloVitals database

BACKUP_DIR="$HOME/holovitals-backups"
mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/holovitals-$DATE.sql"

echo "📦 Backing up database..."
pg_dump -U holovitals holovitals > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    echo "🗜️  Compressed: $BACKUP_FILE.gz"
    
    # Keep only last 7 backups
    cd "$BACKUP_DIR"
    ls -t holovitals-*.sql.gz | tail -n +8 | xargs -r rm
    echo "🧹 Cleaned old backups (keeping last 7)"
else
    echo "❌ Backup failed"
    exit 1
fi
EOF

# 5. Database Restore Script
cat > "$SCRIPTS_DIR/restore-database.sh" << 'EOF'
#!/bin/bash
# Restore HoloVitals database from backup

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh ~/holovitals-backups/
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo "📦 Decompressing backup..."
gunzip -c "$BACKUP_FILE" > /tmp/holovitals-restore.sql

echo "🗑️  Dropping existing database..."
dropdb -U holovitals holovitals

echo "🆕 Creating new database..."
createdb -U holovitals holovitals

echo "📥 Restoring backup..."
psql -U holovitals holovitals < /tmp/holovitals-restore.sql

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully"
    rm /tmp/holovitals-restore.sql
else
    echo "❌ Restore failed"
    exit 1
fi
EOF

# 6. System Health Check Script
cat > "$SCRIPTS_DIR/health-check.sh" << 'EOF'
#!/bin/bash
# Check HoloVitals system health

echo "=================================================="
echo "HoloVitals System Health Check"
echo "=================================================="
echo ""

# Check application
echo "🔍 Application Status:"
if pgrep -f "next dev" > /dev/null; then
    echo "  ✅ Server is running (PID: $(pgrep -f 'next dev'))"
else
    echo "  ❌ Server is not running"
fi
echo ""

# Check PostgreSQL
echo "🔍 PostgreSQL Status:"
if systemctl is-active --quiet postgresql; then
    echo "  ✅ PostgreSQL is running"
    psql -U holovitals -d holovitals -c "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "  ✅ Database connection successful"
    else
        echo "  ❌ Database connection failed"
    fi
else
    echo "  ❌ PostgreSQL is not running"
fi
echo ""

# Check Redis
echo "🔍 Redis Status:"
if systemctl is-active --quiet redis-server; then
    echo "  ✅ Redis is running"
    redis-cli ping > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "  ✅ Redis connection successful"
    else
        echo "  ❌ Redis connection failed"
    fi
else
    echo "  ❌ Redis is not running"
fi
echo ""

# Check disk space
echo "🔍 Disk Space:"
df -h / | tail -1 | awk '{print "  Used: "$3" / "$2" ("$5")"}'
echo ""

# Check memory
echo "🔍 Memory Usage:"
free -h | grep Mem | awk '{print "  Used: "$3" / "$2}'
echo ""

# Check port 3000
echo "🔍 Port 3000:"
if lsof -i :3000 > /dev/null 2>&1; then
    echo "  ✅ Port 3000 is in use"
else
    echo "  ❌ Port 3000 is not in use"
fi
echo ""

echo "=================================================="
EOF

# 7. Git Setup Script
cat > "$SCRIPTS_DIR/setup-git.sh" << 'EOF'
#!/bin/bash
# Setup Git with Personal Access Token

echo "=================================================="
echo "Git Configuration Setup"
echo "=================================================="
echo ""

read -p "Enter your GitHub username: " username
read -p "Enter your email: " email
read -sp "Enter your Personal Access Token: " token
echo ""

# Configure Git
git config --global user.name "$username"
git config --global user.email "$email"
git config --global credential.helper store

# Clone repository
echo ""
echo "Cloning repository..."
cd ~
git clone https://$username:$token@github.com/cloudbyday90/HoloVitals.git

if [ $? -eq 0 ]; then
    echo "✅ Repository cloned successfully"
    echo "📁 Location: ~/HoloVitals"
else
    echo "❌ Clone failed"
    exit 1
fi
EOF

# 8. Quick Deploy Script
cat > "$SCRIPTS_DIR/quick-deploy.sh" << 'EOF'
#!/bin/bash
# Quick deploy latest changes

echo "🚀 Quick Deploy Starting..."
echo ""

# Pull latest
echo "📥 Pulling latest changes..."
cd ~/HoloVitals
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
cd medical-analysis-platform
npm install

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Restart server
echo "🔄 Restarting server..."
pkill -f "next dev"
sleep 2
npm run dev > ~/holovitals.log 2>&1 &

echo ""
echo "✅ Deploy complete!"
echo "📋 View logs: tail -f ~/holovitals.log"
EOF

# Make all scripts executable
chmod +x "$SCRIPTS_DIR"/*.sh

# Create symlinks in ~/bin for easy access
mkdir -p "$HOME/bin"
ln -sf "$SCRIPTS_DIR/holovitals-manage.sh" "$HOME/bin/holovitals"
ln -sf "$SCRIPTS_DIR/sync-to-github.sh" "$HOME/bin/hv-sync"
ln -sf "$SCRIPTS_DIR/pull-from-github.sh" "$HOME/bin/hv-pull"
ln -sf "$SCRIPTS_DIR/quick-deploy.sh" "$HOME/bin/hv-deploy"
ln -sf "$SCRIPTS_DIR/health-check.sh" "$HOME/bin/hv-health"
ln -sf "$SCRIPTS_DIR/backup-database.sh" "$HOME/bin/hv-backup"

# Add ~/bin to PATH if not already there
if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
    echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
    echo "✅ Added ~/bin to PATH (restart shell or run: source ~/.bashrc)"
fi

echo ""
echo "=================================================="
echo "✅ All Scripts Created Successfully!"
echo "=================================================="
echo ""
echo "Scripts location: $SCRIPTS_DIR"
echo ""
echo "Quick commands (after restarting shell):"
echo "  holovitals start    - Start server"
echo "  holovitals stop     - Stop server"
echo "  holovitals restart  - Restart server"
echo "  holovitals status   - Check status"
echo "  holovitals logs     - View logs"
echo "  hv-sync            - Push to GitHub"
echo "  hv-pull            - Pull from GitHub"
echo "  hv-deploy          - Quick deploy"
echo "  hv-health          - System health check"
echo "  hv-backup          - Backup database"
echo ""
echo "Or use full paths:"
echo "  $SCRIPTS_DIR/holovitals-manage.sh"
echo "  $SCRIPTS_DIR/sync-to-github.sh"
echo "  etc..."
echo ""