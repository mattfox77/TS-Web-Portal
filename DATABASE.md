## Database Setup Guide

This document explains how to set up and manage the Cloudflare D1 database for the Tech Support Client Portal.

## Overview

The application uses Cloudflare D1, a serverless SQLite database that runs on Cloudflare's edge network. D1 provides:

- **Free tier**: 5GB storage, 5M reads/day, 100K writes/day
- **Global distribution**: Data replicated across Cloudflare's network
- **Low latency**: Queries execute at the edge, close to users
- **SQL compatibility**: Standard SQLite syntax

## Database Schema

The database consists of 11 main tables:

1. **clients** - Client/company information
2. **users** - User accounts (linked to Clerk)
3. **service_packages** - Predefined service offerings
4. **subscriptions** - Client subscriptions to service packages
5. **projects** - Client projects
6. **tickets** - Support tickets
7. **ticket_comments** - Comments on tickets
8. **invoices** - Billing invoices
9. **invoice_items** - Line items for invoices
10. **payments** - Payment transactions
11. **documents** - File metadata (files stored in R2)
12. **api_usage** - API usage tracking for projects
13. **activity_log** - Audit trail of all actions

See `schema.sql` for the complete schema definition.

## Initial Setup

### 1. Create D1 Database

First, create your D1 database using Wrangler:

```bash
npx wrangler d1 create tech-support-db
```

This will output a database ID. Copy this ID and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "tech-support-db"
database_id = "your-database-id-here"  # Replace with actual ID
```

### 2. Initialize Schema

Run the schema file to create all tables and indexes:

```bash
# Local development database
npx wrangler d1 execute tech-support-db --local --file=./schema.sql

# Production database
npx wrangler d1 execute tech-support-db --remote --file=./schema.sql
```

Or use the provided script:

```bash
chmod +x scripts/init-db.sh
./scripts/init-db.sh
```

### 3. Seed Initial Data

Load the initial service packages:

```bash
# Local
npx wrangler d1 execute tech-support-db --local --file=./scripts/seed-data.sql

# Production
npx wrangler d1 execute tech-support-db --remote --file=./scripts/seed-data.sql
```

## Database Utilities

The `lib/db-utils.ts` file provides helper functions for common database operations:

### Query Functions

```typescript
import { queryAll, queryOne, execute } from "@/lib/db-utils";

// Get all results
const tickets = await queryAll(db, "SELECT * FROM tickets WHERE client_id = ?", [clientId]);

// Get single result
const user = await queryOne(db, "SELECT * FROM users WHERE id = ?", [userId]);

// Execute INSERT/UPDATE/DELETE
await execute(db, "UPDATE tickets SET status = ? WHERE id = ?", ["closed", ticketId]);
```

### Specialized Functions

```typescript
// Get user with client info
const userWithClient = await getUserWithClient(db, userId);

// Get tickets with filters
const openTickets = await getTickets(db, clientId, { status: "open" });

// Get invoice with line items
const invoice = await getInvoiceWithItems(db, invoiceId);

// Log activity
await logActivity(db, {
  user_id: userId,
  client_id: clientId,
  action: "ticket_created",
  entity_type: "ticket",
  entity_id: ticketId,
});
```

### Pagination

```typescript
import { paginate } from "@/lib/db-utils";

const result = await paginate(
  db,
  "SELECT * FROM tickets WHERE client_id = ?",
  "SELECT COUNT(*) as count FROM tickets WHERE client_id = ?",
  [clientId],
  { page: 1, limit: 20 }
);

console.log(result.data); // Array of tickets
console.log(result.pagination); // { page, limit, total, totalPages }
```

## Accessing the Database in API Routes

In Next.js API routes running on Cloudflare Workers, access the database through the `env` parameter:

```typescript
// app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { Env } from "@/types";

export const runtime = "edge";

