# 🚀 HoloVitals Production Deployment Guide with Nginx & SSL

## Overview
This guide covers deploying HoloVitals to production with Nginx reverse proxy, SSL certificates from Let's Encrypt, and automatic service management.

---

## 🎯 What This Installation Includes

### Infrastructure
- ✅ **Nginx** - Reverse proxy with SSL/TLS
- ✅ **Let's Encrypt SSL** - Free SSL certificates with auto-renewal
- ✅ **Systemd Service** - Automatic startup and restart
- ✅ **UFW Firewall** - Secure firewall configuration
- ✅ **Log Rotation** - Automatic log management
- ✅ **Daily Backups** - Automated database backups
- ✅ **Health Monitoring** - Auto-restart on failure

### Security Features
- ✅ HTTPS with TLS 1.2/1.3
- ✅ Security headers (HSTS, X-Frame-Options, etc.)
- ✅ Firewall configured (ports 80, 443, SSH only)
- ✅ Proper file permissions
- ✅ User/group isolation
- ✅ SSL certificate auto-renewal

### Production Features
- ✅ Production build optimization
- ✅ Static file caching
- ✅ Gzip compression
- ✅ Request logging
- ✅ Error logging
- ✅ Automatic service restart
- ✅ Health checks every 5 minutes

---

## 📋 Prerequisites

### 1. Server Requirements
- **OS:** Ubuntu 20.04 LTS or newer
- **RAM:** 2GB minimum, 4GB recommended
- **Disk:** 20GB free space
- **CPU:** 2 cores minimum

### 2. Domain Setup (CRITICAL)
Before installation, you MUST:

1. **Own a domain name** (e.g., holovitals.com)
2. **Configure DNS A records** pointing to your server IP:
   ```
   Type: A
   Name: @
   Value: YOUR_SERVER_IP
   TTL: 3600
   
   Type: A (optional, for www)
   Name: www
   Value: YOUR_SERVER_IP
   TTL: 3600
   ```
3. **Wait for DNS propagation** (can take 1-48 hours)
4. **Verify DNS is working:**
   ```bash
   # From your local machine
   nslookup holovitals.com
   # Should return your server IP
   ```

### 3. Server Access
- SSH access to your server
- Sudo privileges
- Ports 80 and 443 open (for SSL certificate)

### 4. Email Address
- Valid email for SSL certificate notifications

---

## 🚀 Installation Steps

### Step 1: Transfer Package to Server (5 minutes)

```bash
# From your local machine
rsync -avz --progress holovitals-dev-20251002-121016.tar.gz your-username@your-server-ip:~/
```

### Step 2: Extract Package (1 minute)

```bash
# SSH into server
ssh your-username@your-server-ip

# Extract
tar -xzf holovitals-dev-20251002-121016.tar.gz
cd holovitals-dev-20251002-121016
```

### Step 3: Run Production Installation (15-20 minutes)

```bash
# Run the production installer
chmod +x scripts/install-with-nginx.sh
./scripts/install-with-nginx.sh
```

**You will be prompted for:**
1. **Domain name** (e.g., holovitals.com)
2. **Email address** (for SSL certificate)
3. **Use www subdomain?** (yes/no)

**Example:**
```
Enter your domain name (e.g., holovitals.com): holovitals.com
Enter your email for SSL certificate: admin@holovitals.com
Use www subdomain? (yes/no): yes
```

### Step 4: Save Credentials (IMPORTANT)

The installer will display:
- Database password
- NextAuth secret
- Domain URL

**SAVE THESE SECURELY!**

### Step 5: Verify Installation (2 minutes)

```bash
# Check service status
sudo systemctl status holovitals

# Check Nginx
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Test your site
curl https://your-domain.com
```

---

## 🔧 What Gets Installed

### Software Stack
```
┌─────────────────────────────────────┐
│         Internet (HTTPS)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Nginx (Port 80/443)                │
│  - SSL Termination                  │
│  - Reverse Proxy                    │
│  - Static File Caching              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Next.js App (Port 3000)            │
│  - HoloVitals Application           │
│  - API Routes                       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PostgreSQL (Port 5432)             │
│  Redis (Port 6379)                  │
└─────────────────────────────────────┘
```

### Directory Structure
```
/home/your-username/
├── HoloVitals/                    # Application
│   └── medical-analysis-platform/
├── holovitals-logs/               # Logs
│   ├── holovitals.log
│   ├── nginx-access.log
│   └── nginx-error.log
├── holovitals-backups/            # Daily backups
└── holovitals-scripts/            # Management scripts

/etc/nginx/
├── sites-available/
│   └── holovitals                 # Nginx config
└── sites-enabled/
    └── holovitals -> ../sites-available/holovitals

/etc/systemd/system/
└── holovitals.service             # Systemd service

/etc/letsencrypt/
└── live/your-domain.com/          # SSL certificates
    ├── fullchain.pem
    └── privkey.pem
```

---

## 📊 Service Management

### Application Service

