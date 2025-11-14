# Design Document

## Overview

The Tech Support Computer Services Client Portal is a full-stack web application built with Next.js 14 (App Router), TypeScript, and Tailwind CSS, deployed on Cloudflare Pages. The architecture leverages free-tier cloud services to minimize operational costs while providing enterprise-grade functionality for IT service delivery, client management, support ticketing, and billing.

### Technology Stack

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript, Tailwind CSS
- **Authentication**: Clerk (free tier: 10,000 MAU)
- **Database**: Cloudflare D1 (serverless SQLite, free tier: 5GB storage, 5M reads/day)
- **File Storage**: Cloudflare R2 (S3-compatible, free tier: 10GB storage)
- **Hosting**: Cloudflare Pages (free tier: unlimited requests, 500 builds/month)
- **Edge Runtime**: Cloudflare Workers (bundled with Pages)
- **Payment Processing**: PayPal REST API and Subscriptions API
- **Email**: Cloudflare Email Workers or SendGrid (free tier: 100 emails/day)
- **External Integrations**: GitHub API (issue tracking), Sentry (optional error monitoring)

### Design Principles

1. **Cost Optimization**: Maximize use of free-tier services; avoid vendor lock-in
2. **Edge-First Architecture**: Leverage Cloudflare's global edge network for performance
3. **Security by Default**: Implement authentication, authorization, and data encryption
4. **Mobile-First Design**: Responsive UI optimized for all device sizes
5. **Scalability**: Design for growth from 10 to 1000 clients without infrastructure changes

## Architecture

### High-Level Architecture Diagram

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
                         │                  │
                         ▼                  ▼
                  ┌──────────────┐  ┌──────────────┐
                  │   GitHub     │  │   SendGrid   │
                  │     API      │  │  (Email 100) │
                  └──────────────┘  └──────────────┘
```

### Request Flow

1. **User Authentication**: Browser → Clerk → Next.js API → D1 (user/client lookup)
2. **Data Operations**: Browser → Edge Function → D1 (CRUD) → Response
3. **File Upload**: Browser → Edge Function → R2 (store) → D1 (metadata) → Response
4. **Payment**: Browser → Edge Function → PayPal API → Webhook → D1 (update) → Email
5. **Ticket Creation**: Browser → Edge Function → D1 (insert) → GitHub API (issue) → Email

### Deployment Architecture

- **Static Assets**: Pre-rendered pages cached at Cloudflare edge (300+ locations)
- **Dynamic Routes**: Server-side rendered on-demand at edge
- **API Routes**: Edge functions with direct D1/R2 bindings (no cold starts)
- **Database**: D1 replicated across Cloudflare regions
- **Files**: R2 objects distributed globally with automatic caching

## Components and Interfaces

### Frontend Components

#### Public Website Components

- **HomePage** (`app/page.tsx`): Hero section, service overview, CTA buttons
- **ServicesPage** (`app/services/page.tsx`): Service package cards with pricing
- **AboutPage** (`app/about/page.tsx`): Company info, team bios
- **ContactPage** (`app/contact/page.tsx`): Contact form with validation
- **Header** (`components/Header.tsx`): Navigation, logo, auth buttons
- **Footer** (`components/Footer.tsx`): Links, social media, copyright

#### Authentication Components

- **SignInPage** (`app/sign-in/[[...sign-in]]/page.tsx`): Clerk SignIn component
- **SignUpPage** (`app/sign-up/[[...sign-up]]/page.tsx`): Clerk SignUp component
- **UserButton** (Clerk component): Profile dropdown, sign out

#### Portal Dashboard Components

- **DashboardLayout** (`app/dashboard/layout.tsx`): Sidebar navigation, header
- **DashboardPage** (`app/dashboard/page.tsx`): Overview cards, recent activity
- **StatsCard** (`components/StatsCard.tsx`): Metric display (tickets, invoices, etc.)
- **ActivityFeed** (`components/ActivityFeed.tsx`): Timeline of recent events

#### Ticket Management Components

- **TicketsPage** (`app/dashboard/tickets/page.tsx`): Ticket list with filters
- **TicketDetailPage** (`app/dashboard/tickets/[id]/page.tsx`): Ticket view with comments
- **NewTicketPage** (`app/dashboard/tickets/new/page.tsx`): Ticket creation form
- **TicketTable** (`components/TicketTable.tsx`): Sortable table with status badges
- **TicketForm** (`components/TicketForm.tsx`): Reusable form with validation
- **CommentThread** (`components/CommentThread.tsx`): Comment list and input

#### Project Management Components

- **ProjectsPage** (`app/dashboard/projects/page.tsx`): Project grid/list view
- **ProjectDetailPage** (`app/dashboard/projects/[id]/page.tsx`): Project overview, linked tickets
- **ProjectCard** (`components/ProjectCard.tsx`): Project summary with progress bar
- **ProjectTimeline** (`components/ProjectTimeline.tsx`): Milestone visualization

#### Invoice and Payment Components

- **InvoicesPage** (`app/dashboard/invoices/page.tsx`): Invoice list with payment status
- **InvoiceDetailPage** (`app/dashboard/invoices/[id]/page.tsx`): Invoice view with line items
- **PaymentHistoryPage** (`app/dashboard/payments/page.tsx`): Transaction history
- **InvoiceTable** (`components/InvoiceTable.tsx`): Sortable invoice list
- **PayPalButton** (`components/PayPalButton.tsx`): PayPal checkout integration
- **InvoicePDF** (`components/InvoicePDF.tsx`): PDF generation component
- **SubscriptionCard** (`components/SubscriptionCard.tsx`): Active subscription display

#### Document Management Components

- **DocumentsPage** (`app/dashboard/documents/page.tsx`): File browser with upload
- **DocumentUpload** (`components/DocumentUpload.tsx`): Drag-drop file upload
- **DocumentList** (`components/DocumentList.tsx`): File list with download links
- **DocumentPreview** (`components/DocumentPreview.tsx`): In-browser file preview

#### Admin Components

- **AdminDashboard** (`app/admin/page.tsx`): Admin overview with metrics
- **ClientManagement** (`app/admin/clients/page.tsx`): Client CRUD interface
- **InvoiceGenerator** (`app/admin/invoices/new/page.tsx`): Invoice creation form
- **UsageReports** (`app/admin/usage/page.tsx`): API usage analytics
- **AdminClientCard** (`components/AdminClientCard.tsx`): Client summary for admin

### Backend API Routes

#### Authentication & User Management

```typescript
// app/api/auth/user/route.ts
GET /api/auth/user
  - Returns current user info and associated client
  - Uses Clerk auth() to get userId
  - Queries D1 for user and client data
