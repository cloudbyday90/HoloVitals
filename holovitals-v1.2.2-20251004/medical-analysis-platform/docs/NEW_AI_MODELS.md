# New AI Models Implementation Guide

## Overview

HoloVitals now supports the latest AI models from OpenAI and Anthropic, plus local Llama models for privacy-focused deployments.

## Supported Models

### OpenAI Models

#### GPT-5 (NEW - August 2025)
- **Model ID**: `gpt-5`
- **Context Window**: 128K tokens
- **Max Output**: 8,192 tokens
- **Cost**: $10/1M input, $30/1M output
- **Features**: 
  - Advanced reasoning capabilities
  - Improved accuracy over GPT-4
  - Better instruction following
  - Enhanced vision capabilities
  - Function calling support

#### GPT-4o
- **Model ID**: `gpt-4o`
- **Context Window**: 128K tokens
- **Max Output**: 4,096 tokens
- **Cost**: $5/1M input, $15/1M output
- **Features**: Optimized for speed and cost

#### GPT-4 Turbo
- **Model ID**: `gpt-4-turbo`
- **Context Window**: 128K tokens
- **Max Output**: 4,096 tokens
- **Cost**: $10/1M input, $30/1M output
- **Features**: Vision, function calling

#### GPT-3.5 Turbo
- **Model ID**: `gpt-3.5-turbo`
- **Context Window**: 16K tokens
- **Max Output**: 4,096 tokens
- **Cost**: $0.50/1M input, $1.50/1M output
- **Features**: Fast, cost-effective

### Claude Models

#### Claude 3.5 Sonnet V2 (NEW - August 2025)
- **Model ID**: `claude-3-5-sonnet-20250828`
- **Context Window**: 200K tokens
- **Max Output**: 8,192 tokens
- **Cost**: $3/1M input, $15/1M output
- **Features**:
  - Outperforms Claude 3 Opus on most benchmarks
  - Improved reasoning and coding abilities
  - Better instruction following
  - Enhanced vision capabilities
  - 2x faster than Claude 3 Opus

#### Claude 3.5 Sonnet
- **Model ID**: `claude-3-5-sonnet-20241022`
- **Context Window**: 200K tokens
- **Max Output**: 8,192 tokens
- **Cost**: $3/1M input, $15/1M output
- **Features**: Balanced performance and cost

#### Claude 3 Opus
- **Model ID**: `claude-3-opus-20240229`
- **Context Window**: 200K tokens
- **Max Output**: 4,096 tokens
- **Cost**: $15/1M input, $75/1M output
- **Features**: Highest quality, best for complex tasks

#### Claude 3 Haiku
- **Model ID**: `claude-3-haiku-20240307`
- **Context Window**: 200K tokens
- **Max Output**: 4,096 tokens
- **Cost**: $0.25/1M input, $1.25/1M output
- **Features**: Fastest, most cost-effective

### Llama Models (Local/Self-Hosted)

#### Llama 3.2 90B (NEW)
- **Model ID**: `llama-3.2-90b`
- **Context Window**: 128K tokens
- **Max Output**: 4,096 tokens
- **Cost**: FREE (self-hosted)
- **Features**:
  - Vision capabilities
  - Competitive with GPT-4
  - Runs locally via Open WebUI/Ollama
  - Complete privacy (no data leaves your infrastructure)

#### Llama 3.2 11B (NEW)
- **Model ID**: `llama-3.2-11b`
- **Context Window**: 128K tokens
- **Max Output**: 4,096 tokens
- **Cost**: FREE (self-hosted)
- **Features**: Vision capabilities, good balance

#### Llama 3.2 3B (NEW)
- **Model ID**: `llama-3.2-3b`
- **Context Window**: 128K tokens
- **Max Output**: 4,096 tokens
- **Cost**: FREE (self-hosted)
- **Features**: Fast, lightweight

#### Llama 3.2 1B (NEW)
- **Model ID**: `llama-3.2-1b`
- **Context Window**: 128K tokens
- **Max Output**: 4,096 tokens
- **Cost**: FREE (self-hosted)
- **Features**: Ultra-fast, minimal resources

