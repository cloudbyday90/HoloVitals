# HoloVitals v1.4.9 - Cloudflare Tunnel Fix

## 🐛 Critical Bug Fix Release

This release fixes a critical issue in v1.4.8 where Cloudflare Tunnel was incorrectly skipped in development mode.

---

## What's Fixed

### v1.4.8 Issue (Incorrect Behavior)
- ❌ Development mode skipped Cloudflare Tunnel
- ❌ Development mode skipped nginx
- ✅ Development mode skipped Stripe

### v1.4.9 Fix (Correct Behavior)
- ✅ Development mode configures Cloudflare Tunnel (required)
- ✅ Development mode configures nginx (required)
- ⚠️ Development mode makes Stripe optional (for UI testing only)

---

## Key Points

1. **Cloudflare Tunnel is required for both development and production**
2. **nginx is required for both modes**
3. **Only Stripe is optional in development mode** (for UI testing purposes)
4. Both modes use custom domains via Cloudflare Tunnel

---

## Installation

### One-Line Installation Command

```bash
wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.9.sh && chmod +x install-v1.4.9.sh && ./install-v1.4.9.sh
```

### Prerequisites

**Required for All Installations:**
- Git, Node.js, npm
- GitHub Personal Access Token (https://github.com/settings/tokens)
- **Cloudflare Tunnel token** (required for both dev and prod)
- PostgreSQL database
- OpenAI API key
- SMTP credentials

**Required for Production:**
- Stripe API keys (for live payment processing)

**Optional for Development:**
- Stripe test API keys (for UI testing only)

---

## Installation Modes

### Development Mode
```
✅ Cloudflare Tunnel: Required and configured
✅ nginx: Required and configured
⚠️ Stripe: Optional (commented out in .env.local)
📝 Start command: npm run dev
🌐 Access: https://your-domain.com
```

### Production Mode
```
✅ Cloudflare Tunnel: Required and configured
✅ nginx: Required and configured
✅ Stripe: Required (live payment processing)
📝 Start command: npm run start
🌐 Access: https://your-domain.com
```

---

## Upgrading from v1.4.8

If you installed v1.4.8 in development mode without Cloudflare Tunnel:

1. **Run the v1.4.9 installer**:
   ```bash
   wget https://raw.githubusercontent.com/cloudbyday90/HoloVitals/main/scripts/install-v1.4.9.sh && chmod +x install-v1.4.9.sh && ./install-v1.4.9.sh
   ```

2. **Provide Cloudflare Tunnel token** when prompted

3. **The installer will**:
   - Configure Cloudflare Tunnel service
   - Update your .env.local with correct settings
   - Preserve your existing database and dependencies

---

## Configuration Details

### Development .env.local
```bash
NODE_ENV=development

# Stripe Configuration (Optional - For UI Testing Only)
# Uncomment and add your keys if you want to test Stripe UI:
# STRIPE_SECRET_KEY=sk_test_your_test_key_here
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
# STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Production .env.local
```bash
NODE_ENV=production

# Stripe Configuration (Required for Production)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

---

## Post-Installation Steps

1. **Update API keys** in .env.local:
   - OPENAI_API_KEY (required)
   - SMTP credentials (required)
   - STRIPE keys (production only, or optional for dev UI testing)

2. **Set up PostgreSQL database**:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE holovitals;
   CREATE USER holovitals WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE holovitals TO holovitals;
   \q
   ```

3. **Run database migrations**:
   ```bash
   cd ~/HoloVitals/medical-analysis-platform
   npx prisma migrate deploy
   ```

4. **Start the application**:
   ```bash
   npm run dev  # for development
   # or
   npm run start  # for production
   ```

5. **Verify installation**:
   - Check Cloudflare Tunnel: `systemctl status cloudflared`
   - Access application: `https://your-domain.com`

---

## Verification Checklist

- [ ] Cloudflare Tunnel service is running
- [ ] Application is accessible via custom domain
- [ ] Database connection is working
- [ ] Authentication is functional
- [ ] API endpoints are responding
- [ ] (Production only) Stripe payment flow works
- [ ] (Development) UI displays correctly

---

## Documentation

- **Full Release Notes**: [RELEASE_NOTES_V1.4.9.md](https://github.com/cloudbyday90/HoloVitals/blob/main/RELEASE_NOTES_V1.4.9.md)
- **Changelog**: [CHANGELOG_V1.4.9.md](https://github.com/cloudbyday90/HoloVitals/blob/main/CHANGELOG_V1.4.9.md)
- **Quick Reference**: [V1.4.9_QUICK_REFERENCE.md](https://github.com/cloudbyday90/HoloVitals/blob/main/V1.4.9_QUICK_REFERENCE.md)

---

## Support

For issues, questions, or contributions:
- **GitHub Issues**: https://github.com/cloudbyday90/HoloVitals/issues
- **Repository**: https://github.com/cloudbyday90/HoloVitals

---

## Summary

This is a critical bug fix that ensures proper Cloudflare Tunnel configuration in both development and production modes. All users who installed v1.4.8 in development mode should upgrade to v1.4.9.

**Key Takeaway**: Cloudflare Tunnel is required for both development and production. Only Stripe is optional in development mode.

---

**Release Date**: January 4, 2025  
**Version**: 1.4.9  
**Type**: Bug Fix Release  
**Previous Version**: 1.4.8
</release-body-v1.4.9.md>