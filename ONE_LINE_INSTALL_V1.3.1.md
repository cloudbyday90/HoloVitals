# HoloVitals v1.3.1 - One-Line Installation Guide

## 🚀 Quick Install (Recommended)

For a fresh Ubuntu/Debian system, run this single command:

```bash
wget -O - https://github.com/cloudbyday90/HoloVitals/releases/download/v1.3.1/holovitals-v1.3.1.tar.gz | tar xz && cd holovitals-v1.3.1-* && chmod +x scripts/install-v1.3.1.sh && ./scripts/install-v1.3.1.sh 2>&1 | tee install.log
```

## 📋 What This Command Does

1. **Downloads** the latest HoloVitals v1.3.1 package from GitHub
2. **Extracts** the package automatically
3. **Navigates** to the extracted directory
4. **Makes** the installation script executable
5. **Runs** the installation script
6. **Logs** everything to `install.log` for troubleshooting

## ✨ What's New in v1.3.1

### 🔧 Critical Fixes
- **Fixed PostgreSQL Authentication Error (P1000)**
  - Proper pg_hba.conf configuration
  - Database connection testing before migrations
  - Better error handling

- **Simplified Installation Process**
  - Removed HIPAA team email prompts during installation
  - HIPAA configuration moved to Admin Dashboard
  - Faster, non-interactive installation

### 🎯 New Features
- **Admin Dashboard - HIPAA Team Configuration**
  - Configure HIPAA compliance team after installation
  - User-friendly web interface at `/admin/hipaa-team`
  - Update team members anytime without re-installation

## 📝 Prerequisites

- Ubuntu 20.04+ or Debian 11+ (64-bit)
- Minimum 2GB RAM
- 10GB free disk space
- Root or sudo access
- Active internet connection
- Cloudflare account with Tunnel token

## 🎬 Installation Steps

### Step 1: Prepare Your System

Ensure you're logged in as a regular user (not root):
```bash
whoami  # Should NOT return 'root'
```

### Step 2: Run the One-Line Install

```bash
wget -O - https://github.com/cloudbyday90/HoloVitals/releases/download/v1.3.1/holovitals-v1.3.1.tar.gz | tar xz && cd holovitals-v1.3.1-* && chmod +x scripts/install-v1.3.1.sh && ./scripts/install-v1.3.1.sh 2>&1 | tee install.log
```

### Step 3: Provide Configuration

During installation, you'll be prompted for:

1. **Domain name** (e.g., holovitals.example.com)
2. **Admin email** (e.g., admin@example.com)
3. **Cloudflare Tunnel token** (from your Cloudflare dashboard)

### Step 4: Wait for Installation

The script will:
- Update system packages
- Install Node.js 20, PostgreSQL, and dependencies
- Configure database with proper authentication
- Set up the application
- Run database migrations
- Build the application
- Configure PM2 process manager
- Set up Cloudflare Tunnel

**Estimated time:** 10-15 minutes

### Step 5: Configure HIPAA Team (Post-Installation)

After installation completes:

1. Navigate to: `https://your-domain.com/admin/hipaa-team`
2. Update the default email addresses:
   - Compliance Officer
   - Privacy Officer
   - Security Officer
3. Fill in names and phone numbers (optional)
4. Enable/disable notifications as needed
5. Click "Save Configuration"

## 🔐 Important Post-Installation Steps

### 1. Update API Keys

Edit the environment file:
```bash
cd medical-analysis-platform
nano .env.local
```

Update these values:
```env
OPENAI_API_KEY=your_actual_openai_key
ANTHROPIC_API_KEY=your_actual_anthropic_key
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM=noreply@your-domain.com
```

### 2. Restart the Application

```bash
pm2 restart holovitals
```

### 3. Configure HIPAA Compliance Team

Visit: `https://your-domain.com/admin/hipaa-team`

### 4. Verify Installation

Check application status:
```bash
pm2 status
pm2 logs holovitals
```

