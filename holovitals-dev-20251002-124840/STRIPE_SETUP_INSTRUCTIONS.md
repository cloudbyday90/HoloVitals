# Stripe Setup Instructions for HoloVitals

## Quick Setup Guide (15 minutes)

### Step 1: Get Your Stripe Test Keys (2 minutes)

1. **Sign in to Stripe**: https://dashboard.stripe.com/
2. **Switch to Test Mode**: Toggle in the top right corner
3. **Go to API Keys**: https://dashboard.stripe.com/test/apikeys
4. **Copy these keys**:
   - **Publishable key**: Starts with `pk_test_`
   - **Secret key**: Click "Reveal test key", starts with `sk_test_`

### Step 2: Create Subscription Products (10 minutes)

Go to: https://dashboard.stripe.com/test/products

Create each product with these exact details:

---

#### 1. Free Plan
```
Name: HoloVitals Free
Description: 50K tokens per month, 1GB storage
Pricing Model: Standard pricing
Price: $0.00
Billing Period: Monthly
```
**After creating, copy the Price ID** (starts with `price_`)

---

#### 2. Personal Plan
```
Name: HoloVitals Personal
Description: 500K tokens per month, 10GB storage
Pricing Model: Standard pricing
Price: $14.99
Billing Period: Monthly
```
**After creating, copy the Price ID**

---

#### 3. Family Plan ⭐ (Most Popular)
```
Name: HoloVitals Family
Description: 1.5M tokens per month, 50GB storage, up to 5 family members
Pricing Model: Standard pricing
Price: $29.99
Billing Period: Monthly
```
**After creating, copy the Price ID**

---

#### 4. Premium Plan
```
Name: HoloVitals Premium
Description: Unlimited tokens, 200GB storage, up to 10 family members
Pricing Model: Standard pricing
Price: $49.99
Billing Period: Monthly
```
**After creating, copy the Price ID**

---

#### 5. Beta Tester Plan
```
Name: HoloVitals Beta Tester
Description: 3M tokens during beta, 500MB storage - Free during testing period
Pricing Model: Standard pricing
Price: $0.00
Billing Period: Monthly
```
**After creating, copy the Price ID**

---

#### 6. Beta Reward Plan
```
Name: HoloVitals Beta Reward
Description: Thank you plan for beta testers - Special pricing for 1 year
Pricing Model: Standard pricing
Price: $9.99
Billing Period: Monthly
```
**After creating, copy the Price ID**

---

### Step 3: Update .env.local (2 minutes)

Open `medical-analysis-platform/.env.local` and update these lines:

```env
# Stripe Configuration (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_PUBLISHABLE_KEY_HERE"
STRIPE_SECRET_KEY="sk_test_YOUR_SECRET_KEY_HERE"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"  # Leave as-is for now

# Stripe Price IDs
STRIPE_FREE_PRICE_ID="price_YOUR_FREE_PRICE_ID"
STRIPE_PERSONAL_PRICE_ID="price_YOUR_PERSONAL_PRICE_ID"
STRIPE_FAMILY_PRICE_ID="price_YOUR_FAMILY_PRICE_ID"
STRIPE_PREMIUM_PRICE_ID="price_YOUR_PREMIUM_PRICE_ID"
STRIPE_BETA_TESTER_PRICE_ID="price_YOUR_BETA_TESTER_PRICE_ID"
STRIPE_BETA_REWARD_PRICE_ID="price_YOUR_BETA_REWARD_PRICE_ID"
```

### Step 4: Verify Setup (1 minute)

Restart your development server:
```bash
cd medical-analysis-platform
npm run dev
```

Visit: http://localhost:3000/billing

You should see all 6 subscription plans displayed!

---

## Webhook Setup (Optional - For Production)

**Note**: Webhooks are not required for beta testing. Set this up when deploying to production.

1. **Go to Webhooks**: https://dashboard.stripe.com/test/webhooks
2. **Click "Add endpoint"**
3. **Enter URL**: `https://your-domain.com/api/payments/webhook`
4. **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_method.attached`
   - `payment_method.detached`
5. **Copy webhook signing secret**: Starts with `whsec_`
6. **Update .env.local** with the webhook secret

---

## Testing Stripe Integration

### Test Card Numbers

Use these test cards in Stripe checkout:

**Successful Payment**:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Requires Authentication (3D Secure)**:
- Card: `4000 0025 0000 3155`

**Declined Payment**:
- Card: `4000 0000 0000 9995`

### Test the Flow

1. **Go to billing page**: http://localhost:3000/billing
2. **Click "Subscribe" on any plan**
3. **Enter test card**: `4242 4242 4242 4242`
4. **Complete checkout**
5. **Verify subscription created** in Stripe dashboard

---

## Troubleshooting

### "Invalid API Key"
- Make sure you're using **test mode** keys (pk_test_ and sk_test_)
- Check for extra spaces or quotes in .env.local
- Restart dev server after updating .env.local

### "Price not found"
- Verify you copied the correct Price ID (not Product ID)
- Price IDs start with `price_`
- Make sure the price is in test mode

### "Checkout session failed"
- Check browser console for errors
- Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
- Make sure you're using test mode keys

### "Webhook signature verification failed"
- This is normal during development
- Webhooks are optional for beta testing
- Set up properly when deploying to production

---

## Quick Checklist

- [ ] Stripe account created
- [ ] Switched to test mode
- [ ] Copied publishable key (pk_test_)
- [ ] Copied secret key (sk_test_)
- [ ] Created 6 subscription products
- [ ] Copied all 6 price IDs
- [ ] Updated .env.local with keys
- [ ] Updated .env.local with price IDs
- [ ] Restarted dev server
- [ ] Tested billing page loads
- [ ] Tested checkout with test card

---

## What's Next?

After Stripe is configured:

1. ✅ **Generate Beta Codes** - Create initial batch for testers
2. ✅ **Test Beta Flow** - Register user → Redeem code → Get beta subscription
3. ✅ **Deploy to Vercel** - Get live URL for beta testers
4. ✅ **Distribute Codes** - Send to first wave of testers

**Need help with any step? Let me know!**