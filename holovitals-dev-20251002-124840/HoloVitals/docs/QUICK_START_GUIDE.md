# HoloVitals UI & AI Architecture - Quick Start Guide

## For Developers

This guide provides a quick overview of the new UI and AI architecture to get you started quickly.

## Architecture at a Glance

### The Big Picture

```
User → Simple UI → Lightweight Chatbot (fast) → [If needed] → Queue → Ephemeral Instance → Heavy Analysis
                                                                              ↓
                                                                         Result → User
```

### Two-Tier AI System

**Tier 1: Lightweight Chatbot**
- Always running
- GPT-3.5 Turbo
- <2 second responses
- Handles 80% of queries
- Cost: $0.002 per interaction

**Tier 2: Heavy Analysis**
- On-demand only
- GPT-4 Turbo / Claude 3 / Llama 3
- 5-30 minute responses
- Handles complex analysis
- Cost: $0.50-$5.00 per analysis

### Key Innovation: Ephemeral Instances

Instead of keeping expensive GPU instances running 24/7:
1. Spin up instance when analysis needed (2-3 min)
2. Run analysis (5-25 min)
3. Terminate instance (<1 min)
4. **Result: 90% cost savings + HIPAA compliance**

## UI Design Philosophy

### Open Design (Not Closed Ecosystem)

**What we DON'T have:**
- ❌ Complex sidebar navigation
- ❌ Multiple nested menus
- ❌ Cluttered dashboards
- ❌ Feature overload

**What we DO have:**
- ✅ Simple top navigation (Logo, Chat, Upload, Profile)
- ✅ AI-first interaction
- ✅ Clean, minimal interface
- ✅ Progressive disclosure

### Core Screens

1. **Dashboard** - Landing page with chat interface
2. **Chat** - Always-accessible AI assistant
3. **Upload** - Document upload section
4. **Settings** - Minimal settings

That's it. Simple.

## Key Files & Services

### Services to Implement

```
services/
├── LightweightChatbotService.ts    # Tier 1 AI (always on)
├── ContextOptimizerService.ts      # Smart prompt splitting
├── AnalysisQueueService.ts         # Task queue management
└── InstanceProvisionerService.ts   # Ephemeral instance lifecycle
```

### UI Components to Build

```
components/
├── Dashboard.tsx                   # Main landing page
├── ChatInterface.tsx               # AI chat component
├── OnboardingFlow.tsx              # 4-step onboarding
├── DocumentUpload.tsx              # Upload interface
└── Settings.tsx                    # User settings
```

### API Routes to Create

```
app/api/
├── chat/route.ts                   # Chatbot endpoint
├── upload/route.ts                 # Document upload
├── analysis/route.ts               # Analysis queue
└── profile/route.ts                # User profile
```

## Database Schema

### New Tables (Add to schema.prisma)

```prisma
// Core tables
ChatConversation      // User chat sessions
ChatMessage           // Individual messages
AnalysisQueue         // Analysis task queue
CloudInstance         // Instance tracking

// Cost tracking
InstanceCost          // Instance costs
ChatbotCost           // Chatbot costs
AnalysisCost          // Analysis costs

// Optimization
PromptOptimization    // Prompt optimization
PromptSplit           // Split prompts
ModelPerformance      // Model metrics
SystemHealth          // Health monitoring
```

See `prisma/schema-ai-extensions.prisma` for full schema.

## Workflow Examples

### Example 1: Simple Question

```
User: "What medications am I taking?"
  ↓
Lightweight Chatbot (GPT-3.5)
  ↓
Response: "You're currently taking..." (<2 seconds)
```

### Example 2: Document Analysis

```
User: "Analyze my latest lab results"
  ↓
Lightweight Chatbot detects need for deep analysis
  ↓
Creates task in AnalysisQueue (priority: NORMAL)
  ↓
ContextOptimizer analyzes document size
  ↓
Selects optimal model (e.g., GPT-4 Turbo)
  ↓
InstanceProvisioner spins up Azure instance
  ↓
Loads model and runs analysis
  ↓
Returns results and terminates instance
  ↓
User receives comprehensive analysis (15 minutes)
```

### Example 3: Large Document (Needs Splitting)

```
User uploads 200-page medical history
  ↓
ContextOptimizer detects: 150k tokens (exceeds context window)
  ↓
Splits into 3 parallel chunks
  ↓
Provisions 3 instances simultaneously
  ↓
Each analyzes its section
  ↓
Results merged and returned
  ↓
User receives complete analysis (20 minutes)
```

## Cost Optimization

### Model Selection Logic

```typescript
if (tokens < 7000) {
  model = 'llama-3-70b';        // Most cost-efficient
} else if (tokens < 100000) {
  model = 'gpt-4-turbo';        // Balanced
} else {
  model = 'claude-3-opus';      // Large context
}
```

### When to Split Prompts

