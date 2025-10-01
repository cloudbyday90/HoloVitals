# HoloVitals Microservices Implementation Plan

## 🎯 Project Overview

**Strategy**: Gradual migration to microservices architecture
**Budget**: MVP (~$100-200/month)
**Platform**: Railway (with future AWS migration path)
**Approach**: All services at once (big bang migration)
**Database**: Database per service

---

## 📅 Timeline: 6-Month Gradual Migration

### **Month 1-2: Foundation & Setup**
- Set up infrastructure
- Create repositories
- Establish CI/CD
- Database design

### **Month 3-4: Core Services Migration**
- Extract and deploy core services
- Set up inter-service communication
- Implement monitoring

### **Month 5: AI & Supporting Services**
- Extract AI services
- Extract supporting services
- Integration testing

### **Month 6: Testing, Optimization & Launch**
- End-to-end testing
- Performance optimization
- Production deployment

---

## 🏗️ Phase 1: Foundation & Setup (Weeks 1-8)

### **Week 1-2: Repository Setup**

#### Create 12 GitHub Repositories

```bash
# Core repositories
holovitals-frontend
holovitals-auth-service
holovitals-patient-repository
holovitals-medical-standards
holovitals-ai-analysis
holovitals-prompt-optimization
holovitals-context-cache
holovitals-hipaa-compliance
holovitals-ehr-integration
holovitals-payment-service
holovitals-document-service
holovitals-devqa-monitoring
```

**Repository Structure (Each Service)**:
```
service-name/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

**Deliverables**:
- [ ] 12 GitHub repositories created
- [ ] Repository templates set up
- [ ] README files with service descriptions
- [ ] .gitignore and .env.example files

---

### **Week 3-4: Railway Setup & Database Design**

#### Railway Projects Setup

Create 12 Railway projects (one per service):

```
Project Name                    Database        Redis   Port
─────────────────────────────────────────────────────────────
holovitals-frontend             -               -       3000
holovitals-auth                 PostgreSQL      Yes     4000
holovitals-patient              PostgreSQL      Yes     5000
holovitals-medical-standards    PostgreSQL      Yes     5001
holovitals-ai-analysis          PostgreSQL      Yes     5002
holovitals-prompt-optimization  PostgreSQL      -       5003
holovitals-context-cache        PostgreSQL      Yes     5004
holovitals-hipaa-compliance     PostgreSQL      -       5005
holovitals-ehr-integration      PostgreSQL      Yes     5006
holovitals-payment              PostgreSQL      -       5007
holovitals-document             PostgreSQL      -       5008
holovitals-devqa                PostgreSQL      -       5009
```

#### Database Schema Split

**Current Monolithic Schema** → **12 Service Schemas**

**1. Auth Service Database** (`auth_db`)
```prisma
// User authentication and authorization
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String?
  name          String?
  role          UserRole  @default(USER)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
}

enum UserRole {
  USER
  ADMIN
  OWNER
}
```

**2. Patient Repository Database** (`patient_db`)
```prisma
// Patient data and FHIR resources
model Patient {
  id                String    @id @default(uuid())
  userId            String    // Reference to auth service
  firstName         String
  lastName          String
  dateOfBirth       DateTime
  gender            String
  email             String?
  phone             String?
  address           String?
  city              String?
  state             String?
  zipCode           String?
  country           String?
  emergencyContact  String?
  insuranceProvider String?
  insuranceNumber   String?
  status            PatientStatus @default(ACTIVE)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  fhirResources     FHIRResource[]
  medications       PatientMedication[]
  allergies         PatientAllergy[]
  diagnoses         PatientDiagnosis[]
  vitalSigns        PatientVitalSign[]
  immunizations     PatientImmunization[]
  procedures        PatientProcedure[]
  familyHistory     PatientFamilyHistory[]
}

model FHIRResource {
  id           String   @id @default(uuid())
  patientId    String
  resourceType String
  resourceId   String
  data         Json
  version      String?
  lastUpdated  DateTime @default(now())
  source       String?
  
  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  
  @@index([patientId, resourceType])
}

