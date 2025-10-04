# 🚀 HoloVitals Installation Options

## Overview
HoloVitals provides three installation options depending on your needs:

1. **Development Installation** - For testing, development, and local use
2. **Hardened Installation** - Development with comprehensive security hardening
3. **Production Installation** - For live deployment with domain and SSL

---

## 📦 Package Contents

All three installation scripts are included in the package:
- `install-dev.sh` - Development installation (basic)
- `install-hardened.sh` - Development with security hardening
- `install-production.sh` - Production installation with Nginx & SSL

---

## 🎯 Which Installation Should I Use?

### Use Development Installation If:
- ✅ Testing HoloVitals locally
- ✅ Quick development and coding
- ✅ Learning the platform
- ✅ No security requirements
- ✅ Temporary/disposable environment
- ✅ Fastest setup (10-15 minutes)

### Use Hardened Installation If:
- ✅ Development with security in mind
- ✅ Need user authentication
- ✅ Want firewall protection
- ✅ Need brute force protection
- ✅ Shared development server
- ✅ Security-conscious development
- ✅ Setup time: 15-20 minutes

### Use Production Installation If:
- ✅ Deploying to live server
- ✅ Have a domain name
- ✅ Need HTTPS/SSL
- ✅ Public access required
- ✅ Production-ready setup
- ✅ Automatic service management
- ✅ Setup time: 15-20 minutes

---

## 🔧 Option 1: Development Installation (Basic)

### What You Get
- ✅ HoloVitals application
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ Development server (port 3000)
- ✅ Helper scripts
- ✅ GitHub integration tools
- ✅ Proper permissions and security

### Prerequisites
- Ubuntu 20.04+ server
- 2GB RAM minimum
- SSH access
- Sudo privileges

### Installation Steps

```bash
# 1. Extract package
tar -xzf holovitals-dev-20251002-121016.tar.gz
cd holovitals-dev-20251002-121016

# 2. Run installation
chmod +x install-dev.sh
./install-dev.sh

# 3. Start development server
npm run dev
```

### Access Your Application

**Option A: SSH Tunnel (Recommended)**
```bash
# From your local machine
ssh -L 3000:localhost:3000 your-username@your-server-ip

# Then open in browser
http://localhost:3000
```

**Option B: Direct Access**
```bash
# On server, allow port 3000
sudo ufw allow 3000/tcp

# Access from browser
http://your-server-ip:3000
```

### What Gets Installed
```
Software:
- Node.js 20
- PostgreSQL 15
- Redis 7
- npm packages

Services:
- Development server (manual start)
- PostgreSQL (auto-start)
- Redis (auto-start)

Directories:
- ~/HoloVitals/ (application)
- ~/holovitals-logs/ (logs)
- ~/holovitals-backups/ (backups)
- ~/holovitals-scripts/ (helper scripts)
```

### Management Commands
```bash
# Start server
cd ~/HoloVitals/medical-analysis-platform
npm run dev

# Or use helper scripts (after setup)
holovitals start
holovitals stop
holovitals restart
holovitals logs

# Git operations
hv-sync    # Push to GitHub
hv-pull    # Pull from GitHub
hv-deploy  # Quick deploy

# Maintenance
hv-health  # Health check
hv-backup  # Backup database
```

### Documentation
- `SERVER_DEVELOPMENT_SETUP.md` - Complete setup guide
- `AI_COLLABORATION_GUIDE.md` - How to work with AI
- `PERMISSIONS_AND_SECURITY_GUIDE.md` - Security reference

---

## 🛡️ Option 2: Hardened Installation (Development + Security)

### What You Get
- ✅ Everything from Development, PLUS:
- ✅ **User Authentication** - Custom username and password
- ✅ **UFW Firewall** - Only necessary ports open
- ✅ **Fail2Ban** - Brute force protection (3 attempts, 2 hour ban)
- ✅ **SSH Hardening** - Secure SSH configuration
- ✅ **Automatic Security Updates** - Unattended upgrades
- ✅ **Redis Hardening** - Dangerous commands disabled
- ✅ **PostgreSQL Security** - MD5 authentication
- ✅ **File Permissions** - Strict permission model
- ✅ **Security Audit Report** - Complete documentation

