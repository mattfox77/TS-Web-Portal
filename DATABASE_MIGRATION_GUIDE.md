# Database Migration Guide: Cloudflare D1 → Vercel Postgres

## Overview

This guide will help you migrate from Cloudflare D1 (SQLite) to Vercel Postgres (PostgreSQL).

## Prerequisites

✅ Vercel Postgres database created  
✅ Environment variables automatically added by Vercel

## Step 1: Install Postgres Client

```bash
npm install @vercel/postgres
```

## Step 2: Run the Schema Migration

Once you've created the Vercel Postgres database, run this command to create the tables:

```bash
npx vercel env pull .env.local
```

This will download your environment variables including the Postgres connection string.

Then, connect to your database and run the schema:

### Option A: Using Vercel Dashboard (Easiest)

1. Go to https://vercel.com/matt-foxs-projects/ts-web-portal/stores
2. Click on your Postgres database
3. Click the **Query** tab
4. Copy the entire contents of `schema-postgres.sql`
5. Paste into the query editor
6. Click **Run Query**

### Option B: Using psql Command Line

```bash
# Get your connection string from Vercel dashboard
# It looks like: postgres://user:pass@host/database

psql "YOUR_POSTGRES_URL" < schema-postgres.sql
```

### Option C: Using Node.js Script

Create a file `scripts/migrate-schema.js`:

```javascript
const { sql } = require('@vercel/postgres');
const fs = require('fs');

async function migrateSchema() {
  try {
    const schema = fs.readFileSync('schema-postgres.sql', 'utf8');
    await sql.query(schema);
    console.log('✅ Schema migrated successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateSchema();
```

Run it:
```bash
node scripts/migrate-schema.js
```

## Step 3: Update Database Code

Now we need to update your code to use Postgres instead of D1. The main changes are:

### Key Differences: D1 vs Postgres

| Feature | D1 (SQLite) | Vercel Postgres |
|---------|-------------|-----------------|
| Import | `@cloudflare/next-on-pages` | `@vercel/postgres` |
| Connection | `env.DB` | `sql` from `@vercel/postgres` |
| Query syntax | `.prepare().bind().first()` | `sql\`SELECT...\`` |
| Timestamps | TEXT | TIMESTAMP |
| Booleans | INTEGER (0/1) | BOOLEAN |
| JSON | TEXT | JSONB |
| Decimals | REAL | DECIMAL |

### Example Code Changes

**Before (D1):**
```typescript
import { getRequestContext } from '@cloudflare/next-on-pages';

const { env } = getRequestContext();
const user = await env.DB
  .prepare('SELECT * FROM users WHERE id = ?')
  .bind(userId)
  .first();
```

**After (Postgres):**
```typescript
import { sql } from '@vercel/postgres';

const result = await sql`
  SELECT * FROM users WHERE id = ${userId}
`;
const user = result.rows[0];
```

## Step 4: Update lib/auth.ts

This is the most critical file. Let me create the updated version:



## Step 5: Run the Migration Script

Now that you've created the Vercel Postgres database, let's migrate the schema:

```bash
# Pull environment variables from Vercel
npx vercel env pull .env.local

# Run the migration script
node scripts/migrate-schema.js
```

You should see output like:
```
🚀 Starting database schema migration...
📄 Schema file loaded
📊 Creating tables and indexes...

✅ Created: clients
✅ Created: users
✅ Created: service_packages
...
✅ Created: idx_activity_log_entity

📊 Migration Summary:
   ✅ Successful: 45
   ❌ Errors: 0

🎉 Schema migration completed successfully!
```

## Step 6: Verify the Migration

1. Go to Vercel dashboard: https://vercel.com/matt-foxs-projects/ts-web-portal/stores
2. Click on your Postgres database
3. Click the **Data** tab
4. You should see all your tables listed

## Step 7: Update API Routes

Now we need to update all API routes that use the database. Here's a quick reference:

### Files that need updating:

1. ✅ `lib/auth.ts` - **DONE** (already updated)
2. `app/dashboard/layout.tsx` - Update impersonation query
3. All files in `app/api/` that use database queries

### Quick Find & Replace Guide:

**Find this pattern:**
```typescript
const { env } = getRequestContext();
const result = await env.DB
  .prepare('SELECT * FROM table WHERE id = ?')
  .bind(value)
  .first();
```

**Replace with:**
```typescript
import { sql } from '@vercel/postgres';

const result = await sql`
  SELECT * FROM table WHERE id = ${value}
`;
const data = result.rows[0]; // for single row
// or
const data = result.rows; // for multiple rows
```

## Step 8: Update Dashboard Layout

The dashboard layout still uses Cloudflare's getRequestContext. Let's fix it:

**File**: `app/dashboard/layout.tsx`

**Find:**
```typescript
const { env } = getRequestContext();
const user = await env.DB
  .prepare('SELECT email, first_name, last_name FROM users WHERE id = ?')
  .bind(impersonatingUserId)
  .first<{...}>();
```

**Replace with:**
```typescript
import { sql } from '@vercel/postgres';

const result = await sql`
  SELECT email, first_name, last_name 
  FROM users 
  WHERE id = ${impersonatingUserId}
`;
const user = result.rows[0];
```

## Step 9: Test the Application

After updating the code:

1. **Commit your changes:**
```bash
git add .
git commit -m "Migrate to Vercel Postgres"
git push
```

2. **Deploy to Vercel:**
```bash
npx vercel --prod
```

3. **Test these features:**
   - [ ] Sign in with Clerk
   - [ ] Access dashboard
   - [ ] Create a test ticket
   - [ ] View projects
   - [ ] Check invoices

## Common Issues & Solutions

### Issue: "relation does not exist"
**Solution**: The table wasn't created. Run the migration script again.

### Issue: "column does not exist"
**Solution**: Check if you're using the correct column names (Postgres is case-sensitive).

### Issue: "syntax error near $1"
**Solution**: Make sure you're using template literals with `sql\`...\`` not regular strings.

### Issue: "Cannot find module '@vercel/postgres'"
**Solution**: Run `npm install @vercel/postgres`

## Data Migration (Optional)

If you have existing data in Cloudflare D1 that you want to migrate:

1. **Export from D1:**
```bash
wrangler d1 export tech-support-db-production --output=data-export.sql
```

2. **Convert SQLite to Postgres format:**
   - Change `INTEGER` to `BOOLEAN` for boolean fields
   - Change `TEXT` timestamps to `TIMESTAMP`
   - Update `REAL` to `DECIMAL`

3. **Import to Postgres:**
```bash
psql "$POSTGRES_URL" < data-export-converted.sql
```

## Rollback Plan

If something goes wrong, you can always:

1. Keep your Cloudflare D1 database running
2. Revert the code changes
3. Redeploy the previous version

## Performance Tips

1. **Use connection pooling** - Vercel Postgres automatically handles this
2. **Add indexes** - Already included in the schema
3. **Use prepared statements** - The `sql` template tag does this automatically
4. **Monitor queries** - Check the Vercel dashboard for slow queries

## Next Steps After Migration

1. ✅ Database migrated to Postgres
2. ⚠️ File storage still needs migration (R2 → Vercel Blob)
3. ⚠️ Update all API routes
4. ⚠️ Test thoroughly
5. ⚠️ Monitor for errors

## Need Help?

If you encounter issues:
1. Check Vercel logs: `npx vercel logs`
2. Check Postgres logs in Vercel dashboard
3. Test queries in the Vercel SQL editor
4. Ask for help!

---

**Ready to proceed?** Run the migration script and let me know if you see any errors!
