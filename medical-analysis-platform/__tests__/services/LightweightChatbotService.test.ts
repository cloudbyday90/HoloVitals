/**
 * Tests for LightweightChatbotService
 */

import { LightweightChatbotService } from '@/lib/services/LightweightChatbotService';
import { ChatRequest, MessageRole, QueryComplexity } from '@/lib/types/chatbot';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    chatConversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    aIInteraction: {
      create: jest.fn(),
    },
    chatbotCost: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

// Mock OpenAI
jest.mock('@/lib/utils/openai', () => ({
  createChatCompletion: jest.fn().mockResolvedValue({
    choices: [{ message: { content: 'Test response' } }],
    usage: {
      prompt_tokens: 50,
      completion_tokens: 20,
      total_tokens: 70,
    },
  }),
  createStreamingChatCompletion: jest.fn(),
  calculateCost: jest.fn().mockReturnValue(0.001),
  withRetry: jest.fn((fn) => fn()),
}));

// Mock token counter
jest.mock('@/lib/utils/tokenCounter', () => ({
  countMessageTokens: jest.fn().mockReturnValue(50),
  truncateMessages: jest.fn((messages) => messages),
  getAvailableCompletionTokens: jest.fn().mockReturnValue(500),
  getContextWindowSize: jest.fn().mockReturnValue(4096),
}));

// Mock query classifier
jest.mock('@/lib/utils/queryClassifier', () => ({
  classifyQueryComplexity: jest.fn().mockReturnValue('SIMPLE'),
  shouldEscalate: jest.fn().mockReturnValue({
    shouldEscalate: false,
    confidence: 0.9,
    complexity: 'SIMPLE',
  }),
  getSuggestedFollowUps: jest.fn().mockReturnValue([
    'Would you like more information?',
  ]),
  estimateClassificationConfidence: jest.fn().mockReturnValue(0.9),
}));

