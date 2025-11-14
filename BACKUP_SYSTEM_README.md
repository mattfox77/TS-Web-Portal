# Backup and Recovery System

Complete documentation for the Tech Support Client Portal backup and recovery system.

## Overview

The backup system provides automated daily backups of the Cloudflare D1 database with secure storage in R2, automatic cleanup of old backups, and comprehensive restoration procedures.

### Key Features

- ✅ **Automated Daily Backups** - Runs at 2:00 AM UTC via Cloudflare Cron
- ✅ **Manual Backup Triggers** - Admin API endpoint for on-demand backups
- ✅ **Automatic Cleanup** - Removes backups older than 30 days
- ✅ **Secure Storage** - Encrypted storage in Cloudflare R2
- ✅ **Comprehensive Logging** - All operations logged to activity_log
- ✅ **Quarterly Testing** - Scheduled restoration tests to verify system
- ✅ **Detailed Documentation** - Complete setup and restoration guides

## Quick Start

### Trigger Manual Backup

```bash
# Via API (requires admin authentication)
curl -X POST https://your-domain.com/api/admin/backup \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### List Available Backups

```bash
# Via API
curl https://your-domain.com/api/admin/backup \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"

# Via Wrangler CLI
npx wrangler r2 object list tech-support-documents --prefix=backups/
```

### Restore from Backup

```bash
# 1. Download backup
npx wrangler r2 object get tech-support-documents/backups/database-2024-01-15-02-00-00.sql \
  --file=backup.sql

# 2. Restore to database
npx wrangler d1 execute tech-support-db --remote --file=backup.sql
```

### Run Quarterly Test

```bash
# Automated test
./scripts/test-restoration.sh

# Or specify backup file
./scripts/test-restoration.sh database-2024-01-15-02-00-00.sql
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Cron Trigger (Daily 2 AM)           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              GET /api/cron/backup                           │
│              - Verifies authorization                       │
│              - Calls backupDatabase()                       │
│              - Calls cleanupOldBackups()                    │
│              - Logs to activity_log                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              scripts/backup-database.ts                     │
│              - Exports all 13 tables to SQL                 │
│              - Generates INSERT statements                  │
│              - Uploads to R2 with metadata                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare R2 Storage                          │
│              backups/database-YYYY-MM-DD-HH-MM-SS.sql       │
│              - 30-day retention                             │
│              - Encrypted at rest                            │
│              - Metadata tracking                            │
└─────────────────────────────────────────────────────────────┘
```

## Documentation

### Setup and Configuration

📘 **[BACKUP_SETUP.md](./BACKUP_SETUP.md)**
- Complete setup instructions
- Cron trigger configuration
- Environment variables
- Testing procedures
- Monitoring and alerts
- Troubleshooting guide

### Restoration Procedures

📗 **[BACKUP_RESTORATION.md](./BACKUP_RESTORATION.md)**
- Step-by-step restoration guide
- Multiple restoration scenarios
- Verification procedures
- Rollback procedures
- Emergency procedures
- Troubleshooting

### Testing Schedule

📙 **[BACKUP_TESTING_SCHEDULE.md](./BACKUP_TESTING_SCHEDULE.md)**
- Quarterly test schedule
- Test procedures
- Test report template
- Metrics tracking
- Escalation procedures

## File Structure

```
.
├── scripts/
│   ├── backup-database.ts          # Core backup logic
│   ├── test-restoration.sh         # Automated test script
│   └── send-test-reminder.sh       # Quarterly reminder script
│
├── app/api/
│   ├── admin/backup/route.ts       # Manual backup API
│   └── cron/backup/route.ts        # Scheduled backup API
│
├── functions/
│   └── scheduled.ts                # Cloudflare cron handler
│
├── docs/
│   └── backup-tests/               # Test reports archive
│       ├── README.md
│       ├── test-report-template.md
│       └── YYYY-QX-backup-test.md
│
├── BACKUP_SETUP.md                 # Setup guide
├── BACKUP_RESTORATION.md           # Restoration guide
├── BACKUP_TESTING_SCHEDULE.md      # Testing schedule
└── BACKUP_SYSTEM_README.md         # This file
```

## API Endpoints

### POST /api/admin/backup

Triggers a manual database backup (admin only).

**Request:**
```bash
POST /api/admin/backup
Authorization: Bearer <clerk-token>
```

**Response:**
```json
{
  "success": true,
  "backup": {
    "key": "backups/database-2024-01-15-14-30-00.sql",
    "timestamp": "2024-01-15T14:30:00.000Z",
    "size": 1048576,
    "size_kb": "1024.00",
    "tables": ["clients", "users", "projects", ...]
  }
}
```

### GET /api/admin/backup

Lists all available backups (admin only).

**Request:**
```bash
GET /api/admin/backup
Authorization: Bearer <clerk-token>
```

**Response:**
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

### DELETE /api/admin/backup

Cleans up old backups (older than 30 days, admin only).

**Request:**
```bash
DELETE /api/admin/backup
Authorization: Bearer <clerk-token>
```

**Response:**
```json
{
  "success": true,
  "deleted_count": 5
}
```

### GET /api/cron/backup

Scheduled backup endpoint (called by Cloudflare Cron).

**Request:**
```bash
GET /api/cron/backup
Authorization: Bearer <cron-secret>
```

**Response:**
```json
{
  "success": true,
  "backup": {
    "key": "backups/database-2024-01-15-02-00-00.sql",
    "timestamp": "2024-01-15T02:00:00.000Z",
    "size": 1048576,
    "size_kb": "1024.00",
    "tables": ["clients", "users", ...]
  },
  "cleanup": {
    "deleted_count": 2
  }
}
```

## Backup Schedule

### Automated Backups

- **Frequency**: Daily
- **Time**: 2:00 AM UTC
- **Retention**: 30 days
- **Storage**: Cloudflare R2 (`tech-support-documents/backups/`)

### Backup Testing

- **Frequency**: Quarterly
- **Schedule**: 
  - Q1: January 15
  - Q2: April 15
  - Q3: July 15
  - Q4: October 15

## Monitoring

### Check Backup Status

```sql
-- View recent backup operations
SELECT * FROM activity_log 
WHERE action IN (
  'scheduled_backup_completed',
  'scheduled_backup_failed',
  'database_backup_created'
)
ORDER BY created_at DESC 
LIMIT 10;
```

### Verify Latest Backup

```bash
# List backups sorted by date
npx wrangler r2 object list tech-support-documents \
  --prefix=backups/ \
  | sort -r \
  | head -n 5
