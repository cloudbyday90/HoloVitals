/**
 * AI Provider Interface
 * 
 * Abstract interface for all AI providers (OpenAI, Claude, etc.)
 * Enables easy switching between different AI models and providers.
 */

export enum AIProvider {
  OPENAI = 'OPENAI',
  CLAUDE = 'CLAUDE',
  GEMINI = 'GEMINI',
  LLAMA = 'LLAMA'
}

export enum AIModel {
  // OpenAI Models
  GPT_35_TURBO = 'gpt-3.5-turbo',
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_4O = 'gpt-4o',
  
  // Claude Models
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
  CLAUDE_35_SONNET = 'claude-3-5-sonnet-20241022',
  
  // Future: Gemini, Llama, etc.
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model: AIModel;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  stopSequences?: string[];
  metadata?: Record<string, any>;
}

export interface AICompletionResponse {
  id: string;
  content: string;
  model: AIModel;
  provider: AIProvider;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_use';
  metadata?: Record<string, any>;
}

export interface AIStreamChunk {
  content: string;
  finishReason?: 'stop' | 'length' | 'content_filter';
}

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model: AIModel;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  baseURL?: string;
  timeout?: number;
}

export interface AIProviderCapabilities {
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  supportsSystemMessages: boolean;
  maxContextWindow: number;
  maxOutputTokens: number;
}

export interface AIProviderCosts {
  promptCostPer1M: number;
  completionCostPer1M: number;
  currency: string;
}

/**
 * Abstract AI Provider Interface
 * All AI providers must implement this interface
 */
export interface IAIProvider {
  // Provider info
  readonly provider: AIProvider;
  readonly model: AIModel;
  readonly capabilities: AIProviderCapabilities;
  readonly costs: AIProviderCosts;

  // Core methods
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  stream(request: AICompletionRequest): AsyncGenerator<AIStreamChunk>;
  
  // Utility methods
  countTokens(text: string): number;
  calculateCost(promptTokens: number, completionTokens: number): number;
  validateApiKey(): Promise<boolean>;
  
  // Configuration
  updateConfig(config: Partial<AIProviderConfig>): void;
  getConfig(): AIProviderConfig;
}

/**
 * Model capabilities by provider
 */
export const MODEL_CAPABILITIES: Record<AIModel, AIProviderCapabilities> = {
  // OpenAI Models
  [AIModel.GPT_35_TURBO]: {
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsSystemMessages: true,
    maxContextWindow: 16385,
    maxOutputTokens: 4096
  },
  [AIModel.GPT_4]: {
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsSystemMessages: true,
    maxContextWindow: 8192,
    maxOutputTokens: 4096
  },
  [AIModel.GPT_4_TURBO]: {
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsSystemMessages: true,
    maxContextWindow: 128000,
    maxOutputTokens: 4096
  },
  [AIModel.GPT_4O]: {
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsSystemMessages: true,
    maxContextWindow: 128000,
    maxOutputTokens: 4096
  },
  
  // Claude Models
  [AIModel.CLAUDE_3_OPUS]: {
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsSystemMessages: true,
    maxContextWindow: 200000,
    maxOutputTokens: 4096
  },
  [AIModel.CLAUDE_3_SONNET]: {
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsSystemMessages: true,
    maxContextWindow: 200000,
    maxOutputTokens: 4096
  },
  [AIModel.CLAUDE_3_HAIKU]: {
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsSystemMessages: true,
    maxContextWindow: 200000,
    maxOutputTokens: 4096
  },
  [AIModel.CLAUDE_35_SONNET]: {
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsSystemMessages: true,
    maxContextWindow: 200000,
    maxOutputTokens: 8192
  }
};

/**
 * Model costs (per 1M tokens)
 */
export const MODEL_COSTS: Record<AIModel, AIProviderCosts> = {
  // OpenAI Models
  [AIModel.GPT_35_TURBO]: {
    promptCostPer1M: 0.50,
    completionCostPer1M: 1.50,
    currency: 'USD'
  },
  [AIModel.GPT_4]: {
    promptCostPer1M: 30.00,
    completionCostPer1M: 60.00,
    currency: 'USD'
  },
  [AIModel.GPT_4_TURBO]: {
    promptCostPer1M: 10.00,
    completionCostPer1M: 30.00,
    currency: 'USD'
  },
  [AIModel.GPT_4O]: {
    promptCostPer1M: 5.00,
    completionCostPer1M: 15.00,
    currency: 'USD'
  },
  
  // Claude Models
  [AIModel.CLAUDE_3_OPUS]: {
    promptCostPer1M: 15.00,
    completionCostPer1M: 75.00,
    currency: 'USD'
  },
  [AIModel.CLAUDE_3_SONNET]: {
    promptCostPer1M: 3.00,
    completionCostPer1M: 15.00,
    currency: 'USD'
  },
  [AIModel.CLAUDE_3_HAIKU]: {
    promptCostPer1M: 0.25,
    completionCostPer1M: 1.25,
    currency: 'USD'
  },
  [AIModel.CLAUDE_35_SONNET]: {
    promptCostPer1M: 3.00,
    completionCostPer1M: 15.00,
    currency: 'USD'
  }
};

/**
 * Provider-specific error types
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: AIProvider,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class RateLimitError extends AIProviderError {
  constructor(provider: AIProvider, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, provider, 429);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends AIProviderError {
  constructor(provider: AIProvider) {
    super(`Authentication failed for ${provider}`, provider, 401);
    this.name = 'AuthenticationError';
  }
}

export class InvalidRequestError extends AIProviderError {
  constructor(provider: AIProvider, message: string) {
    super(`Invalid request for ${provider}: ${message}`, provider, 400);
    this.name = 'InvalidRequestError';
  }
}