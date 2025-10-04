# Medical Document Analysis Platform

A sophisticated medical document analysis platform that uses OCR and AI to process medical documents (after-care summaries, bloodwork panels, imaging results) and provides intelligent analysis by cross-referencing existing documents and maintaining context.

## Features

### 🔍 Advanced OCR Processing
- Extract text from PDFs and images
- Identify document types automatically
- Parse structured data (test results, dates, values)
- Support for multiple medical document formats

### 🤖 AI-Powered Analysis
- Natural language queries about medical documents
- Context-aware responses using document history
- Cross-referencing between related documents
- Trend analysis across multiple test results

### 📊 Context Management
- Maintain patient document timeline
- Automatic document linking
- Historical data preservation
- Smart document categorization

### 🔒 Security & Privacy
- Secure file storage
- Data encryption
- HIPAA-compliant practices
- Access control and audit logging

## Technology Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Relational database
- **OpenAI API** - AI analysis capabilities

### Document Processing
- **pdf-parse** - PDF text extraction
- **Tesseract.js** - OCR for images
- **LangChain** - AI context management

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd medical-analysis-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI API key

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
medical-analysis-platform/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── documents/            # Document management endpoints
│   │   └── analyze/              # Analysis endpoints
│   ├── dashboard/                # Dashboard pages
│   │   └── analyze/[id]/         # Document analysis page
│   ├── page.tsx                  # Landing page
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   ├── document/                 # Document-related components
│   └── analysis/                 # Analysis components
├── lib/                          # Utility libraries
│   ├── services/                 # Business logic services
│   │   ├── ocr.service.ts        # OCR processing
│   │   ├── ai.service.ts         # AI analysis
│   │   └── context.service.ts    # Context management
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Utility functions
├── prisma/                       # Database schema and migrations
│   └── schema.prisma             # Prisma schema
└── public/                       # Static assets
```

## Key Components

### OCR Service (`lib/services/ocr.service.ts`)
Handles document text extraction and structured data parsing:
- PDF text extraction
- Image OCR processing
- Document type classification
- Bloodwork result parsing
- Date and key-value extraction

### AI Service (`lib/services/ai.service.ts`)
Manages AI-powered analysis:
- Context-aware query processing
- Trend analysis
- Insight generation
- Cross-document referencing

### Context Builder (`lib/services/context.service.ts`)
Maintains document context:
- Related document discovery
- Historical data retrieval
- Temporal relationship mapping
- Semantic similarity search

## Database Schema

The platform uses PostgreSQL with the following main tables:

- **users** - User accounts
- **patients** - Patient profiles
- **documents** - Uploaded documents
- **ocr_results** - Extracted text from documents
- **extracted_data** - Structured data from documents
- **document_links** - Relationships between documents
- **analysis_sessions** - AI analysis sessions
- **ai_interactions** - Query/response history
- **document_embeddings** - Vector embeddings for semantic search

## API Endpoints

### Document Management
- `POST /api/documents/upload` - Upload a new document
- `GET /api/documents` - List user's documents
- `GET /api/documents/[id]` - Get document details
- `DELETE /api/documents/[id]` - Delete a document

### Analysis
- `POST /api/analyze` - Analyze a document with AI
- `POST /api/analyze/trends` - Generate trend analysis
- `GET /api/analyze/insights` - Get patient insights

## Usage Examples

### Uploading a Document
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

### Analyzing a Document
```typescript
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documentId: 'doc-id',
    query: 'What are the abnormal values?',
    userId: 'user-id'
  })
});

const analysis = await response.json();
```

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Database Migrations
```bash
npx prisma migrate dev --name migration_name
```

## Security Considerations

1. **Data Encryption**: All sensitive data is encrypted at rest and in transit
2. **Access Control**: Role-based access control for documents
3. **HIPAA Compliance**: Following HIPAA guidelines for PHI handling
4. **Audit Logging**: All access and modifications are logged
5. **Secure Storage**: Files stored with encryption and access controls

## Medical Disclaimer

⚠️ **Important**: This platform is for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical decisions.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Roadmap

### Phase 1 (Current)
- ✅ Basic document upload and storage
- ✅ OCR text extraction
- ✅ Document viewer
- ✅ AI query interface
- ✅ Context management

### Phase 2 (Planned)
- [ ] User authentication and authorization
- [ ] Advanced trend visualization
- [ ] Multi-patient support
- [ ] Document version history
- [ ] Export and sharing features

### Phase 3 (Future)
- [ ] Mobile application
- [ ] Real-time collaboration
- [ ] Integration with EHR systems
- [ ] Advanced predictive analytics
- [ ] Telemedicine integration

## Acknowledgments

- Built with Next.js and React
- Powered by OpenAI GPT-4
- OCR by Tesseract.js
- UI components by Radix UI