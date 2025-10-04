# 🤖 AI Collaboration Guide - Working Together on Your Server

## Overview
This guide explains how we (you and SuperNinja AI) will collaborate on your Ubuntu server for continuous HoloVitals development.

---

## 🎯 Our Collaboration Model

### What You'll Do:
1. **Set up the server** (one-time setup)
2. **Share access** with me when needed
3. **Execute commands** I provide
4. **Test changes** and provide feedback
5. **Deploy to production** when ready

### What I'll Do:
1. **Analyze issues** and requirements
2. **Write code** and solutions
3. **Create scripts** for automation
4. **Debug problems** with you
5. **Optimize performance** and security

---

## 🔧 Setup Process

### Phase 1: Initial Server Setup (You)

1. **Transfer deployment package to server:**
```bash
scp holovitals-dev-20251002-111939.tar.gz your-username@your-server-ip:~/
```

2. **Extract and install:**
```bash
ssh your-username@your-server-ip
tar -xzf holovitals-dev-20251002-111939.tar.gz
cd holovitals-dev-20251002-111939
./install-dev.sh
```

3. **Create GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `repo`, `workflow`
   - Copy the token (starts with `ghp_`)

4. **Clone repository with token:**
```bash
cd ~
git clone https://YOUR_USERNAME:YOUR_TOKEN@github.com/cloudbyday90/HoloVitals.git
cd HoloVitals
```

5. **Install helper scripts:**
```bash
bash scripts/server-setup-scripts.sh
source ~/.bashrc
```

### Phase 2: Verify Everything Works (You)

```bash
# Check system health
hv-health

# Start server
holovitals start

# View logs
holovitals logs

# Test in browser
curl http://localhost:3000
```

---

## 🤝 Daily Collaboration Workflow

### Scenario 1: You Need a New Feature

**You say:**
> "I need to add a patient export feature that generates PDF reports"

**I respond with:**
1. **Analysis:** Explain what needs to be done
2. **Code:** Provide the complete implementation
3. **Instructions:** Step-by-step commands to apply changes

**You execute:**
```bash
# I'll provide specific commands like:
cd ~/HoloVitals/medical-analysis-platform

# Create new file
cat > lib/services/PDFExportService.ts << 'EOF'
[... code I provide ...]
EOF

# Install dependencies
npm install jspdf

# Restart server
holovitals restart

# Test the feature
curl http://localhost:3000/api/export/patient/123
```

### Scenario 2: You Found a Bug

**You say:**
> "The patient search is returning duplicate results"

**You share:**
```bash
# Share relevant logs
holovitals logs | grep "patient search" | tail -20

# Or share specific file content
cat ~/HoloVitals/medical-analysis-platform/app/api/patients/search/route.ts
```

**I analyze and provide:**
1. **Root cause:** Explanation of the bug
2. **Fix:** Updated code
3. **Test:** Commands to verify fix

**You apply:**
```bash
# I'll provide the exact fix
cd ~/HoloVitals/medical-analysis-platform
nano app/api/patients/search/route.ts
# [paste the fixed code I provide]

# Test
holovitals restart
curl http://localhost:3000/api/patients/search?query=john
```

### Scenario 3: Database Changes Needed

**You say:**
> "I need to add a new field to track patient consent"

**I provide:**
1. **Schema update:** Prisma schema changes
2. **Migration:** Migration commands
3. **Code updates:** Any related code changes

**You execute:**
```bash
cd ~/HoloVitals/medical-analysis-platform

# Update schema (I'll provide the exact changes)
nano prisma/schema.prisma

# Generate migration
npx prisma migrate dev --name add_patient_consent

# Update code (I'll provide the files)
nano lib/services/PatientService.ts

# Restart
holovitals restart
```

---

## 📁 File Sharing Methods

### Method 1: Direct Paste (Best for Small Changes)

**You share:**
```
Here's the error I'm getting:
[paste error message]

Here's the file content:
[paste file content]
```

**I provide:**
```
Here's the fix:
[provide corrected code]

Apply it with:
nano path/to/file.ts
[paste this code]
```

### Method 2: File Upload (Best for Large Files)

**You share:**
```bash
# Copy file content to clipboard
cat ~/HoloVitals/medical-analysis-platform/app/page.tsx

# Then paste in our conversation
```

**I provide:**
```bash
# Complete updated file
cat > ~/HoloVitals/medical-analysis-platform/app/page.tsx << 'EOF'
[... complete file content ...]
EOF
```

### Method 3: Git Diff (Best for Multiple Changes)

**You share:**
```bash
cd ~/HoloVitals
git diff
```

**I analyze and provide:**
```bash
# Specific changes to make
cd ~/HoloVitals
git checkout -b feature/new-feature

# Apply changes (I'll provide exact commands)
```

---

## 🔄 Git Workflow

### Making Changes

```bash
# 1. Create feature branch
cd ~/HoloVitals
git checkout -b feature/patient-export

# 2. Make changes (I'll guide you)
# ... edit files ...

# 3. Test changes
holovitals restart
# ... test in browser ...

# 4. Commit changes
git add .
git commit -m "Add patient export feature"

# 5. Push to GitHub
git push origin feature/patient-export

# 6. Create Pull Request (optional)
# Or merge directly to main:
git checkout main
git merge feature/patient-export
git push origin main
```

### Quick Sync (No Branches)

```bash
# Make changes
# ... edit files ...

# Quick commit and push
hv-sync
# (will prompt for commit message)
```

### Pull Latest Changes

```bash
# Pull and restart
hv-pull
```

---

## 🐛 Debugging Together

### When Something Breaks

**You provide:**
1. **Error message:**
```bash
holovitals logs | tail -50
```

