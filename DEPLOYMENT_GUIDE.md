# HoloVitals Production Deployment Guide

## Overview
This guide provides complete instructions for deploying HoloVitals on an Ubuntu LTS server with automated installation, verification, and management.

---

## Prerequisites

### Server Requirements
- **Operating System:** Ubuntu 20.04, 22.04, or 24.04 LTS
- **CPU:** 2+ cores (4+ recommended)
- **RAM:** 4GB minimum (8GB+ recommended)
- **Disk Space:** 20GB minimum (50GB+ recommended)
- **Network:** Static IP address or domain name
- **Ports:** Custom port for HTTPS (default: 8443)

### Access Requirements
- Root or sudo access
- SSH access to server
- Port forwarding configured on your router/firewall

---

## Quick Start (5 Minutes)

### Step 1: Download Deployment Script

```bash
# SSH into your server
ssh user@your-server-ip

# Download the deployment script
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/deploy-holovitals.sh

# Make it executable
chmod +x deploy-holovitals.sh
```

### Step 2: Run Installation

```bash
# Run as root
sudo bash deploy-holovitals.sh
```

The script will:
- ✅ Install all dependencies (Node.js, PostgreSQL, Redis, Nginx)
- ✅ Clone HoloVitals repository
- ✅ Configure database and services
- ✅ Build and deploy application
- ✅ Set up SSL, firewall, backups, and monitoring
- ✅ Create management scripts

**Installation takes approximately 10-15 minutes.**

### Step 3: Verify Installation

```bash
# Download verification script
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/verify-installation.sh
chmod +x verify-installation.sh

# Run verification
sudo bash verify-installation.sh
```

### Step 4: Access Application

```
https://your-server-ip:8443
```

---

## Detailed Installation Steps

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install basic tools
sudo apt install -y curl wget git

# Check system resources
free -h  # Check RAM
df -h    # Check disk space
```

### 2. Configure Firewall (Before Installation)

```bash
# If you have a firewall, allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirect)
sudo ufw allow 8443/tcp  # HTTPS (custom port)
sudo ufw enable
```

### 3. Run Deployment Script

```bash
# Download script
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/deploy-holovitals.sh

# Review script (optional but recommended)
less deploy-holovitals.sh

# Run installation
sudo bash deploy-holovitals.sh
```

### 4. Save Credentials

The installation creates a credentials file at:
```
/opt/holovitals/CREDENTIALS.txt
```

**IMPORTANT:** Save these credentials immediately!

```bash
# View credentials
sudo cat /opt/holovitals/CREDENTIALS.txt

# Copy to secure location
sudo cp /opt/holovitals/CREDENTIALS.txt ~/holovitals-credentials.txt
sudo chown $USER:$USER ~/holovitals-credentials.txt
```

---

## Post-Installation Configuration

### 1. Configure API Keys

Edit the environment file:
```bash
sudo nano /opt/holovitals/medical-analysis-platform/.env.production
```

Add your API keys:
```env
# AI Providers
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Restart the application:
```bash
holovitals-restart
```

### 2. Set Up SSL Certificate (Let's Encrypt)

For production, replace the self-signed certificate with Let's Encrypt:

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Certbot will automatically configure Nginx
```

### 3. Configure Domain Name

If you have a domain name:

1. **Add DNS A Record:**
   - Point your domain to your server IP
   - Wait for DNS propagation (up to 48 hours)

2. **Update Nginx Configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/holovitals
   ```
   
   Replace `server_name _;` with:
   ```nginx
   server_name your-domain.com www.your-domain.com;
   ```

3. **Restart Nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

### 4. Configure Email Alerts

Edit the monitoring script:
```bash
sudo nano /usr/local/bin/holovitals-monitor.sh
```

Add email notification:
```bash
# Send alert
echo "HoloVitals service was down and has been restarted" | \
  mail -s "HoloVitals Alert" admin@your-domain.com
```

---

## Management Commands

### Service Management

```bash
# Start application
holovitals-start

# Stop application
holovitals-stop

# Restart application
holovitals-restart

# Check status
holovitals-status

# View logs
holovitals-logs

# Update application
holovitals-update
```

### Manual Service Control