### Prerequisites
- Ubuntu 20.04+ server
- 2GB RAM minimum
- SSH access
- Sudo privileges

### Installation Steps

```bash
# 1. Extract package
tar -xzf holovitals-dev-20251002-121947.tar.gz
cd holovitals-dev-20251002-121947

# 2. Run hardened installation
chmod +x install-hardened.sh
./install-hardened.sh
```

**You will be prompted for:**
- Application username (e.g., `holovitals`, `appuser`)
- Password (minimum 8 characters)
- Confirmation to proceed

### What Gets Installed
```
Software:
- Node.js 20
- PostgreSQL 15
- Redis 7
- UFW (firewall)
- Fail2Ban (brute force protection)
- Unattended-upgrades (auto security updates)
- npm packages

Security Features:
- Application user with password
- Firewall (ports 22, 3000 only)
- Fail2Ban (SSH protection)
- SSH hardening (root disabled, max 3 attempts)
- Redis hardening (dangerous commands disabled)
- PostgreSQL security (local-only, MD5 auth)
- Automatic security updates
- Secure file permissions
- Log rotation

Services:
- PostgreSQL (auto-start)
- Redis (auto-start)
- UFW (auto-start)
- Fail2Ban (auto-start)
- Application (manual start)

Directories:
- /home/USERNAME/HoloVitals/ (application)
- /home/USERNAME/holovitals-logs/ (logs)
- /home/USERNAME/holovitals-backups/ (backups)
- /home/USERNAME/holovitals-scripts/ (scripts)
```

### Access Your Application

**Login as application user:**
```bash
# From server
su - USERNAME

# From remote
ssh USERNAME@your-server-ip
```

**Start application:**
```bash
cd ~/HoloVitals/medical-analysis-platform
npm run dev
```

**Access via SSH tunnel:**
```bash
# From your local machine
ssh -L 3000:localhost:3000 USERNAME@your-server-ip

# Open in browser
http://localhost:3000
```

### Security Features Explained

**UFW Firewall:**
- Blocks all incoming except SSH (22) and app (3000)
- Check: `sudo ufw status`

**Fail2Ban:**
- Bans IP after 3 failed SSH attempts
- Ban duration: 2 hours
- Check: `sudo fail2ban-client status sshd`

**SSH Hardening:**
- Root login disabled
- Max 3 authentication attempts
- Protocol 2 only
- X11 forwarding disabled

**Automatic Updates:**
- Security updates installed automatically
- Runs daily
- Check: `cat /var/log/unattended-upgrades/unattended-upgrades.log`

**Redis Hardening:**
- Localhost only
- FLUSHDB, FLUSHALL, CONFIG commands disabled

**File Permissions:**
- .env files: 600 (owner only)
- Source code: 640 (owner write, group read)
- Scripts: 750 (owner/group execute)

### Management Commands
```bash
# Check firewall
sudo ufw status

# Check Fail2Ban
sudo fail2ban-client status sshd

# View SSH attempts
sudo grep "Failed password" /var/log/auth.log

# Check security updates
sudo cat /var/log/unattended-upgrades/unattended-upgrades.log

# Review security report
cat ~/SECURITY_HARDENING_REPORT.md
```

### Documentation
- `HARDENED_INSTALLATION_GUIDE.md` - Complete hardened setup guide
- `PERMISSIONS_AND_SECURITY_GUIDE.md` - Security reference
- `~/SECURITY_HARDENING_REPORT.md` - Created during installation

---

## 🌐 Option 3: Production Installation