describe('LightweightChatbotService', () => {
  let service: LightweightChatbotService;
  let mockPrisma: any;

  beforeEach(() => {
    service = new LightweightChatbotService();
    mockPrisma = (service as any).prisma;
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await service.cleanup();
  });

  describe('chat', () => {
    it('should process a simple chat request', async () => {
      const mockConversation = {
        id: 'conv-123',
        userId: 'user-123',
        title: 'Test Conversation',
        totalTokens: 0,
        totalCost: 0,
        isActive: true,
      };

      const mockMessage = {
        id: 'msg-123',
        conversationId: 'conv-123',
        role: MessageRole.ASSISTANT,
        content: 'Test response',
        tokens: 20,
      };

      mockPrisma.chatConversation.create.mockResolvedValue(mockConversation);
      mockPrisma.chatMessage.create.mockResolvedValue(mockMessage);
      mockPrisma.chatConversation.findUnique.mockResolvedValue({
        ...mockConversation,
        messages: [],
      });
      mockPrisma.chatMessage.findMany.mockResolvedValue([]);

      const request: ChatRequest = {
        userId: 'user-123',
        message: 'What is my blood pressure?',
      };

      const response = await service.chat(request);

      expect(response).toBeDefined();
      expect(response.content).toBe('Test response');
      expect(response.role).toBe(MessageRole.ASSISTANT);
      expect(response.escalated).toBe(false);
      expect(response.processingTime).toBeGreaterThan(0);
      expect(mockPrisma.chatConversation.create).toHaveBeenCalled();
      expect(mockPrisma.chatMessage.create).toHaveBeenCalledTimes(2);
    });

    it('should handle escalation for complex queries', async () => {
      const { shouldEscalate } = require('@/lib/utils/queryClassifier');
      shouldEscalate.mockReturnValueOnce({
        shouldEscalate: true,
        reason: 'COMPLEXITY',
        confidence: 0.9,
        complexity: 'COMPLEX',
      });

      const mockConversation = {
        id: 'conv-123',
        userId: 'user-123',
        title: 'Test Conversation',
        totalTokens: 0,
        totalCost: 0,
        isActive: true,
      };

      const mockMessage = {
        id: 'msg-123',
        conversationId: 'conv-123',
        role: MessageRole.ASSISTANT,
        content: 'Escalation message',
        tokens: 20,
      };

      mockPrisma.chatConversation.create.mockResolvedValue(mockConversation);
      mockPrisma.chatMessage.create.mockResolvedValue(mockMessage);

      const request: ChatRequest = {
        userId: 'user-123',
        message: 'Analyze all my lab results and compare trends over the past year',
      };

      const response = await service.chat(request);

      expect(response.escalated).toBe(true);
      expect(response.escalationReason).toBe('COMPLEXITY');
      expect(response.cost).toBe(0); // No API cost for escalation
    });

    it('should use existing conversation if conversationId provided', async () => {
      const mockConversation = {
        id: 'conv-existing',
        userId: 'user-123',
        title: 'Existing Conversation',
        totalTokens: 100,
        totalCost: 0.01,
        isActive: true,
      };

      mockPrisma.chatConversation.findUnique.mockResolvedValue({
        ...mockConversation,
        messages: [],
      });
      mockPrisma.chatMessage.create.mockResolvedValue({
        id: 'msg-123',
        conversationId: 'conv-existing',
        role: MessageRole.ASSISTANT,
        content: 'Test response',
        tokens: 20,
      });
      mockPrisma.chatMessage.findMany.mockResolvedValue([]);

      const request: ChatRequest = {
        conversationId: 'conv-existing',
        userId: 'user-123',
        message: 'Follow-up question',
      };

      await service.chat(request);

      expect(mockPrisma.chatConversation.findUnique).toHaveBeenCalledWith({
        where: { id: 'conv-existing' },
      });
      expect(mockPrisma.chatConversation.create).not.toHaveBeenCalled();
    });

    it('should include conversation history in context', async () => {
      const mockConversation = {
        id: 'conv-123',
        userId: 'user-123',
        title: 'Test Conversation',
        totalTokens: 0,
        totalCost: 0,
        isActive: true,
      };

      const mockHistory = [
        {
          id: 'msg-1',
          conversationId: 'conv-123',
          role: 'USER',
          content: 'Previous question',
          tokens: 10,
          createdAt: new Date(),
        },
        {
          id: 'msg-2',
          conversationId: 'conv-123',
          role: 'ASSISTANT',
          content: 'Previous answer',
          tokens: 15,
          createdAt: new Date(),
        },
      ];

      mockPrisma.chatConversation.create.mockResolvedValue(mockConversation);
      mockPrisma.chatMessage.findMany.mockResolvedValue(mockHistory);
      mockPrisma.chatMessage.create.mockResolvedValue({
        id: 'msg-123',
        conversationId: 'conv-123',
        role: MessageRole.ASSISTANT,
        content: 'Test response',
        tokens: 20,
      });
      mockPrisma.chatConversation.findUnique.mockResolvedValue({
        ...mockConversation,
        messages: mockHistory,
      });

      const request: ChatRequest = {
        userId: 'user-123',
        message: 'Follow-up question',
        context: { includeHistory: true },
      };

      await service.chat(request);

      expect(mockPrisma.chatMessage.findMany).toHaveBeenCalledWith({
        where: { conversationId: mockConversation.id },
        orderBy: { createdAt: 'asc' },
        take: expect.any(Number),
      });
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation with messages', async () => {
      const mockConversation = {
        id: 'conv-123',
        userId: 'user-123',
        title: 'Test Conversation',
        messages: [
          { id: 'msg-1', content: 'Message 1' },
          { id: 'msg-2', content: 'Message 2' },
        ],
      };

      mockPrisma.chatConversation.findUnique.mockResolvedValue(mockConversation);

      const result = await service.getConversationHistory('conv-123');

      expect(result).toEqual(mockConversation);
      expect(mockPrisma.chatConversation.findUnique).toHaveBeenCalledWith({
        where: { id: 'conv-123' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });
  });

  describe('getUserConversations', () => {
    it('should retrieve all conversations for a user', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          userId: 'user-123',
          title: 'Conversation 1',
          messages: [{ id: 'msg-1', content: 'Latest message' }],
        },
        {
          id: 'conv-2',
          userId: 'user-123',
          title: 'Conversation 2',
          messages: [{ id: 'msg-2', content: 'Latest message' }],
        },
      ];

      mockPrisma.chatConversation.findMany.mockResolvedValue(mockConversations);

      const result = await service.getUserConversations('user-123');

      expect(result).toEqual(mockConversations);
      expect(mockPrisma.chatConversation.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation and all messages', async () => {
      mockPrisma.chatMessage.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.chatConversation.delete.mockResolvedValue({
        id: 'conv-123',
      });

      await service.deleteConversation('conv-123');

      expect(mockPrisma.chatMessage.deleteMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-123' },
      });
      expect(mockPrisma.chatConversation.delete).toHaveBeenCalledWith({
        where: { id: 'conv-123' },
      });
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const { createChatCompletion } = require('@/lib/utils/openai');
      createChatCompletion.mockRejectedValueOnce(new Error('API Error'));

      mockPrisma.chatConversation.create.mockResolvedValue({
        id: 'conv-123',
        userId: 'user-123',
      });
      mockPrisma.chatMessage.findMany.mockResolvedValue([]);

      const request: ChatRequest = {
        userId: 'user-123',
        message: 'Test message',
      };

      await expect(service.chat(request)).rejects.toThrow();
    });
  });
});