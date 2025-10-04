# ☁️ HoloVitals with Cloudflare Tunnel - Complete Guide

## Overview
This guide covers deploying HoloVitals with Cloudflare Tunnel, eliminating the need to open any ports on your router. All traffic is securely routed through Cloudflare's network directly to your server.

---

## 🎯 Why Cloudflare Tunnel?

### Benefits
- ✅ **No Port Forwarding** - No need to open ports 80/443 on your router
- ✅ **Enhanced Security** - Your server's IP is hidden from the internet
- ✅ **DDoS Protection** - Cloudflare's network protects against attacks
- ✅ **Free SSL/TLS** - Automatic SSL certificates from Cloudflare
- ✅ **Global CDN** - Content delivered from Cloudflare's edge network
- ✅ **Easy Setup** - No complex firewall rules or port forwarding
- ✅ **Works Anywhere** - Behind NAT, CGNAT, or restrictive networks

### How It Works
```
Internet → Cloudflare Network → Cloudflare Tunnel → Your Server (Nginx) → HoloVitals
```

**No open ports on your router!** Traffic flows through an encrypted tunnel.

---

## 📋 Prerequisites

### 1. Cloudflare Account
- Free Cloudflare account: https://dash.cloudflare.com/sign-up
- Domain added to Cloudflare (nameservers changed)
- Domain active on Cloudflare

### 2. Server Requirements
- Ubuntu 20.04 LTS or newer
- 2GB RAM minimum, 4GB recommended
- 20GB free disk space
- SSH access with sudo privileges

