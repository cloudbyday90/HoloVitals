# Error Handling Quick Start Guide

## Installation

### 1. Install Dependencies

```bash
npm install @radix-ui/react-toast class-variance-authority
```

### 2. Run Database Migration

```bash
cd medical-analysis-platform
npx prisma db push
npx prisma generate
```

### 3. Add Toaster to Root Layout

```tsx
// app/layout.tsx
import { Toaster } from '@/components/Toaster';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

---

## Quick Usage Examples

### 1. API Route Error Handling

```typescript
// app/api/documents/route.ts
import { withErrorHandler } from '@/lib/errors/errorHandler';
import { NotFoundError } from '@/lib/errors/AppError';

export const GET = withErrorHandler(async (req) => {
  const document = await getDocument(id);
  
  if (!document) {
    throw new NotFoundError('Document');
  }
  
  return NextResponse.json(document);
});
```

### 2. Client-Side Error Handling

```typescript
import { error, success } from '@/hooks/useToast';

async function uploadFile(file: File) {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    success('Upload successful', 'Your file has been uploaded');
  } catch (err) {
    error('Upload failed', err.message);
  }
}
```

### 3. Error Boundary

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

### 4. Custom Error Classes

```typescript
import { ValidationError, NotFoundError } from '@/lib/errors/AppError';

// Validation error
if (!email) {
  throw new ValidationError('Email is required', { field: 'email' });
}

// Not found error
if (!user) {
  throw new NotFoundError('User', { id: userId });
}
```

---

## Common Error Types

### Authentication Errors (401)
```typescript
import { AuthenticationError } from '@/lib/errors/AppError';

throw new AuthenticationError('Invalid credentials');
```

### Authorization Errors (403)
```typescript
import { AuthorizationError } from '@/lib/errors/AppError';

throw new AuthorizationError('Access denied');
```

### Validation Errors (400)
```typescript
import { ValidationError } from '@/lib/errors/AppError';

throw new ValidationError('Invalid input', {
  field: 'email',
  value: email,
});
```

### Not Found Errors (404)
```typescript
import { NotFoundError } from '@/lib/errors/AppError';

throw new NotFoundError('Document', { id: documentId });
```

### Database Errors (500)
```typescript
import { DatabaseError } from '@/lib/errors/AppError';

throw new DatabaseError('Failed to save document');
```

---

## Toast Notifications

### Success
```typescript
import { success } from '@/hooks/useToast';

success('Success!', 'Operation completed successfully');
```

### Error
```typescript
import { error } from '@/hooks/useToast';

error('Error!', 'Something went wrong');
```

### Warning
```typescript
import { warning } from '@/hooks/useToast';

warning('Warning!', 'Please review your input');
```

### Info
```typescript
import { info } from '@/hooks/useToast';

info('Info', 'New feature available');
```

---

## Error Logging

### Manual Logging
```typescript
import { errorLogger } from '@/lib/errors/ErrorLogger';

await errorLogger.logError(error, {
  userId: user.id,
  endpoint: '/api/documents',
  method: 'POST',
});
```

### View Error Stats
```typescript
const stats = await errorLogger.getErrorStats(24); // Last 24 hours
console.log(stats.total); // Total errors
console.log(stats.bySeverity); // Errors by severity
```

---

## Retry Logic

```typescript
import { retryWithBackoff } from '@/lib/utils/errorUtils';

const result = await retryWithBackoff(
  async () => {
    return await fetch('/api/data');
  },
  3, // max retries
  1000 // base delay (ms)
);
```

---

## Error Response Format

All API errors return this format:

```json
{
  "error": {
    "message": "Document not found",
    "code": "NOT_FOUND",
    "statusCode": 404,
    "details": { "id": "doc-123" },
    "timestamp": "2025-01-30T12:34:56.789Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

---

## Testing

### Test Error Handling
```typescript
describe('Error Handling', () => {
  it('should return 404 for non-existent resource', async () => {
    const response = await fetch('/api/documents/invalid-id');
    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data.error.code).toBe('NOT_FOUND');
  });
});
```

---

## Troubleshooting

### Errors Not Being Logged
1. Check database connection
2. Verify ErrorLog table exists
3. Run `npx prisma db push`

### Toast Not Showing
1. Verify Toaster is in root layout
2. Check for CSS conflicts
3. Ensure toast hook is imported correctly

### Error Boundary Not Working
1. Ensure component has 'use client'
2. Verify error boundary wraps component
3. Check error is thrown during render

---

## Next Steps

1. Read full documentation: `docs/ERROR_HANDLING.md`
2. Review error classes: `lib/errors/AppError.ts`
3. Check examples in API routes
4. Set up error monitoring dashboard

---

## Summary

✅ **Structured errors** - Use custom error classes  
✅ **Automatic logging** - All errors logged to database  
✅ **User feedback** - Toast notifications for errors  
✅ **Error boundaries** - Catch React component errors  
✅ **Retry logic** - Automatic retries for transient failures  
✅ **Production ready** - Proper error messages and status codes  

For more details, see `docs/ERROR_HANDLING.md`