# HoloVitals One-Line Installation

## 🚀 Quick Install v1.3.0 (Latest - Recommended)

```bash
wget https://github.com/cloudbyday90/HoloVitals/releases/download/v1.3.0/holovitals-v1.3.0-20251004.tar.gz && tar -xzf holovitals-v1.3.0-20251004.tar.gz && cd holovitals-v1.3.0-20251004 && ./install-cloudflare.sh
```

### ✨ What's New in v1.3.0
- **Intelligent Log Management** - 90%+ storage reduction through deduplication
- **HIPAA Compliance Monitoring** - Separate system for compliance tracking
- **Automatic Error Classification** - Master error codes for better insights
- **Log Rotation** - Automatic rotation with compression
- **Scheduled Cleanup** - Daily cleanup jobs
- **Enhanced Security** - Complete audit trails for HIPAA incidents

## Previous Versions

### v1.2.2 (Tiktoken WASM Fix)
```bash
wget https://github.com/cloudbyday90/HoloVitals/releases/download/v1.2.2/holovitals-v1.2.2-20251004.tar.gz && tar -xzf holovitals-v1.2.2-20251004.tar.gz && cd holovitals-v1.2.2-20251004 && ./install-cloudflare.sh
```

## What You Need

### System Requirements
- Ubuntu 20.04/22.04 LTS server
- 2GB+ RAM
- 10GB+ disk space
- Regular user account with sudo privileges

### For Cloudflare Tunnel Installation
- Domain name
- Cloudflare account (free)
- Cloudflare Tunnel token

### Configuration Information
- Admin email address
- **Compliance Officer email** (NEW in v1.3.0)
- **Privacy Officer email** (NEW in v1.3.0)
- **Security Officer email** (NEW in v1.3.0)

## Installation Time

- **Download:** < 1 minute (871 KB)
- **Installation:** 15-20 minutes
- **Total:** ~20 minutes to live application

## After Installation

### Access Your Application
- **Main Application:** `https://your-domain.com`
- **IT Operations Dashboard:** `https://your-domain.com/admin/errors`
- **HIPAA Compliance Dashboard:** `https://your-domain.com/admin/hipaa-compliance` (NEW)

### Verify Installation
```bash
# Check application status
pm2 status

# View logs
pm2 logs holovitals

# Check Cloudflare Tunnel
sudo systemctl status cloudflared
```

### Next Steps
1. Update API keys in `.env.local`
2. Configure email notifications
3. Review HIPAA compliance team settings
4. Access dashboards and verify functionality

## Support

### Documentation
- `INTELLIGENT_LOG_MANAGEMENT_GUIDE.md` - Log management guide
- `HIPAA_COMPLIANCE_SEPARATION_SUMMARY.md` - HIPAA compliance guide
- `CHANGELOG_V1.3.0.md` - Complete changelog

### Issues
- GitHub Issues: https://github.com/cloudbyday90/HoloVitals/issues
- Include version number in reports

## Release Information

- **Version:** v1.3.0 (Latest)
- **Release Date:** October 4, 2025
- **Package Size:** 871 KB
- **Release URL:** https://github.com/cloudbyday90/HoloVitals/releases/tag/v1.3.0

### Major Features
- ✅ Intelligent Log Management (90%+ storage reduction)
- ✅ HIPAA Compliance Monitoring (separate system)
- ✅ Master Error Code Classification
- ✅ Automatic Log Rotation
- ✅ Scheduled Cleanup Jobs
- ✅ Complete Audit Trails