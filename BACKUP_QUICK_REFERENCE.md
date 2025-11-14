# Backup System - Quick Reference Card

## 🚀 Quick Commands

### Trigger Manual Backup
```bash
curl -X POST https://your-domain.com/api/admin/backup \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### List All Backups
```bash
curl https://your-domain.com/api/admin/backup \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### Download Backup
```bash
npx wrangler r2 object get tech-support-documents/backups/database-YYYY-MM-DD-HH-MM-SS.sql \
  --file=backup.sql
```

### Restore Backup
```bash
npx wrangler d1 execute tech-support-db --remote --file=backup.sql
```

### Run Quarterly Test
```bash
./scripts/test-restoration.sh
```

### Cleanup Old Backups
```bash
curl -X DELETE https://your-domain.com/api/admin/backup \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

## 📅 Schedule

| Event | Frequency | Time |
|-------|-----------|------|
| Automated Backup | Daily | 2:00 AM UTC |
| Backup Cleanup | Daily | After backup |
| Restoration Test | Quarterly | 15th of Jan/Apr/Jul/Oct |
| Test Reminder | Quarterly | 8th of Jan/Apr/Jul/Oct |

## 📊 Monitoring

### Check Recent Backups
```sql
SELECT * FROM activity_log 
WHERE action LIKE '%backup%'
ORDER BY created_at DESC 
LIMIT 10;
```

### Verify Latest Backup
```bash
npx wrangler r2 object list tech-support-documents --prefix=backups/ | tail -n 5
```

### Check Cron Status
Cloudflare Dashboard → Workers & Pages → Project → Triggers

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backup not running | Check cron trigger in Cloudflare Dashboard |
| Backup fails | Check R2 storage quota and DB connectivity |
| Restoration fails | Verify backup file integrity, check foreign keys |
| Old backups not deleted | Verify R2 permissions, check cleanup logs |

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [BACKUP_SETUP.md](./BACKUP_SETUP.md) | Setup and configuration |
| [BACKUP_RESTORATION.md](./BACKUP_RESTORATION.md) | Restoration procedures |
| [BACKUP_TESTING_SCHEDULE.md](./BACKUP_TESTING_SCHEDULE.md) | Testing schedule |
| [BACKUP_SYSTEM_README.md](./BACKUP_SYSTEM_README.md) | System overview |

## 🎯 Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Backup Success Rate | 99%+ | Monitor |
| Backup Size | < 100 MB | ~1-5 MB |
| Restoration Time | < 30 min | ~10-15 min |
| Storage Usage | < 150 MB | ~30-150 MB |

## 🔐 Security

- ✅ Admin-only access
- ✅ Encrypted at rest (AES-256)
- ✅ Encrypted in transit (TLS 1.3)
- ✅ Audit logging enabled
- ✅ CRON_SECRET protection

## 📞 Emergency Contacts

**Primary Admin**: [Name] - [Email] - [Phone]
**Cloudflare Support**: https://dash.cloudflare.com/support

## ⚡ Emergency Restoration

```bash
# 1. Download latest backup
npx wrangler r2 object list tech-support-documents --prefix=backups/ | tail -n 1
npx wrangler r2 object get tech-support-documents/backups/[LATEST] --file=emergency.sql

# 2. Create pre-restore backup
npx wrangler d1 export tech-support-db --remote --output=pre-restore.sql

# 3. Restore
npx wrangler d1 execute tech-support-db --remote --file=emergency.sql

# 4. Verify
npx wrangler d1 execute tech-support-db --remote --command="SELECT COUNT(*) FROM clients"
```

## 📋 Quarterly Test Checklist

- [ ] Run `./scripts/test-restoration.sh`
- [ ] Review test report
- [ ] Update test schedule
- [ ] Document any issues
- [ ] Schedule next test

---

**Last Updated**: 2024-01-15
**Version**: 1.0