```bash
# Using systemctl
sudo systemctl start holovitals
sudo systemctl stop holovitals
sudo systemctl restart holovitals
sudo systemctl status holovitals

# View detailed logs
sudo journalctl -u holovitals -f
sudo journalctl -u holovitals -n 100
```

### Database Management

```bash
# Connect to database
sudo -u postgres psql -d holovitals

# Backup database
sudo -u postgres pg_dump holovitals > backup.sql

# Restore database
sudo -u postgres psql holovitals < backup.sql

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('holovitals'));"
```

### Redis Management

```bash
# Connect to Redis
redis-cli -a $(grep REDIS_PASSWORD /opt/holovitals/medical-analysis-platform/.env.production | cut -d= -f2 | tr -d '"')

# Check Redis status
redis-cli ping

# Monitor Redis
redis-cli monitor
```

---

## Backup and Restore

### Automatic Backups

Backups run automatically every day at 2 AM:
- Location: `/var/backups/holovitals/`
- Retention: 7 days
- Format: Compressed SQL dumps

### Manual Backup

```bash
# Run backup script
sudo /usr/local/bin/holovitals-backup.sh

# List backups
ls -lh /var/backups/holovitals/

# Copy backup to safe location
sudo cp /var/backups/holovitals/db_backup_*.sql.gz ~/
```

### Restore from Backup

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

## Monitoring and Maintenance

### Check System Health

```bash
# Full status check
holovitals-status

# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check network connections
netstat -tlnp | grep -E '(3000|8443|5432|6379)'
```

### View Logs

```bash
# Application logs
holovitals-logs

# Nginx access logs
sudo tail -f /var/log/nginx/holovitals-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/holovitals-error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# System logs
sudo journalctl -f
```

### Performance Monitoring

```bash
# Database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='holovitals';"

# Database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('holovitals'));"

# Redis memory usage
redis-cli info memory

# Application memory usage
ps aux | grep node
```

---

## Updating HoloVitals

### Automatic Update

```bash
# Run update script
holovitals-update
```

This will:
1. Pull latest code from GitHub
2. Install new dependencies
3. Run database migrations
4. Rebuild application
5. Restart services

### Manual Update

```bash
# Stop application
holovitals-stop

# Navigate to directory
cd /opt/holovitals/medical-analysis-platform

# Pull latest changes
sudo -u holovitals git pull

# Install dependencies
sudo -u holovitals npm install --production

# Run migrations
sudo -u holovitals npx prisma migrate deploy

# Build application
sudo -u holovitals npm run build

# Start application
holovitals-start
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check service status
sudo systemctl status holovitals

# Check logs
sudo journalctl -u holovitals -n 50

# Check if port is in use
sudo netstat -tlnp | grep 3000

# Restart all services
sudo systemctl restart postgresql redis-server nginx holovitals
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -d holovitals -c "SELECT 1;"

# Check database credentials
grep DATABASE_URL /opt/holovitals/medical-analysis-platform/.env.production

# Reset database password
sudo -u postgres psql -c "ALTER USER holovitals PASSWORD 'new_password';"
```

### High Memory Usage

```bash
# Check memory usage
free -h

# Restart application
holovitals-restart

# Clear Redis cache
redis-cli FLUSHALL

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### SSL Certificate Issues

```bash
# Check certificate
sudo openssl x509 -in /etc/nginx/ssl/holovitals.crt -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Port Already in Use

```bash
# Find process using port
sudo netstat -tlnp | grep 8443

# Kill process
sudo kill -9 <PID>

# Or change port in Nginx config
sudo nano /etc/nginx/sites-available/holovitals
```

---

## Security Best Practices

### 1. Change Default Passwords

```bash
# Change database password
sudo -u postgres psql -c "ALTER USER holovitals PASSWORD 'new_secure_password';"

# Update .env.production
sudo nano /opt/holovitals/medical-analysis-platform/.env.production

# Restart application
holovitals-restart
```

### 2. Configure Firewall

```bash
# Check firewall status
sudo ufw status

# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 8443/tcp
sudo ufw enable
```

### 3. Enable Automatic Security Updates

