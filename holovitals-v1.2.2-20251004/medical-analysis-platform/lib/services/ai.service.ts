import OpenAI from 'openai';
import { AnalysisContext, AIResponse, Document } from '@/lib/types';
import { contextBuilder } from './context.service';

export class AIAnalysisService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
  }

  /**
   * Analyze a query with full document context
   */
  async analyzeWithContext(
    query: string,
    documentId: string,
    userId: string
  ): Promise<AIResponse> {
    // Build comprehensive context
    const context = await contextBuilder.buildAnalysisContext(documentId, userId);

    // Construct prompt with context
    const prompt = this.buildPrompt(query, context);

    // Get AI response
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for medical accuracy
      max_tokens: 2000
    });

    const answer = response.choices[0].message.content || '';

    return {
      answer,
      sources: this.extractSources(context),
      confidence: this.assessConfidence(response),
      relatedDocuments: context.relatedDocuments.map(d => d.id)
    };
  }

  /**
   * Analyze trends across multiple documents
   */
  async analyzeTrends(
    userId: string,
    documentType: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    // Get documents in date range
    const documents = await this.getDocumentsInRange(
      userId,
      documentType,
      startDate,
      endDate
    );

    if (documents.length === 0) {
      return 'No documents found in the specified date range.';
    }

    // Build trend analysis prompt
    const prompt = this.buildTrendPrompt(documents, documentType);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Generate insights for a patient
   */
  async generateInsights(userId: string): Promise<string[]> {
    const context = await contextBuilder.getMetadata(userId);

    const prompt = `
Based on the following patient document history, generate key insights and observations:

Total Documents: ${context.totalDocuments}
Document Types: ${context.documentTypes.join(', ')}
Date Range: ${context.dateRange.earliest.toLocaleDateString()} to ${context.dateRange.latest.toLocaleDateString()}

Please provide:
1. Overview of document coverage
2. Any notable patterns or gaps
3. Recommendations for additional documentation
4. General health tracking observations

Format as a bulleted list of insights.
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5
    });

    const content = response.choices[0].message.content || '';
    return content.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
  }

  /**
   * Build prompt with full context
   */
  private buildPrompt(query: string, context: AnalysisContext): string {
    const currentDataSummary = context.currentData
      .map(d => `${d.fieldName}: ${d.fieldValue}${d.unit ? ' ' + d.unit : ''}${d.isAbnormal ? ' (ABNORMAL)' : ''}`)
      .join('\n');

    const relatedDocsSummary = context.relatedDocuments
      .map(doc => `- ${doc.documentType} from ${doc.documentDate?.toLocaleDateString() || 'unknown date'}`)
      .join('\n');

    return `
You are analyzing medical documents for a patient. Please provide a comprehensive analysis based on the following context.

CURRENT DOCUMENT:
Type: ${context.currentDocument.documentType}
Date: ${context.currentDocument.documentDate?.toLocaleDateString() || 'unknown'}
File: ${context.currentDocument.fileName}

EXTRACTED DATA:
${currentDataSummary || 'No structured data extracted'}

RELATED DOCUMENTS:
${relatedDocsSummary || 'No related documents found'}

PATIENT HISTORY:
- Total Documents: ${context.metadata.totalDocuments}
- Document Types: ${context.metadata.documentTypes.join(', ')}
- Date Range: ${context.metadata.dateRange.earliest.toLocaleDateString()} to ${context.metadata.dateRange.latest.toLocaleDateString()}

USER QUERY:
${query}

Please provide a comprehensive analysis that:
1. Directly answers the user's question
2. References specific data points from the documents
3. Highlights any trends or patterns
4. Notes any concerning findings (especially abnormal values)
5. Provides context from related documents
6. Suggests follow-up questions or actions if appropriate

Remember: This is for informational purposes only and should not replace professional medical advice.
    `;
  }

  /**
   * Build trend analysis prompt
   */
  private buildTrendPrompt(documents: any[], documentType: string): string {
    const docSummaries = documents
      .map(doc => {
        const dataPoints = doc.extractedData
          .map((d: any) => `${d.fieldName}: ${d.fieldValue}${d.unit ? ' ' + d.unit : ''}`)
          .join(', ');
        return `${doc.documentDate?.toLocaleDateString()}: ${dataPoints}`;
      })
      .join('\n');

    return `
Analyze the following ${documentType} results over time and identify trends, patterns, and any concerning changes:

${docSummaries}

Please provide:
1. Overall trend analysis
2. Significant changes or patterns
3. Values moving toward or away from normal ranges
4. Recommendations for monitoring
5. Any concerning trends that warrant attention
    `;
  }

  /**
   * Get system prompt for medical analysis
   */
  private getSystemPrompt(): string {
    return `
You are an AI assistant specialized in analyzing medical documents. Your role is to:

1. Extract and interpret information from medical documents accurately
2. Identify trends and patterns across multiple documents
3. Provide clear, understandable explanations of medical data
4. Cross-reference related documents to provide comprehensive context
5. Highlight abnormal values or concerning findings
6. Maintain patient privacy and data security

Guidelines:
- Always cite specific documents and data points in your responses
- Use clear, non-technical language when possible, but maintain medical accuracy
- Indicate when values are outside normal ranges
- Suggest when professional medical consultation is needed
- Never provide definitive diagnoses or treatment recommendations
- Always include appropriate medical disclaimers
- Focus on factual analysis based on the provided documents
- Acknowledge limitations when information is incomplete

Medical Disclaimer:
Always remind users that your analysis is for informational purposes only and should not replace professional medical advice, diagnosis, or treatment.
    `;
  }

  /**
   * Extract source documents from context
   */
  private extractSources(context: AnalysisContext): string[] {
    const sources = [
      `${context.currentDocument.fileName} (${context.currentDocument.documentDate?.toLocaleDateString()})`
    ];

    context.relatedDocuments.forEach(doc => {
      sources.push(`${doc.fileName} (${doc.documentDate?.toLocaleDateString()})`);
    });

    return sources;
  }

  /**
   * Assess confidence in AI response
   */
  private assessConfidence(response: OpenAI.Chat.Completions.ChatCompletion): number {
    // Simple confidence assessment based on response characteristics
    // In production, this could be more sophisticated
    const content = response.choices[0].message.content || '';
    
    if (content.includes('uncertain') || content.includes('unclear')) {
      return 0.6;
    }
    if (content.includes('likely') || content.includes('possibly')) {
      return 0.7;
    }
    if (content.includes('appears') || content.includes('suggests')) {
      return 0.8;
    }
    
    return 0.9;
  }

  /**
   * Get documents in date range (helper method)
   */
  private async getDocumentsInRange(
    userId: string,
    documentType: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    // This would use Prisma to fetch documents
    // Placeholder implementation
    return [];
  }
}

export const aiService = new AIAnalysisService();