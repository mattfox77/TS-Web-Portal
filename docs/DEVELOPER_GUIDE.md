# Tech Support Computer Services - Developer Guide

Comprehensive technical documentation for developers working on the Tech Support Computer Services Client Portal.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Authentication & Authorization](#authentication--authorization)
6. [External Integrations](#external-integrations)
7. [Development Setup](#development-setup)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)
11. [Contributing](#contributing)

---

## Architecture Overview

### High-Level Architecture

The portal is a full-stack Next.js 14 application deployed on Cloudflare Pages with edge functions.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│                    (React/Next.js Frontend)                     │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages + Workers                   │
│                      (Edge Runtime - Free)                      │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes (Edge Functions)                            │
│  ├─ /api/auth/*          (Clerk integration)                    │
│  ├─ /api/tickets/*       (Support ticket CRUD)                  │
│  ├─ /api/projects/*      (Project management)                   │
│  ├─ /api/invoices/*      (Invoice generation)                   │
│  ├─ /api/payments/*      (PayPal integration)                   │
│  ├─ /api/documents/*     (File upload/download)                 │
│  └─ /api/webhooks/*      (GitHub, PayPal, Clerk)                │
└────┬──────────────┬──────────────┬──────────────┬───────────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Clerk      │  │ Cloudflare   │  │ Cloudflare   │  │   PayPal     │
│     Auth     │  │   D1 (SQL)   │  │   R2 (S3)    │  │   REST API   │
│  (Free Tier) │  │  (Free Tier) │  │ (Free Tier)  │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Key Design Principles

1. **Edge-First**: Leverage Cloudflare's global edge network
2. **Serverless**: No server management, automatic scaling
3. **Cost-Optimized**: Maximize free-tier usage
4. **Type-Safe**: TypeScript throughout
5. **Secure by Default**: Authentication, authorization, encryption

---

## Technology Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.x
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context + hooks

### Backend

- **Runtime**: Cloudflare Workers (Edge)
- **API**: Next.js API Routes
- **Database**: Cloudflare D1 (SQLite)
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Authentication**: Clerk

### External Services

- **Payments**: PayPal REST API & Subscriptions API
- **Email**: SendGrid or Cloudflare Email Workers
- **Version Control**: GitHub (with webhooks)
- **Monitoring**: Cloudflare Analytics

### Development Tools

- **Package Manager**: npm
- **Build Tool**: Next.js built-in (Webpack/Turbopack)
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint
- **Formatting**: Prettier (optional)
- **Type Checking**: TypeScript compiler

---

## Database Schema

### Core Tables


#### Clients Table

```sql
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- Clerk user ID
  client_id TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user',  -- 'user' or 'admin'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
```

#### Projects Table

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning',
  github_repo TEXT,
  start_date TEXT,
  estimated_completion TEXT,
  actual_completion TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
```

#### Tickets Table

```sql
CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  project_id TEXT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  github_issue_number INTEGER,
  github_issue_url TEXT,
  assigned_to TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Invoices Table

```sql
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  subtotal REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  paid_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
```

### Indexes

```sql
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_tickets_client_id ON tickets(client_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_project_id ON tickets(project_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_api_usage_project_id ON api_usage(project_id);
CREATE INDEX idx_activity_log_client_id ON activity_log(client_id);
```

### TypeScript Interfaces

```typescript
// types/index.ts

export interface Client {
  id: string;
  name: string;
  email: string;
  company_name?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  client_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Ticket {
  id: string;
  client_id: string;
  project_id?: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  github_issue_number?: number;
  github_issue_url?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Environment bindings for Cloudflare Workers
export interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  GITHUB_TOKEN: string;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_MODE: 'sandbox' | 'live';
  SENDGRID_API_KEY: string;
  CLERK_WEBHOOK_SECRET: string;
}
```

---

## API Endpoints

### Authentication

All API routes require authentication via Clerk unless explicitly marked as public.

```typescript
import { auth } from '@clerk/nextjs';

export async function GET(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

### Tickets API

#### GET /api/tickets

List tickets for authenticated user's client.

**Query Parameters**:
- `status`: Filter by status (optional)
- `priority`: Filter by priority (optional)
- `project_id`: Filter by project (optional)

**Response**:
```json
{
  "tickets": [
    {
      "id": "ticket_123",
      "title": "Website not loading",
      "status": "open",
      "priority": "high",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /api/tickets

Create a new ticket.

**Request Body**:
```json
{
  "title": "Website not loading",
  "description": "The homepage returns a 500 error",
  "priority": "high",
  "project_id": "project_123"
}
```

**Response**:
```json
{
  "id": "ticket_123",
  "github_issue_url": "https://github.com/org/repo/issues/42"
}
```

#### GET /api/tickets/[id]

Get ticket details with comments.

**Response**:
```json
{
  "ticket": {
    "id": "ticket_123",
    "title": "Website not loading",
    "description": "...",
    "status": "in_progress",
    "priority": "high",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "comments": [
    {
      "id": "comment_1",
      "content": "Looking into this now",
      "user": { "name": "John Doe" },
      "created_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

#### PATCH /api/tickets/[id]

Update ticket status or priority.

**Request Body**:
```json
{
  "status": "resolved",
  "assigned_to": "admin_user_id"
}
```

#### POST /api/tickets/[id]/comments

Add comment to ticket.

**Request Body**:
```json
{
  "content": "I've fixed the issue. Please verify.",
  "is_internal": false
}
```

### Invoices API

#### GET /api/invoices

List invoices for authenticated user's client.

**Query Parameters**:
- `status`: Filter by status
- `date_from`: Start date (ISO 8601)
- `date_to`: End date (ISO 8601)

#### POST /api/invoices (Admin only)

Create new invoice.

**Request Body**:
```json
{
  "client_id": "client_123",
  "line_items": [
    {
      "description": "Website Development",
      "quantity": 20,
      "unit_price": 125.00
    }
  ],
  "issue_date": "2024-01-15",
  "due_date": "2024-02-14",
  "tax_rate": 0.08,
  "notes": "Payment due within 30 days"
}
```

#### GET /api/invoices/[id]/pdf

Download invoice PDF.

**Response**: PDF file with appropriate headers

### Payments API

#### POST /api/payments/create-order

Create PayPal order for invoice payment.

**Request Body**:
```json
{
  "invoice_id": "invoice_123"
}
```

**Response**:
```json
{
  "order_id": "PAYPAL_ORDER_ID",
  "approve_url": "https://paypal.com/checkoutnow?token=..."
}
```

#### POST /api/payments/capture-order

Capture completed PayPal order.

**Request Body**:
```json
{
  "order_id": "PAYPAL_ORDER_ID",
  "invoice_id": "invoice_123"
}
```

### Documents API

#### GET /api/documents

List documents for authenticated user's client.

**Query Parameters**:
- `project_id`: Filter by project (optional)

**Response**:
```json
{
  "documents": [
    {
      "id": "doc_123",
      "filename": "proposal.pdf",
      "file_size": 1024000,
      "download_url": "https://r2.cloudflare.com/...",
      "uploaded_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /api/documents

Upload document.

**Request**: `multipart/form-data`
- `file`: File to upload
- `project_id`: Associated project (optional)

**Response**:
```json
{
  "id": "doc_123",
  "filename": "proposal.pdf",
  "storage_key": "documents/client_123/doc_123.pdf"
}
```

#### DELETE /api/documents/[id]

Delete document.

### Admin API

#### GET /api/admin/stats

Get dashboard statistics (admin only).

**Response**:
```json
{
  "total_clients": 45,
  "active_clients": 42,
  "open_tickets": 23,
  "monthly_revenue": 15750.00,
  "active_projects": 18
}
```

#### GET /api/admin/clients

List all clients (admin only).

#### POST /api/admin/clients

Create new client (admin only).

#### GET /api/admin/usage

Get API usage reports (admin only).

**Query Parameters**:
- `client_id`: Filter by client
- `project_id`: Filter by project
- `date_from`: Start date
- `date_to`: End date

### Webhooks

#### POST /api/webhooks/clerk

Handle Clerk webhook events.

**Events**:
- `user.created`: Create user record in D1
- `user.updated`: Update user record
- `user.deleted`: Delete user record

#### POST /api/webhooks/paypal

Handle PayPal webhook events.

**Events**:
- `PAYMENT.SALE.COMPLETED`: Update invoice to paid
- `BILLING.SUBSCRIPTION.ACTIVATED`: Activate subscription
- `BILLING.SUBSCRIPTION.CANCELLED`: Cancel subscription

#### POST /api/webhooks/github

Handle GitHub webhook events.

**Events**:
- `issues.closed`: Update ticket status to closed
- `issues.reopened`: Update ticket status to open

---

## Authentication & Authorization

### Clerk Integration

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Protected Routes

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: ['/', '/services', '/about', '/contact'],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Authorization Helpers

```typescript
// lib/auth.ts
import { auth } from '@clerk/nextjs';
import { NextRequest } from 'next/server';

export async function requireAuth(): Promise<string> {
  const { userId } = auth();
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export async function requireAdmin(): Promise<string> {
  const userId = await requireAuth();
  const { env } = getRequestContext();
  
  const user = await env.DB
    .prepare('SELECT role FROM users WHERE id = ?')
    .bind(userId)
    .first<{ role: string }>();
  
  if (user?.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  
  return userId;
}

export async function getUserClientId(
  db: D1Database,
  userId: string
): Promise<string> {
  const user = await db
    .prepare('SELECT client_id FROM users WHERE id = ?')
    .bind(userId)
    .first<{ client_id: string }>();
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  return user.client_id;
}
```

### Client Data Isolation

Always filter queries by client_id for non-admin users:

```typescript
export async function GET(request: NextRequest) {
  const userId = await requireAuth();
  const { env } = getRequestContext();
  const clientId = await getUserClientId(env.DB, userId);
  
  // Query filtered by client_id
  const { results } = await env.DB
    .prepare('SELECT * FROM tickets WHERE client_id = ?')
    .bind(clientId)
    .all();
  
  return NextResponse.json({ tickets: results });
}
```

---

## External Integrations

### PayPal Integration

#### Authentication

```typescript
// lib/paypal.ts
export async function getPayPalAccessToken(env: Env): Promise<string> {
  const auth = Buffer.from(
    `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  
  const baseUrl = env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  return data.access_token;
}
```

#### Creating Orders

```typescript
export async function createPayPalOrder(
  env: Env,
  invoice: Invoice
): Promise<{ id: string; approve_url: string }> {
  const accessToken = await getPayPalAccessToken(env);
  const baseUrl = env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
  
  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: invoice.id,
        amount: {
          currency_code: invoice.currency,
          value: invoice.total.toFixed(2),
        },
      }],
    }),
  });
  
  const order = await response.json();
  const approveLink = order.links.find((link: any) => link.rel === 'approve');
  
  return {
    id: order.id,
    approve_url: approveLink.href,
  };
}
```

### GitHub Integration

#### Creating Issues

```typescript
// lib/github.ts
export async function createGitHubIssue(
  env: Env,
  repo: string,
  ticket: Ticket
): Promise<{ number: number; url: string }> {
  const [owner, repoName] = repo.replace('https://github.com/', '').split('/');
  
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/issues`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        title: ticket.title,
        body: `${ticket.description}\n\n---\nTicket ID: ${ticket.id}\nPriority: ${ticket.priority}`,
        labels: [ticket.priority, 'support-ticket'],
      }),
    }
  );
  
  const issue = await response.json();
  return {
    number: issue.number,
    url: issue.html_url,
  };
}
```

#### Webhook Verification

```typescript
export function verifyGitHubWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

### Email Integration (SendGrid)

```typescript
// lib/email.ts
export async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  html: string,
  text: string,
  attachments?: Array<{ filename: string; content: Buffer }>
): Promise<void> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: to }],
      }],
      from: {
        email: 'noreply@techsupportcs.com',
        name: 'Tech Support Computer Services',
      },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content.toString('base64'),
        type: 'application/pdf',
        disposition: 'attachment',
      })),
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send email');
  }
}
```

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Clerk account
- PayPal developer account
- GitHub account (for issue tracking)
- SendGrid account (for emails)

### Local Development

1. **Clone Repository**:
```bash
git clone https://github.com/your-org/tech-support-portal.git
cd tech-support-portal
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Set Up Environment Variables**:

Create `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```

Create `.dev.vars` (for Cloudflare bindings):
```env
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_MODE=sandbox
GITHUB_TOKEN=ghp_xxx
SENDGRID_API_KEY=SG.xxx
APP_URL=http://localhost:3000
```

4. **Initialize Local Database**:
```bash
npx wrangler d1 create tech-support-db-local
npx wrangler d1 execute tech-support-db-local --local --file=./schema.sql
```

5. **Create R2 Bucket**:
```bash
npx wrangler r2 bucket create tech-support-documents-local
```

6. **Update wrangler.toml**:
```toml
name = "tech-support-portal"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "tech-support-db-local"
database_id = "xxx"

[[r2_buckets]]
binding = "DOCUMENTS"
bucket_name = "tech-support-documents-local"
```

7. **Run Development Server**:
```bash
npm run dev
```

Visit `http://localhost:3000`

### Database Migrations

When schema changes:

1. Update `schema.sql`
2. Create migration file in `migrations/`:
```sql
-- migrations/add_notification_preferences.sql
ALTER TABLE users ADD COLUMN notification_preferences TEXT;
```

3. Apply migration:
```bash
npx wrangler d1 execute tech-support-db-local --local --file=./migrations/add_notification_preferences.sql
```

### Testing Webhooks Locally

Use ngrok or similar tool:

```bash
ngrok http 3000
```

Configure webhook URLs in external services to point to ngrok URL.

---

## Deployment

### Production Deployment

1. **Build Application**:
```bash
npm run build
```

2. **Create Production Database**:
```bash
npx wrangler d1 create tech-support-db
npx wrangler d1 execute tech-support-db --remote --file=./schema.sql
```

3. **Create Production R2 Bucket**:
```bash
npx wrangler r2 bucket create tech-support-documents
```

4. **Update wrangler.toml** with production IDs

5. **Deploy to Cloudflare Pages**:
```bash
npx wrangler pages deploy .vercel/output/static --project-name=tech-support-portal
```

Or connect GitHub repository in Cloudflare dashboard for automatic deployments.

6. **Set Environment Variables** in Cloudflare dashboard:
- Navigate to Pages → Settings → Environment Variables
- Add all production variables

7. **Configure Webhooks**:
- Clerk: `https://your-domain.com/api/webhooks/clerk`
- PayPal: `https://your-domain.com/api/webhooks/paypal`
- GitHub: `https://your-domain.com/api/webhooks/github`

### Deployment Script

```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e

echo "Building application..."
npm run build

echo "Running tests..."
npm test

echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy .vercel/output/static --project-name=tech-support-portal

echo "Deployment complete!"
```

### Environment Configuration

**Development** (`.env.local` + `.dev.vars`):
- Clerk test keys
- PayPal sandbox
- Local database

**Production** (Cloudflare environment variables):
- Clerk production keys
- PayPal live mode
- Production database

---

## Testing

### Unit Tests

```bash
npm test
```

**Example Test**:
```typescript
// lib/__tests__/pricing.test.ts
import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotal } from '../pricing';

describe('calculateInvoiceTotal', () => {
  it('should calculate subtotal, tax, and total correctly', () => {
    const items = [
      { quantity: 2, unit_price: 50 },
      { quantity: 1, unit_price: 100 }
    ];
    const result = calculateInvoiceTotal(items, 0.08);
    
    expect(result.subtotal).toBe(200);
    expect(result.tax_amount).toBe(16);
    expect(result.total).toBe(216);
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
// __tests__/api/tickets.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/tickets', () => {
  it('should create a ticket', async () => {
    const response = await fetch('http://localhost:3000/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_token',
      },
      body: JSON.stringify({
        title: 'Test ticket',
        description: 'Test description',
        priority: 'medium',
      }),
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
  });
});
```

### E2E Tests

Use Playwright for end-to-end testing:

```typescript
// tests/e2e/invoice-payment.spec.ts
import { test, expect } from '@playwright/test';

test('complete invoice payment flow', async ({ page }) => {
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.click('text=Invoices');
  await expect(page).toHaveURL('/dashboard/invoices');
  
  await page.click('text=INV-2024-0001');
  await expect(page.locator('text=Status: Sent')).toBeVisible();
});
```

---

## Troubleshooting

### Common Development Issues

**Issue**: Database queries fail with "no such table"
**Solution**: Run schema.sql to initialize database

**Issue**: Clerk authentication not working
**Solution**: Verify environment variables are set correctly

**Issue**: PayPal sandbox not working
**Solution**: Ensure PAYPAL_MODE is set to "sandbox"

**Issue**: File uploads fail
**Solution**: Check R2 bucket binding in wrangler.toml

### Debugging

**Enable Verbose Logging**:
```typescript
console.log('Debug info:', { userId, clientId, data });
```

**Check Cloudflare Logs**:
```bash
npx wrangler tail
```

**Database Queries**:
```bash
npx wrangler d1 execute tech-support-db --local --command="SELECT * FROM users LIMIT 10"
```

### Performance Issues

**Slow Queries**:
- Check if indexes exist
- Use EXPLAIN QUERY PLAN
- Optimize JOIN operations

**Large Payloads**:
- Implement pagination
- Use streaming for large files
- Compress responses

---

## Contributing

### Code Style

- Use TypeScript for all new code
- Follow ESLint rules
- Use meaningful variable names
- Add comments for complex logic
- Write tests for new features

### Git Workflow

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and commit: `git commit -m "Add new feature"`
3. Push branch: `git push origin feature/new-feature`
4. Create pull request
5. Wait for review and approval
6. Merge to main

### Pull Request Guidelines

- Provide clear description of changes
- Include tests for new features
- Update documentation if needed
- Ensure all tests pass
- Follow code style guidelines

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Clerk Documentation](https://clerk.com/docs)
- [PayPal API Documentation](https://developer.paypal.com/docs/api/)
- [GitHub API Documentation](https://docs.github.com/en/rest)

---

*Last Updated: [Date]*
*Version: 1.0*

For questions or issues, contact the development team or create an issue in the GitHub repository.
