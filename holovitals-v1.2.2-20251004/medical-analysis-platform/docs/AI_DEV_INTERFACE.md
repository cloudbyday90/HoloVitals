# AI Development Interface Documentation

## Overview

The AI Development Interface provides a flexible, multi-provider AI chat system specifically designed for development assistance. It supports both OpenAI (GPT models) and Anthropic (Claude models) with easy switching between providers.

## Features

### Multi-Provider Support
- ✅ **OpenAI**: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo, GPT-4o
- ✅ **Claude**: Claude 3 Opus, Sonnet, Haiku, Claude 3.5 Sonnet
- 🔄 **Extensible**: Easy to add more providers (Gemini, Llama, etc.)

### Development Modes
- **CODE_GENERATION**: Generate clean, efficient code
- **DEBUGGING**: Identify and fix bugs
- **ARCHITECTURE**: Design system architectures
- **DOCUMENTATION**: Create technical documentation
- **CODE_REVIEW**: Review code quality and security
- **TEST_GENERATION**: Generate comprehensive tests
- **REFACTORING**: Improve code quality
- **GENERAL**: General development assistance

### Key Capabilities
- Provider switching on-the-fly
- Conversation history management
- Cost tracking per provider
- Token usage monitoring
- Streaming responses
- Context-aware assistance

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  AI Provider Interface                   │
│              (Abstract base for all providers)           │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                    ↓
┌──────────────────┐              ┌──────────────────┐
│  OpenAI Provider │              │ Claude Provider  │
│  - GPT-3.5       │              │  - Claude 3      │
│  - GPT-4         │              │  - Claude 3.5    │
│  - GPT-4 Turbo   │              │                  │
└──────────────────┘              └──────────────────┘
        ↓                                    ↓
┌─────────────────────────────────────────────────────────┐
│              Provider Manager                            │
│  - Register providers                                    │
│  - Switch between providers                              │
│  - Manage configurations                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           AI Development Chat Service                    │
│  - Development-specific features                         │
│  - Mode-based system prompts                             │
│  - Context management                                    │
│  - Cost tracking                                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  REST API Endpoints                      │
│  - POST /api/dev-chat                                    │
│  - GET /api/dev-chat                                     │
│  - GET /api/dev-chat/providers                           │
│  - POST /api/dev-chat/providers                          │
└─────────────────────────────────────────────────────────┘
```

---

## Setup

### 1. Install Dependencies

Already installed:
```bash
npm install @anthropic-ai/sdk openai tiktoken
```

### 2. Configure Environment Variables

Add to `.env`:
```env
# OpenAI
OPENAI_API_KEY="sk-..."

# Anthropic (Claude)
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Initialize Providers

Providers are automatically initialized from environment variables when the API starts.

---

## API Reference

### Chat Endpoint

#### POST /api/dev-chat

Send a message to the AI development assistant.

**Request:**
```json
{
  "userId": "user-123",
  "message": "Write a function to validate email addresses",
  "mode": "CODE_GENERATION",
  "provider": "claude-sonnet",
  "conversationId": "conv-123",
  "context": {
    "language": "typescript",
    "framework": "Next.js",
    "codeSnippet": "// existing code...",
    "errorMessage": "Type error...",
    "fileContext": ["utils/validation.ts"]
  }
}
```

**Response:**
```json
{
  "conversationId": "conv-123",
  "messageId": "msg-456",
  "content": "Here's a TypeScript function to validate email addresses...",
  "provider": "CLAUDE",
  "model": "claude-3-5-sonnet-20241022",
  "tokens": {
    "prompt": 150,
    "completion": 300,
    "total": 450
  },
  "cost": 0.00135,
  "processingTime": 2340,
  "metadata": {
    "mode": "CODE_GENERATION"
  }
}
```

#### GET /api/dev-chat?conversationId=xxx

Get conversation history.

**Response:**
```json
{
  "id": "conv-123",
  "userId": "user-123",
  "title": "Dev Chat",
  "messages": [
    {
      "id": "msg-1",
      "role": "USER",
      "content": "Write a function...",
      "tokens": 150,
      "createdAt": "2025-09-30T12:00:00Z"
    },
    {
      "id": "msg-2",
      "role": "ASSISTANT",
      "content": "Here's the function...",
      "tokens": 300,
      "createdAt": "2025-09-30T12:00:02Z"
    }
  ],
  "totalTokens": 450,
  "totalCost": 0.00135,
  "isActive": true
}
```

#### GET /api/dev-chat?userId=xxx

Get all conversations for a user.

**Response:**
```json
[
  {
    "id": "conv-1",
    "title": "Dev Chat",
    "messages": [
      { "content": "Latest message..." }
    ],
    "updatedAt": "2025-09-30T12:00:00Z"
  }
]
```

