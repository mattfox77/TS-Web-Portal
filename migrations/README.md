# Database Migrations

This directory contains database migration files for schema changes.

## Naming Convention

Migrations should be named with a sequential number and descriptive name:

```
001_initial_schema.sql
002_add_ticket_tags.sql
003_add_user_preferences.sql
```

## Creating a Migration

1. Create a new SQL file in this directory
2. Write your ALTER TABLE or other schema modification statements
3. Test locally first:
   ```bash
   npx wrangler d1 execute tech-support-db --local --file=./migrations/YOUR_FILE.sql
   ```
4. Apply to production:
   ```bash
   npx wrangler d1 execute tech-support-db --remote --file=./migrations/YOUR_FILE.sql
   ```

## Migration Best Practices

- **Always test locally first** before applying to production
- **Make migrations reversible** when possible (keep a rollback script)
- **One migration per logical change** (don't combine unrelated changes)
- **Document breaking changes** in the migration file comments
- **Backup before major migrations** using `wrangler d1 export`

## Example Migration

```sql
-- migrations/002_add_ticket_tags.sql
-- Add tags column to tickets table for better categorization

-- Add column
ALTER TABLE tickets ADD COLUMN tags TEXT;

-- Add index for searching
CREATE INDEX IF NOT EXISTS idx_tickets_tags ON tickets(tags);

-- Update existing tickets with default empty array
UPDATE tickets SET tags = '[]' WHERE tags IS NULL;
```

## Rollback Example

```sql
-- migrations/002_add_ticket_tags_rollback.sql
-- Rollback for migration 002

DROP INDEX IF EXISTS idx_tickets_tags;
ALTER TABLE tickets DROP COLUMN tags;
```

Note: SQLite has limited ALTER TABLE support. Some changes may require:
1. Creating a new table with the desired schema
2. Copying data from the old table
3. Dropping the old table
4. Renaming the new table
