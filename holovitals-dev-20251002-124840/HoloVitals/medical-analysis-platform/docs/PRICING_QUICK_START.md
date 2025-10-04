# Pricing System - Quick Start Guide

## For Developers

### 1. Create a Subscription

```typescript
import { SubscriptionService } from '@/lib/services/SubscriptionService';
import { SubscriptionTier } from '@/lib/config/pricing';

// Create new subscription
const result = await SubscriptionService.createSubscription({
  userId: 'user-123',
  tier: SubscriptionTier.PROFESSIONAL,
  paymentMethodId: 'pm_xxx',
  trialPeriod: false,
});

console.log('Subscription:', result.subscription);
console.log('Token Balance:', result.tokenBalance);
```

### 2. Check Token Balance

```typescript
import { TokenService } from '@/lib/services/TokenService';

const balance = await TokenService.getBalance('user-123');

console.log('Current Balance:', balance.currentBalanceFormatted);
console.log('Total Earned:', balance.totalEarnedFormatted);
console.log('Total Used:', balance.totalUsedFormatted);
console.log('Free Upload Remaining:', balance.freeUploadRemaining);
```

### 3. Estimate File Upload Cost

```typescript
import { FileUploadService } from '@/lib/services/FileUploadService';

const result = await FileUploadService.createUpload({
  userId: 'user-123',
  fileName: 'medical-records.pdf',
  filePath: '/uploads/medical-records.pdf',
  fileSize: 52428800, // 50MB
  mimeType: 'application/pdf',
  requiresOCR: true,
  requiresAnalysis: true,
});

console.log('Estimated Tokens:', result.costEstimation.estimatedTokens);
console.log('Estimated Cost:', result.costEstimation.estimatedCostFormatted);
console.log('Can Afford:', result.costEstimation.canAfford);
console.log('Recommendation:', result.costEstimation.recommendation);
```

### 4. Approve and Process Upload

```typescript
// Option 1: Immediate processing
const result = await FileUploadService.approveCost({
  uploadId: 'upload-123',
  approved: true,
  processingOption: 'immediate',
});

// Option 2: Multi-month processing
const result = await FileUploadService.approveCost({
  uploadId: 'upload-123',
  approved: true,
  processingOption: 'multi-month',
});

// Option 3: Purchase tokens first
const result = await FileUploadService.approveCost({
  uploadId: 'upload-123',
  approved: true,
  processingOption: 'one-time-purchase',
  packageIndex: 2, // 250K tokens package
});
```

### 5. Purchase Additional Tokens

```typescript
import { TokenService } from '@/lib/services/TokenService';

const balance = await TokenService.purchaseTokens({
  userId: 'user-123',
  packageIndex: 2, // 250K tokens + 25K bonus
  paymentIntentId: 'pi_xxx',
});

console.log('New Balance:', balance.currentBalance);
```

### 6. Upgrade Subscription

```typescript
import { SubscriptionService } from '@/lib/services/SubscriptionService';
import { SubscriptionTier } from '@/lib/config/pricing';

// Immediate upgrade
const subscription = await SubscriptionService.changeSubscriptionTier({
  userId: 'user-123',
  newTier: SubscriptionTier.ENTERPRISE,
  immediate: true,
});

// Scheduled upgrade (next billing cycle)
const subscription = await SubscriptionService.changeSubscriptionTier({
  userId: 'user-123',
  newTier: SubscriptionTier.ENTERPRISE,
  immediate: false,
});
```

### 7. Get Usage Analytics

```typescript
import { TokenService } from '@/lib/services/TokenService';

const analytics = await TokenService.getUsageAnalytics('user-123', 30);

console.log('Total Used:', analytics.usage.total);
console.log('Average Daily:', analytics.usage.averageDaily);
console.log('Projected Monthly:', analytics.usage.projectedMonthly);
console.log('Usage by Type:', analytics.usageByType);
```

---

## API Examples

### Create Subscription

```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "tier": "PROFESSIONAL",
    "paymentMethodId": "pm_xxx",
    "trialPeriod": false
  }'
```

### Get Token Balance

```bash
curl http://localhost:3000/api/tokens/balance?userId=user-123
```

### Estimate Upload Cost

```bash
curl -X POST http://localhost:3000/api/uploads/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "fileName": "medical-records.pdf",
    "filePath": "/uploads/medical-records.pdf",
    "fileSize": 52428800,
    "mimeType": "application/pdf"
  }'
```

### Purchase Tokens

```bash
curl -X POST http://localhost:3000/api/tokens/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "packageIndex": 2,
    "paymentIntentId": "pi_xxx"
  }'
```

### Get Pricing Information

```bash
curl http://localhost:3000/api/pricing
```

---

## Common Patterns

### Check if User Can Afford Operation

```typescript
import { TokenService } from '@/lib/services/TokenService';

const tokensNeeded = 50000;
const canAfford = await TokenService.canAfford('user-123', tokensNeeded);

if (!canAfford) {
  // Show upgrade or purchase options
}
```

