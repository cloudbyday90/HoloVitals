# HoloVitals - One-Line Installation Guide

## 🚀 Quick Install (Latest: v1.3.1)

For a fresh Ubuntu/Debian system, run this single command:

```bash
wget -O - https://github.com/cloudbyday90/HoloVitals/releases/download/v1.3.1/holovitals-v1.3.1.tar.gz | tar xz && cd holovitals-v1.3.1-* && chmod +x scripts/install-v1.3.1.sh && ./scripts/install-v1.3.1.sh 2>&1 | tee install.log
```

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

### Step 1: Run the One-Line Install

```bash
wget -O - https://github.com/cloudbyday90/HoloVitals/releases/download/v1.3.1/holovitals-v1.3.1.tar.gz | tar xz && cd holovitals-v1.3.1-* && chmod +x scripts/install-v1.3.1.sh && ./scripts/install-v1.3.1.sh 2>&1 | tee install.log
```

### Step 2: Provide Configuration

During installation, you'll be prompted for:
1. Domain name (e.g., holovitals.example.com)
2. Admin email (e.g., admin@example.com)
3. Cloudflare Tunnel token

### Step 3: Configure HIPAA Team (Post-Installation)

After installation completes:
1. Navigate to: `https://your-domain.com/admin/hipaa-team`
2. Update the default email addresses for:
   - Compliance Officer
   - Privacy Officer
   - Security Officer
3. Save configuration

## 📊 Access Your Application

- **Main Application:** `https://your-domain.com`
- **Admin Dashboard:** `https://your-domain.com/admin`
- **HIPAA Team Config:** `https://your-domain.com/admin/hipaa-team`
- **Error Logs:** `https://your-domain.com/admin/errors`
- **HIPAA Compliance:** `https://your-domain.com/admin/hipaa-compliance`

## 🔧 Useful Commands

```bash
# View application logs
pm2 logs holovitals

# Restart application
pm2 restart holovitals

# Check application status
pm2 status

# Check Cloudflare Tunnel status
sudo systemctl status cloudflared
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Application Won't Start
```bash
# Check logs
pm2 logs holovitals

# Restart application
pm2 restart holovitals
```

## 📚 Documentation

For detailed documentation, see:
- `CHANGELOG_V1.3.1.md` - Release notes
- `V1.3.1_FIXES_SUMMARY.md` - Technical details
- `ONE_LINE_INSTALL_V1.3.1.md` - Complete installation guide

## 🔄 Previous Versions

- [v1.3.0](https://github.com/cloudbyday90/HoloVitals/releases/tag/v1.3.0) - Intelligent Log Management & HIPAA Compliance
- [v1.2.2](https://github.com/cloudbyday90/HoloVitals/releases/tag/v1.2.2) - Build fixes
- [v1.2.0](https://github.com/cloudbyday90/HoloVitals/releases/tag/v1.2.0) - Initial release

## 🆘 Getting Help

If you encounter issues:
1. Check the installation log: `cat install.log`
2. Review application logs: `pm2 logs holovitals`
3. Open an issue: https://github.com/cloudbyday90/HoloVitals/issues

---

**Current Version:** v1.3.1  
**Release Date:** October 4, 2025  
**Package Size:** ~882KB  
**Installation Time:** 10-15 minutes