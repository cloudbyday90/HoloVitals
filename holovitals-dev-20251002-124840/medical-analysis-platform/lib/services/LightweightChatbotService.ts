/**
 * Lightweight Chatbot Service
 * 
 * Fast AI-powered chatbot using GPT-3.5 Turbo for 80% of user queries.
 * Automatically escalates complex queries to heavy-duty analysis.
 * 
 * Features:
 * - <2 second response time
 * - Conversation context management
 * - Query complexity classification
 * - Automatic escalation triggers
 * - Cost tracking
 * - Response streaming
 */

import { PrismaClient } from '@prisma/client';
import {
  ChatRequest,
  ChatResponse,
  ChatMessage,
  MessageRole,
  QueryComplexity,
  EscalationReason,
  ChatbotConfig,
  DEFAULT_CHATBOT_CONFIG,
  SYSTEM_PROMPTS,
  TokenUsage
} from '@/lib/types/chatbot';
import {
  createChatCompletion,
  createStreamingChatCompletion,
  calculateCost,
  withRetry
} from '@/lib/utils/openai';
import {
  countMessageTokens,
  truncateMessages,
  getAvailableCompletionTokens,
  getContextWindowSize
} from '@/lib/utils/tokenCounter';
import {
  classifyQueryComplexity,
  shouldEscalate,
  getSuggestedFollowUps,
  estimateClassificationConfidence
} from '@/lib/utils/queryClassifier';

export class LightweightChatbotService {
  private prisma: PrismaClient;
  private config: ChatbotConfig;

  constructor(config: Partial<ChatbotConfig> = {}) {
    this.prisma = new PrismaClient();
    this.config = { ...DEFAULT_CHATBOT_CONFIG, ...config };
  }

