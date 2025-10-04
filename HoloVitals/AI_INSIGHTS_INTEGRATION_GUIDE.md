# AI Health Insights - Integration Guide

## 🎯 Overview

This guide provides step-by-step instructions for integrating the AI-Powered Health Insights Dashboard into the HoloVitals platform.

## 📋 Prerequisites

### Required Dependencies
```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "next": "^14.0.0",
    "next-auth": "^4.24.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "lucide-react": "^0.263.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0"
  }
}
```

### Environment Setup
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/holovitals"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional: API Keys for external services
# (None required for basic functionality)
```

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
cd HoloVitals
npm install
```

### Step 2: Database Setup

The AI Insights system uses existing database tables. No new migrations are required, but ensure your database has the following tables:

**Required Tables:**
- `Patient`
- `VitalSigns`
- `LabResult`
- `Medication`
- `Condition`
- `Allergy`

**Verify Schema:**
```bash
npx prisma db pull
npx prisma generate
```

### Step 3: Verify File Structure

Ensure all files are in the correct locations:

```
HoloVitals/
├── lib/
│   ├── types/
│   │   └── ai-insights.ts
│   └── services/
│       └── ai/
│           ├── HealthRiskAssessmentService.ts
│           ├── TrendAnalysisService.ts
│           ├── MedicationInteractionService.ts
│           ├── LabResultInterpreterService.ts
│           ├── PersonalizedRecommendationsService.ts
│           └── AIHealthInsightsService.ts
├── app/
│   ├── api/
│   │   └── ai-insights/
│   │       ├── health-score/
│   │       │   └── route.ts
│   │       ├── risk-assessment/
│   │       │   └── route.ts
│   │       ├── trends/
│   │       │   └── route.ts
│   │       ├── recommendations/
│   │       │   └── route.ts
│   │       ├── medication-interactions/
│   │       │   └── route.ts
│   │       ├── lab-interpretation/
│   │       │   └── route.ts
│   │       └── generate/
│   │           └── route.ts
│   └── (dashboard)/
│       └── ai-insights/
│           └── page.tsx
└── components/
    └── ai-insights/
        ├── HealthScoreCard.tsx
        ├── RiskAssessmentCard.tsx
        ├── TrendChart.tsx
        ├── RecommendationsPanel.tsx
        ├── MedicationInteractionsCard.tsx
        └── InsightsTimeline.tsx
```

### Step 4: Update Navigation

Add AI Insights to your dashboard navigation:

**File:** `app/(dashboard)/layout.tsx` or navigation component

```tsx
import { Sparkles } from 'lucide-react';

const navigationItems = [
  // ... existing items
  {
    name: 'AI Insights',
    href: '/ai-insights',
    icon: Sparkles,
  },
];
```

### Step 5: Configure Authentication

Ensure NextAuth is properly configured to protect AI Insights routes:

**File:** `middleware.ts`

```typescript
export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/ai-insights/:path*',
    // ... other protected routes
  ],
};
```

## 🔧 Configuration

### 1. Patient ID Resolution

Update the dashboard to use actual patient IDs:

**File:** `app/(dashboard)/ai-insights/page.tsx`

```typescript
// Replace placeholder with actual patient ID resolution
useEffect(() => {
  if (session?.user) {
    // Option 1: Get from session
    const patientId = session.user.patientId;
    
    // Option 2: Get from route params
    // const patientId = searchParams.get('patientId');
    
    // Option 3: Get from context
    // const patientId = usePatientContext();
    
    setSelectedPatientId(patientId);
    loadInsights(patientId);
  }
}, [session]);
```

### 2. Customize Risk Thresholds

Adjust risk assessment thresholds if needed:

**File:** `lib/services/ai/HealthRiskAssessmentService.ts`

```typescript
// Customize these values based on your clinical guidelines
private determineRiskLevel(probability: number): RiskLevel {
  if (probability >= 75) return 'critical';  // Adjust threshold
  if (probability >= 50) return 'high';      // Adjust threshold
  if (probability >= 25) return 'moderate';  // Adjust threshold
  return 'low';
}
```

### 3. Configure Timeframes

Adjust default timeframes for trend analysis:

**File:** `app/(dashboard)/ai-insights/page.tsx`

```typescript
const loadInsights = async (patientId: string) => {
  // Customize default timeframe
  const response = await fetch('/api/ai-insights/generate', {
    method: 'POST',
    body: JSON.stringify({
      patientId,
      timeframe: '90-days', // Options: '7-days', '30-days', '90-days', '6-months', '1-year'
      // ... other options
    }),
  });
};
```

### 4. Customize UI Theme

Adjust colors and styling to match your brand:

**File:** `components/ai-insights/HealthScoreCard.tsx`

