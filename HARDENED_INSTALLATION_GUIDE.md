# 🛡️ HoloVitals Hardened Installation Guide

## Overview
This guide covers the hardened installation of HoloVitals with comprehensive security measures including user authentication, firewall, fail2ban, automatic updates, and SSH hardening.

---

## 🎯 What Makes This "Hardened"?

### Security Features Included
- ✅ **User Authentication** - Custom username and password
- ✅ **UFW Firewall** - Only necessary ports open
- ✅ **Fail2Ban** - Brute force protection
- ✅ **SSH Hardening** - Secure SSH configuration
- ✅ **Automatic Security Updates** - Unattended upgrades
- ✅ **Redis Hardening** - Dangerous commands disabled
- ✅ **PostgreSQL Security** - Local-only with MD5 auth
- ✅ **File Permissions** - Strict permission model
- ✅ **Log Rotation** - Automatic log management
- ✅ **Security Audit Report** - Complete security documentation

---

## 📋 Prerequisites

### Server Requirements
- **OS:** Ubuntu 20.04 LTS or newer
- **RAM:** 2GB minimum, 4GB recommended
- **Disk:** 20GB free space
- **CPU:** 2 cores minimum
- **Access:** SSH with sudo privileges

### Before Installation
- Choose a username for the application (e.g., `holovitals`, `appuser`, etc.)
- Prepare a strong password (minimum 8 characters)
- Have SSH access to your server

---

## 🚀 Installation Steps

### Step 1: Transfer Package to Server

```bash
# From your local machine
rsync -avz --progress holovitals-dev-20251002-121947.tar.gz your-username@your-server-ip:~/
```

### Step 2: Extract Package

```bash
# SSH into server
ssh your-username@your-server-ip

# Extract
tar -xzf holovitals-dev-20251002-121947.tar.gz
cd holovitals-dev-20251002-121947
```

### Step 3: Run Hardened Installation

```bash
# Run the hardened installer
chmod +x scripts/install-dev-hardened.sh
./scripts/install-dev-hardened.sh
```

### Step 4: Follow Installation Prompts

**You will be prompted for:**

1. **Application Username:**
   ```
   Enter username for HoloVitals application (default: holovitals): myappuser
   ```
   - Use lowercase letters, numbers, underscore, hyphen only
   - This user will have sudo access
   - Default: `holovitals`

2. **Password:**
   ```
   Enter password for user 'myappuser':
   [type password - hidden]
   
   Confirm password:
   [type password again - hidden]
   ```
   - Minimum 8 characters
   - Will not be displayed while typing
   - Must match confirmation

3. **Confirmation:**
   ```
   Continue with installation? (yes/no): yes
   ```

### Step 5: Save Credentials

**CRITICAL:** The installer will display:
- Application username and password (as entered)
- Database username: `holovitals_db`
- Database password: (auto-generated, 25 characters)
- NextAuth secret: (auto-generated)

**SAVE THESE SECURELY!**

### Step 6: Log Out and Back In

```bash
# Log out
exit

# Log back in for group changes to take effect
ssh your-username@your-server-ip
```

---

## 🔐 Security Features Explained

### 1. UFW Firewall

**What it does:**
- Blocks all incoming connections by default
- Allows only SSH (port 22) and application (port 3000)
- Allows all outgoing connections

**Check status:**
```bash
sudo ufw status verbose
```

**Expected output:**
```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
3000/tcp                   ALLOW IN    Anywhere (HoloVitals Dev Server)
```

**Modify rules:**
```bash
# Allow additional port
sudo ufw allow PORT/tcp

# Remove rule
sudo ufw delete allow PORT/tcp

# Reload
sudo ufw reload
```

### 2. Fail2Ban

**What it does:**
- Monitors SSH login attempts
- Bans IP addresses after 3 failed attempts
- Ban duration: 2 hours
- Protects against brute force attacks

**Check status:**
```bash
# Overall status
sudo fail2ban-client status

# SSH jail status
sudo fail2ban-client status sshd
```

**View banned IPs:**
```bash
sudo fail2ban-client status sshd
```

**Unban an IP:**
```bash
sudo fail2ban-client set sshd unbanip IP_ADDRESS
```

**Configuration:**
- Config file: `/etc/fail2ban/jail.local`
- Max retries: 3
- Ban time: 7200 seconds (2 hours)
- Find time: 600 seconds (10 minutes)

### 3. Automatic Security Updates

**What it does:**
- Automatically downloads and installs security updates
- Runs daily
- Only installs security patches (not all updates)
- Can be configured to auto-reboot if needed

