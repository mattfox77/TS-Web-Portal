# Error Handling Guide

This guide explains the error handling patterns and best practices used in the Tech Support Client Portal.

## Error Classes

### AppError (Base Class)
Base error class for all application errors.

```typescript
throw new AppError(statusCode, message, code?, details?);
```

### UnauthorizedError (401)
Used when authentication is required but not provided or invalid.

```typescript
throw new UnauthorizedError('Custom message');
```

### ForbiddenError (403)
Used when user is authenticated but lacks required permissions.

```typescript
throw new ForbiddenError('Admin access required');
```

### NotFoundError (404)
Used when a requested resource doesn't exist.

```typescript
throw new NotFoundError('Invoice'); // Returns "Invoice not found"
```

### ValidationError (422)
Used when input validation fails.

```typescript
throw new ValidationError({
  email: 'Invalid email format',
  password: 'Password must be at least 8 characters'
});
```

### ConflictError (409)
Used when there's a resource conflict (e.g., duplicate entries).

```typescript
throw new ConflictError('Invoice number already exists');
```

## Error Handling Functions

### handleError()
Main error handler that returns appropriate NextResponse.

```typescript
import { handleError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Your code here
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error, {
      endpoint: '/api/example',
      method: 'GET',
    });
  }
}
```

### withErrorHandler()
Wrapper function that automatically handles errors in API routes.

```typescript
import { withErrorHandler } from '@/lib/errors';

export const GET = withErrorHandler(async (request) => {
  // Your code here - errors are automatically caught and handled
  return NextResponse.json({ data });
});
```

### withDatabaseErrorHandler()
Wraps database operations with error handling.

```typescript
import { withDatabaseErrorHandler } from '@/lib/errors';

const result = await withDatabaseErrorHandler(
  () => db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first(),
  'fetch_user'
);
```

### withExternalApiErrorHandler()
Wraps external API calls with error handling.

```typescript
import { withExternalApiErrorHandler } from '@/lib/errors';

const result = await withExternalApiErrorHandler(
  () => fetch('https://api.example.com/data'),
  'example_api'
);
```

## Best Practices

### 1. Always Use Try-Catch in API Routes

```typescript
export async function POST(request: NextRequest) {
  try {
    // Your code
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
```

### 2. Validate Input Early

```typescript
import { validateInput, createTicketSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input - throws ValidationError if invalid
    const validated = validateInput(createTicketSchema, body);
    
    // Continue with validated data
    // ...
  } catch (error) {
    return handleError(error);
  }
}
```

### 3. Check Authentication and Authorization

```typescript
import { requireAuth, requireAdmin } from '@/lib/auth';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const userId = await requireAuth(request);
    
    // Or require admin access
    const adminUserId = await requireAdmin(request);
    
    // Continue with authenticated request
    // ...
  } catch (error) {
    return handleError(error);
  }
}
```

### 4. Verify Resource Ownership

```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireAuth(request);
    const clientId = await getUserClientId(db, userId);
    
    // Fetch resource
    const invoice = await db
      .prepare('SELECT * FROM invoices WHERE id = ?')
      .bind(params.id)
      .first();
    
    if (!invoice) {
      throw new NotFoundError('Invoice');
    }
    
    // Verify ownership
    if (invoice.client_id !== clientId) {
      throw new ForbiddenError('Access denied');
    }
    
    return NextResponse.json({ invoice });
  } catch (error) {
    return handleError(error);
  }
}
```

### 5. Log Errors with Context

```typescript
import { logError } from '@/lib/errors';

try {
  // Your code
} catch (error) {
  logError(error, {
    userId,
    invoiceId,
    operation: 'create_invoice',
  });
  throw error;
}
```

### 6. Handle Database Errors Gracefully

```typescript
import { withDatabaseErrorHandler } from '@/lib/errors';

const user = await withDatabaseErrorHandler(
  async () => {
    return await db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first();
  },
  'fetch_user'
);
```

### 7. Handle External API Errors

```typescript
import { withExternalApiErrorHandler } from '@/lib/errors';

const paypalOrder = await withExternalApiErrorHandler(
  async () => {
    const response = await fetch('https://api.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: { /* ... */ },
      body: JSON.stringify({ /* ... */ }),
    });
    
    if (!response.ok) {
      throw new Error(`PayPal API error: ${response.status}`);
    }
    
    return await response.json();
  },
  'paypal_create_order'
);
```

