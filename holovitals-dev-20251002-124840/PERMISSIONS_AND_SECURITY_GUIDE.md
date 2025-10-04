# 🔒 HoloVitals Permissions & Security Guide

## Overview
This guide explains the file permissions, user/group setup, and security measures implemented in HoloVitals.

---

## 👥 User & Group Structure

### Users
- **Application User:** Your regular user account (e.g., `ubuntu`, `admin`, etc.)
- **Database User:** `holovitals` (PostgreSQL user)
- **System Users:** `postgres`, `redis`

### Groups
- **holovitals:** Primary application group
  - Members: Your user account
  - Purpose: Access to application files, logs, and backups
  
- **postgres:** Database group
  - Members: Your user account (for database access)
  - Purpose: Direct database operations
  
- **redis:** Redis group
  - Members: redis system user
  - Purpose: Redis service operations

### Group Membership
```bash
# Check your groups
groups

# Should show:
your-username : your-username holovitals postgres sudo
```

---

## 📁 Directory Structure & Permissions

### Application Directory
```
~/HoloVitals/
├── medical-analysis-platform/  (750 - rwxr-x---)
│   ├── app/                    (750 - rwxr-x---)
│   ├── components/             (750 - rwxr-x---)
│   ├── lib/                    (750 - rwxr-x---)
│   ├── prisma/                 (750 - rwxr-x---)
│   ├── public/                 (755 - rwxr-xr-x)
│   ├── .env.local              (600 - rw-------)
│   ├── package.json            (644 - rw-r--r--)
│   └── node_modules/           (750 - rwxr-x---)
```

### Support Directories
```
~/holovitals-logs/              (750 - rwxr-x---)
├── holovitals.log              (640 - rw-r-----)
├── error.log                   (640 - rw-r-----)
└── access.log                  (640 - rw-r-----)

~/holovitals-backups/           (750 - rwxr-x---)
└── *.sql.gz                    (640 - rw-r-----)

~/holovitals-scripts/           (750 - rwxr-x---)
└── *.sh                        (750 - rwxr-x---)
```

---

## 🔐 Permission Scheme Explained

### File Permissions

#### 600 (rw-------) - Highly Sensitive
**Files:**
- `.env.local`
- `.env`
- `~/.git-credentials`
- Database backup files (before compression)

**Why:**
- Contains passwords, API keys, secrets
- Only owner can read/write
- No group or other access

**Example:**
```bash
-rw------- 1 user holovitals  1234 Oct  2 12:00 .env.local
```

#### 640 (rw-r-----) - Sensitive
**Files:**
- Log files (`.log`)
- Compressed backups (`.sql.gz`)
- TypeScript/JavaScript source files (`.ts`, `.tsx`, `.js`)
- JSON configuration files

**Why:**
- Owner can read/write
- Group can read (for monitoring)
- No public access

**Example:**
```bash
-rw-r----- 1 user holovitals  5678 Oct  2 12:00 holovitals.log
```

#### 644 (rw-r--r--) - Public Read
**Files:**
- `package.json`
- `package-lock.json`
- `README.md`
- `.gitignore`

**Why:**
- Owner can read/write
- Everyone can read
- Safe for public viewing

**Example:**
```bash
-rw-r--r-- 1 user holovitals  9012 Oct  2 12:00 package.json
```

#### 750 (rwxr-x---) - Executable Scripts
**Files:**
- Shell scripts (`.sh`)
- Helper scripts
- Management tools

**Why:**
- Owner can read/write/execute
- Group can read/execute
- No public access

**Example:**
```bash
-rwxr-x--- 1 user holovitals  3456 Oct  2 12:00 holovitals-manage.sh
```

### Directory Permissions

#### 750 (rwxr-x---) - Standard Directories
**Directories:**
- Application directories
- Log directories
- Backup directories
- Script directories

**Why:**
- Owner can read/write/execute (enter)
- Group can read/execute (enter)
- No public access

**Example:**
```bash
drwxr-x--- 5 user holovitals  4096 Oct  2 12:00 holovitals-logs/
```

#### 755 (rwxr-xr-x) - Public Directories
**Directories:**
- `public/` (static assets)
- Build output directories