```typescript
const getScoreColor = (score: number) => {
  // Customize color scheme
  if (score >= 90) return 'text-green-600';   // Excellent
  if (score >= 75) return 'text-blue-600';    // Good
  if (score >= 60) return 'text-yellow-600';  // Fair
  if (score >= 40) return 'text-orange-600';  // Poor
  return 'text-red-600';                       // Critical
};
```

## 🔌 API Integration

### Using the AI Insights API

#### 1. Generate Comprehensive Insights

```typescript
const generateInsights = async (patientId: string) => {
  const response = await fetch('/api/ai-insights/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientId,
      includeRiskAssessment: true,
      includeTrendAnalysis: true,
      includeMedicationInteraction: true,
      includeLabInterpretation: true,
      includeRecommendations: true,
      timeframe: '90-days',
    }),
  });

  const data = await response.json();
  return data;
};
```

#### 2. Get Health Score Only

```typescript
const getHealthScore = async (patientId: string) => {
  const response = await fetch(
    `/api/ai-insights/health-score?patientId=${patientId}`
  );
  const data = await response.json();
  return data.data; // HealthScore object
};
```

#### 3. Analyze Specific Trend

```typescript
const analyzeTrend = async (
  patientId: string,
  metric: string,
  timeframe: string = '90-days'
) => {
  const response = await fetch(
    `/api/ai-insights/trends?patientId=${patientId}&metric=${metric}&timeframe=${timeframe}`
  );
  const data = await response.json();
  return data.data; // TrendAnalysis object
};
```

#### 4. Update Recommendation Status

```typescript
const updateRecommendation = async (
  recommendationId: string,
  status: 'pending' | 'in-progress' | 'completed' | 'dismissed',
  notes?: string
) => {
  const response = await fetch('/api/ai-insights/recommendations', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recommendationId,
      status,
      notes,
    }),
  });

  return response.json();
};
```

## 🎨 UI Component Integration

### Using Individual Components

#### 1. Health Score Card

```tsx
import { HealthScoreCard } from '@/components/ai-insights/HealthScoreCard';

function MyDashboard() {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);

  return (
    <HealthScoreCard
      healthScore={healthScore}
      loading={!healthScore}
    />
  );
}
```

#### 2. Risk Assessment Card

```tsx
import { RiskAssessmentCard } from '@/components/ai-insights/RiskAssessmentCard';

function RiskDashboard() {
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);

  const handleViewDetails = (risk: HealthRisk) => {
    // Handle risk detail view
    console.log('Viewing risk:', risk);
  };

  return (
    <RiskAssessmentCard
      riskAssessment={riskAssessment}
      loading={!riskAssessment}
      onViewDetails={handleViewDetails}
    />
  );
}
```

#### 3. Trend Chart

```tsx
import { TrendChart } from '@/components/ai-insights/TrendChart';

function TrendsDashboard() {
  const [trends, setTrends] = useState<TrendAnalysis[]>([]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {trends.map((trend, index) => (
        <TrendChart key={index} trend={trend} />
      ))}
    </div>
  );
}
```

#### 4. Recommendations Panel

```tsx
import { RecommendationsPanel } from '@/components/ai-insights/RecommendationsPanel';

function RecommendationsDashboard() {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendations | null>(null);

  const handleUpdateStatus = async (recommendationId: string, status: string) => {
    await updateRecommendation(recommendationId, status);
    // Refresh recommendations
  };

  return (
    <RecommendationsPanel
      recommendations={recommendations}
      loading={!recommendations}
      onUpdateStatus={handleUpdateStatus}
    />
  );
}
```

## 🔐 Security Considerations

### 1. Authentication

Ensure all API routes are protected:

```typescript
// In API route
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

### 2. Data Access Control

Verify patient ownership before returning data:

```typescript
// Verify patient belongs to user
const patient = await prisma.patient.findUnique({
  where: {
    id: patientId,
    userId: session.user.id, // Ensure user owns this patient
  },
});

if (!patient) {
  return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
}
```

### 3. Input Validation

Validate all inputs:

```typescript
import { z } from 'zod';

const requestSchema = z.object({
  patientId: z.string().uuid(),
  timeframe: z.enum(['7-days', '30-days', '90-days', '6-months', '1-year']),
});

const body = requestSchema.parse(await request.json());
```

### 4. Rate Limiting

Implement rate limiting for API endpoints:

```typescript
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    await limiter.check(request, 10); // 10 requests per minute
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  // ... rest of handler
}
```

## 📊 Monitoring & Logging

### 1. Performance Monitoring

Track API performance:

```typescript
const startTime = Date.now();

// ... process insights

const processingTime = Date.now() - startTime;
console.log(`Insights generated in ${processingTime}ms`);