```bash
# Check status
sudo systemctl status holovitals

# Start service
sudo systemctl start holovitals

# Stop service
sudo systemctl stop holovitals

# Restart service
sudo systemctl restart holovitals

# View logs
sudo journalctl -u holovitals -f

# Enable auto-start on boot
sudo systemctl enable holovitals
```

### Nginx Service

```bash
# Check status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Test configuration
sudo nginx -t

# Reload configuration (no downtime)
sudo systemctl reload nginx
```

### Database & Redis

```bash
# PostgreSQL
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Redis
sudo systemctl status redis-server
sudo systemctl restart redis-server
```

---

## 📋 Log Management

### View Logs

```bash
# Application logs (real-time)
sudo journalctl -u holovitals -f

# Application logs (last 100 lines)
sudo journalctl -u holovitals -n 100

# Nginx access logs
tail -f ~/holovitals-logs/nginx-access.log

# Nginx error logs
tail -f ~/holovitals-logs/nginx-error.log

# All logs
tail -f ~/holovitals-logs/*.log
```

### Log Rotation

Logs are automatically rotated:
- **Frequency:** Daily
- **Retention:** 14 days
- **Compression:** Yes
- **Location:** `~/holovitals-logs/`

---

## 🔐 SSL Certificate Management

### Certificate Information

```bash
# View certificate details
sudo certbot certificates

# Shows:
# - Certificate name
# - Domains
# - Expiry date
# - Certificate path
```

### Auto-Renewal

Certificates automatically renew:
- **Frequency:** Checked twice daily
- **Renewal:** 30 days before expiry
- **Service:** certbot.timer (systemd)

### Manual Renewal

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Restart Nginx after renewal
sudo systemctl reload nginx
```

### Add More Domains

```bash
# Add subdomain
sudo certbot --nginx -d subdomain.yourdomain.com

# Restart Nginx
sudo systemctl reload nginx
```

---

## 💾 Backup & Restore

### Automatic Backups

Backups run automatically:
- **Frequency:** Daily at 2 AM
- **Location:** `~/holovitals-backups/`
- **Retention:** 30 days
- **Format:** Compressed SQL (.sql.gz)

### Manual Backup

```bash
# Run backup script
~/holovitals-scripts/backup-production.sh

# Verify backup
ls -lh ~/holovitals-backups/
```

### Restore from Backup

```bash
# List available backups
ls -lh ~/holovitals-backups/

# Stop application
sudo systemctl stop holovitals

# Restore database
gunzip -c ~/holovitals-backups/holovitals-YYYYMMDD-HHMMSS.sql.gz | psql -U holovitals holovitals

# Start application
sudo systemctl start holovitals
```

---

## 🏥 Health Monitoring

### Automatic Health Checks

Health checks run every 5 minutes:
- Checks all services (app, nginx, postgres, redis)
- Auto-restarts failed services
- Logs to `~/holovitals-logs/health-check.log`
- Monitors disk space (alerts at 80%)

### Manual Health Check

```bash
# Check all services
sudo systemctl status holovitals nginx postgresql redis-server

# Check disk space
df -h

# Check memory
free -h

# Check processes
ps aux | grep -E 'node|nginx|postgres|redis'
```

---

## 🔥 Firewall Configuration

### Current Rules

```bash
# View firewall status
sudo ufw status

# Should show:
# 22/tcp (SSH) - ALLOW
# 80/tcp (HTTP) - ALLOW
# 443/tcp (HTTPS) - ALLOW
```

### Modify Firewall

```bash
# Allow additional port
sudo ufw allow PORT/tcp

# Remove rule
sudo ufw delete allow PORT/tcp

# Reload firewall
sudo ufw reload
```

---

## 🔧 Configuration Updates

### Update Environment Variables

```bash
# Edit .env.local
cd ~/HoloVitals/medical-analysis-platform
nano .env.local

# After changes, restart
sudo systemctl restart holovitals
```

### Update Nginx Configuration

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/holovitals

# Test configuration
sudo nginx -t

# Reload Nginx (no downtime)
sudo systemctl reload nginx
```

### Update Application Code

```bash
# Pull latest changes
cd ~/HoloVitals
git pull origin main

# Install dependencies
cd medical-analysis-platform
npm install

# Build production
npm run build

# Restart service
sudo systemctl restart holovitals
```

---

## 🚨 Troubleshooting

### Application Won't Start

```bash
# Check logs
sudo journalctl -u holovitals -n 50

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart service
sudo systemctl restart holovitals
```

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# If expired, force renewal
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Nginx 502 Bad Gateway

```bash
# Check if application is running
sudo systemctl status holovitals

# Check application logs
sudo journalctl -u holovitals -n 50

# Restart application
sudo systemctl restart holovitals
```

### Database Connection Error

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Test connection
psql -U holovitals -d holovitals -c "SELECT 1;"
```

### High Memory Usage

```bash
# Check memory
free -h

# Check processes
ps aux --sort=-%mem | head -10

# Restart application
sudo systemctl restart holovitals
```

### Disk Space Full

```bash
# Check disk usage
df -h

