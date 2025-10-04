# LightweightChatbotService Documentation

## Overview

The LightweightChatbotService provides fast AI-powered chat responses using GPT-3.5 Turbo for 80% of user queries. It automatically escalates complex queries to heavy-duty analysis when needed.

## Features

- ✅ **Fast Response Time**: <2 seconds average
- ✅ **Cost Efficient**: Uses GPT-3.5 Turbo ($0.50-$1.50 per 1M tokens)
- ✅ **Smart Escalation**: Automatically detects complex queries
- ✅ **Context Management**: Maintains conversation history
- ✅ **Token Optimization**: Intelligent context window management
- ✅ **Streaming Support**: Real-time response streaming
- ✅ **Cost Tracking**: Tracks all API costs
- ✅ **Error Handling**: Robust retry logic and error recovery

## Architecture

```
User Query
    ↓
Query Classification
    ↓
Escalation Check
    ↓
┌─────────────┬─────────────┐
│   Simple    │   Complex   │
│  (80%)      │   (20%)     │
├─────────────┼─────────────┤
│ GPT-3.5     │  Escalate   │
│ Turbo       │  to Heavy   │
│ <2 sec      │  Analysis   │
└─────────────┴─────────────┘
    ↓
Response + Cost Tracking
```

## Usage

### Basic Chat

```typescript
import { LightweightChatbotService } from '@/lib/services/LightweightChatbotService';

const chatbot = new LightweightChatbotService();

const response = await chatbot.chat({
  userId: 'user-123',
  message: 'What is my blood pressure?'
});

console.log(response.content);
// "Your most recent blood pressure reading was 120/80 mmHg, which is in the normal range..."
```

### With Conversation Context

```typescript
const response = await chatbot.chat({
  conversationId: 'conv-123', // Continue existing conversation
  userId: 'user-123',
  message: 'What about my cholesterol?',
  context: {
    includeHistory: true, // Include previous messages
    documentIds: ['doc-1', 'doc-2'], // Reference specific documents
    patientId: 'patient-123'
  }
});
```

### Streaming Response

```typescript
for await (const chunk of chatbot.streamChat({
  userId: 'user-123',
  message: 'Explain my lab results'
})) {
  process.stdout.write(chunk);
}
```

### Get Conversation History

```typescript
const conversation = await chatbot.getConversationHistory('conv-123');

console.log(conversation.messages);
// [
//   { role: 'USER', content: 'What is my blood pressure?' },
//   { role: 'ASSISTANT', content: 'Your blood pressure is...' }
// ]
```

### Get User Conversations

```typescript
const conversations = await chatbot.getUserConversations('user-123');

conversations.forEach(conv => {
  console.log(`${conv.title}: ${conv.messages[0].content}`);
});
```

### Delete Conversation

```typescript
await chatbot.deleteConversation('conv-123');
```

## API Endpoint

### POST /api/chat

Send a message to the chatbot.

**Request:**
```json
{
  "userId": "user-123",
  "message": "What is my blood pressure?",
  "conversationId": "conv-123", // Optional
  "context": {
    "documentIds": ["doc-1"],
    "patientId": "patient-123",
    "includeHistory": true
  }
}
```

**Response:**
```json
{
  "conversationId": "conv-123",
  "messageId": "msg-456",
  "content": "Your blood pressure is 120/80 mmHg...",
  "role": "ASSISTANT",
  "tokens": {
    "prompt": 50,
    "completion": 20,
    "total": 70
  },
  "cost": 0.00105,
  "complexity": "SIMPLE",
  "escalated": false,
  "processingTime": 1234,
  "model": "gpt-3.5-turbo",
  "metadata": {
    "confidence": 0.9,
    "suggestions": [
      "Would you like more information?"
    ]
  }
}
```

### GET /api/chat?conversationId=xxx

Get conversation history.

