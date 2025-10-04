# HoloVitals Repository Architecture

## Overview

HoloVitals uses a sophisticated repository architecture that separates concerns and ensures HIPAA compliance while maintaining high performance and accuracy. The system consists of three core repositories coordinated by a central coordinator.

## Core Repositories

### 1. AI Analysis Repository

**Purpose:** Actively analyzes data and seeks the missing pieces of the "puzzle" that need to be analyzed.

**Key Responsibilities:**
- Store analysis tasks and their status
- Track what data is being analyzed
- Identify missing pieces needed for complete analysis
- Manage analysis queue and priorities
- Store analysis results and insights

**Data Stored:**
- Patient ID (anonymized)
- Document IDs being analyzed
- Query/question being asked
- Context from Context Cache
- Optimized prompt from Prompt Optimization
- Analysis status and results
- Missing data pieces
- Priority scores

**Key Features:**
- **Task Queue Management:** Prioritizes urgent analyses
- **Missing Piece Detection:** Identifies what data is needed
- **Status Tracking:** Monitors analysis progress
- **Result Storage:** Maintains analysis history
- **Performance Metrics:** Tracks processing times and success rates

**Example Usage:**
```typescript
// Create analysis task
const task = await aiAnalysisRepository.createTask(
  patientId,
  ['doc1', 'doc2'],
  'What are the abnormal values in my bloodwork?'
);

// Check for missing pieces
const missing = await aiAnalysisRepository.identifyMissingPieces(task.id);

// Complete analysis
await aiAnalysisRepository.completeTask(task.id, result);
```

### 2. AI Prompt Optimization Repository

**Purpose:** Optimizes current and future prompts to ensure relevance, cost-efficiency, and performance.

**Key Responsibilities:**
- Store and manage prompt templates
- Optimize prompts for token efficiency
- Track prompt performance metrics
- Suggest best prompts for specific use cases
- Continuously improve prompts based on feedback

**Data Stored:**
- Prompt templates by category
- Optimization metrics (tokens, cost, performance)
- Performance history
- Variable definitions
- Version history

**Key Features:**
- **Token Optimization:** Reduces unnecessary verbosity
- **Performance Tracking:** Monitors success rates and response times
- **Cost Management:** Minimizes API costs
- **Template Versioning:** Maintains prompt evolution
- **Category-Based Selection:** Chooses best prompt for task

**Optimization Metrics:**
- Average token count
- Average response time
- Success rate
- Cost per execution
- Relevance score
- Clarity score
- Efficiency score
- Overall optimization score

**Example Usage:**
```typescript
// Get best prompt for analysis type
const prompt = await aiPromptOptimizationRepository.getBestPrompt('trend_analysis');

// Optimize existing prompt
const optimized = await aiPromptOptimizationRepository.optimizePrompt({
  promptId: prompt.id,
  context: 'bloodwork analysis',
  targetMetrics: { maxTokens: 1000 }
});

// Record performance
await aiPromptOptimizationRepository.recordPerformance(prompt.id, {
  timestamp: new Date(),
  tokensUsed: 850,
  responseTime: 2500,
  success: true,
  userFeedback: 5
});
```

### 3. AI Context Cache Repository

**Purpose:** Stores and provides necessary context while maintaining HIPAA compliance by removing all PII/PHI.

**Key Responsibilities:**
- Store sanitized patient context
- Sort context by importance
- Provide relevant context for analysis
- Automatically remove PII/PHI
- Reanalyze importance after new data
- Manage cache size and expiration

**Data Stored:**
- Sanitized medical history
- Test results (de-identified)
- Medications and allergies (anonymized)
- Trends and correlations
- Clinical notes (sanitized)
- Importance scores

**Key Features:**
- **HIPAA Compliance:** Automatic PII/PHI removal
- **Importance Scoring:** Ranks context by relevance
- **Automatic Reanalysis:** Updates importance scores
- **Smart Caching:** Evicts least important entries
- **Context Retrieval:** Provides sorted, relevant context

**Importance Factors:**
- **Recency:** How recent is the data (25% weight)
- **Frequency:** How often is it accessed (20% weight)
- **Relevance:** How relevant to current analysis (30% weight)
- **Completeness:** How complete is the data (15% weight)
- **Accuracy:** Data quality score (10% weight)

