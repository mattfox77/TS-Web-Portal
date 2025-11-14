# Database Backup Setup Guide

This guide explains how to configure and use the automated database backup system for the Tech Support Client Portal.

## Overview

The backup system provides:
- **Automated daily backups** at 2:00 AM UTC via Cloudflare Cron Triggers
- **Manual backup triggers** via admin API endpoint
- **Automatic cleanup** of backups older than 30 days
- **Secure storage** in Cloudflare R2 with metadata

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Cron Trigger                  │
│                    (Daily at 2:00 AM UTC)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              GET /api/cron/backup (Edge Function)           │
│              - Verifies cron authorization                  │
│              - Calls backupDatabase()                       │
│              - Calls cleanupOldBackups()                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              scripts/backup-database.ts                     │
│              - Exports all tables to SQL                    │
│              - Uploads to R2 with timestamp                 │
│              - Returns backup metadata                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare R2 Storage                          │
│              backups/database-YYYY-MM-DD-HH-MM-SS.sql       │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Configure Cron Trigger

The cron trigger is already configured in `wrangler.toml`:

```toml
[triggers]
crons = ["0 2 * * *"]  # Daily at 2:00 AM UTC
```

To change the schedule, modify the cron expression:
- `0 2 * * *` - Daily at 2:00 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 3 1 * *` - Monthly on the 1st at 3:00 AM

### 2. Set Cron Secret (Optional but Recommended)

To secure the cron endpoint, set a secret token:

```bash
# For development
npx wrangler secret put CRON_SECRET --env development

# For production
npx wrangler secret put CRON_SECRET --env production
```

When prompted, enter a strong random token (e.g., generated with `openssl rand -hex 32`).

### 3. Deploy to Cloudflare Pages

```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy .vercel/output/static --project-name=tech-support-portal

# The cron trigger will be automatically configured
```

### 4. Verify Cron Trigger

After deployment, verify the cron trigger is active:

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages → Your Project
3. Click on "Triggers" tab
4. Verify the cron schedule is listed

### 5. Test the Backup System

#### Test Manual Backup (via API)

```bash
# Login as admin user and get auth token
# Then make a POST request to trigger backup

curl -X POST https://your-domain.com/api/admin/backup \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

#### Test Scheduled Backup (via Cron Endpoint)

```bash
# Test the cron endpoint directly
curl https://your-domain.com/api/cron/backup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### List All Backups

```bash
# Login as admin and list backups
curl https://your-domain.com/api/admin/backup \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

## Backup File Format

Backups are stored in R2 with the following naming convention:

```
backups/database-YYYY-MM-DD-HH-MM-SS.sql
```

Example: `backups/database-2024-01-15-02-00-00.sql`

Each backup file contains:
- SQL header with backup metadata
- `PRAGMA` statements for import optimization
- `INSERT` statements for all tables in dependency order
- Transaction wrapper for atomic restore

## Backup Retention Policy

- **Retention Period**: 30 days
- **Cleanup Frequency**: Daily (after each backup)
- **Storage Location**: Cloudflare R2 bucket under `backups/` prefix

Old backups are automatically deleted during each scheduled backup run.

## Manual Operations

### Trigger Manual Backup

Admins can trigger backups manually from the admin dashboard or via API:

**Via Admin Dashboard:**
1. Login as admin
2. Navigate to Admin → Backups
3. Click "Create Backup Now"

**Via API:**
```bash
POST /api/admin/backup
Authorization: Bearer <clerk-token>
```

### List Available Backups

```bash
GET /api/admin/backup
Authorization: Bearer <clerk-token>
```

Response:
```json
{
  "backups": [
    {
      "key": "backups/database-2024-01-15-02-00-00.sql",
      "uploaded": "2024-01-15T02:00:05.123Z",
      "size": 1048576,
      "size_kb": "1024.00",
      "size_mb": "1.00",
      "metadata": {
        "backup-timestamp": "2024-01-15T02:00:00.000Z",
        "backup-size": "1048576",
        "tables-count": "13"
      }
    }
  ],
  "total": 1
}
```

### Cleanup Old Backups

```bash
DELETE /api/admin/backup
Authorization: Bearer <clerk-token>
```

Response:
```json
{
  "success": true,
  "deleted_count": 5
}
```

## Restoration Procedures

See [BACKUP_RESTORATION.md](./BACKUP_RESTORATION.md) for detailed restoration procedures.

Quick restore:

```bash
# 1. Download backup from R2
npx wrangler r2 object get tech-support-documents/backups/database-YYYY-MM-DD-HH-MM-SS.sql --file=backup.sql

# 2. Restore to database
npx wrangler d1 execute tech-support-db --remote --file=backup.sql
```

## Monitoring

### Check Backup Status

Monitor backup operations through:

1. **Activity Log**: All backup operations are logged to the `activity_log` table
   ```sql
   SELECT * FROM activity_log 
   WHERE action IN ('scheduled_backup_completed', 'scheduled_backup_failed', 'database_backup_created')
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

2. **Cloudflare Logs**: View cron execution logs in Cloudflare Dashboard
   - Workers & Pages → Your Project → Logs

3. **R2 Storage**: Check backup files in R2 bucket
   ```bash
   npx wrangler r2 object list tech-support-documents --prefix=backups/
   ```

### Backup Alerts

To receive alerts for backup failures:

1. Set up Cloudflare Workers Analytics
2. Configure email notifications for failed cron triggers
3. Monitor the `activity_log` table for `scheduled_backup_failed` entries

## Troubleshooting

### Backup Not Running

**Check cron trigger configuration:**
```bash
npx wrangler pages deployment list --project-name=tech-support-portal
```

**Verify cron is enabled:**
- Go to Cloudflare Dashboard → Workers & Pages → Triggers
- Ensure cron schedule is listed and active

### Backup Fails

**Check logs:**
```bash
npx wrangler pages deployment tail --project-name=tech-support-portal
```

**Common issues:**
- Insufficient R2 storage quota
- Database connection timeout
- Missing environment bindings

### Cleanup Not Working

**Verify R2 permissions:**
- Ensure the R2 bucket binding has delete permissions
- Check that old backups exist: `npx wrangler r2 object list tech-support-documents --prefix=backups/`

## Security Considerations

1. **Access Control**: Only admin users can trigger manual backups
2. **Cron Secret**: Use `CRON_SECRET` environment variable to protect cron endpoint
3. **R2 Permissions**: Backup files are private by default
4. **Audit Trail**: All backup operations are logged to `activity_log`

## Cost Considerations

**Cloudflare R2 Free Tier:**
- 10 GB storage
- 1 million Class A operations per month (writes)
- 10 million Class B operations per month (reads)

**Estimated Usage:**
- Daily backup: ~1-5 MB per backup
- 30 days retention: ~30-150 MB total
- Monthly operations: ~30 writes + ~30 deletes = 60 operations

**Conclusion**: Well within free tier limits for small to medium deployments.

## Best Practices

1. **Test Restores**: Regularly test backup restoration (quarterly recommended)
2. **Monitor Storage**: Keep an eye on R2 storage usage
3. **Verify Backups**: Check that backups are being created successfully
4. **Document Changes**: Update this guide when making changes to backup system
5. **Off-site Copy**: Consider downloading critical backups to local storage

## Related Documentation

- [BACKUP_RESTORATION.md](./BACKUP_RESTORATION.md) - Detailed restoration procedures
- [DATABASE.md](./DATABASE.md) - Database schema and management
- [Cloudflare Cron Triggers Documentation](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
