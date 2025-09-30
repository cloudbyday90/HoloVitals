/**
 * Type definitions for LightweightChatbotService
 * 
 * Defines types for chat conversations, messages, and AI interactions
 * used in the lightweight chatbot system.
 */

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM'
}

export enum QueryComplexity {
  SIMPLE = 'SIMPLE',           // Can be handled by GPT-3.5 Turbo
  MODERATE = 'MODERATE',       // Might need GPT-4
  COMPLEX = 'COMPLEX',         // Requires heavy-duty analysis
  CRITICAL = 'CRITICAL'        // Medical emergency or critical analysis
}

export enum EscalationReason {
  COMPLEXITY = 'COMPLEXITY',           // Query too complex
  MEDICAL_ANALYSIS = 'MEDICAL_ANALYSIS', // Requires detailed medical analysis
  MULTIPLE_DOCUMENTS = 'MULTIPLE_DOCUMENTS', // Cross-document analysis
  TREND_ANALYSIS = 'TREND_ANALYSIS',   // Temporal trend analysis
  UNCERTAINTY = 'UNCERTAINTY',         // AI is uncertain about response
  USER_REQUEST = 'USER_REQUEST'        // User explicitly requests detailed analysis
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  tokens: number;
  complexity?: QueryComplexity;
  escalated?: boolean;
  escalationReason?: EscalationReason;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ChatConversation {
  id: string;
  userId: string;
  title?: string;
  messages: ChatMessage[];
  totalTokens: number;
  totalCost: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  conversationId?: string;
  userId: string;
  message: string;
  context?: {
    documentIds?: string[];
    patientId?: string;
    includeHistory?: boolean;
  };
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  content: string;
  role: MessageRole;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  complexity: QueryComplexity;
  escalated: boolean;
  escalationReason?: EscalationReason;
  processingTime: number; // milliseconds
  model: string;
  metadata?: {
    confidence?: number;
    sources?: string[];
    suggestions?: string[];
  };
}

export interface EscalationTrigger {
  shouldEscalate: boolean;
  reason?: EscalationReason;
  confidence: number;
  complexity: QueryComplexity;
  metadata?: Record<string, any>;
}

export interface ContextWindow {
  maxTokens: number;
  currentTokens: number;
  messages: ChatMessage[];
  systemPrompt: string;
  availableTokens: number;
}

export interface ChatbotConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxContextMessages: number;
  escalationThreshold: number;
  streamResponse: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface ChatbotMetrics {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  escalationRate: number;
  successRate: number;
}

// Default configuration for GPT-3.5 Turbo
export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  model: 'gpt-3.5-turbo',
  maxTokens: 500,
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxContextMessages: 10,
  escalationThreshold: 0.7,
  streamResponse: true
};

// Token costs per 1K tokens (as of 2025)
export const TOKEN_COSTS = {
  'gpt-3.5-turbo': {
    prompt: 0.0005,    // $0.50 per 1M tokens
    completion: 0.0015  // $1.50 per 1M tokens
  },
  'gpt-4': {
    prompt: 0.03,      // $30 per 1M tokens
    completion: 0.06    // $60 per 1M tokens
  },
  'gpt-4-turbo': {
    prompt: 0.01,      // $10 per 1M tokens
    completion: 0.03    // $30 per 1M tokens
  }
};

// System prompts for different contexts
export const SYSTEM_PROMPTS = {
  general: `You are HoloVitals AI, a helpful medical document analysis assistant. 
You help patients understand their medical records, lab results, and health information.
Always be clear, accurate, and empathetic. If you're unsure about something medical, 
recommend consulting with a healthcare provider. Never provide medical diagnoses or treatment advice.`,

  documentAnalysis: `You are analyzing medical documents for a patient. 
Provide clear explanations of medical terms, lab values, and findings.
Highlight important information and potential concerns.
Always maintain patient privacy and confidentiality.`,

  labResults: `You are helping a patient understand their lab results.
Explain what each test measures, what the values mean, and whether they're in normal range.
Use simple language and avoid medical jargon when possible.
If values are abnormal, explain what that might indicate without diagnosing.`,

  trendAnalysis: `You are analyzing health trends over time.
Compare current values with historical data and identify patterns.
Explain whether trends are improving, stable, or concerning.
Recommend follow-up if trends indicate potential issues.`
};

// Complexity indicators for query classification
export const COMPLEXITY_INDICATORS = {
  simple: [
    'what is',
    'define',
    'explain',
    'meaning of',
    'normal range',
    'when was',
    'how many'
  ],
  moderate: [
    'compare',
    'difference between',
    'trend',
    'over time',
    'history of',
    'related to'
  ],
  complex: [
    'analyze',
    'correlation',
    'predict',
    'risk of',
    'multiple',
    'comprehensive',
    'detailed analysis'
  ],
  critical: [
    'emergency',
    'urgent',
    'critical',
    'severe',
    'life-threatening',
    'immediate'
  ]
};

// Escalation triggers
export const ESCALATION_TRIGGERS = {
  multipleDocuments: 3,        // Escalate if query involves 3+ documents
  complexityThreshold: 0.7,    // Escalate if complexity score > 0.7
  uncertaintyThreshold: 0.5,   // Escalate if confidence < 0.5
  medicalTermsCount: 5,        // Escalate if 5+ medical terms in query
  temporalAnalysis: true       // Escalate for time-series analysis
};