```

#### Ticket Management

```typescript
// app/api/tickets/route.ts
GET /api/tickets
  - Query params: status, priority, project_id
  - Returns tickets for authenticated user's client
  - Includes project name via JOIN

POST /api/tickets
  - Body: { title, description, product_id?, priority }
  - Creates ticket in D1
  - Creates GitHub issue if project has repo
  - Sends email notification
  - Returns ticket ID and GitHub issue URL

// app/api/tickets/[id]/route.ts
GET /api/tickets/[id]
  - Returns ticket details with comments
  - Verifies user has access to ticket's client

PATCH /api/tickets/[id]
  - Body: { status?, priority?, assigned_to? }
  - Updates ticket in D1
  - Sends notification if status changed

// app/api/tickets/[id]/comments/route.ts
POST /api/tickets/[id]/comments
  - Body: { content }
  - Adds comment to ticket
  - Sends notification to ticket creator and admins
```

#### Project Management

```typescript
// app/api/projects/route.ts
GET /api/projects
  - Returns projects for authenticated user's client
  - Includes ticket counts and status summary

// app/api/projects/[id]/route.ts
GET /api/projects/[id]
  - Returns project details
  - Includes associated tickets and documents
```

#### Invoice Management

```typescript
// app/api/invoices/route.ts
GET /api/invoices
  - Query params: status, date_from, date_to
  - Returns invoices for authenticated user's client
  - Includes payment information

POST /api/invoices (Admin only)
  - Body: { client_id, line_items[], due_date, notes }
  - Generates invoice number (INV-YYYY-NNNN)
  - Calculates totals with tax
  - Stores in D1
  - Sends email with PDF attachment

// app/api/invoices/[id]/route.ts
GET /api/invoices/[id]
  - Returns invoice details with line items
  - Verifies user has access

// app/api/invoices/[id]/pdf/route.ts
GET /api/invoices/[id]/pdf
  - Generates PDF invoice
  - Returns PDF buffer with appropriate headers
```

#### Payment Processing (PayPal)

```typescript
// app/api/payments/create-order/route.ts
POST /api/payments/create-order
  - Body: { invoice_id }
  - Verifies invoice belongs to user's client
  - Creates PayPal order via REST API
  - Returns order ID for client-side approval

// app/api/payments/capture-order/route.ts
POST /api/payments/capture-order
  - Body: { order_id, invoice_id }
  - Captures PayPal payment
  - Updates invoice status to 'paid'
  - Records transaction in D1
  - Sends receipt email
```

```typescript
// app/api/payments/subscriptions/route.ts
POST /api/payments/subscriptions
  - Body: { service_package_id, billing_cycle }
  - Creates PayPal subscription plan
  - Creates subscription for user
  - Stores subscription ID in D1
  - Returns subscription approval URL

GET /api/payments/subscriptions
  - Returns active subscriptions for user's client

DELETE /api/payments/subscriptions/[id]
  - Cancels PayPal subscription
  - Updates status in D1
  - Sends cancellation confirmation email

// app/api/webhooks/paypal/route.ts
POST /api/webhooks/paypal
  - Verifies PayPal webhook signature
  - Handles events:
    - PAYMENT.SALE.COMPLETED: Update invoice, send receipt
    - BILLING.SUBSCRIPTION.ACTIVATED: Update subscription status
    - BILLING.SUBSCRIPTION.CANCELLED: Update subscription status
    - BILLING.SUBSCRIPTION.PAYMENT.FAILED: Send notification
```

#### Document Management

```typescript
// app/api/documents/route.ts
GET /api/documents
  - Query params: project_id
  - Returns documents for user's client
  - Generates pre-signed R2 URLs (1-hour expiry)

