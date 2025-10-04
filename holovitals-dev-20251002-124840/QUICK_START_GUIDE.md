# Quick Start Guide - HoloVitals Beta Launch

## 🚀 Get Started in 5 Steps

This guide will help you launch the beta testing program quickly.

---

## Step 1: Database Migration (15 minutes)

### 1.1 Update Prisma Schema
Open `prisma/schema.prisma` and add the models from `prisma/schema-beta-system.prisma`:

```bash
# Copy the beta system models to your main schema
cat prisma/schema-beta-system.prisma >> prisma/schema.prisma
```

### 1.2 Run Migration
```bash
cd HoloVitals
npx prisma generate
npx prisma migrate dev --name add_beta_system
```

### 1.3 Verify Database
```bash
npx prisma studio
# Check that BetaCode, TokenUsage, FileUpload tables exist
```

---

## Step 2: Environment Variables (5 minutes)

### 2.1 Add to `.env.local`
```env
# Stripe Configuration (if not already added)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Consumer Plan Price IDs (create in Stripe Dashboard)
STRIPE_PERSONAL_PRICE_ID=price_...
STRIPE_FAMILY_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_BETA_REWARD_PRICE_ID=price_...
```

### 2.2 Create Stripe Products (Optional - for post-beta)
1. Go to Stripe Dashboard → Products
2. Create products for Personal, Family, Premium plans
3. Copy price IDs to environment variables

---

## Step 3: Generate Beta Codes (10 minutes)

### 3.1 Start Development Server
```bash
npm run dev
```

### 3.2 Access Admin Dashboard
Navigate to: `http://localhost:3000/admin/beta-codes`

### 3.3 Create Beta Codes
1. Click "Create Codes" button
2. Set parameters:
   - **Number of Codes:** 50 (or your target)
   - **Max Uses:** 1 (one code per user)
   - **Token Limit:** 3,000,000 (3M tokens)
   - **Storage Limit:** 500 (500 MB)
   - **Expiration:** Leave empty (no expiration)
3. Click "Create 50 Codes"

### 3.4 Export Codes
1. Copy codes from the table
2. Save to a spreadsheet or text file
3. You'll use these for recruitment

**Example codes:**
```
HOLO-A1B2C3D4
HOLO-E5F6G7H8
HOLO-I9J0K1L2
...
```

---

## Step 4: Test Beta Flow (15 minutes)

### 4.1 Test Code Redemption
1. Open incognito/private browser window
2. Sign up for a new account
3. Navigate to beta code entry (or add to onboarding)
4. Enter one of your beta codes
5. Verify:
   - Code is accepted
   - User becomes beta tester
   - Usage dashboard shows 3M tokens, 500MB storage

### 4.2 Test Usage Tracking
1. Use AI chat feature (if implemented)
2. Upload a document
3. Check usage dashboard
4. Verify:
   - Token count increases
   - Storage usage increases
   - Progress bars update

### 4.3 Test Admin Dashboard
1. Go back to admin dashboard
2. Verify:
   - Code shows as "used"
   - Statistics update
   - User appears in code details

---

## Step 5: Launch Beta Program (30 minutes)

### 5.1 Prepare Recruitment Materials

**Email Template:**
```
Subject: You're Invited to Beta Test HoloVitals! 🚀

Hi [Name],

I'm excited to invite you to be one of the first beta testers for HoloVitals - your personal AI health assistant!

As a beta tester, you'll get:
✅ 3 million AI tokens (worth $60)
✅ Unlimited AI conversations
✅ 500 MB document storage
✅ All premium features unlocked
✅ Direct feedback channel
✅ Special thank you rewards after testing

Your exclusive beta code: HOLO-XXXXXXXX

Get started:
1. Sign up at [your-domain.com]
2. Enter your beta code
3. Start exploring!

We'd love your feedback on:
- What features you love
- What could be improved
- Any bugs you encounter
- Ideas for new features

Thank you for helping us build something amazing!

Best regards,
[Your Name]
```

**Social Media Post:**
```
🚀 Exciting News! We're launching beta testing for HoloVitals - your personal AI health assistant!

Looking for 100 beta testers to help us build the future of personal health management.

Beta testers get:
✅ Free unlimited access during testing
✅ 3M AI tokens (worth $60)
✅ All premium features
✅ Special rewards after testing

Interested? DM me for a beta code!

#HealthTech #AI #BetaTesting #HealthcareInnovation
```

### 5.2 Recruitment Channels

**Email Campaign:**
- Send to existing contacts
- Friends and family
- Professional network
- Healthcare communities

**Social Media:**
- LinkedIn post
- Twitter/X thread
- Facebook groups
- Reddit (r/healthtech, r/betatesting)

**Direct Outreach:**
- Message friends/family
- Healthcare professionals
- Tech enthusiasts
- Early adopters

**Advertising (Optional):**
- Google Ads
- Facebook Ads
- LinkedIn Ads
- Target: Health-conscious individuals

### 5.3 Set Up Feedback Collection

**Create Feedback Form:**
1. Google Forms or Typeform
2. Questions:
   - What features do you use most?
   - What features are missing?
   - Any bugs encountered?
   - Overall satisfaction (1-10)
   - Would you recommend to others?
   - Suggestions for improvement