**HIPAA Sanitization:**
Removes all:
- Names (first, last, full)
- Social Security Numbers
- Email addresses
- Phone numbers
- Addresses
- Dates of birth
- Medical record numbers
- Account numbers
- Biometric identifiers
- Photos and images
- IP addresses
- Any other PII/PHI

**Example Usage:**
```typescript
// Add patient data (automatically sanitized)
await aiContextCacheRepository.addPatientContext(
  patientId,
  'test_results',
  rawBloodworkData,
  { source: documentId, tags: ['bloodwork'] }
);

// Get context for analysis
const context = await aiContextCacheRepository.getContextForAnalysis(
  patientId,
  'bloodwork',
  20 // max entries
);

// Reanalyze importance
await aiContextCacheRepository.reanalyzeImportance();
```

## Repository Coordinator

**Purpose:** Orchestrates all three repositories to provide seamless analysis workflow.

**Key Responsibilities:**
- Initialize all repositories
- Coordinate data flow between repositories
- Submit and execute analysis requests
- Manage system health
- Update context with new results

**Workflow:**

```
User Request
     ↓
Repository Coordinator
     ↓
1. Gather Context (Context Cache Repository)
     ↓
2. Get Optimized Prompt (Prompt Optimization Repository)
     ↓
3. Create Analysis Task (Analysis Repository)
     ↓
4. Execute Analysis
     ↓
5. Update Context with Results
     ↓
Return Results to User
```

**Example Usage:**
```typescript
// Initialize system
await repositoryCoordinator.initialize();

// Submit analysis
const response = await repositoryCoordinator.submitAnalysis({
  patientId: 'patient123',
  documentIds: ['doc1', 'doc2'],
  query: 'What are my abnormal values?',
  analysisType: 'bloodwork'
});

// Execute analysis
const result = await repositoryCoordinator.executeAnalysis(response.taskId);

// Check system health
const health = await repositoryCoordinator.getSystemHealth();
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Repository Coordinator                          │
│  • Orchestrates all repositories                            │
│  • Manages data flow                                        │
│  • Ensures HIPAA compliance                                 │
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Context Cache   │ │ Prompt Optimizer │ │ Analysis Repo    │
│  Repository      │ │ Repository       │ │                  │
│                  │ │                  │ │                  │
│ • Sanitized      │ │ • Optimized      │ │ • Active         │
│   Context        │ │   Prompts        │ │   Analysis       │
│ • Importance     │ │ • Performance    │ │ • Task Queue     │
│   Scores         │ │   Metrics        │ │ • Results        │
│ • HIPAA          │ │ • Cost           │ │ • Missing        │
│   Compliant      │ │   Efficiency     │ │   Pieces         │
└──────────────────┘ └──────────────────┘ └──────────────────┘
         ↓                    ↓                    ↓
┌─────────────────────────────────────────────────────────────┐
│                    AI Analysis Engine                        │
│              (OpenAI GPT-4 Integration)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Analysis Results                          │
│  • Insights • Recommendations • Flags • Sources             │
└─────────────────────────────────────────────────────────────┘
```

## HIPAA Compliance

### Sanitization Process

1. **Input Validation:**
   - All data entering Context Cache is sanitized
   - PII/PHI fields are identified and removed
   - Patterns (SSN, phone, email) are detected and redacted

2. **Storage:**
   - Only sanitized data is stored in cache
   - Patient IDs are anonymized/hashed
   - No direct identifiers remain

3. **Validation:**
   - Data is validated before use
   - Compliance checks run automatically
   - Issues are flagged and logged

4. **Audit:**
   - All sanitization events are logged
   - Compliance metrics are tracked
   - Regular audits ensure ongoing compliance

### Sanitization Example

**Before Sanitization:**
```json
{
  "patientName": "John Doe",
  "dateOfBirth": "1980-05-15",
  "ssn": "123-45-6789",
  "email": "john.doe@email.com",
  "phone": "555-123-4567",
  "address": "123 Main St, City, State 12345",
  "testResults": {
    "hemoglobin": 14.5,
    "wbc": 7.2
  }
}
```