**Response:**
```json
{
  "id": "conv-123",
  "userId": "user-123",
  "title": "Blood Pressure Discussion",
  "messages": [
    {
      "id": "msg-1",
      "role": "USER",
      "content": "What is my blood pressure?",
      "tokens": 10,
      "createdAt": "2025-09-30T12:00:00Z"
    },
    {
      "id": "msg-2",
      "role": "ASSISTANT",
      "content": "Your blood pressure is...",
      "tokens": 20,
      "createdAt": "2025-09-30T12:00:02Z"
    }
  ],
  "totalTokens": 30,
  "totalCost": 0.00045,
  "isActive": true
}
```

### GET /api/chat?userId=xxx

Get all conversations for a user.

**Response:**
```json
[
  {
    "id": "conv-1",
    "title": "Blood Pressure Discussion",
    "messages": [
      { "content": "Latest message..." }
    ],
    "updatedAt": "2025-09-30T12:00:00Z"
  }
]
```

### DELETE /api/chat?conversationId=xxx

Delete a conversation.

**Response:**
```json
{
  "message": "Conversation deleted successfully"
}
```

## Query Classification

The service automatically classifies queries into four complexity levels:

### SIMPLE
- Single fact questions
- Definition requests
- Normal range queries
- **Examples:**
  - "What is my blood pressure?"
  - "Define hypertension"
  - "What is the normal range for glucose?"

### MODERATE
- Comparison requests
- Historical queries
- Related information
- **Examples:**
  - "Compare my current and previous results"
  - "What's the difference between HDL and LDL?"
  - "Show my blood pressure history"

### COMPLEX
- Multi-document analysis
- Correlation requests
- Predictive queries
- **Examples:**
  - "Analyze all my lab results"
  - "What's the correlation between my diet and cholesterol?"
  - "Predict my risk of diabetes"

### CRITICAL
- Emergency indicators
- Urgent medical concerns
- Life-threatening conditions
- **Examples:**
  - "I'm having chest pain"
  - "Is this result critical?"
  - "Emergency symptoms"

## Escalation Triggers

Queries are escalated to heavy-duty analysis when:

1. **Complexity Score > 0.7**: Query is too complex for quick response
2. **Multiple Documents (≥3)**: Cross-document analysis needed
3. **Temporal Analysis**: Trend analysis over time required
4. **Medical Analysis**: Detailed medical interpretation needed
5. **Uncertainty**: AI confidence < 0.5
6. **User Request**: User explicitly requests detailed analysis

### Escalation Response

When escalated, the chatbot returns:

```json
{
  "escalated": true,
  "escalationReason": "COMPLEXITY",
  "content": "This query requires detailed analysis. I'm creating a comprehensive analysis request...",
  "metadata": {
    "requiresDetailedAnalysis": true
  }
}
```

## Configuration

### Default Configuration

```typescript
{
  model: 'gpt-3.5-turbo',
  maxTokens: 500,
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxContextMessages: 10,
  escalationThreshold: 0.7,
  streamResponse: true
}
```

### Custom Configuration

```typescript
const chatbot = new LightweightChatbotService({
  model: 'gpt-3.5-turbo-16k', // Use 16K context window
  maxTokens: 1000,             // Longer responses
  temperature: 0.5,            // More focused responses
  maxContextMessages: 20       // More conversation history
});
```

## Cost Tracking

All API calls are tracked in the database:

### Token Costs (per 1M tokens)
- **GPT-3.5 Turbo**: $0.50 (prompt) + $1.50 (completion)
- **GPT-4**: $30 (prompt) + $60 (completion)
- **GPT-4 Turbo**: $10 (prompt) + $30 (completion)

### Cost Calculation

```typescript
const cost = 
  (promptTokens / 1000) * promptCost +
  (completionTokens / 1000) * completionCost;
```

### Example Costs

| Query Type | Tokens | Cost |
|------------|--------|------|
| Simple question | 70 | $0.00105 |
| Moderate query | 150 | $0.00225 |
| Complex analysis | 500 | $0.00750 |

## Performance Metrics

### Target Metrics
- **Response Time**: <2 seconds (95th percentile)
- **Escalation Rate**: ~20%
- **Success Rate**: >99%
- **Cost per Query**: <$0.01

