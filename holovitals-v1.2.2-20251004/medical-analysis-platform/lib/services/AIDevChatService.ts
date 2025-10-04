/**
 * AI Development Chat Service
 * 
 * Specialized chat service for development assistance using multiple AI providers.
 * Supports code generation, debugging, architecture discussions, and more.
 */

import { PrismaClient } from '@prisma/client';
import {
  AIProvider,
  AIModel,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk
} from '@/lib/types/ai-provider';
import { getProviderManager, ProviderManager } from '@/lib/providers/ProviderManager';

export enum DevChatMode {
  CODE_GENERATION = 'CODE_GENERATION',
  DEBUGGING = 'DEBUGGING',
  ARCHITECTURE = 'ARCHITECTURE',
  DOCUMENTATION = 'DOCUMENTATION',
  CODE_REVIEW = 'CODE_REVIEW',
  TEST_GENERATION = 'TEST_GENERATION',
  REFACTORING = 'REFACTORING',
  GENERAL = 'GENERAL'
}

export interface DevChatRequest {
  conversationId?: string;
  userId: string;
  message: string;
  mode?: DevChatMode;
  provider?: string; // Specific provider to use
  context?: {
    codeSnippet?: string;
    language?: string;
    framework?: string;
    errorMessage?: string;
    fileContext?: string[];
  };
}

export interface DevChatResponse {
  conversationId: string;
  messageId: string;
  content: string;
  provider: AIProvider;
  model: AIModel;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  processingTime: number;
  metadata?: {
    mode: DevChatMode;
    suggestions?: string[];
  };
}

export class AIDevChatService {
  private prisma: PrismaClient;
  private providerManager: ProviderManager;

  constructor() {
    this.prisma = new PrismaClient();
    this.providerManager = getProviderManager();
  }

