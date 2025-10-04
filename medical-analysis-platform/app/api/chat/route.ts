/**
 * Chat API Endpoint
 * 
 * Handles chat requests to the LightweightChatbotService.
 * Supports both regular and streaming responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LightweightChatbotService } from '@/lib/services/LightweightChatbotService';
import { ChatRequest } from '@/lib/types/chatbot';

// Mark route as dynamic to prevent static optimization
export const dynamic = 'force-dynamic';

// Lazy initialization of chatbot service
let chatbotService: LightweightChatbotService | null = null;
function getChatbotService() {
  if (!chatbotService) {
    chatbotService = new LightweightChatbotService();
  }
  return chatbotService;
}

/**
 * POST /api/chat
 * Send a message to the chatbot
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

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
            for await (const chunk of getChatbotService().streamChat(body)) {
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
    const response = await getChatbotService().chat(body);

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat?conversationId=xxx
 * Get conversation history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (conversationId) {
      // Get specific conversation
      const conversation = await getChatbotService().getConversationHistory(conversationId);
      
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(conversation, { status: 200 });
    } else if (userId) {
      // Get all conversations for user
      const conversations = await getChatbotService().getUserConversations(userId);
      return NextResponse.json(conversations, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'conversationId or userId is required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Chat GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat?conversationId=xxx
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

    await getChatbotService().deleteConversation(conversationId);

    return NextResponse.json(
      { message: 'Conversation deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Chat DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}