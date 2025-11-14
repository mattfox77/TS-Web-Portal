# Database Backup Restoration Guide

This guide provides detailed procedures for restoring database backups for the Tech Support Client Portal.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Restoration Scenarios](#restoration-scenarios)
4. [Step-by-Step Restoration](#step-by-step-restoration)
5. [Verification Procedures](#verification-procedures)
6. [Rollback Procedures](#rollback-procedures)
7. [Testing Restoration](#testing-restoration)
8. [Troubleshooting](#troubleshooting)

## Overview

The backup system creates SQL dump files containing all database tables and data. These backups can be restored to recover from:
- Data corruption
- Accidental deletions
- Database migration issues
- Disaster recovery scenarios

**Important**: Restoration is a destructive operation. Always create a backup of the current state before restoring.

## Prerequisites

Before performing a restoration, ensure you have:

1. **Wrangler CLI** installed and authenticated
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Admin access** to Cloudflare account

3. **Backup file** identified and accessible

4. **Maintenance window** scheduled (restoration requires downtime)

5. **Stakeholder notification** sent to affected users

## Restoration Scenarios

### Scenario 1: Complete Database Restoration

**When to use**: Total data loss, database corruption, or major data integrity issues

**Impact**: All current data will be replaced with backup data

**Downtime**: 5-30 minutes depending on database size

### Scenario 2: Partial Data Restoration

**When to use**: Specific table corruption or accidental deletion of specific records

**Impact**: Only affected tables are restored

**Downtime**: 2-10 minutes

### Scenario 3: Point-in-Time Recovery

**When to use**: Need to restore to a specific date/time

**Impact**: All data after backup timestamp will be lost

**Downtime**: 5-30 minutes

## Step-by-Step Restoration

### Phase 1: Preparation

#### 1.1 Create Current State Backup

**Always backup current state before restoration:**

```bash
# Option A: Via API (if system is accessible)
curl -X POST https://your-domain.com/api/admin/backup \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"

# Option B: Via Wrangler
npx wrangler d1 export tech-support-db --remote --output=pre-restore-backup.sql
```

#### 1.2 Enable Maintenance Mode

**Put application in maintenance mode:**

1. Update environment variable:
   ```bash
   npx wrangler secret put MAINTENANCE_MODE --env production
   # Enter: "true"
   ```

2. Or deploy maintenance page to Cloudflare Pages

#### 1.3 Notify Users

Send notification to all users about the maintenance window:
- Expected downtime duration
- Reason for maintenance
- Expected completion time

#### 1.4 List Available Backups

```bash
# List all backups in R2
npx wrangler r2 object list tech-support-documents --prefix=backups/

# Or via API
curl https://your-domain.com/api/admin/backup \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

#### 1.5 Download Backup File

```bash
# Download the backup file you want to restore
npx wrangler r2 object get tech-support-documents/backups/database-2024-01-15-02-00-00.sql \
  --file=restore-backup.sql

# Verify file integrity
ls -lh restore-backup.sql
head -n 20 restore-backup.sql
```

### Phase 2: Database Restoration

#### 2.1 Clear Existing Data (Full Restore Only)

**For complete restoration, clear all existing data:**

```bash
# Create a script to drop all tables
cat > drop-tables.sql << 'EOF'
-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS api_usage;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS service_packages;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS clients;
EOF

# Execute drop script
npx wrangler d1 execute tech-support-db --remote --file=drop-tables.sql
```

#### 2.2 Recreate Schema

```bash
# Recreate tables from schema
npx wrangler d1 execute tech-support-db --remote --file=schema.sql
```

#### 2.3 Restore Data

```bash
# Import the backup data
npx wrangler d1 execute tech-support-db --remote --file=restore-backup.sql
```

**Note**: This may take several minutes depending on database size.

#### 2.4 Monitor Restoration Progress

```bash
# Watch the restoration process
npx wrangler d1 execute tech-support-db --remote --command="SELECT COUNT(*) as count FROM clients"
npx wrangler d1 execute tech-support-db --remote --command="SELECT COUNT(*) as count FROM tickets"
npx wrangler d1 execute tech-support-db --remote --command="SELECT COUNT(*) as count FROM invoices"
```

### Phase 3: Verification

#### 3.1 Verify Table Counts

```bash
# Check record counts for all tables
cat > verify-counts.sql << 'EOF'
SELECT 'clients' as table_name, COUNT(*) as count FROM clients
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;
EOF

npx wrangler d1 execute tech-support-db --remote --file=verify-counts.sql
```

#### 3.2 Verify Data Integrity

```bash
# Check for orphaned records
cat > verify-integrity.sql << 'EOF'
-- Check for users without clients
SELECT COUNT(*) as orphaned_users 
FROM users 
WHERE client_id NOT IN (SELECT id FROM clients);

-- Check for tickets without clients
SELECT COUNT(*) as orphaned_tickets 
FROM tickets 
WHERE client_id NOT IN (SELECT id FROM clients);

-- Check for invoices without clients
SELECT COUNT(*) as orphaned_invoices 
FROM invoices 
WHERE client_id NOT IN (SELECT id FROM clients);
EOF

npx wrangler d1 execute tech-support-db --remote --file=verify-integrity.sql
```

#### 3.3 Verify Recent Records

```bash
# Check most recent records
npx wrangler d1 execute tech-support-db --remote --command="
  SELECT 'Latest Client' as type, name, created_at 
  FROM clients 
  ORDER BY created_at DESC 
  LIMIT 1
"

npx wrangler d1 execute tech-support-db --remote --command="
  SELECT 'Latest Ticket' as type, title, created_at 
  FROM tickets 
  ORDER BY created_at DESC 
  LIMIT 1
"
```

#### 3.4 Test Application Access

1. Disable maintenance mode:
   ```bash
   npx wrangler secret put MAINTENANCE_MODE --env production
   # Enter: "false"
   ```

2. Test critical functionality:
   - User login
   - Dashboard access
   - Ticket viewing
   - Invoice viewing
   - Document access

### Phase 4: Post-Restoration

#### 4.1 Log Restoration Event

```bash
# Log the restoration to activity log
cat > log-restoration.sql << 'EOF'
INSERT INTO activity_log (id, action, entity_type, details, created_at)
VALUES (
  lower(hex(randomblob(16))),
  'database_restored',
  'backup',
  '{"backup_file": "database-2024-01-15-02-00-00.sql", "restored_at": "2024-01-15T10:30:00Z"}',
  datetime('now')
);
EOF

npx wrangler d1 execute tech-support-db --remote --file=log-restoration.sql
```

#### 4.2 Notify Users

Send notification that maintenance is complete:
- System is back online
- Any data loss (if applicable)
- Next steps for users

#### 4.3 Monitor System

Monitor the application for 24-48 hours:
- Check error logs
- Monitor user activity
- Verify all features working
- Watch for data inconsistencies

## Verification Procedures

### Automated Verification Script

Create a comprehensive verification script:

```bash
#!/bin/bash
# verify-restoration.sh

echo "=== Database Restoration Verification ==="
echo ""

echo "1. Checking table counts..."
npx wrangler d1 execute tech-support-db --remote --command="
  SELECT 'clients' as table_name, COUNT(*) as count FROM clients
  UNION ALL SELECT 'users', COUNT(*) FROM users
  UNION ALL SELECT 'tickets', COUNT(*) FROM tickets
  UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
"

echo ""
echo "2. Checking data integrity..."
npx wrangler d1 execute tech-support-db --remote --command="
  SELECT COUNT(*) as orphaned_users 
  FROM users 
  WHERE client_id NOT IN (SELECT id FROM clients)
"

echo ""
echo "3. Checking latest records..."
npx wrangler d1 execute tech-support-db --remote --command="
  SELECT created_at FROM clients ORDER BY created_at DESC LIMIT 1
"

echo ""
echo "=== Verification Complete ==="
```

### Manual Verification Checklist

- [ ] All tables exist and have expected record counts
- [ ] No orphaned records (foreign key integrity)
- [ ] Latest records match expected backup timestamp
- [ ] User authentication works
- [ ] Dashboard loads correctly
- [ ] Tickets are accessible
- [ ] Invoices display properly
- [ ] Documents can be downloaded
- [ ] Admin functions work
- [ ] No error logs showing data issues

## Rollback Procedures

If restoration fails or causes issues:

### Option 1: Restore Pre-Restoration Backup

```bash
# Restore the backup created before restoration
npx wrangler d1 execute tech-support-db --remote --file=pre-restore-backup.sql
```

### Option 2: Restore from Previous Backup

```bash
# Download and restore a different backup
npx wrangler r2 object get tech-support-documents/backups/database-2024-01-14-02-00-00.sql \
  --file=rollback-backup.sql

npx wrangler d1 execute tech-support-db --remote --file=rollback-backup.sql
```

## Testing Restoration

### Quarterly Restoration Test

**Perform quarterly restoration tests to ensure backup system works:**

#### Test Procedure

1. **Create test database**:
   ```bash
   npx wrangler d1 create tech-support-db-test
   ```

2. **Download latest backup**:
   ```bash
   npx wrangler r2 object get tech-support-documents/backups/database-latest.sql \
     --file=test-restore.sql
   ```

3. **Restore to test database**:
   ```bash
   npx wrangler d1 execute tech-support-db-test --remote --file=schema.sql
   npx wrangler d1 execute tech-support-db-test --remote --file=test-restore.sql
   ```

4. **Verify restoration**:
   ```bash
   npx wrangler d1 execute tech-support-db-test --remote --command="
     SELECT COUNT(*) FROM clients
   "
   ```

5. **Document results**:
   - Restoration time
   - Any errors encountered
   - Data integrity verification results
   - Lessons learned

6. **Clean up**:
   ```bash
   npx wrangler d1 delete tech-support-db-test
   ```

#### Test Documentation Template

```markdown
# Restoration Test Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Backup File**: database-YYYY-MM-DD-HH-MM-SS.sql
**Test Database**: tech-support-db-test

## Test Results

- [ ] Backup downloaded successfully
- [ ] Schema created without errors
- [ ] Data restored without errors
- [ ] Record counts match expectations
- [ ] Data integrity verified
- [ ] No orphaned records found

## Metrics

- Backup file size: X MB
- Restoration time: X minutes
- Total records restored: X

## Issues Encountered

[List any issues]

## Recommendations

[Any improvements to backup/restore process]

## Sign-off

Tested by: [Name]
Date: [Date]
Status: ✅ PASS / ❌ FAIL
```

## Troubleshooting

### Issue: Restoration Fails with Foreign Key Constraint Error

**Cause**: Data being restored in wrong order

**Solution**:
```bash
# Disable foreign key checks during restore
cat > restore-with-fk-disabled.sql << 'EOF'
PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;
-- [paste backup data here]
COMMIT;
PRAGMA foreign_keys = ON;
EOF

npx wrangler d1 execute tech-support-db --remote --file=restore-with-fk-disabled.sql
```

### Issue: Restoration Takes Too Long

**Cause**: Large database or slow connection

**Solution**:
- Split backup into smaller chunks
- Restore during off-peak hours
- Use batch inserts instead of individual inserts

### Issue: Backup File Corrupted

**Cause**: Incomplete download or storage issue

**Solution**:
```bash
# Verify file integrity
file restore-backup.sql
head -n 50 restore-backup.sql
tail -n 50 restore-backup.sql

# Re-download backup
npx wrangler r2 object get tech-support-documents/backups/[backup-file] \
  --file=restore-backup.sql
```

### Issue: Missing Tables After Restoration

**Cause**: Schema not created or backup incomplete

**Solution**:
```bash
# Recreate schema first
npx wrangler d1 execute tech-support-db --remote --file=schema.sql

# Then restore data
npx wrangler d1 execute tech-support-db --remote --file=restore-backup.sql
```

### Issue: Data Inconsistencies After Restoration

**Cause**: Backup from wrong time period or partial backup

**Solution**:
1. Verify backup timestamp matches expected date
2. Check backup file for completeness
3. Restore from a different backup
4. Contact support if issue persists

## Emergency Contact Information

**In case of critical restoration issues:**

- **Primary Contact**: [Admin Name] - [Email] - [Phone]
- **Secondary Contact**: [Backup Admin] - [Email] - [Phone]
- **Cloudflare Support**: https://dash.cloudflare.com/support

## Best Practices

1. **Always backup before restore**: Create a pre-restoration backup
2. **Test in staging first**: If possible, test restoration in a staging environment
3. **Schedule during off-hours**: Minimize user impact
4. **Communicate clearly**: Keep stakeholders informed
5. **Document everything**: Record all steps and outcomes
6. **Verify thoroughly**: Don't skip verification steps
7. **Monitor post-restore**: Watch for issues in the 24-48 hours after restoration

## Related Documentation

- [BACKUP_SETUP.md](./BACKUP_SETUP.md) - Backup system configuration
- [DATABASE.md](./DATABASE.md) - Database schema and management
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-15 | 1.0 | Initial documentation | System |

---

**Last Updated**: 2024-01-15
**Next Review**: 2024-04-15 (Quarterly)