POST /api/documents
  - Body: FormData with file and metadata
  - Validates file size (max 50MB) and type
  - Uploads to R2 with unique key
  - Stores metadata in D1
  - Returns document ID

// app/api/documents/[id]/route.ts
DELETE /api/documents/[id]
  - Verifies ownership
  - Deletes from R2
  - Removes metadata from D1
```

#### Webhook Handlers

```typescript
// app/api/webhooks/clerk/route.ts
POST /api/webhooks/clerk
  - Verifies Clerk webhook signature
  - Handles user.created event
  - Creates client and user records in D1

// app/api/webhooks/github/route.ts
POST /api/webhooks/github
  - Verifies GitHub webhook signature
  - Handles issue closed/reopened events
  - Updates ticket status in D1

// app/api/webhooks/sendgrid/route.ts (optional)
POST /api/webhooks/sendgrid
  - Handles email delivery events
  - Logs bounces and failures
```

#### Admin APIs

```typescript
// app/api/admin/clients/route.ts (Admin only)
GET /api/admin/clients
  - Returns all clients with summary stats
POST /api/admin/clients
  - Creates new client

// app/api/admin/usage/route.ts (Admin only)
GET /api/admin/usage
  - Query params: client_id, date_from, date_to
  - Returns API usage aggregated by project
  - Calculates costs

// app/api/admin/reports/route.ts (Admin only)
GET /api/admin/reports
  - Query params: report_type, date_range
  - Generates business reports (revenue, tickets, etc.)
```

## Data Models

### Database Schema (Cloudflare D1)

```sql
-- Clients table
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active', -- active, inactive, suspended
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Users table (links Clerk users to clients)
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  client_id TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user', -- user, admin
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Service packages (predefined offerings)
CREATE TABLE service_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly REAL,
  price_annual REAL,
  features TEXT, -- JSON array
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Client subscriptions
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  service_package_id TEXT NOT NULL,
  paypal_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'active', -- active, cancelled, expired, suspended
  billing_cycle TEXT NOT NULL, -- monthly, annual
  start_date TEXT NOT NULL,
  next_billing_date TEXT,
  cancel_at_period_end INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (service_package_id) REFERENCES service_packages(id)
);
```

```sql
-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning', -- planning, active, on_hold, completed, cancelled
  github_repo TEXT,
  start_date TEXT,
  estimated_completion TEXT,
  actual_completion TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Support tickets table
CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  project_id TEXT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open', -- open, in_progress, waiting_client, resolved, closed
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  github_issue_number INTEGER,
  github_issue_url TEXT,
  assigned_to TEXT, -- Admin user ID
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Ticket comments
CREATE TABLE ticket_comments (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_internal INTEGER DEFAULT 0, -- Internal notes visible only to admins
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

```sql
-- Invoices table
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
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

-- Invoice line items
CREATE TABLE invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT,
  subscription_id TEXT,
  client_id TEXT NOT NULL,
  paypal_transaction_id TEXT UNIQUE,
  paypal_order_id TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- completed, pending, failed, refunded
  payment_method TEXT DEFAULT 'paypal',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
```

```sql
-- Documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  project_id TEXT,
  filename TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  storage_key TEXT NOT NULL, -- R2 object key
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- API usage tracking table
CREATE TABLE api_usage (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- openai, anthropic, etc.
  model TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  request_timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Activity log (audit trail)
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  client_id TEXT,
  action TEXT NOT NULL, -- ticket_created, invoice_paid, etc.
  entity_type TEXT, -- ticket, invoice, project, etc.
  entity_id TEXT,
  details TEXT, -- JSON
  ip_address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Indexes for performance
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
  id: string; // Clerk user ID
  client_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  description?: string;
  price_monthly?: number;
  price_annual?: number;
  features?: string[]; // Parsed from JSON
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  client_id: string;
  service_package_id: string;
  paypal_subscription_id?: string;
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  billing_cycle: 'monthly' | 'annual';
  start_date: string;
  next_billing_date?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  service_package?: ServicePackage; // Joined data
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  github_repo?: string;
  start_date?: string;
  estimated_completion?: string;
  actual_completion?: string;
  created_at: string;
  updated_at: string;
}
```

```typescript
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
  project_name?: string; // Joined data
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  user?: User; // Joined data
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
  items?: InvoiceItem[]; // Joined data
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id?: string;
  subscription_id?: string;
  client_id: string;
  paypal_transaction_id?: string;
  paypal_order_id?: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  payment_method: string;
  created_at: string;
}
```

```typescript
export interface Document {
  id: string;
  client_id: string;
  project_id?: string;
  filename: string;
  file_size: number;
  file_type: string;
  storage_key: string;
  uploaded_by: string;
  uploaded_at: string;
  download_url?: string; // Pre-signed URL
}

export interface ApiUsage {
  id: string;
  project_id: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  request_timestamp: string;
}

export interface ActivityLogEntry {
  id: string;
  user_id?: string;
  client_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>; // Parsed JSON
  ip_address?: string;
  created_at: string;
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

## Error Handling

### Error Response Format

All API routes return consistent error responses:

```typescript
interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
  details?: Record<string, any>;
}
```

### HTTP Status Codes

- **200 OK**: Successful GET/PATCH request
- **201 Created**: Successful POST request creating resource
- **204 No Content**: Successful DELETE request
- **400 Bad Request**: Invalid input data or missing required fields
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Authenticated but lacking permissions
- **404 Not Found**: Resource does not exist
- **409 Conflict**: Resource conflict (e.g., duplicate invoice number)
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Unexpected server error

### Error Handling Patterns

```typescript
// lib/errors.ts

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, any>) {
    super(422, 'Validation failed', 'VALIDATION_ERROR', details);
  }
}

