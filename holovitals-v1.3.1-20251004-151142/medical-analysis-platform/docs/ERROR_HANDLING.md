# Error Handling System Documentation

## Overview

HoloVitals implements a comprehensive error handling system that provides:
- **Structured error classes** for different error types
- **Centralized error logging** with severity levels
- **User-friendly error pages** for different scenarios
- **Toast notifications** for inline error feedback
- **Error boundaries** for React component errors
- **API error handling** with proper HTTP status codes
- **Retry mechanisms** with exponential backoff
- **HIPAA-compliant error logging** (no PHI in logs)

---

## Architecture

### Error Flow

```
Error Occurs
    ↓
Error Boundary / API Handler Catches
    ↓
Error Logger Records (Database + Console)
    ↓
User Notification (Toast / Error Page)
    ↓
[If Critical] → Alert System
```

---

## Components

### 1. Custom Error Classes (`lib/errors/AppError.ts`)

#### Base Error Class

```typescript
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;
  timestamp: Date;
}
```

#### Error Categories

**Authentication & Authorization:**
- `AuthenticationError` (401)
- `AuthorizationError` (403)
- `TokenExpiredError` (401)
- `InvalidTokenError` (401)

**Validation:**
- `ValidationError` (400)
- `InvalidInputError` (400)
- `MissingFieldError` (400)

**Resources:**
- `NotFoundError` (404)
- `ResourceExistsError` (409)
- `ResourceLockedError` (423)

**Database:**
- `DatabaseError` (500)
- `DatabaseConnectionError` (503)
- `TransactionError` (500)

**External Services:**
- `ExternalServiceError` (502)
- `AIServiceError` (502)
- `CloudProviderError` (502)

**Rate Limiting:**
- `RateLimitError` (429)
- `QuotaExceededError` (429)

**File Operations:**
- `FileUploadError` (400)
- `FileSizeError` (413)
- `FileTypeError` (415)

**Business Logic:**
- `BusinessLogicError` (422)
- `InsufficientFundsError` (402)
- `ConsentRequiredError` (403)

**HIPAA Compliance:**
- `HIPAAViolationError` (403)
- `PHIAccessError` (403)

**System:**
- `SystemError` (500)
- `ConfigurationError` (500)
- `ServiceUnavailableError` (503)

### 2. Error Logger (`lib/errors/ErrorLogger.ts`)

#### Severity Levels

```typescript
enum ErrorSeverity {
  LOW = 'LOW',           // Minor issues (rate limits, validation)
  MEDIUM = 'MEDIUM',     // Expected errors (not found, conflicts)
  HIGH = 'HIGH',         // Security issues (auth failures, HIPAA)
  CRITICAL = 'CRITICAL', // System failures (database, services)
}
```

#### Features

- **Database logging**: All errors stored in `error_logs` table
- **Console logging**: Color-coded by severity
- **Critical alerts**: Automatic notifications for critical errors
- **Statistics**: Error counts by severity, code, endpoint
- **Cleanup**: Automatic removal of old low/medium severity logs

#### Usage

```typescript
import { errorLogger } from '@/lib/errors/ErrorLogger';

await errorLogger.logError(error, {
  userId: 'user-123',
  endpoint: '/api/documents',
  method: 'POST',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});
```

### 3. Error Handler (`lib/errors/errorHandler.ts`)

#### Global Error Handler

```typescript
import { handleError } from '@/lib/errors/errorHandler';

export async function POST(req: NextRequest) {
  try {
    // Your logic
  } catch (error) {
    return handleError(error as Error, req);
  }
}
```

#### Error Handler Wrapper

```typescript
import { withErrorHandler } from '@/lib/errors/errorHandler';

export const POST = withErrorHandler(async (req: NextRequest) => {
  // Your logic - errors automatically handled
  return NextResponse.json({ success: true });
});
```

#### Features

- **Automatic error logging**
- **Proper HTTP status codes**
- **User-friendly error messages**
- **Request ID tracking**
- **Prisma error handling**
- **Development vs production modes**

### 4. Error Boundaries (`components/ErrorBoundary.tsx`)

#### Page-Level Error Boundary

```tsx
import { PageErrorBoundary } from '@/components/ErrorBoundary';

export default function MyPage() {
  return (
    <PageErrorBoundary>
      <YourContent />
    </PageErrorBoundary>
  );
}
```

#### Component-Level Error Boundary

```tsx
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';

<ComponentErrorBoundary>
  <RiskyComponent />
</ComponentErrorBoundary>
```

