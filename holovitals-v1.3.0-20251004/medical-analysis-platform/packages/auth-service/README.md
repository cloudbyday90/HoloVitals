# HoloVitals Authentication Service

## 🎯 Overview

The Authentication Service handles user authentication, authorization, and session management for the HoloVitals platform.

## 🚀 Features

- User registration and login
- JWT token generation and validation
- Session management
- Role-based access control (RBAC)
- OAuth integration (Google, etc.)
- Password reset and email verification
- Two-factor authentication (2FA)

## 🏗️ Technology Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL (via Prisma)
- **Cache**: Redis
- **Authentication**: JWT + NextAuth
- **Language**: TypeScript

## 📦 Installation

```bash
cd packages/auth-service
npm install
```

## 🔧 Configuration

Create a `.env` file:

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/auth_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-jwt-secret-here"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_EXPIRES_IN="30d"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@holovitals.com"

# Service URLs
PATIENT_SERVICE_URL="http://localhost:5000"
MEDICAL_STANDARDS_SERVICE_URL="http://localhost:5001"
```

## 🗄️ Database Schema

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String?
  name          String?
  role          UserRole  @default(USER)
  emailVerified DateTime?
  image         String?
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret String?
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

## 🔌 API Endpoints

### **Authentication**

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}

Response: 201 Created
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  },
  "token": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response: 200 OK
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  },
  "token": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

#### Get Session
```http
GET /auth/session
Authorization: Bearer {token}

Response: 200 OK
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token"
}

Response: 200 OK
{
  "token": "new-jwt-token",
  "refreshToken": "new-refresh-token"
}
```

#### Verify Token
```http
GET /auth/verify
Authorization: Bearer {token}

Response: 200 OK
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### **Password Management**

#### Request Password Reset
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "message": "Password reset email sent"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token",
  "password": "NewSecurePassword123!"
}

Response: 200 OK
{
  "message": "Password reset successfully"
}
```

### **Email Verification**

#### Send Verification Email
```http
POST /auth/send-verification
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Verification email sent"
}
```

#### Verify Email
```http
GET /auth/verify-email?token={verification-token}

Response: 200 OK
{
  "message": "Email verified successfully"
}
```

### **Two-Factor Authentication**

#### Enable 2FA
```http
POST /auth/2fa/enable
Authorization: Bearer {token}

Response: 200 OK
{
  "secret": "2fa-secret",
  "qrCode": "data:image/png;base64,..."
}
```

#### Verify 2FA
```http
POST /auth/2fa/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "123456"
}

Response: 200 OK
{
  "message": "2FA enabled successfully"
}
```

#### Disable 2FA
```http
POST /auth/2fa/disable
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "123456"
}

Response: 200 OK
{
  "message": "2FA disabled successfully"
}
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### **Railway**

1. Create a new Railway project
2. Add PostgreSQL and Redis services
3. Set environment variables
4. Deploy:

```bash
railway up
```

### **Docker**

```bash
# Build image
docker build -t holovitals-auth-service .

# Run container
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  -e JWT_SECRET="..." \
  holovitals-auth-service
```

## 📊 Monitoring

- **Health Check**: `GET /health`
- **Metrics**: `GET /metrics`
- **Logs**: Structured JSON logs to stdout

## 🔐 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiration
- Rate limiting (100 requests/minute)
- CORS enabled for frontend domain only
- Helmet.js for security headers
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection

## 📝 Development

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Seed database
npx prisma db seed

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔗 Service Communication

This service communicates with:
- **Frontend**: Provides authentication tokens
- **Patient Repository**: Validates user access to patient data
- **Medical Standards**: Validates user access to medical codes
- **All Services**: Provides token verification endpoint

## 📈 Performance

- Response time: < 100ms (p95)
- Throughput: 1000 requests/second
- Database queries: < 50ms (p95)
- Redis cache hit rate: > 90%

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check database connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

### Redis Connection Issues
```bash
# Check Redis connection
redis-cli ping

# Clear Redis cache
redis-cli FLUSHALL
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Architecture](./docs/architecture.md)
- [Security](./docs/security.md)
- [Deployment](./docs/deployment.md)

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.