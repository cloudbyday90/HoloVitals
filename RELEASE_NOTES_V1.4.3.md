# HoloVitals v1.4.3 Release Notes

## 🐛 Bug Fix Release - Next.js Configuration Fix

**Release Date:** October 4, 2025  
**Version:** 1.4.3  
**Type:** Bug Fix Release

---

## 📋 Overview

Version 1.4.3 is a bug fix release that addresses a Next.js configuration error that prevented the application from building successfully. This release updates the configuration to be compatible with Next.js 15.x.

---

## 🔧 What's Fixed

### Next.js Build Configuration Error

**Problem:** Build process failed during Phase 7 with configuration error.

**Error Message:**
```
Invalid next.config.js options detected:
  Unrecognized key(s) in object: 'serverComponentsExternalPackages' at "experimental"
✓ 'experimental.serverComponentsExternalPackages' has been moved to 'serverExternalPackages'
```

**Root Cause:** Next.js 15.x changed the configuration format, moving `serverComponentsExternalPackages` from the `experimental` section to a top-level `serverExternalPackages` option.

**Solution:** Updated `next.config.js` to use the new configuration format.

**Impact:** Application now builds successfully without configuration warnings.

---

## 🚀 Installation

### One-Line Installation

```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.3.sh && chmod +x install-v1.4.3.sh && ./install-v1.4.3.sh
```

The installer will prompt you for:
- Domain name (e.g., holovitals.example.com)
- Admin email address
- Cloudflare Tunnel token

---

## 📊 Technical Details

### Configuration Change

**Before (v1.4.2):**
```javascript
experimental: {
  serverComponentsExternalPackages: ['bull', 'bullmq', 'ioredis', 'tiktoken'],
}
```

**After (v1.4.3):**
```javascript
serverExternalPackages: ['bull', 'bullmq', 'ioredis', 'tiktoken'],
```

### Affected Packages
- `bull` - Job queue management
- `bullmq` - Advanced job queue
- `ioredis` - Redis client
- `tiktoken` - Token counting for AI

These packages are now properly configured as server-only dependencies.

---

## ✅ Verified Installation Phases

All installation phases now complete successfully:

1. **Phase 1: Prerequisites Check** ✅
2. **Phase 2: Repository Setup** ✅
3. **Phase 3: Dependencies Installation** ✅
4. **Phase 4: Environment Configuration** ✅
5. **Phase 5: Prisma Client Generation** ✅
6. **Phase 6: Cloudflare Tunnel Setup** ✅
7. **Phase 7: Application Build** ✅ (Fixed!)

---

## 📊 Changes Summary

- **Files Modified:** 1 (next.config.js)
- **Application Code Changes:** Configuration only
- **Breaking Changes:** None
- **Migration Required:** No

---

## 🔄 Upgrade Instructions

### If You've Already Installed v1.4.2
Update your `next.config.js` file manually:

1. Navigate to the application directory:
   ```bash
   cd HoloVitals/medical-analysis-platform
   ```

2. Edit `next.config.js` and replace:
   ```javascript
   experimental: {
     serverComponentsExternalPackages: ['bull', 'bullmq', 'ioredis', 'tiktoken'],
   }
   ```
   
   With:
   ```javascript
   serverExternalPackages: ['bull', 'bullmq', 'ioredis', 'tiktoken'],
   ```

3. Rebuild the application:
   ```bash
   npm run build
   ```

### Fresh Installation
Use the installation command above. The script includes the fixed configuration.

---

## 📚 Documentation

- [Changelog v1.4.3](CHANGELOG_V1.4.3.md)
- [Quick Reference v1.4.3](V1.4.3_QUICK_REFERENCE.md)
- [Previous Release Notes v1.4.2](RELEASE_NOTES_V1.4.2.md)

---

## 🎯 What's Included

### From v1.4.2 (Installation Script Fixes)
- ✅ Interactive configuration prompts
- ✅ Input validation
- ✅ Secure password generation
- ✅ Complete environment setup
- ✅ Error recovery and edge case handling

### From v1.4.1 (Terminology Update)
- Complete terminology update (Patient → Customer)
- Role-Based Access Control (RBAC)
- Staff Portal
- Customer Portal
- EHR Integrations
- AI-powered insights
- HIPAA compliance features

### New in v1.4.3
- ✅ Next.js 15.x configuration compatibility
- ✅ Successful application build
- ✅ No configuration warnings

---

## 💡 Support

For questions or issues:
- Open an issue on [GitHub](https://github.com/cloudbyday90/HoloVitals/issues)
- Review the [documentation](https://github.com/cloudbyday90/HoloVitals/tree/main/docs)
- Check the [installation guide](INSTALLATION_SCRIPT_COMPLETE_FIX.md)

---

## 🔗 Links

- **GitHub Release:** https://github.com/cloudbyday90/HoloVitals/releases/tag/v1.4.3
- **Repository:** https://github.com/cloudbyday90/HoloVitals
- **Full Changelog:** https://github.com/cloudbyday90/HoloVitals/compare/v1.4.2...v1.4.3

---

**Thank you for using HoloVitals!** 🚀