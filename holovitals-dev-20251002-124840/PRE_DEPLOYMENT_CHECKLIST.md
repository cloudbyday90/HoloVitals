# Pre-Deployment Checklist

## Before Running the Installation Script

### Server Requirements ✓

- [ ] Ubuntu 20.04, 22.04, or 24.04 LTS
- [ ] Minimum 4GB RAM (8GB+ recommended)
- [ ] Minimum 20GB disk space (50GB+ recommended)
- [ ] 2+ CPU cores (4+ recommended)
- [ ] Root or sudo access
- [ ] SSH access configured

### Network Requirements ✓

- [ ] Static IP address or domain name
- [ ] Port 8443 available (or choose different custom port)
- [ ] Port 80 available (for HTTP redirect)
- [ ] Port 22 available (for SSH)
- [ ] Internet connectivity for downloading packages

### Security Preparation ✓

- [ ] SSH key authentication configured (recommended)
- [ ] Firewall rules planned
- [ ] Backup strategy planned
- [ ] SSL certificate plan (self-signed or Let's Encrypt)

### Information to Prepare ✓

- [ ] Server IP address: `___________________`
- [ ] Domain name (if any): `___________________`
- [ ] Custom HTTPS port: `8443` (or `___________________`)
- [ ] Admin email: `___________________`

### API Keys to Obtain ✓

- [ ] OpenAI API key (for AI features)
- [ ] Anthropic API key (optional, for Claude)
- [ ] Stripe API keys (for payment processing)
  - [ ] Publishable key
  - [ ] Secret key
  - [ ] Webhook secret

### Optional Services ✓

- [ ] Email service (for notifications)
- [ ] SMS service (for 2FA)
- [ ] Monitoring service (Datadog, New Relic, etc.)
- [ ] Error tracking (Sentry, Rollbar, etc.)

---

## Installation Steps

### 1. Download Scripts

```bash
# SSH into server
ssh your-username@your-server-ip

# Download deployment script
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/deploy-holovitals.sh

# Download verification script
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/verify-installation.sh

# Make executable
chmod +x deploy-holovitals.sh verify-installation.sh
```

### 2. Review Scripts (Optional but Recommended)

```bash
# Review deployment script
less deploy-holovitals.sh

# Review verification script
less verify-installation.sh
```

### 3. Run Installation

```bash
# Run as root
sudo bash deploy-holovitals.sh
```

### 4. Save Credentials

```bash
# View credentials
sudo cat /opt/holovitals/CREDENTIALS.txt

# Copy to safe location
sudo cp /opt/holovitals/CREDENTIALS.txt ~/holovitals-credentials.txt
sudo chown $USER:$USER ~/holovitals-credentials.txt

# Download to local machine
scp your-username@your-server-ip:~/holovitals-credentials.txt .
```

### 5. Verify Installation

```bash
# Run verification
sudo bash verify-installation.sh

# Should show 100% success rate
```

### 6. Configure API Keys

```bash
# Edit environment file
sudo nano /opt/holovitals/medical-analysis-platform/.env.production

# Add your API keys
# Save and exit (Ctrl+X, Y, Enter)

# Restart application
holovitals-restart
```

### 7. Test Application

```bash
# Check status
holovitals-status

# View logs
holovitals-logs

# Test in browser
# https://your-server-ip:8443
```

---

## Post-Installation Tasks

### Immediate (Within 1 Hour)

- [ ] Save credentials to password manager
- [ ] Test application access
- [ ] Configure API keys
- [ ] Test user registration
- [ ] Test provider onboarding
- [ ] Verify SSL certificate

### Within 24 Hours

- [ ] Set up Let's Encrypt SSL (if using domain)
- [ ] Configure email alerts
- [ ] Test backup script
- [ ] Review security settings
- [ ] Configure monitoring alerts
- [ ] Test all major features

### Within 1 Week

- [ ] Set up external monitoring (UptimeRobot, etc.)
- [ ] Configure log rotation
- [ ] Set up off-site backups
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation review

---

## Verification Checklist

After installation, verify:

### Services Running ✓
- [ ] PostgreSQL service active
- [ ] Redis service active
- [ ] Nginx service active
- [ ] HoloVitals service active

### Network Access ✓
- [ ] Can access via HTTPS on port 8443
- [ ] HTTP redirects to HTTPS
- [ ] Health endpoint responds
- [ ] No firewall blocking

### Database ✓
- [ ] Database created
- [ ] User created
- [ ] Tables created (92 tables)
- [ ] Migrations applied

### Application ✓
- [ ] Application builds successfully
- [ ] No errors in logs
- [ ] Dashboard loads
- [ ] Can register user
- [ ] Can login

### Security ✓
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Fail2ban active
- [ ] File permissions correct
- [ ] Credentials secured

### Backups ✓
- [ ] Backup directory created
- [ ] Backup script executable
- [ ] Cron job configured
- [ ] Test backup runs successfully

### Monitoring ✓
- [ ] Monitoring script configured
- [ ] Cron job configured
- [ ] Service auto-restart works
- [ ] Logs accessible

---

## Common Issues and Solutions

### Issue: Port 8443 Already in Use

**Solution:** Choose a different port

```bash
# Edit deployment script before running
nano deploy-holovitals.sh

# Change this line:
CUSTOM_PORT="8443"  # Change to your preferred port

# Then run installation
sudo bash deploy-holovitals.sh
```

### Issue: Installation Fails

**Solution:** Check logs

```bash
# View installation log
sudo tail -100 /var/log/holovitals-install.log

# Check for specific errors
sudo grep -i error /var/log/holovitals-install.log
```

### Issue: Can't Access Application

**Solution:** Check firewall and services

```bash
# Check firewall
sudo ufw status

# Allow your custom port
sudo ufw allow 8443/tcp

# Check services
holovitals-status

# Restart if needed
holovitals-restart
```

### Issue: Database Connection Failed

**Solution:** Verify PostgreSQL

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -d holovitals -c "SELECT 1;"

# Check credentials
grep DATABASE_URL /opt/holovitals/medical-analysis-platform/.env.production
```

---

## Security Recommendations

### Immediate Actions

1. **Change Default Passwords:**
   ```bash
   # Change database password
   sudo -u postgres psql -c "ALTER USER holovitals PASSWORD 'new_secure_password';"
   
   # Update .env.production
   sudo nano /opt/holovitals/medical-analysis-platform/.env.production
   ```

2. **Configure SSH Key Authentication:**
   ```bash
   # Disable password authentication
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart sshd
   ```

3. **Set Up Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Ongoing Security

- [ ] Regular security updates
- [ ] Monitor failed login attempts
- [ ] Review access logs weekly
- [ ] Test backups monthly
- [ ] Security audit quarterly

---

## Performance Tuning

### For High Traffic

1. **Increase Database Connections:**
   ```bash
   sudo nano /etc/postgresql/15/main/postgresql.conf
   # Set: max_connections = 200
   sudo systemctl restart postgresql
   ```

2. **Increase Redis Memory:**
   ```bash
   sudo nano /etc/redis/redis.conf
   # Set: maxmemory 512mb
   sudo systemctl restart redis-server
   ```

3. **Optimize Nginx:**
   ```bash
   sudo nano /etc/nginx/nginx.conf
   # Set: worker_processes auto;
   # Set: worker_connections 2048;
   sudo systemctl reload nginx
   ```

---

## Support

### Documentation
- **Full Guide:** DEPLOYMENT_GUIDE.md
- **Installation Log:** /var/log/holovitals-install.log
- **Credentials:** /opt/holovitals/CREDENTIALS.txt

### Commands
```bash
# Status check
holovitals-status

# View logs
holovitals-logs

# Verify installation
sudo bash verify-installation.sh
```

### Getting Help
1. Check logs for errors
2. Run verification script
3. Review troubleshooting section
4. Check GitHub issues

---

## Summary

**Installation Method:** One-command automated script  
**Installation Time:** 10-15 minutes  
**Manual Steps:** Minimal  
**Production Ready:** Yes  

**What You Get:**
- Complete HoloVitals platform
- 7 EHR providers
- Automatic backups
- Health monitoring
- SSL encryption
- Management tools

**Access:** `https://your-server-ip:8443`

---

**Ready to deploy?**

```bash
sudo bash deploy-holovitals.sh
```

**After deployment:**

```bash
sudo bash verify-installation.sh
```

---

**Questions?** Review DEPLOYMENT_GUIDE.md for detailed information.