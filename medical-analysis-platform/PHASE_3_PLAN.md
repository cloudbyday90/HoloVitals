# Phase 3: Service Implementation Plan

## Overview
Implement the four core services that enable HoloVitals' AI-powered medical document analysis with intelligent cost optimization.

---

## Service 1: LightweightChatbotService ⏳

### Purpose
Fast AI responses for 80% of user queries using GPT-3.5 Turbo, with automatic escalation to heavy-duty analysis when needed.

### Key Features
- ✅ <2 second response time
- ✅ Uses GPT-3.5 Turbo for cost efficiency
- ✅ Conversation context management
- ✅ Query classification (simple vs complex)
- ✅ Automatic escalation triggers
- ✅ Response streaming support
- ✅ Error handling and retries

### Implementation Tasks
- [ ] Create service class structure
- [ ] Integrate OpenAI API
- [ ] Implement conversation context management
- [ ] Add query classification logic
- [ ] Build escalation triggers
- [ ] Add response streaming
- [ ] Implement error handling
- [ ] Create API endpoints
- [ ] Write unit tests
- [ ] Add integration tests

### Files to Create
1. `lib/services/LightweightChatbotService.ts` - Main service
2. `lib/types/chatbot.ts` - Type definitions
3. `app/api/chat/route.ts` - API endpoint
4. `lib/utils/openai.ts` - OpenAI client wrapper
5. `__tests__/services/LightweightChatbotService.test.ts` - Tests

### Database Tables Used
- `chat_conversations`
- `chat_messages`
- `ai_interactions`
- `chatbot_costs`

### Estimated Time: 2-3 days

---

## Service 2: ContextOptimizerService ⏳

### Purpose
Reduce token usage by 40% through intelligent context management and relevance scoring.

### Key Features
- ✅ Smart document chunking
- ✅ Relevance scoring for context selection
- ✅ Token counting and optimization
- ✅ Context window management (4K, 8K, 16K, 32K)
- ✅ Context compression
- ✅ Performance metrics tracking

### Implementation Tasks
- [ ] Create context analysis engine
- [ ] Implement relevance scoring algorithm
- [ ] Build token counting utilities
- [ ] Add context compression logic
- [ ] Create context caching system
- [ ] Implement performance metrics
- [ ] Create API endpoints
- [ ] Write unit tests
- [ ] Add integration tests

### Files to Create
1. `lib/services/ContextOptimizerService.ts` - Main service
2. `lib/types/context.ts` - Type definitions
3. `lib/utils/tokenCounter.ts` - Token counting utilities
4. `lib/utils/relevanceScorer.ts` - Relevance scoring
5. `__tests__/services/ContextOptimizerService.test.ts` - Tests

### Database Tables Used
- `prompt_optimizations`
- `prompt_splits`
- `document_embeddings`

### Estimated Time: 2-3 days

---

## Service 3: AnalysisQueueService ⏳

### Purpose
Priority-based task management for heavy AI analysis with status tracking and result storage.

### Key Features
- ✅ Priority queue (URGENT, HIGH, NORMAL, LOW)
- ✅ Status tracking (PENDING → ANALYZING → COMPLETED)
- ✅ Missing data identification
- ✅ Result storage and retrieval
- ✅ Performance metrics
- ✅ Queue monitoring

### Implementation Tasks
- [ ] Create queue management system
- [ ] Implement priority scoring algorithm
- [ ] Build status tracking
- [ ] Add missing data detection
- [ ] Create result storage system
- [ ] Implement queue monitoring
- [ ] Create API endpoints
- [ ] Write unit tests
- [ ] Add integration tests

### Files to Create
1. `lib/services/AnalysisQueueService.ts` - Main service
2. `lib/types/queue.ts` - Type definitions
3. `app/api/analysis/queue/route.ts` - API endpoint
4. `lib/utils/priorityScorer.ts` - Priority scoring
5. `__tests__/services/AnalysisQueueService.test.ts` - Tests

### Database Tables Used
- `analysis_queue`
- `analysis_sessions`
- `analysis_costs`

### Estimated Time: 2-3 days

---

## Service 4: InstanceProvisionerService ⏳

### Purpose
Ephemeral cloud instance management for cost-optimized GPU provisioning with automatic cleanup.