**Check status:**
```bash
# View update logs
sudo cat /var/log/unattended-upgrades/unattended-upgrades.log

# Check configuration
cat /etc/apt/apt.conf.d/50unattended-upgrades
```

**Manual update:**
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 4. SSH Hardening

**Security measures:**
- Root login disabled
- Protocol 2 only (more secure)
- Max authentication tries: 3
- Max sessions: 2
- Client alive interval: 300 seconds
- X11 forwarding disabled

**Configuration file:**
```bash
# View SSH config
sudo cat /etc/ssh/sshd_config

# Backup location
/etc/ssh/sshd_config.backup
```

**Restart SSH after changes:**
```bash
sudo systemctl restart sshd
```

### 5. Redis Hardening

**Security measures:**
- Binds to localhost only (127.0.0.1)
- Dangerous commands disabled:
  - `FLUSHDB` - Cannot flush database
  - `FLUSHALL` - Cannot flush all databases
  - `CONFIG` - Cannot change configuration

**Check Redis:**
```bash
# Test connection
redis-cli ping

# Should return: PONG

# Try disabled command
redis-cli FLUSHDB
# Should return: (error) ERR unknown command 'FLUSHDB'
```

### 6. PostgreSQL Security

**Security measures:**
- Listens on localhost only
- MD5 password authentication
- User-specific database access
- Strong password (25 characters)

**Test connection:**
```bash
psql -U holovitals_db -d holovitals -h localhost
# Enter password when prompted
```

### 7. File Permissions

**Permission scheme:**
```
.env files:        600 (rw-------)  Owner only
Source code:       640 (rw-r-----)  Owner write, group read
Scripts:           750 (rwxr-x---)  Owner execute, group execute
Directories:       750 (rwxr-x---)  Owner access, group access
Logs:              640 (rw-r-----)  Owner write, group read
```

**Check permissions:**
```bash
ls -la .env.local
# Should show: -rw------- 1 user holovitals

ls -la scripts/
# Should show: -rwxr-x--- 1 user holovitals
```

---

## 👤 User Management

### Application User

The application user you created has:
- Home directory: `/home/USERNAME`
- Sudo access: Yes
- Groups: `holovitals`, `postgres`, `sudo`
- Shell: `/bin/bash`

### Login as Application User

**From server:**
```bash
su - USERNAME
# Enter password
```

**From remote:**
```bash
ssh USERNAME@your-server-ip
# Enter password
```

### Change Password

```bash
# Change your own password
passwd

# Change another user's password (requires sudo)
sudo passwd USERNAME
```

### Add SSH Key (Recommended)

```bash
# On your local machine, generate key if needed
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id USERNAME@your-server-ip

# Test key-based login
ssh USERNAME@your-server-ip
# Should login without password
```

### Disable Password Authentication (After SSH Keys)

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Change this line:
PasswordAuthentication no

# Restart SSH
sudo systemctl restart sshd
```

---

## 🚀 Starting the Application

### As Application User

```bash
# 1. SSH as application user
ssh USERNAME@your-server-ip

# 2. Navigate to application
cd ~/HoloVitals/medical-analysis-platform

# 3. Start development server
npm run dev

# 4. Application runs on port 3000
```

### Access Application

**Option 1: SSH Tunnel (Recommended)**
```bash
# From your local machine
ssh -L 3000:localhost:3000 USERNAME@your-server-ip

# Open in browser
http://localhost:3000
```

**Option 2: Direct Access**
```bash
# Application is accessible on port 3000
http://your-server-ip:3000
```

---

## 📊 Security Monitoring

### Check Firewall Status

```bash
sudo ufw status verbose
```

### Check Fail2Ban Status

```bash
# Overall status
sudo fail2ban-client status

# SSH jail
sudo fail2ban-client status sshd

# View banned IPs
sudo fail2ban-client status sshd | grep "Banned IP"
```

### Check SSH Login Attempts

```bash
# Recent SSH logins
sudo grep "Accepted" /var/log/auth.log | tail -20

# Failed SSH attempts
sudo grep "Failed password" /var/log/auth.log | tail -20

# Fail2Ban bans
sudo grep "Ban" /var/log/fail2ban.log | tail -20
```

### Check System Updates

```bash
# Check for available updates
sudo apt-get update
sudo apt-get upgrade --dry-run

# View automatic update logs
sudo cat /var/log/unattended-upgrades/unattended-upgrades.log
```

### Monitor Application Logs

```bash
# Real-time logs
tail -f ~/holovitals-logs/holovitals.log

# Error logs
tail -f ~/holovitals-logs/error.log