```typescript
if (tokens > contextWindow * 0.8) {
  // Need to split
  if (analysisType.includes('timeline')) {
    strategy = 'sequential';    // Process in order
  } else if (analysisType.includes('compare')) {
    strategy = 'parallel';      // Process simultaneously
  } else {
    strategy = 'hierarchical';  // Summary first, then details
  }
}
```

## HIPAA Compliance Checklist

When implementing any feature, ensure:

- [ ] All PHI encrypted at rest (AES-256-GCM)
- [ ] All PHI encrypted in transit (TLS 1.3)
- [ ] All PHI access logged (audit trail)
- [ ] PHI sanitized before caching
- [ ] Ephemeral instances clear PHI on termination
- [ ] User consent verified before access
- [ ] Minimum necessary principle applied
- [ ] MFA required for authentication

## Development Environment Setup

### 1. Prerequisites

```bash
# Install dependencies
node >= 18.0.0
npm >= 9.0.0
PostgreSQL >= 14
Redis >= 7.0
```

### 2. Clone and Install

```bash
git clone <repository>
cd holovitals
npm install
```

### 3. Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
OPENAI_API_KEY="sk-..."
AZURE_OPENAI_KEY="..."
ANTHROPIC_API_KEY="..."

# Azure credentials
AZURE_SUBSCRIPTION_ID="..."
AZURE_TENANT_ID="..."
AZURE_CLIENT_ID="..."
AZURE_CLIENT_SECRET="..."

# AWS credentials (optional)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

### 4. Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

### HIPAA Compliance Tests

```bash
npm run test:compliance
```

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Azure infrastructure provisioned
- [ ] Monitoring and alerts configured
- [ ] HIPAA compliance verified
- [ ] Security audit completed
- [ ] Load testing passed
- [ ] Disaster recovery tested

### Deploy to Production

```bash
# Build
npm run build

# Deploy (using CI/CD)
git push origin main
```

## Common Tasks

### Add a New Chat Feature

1. Update `LightweightChatbotService.ts`
2. Add new intent detection
3. Implement response logic
4. Test with various inputs
5. Deploy

### Add a New Analysis Type

1. Update `AnalysisQueueService.ts`
2. Add new task type
3. Implement analysis logic
4. Update context optimizer if needed
5. Test end-to-end
6. Deploy

### Optimize Costs

1. Review `ModelPerformance` table
2. Identify expensive operations
3. Implement caching where appropriate
4. Optimize prompt sizes
5. Consider smaller models
6. Monitor cost metrics

## Monitoring

### Key Metrics

```typescript
// Application metrics
- Chat response time (target: <2s)
- Analysis completion time (target: <30min)
- Error rate (target: <0.1%)
- Queue length (target: <10)

// Cost metrics
- Cost per user per month (target: <$10)
- Cost per analysis (target: <$3)
- Infrastructure utilization (target: >70%)

// HIPAA metrics
- Audit log completeness (target: 100%)
- Access violations (target: 0)
- Encryption coverage (target: 100%)
```

### Dashboards

- **Application Dashboard** - Azure Application Insights
- **Infrastructure Dashboard** - Azure Monitor
- **Cost Dashboard** - Azure Cost Management
- **HIPAA Dashboard** - Custom compliance dashboard

## Troubleshooting

### Chat Not Responding

1. Check OpenAI API key
2. Verify API rate limits
3. Check error logs
4. Test with simple query

### Analysis Taking Too Long

1. Check queue length
2. Verify instance provisioning
3. Check model selection
4. Review context optimization

### High Costs

1. Review cost breakdown
2. Check for inefficient queries
3. Verify caching is working
4. Consider smaller models
5. Optimize context windows

### HIPAA Compliance Issues

1. Review audit logs
2. Check encryption status
3. Verify access controls
4. Test PHI sanitization
5. Review consent management

## Resources

### Documentation

- [UI Architecture](./UI_ARCHITECTURE.md)
- [AI Architecture](./AI_ARCHITECTURE.md)
- [Cloud Infrastructure](./CLOUD_INFRASTRUCTURE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

### External Resources

- [Azure Health Data Services](https://azure.microsoft.com/en-us/services/health-data-services/)
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic Claude](https://www.anthropic.com/claude)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/index.html)

## Getting Help

### Internal

- **Architecture Questions** - Review documentation
- **Implementation Help** - Check code examples
- **HIPAA Questions** - Consult compliance officer

### External

- **Azure Support** - Azure Portal
- **OpenAI Support** - Platform support
- **Community** - Stack Overflow, GitHub Discussions

## Next Steps

1. **Review architecture documents** - Understand the system
2. **Set up development environment** - Get coding
3. **Start with Phase 2** - Database setup
4. **Build incrementally** - One feature at a time
5. **Test thoroughly** - Especially HIPAA compliance
6. **Deploy carefully** - Follow deployment checklist

---

**Remember:** Keep it simple, keep it secure, keep it HIPAA-compliant.

Good luck! 🚀