// ... other patient-related models
```

**3. Medical Standards Database** (`medical_standards_db`)
```prisma
// LOINC, SNOMED, ICD-10, CPT codes
model LOINCCode {
  id              String   @id @default(uuid())
  loincNumber     String   @unique
  component       String
  property        String
  timeAspect      String
  system          String
  scaleType       String
  methodType      String?
  displayName     String
  shortName       String?
  relatedNames    String[]
  category        String
  commonTest      Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  units           LOINCUnit[]
  referenceRanges ReferenceRange[]
}

// ... other medical code models
```

**4. AI Analysis Database** (`ai_analysis_db`)
```prisma
// Analysis tasks and results
model AnalysisTask {
  id              String        @id @default(uuid())
  patientId       String        // Reference to patient service
  userId          String        // Reference to auth service
  documentIds     String[]
  query           String
  context         Json?
  prompt          String?
  status          TaskStatus    @default(PENDING)
  priority        Int           @default(5)
  missingPieces   String[]
  result          Json?
  error           String?
  tokensUsed      Int?
  processingTime  Int?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  completedAt     DateTime?
}

// ... other AI analysis models
```

**5. Prompt Optimization Database** (`prompt_optimization_db`)
```prisma
// Prompt templates and optimization
model PromptOptimization {
  id                    String   @id @default(uuid())
  category              String
  template              String
  variables             Json
  version               Int      @default(1)
  avgTokenCount         Int?
  avgResponseTime       Int?
  successRate           Float?
  avgCost               Float?
  relevanceScore        Float?
  clarityScore          Float?
  efficiencyScore       Float?
  optimizationScore     Float?
  usageCount            Int      @default(0)
  lastUsed              DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

// ... other prompt optimization models
```

**6. Context Cache Database** (`context_cache_db`)
```prisma
// Sanitized patient context (HIPAA-compliant)
model ContextCache {
  id              String   @id @default(uuid())
  patientId       String   // Reference to patient service
  contextType     String
  sanitizedData   Json     // All PII/PHI removed
  importanceScore Float    @default(0)
  recencyScore    Float    @default(0)
  frequencyScore  Float    @default(0)
  relevanceScore  Float    @default(0)
  completeness    Float    @default(0)
  accuracy        Float    @default(0)
  lastAccessed    DateTime @default(now())
  accessCount     Int      @default(0)
  expiresAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([patientId, importanceScore])
}
```

**7. HIPAA Compliance Database** (`hipaa_compliance_db`)
```prisma
// Audit logs and security
model AuditLog {
  id          String   @id @default(uuid())
  userId      String   // Reference to auth service
  patientId   String?  // Reference to patient service
  action      String
  resource    String
  resourceId  String?
  ipAddress   String?
  userAgent   String?
  metadata    Json?
  timestamp   DateTime @default(now())
  
  @@index([userId, timestamp])
  @@index([patientId, timestamp])
}

// ... other HIPAA compliance models
```

**8. EHR Integration Database** (`ehr_integration_db`)
```prisma
// EHR connections and sync history
model EHRConnection {
  id              String        @id @default(uuid())
  userId          String        // Reference to auth service
  patientId       String        // Reference to patient service
  provider        EHRProvider
  credentials     Json          // Encrypted
  status          ConnectionStatus @default(ACTIVE)
  lastSync        DateTime?
  nextSync        DateTime?
  syncFrequency   String        @default("daily")
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  syncHistory     SyncHistory[]
}

// ... other EHR integration models
```

**9. Payment Database** (`payment_db`)
```prisma
// Subscriptions and payments
model Subscription {
  id              String            @id @default(uuid())
  userId          String            // Reference to auth service
  stripeCustomerId String?
  stripeSubscriptionId String?
  plan            SubscriptionPlan
  status          SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean        @default(false)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  history         SubscriptionHistory[]
}

// ... other payment models
```

**10. Document Database** (`document_db`)
```prisma
// Document storage and processing
model Document {
  id              String        @id @default(uuid())
  userId          String        // Reference to auth service
  patientId       String?       // Reference to patient service
  title           String
  description     String?
  type            DocumentType
  fileUrl         String
  fileSize        Int
  mimeType        String
  status          DocumentStatus @default(PENDING)
  ocrCompleted    Boolean       @default(false)
  extractionCompleted Boolean   @default(false)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  ocrResults      OCRResult[]
  extractedData   ExtractedData[]
}

// ... other document models
```

**11. Dev/QA Database** (`devqa_db`)
```prisma
// Monitoring and error tracking
model ErrorLog {
  id          String   @id @default(uuid())
  service     String
  severity    String
  message     String
  stack       String?
  metadata    Json?
  userId      String?  // Reference to auth service
  timestamp   DateTime @default(now())
  resolved    Boolean  @default(false)
  resolvedAt  DateTime?
  
  @@index([service, timestamp])
}

// ... other monitoring models
```

**Deliverables**:
- [ ] 12 Railway projects created
- [ ] Database schemas split and documented
- [ ] Environment variables configured
- [ ] Database migrations prepared

---

### **Week 5-6: Service Template & Boilerplate**

#### Create Service Template

**Base Service Structure** (TypeScript + Express):

```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { loggingMiddleware } from './middleware/logging';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: process.env.SERVICE_NAME });
});

