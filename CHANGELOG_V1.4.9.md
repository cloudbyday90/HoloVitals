# HoloVitals v1.4.9 Changelog

## Release Date
2025-01-04

## Release Type
Bug Fix Release

## Overview
This release fixes a critical issue in v1.4.8 where Cloudflare Tunnel was incorrectly skipped in development mode. Both development and production installations now properly configure Cloudflare Tunnel and nginx, with only Stripe being optional in development mode.

---

## 🐛 Bug Fixes

### Installation Script
- **Fixed Cloudflare Tunnel in Development Mode**
  - Cloudflare Tunnel is now required and configured for both development and production installations
  - Only Stripe configuration is optional in development mode (for UI testing only)
  - Both modes use Cloudflare Tunnel and nginx as intended

### Configuration Changes
- **Development Mode**:
  - ✅ Cloudflare Tunnel: Required and configured
  - ✅ nginx: Required and configured
  - ⚠️ Stripe: Optional (commented out in .env.local, for UI testing only)
  - Uses `npm run dev` for development server
  
- **Production Mode**:
  - ✅ Cloudflare Tunnel: Required and configured
  - ✅ nginx: Required and configured
  - ✅ Stripe: Required (live payment processing)
  - Uses `npm run start` for production server

---

## 📝 What Changed

### Installation Script (install-v1.4.9.sh)
1. **Cloudflare Tunnel Prompt**
   - Now prompts for Cloudflare Tunnel token in both development and production modes
   - Clear messaging that Cloudflare Tunnel is required for both modes

2. **Stripe Configuration**
   - Development: Stripe keys are commented out in .env.local with instructions
   - Production: Stripe keys are required and active in .env.local

3. **Configuration Summary**
   - Updated to clearly show Cloudflare Tunnel is configured for both modes
   - Shows Stripe status based on installation type

### Environment Configuration
- **Development .env.local**:
  ```bash
  # Stripe Configuration (Optional - For UI Testing Only)
  # Uncomment and add your keys if you want to test Stripe UI:
  # STRIPE_SECRET_KEY=sk_test_your_test_key_here
  # NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
  # STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
  ```

- **Production .env.local**:
  ```bash
  # Stripe Configuration (Required for Production)
  STRIPE_SECRET_KEY=your_stripe_secret_key_here
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
  STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
  ```

---

## 🔄 Migration from v1.4.8

If you installed v1.4.8 in development mode without Cloudflare Tunnel:

1. **Run the v1.4.9 installer**:
   ```bash
   wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.9.sh && chmod +x install-v1.4.9.sh && ./install-v1.4.9.sh
   ```

2. **Provide Cloudflare Tunnel token** when prompted

3. **The installer will**:
   - Configure Cloudflare Tunnel service
   - Update your .env.local with correct settings
   - Keep your existing database and dependencies

---

## 📋 Installation Requirements

### Both Development and Production
- Git, Node.js, npm
- GitHub Personal Access Token (for private repository)
- **Cloudflare Tunnel token** (required for both modes)
- PostgreSQL database
- OpenAI API key
- SMTP credentials

### Production Only
- **Stripe API keys** (for live payment processing)

### Development Only
- Stripe API keys are optional (for UI testing only)

---

## 🎯 Key Points

1. **Cloudflare Tunnel is NOT optional** - it's required for both development and production
2. **nginx is required** for both modes
3. **Only Stripe is optional** in development mode (for UI testing purposes)
4. Development mode uses `npm run dev`, production uses `npm run start`

---

## 📚 Documentation

- Installation Guide: See RELEASE_NOTES_V1.4.9.md
- Quick Reference: See V1.4.9_QUICK_REFERENCE.md
- GitHub Release: https://github.com/cloudbyday90/HoloVitals/releases/tag/v1.4.9

---

## 🔗 Links

- **Repository**: https://github.com/cloudbyday90/HoloVitals
- **Issues**: https://github.com/cloudbyday90/HoloVitals/issues
- **Previous Release**: v1.4.8

---

## ✅ Verification

To verify your installation:

1. Check Cloudflare Tunnel service:
   ```bash
   systemctl status cloudflared
   ```

2. Verify .env.local configuration:
   ```bash
   cat medical-analysis-platform/.env.local
   ```

3. Test application access:
   ```bash
   curl https://your-domain.com
   ```

---

**Note**: This is a critical bug fix that corrects the v1.4.8 installation behavior. All users who installed v1.4.8 in development mode should upgrade to v1.4.9 to ensure proper Cloudflare Tunnel configuration.