### Deduct Tokens After Processing

```typescript
import { TokenService } from '@/lib/services/TokenService';

await TokenService.deductTokens({
  userId: 'user-123',
  amount: 50000,
  description: 'Document processing: medical-records.pdf',
  referenceId: 'upload-123',
  referenceType: 'FileUpload',
});
```

### Refund Tokens on Failure

```typescript
import { TokenService } from '@/lib/services/TokenService';

await TokenService.refundTokens({
  userId: 'user-123',
  amount: 50000,
  reason: 'Processing failed - system error',
  referenceId: 'upload-123',
});
```

### Get Recommended Tier Upgrade

```typescript
import { PricingService } from '@/lib/services/PricingService';
import { SubscriptionTier } from '@/lib/config/pricing';

const currentTier = SubscriptionTier.BASIC;
const monthlyUsage = 150000; // tokens

const recommendedTier = PricingService.getRecommendedTierUpgrade(
  currentTier,
  monthlyUsage
);

if (recommendedTier) {
  console.log('Recommended upgrade:', recommendedTier);
}
```

---

## Error Handling

```typescript
try {
  await TokenService.deductTokens({
    userId: 'user-123',
    amount: 50000,
    description: 'Processing',
  });
} catch (error) {
  if (error.message.includes('Insufficient token balance')) {
    // Show purchase or upgrade options
  } else {
    // Handle other errors
  }
}
```

---

## Testing

### Run Tests

```bash
npm test
```

### Test Specific Service

```bash
npm test -- SubscriptionService
npm test -- TokenService
npm test -- FileUploadService
```

---

## Database Access

### View Data in Prisma Studio

```bash
npx prisma studio
```

### Query Database Directly

```bash
sudo -u postgres psql -d holovitals

-- View subscriptions
SELECT * FROM subscriptions;

-- View token balances
SELECT * FROM token_balances;

-- View recent transactions
SELECT * FROM token_transactions ORDER BY created_at DESC LIMIT 10;
```

---

## Cron Jobs (To Implement)

### Monthly Token Refresh

```typescript
// Run daily at 2 AM
import { SubscriptionService } from '@/lib/services/SubscriptionService';

// Get all active subscriptions due for refresh
const subscriptions = await prisma.subscription.findMany({
  where: {
    status: 'ACTIVE',
    // Check if 30 days since last refresh
  },
});

for (const sub of subscriptions) {
  await SubscriptionService.refreshMonthlyTokens(sub.userId);
}
```

### Multi-Month Processing

```typescript
// Run daily at 3 AM
import { FileUploadService } from '@/lib/services/FileUploadService';

// Get all scheduled uploads ready for next chunk
const uploads = await prisma.fileUpload.findMany({
  where: {
    status: 'SCHEDULED',
    // Check if ready for next month
  },
});

for (const upload of uploads) {
  await FileUploadService.processMultiMonthChunk(upload.id);
}
```

---

## Configuration

### Pricing Tiers

Edit `lib/config/pricing.ts`:

```typescript
export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  [SubscriptionTier.BASIC]: {
    monthlyPrice: 9.99,
    monthlyTokens: 100_000,
    freeUploadLimit: 10 * 1024 * 1024, // 10MB
    // ...
  },
  // ...
};
```

### Token Costs

```typescript
export const TOKEN_COSTS: TokenCosts = {
  documentProcessing: 1_000, // per MB
  chatMessage: 500,
  documentAnalysis: 5_000,
  // ...
};
```

---

## Troubleshooting

### "Insufficient token balance"

```typescript
// Check balance
const balance = await TokenService.getBalance(userId);
console.log('Current balance:', balance.currentBalance);

// Recommend action
if (balance.currentBalance < tokensNeeded) {
  const package = PricingService.getRecommendedPackage(tokensNeeded);
  console.log('Recommended package:', package);
}
```

### "Subscription not found"

```typescript
// Check if user has subscription
const hasSubscription = await SubscriptionService.hasActiveSubscription(userId);

if (!hasSubscription) {
  // Create subscription first
  await SubscriptionService.createSubscription({
    userId,
    tier: SubscriptionTier.BASIC,
    trialPeriod: true,
  });
}
```

### "File size exceeds tier limit"

```typescript
import { PricingService } from '@/lib/services/PricingService';

const validation = PricingService.validateFileSize(fileSize, currentTier);

if (!validation.valid) {
  console.log(validation.message);
  // Suggest upgrade or file splitting
}
```

---

## Support

- **Documentation**: `/docs/PRICING_SYSTEM.md`
- **API Reference**: `/docs/PRICING_SYSTEM.md#api-reference`
- **Implementation Details**: `/docs/PRICING_IMPLEMENTATION_SUMMARY.md`

---

**Last Updated**: January 2025  
**Version**: 1.0.0