#### DELETE /api/dev-chat?conversationId=xxx

Delete a conversation.

**Response:**
```json
{
  "message": "Conversation deleted successfully"
}
```

---

### Provider Management

#### GET /api/dev-chat/providers

List all available providers.

**Response:**
```json
{
  "providers": [
    {
      "name": "openai-gpt4",
      "provider": "OPENAI",
      "model": "gpt-4-turbo",
      "isActive": false
    },
    {
      "name": "claude-sonnet",
      "provider": "CLAUDE",
      "model": "claude-3-5-sonnet-20241022",
      "isActive": true
    }
  ],
  "activeProvider": {
    "name": "claude-sonnet",
    "provider": "CLAUDE",
    "model": "claude-3-5-sonnet-20241022",
    "capabilities": {
      "supportsStreaming": true,
      "supportsVision": true,
      "supportsFunctionCalling": true,
      "supportsSystemMessages": true,
      "maxContextWindow": 200000,
      "maxOutputTokens": 8192
    },
    "costs": {
      "promptCostPer1M": 3.00,
      "completionCostPer1M": 15.00,
      "currency": "USD"
    }
  }
}
```

#### POST /api/dev-chat/providers

Switch active provider or register a new one.

**Switch Provider:**
```json
{
  "action": "switch",
  "providerName": "claude-opus"
}
```

**Register Provider:**
```json
{
  "action": "register",
  "name": "my-custom-provider",
  "config": {
    "provider": "OPENAI",
    "apiKey": "sk-...",
    "model": "gpt-4o",
    "maxTokens": 4096,
    "temperature": 0.7
  }
}
```

#### PATCH /api/dev-chat/providers?name=xxx

Update provider configuration.

**Request:**
```json
{
  "temperature": 0.5,
  "maxTokens": 8192
}
```

#### DELETE /api/dev-chat/providers?name=xxx

Remove a provider.

---

## Usage Examples

### Example 1: Code Generation with Claude

```bash
curl -X POST http://localhost:3000/api/dev-chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "dev-user",
    "message": "Create a React component for a user profile card",
    "mode": "CODE_GENERATION",
    "provider": "claude-sonnet",
    "context": {
      "language": "typescript",
      "framework": "React"
    }
  }'
```

### Example 2: Debugging with GPT-4

```bash
curl -X POST http://localhost:3000/api/dev-chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "dev-user",
    "message": "Why is this code throwing an error?",
    "mode": "DEBUGGING",
    "provider": "openai-gpt4",
    "context": {
      "codeSnippet": "const result = data.map(item => item.value);",
      "errorMessage": "TypeError: Cannot read property map of undefined",
      "language": "javascript"
    }
  }'
```

### Example 3: Architecture Discussion

```bash
curl -X POST http://localhost:3000/api/dev-chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "dev-user",
    "message": "Design a microservices architecture for an e-commerce platform",
    "mode": "ARCHITECTURE",
    "provider": "claude-opus"
  }'
```

### Example 4: Switch Provider

```bash
curl -X POST http://localhost:3000/api/dev-chat/providers \
  -H "Content-Type: application/json" \
  -d '{
    "action": "switch",
    "providerName": "claude-haiku"
  }'
```

### Example 5: Streaming Response

```bash
curl -X POST http://localhost:3000/api/dev-chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "userId": "dev-user",
    "message": "Explain async/await in JavaScript"
  }'
```

---

## Development Modes

### CODE_GENERATION
**Best for:** Writing new code, functions, components

**System Prompt:** Expert software developer specializing in clean, efficient code

**Example:**
```json
{
  "mode": "CODE_GENERATION",
  "message": "Create a REST API endpoint for user authentication"
}
```

### DEBUGGING
**Best for:** Finding and fixing bugs

**System Prompt:** Expert debugging assistant analyzing errors and code

**Example:**
```json
{
  "mode": "DEBUGGING",
  "message": "Why is my API returning 500 errors?",
  "context": {
    "errorMessage": "Internal Server Error",
    "codeSnippet": "app.post('/api/users', handler)"
  }
}
```

### ARCHITECTURE
**Best for:** System design, architecture decisions

**System Prompt:** Software architecture expert focusing on scalability

**Example:**
```json
{
  "mode": "ARCHITECTURE",
  "message": "Design a real-time chat system architecture"
}
```

### DOCUMENTATION
**Best for:** Writing technical docs, API documentation

**System Prompt:** Technical documentation specialist

**Example:**
```json
{
  "mode": "DOCUMENTATION",
  "message": "Document this API endpoint",
  "context": {
    "codeSnippet": "POST /api/users - Create new user"
  }
}
```

