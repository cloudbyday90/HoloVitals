# HoloVitals v1.3.1 Release Notes

## Release Date
October 4, 2025

## Overview
This release fixes critical installation issues and improves the HIPAA compliance configuration workflow.

## 🔧 Bug Fixes

### Database Configuration
- **Fixed PostgreSQL Authentication Error (P1000)**
  - Added proper pg_hba.conf configuration for local connections
  - Implemented md5 authentication for database user
  - Added database connection test before running migrations
  - Improved error handling and validation

### Installation Process
- **Removed HIPAA Team Setup from Installation Script**
  - HIPAA compliance team configuration moved to Admin Dashboard
  - Installation now uses default placeholder emails
  - Simplified installation process - no more interactive prompts for HIPAA team
  - Reduced installation time and complexity

## ✨ New Features

### Admin Dashboard - HIPAA Team Configuration
- **New Admin Page: `/admin/hipaa-team`**
  - User-friendly interface for configuring HIPAA compliance team
  - Configure Compliance Officer, Privacy Officer, and Security Officer
  - Real-time validation of email addresses
  - Enable/disable notifications per team member
  - Separate from general error logging system

### API Enhancements
- **Updated HIPAA Team API**
  - `GET /api/admin/hipaa/team` - Fetch current team configuration
  - `PUT /api/admin/hipaa/team` - Update team configuration
  - Improved validation and error handling
  - Support for bulk updates

## 🔄 Changes from v1.3.0

### Installation Script Changes
1. **Database Setup**
   - Added PostgreSQL authentication configuration
   - Implemented connection testing before migrations
   - Better error messages for database issues

2. **HIPAA Configuration**
   - Removed interactive prompts during installation
   - Default placeholder emails set in .env.local
   - Configuration moved to post-installation via Admin Dashboard

3. **Environment Variables**
   - Default HIPAA team emails:
     - `COMPLIANCE_OFFICER_EMAIL=compliance@example.com`
     - `PRIVACY_OFFICER_EMAIL=privacy@example.com`
     - `SECURITY_OFFICER_EMAIL=security@example.com`

### Database Changes
- HIPAA compliance team table now initialized with default values
- No breaking changes to existing data

## 📋 Installation Instructions

### New Installations
```bash
wget -O - https://github.com/cloudbyday90/HoloVitals/releases/download/v1.3.1/holovitals-v1.3.1.tar.gz | tar xz
cd holovitals-v1.3.1-*
chmod +x scripts/install-v1.3.1.sh
./scripts/install-v1.3.1.sh 2>&1 | tee install.log
```

### Upgrading from v1.3.0
If you're running v1.3.0, you can upgrade by:

1. **Stop the application:**
   ```bash
   pm2 stop holovitals
   ```

2. **Backup your database:**
   ```bash
   pg_dump -U holovitals holovitals > backup_v1.3.0.sql
   ```

3. **Download and extract v1.3.1:**
   ```bash
   wget https://github.com/cloudbyday90/HoloVitals/releases/download/v1.3.1/holovitals-v1.3.1.tar.gz
   tar xzf holovitals-v1.3.1.tar.gz
   cd holovitals-v1.3.1-*
   ```

4. **Copy your .env.local file:**
   ```bash
   cp /path/to/old/installation/medical-analysis-platform/.env.local medical-analysis-platform/
   ```

5. **Install dependencies and rebuild:**
   ```bash
   cd medical-analysis-platform
   npm install
   npm run build
   ```

6. **Restart the application:**
   ```bash
   pm2 restart holovitals
   ```

## 🎯 Post-Installation Steps

### Required: Configure HIPAA Compliance Team
After installation, you **must** configure your HIPAA compliance team:

1. Navigate to: `https://your-domain.com/admin/hipaa-team`
2. Update the default email addresses with your actual team contacts
3. Fill in names and phone numbers (optional but recommended)
4. Enable/disable notifications as needed
5. Click "Save Configuration"

### Recommended: Verify Database Connection
```bash
cd medical-analysis-platform
npx prisma db pull
```

## 🐛 Known Issues
None at this time.

## 📚 Documentation Updates
- Updated installation guide with new process
- Added HIPAA team configuration guide
- Updated troubleshooting section for database issues

## 🔐 Security Notes
- Database passwords are still auto-generated and secure
- HIPAA team emails are now configurable post-installation
- No sensitive data required during installation

## 💡 Migration Notes

### From v1.3.0 to v1.3.1
- No database schema changes
- No breaking API changes
- HIPAA team configuration can be updated via Admin Dashboard
- Existing HIPAA team data is preserved

## 🙏 Acknowledgments
Thank you to all users who reported the installation issues. Your feedback helps make HoloVitals better!

## 📞 Support
For issues or questions:
- GitHub Issues: https://github.com/cloudbyday90/HoloVitals/issues
- Documentation: See included guides in the release package

---

**Full Changelog**: https://github.com/cloudbyday90/HoloVitals/compare/v1.3.0...v1.3.1