  /**
   * Process a development chat request
   */
  async chat(request: DevChatRequest): Promise<DevChatResponse> {
    const startTime = Date.now();

    try {
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        request.conversationId,
        request.userId
      );

      // Build system prompt based on mode
      const systemPrompt = this.getSystemPrompt(request.mode || DevChatMode.GENERAL);

      // Build messages
      const messages = await this.buildMessages(
        conversation.id,
        systemPrompt,
        request.message,
        request.context
      );

      // Determine which provider to use
      if (request.provider) {
        this.providerManager.switchProvider(request.provider);
      }

      const provider = this.providerManager.getActiveProvider();

      // Create completion request
      const completionRequest: AICompletionRequest = {
        messages,
        model: provider.model,
        maxTokens: 4096,
        temperature: 0.7,
        stream: false
      };

      // Get completion
      const response = await this.providerManager.complete(completionRequest);

      // Save messages to database
      await this.saveMessage(
        conversation.id,
        'user',
        request.message,
        response.usage.promptTokens
      );

      await this.saveMessage(
        conversation.id,
        'assistant',
        response.content,
        response.usage.completionTokens
      );

      // Update conversation
      await this.updateConversation(conversation.id, response.cost);

      // Track interaction
      await this.trackInteraction(
        conversation.id,
        request.userId,
        provider.provider,
        provider.model,
        response.usage,
        response.cost,
        Date.now() - startTime
      );

      const processingTime = Date.now() - startTime;

      return {
        conversationId: conversation.id,
        messageId: conversation.id, // Use conversation ID as message ID for now
        content: response.content,
        provider: provider.provider,
        model: provider.model,
        tokens: response.usage,
        cost: response.cost,
        processingTime,
        metadata: {
          mode: request.mode || DevChatMode.GENERAL
        }
      };
    } catch (error: any) {
      console.error('Dev chat error:', error);
      throw new Error(`Dev chat processing failed: ${error.message}`);
    }
  }

  /**
   * Stream a development chat request
   */
  async *streamChat(request: DevChatRequest): AsyncGenerator<string> {
    try {
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        request.conversationId,
        request.userId
      );

      // Build system prompt based on mode
      const systemPrompt = this.getSystemPrompt(request.mode || DevChatMode.GENERAL);

      // Build messages
      const messages = await this.buildMessages(
        conversation.id,
        systemPrompt,
        request.message,
        request.context
      );

      // Determine which provider to use
      if (request.provider) {
        this.providerManager.switchProvider(request.provider);
      }

      const provider = this.providerManager.getActiveProvider();

      // Create completion request
      const completionRequest: AICompletionRequest = {
        messages,
        model: provider.model,
        maxTokens: 4096,
        temperature: 0.7,
        stream: true
      };

      // Stream response
      let fullResponse = '';
      for await (const chunk of this.providerManager.stream(completionRequest)) {
        if (chunk.content) {
          fullResponse += chunk.content;
          yield chunk.content;
        }
      }

      // Save messages after streaming completes
      const promptTokens = provider.countTokens(messages.map(m => m.content).join('\n'));
      const completionTokens = provider.countTokens(fullResponse);
      const cost = provider.calculateCost(promptTokens, completionTokens);

      await this.saveMessage(conversation.id, 'user', request.message, promptTokens);
      await this.saveMessage(conversation.id, 'assistant', fullResponse, completionTokens);
      await this.updateConversation(conversation.id, cost);
    } catch (error: any) {
      console.error('Dev chat streaming error:', error);
      throw new Error(`Dev chat streaming failed: ${error.message}`);
    }
  }

  /**
   * Switch AI provider
   */
  switchProvider(providerName: string): void {
    this.providerManager.switchProvider(providerName);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): Array<{
    name: string;
    provider: AIProvider;
    model: AIModel;
    isActive: boolean;
  }> {
    return this.providerManager.listProviders();
  }

  /**
   * Get active provider info
   */
  getActiveProviderInfo() {
    return this.providerManager.getProviderInfo();
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: string) {
    return await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId: string) {
    return await this.prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string) {
    await this.prisma.chatMessage.deleteMany({
      where: { conversationId }
    });

    await this.prisma.chatConversation.delete({
      where: { id: conversationId }
    });
  }

  /**
   * Get or create conversation
   */
  private async getOrCreateConversation(
    conversationId: string | undefined,
    userId: string
  ) {
    if (conversationId) {
      const conversation = await this.prisma.chatConversation.findUnique({
        where: { id: conversationId }
      });

      if (conversation) {
        return conversation;
      }
    }

    // Create new conversation
    return await this.prisma.chatConversation.create({
      data: {
        userId,
        title: 'Dev Chat',
        totalTokens: 0,
        totalCost: 0,
        isActive: true
      }
    });
  }

  /**
   * Build messages for completion
   */
  private async buildMessages(
    conversationId: string,
    systemPrompt: string,
    currentMessage: string,
    context?: DevChatRequest['context']
  ) {
    const messages: AICompletionRequest['messages'] = [];

    // Add system prompt
    messages.push({ role: 'system', content: systemPrompt });

    // Get conversation history
    const history = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 10 // Last 10 messages
    });

    for (const msg of history) {
      messages.push({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content
      });
    }

    // Add context if provided
    let messageWithContext = currentMessage;
    if (context) {
      if (context.codeSnippet) {
        messageWithContext += `\n\n\`\`\`${context.language || ''}\n${context.codeSnippet}\n\`\`\``;
      }
      if (context.errorMessage) {
        messageWithContext += `\n\nError: ${context.errorMessage}`;
      }
      if (context.fileContext && context.fileContext.length > 0) {
        messageWithContext += `\n\nRelated files: ${context.fileContext.join(', ')}`;
      }
    }

    // Add current message
    messages.push({ role: 'user', content: messageWithContext });

    return messages;
  }

  /**
   * Get system prompt based on mode
   */
  private getSystemPrompt(mode: DevChatMode): string {
    const prompts: Record<DevChatMode, string> = {
      [DevChatMode.CODE_GENERATION]: `You are an expert software developer assistant specializing in code generation.
Your role is to write clean, efficient, well-documented code following best practices.
Always explain your code and provide usage examples.
Consider edge cases, error handling, and performance.`,

      [DevChatMode.DEBUGGING]: `You are an expert debugging assistant.
Your role is to help identify and fix bugs in code.
Analyze error messages, stack traces, and code to find root causes.
Provide clear explanations and step-by-step solutions.
Suggest preventive measures to avoid similar bugs.`,

      [DevChatMode.ARCHITECTURE]: `You are a software architecture expert.
Your role is to help design scalable, maintainable system architectures.
Consider design patterns, best practices, and trade-offs.
Provide diagrams, explanations, and implementation guidance.
Focus on long-term maintainability and scalability.`,

      [DevChatMode.DOCUMENTATION]: `You are a technical documentation specialist.
Your role is to create clear, comprehensive documentation.
Write for different audiences: developers, users, and stakeholders.
Include examples, diagrams, and best practices.
Make documentation easy to understand and maintain.`,

      [DevChatMode.CODE_REVIEW]: `You are an experienced code reviewer.
Your role is to review code for quality, security, and best practices.
Identify bugs, performance issues, and maintainability concerns.
Provide constructive feedback with specific suggestions.
Highlight both strengths and areas for improvement.`,

      [DevChatMode.TEST_GENERATION]: `You are a testing expert.
Your role is to generate comprehensive test cases.
Write unit tests, integration tests, and edge case tests.
Follow testing best practices and use appropriate frameworks.
Ensure high code coverage and meaningful assertions.`,

      [DevChatMode.REFACTORING]: `You are a code refactoring specialist.
Your role is to improve code quality without changing functionality.
Focus on readability, maintainability, and performance.
Apply design patterns and best practices.
Explain the benefits of each refactoring.`,

      [DevChatMode.GENERAL]: `You are a helpful AI development assistant.
Your role is to help with any development-related questions.
Provide clear, accurate, and practical advice.
Use examples and explanations to make concepts clear.
Be concise but thorough in your responses.`
    };

    return prompts[mode];
  }

  /**
   * Save message to database
   */
  private async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    tokens: number
  ) {
    return await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: role.toUpperCase() as any,
        content,
        tokens
      }
    });
  }

  /**
   * Update conversation totals
   */
  private async updateConversation(conversationId: string, additionalCost: number) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { messages: true }
    });

    if (!conversation) return;

    const totalTokens = conversation.messages.reduce(
      (sum, msg) => sum + msg.tokens,
      0
    );

    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        totalTokens,
        totalCost: conversation.totalCost + additionalCost,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Track AI interaction
   */
  private async trackInteraction(
    conversationId: string,
    userId: string,
    provider: AIProvider,
    model: AIModel,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number },
    cost: number,
    responseTime: number
  ) {
    await this.prisma.aIInteraction.create({
      data: {
        userId,
        interactionType: 'DEV_CHAT',
        model: `${provider}:${model}`,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        cost,
        responseTime,
        success: true,
        metadata: { conversationId, provider, model }
      }
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.prisma.$disconnect();
  }
}