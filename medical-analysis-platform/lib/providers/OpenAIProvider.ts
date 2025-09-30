/**
 * OpenAI AI Provider
 * 
 * Implementation of IAIProvider for OpenAI's GPT models.
 * Supports GPT-3.5 Turbo, GPT-4, GPT-4 Turbo, and GPT-4o.
 */

import OpenAI from 'openai';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
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
} from '@/lib/types/ai-provider';

export class OpenAIProvider implements IAIProvider {
  private client: OpenAI;
  private config: AIProviderConfig;
  private encoding: any;

  readonly provider = AIProvider.OPENAI;
  readonly model: AIModel;
  readonly capabilities: AIProviderCapabilities;
  readonly costs: AIProviderCosts;

  constructor(config: AIProviderConfig) {
    if (config.provider !== AIProvider.OPENAI) {
      throw new Error('Invalid provider for OpenAIProvider');
    }

    this.config = config;
    this.model = config.model;
    this.capabilities = MODEL_CAPABILITIES[config.model];
    this.costs = MODEL_COSTS[config.model];

    // Initialize OpenAI client
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout || 60000,
    });

    // Initialize tokenizer
    try {
      this.encoding = encoding_for_model(this.model as TiktokenModel);
    } catch (error) {
      // Fallback to gpt-3.5-turbo encoding
      this.encoding = encoding_for_model('gpt-3.5-turbo');
    }
  }

  /**
   * Complete a chat request
   */
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages as any,
        max_tokens: request.maxTokens || this.config.maxTokens || 4096,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        top_p: request.topP ?? this.config.topP ?? 1,
        stop: request.stopSequences,
        stream: false
      });

      const choice = response.choices[0];
      const content = choice.message.content || '';
      const usage = response.usage!;

      // Calculate cost
      const cost = this.calculateCost(
        usage.prompt_tokens,
        usage.completion_tokens
      );

      return {
        id: response.id,
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
          model: response.model,
          systemFingerprint: response.system_fingerprint
        }
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Stream a chat request
   */
  async *stream(request: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    try {
      const stream = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages as any,
        max_tokens: request.maxTokens || this.config.maxTokens || 4096,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        top_p: request.topP ?? this.config.topP ?? 1,
        stop: request.stopSequences,
        stream: true
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const finishReason = chunk.choices[0]?.finish_reason;

        if (delta?.content) {
          yield {
            content: delta.content
          };
        }

        if (finishReason) {
          yield {
            content: '',
            finishReason: this.mapFinishReason(finishReason)
          };
        }
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Count tokens in text using tiktoken
   */
  countTokens(text: string): number {
    try {
      const tokens = this.encoding.encode(text);
      return tokens.length;
    } catch (error) {
      // Fallback estimation
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Calculate cost based on token usage
   */
  calculateCost(promptTokens: number, completionTokens: number): number {
    const promptCost = (promptTokens / 1_000_000) * this.costs.promptCostPer1M;
    const completionCost = (completionTokens / 1_000_000) * this.costs.completionCostPer1M;
    return promptCost + completionCost;
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error: any) {
      if (error.status === 401) {
        return false;
      }
      return true;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinitialize client if API key or baseURL changed
    if (config.apiKey || config.baseURL || config.timeout) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL,
        timeout: this.config.timeout || 60000,
      });
    }

    // Reinitialize encoding if model changed
    if (config.model) {
      try {
        this.encoding.free();
        this.encoding = encoding_for_model(config.model as TiktokenModel);
      } catch (error) {
        this.encoding = encoding_for_model('gpt-3.5-turbo');
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  /**
   * Map OpenAI's finish reason to our standard format
   */
  private mapFinishReason(
    finishReason: string | null
  ): 'stop' | 'length' | 'content_filter' | 'tool_use' {
    switch (finishReason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      case 'tool_calls':
      case 'function_call':
        return 'tool_use';
      default:
        return 'stop';
    }
  }

  /**
   * Handle errors from OpenAI API
   */
  private handleError(error: any): AIProviderError {
    if (error instanceof OpenAI.APIError) {
      const status = error.status;
      const message = error.message;

      if (status === 401) {
        return new AuthenticationError(this.provider);
      } else if (status === 429) {
        return new RateLimitError(this.provider);
      } else if (status === 400) {
        return new InvalidRequestError(this.provider, message);
      } else {
        return new AIProviderError(
          `OpenAI API error: ${message}`,
          this.provider,
          status,
          error
        );
      }
    }

    return new AIProviderError(
      `Unexpected error: ${error.message}`,
      this.provider,
      undefined,
      error
    );
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.encoding) {
      this.encoding.free();
    }
  }
}