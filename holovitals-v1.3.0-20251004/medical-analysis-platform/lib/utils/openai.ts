/**
 * OpenAI Client Wrapper
 * 
 * Provides a configured OpenAI client with error handling,
 * retry logic, and cost tracking.
 */

import OpenAI from 'openai';
import { TOKEN_COSTS } from '@/lib/types/chatbot';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Calculate cost for token usage
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const costs = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS];
  
  if (!costs) {
    console.warn(`Unknown model: ${model}, using gpt-3.5-turbo costs`);
    const defaultCosts = TOKEN_COSTS['gpt-3.5-turbo'];
    return (
      (promptTokens / 1000) * defaultCosts.prompt +
      (completionTokens / 1000) * defaultCosts.completion
    );
  }

  return (
    (promptTokens / 1000) * costs.prompt +
    (completionTokens / 1000) * costs.completion
  );
}

/**
 * Create chat completion with error handling
 */
export async function createChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stream?: boolean;
  } = {}
) {
  const {
    model = 'gpt-3.5-turbo',
    maxTokens = 500,
    temperature = 0.7,
    topP = 1,
    frequencyPenalty = 0,
    presencePenalty = 0,
    stream = false
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stream
    });

    return response;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.status === 401) {
      throw new Error('Invalid API key. Please check your configuration.');
    } else if (error.status === 500) {
      throw new Error('OpenAI service error. Please try again later.');
    }
    
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

/**
 * Create streaming chat completion
 */
export async function* createStreamingChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  } = {}
) {
  const {
    model = 'gpt-3.5-turbo',
    maxTokens = 500,
    temperature = 0.7,
    topP = 1,
    frequencyPenalty = 0,
    presencePenalty = 0
  } = options;

  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error: any) {
    console.error('OpenAI Streaming Error:', error);
    throw new Error(`Streaming error: ${error.message}`);
  }
}

/**
 * Retry wrapper for API calls
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error.status === 401) {
        throw error;
      }

      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError!;
}

/**
 * Validate OpenAI API key
 */
export async function validateApiKey(): Promise<boolean> {
  try {
    await openai.models.list();
    return true;
  } catch (error) {
    console.error('Invalid OpenAI API key');
    return false;
  }
}

/**
 * Get available models
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await openai.models.list();
    return response.data
      .filter(model => model.id.includes('gpt'))
      .map(model => model.id);
  } catch (error) {
    console.error('Error fetching models:', error);
    return ['gpt-3.5-turbo', 'gpt-4'];
  }
}