// Error handler middleware
export function handleError(error: unknown): Response {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Database Error Handling

```typescript
// lib/db-utils.ts

export async function executeQuery<T>(
  db: D1Database,
  query: string,
  params: any[]
): Promise<T> {
  try {
    const result = await db.prepare(query).bind(...params).first<T>();
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw new AppError(500, 'Database operation failed', 'DB_ERROR');
  }
}

export async function executeQueryAll<T>(
  db: D1Database,
  query: string,
  params: any[]
): Promise<T[]> {
  try {
    const { results } = await db.prepare(query).bind(...params).all<T>();
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw new AppError(500, 'Database operation failed', 'DB_ERROR');
  }
}
```

### External API Error Handling

```typescript
// lib/paypal.ts

export async function handlePayPalError(error: any): Promise<never> {
  if (error.response) {
    const { status, data } = error.response;
    console.error('PayPal API error:', status, data);
    
    if (status === 401) {
      throw new AppError(500, 'PayPal authentication failed', 'PAYPAL_AUTH_ERROR');
    }
    
    throw new AppError(
      500,
      'PayPal operation failed',
      'PAYPAL_ERROR',
      { details: data }
    );
  }
  
  throw new AppError(500, 'PayPal request failed', 'PAYPAL_NETWORK_ERROR');
}

// lib/github.ts

export async function handleGitHubError(error: any): Promise<void> {
  // GitHub errors are non-critical; log but don't fail the request
  console.error('GitHub API error:', error);
  // Could send alert to admin via email or monitoring service
}
```

## Testing Strategy

### Unit Testing

**Framework**: Vitest with React Testing Library

**Coverage Goals**:
- Utility functions: 90%+
- API route handlers: 80%+
- React components: 70%+

**Key Test Areas**:
```typescript
// lib/__tests__/pricing.test.ts
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

// lib/__tests__/auth.test.ts
describe('getUserClient', () => {
  it('should return client_id for authenticated user', async () => {
    const mockDb = createMockD1Database();
    const clientId = await getUserClient(mockDb, 'user_123');
    expect(clientId).toBe('client_456');
  });
  
  it('should throw UnauthorizedError for invalid user', async () => {
    const mockDb = createMockD1Database();
    await expect(getUserClient(mockDb, 'invalid')).rejects.toThrow(UnauthorizedError);
  });
});
```

### Integration Testing

**Framework**: Playwright for E2E tests

**Critical User Flows**:
1. User registration and first login
2. Create support ticket → GitHub issue creation
3. Admin creates invoice → User pays via PayPal → Invoice marked paid
4. User uploads document → Document appears in list → Download works
5. Admin creates subscription → User subscribes → Recurring payment processed

**Example Test**:
```typescript
// tests/e2e/invoice-payment.spec.ts
test('complete invoice payment flow', async ({ page }) => {
  // Login as user
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Navigate to invoices
  await page.click('text=Invoices');
  await expect(page).toHaveURL('/dashboard/invoices');
  
  // Click on unpaid invoice
  await page.click('text=INV-2024-0001');
  await expect(page.locator('text=Status: Sent')).toBeVisible();
  
  // Click PayPal button (mock PayPal in test environment)
  await page.click('text=Pay with PayPal');
  // ... complete mock PayPal flow
  
  // Verify invoice marked as paid
  await expect(page.locator('text=Status: Paid')).toBeVisible();
});
```

### Manual Testing Checklist

**Authentication**:
- [ ] User can register with email/password
- [ ] User can login with Google OAuth
- [ ] User can reset password
- [ ] Session persists across page refreshes
- [ ] User can sign out

**Tickets**:
- [ ] User can create ticket with all fields
- [ ] Ticket appears in list immediately
- [ ] GitHub issue created for project-linked tickets
- [ ] User receives email notification
- [ ] Admin can update ticket status
- [ ] Comments appear in real-time

**Invoices & Payments**:
- [ ] Admin can create invoice with line items
- [ ] Invoice PDF generates correctly
- [ ] User receives invoice email
- [ ] PayPal button redirects to checkout
- [ ] Payment webhook updates invoice status
- [ ] Receipt email sent after payment

**Documents**:
- [ ] User can upload files up to 50MB
- [ ] File appears in list with correct metadata
- [ ] Download link works and expires after 1 hour
- [ ] User can delete own documents

**Subscriptions**:
- [ ] User can subscribe to service package
- [ ] PayPal subscription created successfully
- [ ] Recurring payment generates invoice
- [ ] User can cancel subscription

**Admin Functions**:
- [ ] Admin can view all clients
- [ ] Admin can create/edit projects
- [ ] Admin can generate usage reports
- [ ] Admin can impersonate users

## Security Considerations

### Authentication & Authorization

1. **Clerk Integration**: All authentication handled by Clerk with secure session management
2. **Role-Based Access Control (RBAC)**:
   - User role: Access only to own client's data
   - Admin role: Access to all data and admin functions
3. **API Route Protection**: Every API route checks authentication via `auth()` from Clerk
4. **Client Isolation**: Database queries always filter by `client_id` for user role

```typescript
// lib/auth.ts

export async function requireAuth(request: NextRequest): Promise<string> {
  const { userId } = auth();
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export async function requireAdmin(request: NextRequest): Promise<string> {
  const userId = await requireAuth(request);
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

### Input Validation & Sanitization

1. **Zod Schema Validation**: All API inputs validated with Zod schemas
2. **SQL Injection Prevention**: Use parameterized queries exclusively
3. **XSS Prevention**: Sanitize user inputs, use React's built-in escaping
4. **File Upload Validation**: Check file type, size, and scan for malware (optional)

```typescript
// lib/validation.ts
import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  project_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

export const createInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  line_items: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
  })).min(1),
  due_date: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

