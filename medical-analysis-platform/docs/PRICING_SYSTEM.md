# HoloVitals Pricing & Token System Documentation

## Overview

The HoloVitals pricing system is a comprehensive token-based subscription model that allows users to process medical documents efficiently while maintaining cost transparency and flexibility.

## Table of Contents

1. [Subscription Tiers](#subscription-tiers)
2. [Token System](#token-system)
3. [File Upload & Processing](#file-upload--processing)
4. [Cost Estimation](#cost-estimation)
5. [Multi-Month Processing](#multi-month-processing)
6. [API Reference](#api-reference)
7. [Service Architecture](#service-architecture)

---

## Subscription Tiers

### Basic Tier - $9.99/month
- **Monthly Tokens**: 100,000 tokens
- **Free Upload Limit**: 10MB (first upload only)
- **Max File Size**: 100MB
- **Priority**: Standard (Level 1)
- **Support**: Email support
- **Features**:
  - Basic AI chat support
  - Document analysis
  - OCR processing
  - Standard processing speed

### Professional Tier - $29.99/month
- **Monthly Tokens**: 500,000 tokens
- **Free Upload Limit**: 25MB (first upload only)
- **Max File Size**: 500MB
- **Priority**: High (Level 3)
- **Support**: Priority email support
- **Features**:
  - Advanced AI analysis
  - Priority processing
  - Batch document processing
  - Faster processing speed
  - All Basic features

### Enterprise Tier - $99.99/month
- **Monthly Tokens**: 2,000,000 tokens
- **Free Upload Limit**: 100MB (first upload only)
- **Max File Size**: 1GB
- **Priority**: Highest (Level 5)
- **Support**: Dedicated support
- **Features**:
  - Premium AI models (GPT-4, Claude 3.5)
  - Highest priority processing
  - Unlimited batch processing
  - Advanced analytics
  - Custom integrations
  - Fastest processing speed
  - All Professional features

### Annual Subscriptions
- **20% discount** on all tiers when billed annually
- Basic: $95.90/year (save $23.98)
- Professional: $287.90/year (save $71.98)
- Enterprise: $959.90/year (save $239.98)

---

## Token System

### What are Tokens?

Tokens are the currency used to process documents and perform AI operations on HoloVitals. Different operations consume different amounts of tokens based on complexity.

### Token Costs

| Operation | Tokens Required |
|-----------|----------------|
| Document Processing (per MB) | 1,000 tokens |
| Chat Message (average) | 500 tokens |
| Full Document Analysis | 5,000 tokens |
| Context Optimization | 100 tokens |
| Batch Processing Job | 10,000 tokens |

### Token Packages (One-Time Purchases)

| Package | Base Tokens | Bonus Tokens | Total | Price |
|---------|-------------|--------------|-------|-------|
| Starter | 50,000 | 0 | 50,000 | $4.99 |
| Standard | 100,000 | 5,000 | 105,000 | $9.99 |
| Plus | 250,000 | 25,000 | 275,000 | $24.99 |
| Pro | 500,000 | 75,000 | 575,000 | $49.99 |
| Enterprise | 1,000,000 | 200,000 | 1,200,000 | $99.99 |

### Token Balance Management

- **Monthly Refresh**: Tokens are automatically added on your billing cycle date
- **Rollover**: Unused tokens roll over to the next month (no expiration)
- **Purchases**: One-time token purchases are added immediately
- **Deductions**: Tokens are deducted when operations complete
- **Refunds**: Failed operations result in automatic token refunds

---

## File Upload & Processing

### Free Upload Limits

Each tier includes a **one-time free upload limit** for your first upload:
- **Basic**: First 10MB is free (no tokens charged)
- **Professional**: First 25MB is free (no tokens charged)
- **Enterprise**: First 100MB is free (no tokens charged)

**Important**: The free upload limit applies only to your **first upload** and only up to the specified size. Subsequent uploads or portions exceeding the limit will consume tokens.

### File Size Limits

| Tier | Maximum File Size |
|------|------------------|
| Basic | 100MB |
| Professional | 500MB |
| Enterprise | 1GB (1,024MB) |

### Supported File Types

- **PDF Documents**: Most efficient, ~1,000 tokens per MB
- **Images (JPEG, PNG)**: Requires OCR, ~1,000-1,500 tokens per MB
- **Text Files**: Most efficient, ~800 tokens per MB
- **Other Formats**: ~1,000-1,500 tokens per MB

### Processing Options

When uploading a file, you have several processing options:

#### 1. Immediate Processing
- **Requirements**: Sufficient token balance
- **Processing Time**: Starts immediately
- **Best For**: Urgent documents, sufficient balance

#### 2. One-Time Token Purchase
- **Requirements**: Purchase additional tokens
- **Processing Time**: Starts after payment
- **Best For**: One-time large uploads

#### 3. Multi-Month Processing
- **Requirements**: Active subscription
- **Processing Time**: Spread over multiple months
- **Best For**: Large files, limited budget
- **Details**: File is processed in chunks as monthly tokens refresh

#### 4. Tier Upgrade
- **Requirements**: Upgrade to higher tier
- **Processing Time**: Starts after upgrade
- **Best For**: Regular large file processing needs

---

## Cost Estimation

### How Cost Estimation Works

Before processing any file, HoloVitals provides a detailed cost estimation:

1. **File Analysis**: System analyzes file size, type, and content
2. **Token Calculation**: Estimates tokens needed based on:
   - File size (MB)
   - File type (PDF, image, text)
   - OCR requirements
   - Analysis depth
3. **Cost Breakdown**: Shows:
   - Estimated tokens
   - Estimated USD cost
   - Current balance
   - Balance after processing
   - Free upload eligibility
   - Processing time estimate

### Example Cost Estimations

#### Example 1: Basic Tier - 5MB PDF (First Upload)
```
File Size: 5MB
File Type: PDF
Estimated Tokens: 0 (uses free upload limit)
Estimated Cost: $0.00
Free Upload Used: 5MB of 10MB
Balance After: 100,000 tokens (unchanged)
Processing Time: ~1 minute
Recommendation: Free upload - no tokens charged
```

#### Example 2: Basic Tier - 50MB PDF
```
File Size: 50MB
File Type: PDF
Estimated Tokens: 50,000 tokens
Estimated Cost: $5.00
Current Balance: 100,000 tokens
Balance After: 50,000 tokens
Processing Time: ~5 minutes
Recommendation: Sufficient balance for immediate processing
```

#### Example 3: Basic Tier - 500MB PDF (Exceeds Limit)
```
File Size: 500MB
File Type: PDF
Error: File size exceeds tier limit (100MB)
Recommendation: Upgrade to Professional tier or split file
```

#### Example 4: Professional Tier - 200MB PDF (Insufficient Balance)
```
File Size: 200MB
File Type: PDF
Estimated Tokens: 200,000 tokens
Estimated Cost: $20.00
Current Balance: 50,000 tokens
Tokens Needed: 150,000 more
Processing Options:
1. Purchase 250K token package ($24.99)
2. Multi-month processing (4 months)
3. Upgrade to Enterprise tier
```

---

## Multi-Month Processing

### Overview

Multi-month processing allows users to process large files over multiple billing cycles, using their monthly token allocation.

### How It Works

1. **Upload File**: Upload file and receive cost estimation
2. **Choose Multi-Month**: Select multi-month processing option
3. **Schedule Created**: System calculates processing schedule
4. **Monthly Processing**: File is processed in chunks each month
5. **Automatic Deduction**: Tokens deducted as each chunk completes

### Example Multi-Month Schedule

**Scenario**: Professional tier user with 200MB file requiring 200,000 tokens

```
Current Balance: 50,000 tokens
Monthly Allocation: 500,000 tokens
Total Tokens Needed: 200,000 tokens

Processing Schedule:
Month 1: 50,000 tokens (25% complete) - Uses current balance
Month 2: 150,000 tokens (100% complete) - Uses monthly refresh

Estimated Completion: 2 months
```

### Benefits

- **No upfront cost**: Use existing subscription
- **Flexible**: Process large files without immediate payment
- **Automatic**: System handles scheduling and processing
- **Transparent**: Track progress monthly

### Limitations

- **Maximum Duration**: 12 months
- **Active Subscription Required**: Must maintain active subscription
- **No Cancellation Refund**: Tokens already used are not refunded

---

## API Reference

### Subscription Endpoints

#### Create/Upgrade Subscription
```http
POST /api/subscriptions
Content-Type: application/json

{
  "userId": "user-id",
  "tier": "PROFESSIONAL",
  "paymentMethodId": "pm_xxx",
  "trialPeriod": false,
  "action": "upgrade",
  "immediate": true
}

Response:
{
  "success": true,
  "subscription": { ... },
  "message": "Subscription upgraded to PROFESSIONAL immediately"
}
```

#### Get Current Subscription
```http
GET /api/subscriptions?userId=user-id

Response:
{
  "success": true,
  "subscription": {
    "id": "sub-id",
    "tier": "PROFESSIONAL",
    "status": "ACTIVE",
    "monthlyPrice": 29.99,
    "billingCycleStart": "2025-01-01",
    "billingCycleEnd": "2025-02-01",
    "tokenBalance": { ... },
    "tierConfig": { ... }
  }
}
```

#### Cancel Subscription
```http
POST /api/subscriptions/cancel
Content-Type: application/json

{
  "userId": "user-id",
  "reason": "No longer needed",
  "immediate": false
}

Response:
{
  "success": true,
  "subscription": { ... },
  "message": "Subscription will be cancelled at the end of the billing cycle"
}
```

### Token Endpoints

#### Get Token Balance
```http
GET /api/tokens/balance?userId=user-id

Response:
{
  "success": true,
  "balance": {
    "currentBalance": 450000,
    "currentBalanceFormatted": "450K",
    "totalEarned": 500000,
    "totalUsed": 50000,
    "totalPurchased": 0,
    "monthlyAllocation": 500000,
    "freeUploadRemaining": 25000000
  }
}
```

#### Purchase Tokens
```http
POST /api/tokens/purchase
Content-Type: application/json

{
  "userId": "user-id",
  "packageIndex": 2,
  "paymentIntentId": "pi_xxx"
}

Response:
{
  "success": true,
  "balance": { ... },
  "package": {
    "tokens": 250000,
    "bonus": 25000,
    "price": 24.99,
    "displayName": "250K Tokens + 25K Bonus"
  },
  "message": "Successfully purchased 250K Tokens + 25K Bonus"
}
```

#### Get Transaction History
```http
GET /api/tokens/history?userId=user-id&limit=50&offset=0

Response:
{
  "success": true,
  "transactions": [ ... ],
  "total": 150,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

#### Get Usage Analytics
```http
GET /api/tokens/analytics?userId=user-id&days=30

Response:
{
  "success": true,
  "analytics": {
    "period": { ... },
    "usage": {
      "total": 150000,
      "averageDaily": 5000,
      "projectedMonthly": 150000
    },
    "dailyUsage": [ ... ],
    "usageByType": [ ... ]
  }
}
```

### Upload Endpoints

#### Estimate Upload Cost
```http
POST /api/uploads/estimate
Content-Type: application/json

{
  "userId": "user-id",
  "fileName": "medical-records.pdf",
  "filePath": "/uploads/medical-records.pdf",
  "fileSize": 52428800,
  "mimeType": "application/pdf",
  "requiresOCR": true,
  "requiresAnalysis": true
}

Response:
{
  "success": true,
  "upload": { ... },
  "costEstimation": {
    "fileSize": 52428800,
    "fileSizeFormatted": "50.00 MB",
    "estimatedTokens": 50000,
    "estimatedCost": 5.00,
    "canAfford": true,
    "useFreeUpload": false,
    "recommendation": "You have sufficient tokens..."
  },
  "tierConfig": { ... }
}
```

#### Approve Upload
```http
POST /api/uploads/approve
Content-Type: application/json

{
  "uploadId": "upload-id",
  "approved": true,
  "processingOption": "immediate"
}

Response:
{
  "success": true,
  "status": "approved",
  "message": "File queued for immediate processing",
  "upload": { ... }
}
```

#### Get Upload History
```http
GET /api/uploads?userId=user-id&limit=50&offset=0

Response:
{
  "success": true,
  "uploads": [ ... ],
  "total": 25,
  "limit": 50,
  "offset": 0,
  "hasMore": false
}
```

#### Cancel Upload
```http
DELETE /api/uploads?uploadId=upload-id&reason=Changed%20mind

Response:
{
  "success": true,
  "status": "cancelled",
  "message": "Upload cancelled successfully"
}
```

### Pricing Endpoint

#### Get Pricing Information
```http
GET /api/pricing

Response:
{
  "success": true,
  "tiers": [ ... ],
  "tokenPackages": [ ... ],
  "tokenCosts": { ... },
  "pricingRules": { ... }
}
```

---

## Service Architecture

### Core Services

#### 1. PricingService
- Cost estimation for file uploads
- Multi-month processing calculations
- Tier upgrade recommendations
- Token usage statistics

#### 2. SubscriptionService
- Subscription creation and management
- Tier upgrades/downgrades
- Monthly token refresh
- Subscription lifecycle management

#### 3. TokenService
- Token balance tracking
- Token deductions and refunds
- Token purchases
- Transaction history
- Usage analytics

#### 4. FileUploadService
- File upload management
- Cost approval workflow
- Multi-month processing scheduler
- Upload status tracking

### Database Schema

#### Subscription Table
```sql
- id (UUID)
- userId (UUID, unique)
- tier (BASIC | PROFESSIONAL | ENTERPRISE)
- status (ACTIVE | PAST_DUE | CANCELLED | EXPIRED | TRIAL)
- monthlyPrice (Float)
- billingCycleStart (DateTime)
- billingCycleEnd (DateTime)
- nextBillingDate (DateTime)
- cancelledAt (DateTime, nullable)
- trialEndsAt (DateTime, nullable)
- metadata (JSON)
```

#### TokenBalance Table
```sql
- id (UUID)
- userId (UUID, unique)
- subscriptionId (UUID, unique)
- currentBalance (Int)
- totalEarned (Int)
- totalUsed (Int)
- totalPurchased (Int)
- freeUploadUsed (Int)
- lastRefreshDate (DateTime)
```

#### TokenTransaction Table
```sql
- id (UUID)
- tokenBalanceId (UUID)
- type (INITIAL_DEPOSIT | MONTHLY_REFRESH | PURCHASE | DEDUCTION | REFUND | BONUS | ADJUSTMENT)
- amount (Int)
- balanceBefore (Int)
- balanceAfter (Int)
- description (Text)
- referenceId (String, nullable)
- referenceType (String, nullable)
- metadata (JSON)
- createdAt (DateTime)
```

#### FileUpload Table
```sql
- id (UUID)
- userId (UUID)
- fileName (String)
- filePath (String)
- fileSize (Int)
- mimeType (String)
- status (PENDING | APPROVED | PROCESSING | COMPLETED | FAILED | CANCELLED | SCHEDULED)
- estimatedTokens (Int)
- estimatedCost (Float)
- actualTokens (Int)
- actualCost (Float)
- processingStartedAt (DateTime)
- processingCompletedAt (DateTime)
- scheduledMonths (Int)
- currentMonth (Int)
- errorMessage (Text)
- usedFreeUpload (Boolean)
- metadata (JSON)
```

---

## Best Practices

### For Users

1. **Use Free Upload Wisely**: Your first upload up to the tier limit is free
2. **Monitor Token Usage**: Check analytics regularly to understand usage patterns
3. **Plan Large Uploads**: Use cost estimation before uploading large files
4. **Consider Multi-Month**: For large files, multi-month processing avoids upfront costs
5. **Upgrade When Needed**: If consistently running low on tokens, consider upgrading

### For Developers

1. **Always Estimate First**: Call `/api/uploads/estimate` before processing
2. **Handle Errors Gracefully**: Provide clear error messages for insufficient balance
3. **Track Token Usage**: Log all token deductions for audit purposes
4. **Implement Retry Logic**: Handle transient failures with exponential backoff
5. **Monitor Performance**: Track processing times and optimize as needed

---

## Troubleshooting

### Common Issues

#### "Insufficient token balance"
- **Solution**: Purchase additional tokens or wait for monthly refresh
- **Alternative**: Use multi-month processing option

#### "File size exceeds tier limit"
- **Solution**: Upgrade to higher tier or split file into smaller parts
- **Alternative**: Process file in multiple uploads

#### "Free upload limit exceeded"
- **Explanation**: Free upload limit applies only to first upload
- **Solution**: Use tokens for subsequent uploads or purchase token package

#### "Subscription expired"
- **Solution**: Renew subscription to continue processing
- **Grace Period**: 7 days grace period before account suspension

---

## Support

For additional support:
- **Email**: support@holovitals.com
- **Documentation**: https://docs.holovitals.com
- **API Status**: https://status.holovitals.com

---

**Last Updated**: January 2025  
**Version**: 1.0.0