# Find large files
du -h --max-depth=1 / | sort -hr | head -20

# Clean old logs
sudo journalctl --vacuum-time=7d

# Clean old backups
cd ~/holovitals-backups
ls -t *.sql.gz | tail -n +31 | xargs rm
```

---

## 🔄 Deployment Workflow

### Deploy New Changes

```bash
# 1. Pull latest code
cd ~/HoloVitals
git pull origin main

# 2. Install dependencies
cd medical-analysis-platform
npm install

# 3. Run migrations
npx prisma migrate deploy

# 4. Build production
npm run build

# 5. Restart service
sudo systemctl restart holovitals

# 6. Verify
curl https://your-domain.com
sudo journalctl -u holovitals -f
```

### Zero-Downtime Deployment (Advanced)

```bash
# 1. Build in separate directory
cd ~/HoloVitals-new
git clone https://github.com/cloudbyday90/HoloVitals.git .
cd medical-analysis-platform
npm install
npm run build

# 2. Stop old service
sudo systemctl stop holovitals

# 3. Swap directories
mv ~/HoloVitals ~/HoloVitals-old
mv ~/HoloVitals-new ~/HoloVitals

# 4. Start new service
sudo systemctl start holovitals

# 5. Verify and cleanup
curl https://your-domain.com
rm -rf ~/HoloVitals-old
```

---

## 📈 Performance Optimization

### Enable Gzip Compression

Already enabled in Nginx config for:
- HTML, CSS, JavaScript
- JSON, XML
- Fonts

### Enable HTTP/2

Already enabled in Nginx config:
```nginx
listen 443 ssl http2;
```

### Static File Caching

Already configured:
- `/_next/static` - 60 minutes
- `/public` - 60 minutes

### Database Optimization

```bash
# Analyze database
psql -U holovitals -d holovitals -c "ANALYZE;"

# Vacuum database
psql -U holovitals -d holovitals -c "VACUUM;"
```

---

## 🔒 Security Best Practices

### Regular Updates

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Update npm packages
cd ~/HoloVitals/medical-analysis-platform
npm update

# Rebuild and restart
npm run build
sudo systemctl restart holovitals
```

### Security Audits

```bash
# Check for security updates
sudo apt-get update
sudo apt-get upgrade --dry-run

# Check npm vulnerabilities
cd ~/HoloVitals/medical-analysis-platform
npm audit

# Fix vulnerabilities
npm audit fix
```

### Monitor Logs for Suspicious Activity

```bash
# Check for failed login attempts
sudo grep "Failed password" /var/log/auth.log

# Check Nginx access logs for unusual patterns
tail -1000 ~/holovitals-logs/nginx-access.log | grep -E "404|500"
```

---

## 📞 Support & Maintenance

### Daily Tasks
- [ ] Check application status
- [ ] Review error logs
- [ ] Monitor disk space

### Weekly Tasks
- [ ] Review access logs
- [ ] Check backup integrity
- [ ] Update system packages
- [ ] Review security logs

### Monthly Tasks
- [ ] Full security audit
- [ ] Database optimization
- [ ] Update dependencies
- [ ] Review SSL certificate expiry
- [ ] Test backup restoration

---

## 🎯 Quick Reference

### Essential Commands

```bash
# Service management
sudo systemctl restart holovitals
sudo systemctl status holovitals
sudo journalctl -u holovitals -f

# Nginx
sudo systemctl reload nginx
sudo nginx -t

# Logs
tail -f ~/holovitals-logs/*.log

# Backup
~/holovitals-scripts/backup-production.sh

# Health check
~/holovitals-scripts/health-check-production.sh
```

### Important Files

```bash
# Application
~/HoloVitals/medical-analysis-platform/

# Environment
~/HoloVitals/medical-analysis-platform/.env.local

# Nginx config
/etc/nginx/sites-available/holovitals

# Systemd service
/etc/systemd/system/holovitals.service

# SSL certificates
/etc/letsencrypt/live/your-domain.com/

# Logs
~/holovitals-logs/
```

---

## ✅ Post-Installation Checklist

### Immediate
- [ ] Site accessible via HTTPS
- [ ] SSL certificate valid
- [ ] All services running
- [ ] Logs show no errors
- [ ] Firewall configured
- [ ] Credentials saved securely

### Within 24 Hours
- [ ] Test all features
- [ ] Configure API keys
- [ ] Set up monitoring alerts
- [ ] Test backup/restore
- [ ] Review security settings

### Within 1 Week
- [ ] Full security audit
- [ ] Performance testing
- [ ] Load testing
- [ ] Documentation review
- [ ] Team training

---

## 🎉 Success!

Your HoloVitals application is now running in production with:
- ✅ HTTPS with valid SSL certificate
- ✅ Automatic service management
- ✅ Daily backups
- ✅ Health monitoring
- ✅ Log rotation
- ✅ Firewall protection
- ✅ Production optimization

**Your site is live at:** `https://your-domain.com` 🚀