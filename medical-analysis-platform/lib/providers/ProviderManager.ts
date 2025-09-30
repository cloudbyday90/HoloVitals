/**
 * AI Provider Manager
 * 
 * Manages multiple AI providers and handles switching between them.
 * Provides a unified interface for all AI operations.
 */

import {
  IAIProvider,
  AIProvider,
  AIModel,
  AIProviderConfig,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk
} from '@/lib/types/ai-provider';
import { OpenAIProvider } from './OpenAIProvider';
import { ClaudeProvider } from './ClaudeProvider';

export class ProviderManager {
  private providers: Map<string, IAIProvider> = new Map();
  private activeProvider: string | null = null;

  /**
   * Register a new provider
   */
  registerProvider(name: string, config: AIProviderConfig): void {
    let provider: IAIProvider;

    switch (config.provider) {
      case AIProvider.OPENAI:
        provider = new OpenAIProvider(config);
        break;
      case AIProvider.CLAUDE:
        provider = new ClaudeProvider(config);
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    this.providers.set(name, provider);
    
    // Set as active if it's the first provider
    if (!this.activeProvider) {
      this.activeProvider = name;
    }
  }

  /**
   * Switch to a different provider
   */
  switchProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider not found: ${name}`);
    }
    this.activeProvider = name;
  }

  /**
   * Get the active provider
   */
  getActiveProvider(): IAIProvider {
    if (!this.activeProvider) {
      throw new Error('No active provider set');
    }

    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      throw new Error(`Active provider not found: ${this.activeProvider}`);
    }

    return provider;
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: string): IAIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): Map<string, IAIProvider> {
    return new Map(this.providers);
  }

  /**
   * Get active provider name
   */
  getActiveProviderName(): string | null {
    return this.activeProvider;
  }

  /**
   * Remove a provider
   */
  removeProvider(name: string): void {
    this.providers.delete(name);
    
    // If we removed the active provider, switch to another one
    if (this.activeProvider === name) {
      const firstProvider = this.providers.keys().next().value;
      this.activeProvider = firstProvider || null;
    }
  }

  /**
   * Complete using active provider
   */
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const provider = this.getActiveProvider();
    return provider.complete(request);
  }

  /**
   * Stream using active provider
   */
  async *stream(request: AICompletionRequest): AsyncGenerator<AIStreamChunk> {
    const provider = this.getActiveProvider();
    yield* provider.stream(request);
  }

  /**
   * Complete using a specific provider
   */
  async completeWith(
    providerName: string,
    request: AICompletionRequest
  ): Promise<AICompletionResponse> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }
    return provider.complete(request);
  }

  /**
   * Stream using a specific provider
   */
  async *streamWith(
    providerName: string,
    request: AICompletionRequest
  ): AsyncGenerator<AIStreamChunk> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }
    yield* provider.stream(request);
  }

  /**
   * Count tokens using active provider
   */
  countTokens(text: string): number {
    const provider = this.getActiveProvider();
    return provider.countTokens(text);
  }

  /**
   * Calculate cost using active provider
   */
  calculateCost(promptTokens: number, completionTokens: number): number {
    const provider = this.getActiveProvider();
    return provider.calculateCost(promptTokens, completionTokens);
  }

  /**
   * Validate API key for active provider
   */
  async validateApiKey(): Promise<boolean> {
    const provider = this.getActiveProvider();
    return provider.validateApiKey();
  }

  /**
   * Get provider info
   */
  getProviderInfo(name?: string): {
    name: string;
    provider: AIProvider;
    model: AIModel;
    capabilities: any;
    costs: any;
  } | null {
    const providerName = name || this.activeProvider;
    if (!providerName) return null;

    const provider = this.providers.get(providerName);
    if (!provider) return null;

    return {
      name: providerName,
      provider: provider.provider,
      model: provider.model,
      capabilities: provider.capabilities,
      costs: provider.costs
    };
  }

  /**
   * List all registered providers with info
   */
  listProviders(): Array<{
    name: string;
    provider: AIProvider;
    model: AIModel;
    isActive: boolean;
  }> {
    const result: Array<{
      name: string;
      provider: AIProvider;
      model: AIModel;
      isActive: boolean;
    }> = [];

    for (const [name, provider] of this.providers) {
      result.push({
        name,
        provider: provider.provider,
        model: provider.model,
        isActive: name === this.activeProvider
      });
    }

    return result;
  }

  /**
   * Update provider configuration
   */
  updateProviderConfig(
    name: string,
    config: Partial<AIProviderConfig>
  ): void {
    const provider = this.getProvider(name);
    if (!provider) {
      throw new Error(`Provider not found: ${name}`);
    }
    provider.updateConfig(config);
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(name?: string): AIProviderConfig | null {
    const providerName = name || this.activeProvider;
    if (!providerName) return null;

    const provider = this.providers.get(providerName);
    if (!provider) return null;

    return provider.getConfig();
  }
}

// Singleton instance
let providerManagerInstance: ProviderManager | null = null;

/**
 * Get the singleton ProviderManager instance
 */
export function getProviderManager(): ProviderManager {
  if (!providerManagerInstance) {
    providerManagerInstance = new ProviderManager();
  }
  return providerManagerInstance;
}

/**
 * Initialize providers from environment variables
 */
export function initializeProvidersFromEnv(): ProviderManager {
  const manager = getProviderManager();

  // Initialize OpenAI if API key is present
  if (process.env.OPENAI_API_KEY) {
    manager.registerProvider('openai-gpt4', {
      provider: AIProvider.OPENAI,
      apiKey: process.env.OPENAI_API_KEY,
      model: AIModel.GPT_4_TURBO,
      maxTokens: 4096,
      temperature: 0.7
    });

    manager.registerProvider('openai-gpt35', {
      provider: AIProvider.OPENAI,
      apiKey: process.env.OPENAI_API_KEY,
      model: AIModel.GPT_35_TURBO,
      maxTokens: 4096,
      temperature: 0.7
    });
  }

  // Initialize Claude if API key is present
  if (process.env.ANTHROPIC_API_KEY) {
    manager.registerProvider('claude-opus', {
      provider: AIProvider.CLAUDE,
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: AIModel.CLAUDE_3_OPUS,
      maxTokens: 4096,
      temperature: 0.7
    });

    manager.registerProvider('claude-sonnet', {
      provider: AIProvider.CLAUDE,
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: AIModel.CLAUDE_35_SONNET,
      maxTokens: 4096,
      temperature: 0.7
    });

    manager.registerProvider('claude-haiku', {
      provider: AIProvider.CLAUDE,
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: AIModel.CLAUDE_3_HAIKU,
      maxTokens: 4096,
      temperature: 0.7
    });
  }

  return manager;
}