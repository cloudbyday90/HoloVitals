# 🚨 HoloVitals v1.4.1 - Breaking Changes Release

## Comprehensive Terminology Update: Patient → Customer

This release introduces a complete terminology update from "patient" to "customer" throughout the entire HoloVitals platform, aligning with consumer-focused healthcare terminology.

---

## ⚠️ Breaking Changes

**This is a breaking change release that requires migration:**
- Database schema changes (13 models renamed)
- API endpoint changes (15+ endpoints updated)
- No backward compatibility with v1.4.0
- Migration guide provided

---

## 🚀 Quick Install

```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.1.sh && chmod +x install-v1.4.1.sh && ./install-v1.4.1.sh
```

The installer will prompt you for:
- Domain name
- Admin email
- Cloudflare Tunnel token

---

## 📊 Changes Summary

- **160 files modified** (4,302 insertions, 2,002 deletions)
- **2,295 total replacements** across the codebase
- **13 database models** renamed
- **15+ API endpoints** updated
- **14 components** updated
- **35+ services** updated

---

## 🔄 Migration Required

Before upgrading:
1. **Backup your database**
2. Review the [Migration Guide](https://github.com/cloudbyday90/HoloVitals/blob/main/MIGRATION_GUIDE_V1.4.1.md)
3. Review [Breaking Changes](https://github.com/cloudbyday90/HoloVitals/blob/main/BREAKING_CHANGES_V1.4.1.md)
4. Update any custom code or integrations

---

## 📚 Documentation

- [Release Notes](https://github.com/cloudbyday90/HoloVitals/blob/main/RELEASE_NOTES_V1.4.1.md)
- [Migration Guide](https://github.com/cloudbyday90/HoloVitals/blob/main/MIGRATION_GUIDE_V1.4.1.md)
- [Breaking Changes](https://github.com/cloudbyday90/HoloVitals/blob/main/BREAKING_CHANGES_V1.4.1.md)
- [Changelog](https://github.com/cloudbyday90/HoloVitals/blob/main/CHANGELOG_V1.4.1.md)
- [Quick Reference](https://github.com/cloudbyday90/HoloVitals/blob/main/V1.4.1_QUICK_REFERENCE.md)

---

## 🎯 What's Changed

### Database Schema
```
PatientAllergy            → CustomerAllergy
PatientMedication         → CustomerMedication
PatientDiagnosis          → CustomerDiagnosis
PatientRepository         → CustomerRepository
... and 9 more models
```

### API Endpoints
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
```

---

## 💡 Support

For questions or issues:
- Open an issue on GitHub
- Review the documentation
- Check the migration guide

**Full Changelog**: https://github.com/cloudbyday90/HoloVitals/compare/v1.4.0...v1.4.1