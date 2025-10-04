# 🚨 Breaking Changes - Comprehensive Terminology Update

Version 1.4.1 introduces a comprehensive terminology update from "patient" to "customer" throughout the entire HoloVitals platform.

## 🚀 One-Line Installation

```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.1.sh && chmod +x install-v1.4.1.sh && ./install-v1.4.1.sh
```

## 📊 What's Changed

- **160 files modified** (4,302 insertions, 2,002 deletions)
- **2,295 total replacements** across the codebase
- **13 database models** renamed
- **15+ API endpoints** updated
- **14 components** updated
- **35+ services** updated

## ⚠️ Breaking Changes

### Database Schema
All Prisma models renamed from `Patient*` to `Customer*`

### API Endpoints
```
/api/patients/*        → /api/customers/*
/api/patient-rights/*  → /api/customer-rights/*
/api/ehr/patients/*    → /api/ehr/customers/*
```

### Services & Components
```
PatientSearchService   → CustomerSearchService
PatientRightsService   → CustomerRightsService
PatientCard            → CustomerCard
PatientDetailView      → CustomerDetailView
```

## 📚 Documentation

- **[Release Notes](https://github.com/cloudbyday90/HoloVitals/blob/main/RELEASE_NOTES_V1.4.1.md)** - Complete release information
- **[Migration Guide](https://github.com/cloudbyday90/HoloVitals/blob/main/MIGRATION_GUIDE_V1.4.1.md)** - Step-by-step migration instructions
- **[Breaking Changes](https://github.com/cloudbyday90/HoloVitals/blob/main/BREAKING_CHANGES_V1.4.1.md)** - Detailed breaking changes
- **[Changelog](https://github.com/cloudbyday90/HoloVitals/blob/main/CHANGELOG_V1.4.1.md)** - Full changelog
- **[Quick Reference](https://github.com/cloudbyday90/HoloVitals/blob/main/V1.4.1_QUICK_REFERENCE.md)** - Quick reference card

## 🔄 Migration Required

**This is a breaking change that requires migration:**

1. Backup your database
2. Update your repository
3. Run `npx prisma generate`
4. Run `npx prisma migrate deploy`
5. Update custom code

See the [Migration Guide](https://github.com/cloudbyday90/HoloVitals/blob/main/MIGRATION_GUIDE_V1.4.1.md) for detailed instructions.

## 📦 What's Included

- ✅ Database schema updates
- ✅ API endpoint updates
- ✅ Service layer updates
- ✅ Component updates
- ✅ Type definition updates
- ✅ Comprehensive documentation
- ✅ Automated update scripts
- ✅ One-line installation script

## 🐛 Known Issues

None at this time.

## 📞 Support

- **Issues:** https://github.com/cloudbyday90/HoloVitals/issues
- **Discussions:** https://github.com/cloudbyday90/HoloVitals/discussions

## 🙏 Acknowledgments

This update aligns HoloVitals with consumer-focused terminology, improving clarity and user experience throughout the platform.

---

**Full Changelog:** https://github.com/cloudbyday90/HoloVitals/compare/v1.4.0...v1.4.1