# Changelog - v1.4.7

## Version 1.4.7 - Payment API Routes Build Fix
**Release Date:** October 4, 2025  
**Type:** Bug Fix Release

---

## 🐛 Bug Fixes

### Build Error - Payment and Subscription API Routes

#### Issue
Build process failed when trying to pre-render payment and subscription API routes:

**Error:**
```
Error: Neither authOptions nor config.authenticationOptions provided
Build error occurred
[Error: Failed to collect page data for /api/payments/create-billing-portal]
```

#### Root Cause
Next.js was attempting to statically pre-render 9 payment and subscription API routes during build time. These routes require runtime authentication and external service access (Stripe), causing build failures.

#### Solution
Added `export const dynamic = 'force-dynamic'` to all payment and subscription routes:

- `/api/payments/create-billing-portal`
- `/api/payments/create-checkout-session`
- `/api/payments/invoices`
- `/api/payments/payment-methods`
- `/api/payments/subscription`
- `/api/subscriptions/cancel`
- `/api/subscriptions`
- `/api/tokens/purchase`
- `/api/webhooks/stripe`

#### Impact
- Application now builds successfully
- All payment and subscription routes work correctly at runtime
- No more build-time authentication errors

---

## 📝 Changes Summary

### Modified Files
- 9 API route files in `medical-analysis-platform/app/api/`
- Added dynamic rendering configuration to each

### Installation Method
```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.7.sh && chmod +x install-v1.4.7.sh && ./install-v1.4.7.sh
```

---

## ✅ Verification

- ✅ Application builds successfully
- ✅ No build-time authentication errors
- ✅ All payment routes work at runtime
- ✅ All 7 installation phases complete

---

**Full Changelog**: https://github.com/cloudbyday90/HoloVitals/compare/v1.4.6...v1.4.7