// Usage in API route
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = createTicketSchema.parse(body); // Throws if invalid
  // ... proceed with validated data
}
```

### Data Encryption

1. **In Transit**: All connections use HTTPS/TLS 1.3 via Cloudflare
2. **At Rest**: 
   - D1 database encrypted by default
   - R2 objects encrypted with AES-256
3. **Sensitive Data**: Store only hashed/encrypted values for sensitive fields
4. **API Keys**: Store in Cloudflare environment variables, never in code

### Webhook Security

```typescript
// lib/webhooks.ts

export async function verifyPayPalWebhook(
  request: NextRequest,
  env: Env
): Promise<boolean> {
  const webhookId = env.PAYPAL_WEBHOOK_ID;
  const body = await request.text();
  const headers = {
    'auth-algo': request.headers.get('paypal-auth-algo'),
    'cert-url': request.headers.get('paypal-cert-url'),
    'transmission-id': request.headers.get('paypal-transmission-id'),
    'transmission-sig': request.headers.get('paypal-transmission-sig'),
    'transmission-time': request.headers.get('paypal-transmission-time'),
  };
  
  // Verify signature with PayPal API
  const response = await fetch(
    `${env.PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getPayPalAccessToken(env)}`,
      },
      body: JSON.stringify({
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
        ...headers,
      }),
    }
  );
  
  const result = await response.json();
  return result.verification_status === 'SUCCESS';
}
```

### Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Optional: Use Upstash Redis free tier (10k requests/day)
// Or implement simple in-memory rate limiting for edge

export async function rateLimit(
  identifier: string,
  limit: number = 100,
  window: string = '1h'
): Promise<boolean> {
  // Simple implementation: track requests in D1
  // For production, consider Upstash Redis or Cloudflare Rate Limiting
  return true; // Placeholder
}
```

### Audit Logging

All sensitive operations logged to `activity_log` table:
- User authentication attempts
- Admin impersonation
- Invoice creation and payment
- Document uploads and downloads
- Ticket status changes
- Subscription modifications

```typescript
// lib/audit.ts

export async function logActivity(
  db: D1Database,
  data: {
    user_id?: string;
    client_id?: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    details?: Record<string, any>;
    ip_address?: string;
  }
): Promise<void> {
  const id = crypto.randomUUID();
  await db
    .prepare(`
      INSERT INTO activity_log 
      (id, user_id, client_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      data.user_id || null,
      data.client_id || null,
      data.action,
      data.entity_type || null,
      data.entity_id || null,
      data.details ? JSON.stringify(data.details) : null,
      data.ip_address || null
    )
    .run();
}
```

## PayPal Integration Details

### PayPal REST API Setup

1. **Create PayPal App**: Developer Dashboard → My Apps & Credentials
2. **Get Credentials**: Client ID and Secret for Sandbox and Live
3. **Configure Webhooks**: Set webhook URL for payment events
4. **Environment Variables**:
   ```
   PAYPAL_CLIENT_ID=xxx
   PAYPAL_CLIENT_SECRET=xxx
   PAYPAL_MODE=sandbox (or live)
   PAYPAL_WEBHOOK_ID=xxx
   ```

### PayPal Order Flow (One-Time Payments)

```typescript
// lib/paypal.ts

interface PayPalAccessToken {
  access_token: string;
  expires_in: number;
}

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
  
  const data: PayPalAccessToken = await response.json();
  return data.access_token;
}

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
        description: `Invoice ${invoice.invoice_number}`,
        amount: {
          currency_code: invoice.currency,
          value: invoice.total.toFixed(2),
        },
      }],
      application_context: {
        brand_name: 'Tech Support Computer Services',
        return_url: `${env.APP_URL}/dashboard/invoices/${invoice.id}?payment=success`,
        cancel_url: `${env.APP_URL}/dashboard/invoices/${invoice.id}?payment=cancelled`,
      },
    }),
  });
  
  if (!response.ok) {
    throw await handlePayPalError(response);
  }
  
  const order = await response.json();
  const approveLink = order.links.find((link: any) => link.rel === 'approve');
  
  return {
    id: order.id,
    approve_url: approveLink.href,
  };
}