**Why:**
- Owner can read/write/execute
- Everyone can read/execute
- Needed for web server access

**Example:**
```bash
drwxr-xr-x 3 user holovitals  4096 Oct  2 12:00 public/
```

---

## 🛡️ Security Measures

### 1. Database Security

#### PostgreSQL Configuration
```bash
# Location: /etc/postgresql/15/main/pg_hba.conf

# Local connections (trusted)
local   all             all                                     trust

# TCP/IP connections (password required)
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

**Security Features:**
- ✅ Listens on localhost only
- ✅ Strong password (25 characters)
- ✅ User-specific database access
- ✅ No remote connections allowed

#### Database User Permissions
```sql
-- holovitals user has:
- CREATEDB privilege
- Full access to holovitals database
- No access to other databases
- No superuser privileges
```

### 2. Redis Security

#### Redis Configuration
```bash
# Location: /etc/redis/redis.conf

bind 127.0.0.1 ::1          # Localhost only
protected-mode no           # For local development
requirepass [none]          # No password for local dev
```

**Security Features:**
- ✅ Listens on localhost only
- ✅ No remote connections
- ✅ No password needed (local only)

### 3. File System Security

#### Sensitive Files Protection
```bash
# .env files
-rw------- 1 user holovitals  .env.local

# Git credentials
-rw------- 1 user holovitals  ~/.git-credentials

# SSH keys (if used)
-rw------- 1 user holovitals  ~/.ssh/id_rsa
```

#### Application Files Protection
```bash
# Source code
-rw-r----- 1 user holovitals  *.ts
-rw-r----- 1 user holovitals  *.tsx
-rw-r----- 1 user holovitals  *.js

# Configuration
-rw-r----- 1 user holovitals  *.json
```

### 4. Log Security

#### Log File Permissions
```bash
-rw-r----- 1 user holovitals  holovitals.log
-rw-r----- 1 user holovitals  error.log
-rw-r----- 1 user holovitals  access.log
```

#### Log Rotation
```bash
# /etc/logrotate.d/holovitals
/home/user/holovitals-logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 user holovitals
    sharedscripts
}
```

**Features:**
- ✅ Daily rotation
- ✅ Keep 7 days of logs
- ✅ Automatic compression
- ✅ Proper permissions maintained

---

## 🔧 Permission Management Commands

### Check Permissions
```bash
# Check file permissions
ls -l filename

# Check directory permissions
ls -ld directory/

# Check ownership
stat filename

# Check your groups
groups

# Check all files in directory
ls -la
```

### Set Permissions
```bash
# Set file permissions
chmod 640 filename          # rw-r-----
chmod 750 script.sh         # rwxr-x---
chmod 600 .env.local        # rw-------

# Set directory permissions
chmod 750 directory/        # rwxr-x---

# Set ownership
chown user:holovitals filename
chown -R user:holovitals directory/

# Set permissions recursively
find . -type f -name "*.ts" -exec chmod 640 {} \;
find . -type d -exec chmod 750 {} \;
```

### Fix Permissions Script
```bash
#!/bin/bash
# Fix all permissions

cd ~/HoloVitals/medical-analysis-platform

# Application files
find . -type f -name "*.ts" -exec chmod 640 {} \;
find . -type f -name "*.tsx" -exec chmod 640 {} \;
find . -type f -name "*.js" -exec chmod 640 {} \;
find . -type f -name "*.json" -exec chmod 640 {} \;

# Scripts
find . -type f -name "*.sh" -exec chmod 750 {} \;

# Directories
find . -type d -exec chmod 750 {} \;

# Special files
chmod 600 .env.local
chmod 644 package.json

# Ownership
chown -R $(whoami):holovitals .

echo "✅ Permissions fixed"
```

---

## 🚨 Security Best Practices

### 1. Protect Sensitive Files
```bash
# Always set restrictive permissions on sensitive files
chmod 600 .env.local
chmod 600 ~/.git-credentials
chmod 600 ~/.ssh/id_rsa

# Verify
ls -l .env.local
# Should show: -rw------- 1 user holovitals
```

### 2. Regular Audits
```bash
# Find files with wrong permissions
find ~/HoloVitals -type f -perm /o+w  # World-writable files
find ~/HoloVitals -type f -perm /o+r  # World-readable files

