# HoloVitals Server Deployment - Quick Start

## Your Server Setup

You have an Ubuntu LTS server with:
- ✅ Port 443 already forwarded
- ✅ Custom port 8443 available for HoloVitals
- ✅ Root/sudo access

---

## One-Command Installation

### Step 1: SSH into Your Server

```bash
ssh your-username@your-server-ip
```

### Step 2: Download and Run Deployment Script

```bash
# Download deployment script
curl -O https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/deploy-holovitals.sh

# Make executable
chmod +x deploy-holovitals.sh

# Run installation (takes 10-15 minutes)
sudo bash deploy-holovitals.sh
```

**That's it!** The script will:
- Install Node.js, PostgreSQL, Redis, Nginx
- Clone HoloVitals from GitHub
- Configure all services
- Set up SSL, firewall, backups
- Start the application

### Step 3: Save Your Credentials

After installation completes, save the credentials:

```bash
# View credentials
sudo cat /opt/holovitals/CREDENTIALS.txt

# Copy to your home directory
sudo cp /opt/holovitals/CREDENTIALS.txt ~/holovitals-credentials.txt
sudo chown $USER:$USER ~/holovitals-credentials.txt

# Download to your local machine
scp your-username@your-server-ip:~/holovitals-credentials.txt .
```

### Step 4: Access HoloVitals

Open your browser:
```
https://your-server-ip:8443
```

---

## What Gets Installed

### Software Stack
- ✅ **Node.js 20 LTS** - Application runtime
- ✅ **PostgreSQL 15** - Database (92 tables)
- ✅ **Redis 7** - Queue management
- ✅ **Nginx** - Reverse proxy on port 8443
- ✅ **SSL Certificate** - Self-signed (upgrade to Let's Encrypt)

### HoloVitals Features
- ✅ **EHR Sync System** - 7 providers, 75%+ market coverage
- ✅ **Provider Onboarding** - Automatic EHR detection
- ✅ **AI Health Insights** - Risk assessment, recommendations
- ✅ **Clinical Data Viewer** - Labs, medications, timeline
- ✅ **Document Management** - PDF/image viewer
- ✅ **Payment System** - Stripe integration
- ✅ **HIPAA Compliance** - Audit logs, encryption

### Automatic Setup
- ✅ **Systemd Service** - Auto-start on boot
- ✅ **Daily Backups** - 2 AM, 7-day retention
- ✅ **Health Monitoring** - Every 5 minutes
- ✅ **Firewall Rules** - UFW configured
- ✅ **Management Scripts** - Easy commands

---

## Verification

After installation, verify everything works:

```bash
# Download verification script
curl -O https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/verify-installation.sh
chmod +x verify-installation.sh

# Run verification
sudo bash verify-installation.sh
```

Expected output:
```
✓ Operating System: Ubuntu 22.04
✓ Node.js: v20.x.x
✓ PostgreSQL: 15.x
✓ Redis: 7.x.x
✓ Nginx: 1.x.x
✓ All services running
✓ Database tables: 92 tables
✓ Application responding

Verification Summary
--------------------
Total Checks: 25
Passed: 25
Failed: 0
Success Rate: 100%

✓ Installation verification PASSED
```

---

## Quick Management

### Essential Commands

```bash
# Check status
holovitals-status

# View logs
holovitals-logs

# Restart application
holovitals-restart

# Update application
holovitals-update
```

### Service Control

```bash
# Start
sudo systemctl start holovitals

# Stop
sudo systemctl stop holovitals

# Restart
sudo systemctl restart holovitals

# Status
sudo systemctl status holovitals
```

---

## Configuration

### Add Your API Keys

```bash
# Edit environment file
sudo nano /opt/holovitals/medical-analysis-platform/.env.production
```

Add your keys:
```env
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
STRIPE_SECRET_KEY="sk_..."
```

Restart:
```bash
holovitals-restart
```

### Configure Domain (Optional)

If you have a domain name:

1. **Point DNS to your server IP**

2. **Update Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/holovitals
   ```
   
   Change:
   ```nginx
   server_name your-domain.com;
   ```

3. **Get SSL Certificate:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

4. **Restart Nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

---

## Accessing Your Installation

### URLs
- **HTTPS:** `https://your-server-ip:8443`
- **HTTP:** `http://your-server-ip` (redirects to HTTPS)
- **Health Check:** `https://your-server-ip:8443/health`

### Default Pages
- Dashboard: `/dashboard`
- Provider Onboarding: `/providers/onboard`
- EHR Sync: `/sync`
- AI Insights: `/ai-insights`
- Health Score: `/health-score`

---

## Backup and Recovery

### Automatic Backups
- **Schedule:** Daily at 2 AM
- **Location:** `/var/backups/holovitals/`
- **Retention:** 7 days
- **Format:** Compressed SQL dumps

### Manual Backup
```bash
sudo /usr/local/bin/holovitals-backup.sh
```

### Restore Backup
```bash
# Stop application
holovitals-stop

# Restore database
gunzip -c /var/backups/holovitals/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
  sudo -u postgres psql holovitals

# Start application
holovitals-start
```

---

## Monitoring

### Health Checks
- **Automatic:** Every 5 minutes
- **Manual:** `holovitals-status`
- **Endpoint:** `https://your-server-ip:8443/health`

### Logs
```bash
# Application logs
holovitals-logs

# All logs
sudo journalctl -u holovitals -f
```

### Metrics
```bash
# Database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='holovitals';"

# Memory usage
free -h

# Disk usage
df -h
```

---

## Troubleshooting

### Can't Access Application

1. **Check service is running:**
   ```bash
   holovitals-status
   ```

2. **Check firewall:**
   ```bash
   sudo ufw status
   ```

3. **Check Nginx:**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

4. **Check logs:**
   ```bash
   holovitals-logs
   ```

### Database Issues

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -d holovitals -c "SELECT 1;"

# Check credentials
grep DATABASE_URL /opt/holovitals/medical-analysis-platform/.env.production
```

### Need Help?

1. Check installation log: `/var/log/holovitals-install.log`
2. Run verification: `sudo bash verify-installation.sh`
3. Review full guide: `DEPLOYMENT_GUIDE.md`

---

## Summary

**Installation Time:** 10-15 minutes  
**Commands Required:** 2 (download + run)  
**Manual Configuration:** Minimal  
**Production Ready:** Yes  

**What You Get:**
- ✅ Complete HoloVitals platform
- ✅ 7 EHR providers integrated
- ✅ Automatic backups
- ✅ Health monitoring
- ✅ SSL encryption
- ✅ Firewall configured
- ✅ Management scripts

**Access:** `https://your-server-ip:8443`

---

**Ready to deploy? Run the installation script!**

```bash
sudo bash deploy-holovitals.sh
```