### 3. Before Installation
You'll need:
- Your domain name (e.g., holovitals.com)
- Your email address
- Cloudflare Tunnel token (we'll get this)

---

## 🚀 Step-by-Step Setup

### Step 1: Set Up Cloudflare Tunnel

#### 1.1 Log into Cloudflare Dashboard
```
Go to: https://one.dash.cloudflare.com/
```

#### 1.2 Navigate to Tunnels
```
Left sidebar: Networks → Tunnels
```

#### 1.3 Create a New Tunnel
```
1. Click "Create a tunnel"
2. Select "Cloudflared" as the connector
3. Click "Next"
```

#### 1.4 Name Your Tunnel
```
Tunnel name: holovitals-production
(or any name you prefer)

Click "Save tunnel"
```

#### 1.5 Copy the Tunnel Token
```
You'll see a command like:
sudo cloudflared service install eyJhIjoiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoifQ==

Copy ONLY the token part (starts with "eyJ"):
eyJhIjoiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoifQ==

SAVE THIS TOKEN - you'll need it during installation!
```

#### 1.6 Configure Public Hostname
```
1. In the "Public Hostnames" tab, click "Add a public hostname"

2. Configure:
   Subdomain: (leave empty for root domain)
   Domain: your-domain.com
   Path: (leave empty)
   Type: HTTP
   URL: localhost:80

3. Click "Save hostname"

4. (Optional) Add www subdomain:
   Subdomain: www
   Domain: your-domain.com
   Path: (leave empty)
   Type: HTTP
   URL: localhost:80

5. Click "Save tunnel"
```

**Important:** Don't click "Install connector" - our script will do this!

### Step 2: Transfer Package to Server

```bash
# From your local machine
rsync -avz --progress holovitals-dev-20251002-122839.tar.gz your-username@your-server-ip:~/
```

### Step 3: Extract Package

```bash
# SSH into server
ssh your-username@your-server-ip

# Extract
tar -xzf holovitals-dev-20251002-122839.tar.gz
cd holovitals-dev-20251002-122839
```

### Step 4: Run Cloudflare Tunnel Installation

```bash
# Run the Cloudflare Tunnel installer
chmod +x scripts/install-production-cloudflare.sh
./scripts/install-production-cloudflare.sh
```

**You will be prompted for:**

1. **Domain name:**
   ```
   Enter your domain name (e.g., holovitals.com): your-domain.com
   ```

2. **Email address:**
   ```
   Enter your email for notifications: admin@your-domain.com
   ```

3. **Cloudflare Tunnel token:**
   ```
   Enter your Cloudflare Tunnel token: eyJhIjoiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoifQ==
   ```
   (Paste the token you copied from Step 1.5)

4. **Confirmation:**
   ```
   Continue with installation? (yes/no): yes
   ```

### Step 5: Wait for Installation

The installation will take 15-20 minutes and will:
- Install all required software
- Configure database and services
- Set up Nginx reverse proxy
- Install and configure Cloudflare Tunnel
- Create systemd services
- Configure backups and monitoring

### Step 6: Verify Installation

```bash
# Check application status
sudo systemctl status holovitals

# Check Cloudflare Tunnel status
sudo systemctl status cloudflared

# Check Nginx status
sudo systemctl status nginx

# View tunnel logs
sudo journalctl -u cloudflared -f
```

### Step 7: Test Your Site

```
Open in browser: https://your-domain.com

You should see HoloVitals running!
```

---

## 🔧 What Gets Installed

### Software Stack
```
- Node.js 20 LTS
- PostgreSQL 15
- Redis 7
- Nginx (reverse proxy)
- Cloudflared (Cloudflare Tunnel)
```

### Services
```
- HoloVitals (systemd service, auto-start)
- Nginx (auto-start)
- PostgreSQL (auto-start)
- Redis (auto-start)
- Cloudflared (auto-start)
```

### Configuration Files
```
/etc/nginx/sites-available/holovitals    # Nginx config
/etc/systemd/system/holovitals.service   # App service
/etc/cloudflared/config.yml              # Tunnel config
/etc/cloudflared/cert.json               # Tunnel credentials
```

### Directory Structure
```
~/HoloVitals/                    # Application
~/holovitals-logs/               # Logs
  ├── holovitals.log
  ├── nginx-access.log
  └── nginx-error.log
~/holovitals-backups/            # Daily backups
~/holovitals-scripts/            # Management scripts
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
```

### Cloudflare Tunnel Service

```bash
# Check status
sudo systemctl status cloudflared

# Start tunnel
sudo systemctl start cloudflared

# Stop tunnel
sudo systemctl stop cloudflared

# Restart tunnel
sudo systemctl restart cloudflared

# View logs
sudo journalctl -u cloudflared -f

# Check tunnel info
sudo cloudflared tunnel info
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

---

## 🔍 Monitoring & Logs

### View All Logs

```bash
# Application logs (real-time)
sudo journalctl -u holovitals -f

# Cloudflare Tunnel logs (real-time)
sudo journalctl -u cloudflared -f

# Nginx access logs
tail -f ~/holovitals-logs/nginx-access.log

# Nginx error logs
tail -f ~/holovitals-logs/nginx-error.log

# All logs together
tail -f ~/holovitals-logs/*.log
```

### Check Tunnel Status

```bash
# Service status
sudo systemctl status cloudflared

# Tunnel information
sudo cloudflared tunnel info

# List tunnels
sudo cloudflared tunnel list

# View tunnel configuration
cat /etc/cloudflared/config.yml
```

### Cloudflare Dashboard

```
1. Go to: https://one.dash.cloudflare.com/
2. Navigate to: Networks → Tunnels
3. You should see your tunnel with status "HEALTHY"
4. Click on tunnel name to see:
   - Connection status
   - Traffic metrics
   - Public hostnames
   - Configuration
```

---

## 🔒 Security Features

### What's Protected

```
✅ No open ports on router
✅ Server IP hidden from internet
✅ DDoS protection (Cloudflare)
✅ SSL/TLS encryption (Cloudflare)
✅ Firewall (SSH only)
✅ Automatic security updates
✅ Secure file permissions
✅ Database local-only access
✅ Redis local-only access
```

### Firewall Configuration

```bash
# Check firewall status
sudo ufw status

# Should show:
# 22/tcp (SSH) - ALLOW
# No other ports open!

# Cloudflare Tunnel handles all web traffic
# No need to open ports 80/443
```

### Cloudflare Security Settings

In Cloudflare Dashboard:
```
1. Go to: Security → Settings
2. Enable:
   - Bot Fight Mode
   - Security Level: Medium or High
   - Challenge Passage: 30 minutes
   - Browser Integrity Check
```

---

## 🔧 Configuration Updates

### Update Domain Settings

```bash
# Edit Cloudflare Tunnel config
sudo nano /etc/cloudflared/config.yml

# After changes, restart tunnel
sudo systemctl restart cloudflared
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

### Update Application

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

## 🐛 Troubleshooting

### Tunnel Not Connecting

**Problem:** Cloudflare Tunnel shows as disconnected

**Solution:**
```bash
# Check tunnel status
sudo systemctl status cloudflared

# View tunnel logs
sudo journalctl -u cloudflared -n 50

# Verify token is correct
sudo cat /etc/cloudflared/config.yml

# Restart tunnel
sudo systemctl restart cloudflared

# If still not working, reinstall tunnel
sudo cloudflared service uninstall
sudo cloudflared service install
```

### Site Not Accessible

**Problem:** Can't access site via domain

**Solution:**
```bash
# 1. Check all services are running
sudo systemctl status holovitals
sudo systemctl status nginx
sudo systemctl status cloudflared

# 2. Check Nginx is listening
sudo netstat -tlnp | grep :80

# 3. Check application is running
curl http://localhost:3000

# 4. Check Cloudflare Dashboard
# Go to Networks → Tunnels
# Verify tunnel status is "HEALTHY"

# 5. Check DNS in Cloudflare
# Go to DNS → Records
# Verify CNAME record exists for your domain
```

### 502 Bad Gateway

**Problem:** Nginx returns 502 error

**Solution:**
```bash
# Check if application is running
sudo systemctl status holovitals

# Check application logs
sudo journalctl -u holovitals -n 50

# Restart application
sudo systemctl restart holovitals

# Check if port 3000 is in use
sudo lsof -i :3000
```

### Tunnel Token Invalid

**Problem:** "Invalid tunnel token" error

**Solution:**
```bash
# 1. Get new token from Cloudflare Dashboard
# Go to: Networks → Tunnels → Your Tunnel
# Click "Configure" → "Install connector"
# Copy new token

# 2. Update configuration
sudo nano /etc/cloudflared/config.yml
# Replace token with new one

# 3. Update credentials
echo "NEW_TOKEN" | sudo tee /etc/cloudflared/cert.json

# 4. Restart tunnel
sudo systemctl restart cloudflared
```

---

## 🔄 Maintenance Tasks

### Daily
- [ ] Check application is running
- [ ] Review error logs
- [ ] Verify tunnel is connected

### Weekly
- [ ] Review access logs
- [ ] Check backup integrity
- [ ] Update system packages
- [ ] Review Cloudflare analytics

### Monthly
- [ ] Full security audit
- [ ] Database optimization
- [ ] Update dependencies
- [ ] Review tunnel configuration
- [ ] Test backup restoration

---

## 📈 Performance Optimization

### Cloudflare Settings

```
1. Go to: Speed → Optimization

2. Enable:
   - Auto Minify (HTML, CSS, JS)
   - Brotli compression
   - Early Hints
   - HTTP/2
   - HTTP/3 (with QUIC)

3. Go to: Caching → Configuration
   - Caching Level: Standard
   - Browser Cache TTL: 4 hours
```

### Nginx Optimization

Already configured:
- ✅ Gzip compression
- ✅ Static file caching (60 minutes)
- ✅ HTTP/2 support
- ✅ Cloudflare real IP detection

---

## 💾 Backup & Restore

### Automatic Backups

```
Frequency: Daily at 2 AM
Location: ~/holovitals-backups/
Retention: 30 days
Format: Compressed SQL (.sql.gz)
```

### Manual Backup

```bash
# Run backup script
~/holovitals-scripts/backup-production.sh

# Verify backup
ls -lh ~/holovitals-backups/
```

### Restore from Backup

```bash
# Stop application
sudo systemctl stop holovitals

# Restore database
gunzip -c ~/holovitals-backups/holovitals-YYYYMMDD-HHMMSS.sql.gz | psql -U holovitals holovitals

# Start application
sudo systemctl start holovitals
```

---

## 🎯 Best Practices

### 1. Monitor Tunnel Health
```bash
# Check tunnel status regularly
sudo systemctl status cloudflared

# View tunnel metrics in Cloudflare Dashboard
# Networks → Tunnels → Your Tunnel → Metrics
```

### 2. Keep Software Updated
```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Update cloudflared
sudo cloudflared update

# Update application
cd ~/HoloVitals && git pull
```

### 3. Review Logs Regularly
```bash
# Check for errors
sudo journalctl -u cloudflared --since "1 hour ago" | grep -i error
sudo journalctl -u holovitals --since "1 hour ago" | grep -i error
```

### 4. Use Cloudflare Analytics
```
Go to: Analytics & Logs → Traffic

Monitor:
- Request volume
- Bandwidth usage
- Response times
- Error rates
- Geographic distribution
```

### 5. Enable Cloudflare WAF (Optional)
```
Go to: Security → WAF

Enable managed rulesets for additional protection
```

---

## 📞 Support Resources

### Cloudflare Documentation
- Tunnel Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Troubleshooting: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/troubleshooting/

### Check Service Status
```bash
# All services
sudo systemctl status holovitals nginx cloudflared postgresql redis-server

# Detailed logs
sudo journalctl -u cloudflared -f
sudo journalctl -u holovitals -f
```

### Cloudflare Community
- Community Forum: https://community.cloudflare.com/
- Discord: https://discord.cloudflare.com/

---

## ✅ Post-Installation Checklist

### Immediate
- [ ] Site accessible via HTTPS
- [ ] Cloudflare Tunnel connected
- [ ] All services running
- [ ] Logs show no errors
- [ ] Credentials saved securely

### Within 24 Hours
- [ ] Test all features
- [ ] Configure API keys
- [ ] Review Cloudflare settings
- [ ] Test backup/restore
- [ ] Monitor tunnel metrics

### Within 1 Week
- [ ] Full security audit
- [ ] Performance testing
- [ ] Configure Cloudflare WAF
- [ ] Set up monitoring alerts
- [ ] Team training

---

## 🎉 Summary

### What You Get
- ✅ Secure Cloudflare Tunnel (no open ports!)
- ✅ Automatic SSL/TLS from Cloudflare
- ✅ DDoS protection
- ✅ Global CDN
- ✅ Hidden server IP
- ✅ Production-ready deployment
- ✅ Automatic backups
- ✅ Health monitoring

### Security Level
- **No Open Ports:** ⭐⭐⭐⭐⭐ (5/5)
- **DDoS Protection:** ⭐⭐⭐⭐⭐ (5/5)
- **SSL/TLS:** ⭐⭐⭐⭐⭐ (5/5)
- **Overall Security:** ⭐⭐⭐⭐⭐ (5/5)

### Access Your Site
```
https://your-domain.com
```

**No port forwarding needed!** 🎉