  /**
   * Process a chat request
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        request.conversationId,
        request.userId
      );

      // Classify query complexity
      const complexity = classifyQueryComplexity(request.message);
      const classificationConfidence = estimateClassificationConfidence(
        request.message,
        complexity
      );

      // Check if escalation is needed
      const escalationTrigger = shouldEscalate(request.message, {
        documentCount: request.context?.documentIds?.length,
        hasTemporalData: request.context?.includeHistory,
        userRequestedDetailed: false
      });

      // If escalation needed, return escalation response
      if (escalationTrigger.shouldEscalate) {
        return await this.handleEscalation(
          conversation.id,
          request.message,
          escalationTrigger.reason!,
          complexity,
          startTime
        );
      }

      // Build context messages
      const contextMessages = await this.buildContextMessages(
        conversation.id,
        request.message,
        request.context
      );

      // Calculate available tokens
      const availableTokens = getAvailableCompletionTokens(
        contextMessages,
        this.config.model,
        this.config.maxTokens
      );

      // Create chat completion
      const completion = await withRetry(() =>
        createChatCompletion(contextMessages, {
          model: this.config.model,
          maxTokens: availableTokens,
          temperature: this.config.temperature,
          topP: this.config.topP,
          frequencyPenalty: this.config.frequencyPenalty,
          presencePenalty: this.config.presencePenalty,
          stream: false
        })
      );

      const assistantMessage = completion.choices[0].message.content || '';
      const usage = completion.usage!;

      // Calculate cost
      const cost = calculateCost(
        this.config.model,
        usage.prompt_tokens,
        usage.completion_tokens
      );

      // Save messages to database
      const userMessage = await this.saveMessage(
        conversation.id,
        MessageRole.USER,
        request.message,
        usage.prompt_tokens,
        complexity
      );

      const assistantMessageRecord = await this.saveMessage(
        conversation.id,
        MessageRole.ASSISTANT,
        assistantMessage,
        usage.completion_tokens
      );

      // Update conversation
      await this.updateConversation(conversation.id, cost);

      // Track interaction
      await this.trackInteraction(
        conversation.id,
        request.userId,
        usage,
        cost,
        Date.now() - startTime
      );

      // Get suggestions
      const suggestions = getSuggestedFollowUps(request.message, complexity);

      const processingTime = Date.now() - startTime;

      return {
        conversationId: conversation.id,
        messageId: assistantMessageRecord.id,
        content: assistantMessage,
        role: MessageRole.ASSISTANT,
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens
        },
        cost,
        complexity,
        escalated: false,
        processingTime,
        model: this.config.model,
        metadata: {
          confidence: classificationConfidence,
          suggestions
        }
      };
    } catch (error: any) {
      console.error('Chat error:', error);
      throw new Error(`Chat processing failed: ${error.message}`);
    }
  }

  /**
   * Stream chat response
   */
  async *streamChat(request: ChatRequest): AsyncGenerator<string> {
    try {
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        request.conversationId,
        request.userId
      );

      // Build context messages
      const contextMessages = await this.buildContextMessages(
        conversation.id,
        request.message,
        request.context
      );

      // Stream response
      let fullResponse = '';
      const stream = createStreamingChatCompletion(contextMessages, {
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature,
        topP: this.config.topP,
        frequencyPenalty: this.config.frequencyPenalty,
        presencePenalty: this.config.presencePenalty
      });

      for await (const chunk of stream) {
        fullResponse += chunk;
        yield chunk;
      }

      // Save messages after streaming completes
      const complexity = classifyQueryComplexity(request.message);
      const promptTokens = countMessageTokens(contextMessages, this.config.model);
      const completionTokens = countMessageTokens(
        [{ role: 'assistant', content: fullResponse }],
        this.config.model
      );

      await this.saveMessage(
        conversation.id,
        MessageRole.USER,
        request.message,
        promptTokens,
        complexity
      );

      await this.saveMessage(
        conversation.id,
        MessageRole.ASSISTANT,
        fullResponse,
        completionTokens
      );

      const cost = calculateCost(
        this.config.model,
        promptTokens,
        completionTokens
      );

      await this.updateConversation(conversation.id, cost);
    } catch (error: any) {
      console.error('Streaming error:', error);
      throw new Error(`Streaming failed: ${error.message}`);
    }
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
        title: 'New Conversation',
        totalTokens: 0,
        totalCost: 0,
        isActive: true
      }
    });
  }

  /**
   * Build context messages for chat completion
   */
  private async buildContextMessages(
    conversationId: string,
    currentMessage: string,
    context?: ChatRequest['context']
  ): Promise<Array<{ role: string; content: string }>> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add system prompt
    let systemPrompt = SYSTEM_PROMPTS.general;
    if (context?.documentIds && context.documentIds.length > 0) {
      systemPrompt = SYSTEM_PROMPTS.documentAnalysis;
    }
    messages.push({ role: 'system', content: systemPrompt });

    // Get conversation history
    if (context?.includeHistory !== false) {
      const history = await this.prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: this.config.maxContextMessages
      });

      for (const msg of history) {
        messages.push({
          role: msg.role.toLowerCase(),
          content: msg.content
        });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: currentMessage });

    // Truncate if needed
    const contextWindow = getContextWindowSize(this.config.model);
    const maxContextTokens = contextWindow - this.config.maxTokens - 100; // Buffer

    return truncateMessages(messages, maxContextTokens, this.config.model, true);
  }

  /**
   * Save message to database
   */
  private async saveMessage(
    conversationId: string,
    role: MessageRole,
    content: string,
    tokens: number,
    complexity?: QueryComplexity
  ) {
    return await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role,
        content,
        tokens,
        complexity,
        escalated: false
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
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
    cost: number,
    responseTime: number
  ) {
    await this.prisma.aIInteraction.create({
      data: {
        userId,
        interactionType: 'CHAT',
        model: this.config.model,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        cost,
        responseTime,
        success: true,
        metadata: { conversationId }
      }
    });

    // Track chatbot cost
    await this.prisma.chatbotCost.create({
      data: {
        conversationId,
        model: this.config.model,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        cost
      }
    });
  }

  /**
   * Handle escalation to heavy-duty analysis
   */
  private async handleEscalation(
    conversationId: string,
    message: string,
    reason: EscalationReason,
    complexity: QueryComplexity,
    startTime: number
  ): Promise<ChatResponse> {
    // Save user message with escalation flag
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: MessageRole.USER,
        content: message,
        tokens: countMessageTokens([{ role: 'user', content: message }], this.config.model),
        complexity,
        escalated: true,
        escalationReason: reason
      }
    });

    // Create escalation response
    const escalationMessage = this.getEscalationMessage(reason);
    
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: MessageRole.ASSISTANT,
        content: escalationMessage,
        tokens: countMessageTokens(
          [{ role: 'assistant', content: escalationMessage }],
          this.config.model
        ),
        escalated: true,
        escalationReason: reason
      }
    });

    const processingTime = Date.now() - startTime;

    return {
      conversationId,
      messageId: assistantMessage.id,
      content: escalationMessage,
      role: MessageRole.ASSISTANT,
      tokens: {
        prompt: userMessage.tokens,
        completion: assistantMessage.tokens,
        total: userMessage.tokens + assistantMessage.tokens
      },
      cost: 0, // No API cost for escalation message
      complexity,
      escalated: true,
      escalationReason: reason,
      processingTime,
      model: this.config.model,
      metadata: {
        requiresDetailedAnalysis: true
      }
    };
  }

  /**
   * Get escalation message based on reason
   */
  private getEscalationMessage(reason: EscalationReason): string {
    const messages: Record<EscalationReason, string> = {
      [EscalationReason.COMPLEXITY]: 
        'This query requires detailed analysis. I\'m creating a comprehensive analysis request for you. This will take a few minutes but will provide much more thorough insights.',
      [EscalationReason.MEDICAL_ANALYSIS]:
        'This requires detailed medical analysis. I\'m preparing a comprehensive medical review that will analyze all relevant information and provide detailed insights.',
      [EscalationReason.MULTIPLE_DOCUMENTS]:
        'You\'re asking about multiple documents. I\'m creating a cross-document analysis that will compare and synthesize information from all relevant sources.',
      [EscalationReason.TREND_ANALYSIS]:
        'This requires temporal trend analysis. I\'m preparing a detailed analysis of changes over time with visualizations and insights.',
      [EscalationReason.UNCERTAINTY]:
        'I want to provide you with the most accurate information. I\'m escalating this to our detailed analysis system for a more thorough review.',
      [EscalationReason.USER_REQUEST]:
        'I\'m creating a detailed analysis as requested. This will provide comprehensive insights and recommendations.'
    };

    return messages[reason] || messages[EscalationReason.COMPLEXITY];
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
   * Cleanup resources
   */
  async cleanup() {
    await this.prisma.$disconnect();
  }
}