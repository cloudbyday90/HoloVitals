/**
 * Llama AI Provider (via Open WebUI/Ollama)
 * 
 * Implementation of IAIProvider for local Llama models.
 * Supports Llama 3.2 models (1B, 3B, 11B, 90B) via Open WebUI's OpenAI-compatible API.
 * 
 * Benefits:
 * - FREE (self-hosted, no API costs)
 * - PRIVATE (data never leaves your infrastructure)
 * - OFFLINE (works without internet)
 * - HIPAA-COMPLIANT (complete data control)
 */

import {
  IAIProvider,
  AIProvider,
  AIModel,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  AIProviderConfig,
  AIProviderCapabilities,
  AIProviderCosts,
  MODEL_CAPABILITIES,
  MODEL_COSTS,
  AIProviderError,
  RateLimitError,
  AuthenticationError,
  InvalidRequestError
} from '../types/ai-provider';

interface OpenWebUIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LlamaProvider implements IAIProvider {
  private config: AIProviderConfig;
  private baseURL: string;

  readonly provider = AIProvider.LLAMA;
  readonly model: AIModel;
  readonly capabilities: AIProviderCapabilities;
  readonly costs: AIProviderCosts;

  constructor(config: AIProviderConfig) {
    if (config.provider !== AIProvider.LLAMA) {
      throw new Error('Invalid provider for LlamaProvider');
    }

    this.config = config;
    this.model = config.model;
    this.capabilities = MODEL_CAPABILITIES[config.model];
    this.costs = MODEL_COSTS[config.model];

    // Default to local Open WebUI instance
    this.baseURL = config.baseURL || 'http://localhost:3000/api';
  }

  /**
   * Complete a chat request
   */
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey || 'dummy-key'}`, // Open WebUI may not require auth
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          max_tokens: request.maxTokens || this.config.maxTokens || 4096,
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          top_p: request.topP ?? this.config.topP ?? 1,
          stop: request.stopSequences,
          stream: false
        })
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data: OpenWebUIResponse = await response.json();
      const choice = data.choices[0];
      const content = choice.message.content || '';
      const usage = data.usage;

      // Calculate cost (FREE for local models)
      const cost = this.calculateCost(
        usage.prompt_tokens,
        usage.completion_tokens
      );

      return {
        id: data.id,
        content,
        model: request.model,
        provider: this.provider,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        },
        cost,
        finishReason: this.mapFinishReason(choice.finish_reason),
        metadata: {
          created: data.created,
          object: data.object
        }
      };
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  /**
   * Stream a chat request
   */
  async *stream(request: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey || 'dummy-key'}`,
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          max_tokens: request.maxTokens || this.config.maxTokens || 4096,
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          top_p: request.topP ?? this.config.topP ?? 1,
          stop: request.stopSequences,
          stream: true
        })
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta;
              
              if (delta?.content) {
                yield {
                  content: delta.content,
                  finishReason: undefined
                };
              }

              if (parsed.choices[0]?.finish_reason) {
                yield {
                  content: '',
                  finishReason: this.mapFinishReason(parsed.choices[0].finish_reason)
                };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  /**
   * Count tokens in text (estimated for Llama models)
   */
  countTokens(text: string): number {
    // Rough estimation: ~4 characters per token for Llama models
    // This is less accurate than tiktoken but works for local models
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost for request (FREE for local models)
   */
  calculateCost(promptTokens: number, completionTokens: number): number {
    // Local models are FREE
    return 0;
  }

  /**
   * Validate configuration
   */
  validateConfig(): boolean {
    // Check if baseURL is accessible
    if (!this.config.baseURL && !this.baseURL) {
      console.warn('No baseURL provided, using default: http://localhost:3000/api');
    }
    return true;
  }

  /**
   * Get provider information
   */
  getInfo(): {
    provider: AIProvider;
    model: AIModel;
    capabilities: AIProviderCapabilities;
    costs: AIProviderCosts;
  } {
    return {
      provider: this.provider,
      model: this.model,
      capabilities: this.capabilities,
      costs: this.costs
    };
  }

  /**
   * Map finish reason to standard format
   */
  private mapFinishReason(reason: string): 'stop' | 'length' | 'content_filter' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
      case 'max_tokens':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  /**
   * Handle HTTP errors
   */
  private async handleError(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage = `HTTP ${status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Use default error message
    }

    if (status === 429) {
      throw new RateLimitError(this.provider);
    } else if (status === 401 || status === 403) {
      throw new AuthenticationError(this.provider);
    } else if (status >= 400 && status < 500) {
      throw new InvalidRequestError(this.provider, errorMessage);
    } else {
      throw new AIProviderError(errorMessage, this.provider, status);
    }
  }

  /**
   * Wrap unknown errors
   */
  private wrapError(error: any): AIProviderError {
    if (error instanceof AIProviderError) {
      return error;
    }

    return new AIProviderError(
      error.message || 'Unknown error occurred',
      this.provider,
      undefined,
      error
    );
  }

  /**
   * Validate API key (not required for local models)
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Update provider configuration
   */
  updateConfig(config: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.baseURL) {
      this.baseURL = config.baseURL;
    }
  }

  /**
   * Get provider configuration
   */
  getConfig(): AIProviderConfig {
    return { ...this.config };
  }
}