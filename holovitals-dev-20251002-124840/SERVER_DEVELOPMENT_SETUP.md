# Server Development Setup Guide

## Overview
This guide sets up your Ubuntu server for continuous development with GitHub integration, allowing seamless code updates, testing, and deployment.

---

## Part 1: GitHub Personal Access Token Setup

### Step 1: Create Personal Access Token

1. **Go to GitHub Settings:**
   - Visit: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"

2. **Configure Token:**
   - **Note:** `HoloVitals Server Development`
   - **Expiration:** 90 days (or No expiration for convenience)
   - **Select scopes:**
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
     - ✅ `write:packages` (Upload packages)
     - ✅ `read:org` (Read org and team membership)

3. **Generate and Copy Token:**
   - Click "Generate token"
   - **IMPORTANT:** Copy the token immediately (you won't see it again!)
   - Format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Configure Git on Server

Once you have the token, run these commands on your server:

```bash
# Set up Git credentials
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# Store credentials securely
git config --global credential.helper store

# Clone the repository (you'll be prompted for username and token)
cd ~
git clone https://github.com/cloudbyday90/HoloVitals.git
cd HoloVitals

# When prompted:
# Username: your-github-username
# Password: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (your PAT)
```

The credentials will be stored in `~/.git-credentials` for future use.

---

## Part 2: Server Development Environment

### Directory Structure
```
/home/your-username/
├── HoloVitals/                    # Git repository (synced with GitHub)
│   ├── medical-analysis-platform/ # Main application
│   ├── .git/                      # Git metadata
│   └── ...
└── holovitals-dev/                # Running instance (optional separate copy)
```

### Option A: Work Directly in Git Repository (Recommended)
```bash
cd ~/HoloVitals/medical-analysis-platform
npm install
npm run dev
```

**Pros:**
- Changes are immediately tracked by Git
- Easy to commit and push
- Single source of truth

**Cons:**
- Must be careful not to commit sensitive data (.env files)

### Option B: Separate Development Copy
```bash
# Keep Git repo clean, work in separate directory
cp -r ~/HoloVitals ~/holovitals-dev
cd ~/holovitals-dev/medical-analysis-platform
npm install
npm run dev

# Sync changes back to Git repo when ready
rsync -av --exclude='node_modules' --exclude='.next' ~/holovitals-dev/ ~/HoloVitals/
```

**Pros:**
- Git repo stays clean
- Can experiment without affecting repo

**Cons:**
- Need to manually sync changes

---

## Part 3: Development Workflow Scripts

### Create Helper Scripts

#### 1. Quick Sync Script (`~/sync-to-github.sh`)
```bash
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
```

#### 2. Pull Updates Script (`~/pull-from-github.sh`)
```bash
#!/bin/bash
# Pull latest changes from GitHub

cd ~/HoloVitals

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
cd medical-analysis-platform
npm install

echo "🔄 Restarting server..."
# Kill existing process
pkill -f "next dev"

# Start new process in background
npm run dev > ~/holovitals.log 2>&1 &

echo "✅ Server restarted!"
echo "📋 View logs: tail -f ~/holovitals.log"
```

#### 3. Server Management Script (`~/holovitals-manage.sh`)
```bash
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
```

#### 4. Make Scripts Executable
```bash
chmod +x ~/sync-to-github.sh
chmod +x ~/pull-from-github.sh
chmod +x ~/holovitals-manage.sh
```

---

## Part 4: Remote Access for Me (SuperNinja AI)

### Option A: SSH Key Access (Most Secure)
If you want to give me direct SSH access:

1. **Generate SSH key for me:**
```bash
ssh-keygen -t ed25519 -C "superninja-ai" -f ~/.ssh/superninja_key
```

2. **Add to authorized_keys:**
```bash
cat ~/.ssh/superninja_key.pub >> ~/.ssh/authorized_keys
```

3. **Share private key with me** (securely through your AI interface)

### Option B: Shared Session (Easier)
Use `tmux` for shared terminal sessions:

```bash
# Install tmux
sudo apt-get install tmux

# Start shared session
tmux new-session -s holovitals

# I can attach to this session when needed
tmux attach -t holovitals
```

### Option C: File-Based Communication (Simplest)
Create a shared workspace:

```bash
mkdir -p ~/ai-workspace/{changes,logs,tasks}

# I'll place files here:
# ~/ai-workspace/changes/  - Code changes to apply
# ~/ai-workspace/tasks/    - Tasks to execute
# ~/ai-workspace/logs/     - Execution logs
```

---

## Part 5: Continuous Development Workflow

### Daily Workflow

#### Morning: Pull Latest Changes
```bash
cd ~/HoloVitals
git pull origin main
cd medical-analysis-platform
npm install
npm run dev
```

#### During Development: Make Changes
```bash
# Edit files
nano ~/HoloVitals/medical-analysis-platform/app/page.tsx

# Test changes (server auto-reloads)
curl http://localhost:3000

# Check logs
tail -f ~/holovitals.log
```

#### Evening: Push Changes
```bash
cd ~/HoloVitals
git add .
git commit -m "Added new feature X"
git push origin main
```

### Using Helper Scripts
```bash
# Start server
~/holovitals-manage.sh start

# Check status
~/holovitals-manage.sh status

# View logs
~/holovitals-manage.sh logs

# Restart after changes
~/holovitals-manage.sh restart

# Push to GitHub
~/sync-to-github.sh

# Pull from GitHub
~/pull-from-github.sh
```

---

## Part 6: Environment Variables Management

### Secure .env Files
```bash
# Create .env.local (never commit this!)
cd ~/HoloVitals/medical-analysis-platform
cp .env.example .env.local

# Edit with your secrets
nano .env.local

# Add to .gitignore (already done, but verify)
echo ".env.local" >> .gitignore
```

### Backup Environment Variables
```bash
# Backup .env.local securely
cp .env.local ~/.env.holovitals.backup
chmod 600 ~/.env.holovitals.backup
```

---

## Part 7: Monitoring & Debugging

### View Real-Time Logs
```bash
# Application logs
tail -f ~/holovitals.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log

# System logs
sudo journalctl -f
```

### Check Service Status
```bash
# Application
~/holovitals-manage.sh status

# PostgreSQL
sudo systemctl status postgresql

# Redis
sudo systemctl status redis-server

# Port usage
sudo lsof -i :3000
```

### Database Access
```bash
# Connect to database
psql -U holovitals -d holovitals

# Run migrations
cd ~/HoloVitals/medical-analysis-platform
npx prisma migrate deploy

# View database
npx prisma studio
```

---

## Part 8: Collaboration Setup

### For Me (SuperNinja AI) to Help You:

#### Method 1: Direct File Access
You can share files with me by:
1. Copying them to a shared location
2. Pasting content in our conversation
3. Describing the issue/task

#### Method 2: Command Execution
You run commands I provide:
```bash
# I'll provide commands like:
cd ~/HoloVitals/medical-analysis-platform
npm install new-package
git add .
git commit -m "Added feature"
git push
```

#### Method 3: Script-Based
I'll create scripts, you execute them:
```bash
# I create: ~/ai-workspace/tasks/fix-bug-123.sh
# You run:
bash ~/ai-workspace/tasks/fix-bug-123.sh
```

---

## Part 9: Quick Reference

### Essential Commands
```bash
# Start development
cd ~/HoloVitals/medical-analysis-platform && npm run dev

# Stop server
pkill -f "next dev"

# View logs
tail -f ~/holovitals.log

# Push to GitHub
cd ~/HoloVitals && git add . && git commit -m "message" && git push

# Pull from GitHub
cd ~/HoloVitals && git pull

# Restart services
sudo systemctl restart postgresql redis-server

# Check database
psql -U holovitals -d holovitals
```

### File Locations
- **Application:** `~/HoloVitals/medical-analysis-platform/`
- **Logs:** `~/holovitals.log`
- **Environment:** `~/HoloVitals/medical-analysis-platform/.env.local`
- **Database:** PostgreSQL on localhost:5432
- **Redis:** localhost:6379

---

## Part 10: Security Best Practices

### 1. Protect Sensitive Files
```bash
# Secure .env files
chmod 600 ~/HoloVitals/medical-analysis-platform/.env.local

# Secure Git credentials
chmod 600 ~/.git-credentials
```

### 2. Regular Backups
```bash
# Backup database
pg_dump -U holovitals holovitals > ~/backups/holovitals-$(date +%Y%m%d).sql

# Backup code
tar -czf ~/backups/holovitals-code-$(date +%Y%m%d).tar.gz ~/HoloVitals
```

### 3. Keep System Updated
```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Update npm packages
cd ~/HoloVitals/medical-analysis-platform
npm update
```

---

## Summary

**✅ Setup Complete When You Have:**
1. GitHub Personal Access Token configured
2. Repository cloned to server
3. Helper scripts created and executable
4. Development server running
5. Git credentials stored

**🔄 Daily Workflow:**
1. Pull latest changes: `git pull`
2. Make changes and test
3. Commit and push: `git add . && git commit -m "message" && git push`
4. Monitor logs: `tail -f ~/holovitals.log`

**🤝 Collaboration:**
- You share files/issues with me
- I provide solutions/scripts
- You execute and test
- We iterate until complete

**Ready to set this up?** Start with creating your GitHub Personal Access Token!