# System Architecture - Medical Analysis Platform

## High-Level Architecture

### 1. Frontend Layer (Next.js 14+)

```typescript
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── documents/
│   │   ├── upload/
│   │   ├── [id]/
│   │   └── list/
│   ├── analysis/
│   │   ├── trends/
│   │   └── insights/
│   └── settings/
├── api/
│   ├── documents/
│   ├── ocr/
│   ├── analysis/
│   └── auth/
└── components/
    ├── document-viewer/
    ├── upload-zone/
    ├── analysis-panel/
    └── ui/
```

### 2. Backend Services Architecture

#### Document Service
**Responsibilities:**
- Handle document uploads
- Manage document metadata
- Organize documents by type and patient
- Provide document retrieval APIs

**Key Components:**
```typescript
interface DocumentService {
  uploadDocument(file: File, metadata: DocumentMetadata): Promise<Document>
  getDocument(id: string): Promise<Document>
  listDocuments(filters: DocumentFilters): Promise<Document[]>
  deleteDocument(id: string): Promise<void>
  linkDocuments(sourceId: string, targetId: string): Promise<void>
}
```

#### OCR Service
**Responsibilities:**
- Extract text from PDFs
- Identify document structure
- Extract structured data (dates, values, test names)
- Handle different medical document formats

**Processing Pipeline:**
```
PDF Upload → Text Extraction → Structure Detection → Data Parsing → Storage
```

**Key Components:**
```typescript
interface OCRService {
  extractText(documentId: string): Promise<ExtractedText>
  parseStructuredData(text: string, documentType: DocumentType): Promise<StructuredData>
  identifyDocumentType(text: string): Promise<DocumentType>
}

interface StructuredData {
  documentType: 'bloodwork' | 'imaging' | 'aftercare' | 'prescription'
  date: Date
  provider?: string
  patient?: PatientInfo
  results?: TestResult[]
  findings?: string[]
  recommendations?: string[]
}
```

#### AI Agent Service
**Responsibilities:**
- Process natural language queries
- Analyze documents with context
- Generate insights and recommendations
- Maintain conversation history

**Context Management:**
```typescript
interface ContextManager {
  // Build context from related documents
  buildContext(documentIds: string[]): Promise<Context>
  
  // Maintain session context
  updateSessionContext(sessionId: string, newInfo: any): Promise<void>
  
  // Retrieve relevant historical data
  getRelevantHistory(query: string, patientId: string): Promise<Document[]>
}

interface AIAgent {
  query(question: string, context: Context): Promise<AIResponse>
  analyzeDocument(documentId: string, context: Context): Promise<Analysis>
  compareTrends(documentIds: string[]): Promise<TrendAnalysis>
  generateInsights(patientId: string): Promise<Insight[]>
}
```

### 3. Database Schema

```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients (if multi-patient support)
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  patient_id UUID REFERENCES patients(id),
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  document_type VARCHAR(50), -- 'bloodwork', 'imaging', 'aftercare', etc.
  upload_date TIMESTAMP DEFAULT NOW(),
  document_date DATE, -- Date of the actual medical document
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- OCR Results
CREATE TABLE ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  raw_text TEXT,
  confidence_score DECIMAL(5,2),
  processed_at TIMESTAMP DEFAULT NOW()
);

-- Structured Data Extraction
CREATE TABLE extracted_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  data_type VARCHAR(50), -- 'test_result', 'diagnosis', 'medication', etc.
  field_name VARCHAR(100),
  field_value TEXT,
  unit VARCHAR(50),
  reference_range VARCHAR(100),
  is_abnormal BOOLEAN,
  extracted_at TIMESTAMP DEFAULT NOW()
);

-- Document Relationships
CREATE TABLE document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  target_document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50), -- 'follow_up', 'related', 'supersedes', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_document_id, target_document_id)
);

-- AI Analysis Sessions
CREATE TABLE analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  patient_id UUID REFERENCES patients(id),
  session_type VARCHAR(50), -- 'query', 'trend_analysis', 'insight_generation'
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Queries and Responses
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT,
  context_documents UUID[], -- Array of document IDs used for context
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vector Embeddings for Semantic Search
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER,
  chunk_text TEXT,
  embedding vector(1536), -- OpenAI embedding dimension
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_patient_id ON documents(patient_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_date ON documents(document_date);
CREATE INDEX idx_extracted_data_document_id ON extracted_data(document_id);
CREATE INDEX idx_document_links_source ON document_links(source_document_id);
CREATE INDEX idx_document_links_target ON document_links(target_document_id);
```

