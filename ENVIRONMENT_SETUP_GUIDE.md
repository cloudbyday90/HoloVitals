# HoloVitals Environment Setup Guide

## Step 1: NEXTAUTH_SECRET (✅ COMPLETE)

Your generated secret:
```
sE1zQ7BM5HxXTb/jmiRwmrY4n0tvidCfw1mRAN9Tbns=
```

## Step 2: Stripe Setup (15 minutes)

### Get Stripe Test Keys

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/apikeys
2. **Copy your keys**:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

### Create Subscription Products

1. **Go to Products**: https://dashboard.stripe.com/test/products
2. **Create 6 products** with these details:

#### Product 1: Free Plan
- Name: `HoloVitals Free`
- Description: `50K tokens, 1GB storage`
- Price: `$0.00 / month`
- Recurring: Monthly
- Copy the Price ID: `price_...`

#### Product 2: Personal Plan
- Name: `HoloVitals Personal`
- Description: `500K tokens, 10GB storage`
- Price: `$14.99 / month`
- Recurring: Monthly
- Copy the Price ID: `price_...`

#### Product 3: Family Plan (Most Popular)
- Name: `HoloVitals Family`
- Description: `1.5M tokens, 50GB storage, 5 members`
- Price: `$29.99 / month`
- Recurring: Monthly
- Copy the Price ID: `price_...`

#### Product 4: Premium Plan
- Name: `HoloVitals Premium`
- Description: `Unlimited tokens, 200GB storage, 10 members`
- Price: `$49.99 / month`
- Recurring: Monthly
- Copy the Price ID: `price_...`

#### Product 5: Beta Tester Plan
- Name: `HoloVitals Beta Tester`
- Description: `3M tokens, 500MB storage - Free during beta`
- Price: `$0.00 / month`
- Recurring: Monthly
- Copy the Price ID: `price_...`

#### Product 6: Beta Reward Plan
- Name: `HoloVitals Beta Reward`
- Description: `Thank you plan for beta testers - $9.99 for 1 year`
- Price: `$9.99 / month`
- Recurring: Monthly
- Copy the Price ID: `price_...`

### Set Up Webhook (Optional for Beta)

1. **Go to Webhooks**: https://dashboard.stripe.com/test/webhooks
2. **Add endpoint**: `https://your-domain.com/api/payments/webhook`
3. **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_method.attached`
   - `payment_method.detached`
4. **Copy webhook secret**: `whsec_...`

## Step 3: AI API Keys (Optional for Beta)

### OpenAI
1. Go to: https://platform.openai.com/api-keys
2. Create new key
3. Copy: `sk-...`

### Anthropic
1. Go to: https://console.anthropic.com/settings/keys
2. Create new key
3. Copy: `sk-ant-...`

## Step 4: Email Setup (Optional for Beta)

### Option A: SendGrid (Free Tier)
1. Sign up: https://sendgrid.com/
2. Create API key
3. Verify sender email
4. SMTP: `smtp://apikey:YOUR_API_KEY@smtp.sendgrid.net:587`

### Option B: Resend (Recommended)
1. Sign up: https://resend.com/
2. Create API key
3. Verify domain
4. Use Resend API directly

### Option C: Gmail (Development Only)
1. Enable 2FA on Gmail
2. Create App Password
3. SMTP: `smtp://your-email@gmail.com:app-password@smtp.gmail.com:587`

## Step 5: Update .env.local

Copy all your keys to `.env.local`:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/holovitals"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sE1zQ7BM5HxXTb/jmiRwmrY4n0tvidCfw1mRAN9Tbns="

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET_HERE"

# Stripe Price IDs
STRIPE_FREE_PRICE_ID="price_YOUR_FREE_PRICE_ID"
STRIPE_PERSONAL_PRICE_ID="price_YOUR_PERSONAL_PRICE_ID"
STRIPE_FAMILY_PRICE_ID="price_YOUR_FAMILY_PRICE_ID"
STRIPE_PREMIUM_PRICE_ID="price_YOUR_PREMIUM_PRICE_ID"
STRIPE_BETA_TESTER_PRICE_ID="price_YOUR_BETA_TESTER_PRICE_ID"
STRIPE_BETA_REWARD_PRICE_ID="price_YOUR_BETA_REWARD_PRICE_ID"

# AI Services (Optional)
OPENAI_API_KEY="sk_YOUR_KEY_HERE"
ANTHROPIC_API_KEY="sk-ant-YOUR_KEY_HERE"

# Email (Optional)
EMAIL_SERVER="smtp://..."
EMAIL_FROM="noreply@holovitals.com"
```

## Step 6: Verify Setup

Run these commands to verify everything is configured:

```bash
# Check environment variables are loaded
npm run dev

# Test database connection
npx prisma db push

# Generate Prisma client
npx prisma generate
```

## Quick Start Checklist

- [ ] NEXTAUTH_SECRET added to .env.local
- [ ] Stripe test keys added
- [ ] 6 Stripe products created
- [ ] All price IDs added to .env.local
- [ ] (Optional) AI API keys added
- [ ] (Optional) Email configured
- [ ] Application starts without errors
- [ ] Can access http://localhost:3000

## Troubleshooting

### "Invalid NEXTAUTH_SECRET"
- Make sure the secret is wrapped in quotes
- No extra spaces or newlines

### "Stripe key not found"
- Verify you're using test keys (pk_test_ and sk_test_)
- Check for typos in .env.local

### "Database connection failed"
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL is correct

### "Module not found"
- Run: `npm install`
- Clear cache: `rm -rf .next`

## Next Steps After Setup

1. **Generate Beta Codes** - Create initial batch of 50-100 codes
2. **Test Features** - Walk through user registration and beta redemption
3. **Deploy to Vercel** - Get live URL for beta testers
4. **Distribute Codes** - Send to initial beta testers

---

**Need help with any step? Let me know!**