# Changelog - v1.4.6

## Version 1.4.6 - Private Repository Authentication
**Release Date:** October 4, 2025  
**Type:** Bug Fix Release

---

## 🐛 Bug Fixes

### Private Repository Access

#### Issue
Installation script failed to clone the HoloVitals repository because it is private and requires authentication.

**Error:**
```
fatal: could not read Username for 'https://github.com': terminal prompts disabled
fatal: Authentication failed
```

#### Root Cause
The repository is private and the installation script was attempting to clone without providing authentication credentials.

#### Solution
Added GitHub Personal Access Token (PAT) prompt during configuration phase:

1. **Configuration Phase Enhancement:**
   - Added prompt for GitHub Personal Access Token
   - Provides instructions for creating a PAT
   - Validates that PAT is not empty

2. **Authenticated Git Operations:**
   - Uses PAT for cloning: `git clone https://${GITHUB_PAT}@github.com/...`
   - Uses PAT for pulling: `git pull https://${GITHUB_PAT}@github.com/...`
   - Ensures all git operations are authenticated

#### Impact
- Installation now works with private repositories
- Users can successfully clone and update the repository
- Secure authentication using GitHub PAT

---

## 📝 Changes Summary

### Modified Files
- `scripts/install-v1.4.5.sh` - Added PAT authentication (backport)
- `scripts/install-v1.4.6.sh` - New version with PAT authentication

### New Configuration Prompts
1. Domain name
2. Admin email
3. Cloudflare Tunnel token
4. **GitHub Personal Access Token (NEW)**

### Installation Method
```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.6.sh && chmod +x install-v1.4.6.sh && ./install-v1.4.6.sh
```

---

## 🔐 GitHub PAT Requirements

### Creating a Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name (e.g., "HoloVitals Installation")
4. Select scopes:
   - ✅ **repo** (Full control of private repositories)
5. Click "Generate token"
6. Copy the token immediately (you won't see it again!)

### Required Scopes
- **repo**: Full control of private repositories
  - Needed to clone and pull from private repository

---

## ✅ Verification

- ✅ Script prompts for GitHub PAT
- ✅ Repository clones successfully with authentication
- ✅ Repository updates work with authentication
- ✅ All 7 installation phases complete

---

## 🔄 Upgrade Path

### From v1.4.5 to v1.4.6
Use the new installation script. You'll be prompted for your GitHub PAT.

### Fresh Installation
Use the new installation command. Have your GitHub PAT ready.

---

## 📚 Documentation

- [Release Notes v1.4.6](RELEASE_NOTES_V1.4.6.md)
- [Quick Reference v1.4.6](V1.4.6_QUICK_REFERENCE.md)

---

## 🔗 Related Issues

- Fixed private repository authentication
- Added GitHub PAT support
- Secure git operations

---

**Full Changelog**: https://github.com/cloudbyday90/HoloVitals/compare/v1.4.5...v1.4.6