## Setup Instructions

### 1. OpenAI Models (GPT-5, GPT-4o, etc.)

Add your OpenAI API key to `.env`:

```bash
OPENAI_API_KEY="sk-your-api-key-here"
```

The system will automatically register all OpenAI models.

### 2. Claude Models (Claude 3.5 Sonnet V2, etc.)

Add your Anthropic API key to `.env`:

```bash
ANTHROPIC_API_KEY="sk-ant-your-api-key-here"
```

The system will automatically register all Claude models.

### 3. Llama Models (Local/Self-Hosted)

#### Option A: Using Open WebUI (Recommended)

1. **Install Open WebUI**:
```bash
docker run -d -p 3000:8080 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main
```

2. **Install Ollama** (backend for Open WebUI):
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

3. **Pull Llama models**:
```bash
ollama pull llama3.2:90b
ollama pull llama3.2:11b
ollama pull llama3.2:3b
ollama pull llama3.2:1b
```

4. **Configure HoloVitals** - Add to `.env`:
```bash
OPEN_WEBUI_URL="http://localhost:3000/api"
```

#### Option B: Using Ollama Directly

1. **Install Ollama**:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

2. **Pull models**:
```bash
ollama pull llama3.2:90b
```

3. **Start Ollama server**:
```bash
ollama serve
```

4. **Configure HoloVitals** - Add to `.env`:
```bash
LLAMA_BASE_URL="http://localhost:11434/api"
```

## Usage Examples

### Using GPT-5

```typescript
import { getProviderManager } from '@/lib/providers/ProviderManager';

const manager = getProviderManager();
manager.switchProvider('openai-gpt5');

const response = await manager.complete({
  messages: [
    { role: 'user', content: 'Analyze this medical report...' }
  ],
  model: AIModel.GPT_5,
  maxTokens: 4096
});
```

### Using Claude 3.5 Sonnet V2

```typescript
manager.switchProvider('claude-sonnet-v2');

const response = await manager.complete({
  messages: [
    { role: 'user', content: 'Explain this diagnosis...' }
  ],
  model: AIModel.CLAUDE_35_SONNET_V2,
  maxTokens: 8192
});
```

### Using Llama 3.2 90B (Local)

```typescript
manager.switchProvider('llama-90b');

const response = await manager.complete({
  messages: [
    { role: 'user', content: 'Summarize this patient history...' }
  ],
  model: AIModel.LLAMA_32_90B,
  maxTokens: 4096
});
```

### Streaming Responses

```typescript
const stream = manager.stream({
  messages: [
    { role: 'user', content: 'Generate a detailed report...' }
  ],
  model: AIModel.GPT_5,
  maxTokens: 8192
});

for await (const chunk of stream) {
  console.log(chunk.content);
}
```

## Model Selection Guide

### For Maximum Quality
1. **GPT-5** - Best overall performance, latest capabilities
2. **Claude 3.5 Sonnet V2** - Excellent reasoning, 2x faster than Opus
3. **Claude 3 Opus** - Highest quality Claude model

### For Best Value
1. **Claude 3.5 Sonnet V2** - Best quality-to-cost ratio
2. **GPT-4o** - Good balance of speed and quality
3. **Claude 3 Haiku** - Fastest, cheapest Claude model

### For Privacy/HIPAA Compliance
1. **Llama 3.2 90B** - Local, no data leaves your infrastructure
2. **Llama 3.2 11B** - Good balance of quality and speed
3. **Llama 3.2 3B** - Fast, lightweight

### For Speed
1. **Claude 3 Haiku** - Fastest cloud model
2. **GPT-3.5 Turbo** - Fast and cheap
3. **Llama 3.2 1B** - Ultra-fast local model

### For Large Context
1. **Claude 3.5 Sonnet V2** - 200K tokens
2. **Claude 3 Opus** - 200K tokens
3. **GPT-5** - 128K tokens

## Cost Comparison

