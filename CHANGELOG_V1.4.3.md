# Changelog - v1.4.3

## Version 1.4.3 - Next.js Configuration Fix
**Release Date:** October 4, 2025  
**Type:** Bug Fix Release

---

## 🐛 Bug Fixes

### Next.js Build Configuration Error

#### Issue
Build process failed with the following error:
```
Invalid next.config.js options detected:
  Unrecognized key(s) in object: 'serverComponentsExternalPackages' at "experimental"
✓ 'experimental.serverComponentsExternalPackages' has been moved to 'serverExternalPackages'
```

#### Root Cause
Next.js 15.x moved `serverComponentsExternalPackages` from the `experimental` section to a top-level `serverExternalPackages` configuration option.

#### Solution
Updated `next.config.js` to use the new configuration format:

**Before:**
```javascript
experimental: {
  serverComponentsExternalPackages: ['bull', 'bullmq', 'ioredis', 'tiktoken'],
}
```

**After:**
```javascript
serverExternalPackages: ['bull', 'bullmq', 'ioredis', 'tiktoken'],
```

#### Impact
- Application now builds successfully
- No more configuration warnings
- Compatible with Next.js 15.x

---

## 📝 Changes Summary

### Modified Files
- `medical-analysis-platform/next.config.js` - Updated configuration format

### Installation Method
Same as v1.4.2:
```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.3.sh && chmod +x install-v1.4.3.sh && ./install-v1.4.3.sh
```

---

## ✅ Verification

- ✅ Next.js configuration updated
- ✅ Build process completes successfully
- ✅ No configuration warnings
- ✅ All external packages properly configured

---

## 🔄 Upgrade Path

### From v1.4.2 to v1.4.3
If you successfully installed v1.4.2 but encountered build errors, update your `next.config.js` file with the new configuration format.

### Fresh Installation
Use the new installation command which includes the fixed configuration.

---

## 📚 Documentation

- [Release Notes v1.4.3](RELEASE_NOTES_V1.4.3.md)
- [Quick Reference v1.4.3](V1.4.3_QUICK_REFERENCE.md)

---

## 🔗 Related Issues

- Fixed Next.js 15.x configuration compatibility
- Fixed build error during Phase 7 (Build Application)
- Updated to use current Next.js configuration standards

---

**Full Changelog**: https://github.com/cloudbyday90/HoloVitals/compare/v1.4.2...v1.4.3