### 4. Context Management Strategy

#### Context Building Process

```typescript
class ContextBuilder {
  async buildAnalysisContext(
    currentDocumentId: string,
    userId: string
  ): Promise<AnalysisContext> {
    // 1. Get current document and its data
    const currentDoc = await this.getDocument(currentDocumentId);
    const currentData = await this.getExtractedData(currentDocumentId);
    
    // 2. Find related documents
    const relatedDocs = await this.findRelatedDocuments(
      currentDocumentId,
      currentDoc.documentType,
      currentDoc.documentDate
    );
    
    // 3. Get historical data for trend analysis
    const historicalData = await this.getHistoricalData(
      userId,
      currentDoc.documentType,
      currentDoc.documentDate
    );
    
    // 4. Build semantic context using embeddings
    const semanticContext = await this.getSemanticallySimilar(
      currentDoc.id,
      5 // top 5 similar documents
    );
    
    // 5. Compile context
    return {
      currentDocument: currentDoc,
      currentData: currentData,
      relatedDocuments: relatedDocs,
      historicalTrends: historicalData,
      similarDocuments: semanticContext,
      metadata: {
        totalDocuments: await this.countUserDocuments(userId),
        dateRange: await this.getDocumentDateRange(userId),
        documentTypes: await this.getDocumentTypes(userId)
      }
    };
  }
  
  async findRelatedDocuments(
    documentId: string,
    documentType: string,
    documentDate: Date
  ): Promise<Document[]> {
    // Find documents that are:
    // 1. Explicitly linked
    // 2. Same type within time window
    // 3. Referenced in the document text
    
    const linked = await this.getLinkedDocuments(documentId);
    const temporal = await this.getTemporallyRelated(
      documentType,
      documentDate,
      30 // days window
    );
    
    return this.deduplicateAndRank([...linked, ...temporal]);
  }
}
```

#### Context Preservation Strategies

1. **Session-Based Context**
   - Store conversation history in session
   - Maintain document focus across queries
   - Track user's analysis path

2. **Document-Based Context**
   - Link related documents explicitly
   - Use temporal proximity for implicit links
   - Maintain document version history

3. **Semantic Context**
   - Store document embeddings for similarity search
   - Enable "find similar results" functionality
   - Support natural language document discovery

4. **Historical Context**
   - Track trends over time
   - Compare current vs. previous results
   - Identify patterns and anomalies

### 5. OCR Processing Pipeline

```typescript
class OCRPipeline {
  async processDocument(documentId: string): Promise<ProcessingResult> {
    try {
      // 1. Extract raw text
      const rawText = await this.extractText(documentId);
      
      // 2. Identify document type
      const documentType = await this.classifyDocument(rawText);
      
      // 3. Parse structured data based on type
      const structuredData = await this.parseByType(rawText, documentType);
      
      // 4. Extract key entities
      const entities = await this.extractEntities(rawText);
      
      // 5. Generate embeddings for semantic search
      const embeddings = await this.generateEmbeddings(rawText);
      
      // 6. Store results
      await this.storeResults({
        documentId,
        rawText,
        documentType,
        structuredData,
        entities,
        embeddings
      });
      
      return { success: true, documentType, dataPoints: structuredData.length };
    } catch (error) {
      await this.handleError(documentId, error);
      return { success: false, error: error.message };
    }
  }
  
  async parseByType(text: string, type: DocumentType): Promise<StructuredData[]> {
    switch (type) {
      case 'bloodwork':
        return this.parseBloodwork(text);
      case 'imaging':
        return this.parseImagingReport(text);
      case 'aftercare':
        return this.parseAftercareSummary(text);
      default:
        return this.parseGeneric(text);
    }
  }
  
  async parseBloodwork(text: string): Promise<TestResult[]> {
    // Extract test names, values, units, reference ranges
    // Example patterns:
    // "Hemoglobin: 14.5 g/dL (13.5-17.5)"
    // "WBC: 7.2 K/uL (4.5-11.0)"
    
    const results: TestResult[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const match = line.match(
        /([A-Za-z0-9\s]+):\s*([\d.]+)\s*([A-Za-z/%]+)?\s*\(?([\d.-]+)?\s*-?\s*([\d.]+)?\)?/
      );
      
      if (match) {
        results.push({
          testName: match[1].trim(),
          value: parseFloat(match[2]),
          unit: match[3] || '',
          referenceMin: match[4] ? parseFloat(match[4]) : null,
          referenceMax: match[5] ? parseFloat(match[5]) : null,
          isAbnormal: this.checkAbnormal(
            parseFloat(match[2]),
            match[4] ? parseFloat(match[4]) : null,
            match[5] ? parseFloat(match[5]) : null
          )
        });
      }
    }
    
    return results;
  }
}
```