// Routes
app.use('/api', authMiddleware, routes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`${process.env.SERVICE_NAME} running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

**Dockerfile** (Each Service):

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE ${PORT}

# Start service
CMD ["npm", "start"]
```

**docker-compose.yml** (Local Development):

```yaml
version: '3.8'

services:
  service-name:
    build: .
    ports:
      - "${PORT}:${PORT}"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SERVICE_NAME=${SERVICE_NAME}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=service_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Deliverables**:
- [ ] Service template created
- [ ] Dockerfile template
- [ ] docker-compose.yml template
- [ ] Middleware templates (auth, logging, error handling)
- [ ] Testing setup (Jest)

---

### **Week 7-8: CI/CD Pipeline Setup**

#### GitHub Actions Workflow

**`.github/workflows/deploy.yml`** (Each Repository):

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Run linter
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
        
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**Deliverables**:
- [ ] CI/CD pipelines for all 12 services
- [ ] Automated testing
- [ ] Automated deployment to Railway
- [ ] Environment secrets configured

---

## 🚀 Phase 2: Core Services Migration (Weeks 9-16)

### **Week 9-10: Authentication Service**

#### Extract Authentication Logic

**Tasks**:
1. Create `holovitals-auth-service` repository
2. Copy authentication-related code from monolith
3. Set up database schema (User, Account, Session, VerificationToken)
4. Implement JWT token generation and validation
5. Create API endpoints:
   - `POST /auth/register`
   - `POST /auth/login`
   - `POST /auth/logout`
   - `GET /auth/session`
   - `POST /auth/refresh`
   - `GET /auth/verify`
6. Deploy to Railway
7. Test authentication flow

**API Contract** (`openapi.yml`):

```yaml
openapi: 3.0.0
info:
  title: HoloVitals Authentication Service
  version: 1.0.0

paths:
  /auth/register:
    post:
      summary: Register new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
                name:
                  type: string
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  token:
                    type: string

  /auth/login:
    post:
      summary: Login user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  token:
                    type: string

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        name:
          type: string
        role:
          type: string
```

**Deliverables**:
- [ ] Authentication service deployed
- [ ] API documentation
- [ ] Integration tests
- [ ] Railway deployment URL

---

### **Week 11-12: Patient Repository Service**

#### Extract Patient Data Logic

**Tasks**:
1. Create `holovitals-patient-repository` repository
2. Copy patient-related code from monolith
3. Set up database schema (Patient, FHIRResource, Medications, Allergies, etc.)
4. Implement CRUD operations for patients
5. Create API endpoints:
   - `GET /patients`
   - `POST /patients`
   - `GET /patients/:id`
   - `PUT /patients/:id`
   - `DELETE /patients/:id`
   - `GET /patients/:id/fhir-resources`
   - `POST /patients/:id/fhir-resources`
   - `GET /patients/:id/medications`
   - `GET /patients/:id/allergies`
   - `GET /patients/:id/conditions`
6. Implement service-to-service authentication with Auth Service
7. Deploy to Railway
8. Test patient operations

**Service-to-Service Authentication**:

```typescript
// middleware/serviceAuth.ts
import jwt from 'jsonwebtoken';
import axios from 'axios';

export async function verifyServiceToken(token: string) {
  try {
    // Call Auth Service to verify token
    const response = await axios.get(
      `${process.env.AUTH_SERVICE_URL}/auth/verify`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.user;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function serviceAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  verifyServiceToken(token)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(error => {
      res.status(401).json({ error: 'Invalid token' });
    });
}
```

**Deliverables**:
- [ ] Patient repository service deployed
- [ ] API documentation
- [ ] Service-to-service auth implemented
- [ ] Integration tests
- [ ] Railway deployment URL

---

### **Week 13-14: Medical Standards Service**

#### Extract Medical Standardization Logic

**Tasks**:
1. Create `holovitals-medical-standards` repository
2. Copy medical standards code from monolith
3. Set up database schema (LOINCCode, SNOMEDCode, ICD10Code, CPTCode, etc.)
4. Seed database with Mayo Clinic LOINC codes
5. Implement Redis caching for code lookups
6. Create API endpoints:
   - `GET /loinc/search`
   - `GET /loinc/:code`
   - `POST /standardize/lab-result`
   - `POST /standardize/batch`
   - `POST /validate/lab-result`
   - `POST /convert/units`
7. Deploy to Railway
8. Test standardization operations

**Redis Caching Strategy**:

```typescript
// services/cacheService.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedLOINCCode(loincNumber: string) {
  const cached = await redis.get(`loinc:${loincNumber}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

export async function cacheLOINCCode(loincNumber: string, data: any) {
  await redis.set(
    `loinc:${loincNumber}`,
    JSON.stringify(data),
    'EX',
    86400 // 24 hours
  );
}
```

**Deliverables**:
- [ ] Medical standards service deployed
- [ ] Redis caching implemented
- [ ] API documentation
- [ ] Integration tests
- [ ] Railway deployment URL

---

### **Week 15-16: API Gateway Setup**

#### Implement API Gateway

**Option 1: Kong Gateway (Recommended)**

```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: auth-service
    url: https://holovitals-auth.railway.app
    routes:
      - name: auth-routes
        paths:
          - /auth

  - name: patient-service
    url: https://holovitals-patient.railway.app
    routes:
      - name: patient-routes
        paths:
          - /patients

  - name: medical-standards-service
    url: https://holovitals-medical-standards.railway.app
    routes:
      - name: medical-standards-routes
        paths:
          - /loinc
          - /snomed
          - /icd10
          - /cpt
          - /standardize
          - /validate
          - /convert

plugins:
  - name: rate-limiting
    config:
      minute: 100
      policy: local

  - name: cors
    config:
      origins:
        - https://app.holovitals.com
      methods:
        - GET
        - POST
        - PUT
        - DELETE
      headers:
        - Authorization
        - Content-Type

  - name: jwt
    config:
      secret_is_base64: false
      key_claim_name: kid
```

**Option 2: Custom API Gateway (Node.js)**

```typescript
// api-gateway/src/index.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});

app.use(limiter);
app.use(cors());

// Service routes
app.use('/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true
}));

app.use('/patients', createProxyMiddleware({
  target: process.env.PATIENT_SERVICE_URL,
  changeOrigin: true
}));

app.use('/loinc', createProxyMiddleware({
  target: process.env.MEDICAL_STANDARDS_SERVICE_URL,
  changeOrigin: true
}));

// ... other routes

app.listen(8080, () => {
  console.log('API Gateway running on port 8080');
});
```

**Deliverables**:
- [ ] API Gateway deployed
- [ ] Rate limiting configured
- [ ] CORS configured
- [ ] Service routing configured
- [ ] Railway deployment URL

---

## 🤖 Phase 3: AI & Supporting Services (Weeks 17-20)

### **Week 17: AI Analysis Service**

**Tasks**:
1. Create `holovitals-ai-analysis` repository
2. Extract AI analysis logic
3. Set up database schema
4. Implement Bull Queue for task management
5. Create API endpoints
6. Deploy to Railway

**Deliverables**:
- [ ] AI Analysis service deployed
- [ ] Task queue implemented
- [ ] API documentation

---

### **Week 18: AI Prompt Optimization & Context Cache Services**

**Tasks**:
1. Create `holovitals-prompt-optimization` repository
2. Create `holovitals-context-cache` repository
3. Extract respective logic
4. Set up database schemas
5. Create API endpoints
6. Deploy to Railway

**Deliverables**:
- [ ] Prompt Optimization service deployed
- [ ] Context Cache service deployed
- [ ] API documentation

---

### **Week 19: HIPAA Compliance & EHR Integration Services**

**Tasks**:
1. Create `holovitals-hipaa-compliance` repository
2. Create `holovitals-ehr-integration` repository
3. Extract respective logic
4. Set up database schemas
5. Create API endpoints
6. Deploy to Railway

**Deliverables**:
- [ ] HIPAA Compliance service deployed
- [ ] EHR Integration service deployed
- [ ] API documentation

---

### **Week 20: Payment, Document & Dev/QA Services**

**Tasks**:
1. Create `holovitals-payment-service` repository
2. Create `holovitals-document-service` repository
3. Create `holovitals-devqa-monitoring` repository
4. Extract respective logic
5. Set up database schemas
6. Create API endpoints
7. Deploy to Railway

**Deliverables**:
- [ ] Payment service deployed
- [ ] Document service deployed
- [ ] Dev/QA service deployed
- [ ] API documentation

---

## 🧪 Phase 4: Testing & Optimization (Weeks 21-24)

### **Week 21-22: Integration Testing**

**Tasks**:
1. End-to-end testing across all services
2. Load testing with Artillery or k6
3. Security testing
4. Performance optimization

**Testing Tools**:
- **Jest**: Unit tests
- **Supertest**: API tests
- **Artillery**: Load tests
- **OWASP ZAP**: Security tests

**Load Testing Example**:

```yaml
# artillery-config.yml
config:
  target: 'https://api.holovitals.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Sustained load
    - duration: 60
      arrivalRate: 100
      name: Peak load

scenarios:
  - name: User journey
    flow:
      - post:
          url: '/auth/login'
          json:
            email: 'test@example.com'
            password: 'password'
          capture:
            - json: '$.token'
              as: 'token'
      - get:
          url: '/patients'
          headers:
            Authorization: 'Bearer {{ token }}'
      - get:
          url: '/patients/{{ patientId }}'
          headers:
            Authorization: 'Bearer {{ token }}'
```

**Deliverables**:
- [ ] Integration test suite
- [ ] Load test results
- [ ] Security audit report
- [ ] Performance optimization report

---

### **Week 23: Frontend Migration**

**Tasks**:
1. Update frontend to use API Gateway
2. Replace direct database calls with API calls
3. Update authentication flow
4. Test all features
5. Deploy to Vercel

**Frontend Service Communication**:

```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
  timeout: 10000,
});

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/auth/refresh`,
            { refreshToken }
          );
          localStorage.setItem('token', response.data.token);
          // Retry original request
          return apiClient(error.config);
        } catch (refreshError) {
          // Redirect to login
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Deliverables**:
- [ ] Frontend migrated to use API Gateway
- [ ] All features tested
- [ ] Deployed to Vercel

---

### **Week 24: Documentation & Launch Preparation**

**Tasks**:
1. Complete API documentation (OpenAPI/Swagger)
2. Write deployment guides
3. Create monitoring dashboards
4. Set up alerting
5. Prepare launch checklist

**Documentation Structure**:
```
docs/
├── architecture/
│   ├── overview.md
│   ├── service-diagram.md
│   └── data-flow.md
├── api/
│   ├── authentication.md
│   ├── patient-repository.md
│   ├── medical-standards.md
│   └── ... (one per service)
├── deployment/
│   ├── railway-setup.md
│   ├── environment-variables.md
│   └── troubleshooting.md
├── development/
│   ├── local-setup.md
│   ├── testing.md
│   └── contributing.md
└── operations/
    ├── monitoring.md
    ├── alerting.md
    └── incident-response.md
```

**Deliverables**:
- [ ] Complete API documentation
- [ ] Deployment guides
- [ ] Monitoring dashboards
- [ ] Alerting configured
- [ ] Launch checklist

---

## 📊 Cost Breakdown (Railway MVP)

### **Monthly Costs**

```
Service                         Railway Cost    Database    Redis   Total
─────────────────────────────────────────────────────────────────────────
Frontend (Vercel)               $0 (free tier)  -           -       $0
Auth Service                    $5              $5          $5      $15
Patient Repository              $5              $10         $5      $20
Medical Standards               $5              $10         $5      $20
AI Analysis                     $10             $10         $5      $25
Prompt Optimization             $5              $5          -       $10
Context Cache                   $5              $10         $5      $20
HIPAA Compliance                $5              $10         -       $15
EHR Integration                 $5              $10         $5      $20
Payment Service                 $5              $5          -       $10
Document Service                $10             $5          -       $15
Dev/QA Monitoring               $5              $5          -       $10
─────────────────────────────────────────────────────────────────────────
Total                           $65             $95         $30     $190/month
```

**Notes**:
- Railway charges $5/service for compute
- PostgreSQL databases: $5-10 each depending on size
- Redis instances: $5 each
- S3 storage for documents: ~$10/month (estimated)
- **Total estimated cost: ~$200/month**

---

## 🚀 Launch Checklist

### **Pre-Launch**
- [ ] All 12 services deployed to Railway
- [ ] All databases migrated and seeded
- [ ] API Gateway configured and tested
- [ ] Frontend deployed to Vercel
- [ ] All integration tests passing
- [ ] Load tests completed
- [ ] Security audit completed
- [ ] Monitoring and alerting configured
- [ ] Documentation complete
- [ ] Backup and disaster recovery plan in place

### **Launch Day**
- [ ] Final smoke tests
- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Monitor database performance
- [ ] Check all services are healthy
- [ ] Verify user authentication flow
- [ ] Test critical user journeys
- [ ] Monitor costs

### **Post-Launch**
- [ ] Monitor for 24 hours
- [ ] Address any issues
- [ ] Gather user feedback
- [ ] Optimize based on metrics
- [ ] Plan next iteration

---

## 🔄 Migration to AWS (Future)

### **When to Migrate**

**Indicators**:
- Railway costs exceed $500/month
- Need for advanced features (auto-scaling, load balancing)
- Compliance requirements (SOC 2, HIPAA BAA)
- Global expansion (multi-region)
- 10K+ active users

### **AWS Migration Plan**

**Services Mapping**:
```
Railway Service          →  AWS Service
─────────────────────────────────────────
Railway Compute          →  ECS Fargate
Railway PostgreSQL       →  RDS PostgreSQL
Railway Redis            →  ElastiCache
Railway Storage          →  S3
API Gateway              →  AWS API Gateway
Monitoring               →  CloudWatch
```

**Migration Steps**:
1. Set up AWS account and VPC
2. Create RDS instances
3. Migrate databases
4. Deploy services to ECS
5. Configure API Gateway
6. Set up CloudWatch monitoring
7. Test thoroughly
8. Switch DNS
9. Monitor for 48 hours
10. Decommission Railway

**Estimated AWS Cost**: ~$660/month (see MICROSERVICES_ARCHITECTURE_PLAN.md)

---

## 📈 Success Metrics

### **Technical Metrics**
- [ ] API response time < 200ms (p95)
- [ ] Error rate < 0.1%
- [ ] Uptime > 99.9%
- [ ] Database query time < 50ms (p95)
- [ ] Service-to-service latency < 100ms

### **Business Metrics**
- [ ] User signup rate
- [ ] Feature adoption rate
- [ ] User retention rate
- [ ] API usage per user
- [ ] Cost per user

### **Operational Metrics**
- [ ] Deployment frequency
- [ ] Mean time to recovery (MTTR)
- [ ] Change failure rate
- [ ] Lead time for changes

---

## 🎯 Next Steps

1. **Review this plan** - Does it align with your vision?
2. **Approve budget** - ~$200/month for MVP
3. **Set start date** - When do you want to begin?
4. **Assign resources** - Who will work on this?
5. **Create repositories** - I can start creating the 12 repos

**Ready to start? Let me know and I'll begin with Phase 1!**