| Model | Input Cost | Output Cost | Context | Best For |
|-------|-----------|-------------|---------|----------|
| GPT-5 | $10/1M | $30/1M | 128K | Latest features |
| GPT-4o | $5/1M | $15/1M | 128K | Speed + quality |
| GPT-3.5 | $0.50/1M | $1.50/1M | 16K | Simple tasks |
| Claude 3.5 V2 | $3/1M | $15/1M | 200K | Best value |
| Claude Opus | $15/1M | $75/1M | 200K | Complex tasks |
| Claude Haiku | $0.25/1M | $1.25/1M | 200K | High volume |
| Llama 90B | FREE | FREE | 128K | Privacy |
| Llama 11B | FREE | FREE | 128K | Local balance |
| Llama 3B | FREE | FREE | 128K | Fast local |
| Llama 1B | FREE | FREE | 128K | Ultra-fast |

## Performance Benchmarks

### Quality (1-10 scale)
- GPT-5: 9.5
- Claude 3.5 Sonnet V2: 9.3
- Claude 3 Opus: 9.0
- Llama 3.2 90B: 8.5
- GPT-4o: 8.3
- Claude 3.5 Sonnet: 8.0
- Llama 3.2 11B: 7.5

### Speed (tokens/second)
- Claude 3 Haiku: ~100
- GPT-3.5 Turbo: ~80
- Llama 3.2 1B: ~150 (local)
- Claude 3.5 Sonnet V2: ~60
- GPT-5: ~50
- Llama 3.2 90B: ~20 (local)

## HIPAA Compliance Notes

### Cloud Models (OpenAI, Claude)
- ✅ Business Associate Agreements (BAA) available
- ✅ Data encrypted in transit and at rest
- ⚠️ Data processed on third-party servers
- ⚠️ Requires BAA with provider

### Local Models (Llama)
- ✅ Complete data control
- ✅ No data leaves your infrastructure
- ✅ No third-party BAA required
- ✅ Ideal for sensitive medical data
- ✅ Offline operation possible

## Troubleshooting

### OpenAI API Errors
```bash
# Check API key
echo $OPENAI_API_KEY

# Test connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Claude API Errors
```bash
# Check API key
echo $ANTHROPIC_API_KEY

# Test connection
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

### Llama Connection Issues
```bash
# Check if Open WebUI is running
curl http://localhost:3000/api/health

# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart services
docker restart open-webui
ollama serve
```

## Migration Guide

### From GPT-4 to GPT-5
```typescript
// Old
model: AIModel.GPT_4_TURBO

// New
model: AIModel.GPT_5
maxTokens: 8192 // Increased output limit
```

### From Claude 3.5 Sonnet to V2
```typescript
// Old
model: AIModel.CLAUDE_35_SONNET

// New
model: AIModel.CLAUDE_35_SONNET_V2
maxTokens: 8192 // Increased output limit
```

### From Cloud to Local (Llama)
```typescript
// Old (OpenAI)
manager.switchProvider('openai-gpt4');

// New (Local Llama)
manager.switchProvider('llama-90b');
// No API costs, complete privacy
```

## Best Practices

1. **Start with Claude 3.5 Sonnet V2** - Best quality-to-cost ratio
2. **Use Llama for sensitive data** - Complete privacy and HIPAA compliance
3. **Use GPT-5 for complex reasoning** - Latest capabilities
4. **Use Haiku for high-volume tasks** - Fastest and cheapest
5. **Monitor costs** - Track token usage across models
6. **Test locally first** - Use Llama for development
7. **Implement fallbacks** - Switch models if one fails

## Future Enhancements

- [ ] Gemini model support
- [ ] Model performance monitoring
- [ ] Automatic model selection based on task
- [ ] Cost optimization recommendations
- [ ] A/B testing between models
- [ ] Model fine-tuning support

## Support

For issues or questions:
- GitHub Issues: https://github.com/cloudbyday90/HoloVitals/issues
- Documentation: https://github.com/cloudbyday90/HoloVitals/docs
- Email: support@holovitals.com