### 8. Return Consistent Error Responses

All errors return the same format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "error details"
  }
}
```

### 9. Don't Expose Sensitive Information

```typescript
// ❌ Bad - exposes internal details
throw new Error(`Database connection failed: ${dbConnectionString}`);

// ✅ Good - generic message, log details internally
logError(error, { dbConnectionString });
throw new AppError(500, 'Database operation failed', 'DB_ERROR');
```

### 10. Use Audit Logging for Security Events

```typescript
import { logActivity } from '@/lib/audit';

// Log authentication attempts
await logAuthAttempt(db, request, userId, success);

// Log admin actions
await logAdminAction(db, request, adminUserId, 'delete_client', 'client', clientId);

// Log sensitive operations
await logInvoiceCreated(db, request, adminUserId, clientId, invoiceId, invoiceNumber, total);
```

## Complete Example

Here's a complete example of a well-structured API route with comprehensive error handling:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { requireAuth } from '@/lib/auth';
import { getUserClientId } from '@/lib/auth';
import { handleError, NotFoundError, ForbiddenError, withDatabaseErrorHandler } from '@/lib/errors';
import { validateInput, createTicketSchema } from '@/lib/validation';
import { logActivity } from '@/lib/audit';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const userId = await requireAuth(request);
    
    // 2. Get user's client ID
    const { env } = getRequestContext();
    const db = env.DB;
    const clientId = await getUserClientId(db, userId);
    
    // 3. Parse and validate input
    const body = await request.json();
    const validated = validateInput(createTicketSchema, body);
    
    // 4. Verify project ownership if project_id provided
    if (validated.project_id) {
      const project = await withDatabaseErrorHandler(
        () => db
          .prepare('SELECT client_id FROM projects WHERE id = ?')
          .bind(validated.project_id)
          .first<{ client_id: string }>(),
        'fetch_project'
      );
      
      if (!project) {
        throw new NotFoundError('Project');
      }
      
      if (project.client_id !== clientId) {
        throw new ForbiddenError('Access denied to project');
      }
    }
    
    // 5. Create ticket
    const ticketId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await withDatabaseErrorHandler(
      () => db
        .prepare(`
          INSERT INTO tickets (
            id, client_id, project_id, user_id, title, description,
            status, priority, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          ticketId,
          clientId,
          validated.project_id || null,
          userId,
          validated.title,
          validated.description,
          'open',
          validated.priority,
          now,
          now
        )
        .run(),
      'create_ticket'
    );
    
    // 6. Log activity
    await logActivity(db, {
      user_id: userId,
      client_id: clientId,
      action: 'ticket_created',
      entity_type: 'ticket',
      entity_id: ticketId,
      details: {
        title: validated.title,
        priority: validated.priority,
      },
      ip_address: request.headers.get('cf-connecting-ip') || undefined,
    });
    
    // 7. Return success response
    return NextResponse.json(
      { 
        success: true,
        ticket_id: ticketId 
      },
      { status: 201 }
    );
    
  } catch (error) {
    // 8. Handle all errors consistently
    return handleError(error, {
      endpoint: '/api/tickets',
      method: 'POST',
    });
  }
}
```

## Error Response Examples

### Validation Error (422)
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "title": "Title must be at least 5 characters",
    "priority": "Invalid enum value. Expected 'low' | 'medium' | 'high' | 'urgent'"
  }
}
```

### Unauthorized Error (401)
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

### Forbidden Error (403)
```json
{
  "error": "Admin access required",
  "code": "FORBIDDEN"
}
```

### Not Found Error (404)
```json
{
  "error": "Invoice not found",
  "code": "NOT_FOUND"
}
```

### Database Error (500)
```json
{
  "error": "Database operation failed",
  "code": "DB_ERROR",
  "details": {
    "operation": "create_ticket"
  }
}
```

## Testing Error Handling

When testing API routes, verify that:

1. Invalid input returns 422 with validation details
2. Missing authentication returns 401
3. Insufficient permissions return 403
4. Non-existent resources return 404
5. Server errors return 500 with generic message
6. All errors are logged with appropriate context
7. Sensitive information is never exposed in error responses