### Key Features
- ✅ On-demand GPU instance provisioning
- ✅ Automatic termination after analysis
- ✅ Cost tracking and optimization
- ✅ Health monitoring
- ✅ 90% cost savings vs always-on instances
- ✅ Instance pooling for efficiency

### Implementation Tasks
- [ ] Create cloud provider integration (Azure/AWS)
- [ ] Implement instance lifecycle management
- [ ] Build cost tracking system
- [ ] Add health monitoring
- [ ] Create automatic cleanup logic
- [ ] Implement instance pooling
- [ ] Create API endpoints
- [ ] Write unit tests
- [ ] Add integration tests

### Files to Create
1. `lib/services/InstanceProvisionerService.ts` - Main service
2. `lib/types/instance.ts` - Type definitions
3. `lib/providers/azure.ts` - Azure provider
4. `lib/providers/aws.ts` - AWS provider
5. `app/api/instances/route.ts` - API endpoint
6. `__tests__/services/InstanceProvisionerService.test.ts` - Tests

### Database Tables Used
- `cloud_instances`
- `instance_costs`

### Estimated Time: 3-4 days

---

## Implementation Timeline

### Week 1: Foundation Services
**Days 1-3:** LightweightChatbotService
- Day 1: Service structure, OpenAI integration
- Day 2: Context management, query classification
- Day 3: Escalation, streaming, testing

**Days 4-6:** ContextOptimizerService
- Day 4: Context analysis, relevance scoring
- Day 5: Token counting, compression
- Day 6: Caching, metrics, testing

### Week 2: Advanced Services
**Days 7-9:** AnalysisQueueService
- Day 7: Queue management, priority scoring
- Day 8: Status tracking, result storage
- Day 9: Monitoring, testing

**Days 10-13:** InstanceProvisionerService
- Day 10: Cloud provider integration
- Day 11: Lifecycle management, cost tracking
- Day 12: Health monitoring, cleanup
- Day 13: Instance pooling, testing

### Week 3: Integration & Testing
**Days 14-16:** Integration
- Day 14: Service integration
- Day 15: End-to-end testing
- Day 16: Performance optimization

**Days 17-18:** Documentation & Deployment
- Day 17: Documentation
- Day 18: Deployment preparation

---

## Success Criteria

### Performance Metrics
- ✅ Chatbot response time: <2 seconds
- ✅ Token reduction: 40%
- ✅ Cloud cost savings: 90%
- ✅ Queue processing time: <30 seconds
- ✅ Instance provisioning: <5 minutes

### Quality Metrics
- ✅ Unit test coverage: >80%
- ✅ Integration test coverage: >70%
- ✅ API response time: <500ms
- ✅ Error rate: <1%
- ✅ Uptime: >99.9%

### Code Quality
- ✅ TypeScript strict mode
- ✅ ESLint passing
- ✅ No console errors
- ✅ Proper error handling
- ✅ Comprehensive logging

---

## Dependencies

### Required Packages
```json
{
  "openai": "^5.23.2",           // Already installed
  "@prisma/client": "^6.16.3",   // Already installed
  "tiktoken": "^1.0.10",         // For token counting
  "@azure/arm-compute": "^21.0.0", // Azure SDK
  "aws-sdk": "^2.1500.0"         // AWS SDK
}
```

### Environment Variables Needed
```env
OPENAI_API_KEY=your_key_here
AZURE_SUBSCRIPTION_ID=your_id
AZURE_CLIENT_ID=your_id
AZURE_CLIENT_SECRET=your_secret
AZURE_TENANT_ID=your_tenant
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
```

---

## Current Status

- ✅ Phase 1: Documentation (Complete)
- ✅ Phase 2: Repository Architecture (Complete)
- ✅ Phase 3: Authentication & Consent (Complete)
- ✅ Phase 4: Patient Repository (Complete)
- ✅ Phase 5: Configuration & Maintenance (Complete)
- ✅ Phase 6: Database Setup (Complete)
- ⏳ **Phase 7: Service Implementation (In Progress)**

**Next Step:** Start implementing LightweightChatbotService

---

## Notes

- All services will use the existing Prisma schema
- Services will be built with TypeScript strict mode
- Each service will have comprehensive error handling
- All services will include logging and monitoring
- Services will be designed for horizontal scaling
- Cost tracking will be built into all AI operations