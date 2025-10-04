# Changelog - v1.4.8

## Version 1.4.8 - Development Mode Support
**Release Date:** October 4, 2025  
**Type:** Feature Release

---

## ✨ New Features

### Development Mode Installation

#### Feature
Added development mode support to the installation script, allowing developers to install HoloVitals without Stripe integration or Cloudflare Tunnel for local testing and development.

#### Implementation

**Installation Type Selection:**
- Prompts user to choose between Development or Production installation
- Development mode skips Stripe and Cloudflare Tunnel configuration
- Production mode includes full Stripe and Cloudflare Tunnel setup

**Development Mode Configuration:**
- Uses `http://localhost:3000` instead of custom domain
- Skips Cloudflare Tunnel installation
- Creates `.env.local` without Stripe keys (commented out)
- Sets `NODE_ENV="development"`
- Provides instructions for `npm run dev` instead of `npm run start`

**Production Mode Configuration:**
- Uses custom domain with HTTPS
- Installs and configures Cloudflare Tunnel
- Creates `.env.local` with Stripe key placeholders
- Sets `NODE_ENV="production"`
- Provides instructions for `npm run start`

#### Benefits

**For Developers:**
- ✅ Quick local setup without external services
- ✅ No Stripe account needed for testing
- ✅ No Cloudflare Tunnel required
- ✅ Payment UI available for visual testing
- ✅ Faster installation process

**For Production:**
- ✅ Full Stripe integration
- ✅ Cloudflare Tunnel for public access
- ✅ Production-ready configuration
- ✅ All features enabled

---

## 📝 Changes Summary

### Modified Files
- `scripts/install-v1.4.7.sh` - Added development mode (backport)
- `scripts/install-v1.4.8.sh` - New version with development mode

### New Configuration Options
- Installation type selection (Development/Production)
- Conditional Cloudflare Tunnel setup
- Environment-specific .env.local generation
- Mode-specific next steps instructions

### Installation Method
```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.8.sh && chmod +x install-v1.4.8.sh && ./install-v1.4.8.sh
```

---

## 🎯 Use Cases

### Development Mode
**When to use:**
- Local development and testing
- UI/UX development
- Feature development
- Visual representation of payment flows
- No public access needed

**What's included:**
- Full application functionality
- Payment UI (visual only)
- All features except live Stripe processing
- Local access at http://localhost:3000

### Production Mode
**When to use:**
- Public deployment
- Live payment processing
- Production environment
- Customer-facing application

**What's included:**
- Full Stripe integration
- Cloudflare Tunnel for public access
- Production configuration
- All features enabled

---

## ✅ Verification

- ✅ Development mode installs successfully
- ✅ Production mode installs successfully
- ✅ Cloudflare Tunnel skipped in development
- ✅ Stripe configuration optional in development
- ✅ All 7 installation phases complete

---

**Full Changelog**: https://github.com/cloudbyday90/HoloVitals/compare/v1.4.7...v1.4.8