# Last 100 lines
tail -100 ~/holovitals-logs/holovitals.log
```

---

## 🔧 Maintenance Tasks

### Daily
- [ ] Check application is running
- [ ] Review error logs
- [ ] Check disk space: `df -h`

### Weekly
- [ ] Review SSH login attempts
- [ ] Check Fail2Ban bans
- [ ] Review application logs
- [ ] Check for system updates

### Monthly
- [ ] Full security audit
- [ ] Update system packages
- [ ] Review user accounts
- [ ] Check firewall rules
- [ ] Test backup restoration

---

## 🆘 Troubleshooting

### Can't Login as Application User

**Problem:** Password not working

**Solution:**
```bash
# Reset password as current user
sudo passwd USERNAME

# Or during installation, user already exists
# Choose to reset password when prompted
```

### Locked Out After Failed Logins

**Problem:** IP banned by Fail2Ban

**Solution:**
```bash
# From another IP or console access
sudo fail2ban-client set sshd unbanip YOUR_IP

# Or wait 2 hours for automatic unban
```

### Firewall Blocking Application

**Problem:** Can't access port 3000

**Solution:**
```bash
# Check if port is allowed
sudo ufw status | grep 3000

# If not, allow it
sudo ufw allow 3000/tcp
sudo ufw reload
```

### Application Won't Start

**Problem:** Permission errors

**Solution:**
```bash
# Fix ownership
cd ~/HoloVitals/medical-analysis-platform
sudo chown -R $(whoami):holovitals .

# Fix permissions
find . -type f -name "*.ts" -exec chmod 640 {} \;
find . -type d -exec chmod 750 {} \;
chmod 600 .env.local
```

### Database Connection Failed

**Problem:** Can't connect to PostgreSQL

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Test connection
psql -U holovitals_db -d holovitals -h localhost
```

---

## 📋 Security Checklist

### Completed During Installation
- [x] UFW firewall enabled
- [x] Fail2Ban configured
- [x] SSH hardened
- [x] Automatic updates enabled
- [x] Application user created
- [x] Strong passwords set
- [x] Redis hardened
- [x] PostgreSQL secured
- [x] File permissions set
- [x] Log rotation configured

### Recommended Next Steps
- [ ] Set up SSH key authentication
- [ ] Disable password authentication
- [ ] Configure email alerts for Fail2Ban
- [ ] Set up monitoring (optional)
- [ ] Configure automated backups
- [ ] Review security report
- [ ] Test all security features

### Regular Maintenance
- [ ] Review logs weekly
- [ ] Update system packages weekly
- [ ] Check Fail2Ban bans weekly
- [ ] Audit user accounts monthly
- [ ] Review firewall rules monthly
- [ ] Test backup restoration monthly

---

## 📖 Documentation

### Security Report
After installation, review the security report:
```bash
cat ~/SECURITY_HARDENING_REPORT.md
```

### Configuration Files
```bash
# Firewall
sudo ufw status

# Fail2Ban
sudo cat /etc/fail2ban/jail.local

# SSH
sudo cat /etc/ssh/sshd_config

# Automatic updates
cat /etc/apt/apt.conf.d/50unattended-upgrades

# Redis
sudo cat /etc/redis/redis.conf

# PostgreSQL
sudo cat /etc/postgresql/*/main/pg_hba.conf
```

---

## 🎯 Security Best Practices

### 1. Use SSH Keys
- Generate strong SSH keys
- Disable password authentication
- Use different keys for different servers

### 2. Regular Updates
- Enable automatic security updates
- Manually update weekly
- Test updates in development first

### 3. Monitor Logs
- Review logs daily
- Set up alerts for suspicious activity
- Use log analysis tools

### 4. Strong Passwords
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Use password manager
- Change passwords regularly

### 5. Principle of Least Privilege
- Only open necessary ports
- Grant minimum required permissions
- Use separate users for different tasks
- Regularly audit user access

### 6. Backup Strategy
- Daily automated backups
- Store backups off-site
- Test restoration regularly
- Encrypt backup files

---

## 🎉 Summary

### What You Get
- ✅ Secure application user with password
- ✅ Firewall protecting your server
- ✅ Brute force protection
- ✅ Automatic security updates
- ✅ Hardened SSH configuration
- ✅ Secure database and Redis
- ✅ Proper file permissions
- ✅ Complete security documentation

### Security Level
- **Basic Security:** ⭐⭐⭐⭐⭐ (5/5)
- **Enterprise Ready:** ⭐⭐⭐⭐☆ (4/5)
- **Compliance Ready:** ⭐⭐⭐⭐☆ (4/5)

### Next Steps
1. Complete installation
2. Save all credentials
3. Review security report
4. Set up SSH keys
5. Test all features
6. Configure monitoring

**Your HoloVitals installation is now secure and hardened!** 🛡️