```bash
# Configure unattended upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Set Up Fail2ban

```bash
# Configure Fail2ban for Nginx
sudo nano /etc/fail2ban/jail.local
```

Add:
```ini
[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true
```

Restart:
```bash
sudo systemctl restart fail2ban
```

### 5. Regular Security Audits

```bash
# Check for security updates
sudo apt update
sudo apt list --upgradable

# Check open ports
sudo netstat -tlnp

# Check failed login attempts
sudo grep "Failed password" /var/log/auth.log

# Check Fail2ban status
sudo fail2ban-client status
```

---

## Performance Optimization

### 1. Database Optimization

```bash
# Analyze database
sudo -u postgres psql holovitals -c "ANALYZE;"

# Vacuum database
sudo -u postgres psql holovitals -c "VACUUM ANALYZE;"

# Check slow queries
sudo -u postgres psql holovitals -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### 2. Redis Optimization

Edit Redis config:
```bash
sudo nano /etc/redis/redis.conf
```

Optimize settings:
```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

Restart Redis:
```bash
sudo systemctl restart redis-server
```

### 3. Nginx Optimization

Edit Nginx config:
```bash
sudo nano /etc/nginx/nginx.conf
```

Add:
```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

Reload Nginx:
```bash
sudo systemctl reload nginx
```

---

## Scaling and High Availability

### Horizontal Scaling

For high traffic, consider:

1. **Load Balancer:** Use Nginx or HAProxy
2. **Multiple App Instances:** Run on different ports
3. **Database Replication:** PostgreSQL streaming replication
4. **Redis Cluster:** For distributed caching

### Vertical Scaling

Increase server resources:
- Upgrade to more CPU cores
- Add more RAM
- Use faster SSD storage

---

## Uninstallation

If you need to remove HoloVitals:

```bash
# Stop services
holovitals-stop
sudo systemctl stop postgresql redis-server nginx

# Remove application
sudo rm -rf /opt/holovitals

# Remove services
sudo systemctl disable holovitals
sudo rm /etc/systemd/system/holovitals.service

# Remove databases
sudo -u postgres psql -c "DROP DATABASE holovitals;"
sudo -u postgres psql -c "DROP DATABASE holovitals_shadow;"
sudo -u postgres psql -c "DROP USER holovitals;"

# Remove packages (optional)
sudo apt remove --purge postgresql-15 redis-server nginx nodejs

# Remove backups
sudo rm -rf /var/backups/holovitals

# Remove management scripts
sudo rm /usr/local/bin/holovitals-*
```

---

## Support and Resources

### Documentation
- Installation Log: `/var/log/holovitals-install.log`
- Credentials: `/opt/holovitals/CREDENTIALS.txt`
- Application Directory: `/opt/holovitals/medical-analysis-platform`

### Useful Commands
```bash
# Quick status check
holovitals-status

# View recent logs
holovitals-logs

# Full system check
sudo bash verify-installation.sh
```

### Getting Help
1. Check logs for error messages
2. Review troubleshooting section
3. Verify all services are running
4. Check firewall and network settings

---

## Appendix

### A. File Locations

```
/opt/holovitals/                          # Application directory
/opt/holovitals/CREDENTIALS.txt           # Credentials file
/opt/holovitals/medical-analysis-platform # Application code
/var/log/holovitals-install.log          # Installation log
/var/backups/holovitals/                  # Backup directory
/etc/systemd/system/holovitals.service   # Systemd service
/etc/nginx/sites-available/holovitals    # Nginx configuration
/usr/local/bin/holovitals-*              # Management scripts
```

### B. Default Ports

```
3000  - Application (internal)
5432  - PostgreSQL
6379  - Redis
80    - HTTP (redirect to HTTPS)
8443  - HTTPS (custom port)
```

### C. Environment Variables

```env
DATABASE_URL              # PostgreSQL connection string
REDIS_HOST               # Redis host
REDIS_PORT               # Redis port
REDIS_PASSWORD           # Redis password
NEXTAUTH_URL             # Application URL
NEXTAUTH_SECRET          # NextAuth secret
NODE_ENV                 # Environment (production)
PORT                     # Application port
```

---

**Deployment Guide Version:** 1.0  
**Last Updated:** October 2, 2025  
**Compatible with:** Ubuntu 20.04, 22.04, 24.04 LTS