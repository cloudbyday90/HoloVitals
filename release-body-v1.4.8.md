# ✨ HoloVitals v1.4.8 - Development Mode Support

## Feature Release - Simplified Development Setup

This release adds development mode support, allowing developers to install and test HoloVitals locally without Stripe integration or Cloudflare Tunnel.

---

## ✨ New Feature

### Development Mode Installation

**What's New:**
- Choose between Development or Production installation
- Development mode skips Stripe and Cloudflare Tunnel
- Optimized for local testing and development
- Payment UI available for visual representation

---

## 🚀 One-Line Installation

```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.8.sh && chmod +x install-v1.4.8.sh && ./install-v1.4.8.sh
```

**Prerequisites:** GitHub Personal Access Token (https://github.com/settings/tokens)

---

## 🎯 Installation Types

### Development Mode
**Perfect for:**
- Local development and testing
- UI/UX development
- Feature development
- Visual representation of payment flows

**Configuration:**
- URL: `http://localhost:3000`
- Cloudflare Tunnel: Skipped
- Stripe: Not required (UI only)
- Start command: `npm run dev`

### Production Mode
**Perfect for:**
- Public deployment
- Live payment processing
- Customer-facing application

**Configuration:**
- URL: `https://your-domain.com`
- Cloudflare Tunnel: Configured
- Stripe: Required (live processing)
- Start command: `npm run start`

---

## 📊 Installation Flow

**Step 1:** Choose installation type
```
Is this a development installation? (y/n): y
✓ Development mode selected
```

**Step 2:** Configuration
- Development: No Cloudflare Tunnel needed
- Production: Cloudflare Tunnel token required

**Step 3:** Environment Setup
- Development: `NODE_ENV=development`, localhost URLs
- Production: `NODE_ENV=production`, custom domain URLs

---

## 💡 Benefits

### For Developers
- ✅ Quick local setup
- ✅ No external services needed
- ✅ Payment UI for testing
- ✅ Faster installation

### For Production
- ✅ Full Stripe integration
- ✅ Public access via Cloudflare
- ✅ Production-ready config
- ✅ All features enabled

---

## 📊 Changes Summary

- **Files Modified:** 2 (installation scripts)
- **New Features:** Development mode support
- **Breaking Changes:** None
- **Migration Required:** No

---

## 💡 What's Included

### From v1.4.8 (New)
- ✅ Development mode support
- ✅ Conditional Stripe/Cloudflare setup
- ✅ Environment-specific configuration

### From v1.4.7
- ✅ Payment API routes fix

### From v1.4.6
- ✅ GitHub PAT authentication

### From v1.4.4
- ✅ Smart installation checks

---

## 💡 Support

For questions or issues:
- Open an issue on GitHub
- Review the documentation

**Full Changelog**: https://github.com/cloudbyday90/HoloVitals/compare/v1.4.7...v1.4.8