# HoloVitals v1.4.6 Release Notes

## 🐛 Bug Fix Release - Private Repository Authentication

**Release Date:** October 4, 2025  
**Version:** 1.4.6  
**Type:** Bug Fix Release

---

## 📋 Overview

Version 1.4.6 adds GitHub Personal Access Token (PAT) authentication to the installation script, enabling successful cloning and updating of the private HoloVitals repository.

---

## 🔧 What's Fixed

### Private Repository Access

**Problem:** Installation script failed to clone the repository because it's private and requires authentication.

**Error Message:**
```
fatal: could not read Username for 'https://github.com': terminal prompts disabled
fatal: Authentication failed for 'https://github.com/cloudbyday90/HoloVitals.git/'
```

**Root Cause:** The HoloVitals repository is private and the installation script was attempting to clone without providing authentication credentials.

**Solution:** Added GitHub Personal Access Token prompt during configuration phase and use it for all git operations.

**Impact:** Installation now works successfully with private repositories.

---

## 🚀 Installation

### One-Line Installation

```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.6.sh && chmod +x install-v1.4.6.sh && ./install-v1.4.6.sh
```

### Prerequisites

Before running the installer, create a GitHub Personal Access Token:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "HoloVitals Installation"
4. Select scope: **repo** (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

---

## 📊 Installation Prompts

The installer will now prompt for:

1. **Domain Name**
   - Example: `holovitals.example.com`

2. **Admin Email**
   - Example: `admin@example.com`

3. **Cloudflare Tunnel Token**
   - Obtain from Cloudflare dashboard

4. **GitHub Personal Access Token (NEW)**
   - Create at: https://github.com/settings/tokens
   - Required scope: `repo`

---

## 🔐 GitHub PAT Details

### Why It's Needed

The HoloVitals repository is private. To clone and update it, the installation script needs authentication credentials. GitHub Personal Access Tokens provide secure, token-based authentication.

### Creating Your PAT

**Step 1:** Navigate to GitHub Settings
- Go to: https://github.com/settings/tokens

**Step 2:** Generate New Token
- Click "Generate new token (classic)"
- Name: "HoloVitals Installation"

**Step 3:** Select Scopes
- ✅ **repo** - Full control of private repositories
  - This includes:
    - repo:status
    - repo_deployment
    - public_repo
    - repo:invite
    - security_events

**Step 4:** Generate and Copy
- Click "Generate token"
- **Copy immediately** - you won't see it again!
- Store securely (password manager recommended)

### Security Best Practices

- ✅ Use a descriptive name for the token
- ✅ Only grant necessary scopes (repo)
- ✅ Store token securely
- ✅ Regenerate if compromised
- ✅ Delete unused tokens
- ❌ Never commit tokens to git
- ❌ Never share tokens publicly

---

## 📊 Technical Details

### Authentication Implementation

**Before (v1.4.5):**
```bash
git clone https://github.com/cloudbyday90/HoloVitals.git
git pull origin main
```

**After (v1.4.6):**
```bash
# Prompt for PAT during configuration
read -p "Enter GitHub Personal Access Token (PAT): " GITHUB_PAT

# Use PAT for cloning
git clone https://${GITHUB_PAT}@github.com/cloudbyday90/HoloVitals.git

# Use PAT for pulling
git pull https://${GITHUB_PAT}@github.com/cloudbyday90/HoloVitals.git main
```

### How It Works

1. User provides GitHub PAT during configuration
2. PAT is stored in memory (not written to disk)
3. PAT is used for all git operations
4. PAT is discarded when script completes

---

## ✅ All Installation Phases

1. ✅ Prerequisites Check
2. ✅ Repository Setup (with authentication)
3. ✅ Dependencies Installation (with smart check)
4. ✅ Environment Configuration
5. ✅ Prisma Client Generation (with smart check)
6. ✅ Cloudflare Tunnel Setup (with smart check)
7. ✅ Application Build

---

## 📊 Changes Summary

- **Files Modified:** 2 (installation scripts)
- **New Prompts:** 1 (GitHub PAT)
- **Breaking Changes:** None
- **Migration Required:** No

---

## 🔄 Upgrade Instructions

### If You Have v1.4.5 Installed

**Option 1: Use New Installer**
```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.6.sh && chmod +x install-v1.4.6.sh && ./install-v1.4.6.sh
```

**Option 2: Manual Update**
```bash
cd HoloVitals
git pull https://YOUR_GITHUB_PAT@github.com/cloudbyday90/HoloVitals.git main
cd medical-analysis-platform
npm install
npm run build
```

### Fresh Installation
Use the installation command above. Have your GitHub PAT ready.

---

## 📚 Documentation

- [Changelog v1.4.6](CHANGELOG_V1.4.6.md)
- [Quick Reference v1.4.6](V1.4.6_QUICK_REFERENCE.md)
- [Previous Release Notes v1.4.5](RELEASE_NOTES_V1.4.5.md)

---

## 🎯 What's Included

### From v1.4.6 (New)
- ✅ GitHub PAT authentication
- ✅ Private repository support
- ✅ Secure git operations

### From v1.4.5
- ✅ API route dynamic rendering fix
- ✅ Application builds successfully

### From v1.4.4
- ✅ Smart installation checks
- ✅ Service conflict prevention

### From v1.4.3
- ✅ Next.js 15.x configuration compatibility

### From v1.4.2
- ✅ Interactive installation prompts
- ✅ Error recovery

### From v1.4.1
- Complete terminology update (Patient → Customer)
- RBAC and Staff Portal

---

## 💡 Support

For questions or issues:
- Open an issue on [GitHub](https://github.com/cloudbyday90/HoloVitals/issues)
- Review the [documentation](https://github.com/cloudbyday90/HoloVitals/tree/main/docs)
- Check the [installation guide](INSTALLATION_SCRIPT_COMPLETE_FIX.md)

---

## 🔗 Links

- **GitHub Release:** https://github.com/cloudbyday90/HoloVitals/releases/tag/v1.4.6
- **Repository:** https://github.com/cloudbyday90/HoloVitals
- **Full Changelog:** https://github.com/cloudbyday90/HoloVitals/compare/v1.4.5...v1.4.6
- **Create PAT:** https://github.com/settings/tokens

---

**Thank you for using HoloVitals!** 🚀