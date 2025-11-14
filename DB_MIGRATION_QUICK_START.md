# Database Migration - Quick Start

## What You Need To Do Right Now

### 1. Create Vercel Postgres Database (5 minutes)

1. Go to: https://vercel.com/matt-foxs-projects/ts-web-portal
2. Click **Storage** tab
3. Click **Create Database** → **Postgres**
4. Name: `tech-support-db`
5. Region: `iad1` (US East - same as your deployment)
6. Click **Create**

✅ Vercel will automatically add environment variables to your project

### 2. Pull Environment Variables (1 minute)

```bash
npx vercel env pull .env.local
```

This downloads your Postgres connection string.

### 3. Run Migration Script (2 minutes)

```bash
node scripts/migrate-schema.js
```

You should see:
```
🎉 Schema migration completed successfully!
```

### 4. Verify in Dashboard (1 minute)

1. Go back to Vercel dashboard
2. Click on your Postgres database
3. Click **Data** tab
4. Verify you see tables: `clients`, `users`, `tickets`, etc.

### 5. Deploy Updated Code (3 minutes)

```bash
# Commit changes
git add .
git commit -m "Migrate to Vercel Postgres"

# Deploy
npx vercel --prod
```

## What's Already Done ✅

- ✅ `@vercel/postgres` package installed
- ✅ `lib/auth.ts` updated to use Postgres
- ✅ `schema-postgres.sql` created
- ✅ Migration script created

## What Still Needs Work ⚠️

After the migration, these files need updating:

1. `app/dashboard/layout.tsx` - Impersonation query
2. All API routes in `app/api/` - Database queries
3. Admin pages in `app/admin/` - Database queries

**Don't worry!** I'll help you update these after the migration is complete.

## Quick Test

After deploying, test:
1. Visit https://techsupportcomputerservices.com
2. Sign in with Clerk
3. Access dashboard

If you see errors, check:
```bash
npx vercel logs
```

## Estimated Time

- **Database creation**: 5 minutes
- **Schema migration**: 2 minutes  
- **Code deployment**: 3 minutes
- **Total**: ~10 minutes

## Need Help?

If you get stuck at any step, just let me know which step and what error you're seeing!

---

**Start with Step 1** - Create the Vercel Postgres database, then come back here!