#### Silent Error Boundary

```tsx
import { SilentErrorBoundary } from '@/components/ErrorBoundary';

<SilentErrorBoundary>
  <NonCriticalComponent />
</SilentErrorBoundary>
```

### 5. Error Pages

#### Global Error Page (`app/error.tsx`)

Catches errors in any page component.

#### Global Error Handler (`app/global-error.tsx`)

Catches errors in the root layout.

#### 404 Not Found (`app/not-found.tsx`)

Displayed when a route doesn't exist.

### 6. Toast Notifications (`components/ui/toast.tsx`)

#### Usage

```typescript
import { success, error, warning, info } from '@/hooks/useToast';

// Success
success('Document uploaded', 'Your document has been processed');

// Error
error('Upload failed', 'File size exceeds limit');

// Warning
warning('Session expiring', 'Please save your work');

// Info
info('New feature', 'Check out our new AI chat');
```

#### Variants

- **Success**: Green with checkmark icon
- **Error**: Red with alert icon
- **Warning**: Yellow with warning icon
- **Info**: Blue with info icon

---

## Usage Examples

### API Route Error Handling

```typescript
// app/api/documents/route.ts
import { withErrorHandler } from '@/lib/errors/errorHandler';
import { NotFoundError, ValidationError } from '@/lib/errors/AppError';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    throw new ValidationError('Document ID is required');
  }

  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    throw new NotFoundError('Document');
  }

  return NextResponse.json(document);
});
```

### Client-Side Error Handling

```typescript
// Using error utilities
import { handleApiError, retryWithBackoff } from '@/lib/utils/errorUtils';

async function uploadDocument(file: File) {
  try {
    const response = await retryWithBackoff(
      async () => {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw await parseErrorResponse(res);
        }

        return res.json();
      },
      3, // max retries
      1000 // base delay
    );

    success('Upload successful', 'Your document has been uploaded');
    return response;
  } catch (error) {
    handleApiError(error);
    return null;
  }
}
```

### Form Validation Errors

```typescript
import { ValidationError, extractFieldErrors } from '@/lib/errors/AppError';

try {
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const error = await parseErrorResponse(response);
    
    if (error.code === 'VALIDATION_ERROR') {
      const fieldErrors = extractFieldErrors(error);
      setErrors(fieldErrors); // Update form errors
    } else {
      throw error;
    }
  }
} catch (error) {
  handleApiError(error);
}
```

### Service-Level Error Handling

```typescript
// lib/services/DocumentService.ts
import { DatabaseError, NotFoundError } from '@/lib/errors/AppError';

export class DocumentService {
  async getDocument(id: string) {
    try {
      const document = await prisma.document.findUnique({
        where: { id },
      });

      if (!document) {
        throw new NotFoundError('Document', { id });
      }

      return document;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError('Failed to fetch document', {
          prismaCode: error.code,
          id,
        });
      }
      throw error;
    }
  }
}
```

---

## Error Response Format

### Success Response

```json
{
  "data": { ... },
  "success": true
}
```

### Error Response

```json
{
  "error": {
    "message": "Document not found",
    "code": "NOT_FOUND",
    "statusCode": 404,
    "details": {
      "id": "doc-123"
    },
    "timestamp": "2025-01-30T12:34:56.789Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

---

## Database Schema

### ErrorLog Table

```prisma
model ErrorLog {
  id          String   @id @default(uuid())
  severity    String   // LOW, MEDIUM, HIGH, CRITICAL
  message     String   @db.Text
  code        String?
  statusCode  Int?
  stack       String?  @db.Text
  details     String?  @db.Text
  userId      String?
  requestId   String?
  endpoint    String?
  method      String?
  userAgent   String?
  ipAddress   String?
  timestamp   DateTime @default(now())

  @@index([userId])
  @@index([timestamp])
  @@index([severity])
  @@index([code])
  @@index([endpoint])
}
```

### Notification Table

```prisma
model Notification {
  id        String   @id @default(uuid())
  type      String
  title     String
  message   String   @db.Text
  severity  String
  metadata  String?  @db.Text
  read      Boolean  @default(false)
  userId    String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
  @@index([read])
}
```

---

## Best Practices

### 1. Use Appropriate Error Classes

```typescript
// ✅ Good
throw new NotFoundError('Document', { id });

// ❌ Bad
throw new Error('Document not found');
```

### 2. Include Context in Errors

```typescript
// ✅ Good
throw new ValidationError('Invalid email format', {
  field: 'email',
  value: email,
  pattern: EMAIL_REGEX,
});

