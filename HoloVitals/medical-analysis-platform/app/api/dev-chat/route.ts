/**
 * AI Development Chat API Endpoint
 * 
 * Backend interface for AI-powered development assistance.
 * Supports multiple AI providers (OpenAI, Claude) with easy switching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIDevChatService, DevChatRequest } from '@/lib/services/AIDevChatService';
import { initializeProvidersFromEnv } from '@/lib/providers/ProviderManager';

// Initialize providers on module load
initializeProvidersFromEnv();

// Initialize dev chat service
const devChatService = new AIDevChatService();

// Mark route as dynamic to prevent static rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/dev-chat
 * Send a message to the AI development assistant
 */
export async function POST(request: NextRequest) {
  try {
    // Check if any AI provider is configured
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI chat is not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment variables or configure via admin console.' },
        { status: 503 }
      );
    }

    const body: DevChatRequest = await request.json();

    // Validate request
    if (!body.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!body.message || body.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if streaming is requested
    const stream = request.headers.get('accept') === 'text/event-stream';

    if (stream) {
      // Return streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of devChatService.streamChat(body)) {
              const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error: any) {
            const errorData = `data: ${JSON.stringify({ error: error.message })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Regular response
    const response = await devChatService.chat(body);

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Dev chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dev-chat?conversationId=xxx
 * Get conversation history or list conversations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (conversationId) {
      // Get specific conversation
      const conversation = await devChatService.getConversationHistory(conversationId);
      
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(conversation, { status: 200 });
    } else if (userId) {
      // Get all conversations for user
      const conversations = await devChatService.getUserConversations(userId);
      return NextResponse.json(conversations, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'conversationId or userId is required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Dev chat GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dev-chat?conversationId=xxx
 * Delete a conversation
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    await devChatService.deleteConversation(conversationId);

    return NextResponse.json(
      { message: 'Conversation deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Dev chat DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}