### What You Get
- ✅ Everything from Development, PLUS:
- ✅ Nginx reverse proxy
- ✅ SSL/TLS certificates (Let's Encrypt)
- ✅ HTTPS with auto-renewal
- ✅ Systemd service (auto-start)
- ✅ UFW firewall configuration
- ✅ Production build optimization
- ✅ Automatic health monitoring
- ✅ Daily automated backups
- ✅ Log rotation
- ✅ Security headers

### Prerequisites
- Ubuntu 20.04+ server
- 2GB RAM minimum (4GB recommended)
- **Domain name** (REQUIRED)
- **DNS configured** pointing to server IP
- Ports 80 and 443 open
- Valid email address

### CRITICAL: Domain Setup

**Before installation, you MUST:**

1. **Own a domain** (e.g., holovitals.com)

2. **Configure DNS A records:**
   ```
   Type: A
   Name: @
   Value: YOUR_SERVER_IP
   
   Type: A (optional, for www)
   Name: www
   Value: YOUR_SERVER_IP
   ```

3. **Wait for DNS propagation** (1-48 hours)

4. **Verify DNS:**
   ```bash
   nslookup your-domain.com
   # Should return your server IP
   ```

### Installation Steps

```bash
# 1. Extract package
tar -xzf holovitals-dev-20251002-121016.tar.gz
cd holovitals-dev-20251002-121016

# 2. Run production installation
chmod +x install-production.sh
./install-production.sh
```

**You will be prompted for:**
- Domain name (e.g., holovitals.com)
- Email address (for SSL certificate)
- Use www subdomain? (yes/no)

### What Happens During Installation

1. **System packages** installed (Node.js, PostgreSQL, Redis, Nginx, Certbot)
2. **User/group** configuration
3. **Services** started and enabled
4. **Database** created with secure password
5. **Application** built for production
6. **Nginx** configured as reverse proxy
7. **SSL certificate** obtained from Let's Encrypt
8. **Systemd service** created for auto-start
9. **Firewall** configured (ports 80, 443, SSH)
10. **Log rotation** configured
11. **Daily backups** scheduled
12. **Health monitoring** enabled

### Access Your Application

After installation completes:
```
https://your-domain.com
```

### What Gets Installed

```
Software:
- Node.js 20
- PostgreSQL 15
- Redis 7
- Nginx
- Certbot (Let's Encrypt)
- npm packages

Services:
- HoloVitals (systemd service, auto-start)
- Nginx (auto-start)
- PostgreSQL (auto-start)
- Redis (auto-start)
- Certbot timer (SSL renewal)

Configuration:
- /etc/nginx/sites-available/holovitals
- /etc/systemd/system/holovitals.service
- /etc/letsencrypt/live/your-domain.com/

Directories:
- ~/HoloVitals/ (application)
- ~/holovitals-logs/ (logs)
- ~/holovitals-backups/ (daily backups)
- ~/holovitals-scripts/ (management scripts)

Automation:
- Daily backups at 2 AM
- Health checks every 5 minutes
- SSL renewal checks twice daily
- Log rotation daily
```

### Management Commands

```bash
# Service management
sudo systemctl status holovitals
sudo systemctl restart holovitals
sudo systemctl stop holovitals
sudo systemctl start holovitals

# View logs
sudo journalctl -u holovitals -f
tail -f ~/holovitals-logs/nginx-access.log
tail -f ~/holovitals-logs/nginx-error.log

# Nginx
sudo systemctl reload nginx
sudo nginx -t

# SSL certificate
sudo certbot certificates
sudo certbot renew --dry-run

# Backups
~/holovitals-scripts/backup-production.sh
ls -lh ~/holovitals-backups/

# Health check
~/holovitals-scripts/health-check-production.sh
```

### Documentation
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Complete production guide
- `PERMISSIONS_AND_SECURITY_GUIDE.md` - Security reference

---

## 📊 Comparison Table

| Feature | Development | Hardened | Production |
|---------|-------------|----------|------------|
| **Installation Time** | 10-15 min | 15-20 min | 15-20 min |
| **User Authentication** | ❌ No | ✅ Yes | ✅ Yes |
| **Firewall (UFW)** | ❌ No | ✅ Yes | ✅ Yes |
| **Fail2Ban** | ❌ No | ✅ Yes | ✅ Yes |
| **SSH Hardening** | ❌ No | ✅ Yes | ✅ Yes |
| **Auto Security Updates** | ❌ No | ✅ Yes | ✅ Yes |
| **Domain Required** | ❌ No | ❌ No | ✅ Yes |
| **SSL/HTTPS** | ❌ No | ❌ No | ✅ Yes |
| **Nginx** | ❌ No | ❌ No | ✅ Yes |
| **Auto-start** | ❌ Manual | ❌ Manual | ✅ Systemd |
| **Backups** | ⚠️ Manual | ⚠️ Manual | ✅ Daily |
| **Health Monitoring** | ❌ No | ❌ No | ✅ Yes |
| **Log Rotation** | ⚠️ Basic | ✅ Yes | ✅ Advanced |
| **Access** | localhost | localhost/tunnel | Public HTTPS |
| **Best For** | Quick Dev | Secure Dev | Production |

---

## 🔄 Switching Between Installations

### From Development to Production

If you started with development and want to upgrade:

```bash
# 1. Backup your data
hv-backup

# 2. Export database
pg_dump -U holovitals holovitals > ~/holovitals-backup.sql

# 3. Stop development server
holovitals stop

# 4. Run production installation
cd ~/holovitals-dev-20251002-121016
./install-production.sh

# 5. Restore data if needed
psql -U holovitals holovitals < ~/holovitals-backup.sql
```

### From Production to Development

Not recommended, but if needed:

```bash
# 1. Backup data
~/holovitals-scripts/backup-production.sh

# 2. Stop services
sudo systemctl stop holovitals nginx

# 3. Remove production components
sudo systemctl disable holovitals
sudo rm /etc/systemd/system/holovitals.service
sudo rm /etc/nginx/sites-enabled/holovitals

# 4. Start development server
cd ~/HoloVitals/medical-analysis-platform
npm run dev
```

---

## 🆘 Troubleshooting

### Development Installation Issues

**Port 3000 already in use:**
```bash
sudo lsof -i :3000
kill -9 <PID>
```

**Can't access from browser:**
```bash
# Use SSH tunnel
ssh -L 3000:localhost:3000 user@server
```

### Production Installation Issues

**SSL certificate failed:**
```bash
# Check DNS
nslookup your-domain.com

# Check ports
sudo ufw status
sudo lsof -i :80
sudo lsof -i :443

# Try again
sudo certbot certonly --standalone -d your-domain.com
```

**502 Bad Gateway:**
```bash
# Check application
sudo systemctl status holovitals
sudo journalctl -u holovitals -n 50

# Restart
sudo systemctl restart holovitals
```

---

## 📞 Getting Help

### For Development Installation
- Check `SERVER_DEVELOPMENT_SETUP.md`
- Check `AI_COLLABORATION_GUIDE.md`
- Run `hv-health` for diagnostics

### For Production Installation
- Check `PRODUCTION_DEPLOYMENT_GUIDE.md`
- Check service logs: `sudo journalctl -u holovitals -f`
- Check Nginx logs: `tail -f ~/holovitals-logs/nginx-*.log`

---

## 🎯 Recommendations

### For Testing/Development
→ **Use Development Installation**
- Faster setup
- No domain needed
- Easy to reset and restart
- Perfect for learning

### For Live Deployment
→ **Use Production Installation**
- Secure HTTPS
- Professional setup
- Automatic management
- Production-ready

### For Both
→ **Use Both!**
- Development on local/test server
- Production on live server
- Develop locally, deploy to production

---

## ✅ Quick Start Checklist

### Development Installation
- [ ] Ubuntu server ready
- [ ] SSH access
- [ ] Extract package
- [ ] Run `./install-dev.sh`
- [ ] Start server with `npm run dev`
- [ ] Access via SSH tunnel or direct

### Production Installation
- [ ] Ubuntu server ready
- [ ] Domain name purchased
- [ ] DNS configured and propagated
- [ ] Ports 80/443 open
- [ ] Email address ready
- [ ] Extract package
- [ ] Run `./install-production.sh`
- [ ] Enter domain and email
- [ ] Access via https://your-domain.com

---

## 🎉 Summary

Both installation options provide:
- ✅ Complete HoloVitals platform
- ✅ Secure configuration
- ✅ Proper permissions
- ✅ Helper scripts
- ✅ Comprehensive documentation

**Choose the option that fits your needs and get started!** 🚀