// ❌ Bad
throw new ValidationError('Invalid email');
```

### 3. Handle Errors at Appropriate Level

```typescript
// ✅ Good - Handle at API level
export const POST = withErrorHandler(async (req) => {
  const result = await service.createDocument(data);
  return NextResponse.json(result);
});

// ❌ Bad - Swallow errors
try {
  await service.createDocument(data);
} catch (error) {
  console.log(error); // Don't just log and ignore
}
```

### 4. Provide User-Friendly Messages

```typescript
// ✅ Good
throw new FileUploadError(
  'File size exceeds the 10MB limit. Please compress your file and try again.',
  { maxSize: 10, actualSize: 15 }
);

// ❌ Bad
throw new Error('File too big');
```

### 5. Log Errors Properly

```typescript
// ✅ Good
await errorLogger.logError(error, {
  userId: user.id,
  endpoint: req.url,
  method: req.method,
});

// ❌ Bad
console.error(error); // Only console, no persistence
```

### 6. Don't Expose Sensitive Information

```typescript
// ✅ Good
if (process.env.NODE_ENV === 'development') {
  return { error: error.stack };
} else {
  return { error: 'An error occurred' };
}

// ❌ Bad
return { error: error.stack }; // Always exposing stack trace
```

---

## Error Monitoring

### View Recent Errors

```typescript
import { errorLogger } from '@/lib/errors/ErrorLogger';

// Get recent errors
const errors = await errorLogger.getRecentErrors(100);

// Get critical errors only
const criticalErrors = await errorLogger.getRecentErrors(50, ErrorSeverity.CRITICAL);
```

### Error Statistics

```typescript
// Get error stats for last 24 hours
const stats = await errorLogger.getErrorStats(24);

console.log(stats);
// {
//   total: 150,
//   bySeverity: {
//     LOW: 80,
//     MEDIUM: 50,
//     HIGH: 15,
//     CRITICAL: 5
//   },
//   byCode: {
//     'NOT_FOUND': 40,
//     'VALIDATION_ERROR': 30,
//     'AUTH_ERROR': 20
//   },
//   byEndpoint: {
//     '/api/documents': 60,
//     '/api/users': 40
//   }
// }
```

### Cleanup Old Logs

```typescript
// Clean up logs older than 90 days (keep only HIGH and CRITICAL)
const deleted = await errorLogger.cleanupOldLogs(90);
console.log(`Cleaned up ${deleted} old error logs`);
```

---

## Testing Error Handling

### Unit Tests

```typescript
import { NotFoundError, ValidationError } from '@/lib/errors/AppError';

describe('Error Handling', () => {
  it('should throw NotFoundError with correct status code', () => {
    const error = new NotFoundError('Document');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should include details in error', () => {
    const error = new ValidationError('Invalid input', {
      field: 'email',
      value: 'invalid',
    });
    expect(error.details.field).toBe('email');
  });
});
```

### Integration Tests

```typescript
describe('API Error Handling', () => {
  it('should return 404 for non-existent document', async () => {
    const response = await fetch('/api/documents/non-existent-id');
    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 for validation errors', async () => {
    const response = await fetch('/api/documents', {
      method: 'POST',
      body: JSON.stringify({ /* invalid data */ }),
    });
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## Troubleshooting

### Error Not Being Logged

**Check:**
1. Database connection is working
2. ErrorLog table exists
3. Error logger is imported correctly
4. Error is being thrown (not just logged to console)

### Toast Not Showing

**Check:**
1. Toaster component is included in layout
2. Toast hook is being called correctly
3. No CSS conflicts hiding the toast
4. Browser console for errors

### Error Boundary Not Catching

**Check:**
1. Error is thrown during render (not in event handler)
2. Error boundary is wrapping the component
3. Component is client-side ('use client')
4. No other error boundary catching it first

---

## Summary

The error handling system provides:
- ✅ **Structured error classes** for all error types
- ✅ **Centralized logging** with severity levels
- ✅ **User-friendly UI** for errors
- ✅ **Toast notifications** for inline feedback
- ✅ **Error boundaries** for React errors
- ✅ **API error handling** with proper status codes
- ✅ **Retry mechanisms** for transient failures
- ✅ **HIPAA compliance** (no PHI in logs)
- ✅ **Monitoring & statistics** for error tracking
- ✅ **Production-ready** with proper error messages

This comprehensive system ensures robust error handling across the entire HoloVitals platform.