export async function GET(request: NextRequest, { env }: { env: Env }) {
  const db = env.DB;
  
  // Use database
  const tickets = await queryAll(db, "SELECT * FROM tickets");
  
  return NextResponse.json({ tickets });
}
```

## Database Migrations

When you need to modify the schema:

### 1. Create Migration File

Create a new SQL file in `migrations/` directory:

```sql
-- migrations/001_add_ticket_tags.sql
ALTER TABLE tickets ADD COLUMN tags TEXT;
CREATE INDEX idx_tickets_tags ON tickets(tags);
```

### 2. Apply Migration

```bash
# Local
npx wrangler d1 execute tech-support-db --local --file=./migrations/001_add_ticket_tags.sql

# Production
npx wrangler d1 execute tech-support-db --remote --file=./migrations/001_add_ticket_tags.sql
```

## Querying the Database

### Using Wrangler CLI

```bash
# Local database
npx wrangler d1 execute tech-support-db --local --command="SELECT * FROM clients"

# Production database
npx wrangler d1 execute tech-support-db --remote --command="SELECT * FROM clients"
```

### Using D1 Console

Access the D1 console in your Cloudflare dashboard:

1. Go to Workers & Pages > D1
2. Select your database
3. Use the SQL console to run queries

## Backup and Restore

### Export Database

```bash
# Export local database
npx wrangler d1 export tech-support-db --local --output=backup.sql

# Export production database
npx wrangler d1 export tech-support-db --remote --output=backup.sql
```

### Restore Database

```bash
# Restore to local
npx wrangler d1 execute tech-support-db --local --file=backup.sql

# Restore to production
npx wrangler d1 execute tech-support-db --remote --file=backup.sql
```

## Performance Optimization

### Indexes

The schema includes indexes on frequently queried columns:

- Foreign keys (client_id, user_id, etc.)
- Status fields
- Date fields (created_at, issue_date, etc.)
- Lookup fields (email, invoice_number, etc.)

### Query Optimization Tips

1. **Use indexes**: Ensure WHERE clauses use indexed columns
2. **Limit results**: Use LIMIT for large result sets
3. **Avoid SELECT ***: Select only needed columns
4. **Use JOINs wisely**: Minimize the number of JOINs
5. **Batch operations**: Use `executeBatch()` for multiple queries

### Example: Optimized Query

```typescript
// ❌ Not optimized
const tickets = await queryAll(db, "SELECT * FROM tickets");

// ✅ Optimized
const tickets = await queryAll(
  db,
  `SELECT id, title, status, priority, created_at 
   FROM tickets 
   WHERE client_id = ? AND status IN ('open', 'in_progress')
   ORDER BY priority DESC, created_at DESC
   LIMIT 50`,
  [clientId]
);
```

## Monitoring

### Check Database Size

```bash
npx wrangler d1 info tech-support-db
```

### View Query Logs

Query logs are available in the Cloudflare dashboard under Workers & Pages > D1 > your database > Logs.

## Troubleshooting

### Connection Issues

If you can't connect to the database:

1. Verify database ID in `wrangler.toml` matches the created database
2. Ensure you're logged in to Wrangler: `npx wrangler login`
3. Check that the database exists: `npx wrangler d1 list`

### Schema Errors

If you get schema errors:

1. Drop and recreate the database (development only!)
2. Check for syntax errors in `schema.sql`
3. Ensure you're using SQLite-compatible SQL

### Performance Issues

If queries are slow:

1. Check that indexes exist: `PRAGMA index_list('table_name');`
2. Analyze query plans: `EXPLAIN QUERY PLAN SELECT ...`
3. Consider denormalizing frequently joined data
4. Use pagination for large result sets

## Best Practices

1. **Always use parameterized queries** to prevent SQL injection
2. **Log all data modifications** to the activity_log table
3. **Use transactions** for operations that modify multiple tables
4. **Implement soft deletes** for important data (add deleted_at column)
5. **Regular backups** - automate daily backups to R2
6. **Monitor usage** - stay within free tier limits or upgrade as needed

## Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
