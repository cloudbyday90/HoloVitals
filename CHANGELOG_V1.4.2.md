# Changelog - v1.4.2

## Version 1.4.2 - Installation Script Fixes
**Release Date:** October 4, 2025  
**Type:** Bug Fix Release

---

## 🐛 Bug Fixes

### Installation Script Improvements

#### 1. Fixed Interactive Input Handling
- **Issue**: Installation script couldn't read user input when piped to bash
- **Fix**: Changed installation method from `curl | bash` to `wget && ./script.sh`
- **Impact**: Users can now properly enter domain, email, and Cloudflare token

#### 2. Fixed Non-Git Directory Handling
- **Issue**: Script failed when HoloVitals directory existed but wasn't a git repository
- **Error**: `fatal: not a git repository (or any of the parent directories): .git`
- **Fix**: Added validation to check if directory is a git repository before attempting git operations
- **Impact**: Script now handles existing directories gracefully and recovers from failed installations

#### 3. Fixed Directory Structure Navigation
- **Issue**: Script was checking out v1.4.1 tag which only contained documentation, not application code
- **Error**: `npm error enoent Could not read package.json`
- **Fix**: Changed to use main branch and navigate to `medical-analysis-platform` subdirectory
- **Impact**: Script now correctly finds and installs the application

---

## 📝 Changes Summary

### Modified Files
- `scripts/install-v1.4.2.sh` - Complete installation script rewrite with all fixes

### Installation Method Change
**Before (v1.4.1):**
```bash
curl -fsSL https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.1.sh | bash
```

**After (v1.4.2):**
```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.2.sh && chmod +x install-v1.4.2.sh && ./install-v1.4.2.sh
```

---

## ✅ Verification

All installation phases tested and verified:
- ✅ Prerequisites check
- ✅ Repository cloning and setup
- ✅ Dependency installation (1016 packages)
- ✅ Environment configuration
- ✅ Interactive prompts working correctly

---

## 🔄 Upgrade Path

### From v1.4.1 to v1.4.2
No code changes in the application itself - only installation script improvements. If you've already successfully installed v1.4.1, no upgrade is needed.

### Fresh Installation
Use the new installation command:
```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.2.sh && chmod +x install-v1.4.2.sh && ./install-v1.4.2.sh
```

---

## 📚 Documentation

- [Installation Script Complete Fix](INSTALLATION_SCRIPT_COMPLETE_FIX.md)
- [Release Notes v1.4.2](RELEASE_NOTES_V1.4.2.md)
- [Quick Reference v1.4.2](V1.4.2_QUICK_REFERENCE.md)

---

## 🔗 Related Issues

- Fixed installation script interactive input handling
- Fixed non-git directory error during installation
- Fixed package.json not found error
- Improved installation reliability and error recovery

---

**Full Changelog**: https://github.com/cloudbyday90/HoloVitals/compare/v1.4.1...v1.4.2