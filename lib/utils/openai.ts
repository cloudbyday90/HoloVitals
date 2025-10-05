/**
 * OpenAI Utility
 * Manages OpenAI client initialization with database configuration
 */

import OpenAI from 'openai';
import ServiceConfigurationService from '@/lib/services/ServiceConfigurationService';

let openaiClient: OpenAI | null = null;
let lastConfigCheck: number = 0;
const CONFIG_CHECK_INTERVAL = 60000; // Check config every 60 seconds

const serviceConfigService = new ServiceConfigurationService();

/**
 * Check if OpenAI is configured in the database
 */
export async function isOpenAIConfigured(): Promise<boolean> {
  try {
    const config = await serviceConfigService.getOpenAIConfig();
    return config !== null && !!config.apiKey;
  } catch (error) {
    console.error('Error checking OpenAI configuration:', error);
    return false;
  }
}

/**
 * Get OpenAI client instance
 * Initializes client from database configuration
 */
export async function getOpenAIClient(): Promise<OpenAI | null> {
  try {
    const now = Date.now();
    
    // Check if we need to refresh configuration
    if (!openaiClient || now - lastConfigCheck > CONFIG_CHECK_INTERVAL) {
      const config = await serviceConfigService.getOpenAIConfig();
      
      if (!config || !config.apiKey) {
        openaiClient = null;
        lastConfigCheck = now;
        return null;
      }

      // Initialize or reinitialize client
      openaiClient = new OpenAI({
        apiKey: config.apiKey,
      });
      
      lastConfigCheck = now;
    }

    return openaiClient;
  } catch (error) {
    console.error('Error getting OpenAI client:', error);
    return null;
  }
}

/**
 * Create chat completion
 */
export async function createChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const client = await getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI is not configured. Please configure OpenAI in the admin console.');
  }

  const config = await serviceConfigService.getOpenAIConfig();
  
  return await client.chat.completions.create({
    model: options?.model || config?.model || 'gpt-3.5-turbo',
    messages: messages as any,
    temperature: options?.temperature ?? config?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? config?.maxTokens ?? 1000,
  });
}

/**
 * Create streaming chat completion
 */
export async function createStreamingChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const client = await getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI is not configured. Please configure OpenAI in the admin console.');
  }

  const config = await serviceConfigService.getOpenAIConfig();
  
  return await client.chat.completions.create({
    model: options?.model || config?.model || 'gpt-3.5-turbo',
    messages: messages as any,
    temperature: options?.temperature ?? config?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? config?.maxTokens ?? 1000,
    stream: true,
  });
}

/**
 * Force refresh OpenAI client configuration
 */
export function refreshOpenAIClient(): void {
  openaiClient = null;
  lastConfigCheck = 0;
}