export async function capturePayPalOrder(
  env: Env,
  orderId: string
): Promise<{ transaction_id: string; status: string }> {
  const accessToken = await getPayPalAccessToken(env);
  const baseUrl = env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
  
  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    throw await handlePayPalError(response);
  }
  
  const capture = await response.json();
  const transaction = capture.purchase_units[0].payments.captures[0];
  
  return {
    transaction_id: transaction.id,
    status: transaction.status,
  };
}
```

### PayPal Subscription Flow (Recurring Payments)

```typescript
// lib/paypal-subscriptions.ts

export async function createPayPalSubscriptionPlan(
  env: Env,
  servicePackage: ServicePackage,
  billingCycle: 'monthly' | 'annual'
): Promise<string> {
  const accessToken = await getPayPalAccessToken(env);
  const baseUrl = env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
  
  const price = billingCycle === 'monthly'
    ? servicePackage.price_monthly
    : servicePackage.price_annual;
  
  const interval = billingCycle === 'monthly' ? 'MONTH' : 'YEAR';
  
  // Create product first
  const productResponse = await fetch(`${baseUrl}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: servicePackage.name,
      description: servicePackage.description,
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });
  
  const product = await productResponse.json();
  
  // Create billing plan
  const planResponse = await fetch(`${baseUrl}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: product.id,
      name: `${servicePackage.name} - ${billingCycle}`,
      billing_cycles: [{
        frequency: {
          interval_unit: interval,
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // Infinite
        pricing_scheme: {
          fixed_price: {
            value: price.toFixed(2),
            currency_code: 'USD',
          },
        },
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });
  
  const plan = await planResponse.json();
  return plan.id;
}

export async function createPayPalSubscription(
  env: Env,
  planId: string,
  clientId: string
): Promise<{ subscription_id: string; approve_url: string }> {
  const accessToken = await getPayPalAccessToken(env);
  const baseUrl = env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
  
  const response = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: clientId,
      application_context: {
        brand_name: 'Tech Support Computer Services',
        return_url: `${env.APP_URL}/dashboard/subscriptions?status=success`,
        cancel_url: `${env.APP_URL}/dashboard/subscriptions?status=cancelled`,
      },
    }),
  });
  
  const subscription = await response.json();
  const approveLink = subscription.links.find((link: any) => link.rel === 'approve');
  
  return {
    subscription_id: subscription.id,
    approve_url: approveLink.href,
  };
}

