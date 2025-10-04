'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  DollarSign,
  Clock,
  Zap,
  Plus,
  Trash2,
  Settings
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
  cost?: number;
  model?: string;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: Date;
  messageCount: number;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Blood Test Analysis',
      lastMessage: new Date('2024-09-30T10:30:00'),
      messageCount: 8
    },
    {
      id: '2',
      title: 'MRI Results Discussion',
      lastMessage: new Date('2024-09-29T15:45:00'),
      messageCount: 12
    },
  ]);

  const [activeConversationId, setActiveConversationId] = useState('1');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI medical assistant. I can help you understand your medical documents, answer questions about your health data, and provide insights. How can I assist you today?',
      timestamp: new Date('2024-09-30T10:00:00'),
      tokens: 45,
      cost: 0.002,
      model: 'GPT-4'
    },
    {
      id: '2',
      role: 'user',
      content: 'Can you analyze my recent blood test results?',
      timestamp: new Date('2024-09-30T10:01:00'),
    },
    {
      id: '3',
      role: 'assistant',
      content: 'I\'d be happy to help analyze your blood test results. Based on the document you uploaded (Blood_Test_Results_2024.pdf), I can see several key metrics:\n\n1. **Cholesterol Levels**: Your total cholesterol is 195 mg/dL, which is within the normal range (< 200 mg/dL).\n\n2. **Blood Glucose**: Your fasting glucose is 92 mg/dL, which is normal (70-100 mg/dL).\n\n3. **Hemoglobin**: 14.5 g/dL - within normal range for adults.\n\nOverall, your results look good! Would you like me to explain any specific values in more detail?',
      timestamp: new Date('2024-09-30T10:02:00'),
      tokens: 180,
      cost: 0.009,
      model: 'GPT-4'
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a simulated response. In production, this would connect to the LightweightChatbotService API and stream the response in real-time.',
        timestamp: new Date(),
        tokens: 85,
        cost: 0.004,
        model: selectedModel === 'gpt-4' ? 'GPT-4' : selectedModel === 'claude-3.5-sonnet' ? 'Claude 3.5 Sonnet' : 'Llama 3.2',
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      lastMessage: new Date(),
      messageCount: 0,
    };
    setConversations([newConv, ...conversations]);
    setActiveConversationId(newConv.id);
    setMessages([]);
  };

  const handleDeleteConversation = (id: string) => {
    if (confirm('Delete this conversation?')) {
      setConversations(conversations.filter(c => c.id !== id));
      if (activeConversationId === id && conversations.length > 1) {
        setActiveConversationId(conversations[0].id);
      }
    }
  };

  const totalCost = messages
    .filter(m => m.cost)
    .reduce((sum, m) => sum + (m.cost || 0), 0);

  const totalTokens = messages
    .filter(m => m.tokens)
    .reduce((sum, m) => sum + (m.tokens || 0), 0);

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Conversations Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        {/* New Conversation Button */}
        <Button onClick={handleNewConversation} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          New Conversation
        </Button>

        {/* Model Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">AI Model</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4 (Best Quality)</SelectItem>
                <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                <SelectItem value="llama-3.2-90b">Llama 3.2 90B (Free)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Session Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-800">Messages:</span>
              <span className="font-medium">{messages.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-800">Tokens:</span>
              <span className="font-medium">{totalTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-800">Cost:</span>
              <span className="font-medium">${totalCost.toFixed(4)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-[400px]">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    activeConversationId === conv.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setActiveConversationId(conv.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate mb-1">
                        {conv.title}
                      </h4>
                      <p className="text-xs text-gray-700">
                        {conv.messageCount} messages
                      </p>
                      <p className="text-xs text-gray-600">
                        {conv.lastMessage.toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {/* Chat Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>AI Medical Assistant</CardTitle>
                <p className="text-sm text-gray-700">
                  Powered by {selectedModel === 'gpt-4' ? 'GPT-4' : selectedModel === 'claude-3.5-sonnet' ? 'Claude 3.5' : 'Llama 3.2'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                <div className="flex items-center gap-3 mt-2 text-xs opacity-70">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.tokens && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {message.tokens} tokens
                    </span>
                  )}
                  {message.cost && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ${message.cost.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-800" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-700 mt-2">
            Press Enter to send • Using {selectedModel === 'gpt-4' ? 'GPT-4' : selectedModel === 'claude-3.5-sonnet' ? 'Claude 3.5 Sonnet' : 'Llama 3.2 90B'}
          </p>
        </div>
      </Card>
    </div>
  );
}