# Find files owned by wrong user
find ~/HoloVitals ! -user $(whoami)
```

### 3. Backup Security
```bash
# Encrypt backups
gpg --encrypt --recipient your@email.com backup.sql.gz

# Secure backup directory
chmod 700 ~/holovitals-backups
```

### 4. Git Security
```bash
# Never commit sensitive files
cat .gitignore
# Should include:
.env
.env.local
*.log
node_modules/

# Check for sensitive data before commit
git diff --cached
```

---

## 🔍 Security Checklist

### Daily
- [ ] Review error logs for suspicious activity
- [ ] Check running processes
- [ ] Verify file permissions on sensitive files

### Weekly
- [ ] Review access logs
- [ ] Check for unauthorized file changes
- [ ] Audit user permissions
- [ ] Update system packages

### Monthly
- [ ] Full security audit
- [ ] Review and rotate credentials
- [ ] Update dependencies
- [ ] Test backup restoration

---

## 🛠️ Troubleshooting Permissions

### Permission Denied Errors

#### Problem: Can't read file
```bash
# Error: Permission denied
cat somefile.txt

# Solution: Check permissions
ls -l somefile.txt

# Fix if needed
chmod 640 somefile.txt
```

#### Problem: Can't execute script
```bash
# Error: Permission denied
./script.sh

# Solution: Add execute permission
chmod 750 script.sh
```

#### Problem: Can't write to file
```bash
# Error: Permission denied
echo "test" > file.txt

# Solution: Check ownership and permissions
ls -l file.txt
chown $(whoami):holovitals file.txt
chmod 640 file.txt
```

### Database Permission Errors

#### Problem: Can't connect to database
```bash
# Error: FATAL: Peer authentication failed

# Solution: Check pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Ensure this line exists:
local   all             all                                     trust

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Problem: Can't create tables
```bash
# Error: permission denied for schema public

# Solution: Grant permissions
sudo -u postgres psql -d holovitals << EOF
GRANT ALL ON SCHEMA public TO holovitals;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO holovitals;
EOF
```

---

## 📋 Permission Reference

### Quick Reference Table

| File Type | Permission | Numeric | Symbolic | Owner | Group | Other |
|-----------|------------|---------|----------|-------|-------|-------|
| .env files | 600 | rw------- | Read/Write | None | None |
| Source code | 640 | rw-r----- | Read/Write | Read | None |
| Public files | 644 | rw-r--r-- | Read/Write | Read | Read |
| Scripts | 750 | rwxr-x--- | All | Read/Execute | None |
| Directories | 750 | rwxr-x--- | All | Read/Execute | None |
| Public dirs | 755 | rwxr-xr-x | All | Read/Execute | Read/Execute |

### Permission Calculation

```
r (read)    = 4
w (write)   = 2
x (execute) = 1

Examples:
600 = rw------- = 4+2+0, 0+0+0, 0+0+0
640 = rw-r----- = 4+2+0, 4+0+0, 0+0+0
644 = rw-r--r-- = 4+2+0, 4+0+0, 4+0+0
750 = rwxr-x--- = 4+2+1, 4+0+1, 0+0+0
755 = rwxr-xr-x = 4+2+1, 4+0+1, 4+0+1
```

---

## 🎯 Summary

### What's Protected
- ✅ Environment variables (.env files)
- ✅ Database credentials
- ✅ API keys and secrets
- ✅ Git credentials
- ✅ Log files
- ✅ Backup files
- ✅ Source code

### How It's Protected
- ✅ Restrictive file permissions (600, 640, 750)
- ✅ Proper user/group ownership
- ✅ Local-only database access
- ✅ Local-only Redis access
- ✅ Log rotation with secure permissions
- ✅ Encrypted backups (optional)
- ✅ .gitignore for sensitive files

### Your Responsibilities
- 🔐 Keep credentials secure
- 🔄 Regular security audits
- 📦 Keep software updated
- 💾 Regular backups
- 🔍 Monitor logs
- 🚫 Never commit sensitive data

---

**Security is a continuous process, not a one-time setup!** 🛡️