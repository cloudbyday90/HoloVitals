/**
 * Claude (Anthropic) AI Provider
 * 
 * Implementation of IAIProvider for Anthropic's Claude models.
 * Supports Claude 3 Opus, Sonnet, Haiku, and Claude 3.5 Sonnet.
 */

import Anthropic from '@anthropic-ai/sdk';
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

export class ClaudeProvider implements IAIProvider {
  private client: Anthropic;
  private config: AIProviderConfig;

  readonly provider = AIProvider.CLAUDE;
  readonly model: AIModel;
  readonly capabilities: AIProviderCapabilities;
  readonly costs: AIProviderCosts;

  constructor(config: AIProviderConfig) {
    if (config.provider !== AIProvider.CLAUDE) {
      throw new Error('Invalid provider for ClaudeProvider');
    }

    this.config = config;
    this.model = config.model;
    this.capabilities = MODEL_CAPABILITIES[config.model];
    this.costs = MODEL_COSTS[config.model];

    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout || 60000,
    });
  }

  /**
   * Complete a chat request
   */
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      // Convert messages to Claude format
      const { system, messages } = this.convertMessages(request.messages);

      // Create completion
      const response = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens || this.config.maxTokens || 4096,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        top_p: request.topP ?? this.config.topP ?? 1,
        system: system || undefined,
        messages: messages as any,
        stop_sequences: request.stopSequences,
      });

      // Extract content
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('');

      // Calculate cost
      const cost = this.calculateCost(
        response.usage.input_tokens,
        response.usage.output_tokens
      );

      return {
        id: response.id,
        content,
        model: request.model,
        provider: this.provider,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        },
        cost,
        finishReason: this.mapStopReason(response.stop_reason),
        metadata: {
          stopSequence: response.stop_sequence,
          model: response.model
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
      // Convert messages to Claude format
      const { system, messages } = this.convertMessages(request.messages);

      // Create streaming completion
      const stream = await this.client.messages.stream({
        model: request.model,
        max_tokens: request.maxTokens || this.config.maxTokens || 4096,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        top_p: request.topP ?? this.config.topP ?? 1,
        system: system || undefined,
        messages: messages as any,
        stop_sequences: request.stopSequences,
      });

      // Stream chunks
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          const delta = chunk.delta;
          if (delta.type === 'text_delta') {
            yield {
              content: delta.text
            };
          }
        } else if (chunk.type === 'message_stop') {
          yield {
            content: '',
            finishReason: 'stop'
          };
        }
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Count tokens in text
   * Note: Claude doesn't provide a token counting API, so we estimate
   */
  countTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    // Claude's actual tokenization may differ
    return Math.ceil(text.length / 4);
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
      // Try a minimal request to validate the key
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      });
      return true;
    } catch (error: any) {
      if (error.status === 401) {
        return false;
      }
      // Other errors might be rate limits, etc., but key is valid
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
      this.client = new Anthropic({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL,
        timeout: this.config.timeout || 60000,
      });
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  /**
   * Convert messages to Claude format
   * Claude requires system messages to be separate
   */
  private convertMessages(messages: AICompletionRequest['messages']): {
    system: string | null;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    let system: string | null = null;
    const convertedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const message of messages) {
      if (message.role === 'system') {
        // Combine all system messages
        system = system ? `${system}\n\n${message.content}` : message.content;
      } else {
        convertedMessages.push({
          role: message.role as 'user' | 'assistant',
          content: message.content
        });
      }
    }

    return { system, messages: convertedMessages };
  }

  /**
   * Map Claude's stop reason to our standard format
   */
  private mapStopReason(
    stopReason: string | null
  ): 'stop' | 'length' | 'content_filter' | 'tool_use' {
    switch (stopReason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      case 'tool_use':
        return 'tool_use';
      default:
        return 'stop';
    }
  }

  /**
   * Handle errors from Claude API
   */
  private handleError(error: any): AIProviderError {
    if (error instanceof Anthropic.APIError) {
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
          `Claude API error: ${message}`,
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
}