// Log to monitoring service
await logMetric('ai_insights_generation_time', processingTime);
```

### 2. Error Logging

Log errors for debugging:

```typescript
try {
  // ... process insights
} catch (error) {
  console.error('AI Insights error:', error);
  
  // Log to error tracking service
  await logError('ai_insights_error', {
    error: error.message,
    patientId,
    timestamp: new Date(),
  });
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### 3. Audit Logging

Log all access for HIPAA compliance:

```typescript
import { AuditLoggingService } from '@/lib/services/AuditLoggingService';

await AuditLoggingService.logAccess({
  userId: session.user.id,
  patientId,
  action: 'view_ai_insights',
  resource: 'ai_insights_dashboard',
  timestamp: new Date(),
});
```

## 🧪 Testing Integration

### 1. Unit Tests

Test individual services:

```typescript
import { HealthRiskAssessmentService } from '@/lib/services/ai/HealthRiskAssessmentService';

describe('HealthRiskAssessmentService', () => {
  it('should calculate cardiovascular risk', async () => {
    const risk = await HealthRiskAssessmentService.generateRiskAssessment('patient-123');
    expect(risk).toBeDefined();
    expect(risk.risks.length).toBeGreaterThan(0);
  });
});
```

### 2. Integration Tests

Test API endpoints:

```typescript
import { createMocks } from 'node-mocks-http';

describe('/api/ai-insights/health-score', () => {
  it('should return health score', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { patientId: 'patient-123' },
    });

    await GET(req);
    expect(res._getStatusCode()).toBe(200);
  });
});
```

### 3. E2E Tests

Test user workflows:

```typescript
import { test, expect } from '@playwright/test';

test('should view AI insights', async ({ page }) => {
  await page.goto('/ai-insights');
  await expect(page.locator('h1')).toContainText('AI Health Insights');
  await expect(page.locator('[data-testid="health-score"]')).toBeVisible();
});
```

## 🚀 Deployment

### 1. Build Application

```bash
npm run build
```

### 2. Run Database Migrations

```bash
npx prisma migrate deploy
```

### 3. Start Production Server

```bash
npm run start
```

### 4. Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Test AI insights endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/ai-insights/health-score?patientId=patient-123
```

## 📈 Performance Optimization

### 1. Database Indexing

Add indexes for frequently queried fields:

```sql
CREATE INDEX idx_vital_signs_patient_date ON "VitalSigns"("patientId", "recordedAt" DESC);
CREATE INDEX idx_lab_results_patient_date ON "LabResult"("patientId", "resultDate" DESC);
CREATE INDEX idx_medications_patient_status ON "Medication"("patientId", "status");
```

### 2. Caching

Implement caching for insights:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

// Cache insights for 1 hour
const cacheKey = `insights:${patientId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return cached;
}

const insights = await generateInsights(patientId);
await redis.set(cacheKey, insights, { ex: 3600 });

return insights;
```

### 3. Parallel Processing

Process insights in parallel:

```typescript
const [healthScore, riskAssessment, trends] = await Promise.all([
  calculateHealthScore(patientId),
  generateRiskAssessment(patientId),
  analyzeTrends(patientId),
]);
```

## 🔄 Maintenance

### 1. Regular Updates

- Update clinical guidelines quarterly
- Review and update risk thresholds
- Add new drug interactions
- Update reference ranges

### 2. Monitoring

- Track API response times
- Monitor error rates
- Review user feedback
- Analyze usage patterns

### 3. Backup

- Regular database backups
- Configuration backups
- Code repository backups

## 📞 Support

### Getting Help

1. **Documentation:** Review this guide and API documentation
2. **GitHub Issues:** Report bugs or request features
3. **Community:** Join discussions and ask questions
4. **Support Email:** support@holovitals.com

### Common Issues

#### Issue: "Patient not found"
**Solution:** Verify patient ID and user permissions

#### Issue: "Insufficient data for analysis"
**Solution:** Ensure patient has recent vital signs and lab results

#### Issue: "Slow performance"
**Solution:** Check database indexes and implement caching

## ✅ Integration Checklist

- [ ] Dependencies installed
- [ ] Database schema verified
- [ ] Files in correct locations
- [ ] Navigation updated
- [ ] Authentication configured
- [ ] Patient ID resolution implemented
- [ ] API endpoints tested
- [ ] UI components integrated
- [ ] Security measures implemented
- [ ] Monitoring configured
- [ ] Tests written and passing
- [ ] Documentation reviewed
- [ ] Deployment successful

## 🎉 Next Steps

After successful integration:

1. **User Training:** Train staff on using AI insights
2. **Feedback Collection:** Gather user feedback
3. **Optimization:** Monitor and optimize performance
4. **Feature Enhancement:** Plan additional features
5. **Clinical Validation:** Validate insights with clinical team

---

**Integration Status:** Ready for Production
**Last Updated:** 2025-10-01
**Version:** 1.0.0