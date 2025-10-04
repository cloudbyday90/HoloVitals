# Changelog - v1.4.5

## Version 1.4.5 - API Route Build Fix
**Release Date:** October 4, 2025  
**Type:** Bug Fix Release

---

## 🐛 Bug Fixes

### Build Error - Documents Upload API Route

#### Issue
Build process failed when trying to pre-render the documents upload API route:

**Error:**
```
Error: ENOENT: no such file or directory, open './test/data/05-versions-space.pdf'
Build error occurred
[Error: Failed to collect page data for /api/documents/upload]
```

#### Root Cause
Next.js was attempting to statically pre-render the `/api/documents/upload` route during build time. This route handles file uploads and imports the OCR service, which caused Next.js to try accessing test data files that don't exist in the build environment.

#### Solution
Added `export const dynamic = 'force-dynamic'` to the upload route to prevent static rendering:

```typescript
// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
```

This tells Next.js to always render this route dynamically at request time, not during build.

#### Impact
- Application now builds successfully
- Upload API route works correctly at runtime
- No more build-time file access errors

---

## 📝 Changes Summary

### Modified Files
- `medical-analysis-platform/app/api/documents/upload/route.ts` - Added dynamic rendering configuration

### Technical Details
API routes that:
- Handle file uploads
- Access external services
- Require runtime data
- Cannot be pre-rendered

Should use `export const dynamic = 'force-dynamic'` to prevent build-time rendering.

### Installation Method
```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.5.sh && chmod +x install-v1.4.5.sh && ./install-v1.4.5.sh
```

---

## ✅ Verification

- ✅ Application builds successfully
- ✅ No build-time file access errors
- ✅ Upload API route works at runtime
- ✅ All 7 installation phases complete

---

## 🔄 Upgrade Path

### From v1.4.4 to v1.4.5
Simply use the new installation script or pull the latest code and rebuild.

### Fresh Installation
Use the new installation command. The script includes all previous fixes.

---

## 📚 Documentation

- [Release Notes v1.4.5](RELEASE_NOTES_V1.4.5.md)
- [Quick Reference v1.4.5](V1.4.5_QUICK_REFERENCE.md)

---

## 🔗 Related Issues

- Fixed build error with documents upload API
- Fixed static rendering of dynamic API routes
- Application now builds successfully

---

**Full Changelog**: https://github.com/cloudbyday90/HoloVitals/compare/v1.4.4...v1.4.5