export async function cancelPayPalSubscription(
  env: Env,
  subscriptionId: string,
  reason: string
): Promise<void> {
  const accessToken = await getPayPalAccessToken(env);
  const baseUrl = env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
  
  await fetch(
    `${baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    }
  );
}
```

### PayPal Webhook Events

Key webhook events to handle:

1. **PAYMENT.SALE.COMPLETED**: One-time payment completed
2. **BILLING.SUBSCRIPTION.ACTIVATED**: Subscription activated
3. **BILLING.SUBSCRIPTION.CANCELLED**: Subscription cancelled
4. **BILLING.SUBSCRIPTION.SUSPENDED**: Payment failed, subscription suspended
5. **BILLING.SUBSCRIPTION.PAYMENT.FAILED**: Recurring payment failed

```typescript
// app/api/webhooks/paypal/route.ts

export async function POST(request: NextRequest) {
  const { env } = getRequestContext();
  
  // Verify webhook signature
  const isValid = await verifyPayPalWebhook(request, env);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const event = await request.json();
  const db = env.DB;
  
  switch (event.event_type) {
    case 'PAYMENT.SALE.COMPLETED': {
      const sale = event.resource;
      const invoiceId = sale.custom || sale.invoice_id;
      
      // Update invoice status
      await db
        .prepare('UPDATE invoices SET status = ?, paid_date = ? WHERE id = ?')
        .bind('paid', new Date().toISOString(), invoiceId)
        .run();
      
      // Record payment
      const paymentId = crypto.randomUUID();
      await db
        .prepare(`
          INSERT INTO payments 
          (id, invoice_id, client_id, paypal_transaction_id, amount, currency, status)
          SELECT ?, ?, client_id, ?, ?, ?, ?
          FROM invoices WHERE id = ?
        `)
        .bind(
          paymentId,
          invoiceId,
          sale.id,
          parseFloat(sale.amount.total),
          sale.amount.currency,
          'completed',
          invoiceId
        )
        .run();
      
      // Send receipt email
      await sendReceiptEmail(db, invoiceId);
      break;
    }
    
    case 'BILLING.SUBSCRIPTION.ACTIVATED': {
      const subscription = event.resource;
      await db
        .prepare(`
          UPDATE subscriptions 
          SET status = ?, next_billing_date = ?
          WHERE paypal_subscription_id = ?
        `)
        .bind(
          'active',
          subscription.billing_info.next_billing_time,
          subscription.id
        )
        .run();
      break;
    }
    
    case 'BILLING.SUBSCRIPTION.CANCELLED': {
      const subscription = event.resource;
      await db
        .prepare('UPDATE subscriptions SET status = ? WHERE paypal_subscription_id = ?')
        .bind('cancelled', subscription.id)
        .run();
      break;
    }
    
    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
      const subscription = event.resource;
      // Send notification to client
      await sendPaymentFailedEmail(db, subscription.id);
      break;
    }
  }
  
  return NextResponse.json({ received: true });
}
```

## Email Notification System

### Email Service Selection

**Option 1: Cloudflare Email Workers** (Recommended for free tier)
- Free tier: 100 emails/day
- Direct integration with Cloudflare
- Simple SMTP-like API

**Option 2: SendGrid**
- Free tier: 100 emails/day
- More features (templates, analytics)
- Requires separate account

### Email Templates

```typescript
// lib/email.ts

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function getTicketCreatedEmail(ticket: Ticket): EmailTemplate {
  return {
    subject: `New Support Ticket: ${ticket.title}`,
    html: `
      <h2>Support Ticket Created</h2>
      <p>Your support ticket has been created successfully.</p>
      <p><strong>Ticket ID:</strong> ${ticket.id}</p>
      <p><strong>Title:</strong> ${ticket.title}</p>
      <p><strong>Priority:</strong> ${ticket.priority}</p>
      <p><strong>Status:</strong> ${ticket.status}</p>
      <p>We'll respond to your ticket as soon as possible.</p>
      <p><a href="${process.env.APP_URL}/dashboard/tickets/${ticket.id}">View Ticket</a></p>
    `,
    text: `Support Ticket Created\n\nTicket ID: ${ticket.id}\nTitle: ${ticket.title}\nPriority: ${ticket.priority}\nStatus: ${ticket.status}\n\nView: ${process.env.APP_URL}/dashboard/tickets/${ticket.id}`,
  };
}

export function getInvoiceEmail(invoice: Invoice, pdfBuffer: Buffer): EmailTemplate {
  return {
    subject: `Invoice ${invoice.invoice_number} from Tech Support Computer Services`,
    html: `
      <h2>New Invoice</h2>
      <p>You have received a new invoice from Tech Support Computer Services.</p>
      <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
      <p><strong>Amount Due:</strong> $${invoice.total.toFixed(2)}</p>
      <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
      <p>Please find the invoice attached as a PDF.</p>
      <p><a href="${process.env.APP_URL}/dashboard/invoices/${invoice.id}">View Invoice & Pay Online</a></p>
    `,
    text: `New Invoice\n\nInvoice Number: ${invoice.invoice_number}\nAmount Due: $${invoice.total.toFixed(2)}\nDue Date: ${new Date(invoice.due_date).toLocaleDateString()}\n\nView: ${process.env.APP_URL}/dashboard/invoices/${invoice.id}`,
  };
}

export function getPaymentReceiptEmail(payment: Payment, invoice: Invoice): EmailTemplate {
  return {
    subject: `Payment Receipt - Invoice ${invoice.invoice_number}`,
    html: `
      <h2>Payment Received</h2>
      <p>Thank you for your payment!</p>
      <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
      <p><strong>Amount Paid:</strong> $${payment.amount.toFixed(2)}</p>
      <p><strong>Payment Date:</strong> ${new Date(payment.created_at).toLocaleDateString()}</p>
      <p><strong>Transaction ID:</strong> ${payment.paypal_transaction_id}</p>
      <p><a href="${process.env.APP_URL}/dashboard/invoices/${invoice.id}">View Invoice</a></p>
    `,
    text: `Payment Received\n\nInvoice Number: ${invoice.invoice_number}\nAmount Paid: $${payment.amount.toFixed(2)}\nPayment Date: ${new Date(payment.created_at).toLocaleDateString()}\nTransaction ID: ${payment.paypal_transaction_id}`,
  };
}

export async function sendEmail(
  env: Env,
  to: string,
  template: EmailTemplate,
  attachments?: Array<{ filename: string; content: Buffer }>
): Promise<void> {
  // Using SendGrid as example
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
      subject: template.subject,
      content: [
        { type: 'text/plain', value: template.text },
        { type: 'text/html', value: template.html },
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
    console.error('Email send failed:', await response.text());
    throw new AppError(500, 'Failed to send email', 'EMAIL_ERROR');
  }
}
```

## Performance Optimization

### Caching Strategy

1. **Static Assets**: Cached at edge indefinitely with cache busting
2. **API Responses**: Cache GET requests with appropriate TTL
3. **Database Queries**: Use prepared statements for query plan caching
4. **R2 Objects**: Leverage Cloudflare CDN for document downloads

```typescript
// lib/cache.ts

export function setCacheHeaders(
  response: Response,
  maxAge: number = 3600
): Response {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
  return response;
}

// Example usage in API route
export async function GET(request: NextRequest) {
  const data = await fetchData();
  const response = NextResponse.json(data);
  return setCacheHeaders(response, 300); // Cache for 5 minutes
}
```

### Database Optimization

1. **Indexes**: Created on all foreign keys and frequently queried columns
2. **Query Optimization**: Use JOINs instead of multiple queries
3. **Pagination**: Implement cursor-based pagination for large result sets
4. **Connection Pooling**: Handled automatically by D1

```typescript
// lib/pagination.ts

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export async function paginateQuery<T>(
  db: D1Database,
  baseQuery: string,
  countQuery: string,
  params: any[],
  page: number = 1,
  perPage: number = 20
): Promise<PaginatedResponse<T>> {
  const offset = (page - 1) * perPage;
  
  // Get total count
  const countResult = await db.prepare(countQuery).bind(...params).first<{ count: number }>();
  const total = countResult?.count || 0;
  
  // Get paginated data
  const query = `${baseQuery} LIMIT ? OFFSET ?`;
  const { results } = await db.prepare(query).bind(...params, perPage, offset).all<T>();
  
  return {
    data: results,
    pagination: {
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    },
  };
}
```

### Frontend Performance

1. **Code Splitting**: Automatic with Next.js App Router
2. **Image Optimization**: Use Next.js Image component
3. **Lazy Loading**: Load components on demand
4. **Bundle Size**: Monitor with `@next/bundle-analyzer`

```typescript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  images: {
    domains: ['cloudflare-r2-domain.com'],
  },
  experimental: {
    optimizeCss: true,
  },
});
```

## Deployment & DevOps

### Environment Configuration

```bash
# .env.local (development)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Cloudflare bindings (wrangler.toml)
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=xxx
GITHUB_TOKEN=ghp_xxx
SENDGRID_API_KEY=SG.xxx
APP_URL=https://portal.techsupportcs.com
```

### Deployment Steps

1. **Build Application**:
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Pages**:
   ```bash
   npx wrangler pages deploy .vercel/output/static --project-name=tech-support-portal
   ```

3. **Set Environment Variables** in Cloudflare Dashboard

4. **Initialize Database**:
   ```bash
   npx wrangler d1 execute tech-support-db --remote --file=./schema.sql
   ```

5. **Create R2 Bucket**:
   ```bash
   npx wrangler r2 bucket create tech-support-documents
   ```

6. **Configure Webhooks**:
   - Clerk: `https://portal.techsupportcs.com/api/webhooks/clerk`
   - PayPal: `https://portal.techsupportcs.com/api/webhooks/paypal`
   - GitHub: `https://portal.techsupportcs.com/api/webhooks/github`

### Monitoring & Logging

1. **Cloudflare Analytics**: Built-in traffic and performance metrics
2. **Application Logs**: Console logs visible in Cloudflare dashboard
3. **Error Tracking**: Optional Sentry integration
4. **Uptime Monitoring**: Use free service like UptimeRobot

```typescript
// lib/monitoring.ts

export function logError(error: Error, context?: Record<string, any>): void {
  console.error('Application error:', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
  
  // Optional: Send to Sentry or other error tracking service
  // Sentry.captureException(error, { extra: context });
}
```

### Backup Strategy

```typescript
// scripts/backup-database.ts

async function backupDatabase(env: Env): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const backupKey = `backups/database-${timestamp}.sql`;
  
  // Export database to SQL
  const tables = ['clients', 'users', 'projects', 'tickets', 'invoices', 'payments'];
  let sqlDump = '';
  
  for (const table of tables) {
    const { results } = await env.DB.prepare(`SELECT * FROM ${table}`).all();
    // Convert results to INSERT statements
    sqlDump += generateInsertStatements(table, results);
  }
  
  // Upload to R2
  await env.DOCUMENTS.put(backupKey, sqlDump);
  
  // Delete backups older than 30 days
  await cleanupOldBackups(env.DOCUMENTS);
}
```

## Cost Analysis

### Free Tier Limits

| Service | Free Tier | Expected Usage | Status |
|---------|-----------|----------------|--------|
| Cloudflare Pages | Unlimited requests, 500 builds/month | ~50 builds/month | ✅ Safe |
| Cloudflare D1 | 5GB storage, 5M reads/day | ~100MB, ~10K reads/day | ✅ Safe |
| Cloudflare R2 | 10GB storage, 1M Class A ops/month | ~2GB, ~5K ops/month | ✅ Safe |
| Clerk Auth | 10,000 MAU | ~50-200 users | ✅ Safe |
| SendGrid | 100 emails/day | ~20-50 emails/day | ✅ Safe |
| PayPal | No monthly fee, 2.9% + $0.30 per transaction | Variable | ✅ Pay per use |
| GitHub API | 5,000 requests/hour | ~100 requests/day | ✅ Safe |

### Estimated Monthly Costs

- **$0/month** for infrastructure (all free tiers)
- **~3% of revenue** for PayPal transaction fees
- **Total**: Effectively free until significant scale

### Scaling Considerations

When free tiers are exceeded:
- **D1**: $5/month for 50GB storage
- **R2**: $0.015/GB/month for storage over 10GB
- **Clerk**: $25/month for up to 100K MAU
- **SendGrid**: $15/month for 40K emails

The architecture supports scaling to 1000+ clients before paid tiers are needed.