### CODE_REVIEW
**Best for:** Reviewing code quality, security, best practices

**System Prompt:** Experienced code reviewer

**Example:**
```json
{
  "mode": "CODE_REVIEW",
  "message": "Review this authentication code",
  "context": {
    "codeSnippet": "const hash = md5(password);"
  }
}
```

### TEST_GENERATION
**Best for:** Writing unit tests, integration tests

**System Prompt:** Testing expert

**Example:**
```json
{
  "mode": "TEST_GENERATION",
  "message": "Generate tests for this function",
  "context": {
    "codeSnippet": "function validateEmail(email) { ... }"
  }
}
```

### REFACTORING
**Best for:** Improving code quality without changing functionality

**System Prompt:** Code refactoring specialist

**Example:**
```json
{
  "mode": "REFACTORING",
  "message": "Refactor this code to be more maintainable",
  "context": {
    "codeSnippet": "if (x) { if (y) { if (z) { ... } } }"
  }
}
```

---

## Provider Comparison

### OpenAI (GPT Models)

| Model | Context | Output | Cost (per 1M tokens) | Best For |
|-------|---------|--------|---------------------|----------|
| GPT-3.5 Turbo | 16K | 4K | $0.50 / $1.50 | Quick questions, simple tasks |
| GPT-4 | 8K | 4K | $30 / $60 | Complex reasoning |
| GPT-4 Turbo | 128K | 4K | $10 / $30 | Large context, vision |
| GPT-4o | 128K | 4K | $5 / $15 | Balanced performance |

### Anthropic (Claude Models)

| Model | Context | Output | Cost (per 1M tokens) | Best For |
|-------|---------|--------|---------------------|----------|
| Claude 3 Haiku | 200K | 4K | $0.25 / $1.25 | Fast, cost-effective |
| Claude 3 Sonnet | 200K | 4K | $3 / $15 | Balanced performance |
| Claude 3.5 Sonnet | 200K | 8K | $3 / $15 | Latest, best quality |
| Claude 3 Opus | 200K | 4K | $15 / $75 | Highest intelligence |

### Recommendations

**For Quick Tasks:** GPT-3.5 Turbo or Claude 3 Haiku  
**For Complex Code:** GPT-4 Turbo or Claude 3.5 Sonnet  
**For Large Context:** Claude models (200K context)  
**For Cost Efficiency:** Claude 3 Haiku  
**For Best Quality:** Claude 3 Opus or GPT-4o  

---

## Cost Tracking

All interactions are tracked in the database:

```sql
SELECT 
  model,
  COUNT(*) as interactions,
  SUM(total_tokens) as total_tokens,
  SUM(cost) as total_cost,
  AVG(response_time) as avg_response_time
FROM ai_interactions
WHERE interaction_type = 'DEV_CHAT'
GROUP BY model;
```

---

## Best Practices

### 1. Choose the Right Provider

```typescript
// For quick questions
{ provider: "claude-haiku" }

// For complex code generation
{ provider: "claude-sonnet" }

// For architecture discussions
{ provider: "claude-opus" }
```

### 2. Use Appropriate Modes

```typescript
// Code generation
{ mode: "CODE_GENERATION", context: { language: "typescript" } }

// Debugging
{ mode: "DEBUGGING", context: { errorMessage: "..." } }
```

### 3. Provide Context

```typescript
{
  context: {
    codeSnippet: "existing code",
    language: "typescript",
    framework: "Next.js",
    fileContext: ["related files"]
  }
}
```

### 4. Maintain Conversations

```typescript
// Continue conversation
{ conversationId: "existing-id", message: "follow-up question" }
```

### 5. Monitor Costs

```typescript
// Track costs per provider
const response = await devChat.chat(request);
console.log(`Cost: $${response.cost}`);
```

---

## Troubleshooting

### Issue: Provider Not Found

**Solution:** Check if provider is registered
```bash
curl http://localhost:3000/api/dev-chat/providers
```

### Issue: Authentication Error

**Solution:** Verify API keys in `.env`
```env
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

### Issue: Rate Limit

**Solution:** Switch to different provider or wait
```json
{ "action": "switch", "providerName": "alternative-provider" }
```

### Issue: High Costs

**Solution:** Use cheaper models
```json
{ "provider": "claude-haiku" }  // Most cost-effective
```

---

## Future Enhancements

- [ ] Add Google Gemini support
- [ ] Add Llama model support
- [ ] Function calling integration
- [ ] Vision capabilities for code screenshots
- [ ] Conversation export/import
- [ ] Cost budgets and alerts
- [ ] Custom system prompts
- [ ] Multi-turn conversations with memory

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/cloudbyday90/HoloVitals/issues
- Documentation: /docs
- Email: support@holovitals.com