Check Cloudflare Tunnel:
```bash
sudo systemctl status cloudflared
```

## 📊 Access Your Application

- **Main Application:** `https://your-domain.com`
- **Admin Dashboard:** `https://your-domain.com/admin`
- **Error Logs:** `https://your-domain.com/admin/errors`
- **HIPAA Compliance:** `https://your-domain.com/admin/hipaa-compliance`
- **HIPAA Team Config:** `https://your-domain.com/admin/hipaa-team`

## 🔧 Useful Commands

```bash
# View application logs
pm2 logs holovitals

# Restart application
pm2 restart holovitals

# Stop application
pm2 stop holovitals

# Check application status
pm2 status

# Check Cloudflare Tunnel status
sudo systemctl status cloudflared

# View installation log
cat install.log
```

## 🐛 Troubleshooting

### Database Connection Issues

If you see "P1000: Authentication failed" error:

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check pg_hba.conf configuration
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep holovitals

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Application Won't Start

```bash
# Check logs
pm2 logs holovitals

# Check for port conflicts
sudo netstat -tulpn | grep :3000

# Restart application
pm2 restart holovitals
```

### Cloudflare Tunnel Issues

```bash
# Check tunnel status
sudo systemctl status cloudflared

# View tunnel logs
sudo journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared
```

### HIPAA Team Configuration Not Saving

1. Check browser console for errors
2. Verify you're logged in as ADMIN
3. Check application logs: `pm2 logs holovitals`
4. Verify database connection

## 📚 Additional Resources

- **Installation Log:** `install.log` (created during installation)
- **Changelog:** `CHANGELOG_V1.3.1.md`
- **Fixes Summary:** `V1.3.1_FIXES_SUMMARY.md`
- **Log Management Guide:** `INTELLIGENT_LOG_MANAGEMENT_GUIDE.md`
- **HIPAA Compliance Guide:** `HIPAA_COMPLIANCE_MONITORING_DESIGN.md`

## 🔄 Upgrading from v1.3.0

If you're already running v1.3.0:

```bash
# Stop the application
pm2 stop holovitals

# Backup database
pg_dump -U holovitals holovitals > backup_v1.3.0.sql

# Download v1.3.1
wget https://github.com/cloudbyday90/HoloVitals/releases/download/v1.3.1/holovitals-v1.3.1.tar.gz
tar xzf holovitals-v1.3.1.tar.gz
cd holovitals-v1.3.1-*

# Copy your .env.local
cp /path/to/old/installation/medical-analysis-platform/.env.local medical-analysis-platform/

# Install and rebuild
cd medical-analysis-platform
npm install
npm run build

# Restart
pm2 restart holovitals
```

## 💡 Tips

1. **Save Database Credentials:** The installation script displays database credentials at the end. Save these securely!

2. **Configure HIPAA Team First:** Before using the application in production, configure your HIPAA compliance team via the Admin Dashboard.

3. **Monitor Logs:** Regularly check logs for errors and issues:
   ```bash
   pm2 logs holovitals
   ```

4. **Keep Backups:** Regularly backup your database:
   ```bash
   pg_dump -U holovitals holovitals > backup_$(date +%Y%m%d).sql
   ```

5. **Update API Keys:** Don't forget to update the API keys in `.env.local` after installation.

## 🆘 Getting Help

If you encounter issues:

1. Check the installation log: `cat install.log`
2. Review the troubleshooting section above
3. Check application logs: `pm2 logs holovitals`
4. Open an issue on GitHub: https://github.com/cloudbyday90/HoloVitals/issues

## 🎉 Success!

Once installation is complete and you've configured the HIPAA team, your HoloVitals instance is ready to use!

Visit your domain to get started: `https://your-domain.com`

---

**Version:** v1.3.1  
**Release Date:** October 4, 2025  
**Package Size:** ~882KB  
**Installation Time:** 10-15 minutes