# HoloVitals v1.4.1 Release Notes

## 🚨 Breaking Changes Release

**Release Date:** October 4, 2025  
**Version:** 1.4.1  
**Type:** Major Update - Breaking Changes  
**Migration Required:** YES

---

## 📋 Overview

Version 1.4.1 introduces a comprehensive terminology update from "patient" to "customer" throughout the entire HoloVitals platform. This change aligns the platform with consumer-focused terminology and improves clarity across all components.

**⚠️ This is a breaking change that requires migration. Please review the migration guide before upgrading.**

---

## 🎯 What's Changed

### Comprehensive Terminology Update
- **160 files modified** with 4,302 insertions and 2,002 deletions
- **2,295 total replacements** across the entire codebase
- **13 database models** renamed
- **15+ API endpoints** updated
- **14 components** updated
- **35+ services** updated

### Database Schema
All Prisma models have been renamed:
```
PatientAllergy            → CustomerAllergy
PatientMedication         → CustomerMedication
PatientDiagnosis          → CustomerDiagnosis
PatientRepository         → CustomerRepository
... and 9 more models
```

### API Endpoints
All API routes have been updated:
```
/api/patients             → /api/customers
/api/patient-rights       → /api/customer-rights
/api/ehr/patients         → /api/ehr/customers
```

### Services & Components
```
PatientSearchService      → CustomerSearchService
PatientRightsService      → CustomerRightsService
PatientCard               → CustomerCard
PatientDetailView         → CustomerDetailView
... and more
```

---

## 🚀 Quick Start

### One-Line Installation

```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.1.sh && chmod +x install-v1.4.1.sh && ./install-v1.4.1.sh
```

This script will:
- ✅ Check system requirements
- ✅ Clone the repository
- ✅ Install dependencies
- ✅ Set up the database
- ✅ Run migrations
- ✅ Generate Prisma client
- ✅ Start the development server

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/cloudbyday90/HoloVitals.git
cd HoloVitals

# Checkout v1.4.1
git checkout v1.4.1

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma generate
npx prisma migrate deploy

# Start development server
npm run dev
```

---

## ⚠️ Breaking Changes

### 1. Database Migration Required
- All table names have been updated
- Prisma client must be regenerated
- Database migration must be applied

### 2. API Endpoints Changed
- All `/api/patients/*` endpoints are now `/api/customers/*`
- No backward compatibility provided
- API consumers must update their code

### 3. Code Updates Required
- Import statements must be updated
- Type definitions must be updated
- Component usage must be updated

---

## 📚 Migration Guide

### For Developers

1. **Backup your database:**
   ```bash
   pg_dump -U username -d holovitals > backup_v1.4.0.sql
   ```

2. **Update your repository:**
   ```bash
   git checkout main
   git pull origin main
   npm install
   ```

3. **Regenerate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Run database migration:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Update your custom code:**
   - Replace `Patient*` with `Customer*` in imports
   - Update API endpoint URLs
   - Update component names

### For API Consumers

Update all API calls:
```typescript
// Before
fetch('/api/patients/123')
fetch('/api/patient-rights/access')

// After
fetch('/api/customers/123')
fetch('/api/customer-rights/access')
```

Update request/response fields:
```typescript
// Before
{ patientId, patientData, patientName }

// After
{ customerId, customerData, customerName }
```

---

## 📖 Documentation

### New Documentation
- **[Migration Guide](MIGRATION_GUIDE_V1.4.1.md)** - Step-by-step migration instructions
- **[Breaking Changes](BREAKING_CHANGES_V1.4.1.md)** - Detailed list of breaking changes
- **[Changelog](CHANGELOG_V1.4.1.md)** - Complete changelog

### Updated Documentation
- API endpoints documentation
- Type definitions
- Component documentation

---

## 🧪 Testing

### What We've Tested
- ✅ Database schema updates
- ✅ Prisma client generation
- ✅ TypeScript compilation
- ✅ API endpoint functionality
- ✅ Component rendering

### What You Should Test
- [ ] Database migration in your environment
- [ ] API integrations
- [ ] Custom code compatibility
- [ ] EHR integrations
- [ ] User workflows

---

## 🐛 Known Issues

None at this time. Please report any issues on [GitHub Issues](https://github.com/cloudbyday90/HoloVitals/issues).

---

## 🔄 Rollback Instructions

If you need to rollback to v1.4.0:

1. **Restore database:**
   ```bash
   psql -U username -d holovitals < backup_v1.4.0.sql
   ```

2. **Revert code:**
   ```bash
   git checkout v1.4.0
   npm install
   npx prisma generate
   ```

---

## 📦 What's Included

### Core Updates
- Database schema updates
- API endpoint updates
- Service layer updates
- Component updates
- Type definition updates

### Documentation
- Migration guide
- Breaking changes document
- Comprehensive changelog
- Installation scripts

### Tools
- Automated update scripts
- Migration utilities
- Testing helpers

---

## 🔗 Resources

- **GitHub Repository:** https://github.com/cloudbyday90/HoloVitals
- **Release Page:** https://github.com/cloudbyday90/HoloVitals/releases/tag/v1.4.1
- **Pull Request:** https://github.com/cloudbyday90/HoloVitals/pull/13
- **Issues:** https://github.com/cloudbyday90/HoloVitals/issues

---

## 👥 Contributors

- **SuperNinja AI Agent** - Comprehensive terminology update implementation
- **cloudbyday90** - Project oversight and direction

---

## 📞 Support

Need help with migration?

- **Documentation:** See [MIGRATION_GUIDE_V1.4.1.md](MIGRATION_GUIDE_V1.4.1.md)
- **Issues:** https://github.com/cloudbyday90/HoloVitals/issues
- **Discussions:** https://github.com/cloudbyday90/HoloVitals/discussions

---

## 🎉 Thank You

Thank you for using HoloVitals! This update represents a significant improvement in terminology clarity and user experience. We appreciate your patience during the migration process.

---

## 🔮 What's Next

### v1.4.2 (Planned)
- Bug fixes and improvements
- Performance optimizations
- Documentation enhancements

### v2.0.0 (Future)
- Major feature additions
- Architecture improvements
- Enhanced integrations

---

**Full Changelog:** [CHANGELOG_V1.4.1.md](CHANGELOG_V1.4.1.md)  
**Migration Guide:** [MIGRATION_GUIDE_V1.4.1.md](MIGRATION_GUIDE_V1.4.1.md)  
**Breaking Changes:** [BREAKING_CHANGES_V1.4.1.md](BREAKING_CHANGES_V1.4.1.md)