### 6. AI Integration Architecture

```typescript
class AIAnalysisService {
  private openai: OpenAI;
  private contextBuilder: ContextBuilder;
  private vectorStore: VectorStore;
  
  async analyzeWithContext(
    query: string,
    documentId: string,
    userId: string
  ): Promise<AIResponse> {
    // 1. Build comprehensive context
    const context = await this.contextBuilder.buildAnalysisContext(
      documentId,
      userId
    );
    
    // 2. Retrieve relevant historical information
    const relevantHistory = await this.vectorStore.similaritySearch(
      query,
      context.metadata.totalDocuments,
      5
    );
    
    // 3. Construct prompt with context
    const prompt = this.buildPrompt(query, context, relevantHistory);
    
    // 4. Get AI response
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: this.getSystemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for medical accuracy
    });
    
    // 5. Store interaction for future context
    await this.storeInteraction(userId, query, response, context);
    
    return {
      answer: response.choices[0].message.content,
      sources: this.extractSources(context),
      confidence: this.assessConfidence(response),
      relatedDocuments: context.relatedDocuments.map(d => d.id)
    };
  }
  
  private buildPrompt(
    query: string,
    context: AnalysisContext,
    history: Document[]
  ): string {
    return `
You are a medical document analysis assistant. Analyze the following query in the context of the provided medical documents.

CURRENT DOCUMENT:
Type: ${context.currentDocument.documentType}
Date: ${context.currentDocument.documentDate}
Extracted Data: ${JSON.stringify(context.currentData, null, 2)}

RELATED DOCUMENTS:
${context.relatedDocuments.map(doc => `
- ${doc.documentType} from ${doc.documentDate}
  Key findings: ${this.summarizeDocument(doc)}
`).join('\n')}

HISTORICAL TRENDS:
${this.formatHistoricalTrends(context.historicalTrends)}

USER QUERY:
${query}

Please provide a comprehensive analysis that:
1. Directly answers the user's question
2. References specific data points from the documents
3. Highlights any trends or patterns
4. Notes any concerning findings
5. Suggests follow-up questions or actions if appropriate

Remember: This is for informational purposes only and should not replace professional medical advice.
    `;
  }
  
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
- Use clear, non-technical language when possible
- Indicate when values are outside normal ranges
- Suggest when professional medical consultation is needed
- Never provide definitive diagnoses or treatment recommendations
- Always include appropriate medical disclaimers
    `;
  }
}
```

## Implementation Priorities

### Phase 1: MVP (Weeks 1-3)
1. Basic document upload and storage
2. Simple OCR text extraction
3. Document viewer
4. Basic user authentication
5. Simple AI query interface

### Phase 2: Intelligence (Weeks 4-6)
1. Structured data extraction
2. Document type classification
3. Context-aware AI responses
4. Document linking
5. Basic trend visualization

### Phase 3: Advanced Features (Weeks 7-10)
1. Advanced trend analysis
2. Predictive insights
3. Multi-document comparison
4. Enhanced context management
5. Semantic search

## Security Considerations

1. **Data Encryption**
   - Encrypt files at rest (AES-256)
   - Use HTTPS for all communications
   - Encrypt sensitive database fields

2. **Access Control**
   - Role-based access control (RBAC)
   - Document-level permissions
   - Audit logging for all access

3. **HIPAA Compliance**
   - Business Associate Agreements (BAA)
   - Secure data transmission
   - Data retention policies
   - Breach notification procedures

4. **API Security**
   - JWT authentication
   - Rate limiting
   - Input validation
   - SQL injection prevention