### Monitoring

```typescript
// Track metrics in database
await prisma.aIInteraction.create({
  data: {
    userId,
    interactionType: 'CHAT',
    model: 'gpt-3.5-turbo',
    promptTokens,
    completionTokens,
    totalTokens,
    cost,
    responseTime,
    success: true
  }
});
```

## Error Handling

### Automatic Retries

The service automatically retries failed requests up to 3 times with exponential backoff:

```typescript
await withRetry(
  () => createChatCompletion(messages),
  maxRetries: 3,
  delayMs: 1000
);
```

### Error Types

1. **Rate Limit (429)**: Automatic retry with backoff
2. **Authentication (401)**: Immediate failure, check API key
3. **Server Error (500)**: Retry up to 3 times
4. **Timeout**: Retry with increased timeout

### Error Response

```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

## Best Practices

### 1. Use Conversation Context

```typescript
// ✅ Good: Maintain conversation context
const response = await chatbot.chat({
  conversationId: existingConversationId,
  userId,
  message: 'Follow-up question'
});

// ❌ Bad: Start new conversation for every message
const response = await chatbot.chat({
  userId,
  message: 'Follow-up question'
});
```

### 2. Include Relevant Documents

```typescript
// ✅ Good: Reference specific documents
const response = await chatbot.chat({
  userId,
  message: 'Explain my lab results',
  context: {
    documentIds: ['lab-results-2025-09-30']
  }
});
```

### 3. Handle Escalations

```typescript
const response = await chatbot.chat(request);

if (response.escalated) {
  // Queue for heavy-duty analysis
  await analysisQueue.add({
    userId: request.userId,
    query: request.message,
    priority: 'HIGH'
  });
}
```

### 4. Stream Long Responses

```typescript
// ✅ Good: Stream for better UX
for await (const chunk of chatbot.streamChat(request)) {
  updateUI(chunk);
}

// ❌ Bad: Wait for complete response
const response = await chatbot.chat(request);
updateUI(response.content);
```

### 5. Clean Up Resources

```typescript
// Always cleanup when done
await chatbot.cleanup();
```

## Testing

### Run Tests

```bash
npm test
```

### Run with Coverage

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test:watch
```

## Database Schema

### Tables Used

1. **chat_conversations**: Conversation metadata
2. **chat_messages**: Individual messages
3. **ai_interactions**: API call tracking
4. **chatbot_costs**: Cost tracking

### Example Queries

```sql
-- Get conversation with messages
SELECT c.*, m.*
FROM chat_conversations c
LEFT JOIN chat_messages m ON m.conversation_id = c.id
WHERE c.id = 'conv-123'
ORDER BY m.created_at ASC;

-- Get total cost by user
SELECT user_id, SUM(total_cost) as total_cost
FROM chat_conversations
GROUP BY user_id;

-- Get escalation rate
SELECT 
  COUNT(CASE WHEN escalated = true THEN 1 END)::float / COUNT(*) as escalation_rate
FROM chat_messages
WHERE role = 'USER';
```

## Troubleshooting

### Issue: Slow Response Times

**Solution:**
1. Check OpenAI API status
2. Reduce `maxContextMessages`
3. Use streaming for better perceived performance

### Issue: High Costs

**Solution:**
1. Review `maxTokens` setting
2. Implement more aggressive escalation
3. Optimize system prompts
4. Use context truncation

### Issue: Frequent Escalations

**Solution:**
1. Adjust `escalationThreshold`
2. Review query classification logic
3. Improve system prompts
4. Add more training examples

## Future Enhancements

- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Image analysis integration
- [ ] Custom model fine-tuning
- [ ] Advanced caching strategies
- [ ] Conversation summarization
- [ ] Sentiment analysis
- [ ] Intent detection

## Support

For issues or questions:
- GitHub Issues: https://github.com/cloudbyday90/HoloVitals/issues
- Documentation: /docs
- Email: support@holovitals.com