```

### Check Cron Status

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages → Your Project
3. Click "Triggers" tab
4. Verify cron schedule is active

## Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Complete database loss | 30 minutes | 24 hours |
| Partial data corruption | 15 minutes | 24 hours |
| Accidental deletion | 10 minutes | 24 hours |

**RTO** (Recovery Time Objective): Maximum acceptable downtime
**RPO** (Recovery Point Objective): Maximum acceptable data loss

## Security

### Access Control

- Backup creation: Admin users only
- Backup listing: Admin users only
- Backup restoration: Admin users with database access
- Cron endpoint: Protected by secret token

### Data Protection

- Backups stored in private R2 bucket
- Encrypted at rest (AES-256)
- Encrypted in transit (TLS 1.3)
- Access logged to activity_log

### Audit Trail

All backup operations are logged:
- Scheduled backups
- Manual backups
- Backup failures
- Cleanup operations
- Restoration tests

## Cost Analysis

### Cloudflare R2 Free Tier

- **Storage**: 10 GB (free)
- **Class A Operations**: 1M/month (writes)
- **Class B Operations**: 10M/month (reads)

### Estimated Usage

- **Daily backup**: ~1-5 MB
- **30-day retention**: ~30-150 MB
- **Monthly operations**: ~60 (30 writes + 30 deletes)

**Conclusion**: Well within free tier limits.

## Troubleshooting

### Backup Not Running

1. Check cron trigger configuration
2. Verify environment bindings (DB, DOCUMENTS)
3. Check Cloudflare Workers logs
4. Verify CRON_SECRET is set

### Backup Fails

1. Check R2 storage quota
2. Verify database connectivity
3. Review error logs in activity_log
4. Check for schema changes

### Restoration Fails

1. Verify backup file integrity
2. Check foreign key constraints
3. Ensure schema is created first
4. Review [BACKUP_RESTORATION.md](./BACKUP_RESTORATION.md) troubleshooting

## Support

### Documentation

- [BACKUP_SETUP.md](./BACKUP_SETUP.md) - Setup guide
- [BACKUP_RESTORATION.md](./BACKUP_RESTORATION.md) - Restoration guide
- [BACKUP_TESTING_SCHEDULE.md](./BACKUP_TESTING_SCHEDULE.md) - Testing schedule

### External Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)

### Contact

- **Primary Admin**: [Name] - [Email]
- **Cloudflare Support**: https://dash.cloudflare.com/support

## Best Practices

1. ✅ Test restoration quarterly
2. ✅ Monitor backup logs regularly
3. ✅ Verify backup file sizes
4. ✅ Keep documentation updated
5. ✅ Review and update retention policy annually
6. ✅ Maintain off-site backup copies for critical data
7. ✅ Document all restoration attempts
8. ✅ Train team members on restoration procedures

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2024-01-15 | 1.0 | Initial backup system implementation |

---

**Last Updated**: 2024-01-15
**System Version**: 1.0
**Maintained By**: Tech Support Computer Services Admin Team