**After Sanitization:**
```json
{
  "testResults": {
    "hemoglobin": 14.5,
    "wbc": 7.2
  }
}
```

**Sanitization Info:**
```json
{
  "removedFields": [
    "patientName",
    "dateOfBirth",
    "ssn",
    "email",
    "phone",
    "address"
  ],
  "sanitizationLevel": "full",
  "timestamp": "2025-09-30T12:00:00Z"
}
```

## Performance Optimization

### Context Cache Optimization

1. **Importance-Based Caching:**
   - High-importance items stay in cache longer
   - Low-importance items are evicted first
   - Automatic reanalysis updates scores

2. **Access Patterns:**
   - Frequently accessed items get higher scores
   - Recent items are prioritized
   - Stale data is automatically removed

3. **Size Management:**
   - Maximum cache size enforced
   - Automatic eviction when full
   - Configurable TTL (Time To Live)

### Prompt Optimization

1. **Token Reduction:**
   - Remove redundant phrases
   - Simplify verbose instructions
   - Maintain clarity while reducing length

2. **Performance Tracking:**
   - Monitor token usage
   - Track response times
   - Measure success rates

3. **Continuous Improvement:**
   - Learn from feedback
   - Update templates based on performance
   - Version control for prompts

## Monitoring & Health

### Health Metrics

Each repository provides health metrics:

```typescript
interface RepositoryHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  metrics: {
    itemCount: number;
    storageUsed: number;
    averageResponseTime: number;
  };
  issues?: string[];
}
```

### System Health

Overall system health aggregates all repositories:

```typescript
const health = await repositoryCoordinator.getSystemHealth();
// Returns:
// {
//   overall: 'healthy',
//   repositories: {
//     analysis: { status: 'healthy', ... },
//     promptOptimization: { status: 'healthy', ... },
//     contextCache: { status: 'healthy', ... }
//   },
//   timestamp: Date
// }
```

## Best Practices

### 1. Always Use Coordinator

```typescript
// ✅ Good
await repositoryCoordinator.submitAnalysis(request);

// ❌ Bad - Don't access repositories directly
await aiAnalysisRepository.createTask(...);
```

### 2. Check System Health

```typescript
// Regular health checks
const health = await repositoryCoordinator.getSystemHealth();
if (health.overall !== 'healthy') {
  console.warn('System health degraded:', health);
}
```

### 3. Handle Missing Pieces

```typescript
const response = await repositoryCoordinator.submitAnalysis(request);
if (response.missingPieces && response.missingPieces.length > 0) {
  // Inform user about missing data
  console.log('Missing:', response.missingPieces);
}
```

### 4. Monitor Performance

```typescript
// Track prompt performance
await aiPromptOptimizationRepository.recordPerformance(promptId, {
  timestamp: new Date(),
  tokensUsed: result.tokensUsed,
  responseTime: result.processingTime,
  success: true,
  userFeedback: 5
});
```

## Configuration

### Environment Variables

```env
# Context Cache Configuration
CONTEXT_CACHE_MAX_SIZE=10000
CONTEXT_CACHE_TTL=86400000  # 24 hours in ms
CONTEXT_REANALYSIS_INTERVAL=3600000  # 1 hour in ms

# Prompt Optimization Configuration
PROMPT_OPTIMIZATION_ENABLED=true
PROMPT_MAX_TOKENS=2000

# Analysis Configuration
ANALYSIS_QUEUE_MAX_SIZE=1000
ANALYSIS_PRIORITY_THRESHOLD=7
```

## Future Enhancements

### Planned Features

1. **Vector Embeddings:**
   - Semantic similarity search
   - Better context matching
   - Improved relevance scoring

2. **Machine Learning:**
   - Predictive importance scoring
   - Automated prompt optimization
   - Pattern recognition

3. **Advanced Analytics:**
   - Usage patterns analysis
   - Cost optimization insights
   - Performance predictions

4. **Multi-Tenant Support:**
   - Organization-level caching
   - Shared prompt templates
   - Aggregated analytics

## Conclusion

The HoloVitals repository architecture provides a robust, HIPAA-compliant, and efficient system for medical document analysis. By separating concerns into three specialized repositories and coordinating them centrally, the system maintains high performance while ensuring data privacy and cost efficiency.