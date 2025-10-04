/**
 * Token Counter Utility
 * 
 * Provides accurate token counting for OpenAI models using tiktoken.
 * Essential for cost estimation and context window management.
 */

import { encoding_for_model, TiktokenModel } from 'tiktoken';

// Cache encodings to avoid repeated initialization
const encodingCache = new Map<string, any>();

/**
 * Get encoding for a specific model
 */
function getEncoding(model: string) {
  if (encodingCache.has(model)) {
    return encodingCache.get(model);
  }

  try {
    const encoding = encoding_for_model(model as TiktokenModel);
    encodingCache.set(model, encoding);
    return encoding;
  } catch (error) {
    // Fallback to gpt-3.5-turbo encoding
    console.warn(`Unknown model ${model}, using gpt-3.5-turbo encoding`);
    const encoding = encoding_for_model('gpt-3.5-turbo');
    encodingCache.set(model, encoding);
    return encoding;
  }
}

/**
 * Count tokens in a text string
 */
export function countTokens(text: string, model: string = 'gpt-3.5-turbo'): number {
  if (!text || text.length === 0) {
    return 0;
  }

  try {
    const encoding = getEncoding(model);
    const tokens = encoding.encode(text);
    return tokens.length;
  } catch (error) {
    console.error('Error counting tokens:', error);
    // Fallback: rough estimate (1 token ≈ 4 characters)
    return Math.ceil(text.length / 4);
  }
}

/**
 * Count tokens in a message array
 */
export function countMessageTokens(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-3.5-turbo'
): number {
  let totalTokens = 0;

  // Add tokens for each message
  for (const message of messages) {
    // Every message follows <|start|>{role/name}\n{content}<|end|>\n
    totalTokens += 4; // Message formatting tokens
    totalTokens += countTokens(message.role, model);
    totalTokens += countTokens(message.content, model);
  }

  // Add tokens for reply priming
  totalTokens += 3;

  return totalTokens;
}

/**
 * Estimate tokens for a chat completion
 */
export function estimateCompletionTokens(
  promptTokens: number,
  maxTokens: number = 500
): number {
  // Estimate based on typical completion length
  // Usually 20-40% of max tokens for conversational responses
  return Math.min(maxTokens, Math.ceil(promptTokens * 0.3));
}

/**
 * Check if messages fit within context window
 */
export function fitsInContextWindow(
  messages: Array<{ role: string; content: string }>,
  maxContextTokens: number,
  model: string = 'gpt-3.5-turbo'
): boolean {
  const totalTokens = countMessageTokens(messages, model);
  return totalTokens <= maxContextTokens;
}

/**
 * Truncate messages to fit within context window
 */
export function truncateMessages(
  messages: Array<{ role: string; content: string }>,
  maxContextTokens: number,
  model: string = 'gpt-3.5-turbo',
  keepSystemMessage: boolean = true
): Array<{ role: string; content: string }> {
  if (messages.length === 0) {
    return [];
  }

  // Always keep system message if requested
  const systemMessage = keepSystemMessage && messages[0]?.role === 'system' 
    ? [messages[0]] 
    : [];
  
  const otherMessages = keepSystemMessage && messages[0]?.role === 'system'
    ? messages.slice(1)
    : messages;

  // Calculate tokens for system message
  const systemTokens = systemMessage.length > 0 
    ? countMessageTokens(systemMessage, model) 
    : 0;

  const availableTokens = maxContextTokens - systemTokens;

  // Start from the most recent messages and work backwards
  const truncated: Array<{ role: string; content: string }> = [];
  let currentTokens = 0;

  for (let i = otherMessages.length - 1; i >= 0; i--) {
    const message = otherMessages[i];
    const messageTokens = countMessageTokens([message], model);

    if (currentTokens + messageTokens <= availableTokens) {
      truncated.unshift(message);
      currentTokens += messageTokens;
    } else {
      break;
    }
  }

  return [...systemMessage, ...truncated];
}

/**
 * Get context window size for a model
 */
export function getContextWindowSize(model: string): number {
  const contextWindows: Record<string, number> = {
    'gpt-3.5-turbo': 4096,
    'gpt-3.5-turbo-16k': 16384,
    'gpt-4': 8192,
    'gpt-4-32k': 32768,
    'gpt-4-turbo': 128000,
    'gpt-4-turbo-preview': 128000
  };

  return contextWindows[model] || 4096;
}

/**
 * Calculate available tokens for completion
 */
export function getAvailableCompletionTokens(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-3.5-turbo',
  maxCompletionTokens: number = 500
): number {
  const contextWindow = getContextWindowSize(model);
  const promptTokens = countMessageTokens(messages, model);
  const available = contextWindow - promptTokens;

  return Math.min(available, maxCompletionTokens);
}

/**
 * Optimize message content by removing unnecessary whitespace
 */
export function optimizeMessageContent(content: string): string {
  return content
    .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n')      // Remove empty lines
    .trim();                         // Remove leading/trailing whitespace
}

/**
 * Get token statistics for messages
 */
export function getTokenStatistics(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-3.5-turbo'
): {
  totalTokens: number;
  messageCount: number;
  averageTokensPerMessage: number;
  contextWindow: number;
  utilizationPercentage: number;
} {
  const totalTokens = countMessageTokens(messages, model);
  const messageCount = messages.length;
  const averageTokensPerMessage = messageCount > 0 ? totalTokens / messageCount : 0;
  const contextWindow = getContextWindowSize(model);
  const utilizationPercentage = (totalTokens / contextWindow) * 100;

  return {
    totalTokens,
    messageCount,
    averageTokensPerMessage,
    contextWindow,
    utilizationPercentage
  };
}

/**
 * Cleanup: Free encoding resources
 */
export function cleanup() {
  for (const [, encoding] of encodingCache) {
    encoding.free();
  }
  encodingCache.clear();
}