2. **What you were doing:**
> "I was trying to create a new patient and got this error"

3. **Recent changes:**
```bash
cd ~/HoloVitals
git log --oneline -5
```

**I analyze:**
1. Review error message
2. Check recent changes
3. Identify root cause
4. Provide fix

**You apply:**
```bash
# I'll provide exact commands to fix
```

### Common Issues & Quick Fixes

#### Port Already in Use
```bash
# Kill existing process
pkill -f "next dev"

# Start fresh
holovitals start
```

#### Database Connection Error
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Restart if needed
sudo systemctl restart postgresql

# Test connection
psql -U holovitals -d holovitals -c "SELECT 1;"
```

#### Module Not Found
```bash
# Reinstall dependencies
cd ~/HoloVitals/medical-analysis-platform
rm -rf node_modules package-lock.json
npm install

# Restart
holovitals restart
```

---

## 📊 Monitoring & Maintenance

### Daily Health Check
```bash
# Run health check
hv-health

# View logs
holovitals logs

# Check disk space
df -h

# Check memory
free -h
```

### Weekly Backup
```bash
# Backup database
hv-backup

# Verify backup
ls -lh ~/holovitals-backups/
```

### Monthly Updates
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Update npm packages
cd ~/HoloVitals/medical-analysis-platform
npm update

# Test everything
hv-health
```

---

## 🚀 Deployment Workflow

### Development → Testing → Production

#### 1. Development (on server)
```bash
# Make changes
cd ~/HoloVitals
git checkout -b feature/new-feature

# Test locally
holovitals restart
curl http://localhost:3000
```

#### 2. Testing
```bash
# Run tests (when we add them)
npm test

# Manual testing
# ... test all features ...
```

#### 3. Production
```bash
# Merge to main
git checkout main
git merge feature/new-feature
git push origin main

# Deploy (when ready for production server)
# ... production deployment steps ...
```

---

## 💡 Best Practices

### 1. Always Backup Before Major Changes
```bash
hv-backup
```

### 2. Test in Development First
```bash
# Never test directly in production
# Always test on dev server first
```

### 3. Commit Often
```bash
# Small, frequent commits are better
git add .
git commit -m "Small change description"
```

### 4. Keep Dependencies Updated
```bash
# Weekly check
cd ~/HoloVitals/medical-analysis-platform
npm outdated
```

### 5. Monitor Logs Regularly
```bash
# Check for errors
holovitals logs | grep -i error
```

---

## 🆘 Emergency Procedures

### Server Crashed
```bash
# 1. Check what's running
hv-health

# 2. Restart services
sudo systemctl restart postgresql redis-server

# 3. Restart application
holovitals restart

# 4. Check logs
holovitals logs
```

### Database Corrupted
```bash
# 1. Stop application
holovitals stop

# 2. Restore from backup
~/holovitals-scripts/restore-database.sh ~/holovitals-backups/latest.sql.gz

# 3. Restart
holovitals start
```

### Disk Full
```bash
# 1. Check disk usage
df -h

# 2. Clean old logs
rm ~/holovitals.log.old
rm ~/holovitals-backups/*.sql.gz.old

# 3. Clean npm cache
npm cache clean --force

# 4. Clean old backups (keep last 7)
cd ~/holovitals-backups
ls -t *.sql.gz | tail -n +8 | xargs rm
```

---

## 📞 Communication Protocol

### When You Need Help

**Good Request:**
```
Issue: Patient search is slow
What I tried: Checked logs, restarted server
Error message: [paste error]
File involved: app/api/patients/search/route.ts
Current code: [paste relevant code]
```

**I'll Respond With:**
```
Analysis: [explanation]
Solution: [code/commands]
Steps: [numbered instructions]
Test: [how to verify fix]
```

### When Sharing Code

**Format:**
```
File: path/to/file.ts
Lines: 45-60
Code:
[paste code]
```

### When Reporting Errors

**Include:**
1. Full error message
2. Stack trace
3. What you were doing
4. Recent changes
5. Relevant logs

---

## 🎓 Learning Resources

### Understanding the Codebase
- `~/HoloVitals/README.md` - Project overview
- `~/HoloVitals/medical-analysis-platform/docs/` - Documentation
- Ask me: "Explain how [feature] works"

### Git Commands
- `git status` - See changes
- `git log` - See history
- `git diff` - See differences
- Ask me: "How do I [git task]?"

### Server Management
- `holovitals --help` - See all commands
- `hv-health` - System health
- Ask me: "How do I [server task]?"

---

## ✅ Quick Reference

### Essential Commands
```bash
# Server management
holovitals start|stop|restart|status|logs

# Git operations
hv-sync          # Push to GitHub
hv-pull          # Pull from GitHub
hv-deploy        # Quick deploy

# Maintenance
hv-health        # Health check
hv-backup        # Backup database

# Development
cd ~/HoloVitals/medical-analysis-platform
npm run dev      # Start dev server
npm test         # Run tests
npx prisma studio # Database GUI
```

### File Locations
```
~/HoloVitals/                          # Git repository
~/HoloVitals/medical-analysis-platform/ # Main app
~/holovitals.log                       # Application logs
~/holovitals-backups/                  # Database backups
~/holovitals-scripts/                  # Helper scripts
```

---

## 🎉 Ready to Collaborate!

**Setup Checklist:**
- [ ] Server deployed
- [ ] GitHub token configured
- [ ] Repository cloned
- [ ] Helper scripts installed
- [ ] Server running
- [ ] Health check passed

**Once setup is complete, we can:**
- ✅ Add new features
- ✅ Fix bugs
- ✅ Optimize performance
- ✅ Deploy updates
- ✅ Monitor system
- ✅ Scale infrastructure

**Let's build something amazing together!** 🚀