**Feedback Channels:**
- Email: beta@your-domain.com
- Discord/Slack community
- In-app feedback button
- Weekly surveys

### 5.4 Monitor Progress

**Daily Checks:**
- Number of codes redeemed
- Active users
- Token usage
- Storage usage
- Bug reports

**Weekly Reviews:**
- User engagement metrics
- Feature usage statistics
- Feedback themes
- Iteration priorities

---

## 📊 Success Metrics to Track

### Week 1
- [ ] 20+ beta codes redeemed
- [ ] 15+ active users
- [ ] 5+ feedback submissions
- [ ] 0 critical bugs

### Week 2
- [ ] 50+ beta codes redeemed
- [ ] 35+ active users
- [ ] 15+ feedback submissions
- [ ] 10+ feature requests

### Week 4
- [ ] 100+ beta codes redeemed
- [ ] 70+ active users (70% engagement)
- [ ] 50+ feedback submissions
- [ ] 20+ feature requests
- [ ] 5+ testimonials

### Month 1 Goals
- [ ] 100-500 beta testers
- [ ] 70%+ engagement rate
- [ ] 50+ bug reports/feature requests
- [ ] 10+ testimonials
- [ ] 20%+ willing to pay

---

## 🐛 Common Issues & Solutions

### Issue: Code Not Working
**Solution:**
- Check code format (HOLO-XXXXXXXX)
- Verify code is active in admin dashboard
- Check expiration date
- Ensure max uses not reached

### Issue: Usage Not Tracking
**Solution:**
- Verify database migration completed
- Check TokenUsage and FileUpload tables exist
- Ensure tracking code is integrated
- Check API endpoint responses

### Issue: Admin Dashboard Not Loading
**Solution:**
- Verify user has admin role
- Check authentication
- Review browser console for errors
- Verify API endpoints are accessible

### Issue: High Token Usage
**Solution:**
- Monitor usage patterns
- Identify power users
- Increase limits if needed (admin dashboard)
- Optimize AI prompts to reduce tokens

---

## 📞 Support Resources

### Documentation
- `BETA_SYSTEM_IMPLEMENTATION_COMPLETE.md` - Complete implementation guide
- `CONSUMER_FOCUSED_PIVOT_PLAN.md` - Strategic plan
- `PAYMENT_SYSTEM_COMPLETE.md` - Payment system guide

### Code References
- `lib/services/BetaCodeService.ts` - Beta code logic
- `components/beta/BetaCodeInput.tsx` - User code entry
- `components/beta/BetaUsageTracker.tsx` - Usage dashboard
- `components/admin/BetaCodeManagement.tsx` - Admin interface

### API Endpoints
- `POST /api/beta/validate` - Validate code
- `POST /api/beta/redeem` - Redeem code
- `GET /api/beta/usage` - Get usage
- `GET /api/beta/stats` - Get statistics (admin)

---

## 🎯 Next Steps After Beta

### Week 5-8: Iteration
1. Analyze feedback
2. Fix critical bugs
3. Implement top feature requests
4. Improve onboarding
5. Optimize performance

### Week 9-12: Preparation
1. Finalize pricing
2. Create marketing materials
3. Set up payment processing
4. Prepare launch campaign
5. Train support team

### Month 4: Public Launch
1. Convert beta testers to Beta Reward plan ($9.99/month)
2. Open registration to public
3. Launch marketing campaign
4. Monitor metrics closely
5. Provide excellent support

---

## 💡 Pro Tips

### For Recruitment
1. **Personal Touch:** Personalize each invitation
2. **Clear Value:** Emphasize benefits clearly
3. **Easy Start:** Make signup simple
4. **Follow Up:** Remind non-responders
5. **Thank Them:** Show appreciation

### For Engagement
1. **Regular Updates:** Weekly progress emails
2. **Feature Highlights:** Showcase new features
3. **User Stories:** Share success stories
4. **Community:** Build a community
5. **Rewards:** Recognize active testers

### For Feedback
1. **Make it Easy:** Simple feedback forms
2. **Act Quickly:** Respond to feedback fast
3. **Show Impact:** Share what you've implemented
4. **Be Transparent:** Honest about limitations
5. **Say Thanks:** Appreciate all feedback

---

## ✅ Launch Checklist

### Pre-Launch
- [ ] Database migration complete
- [ ] Environment variables set
- [ ] Beta codes generated
- [ ] Test flow verified
- [ ] Recruitment materials ready
- [ ] Feedback channels set up
- [ ] Monitoring tools ready

### Launch Day
- [ ] Send first batch of invitations
- [ ] Post on social media
- [ ] Monitor signups
- [ ] Respond to questions
- [ ] Fix any issues immediately
- [ ] Celebrate first users! 🎉

### Post-Launch
- [ ] Daily monitoring
- [ ] Weekly feedback review
- [ ] Bi-weekly updates to testers
- [ ] Monthly progress reports
- [ ] Continuous iteration

---

## 🎉 You're Ready!

Everything is set up and ready to go. Just follow these 5 steps and you'll have your beta program running in under 2 hours.

**Remember:**
- Start small (20-50 testers)
- Iterate quickly
- Listen to feedback
- Communicate often
- Have fun! 🚀

**Good luck with your beta launch!**

---

*Need help? Review the comprehensive documentation or reach out to the development team.*