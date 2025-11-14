# Production Database and Storage Setup

This guide covers setting up Cloudflare D1 database and R2 storage for production deployment.

## Table of Contents

1. [D1 Database Setup](#d1-database-setup)
2. [R2 Storage Setup](#r2-storage-setup)
3. [Binding Resources](#binding-resources)
4. [Initial Data Setup](#initial-data-setup)
5. [Admin User Creation](#admin-user-creation)
6. [Verification](#verification)
7. [Maintenance](#maintenance)

---

## D1 Database Setup

### Prerequisites

- Wrangler CLI installed: `npm install -g wrangler`
- Logged in to Cloudflare: `wrangler login`
- `schema.sql` file in project root

### Quick Setup (Automated)

Run the automated setup script:

```bash
./scripts/init-production.sh
```

This script will:
1. Create production D1 database
2. Initialize schema
3. Seed initial data
4. Create R2 bucket
5. Configure bucket settings

### Manual Setup

#### Step 1: Create Database

```bash
# Create production database
wrangler d1 create tech-support-db-production
```

Expected output:
```
✅ Successfully created DB 'tech-support-db-production'

[[d1_databases]]
binding = "DB"
database_name = "tech-support-db-production"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Important**: Copy the `database_id` for the next step.

#### Step 2: Update wrangler.toml

Update the production environment configuration:

```toml
[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "tech-support-db-production"
database_id = "paste-your-actual-database-id-here"
```

#### Step 3: Initialize Schema

```bash
# Run schema on production database
wrangler d1 execute tech-support-db-production \
  --remote \
  --file=./schema.sql
```

Expected output:
```
🌀 Executing on remote database tech-support-db-production:
✅ Executed 50 commands in 1.234s
```

#### Step 4: Verify Tables

```bash
# List all tables
wrangler d1 execute tech-support-db-production \
  --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

Expected tables:
- `activity_log`
- `api_usage`
- `clients`
- `documents`
- `invoice_items`
- `invoices`
- `payments`
- `projects`
- `service_packages`
- `subscriptions`
- `ticket_comments`
- `tickets`
- `users`

### Database Management Commands

```bash
# List all databases
wrangler d1 list

# Get database info
wrangler d1 info tech-support-db-production

# Execute SQL command
wrangler d1 execute tech-support-db-production \
  --remote \
  --command "SELECT COUNT(*) FROM clients"

# Execute SQL file
wrangler d1 execute tech-support-db-production \
  --remote \
  --file=./path/to/file.sql

# Export database (backup)
wrangler d1 export tech-support-db-production \
  --remote \
  --output=backup.sql

# Delete database (DANGEROUS!)
wrangler d1 delete tech-support-db-production
```

---

## R2 Storage Setup

### Quick Setup (Automated)

The `init-production.sh` script also sets up R2 storage.

### Manual Setup

#### Step 1: Create Bucket

```bash
# Create production bucket
wrangler r2 bucket create tech-support-documents-production
```

Expected output:
```
✅ Created bucket 'tech-support-documents-production'
```

#### Step 2: Configure CORS

Create CORS configuration file:

```bash
cat > r2-cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://portal.yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF
```

Apply CORS configuration:

```bash
wrangler r2 bucket cors put tech-support-documents-production \
  --file=r2-cors.json
```

#### Step 3: Configure Lifecycle Rules

Create lifecycle configuration:

```bash
cat > r2-lifecycle.json << 'EOF'
{
  "Rules": [
    {
      "Id": "DeleteOldBackups",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "backups/"
      },
      "Expiration": {
        "Days": 30
      }
    }
  ]
}
EOF
```

Apply lifecycle rules:

```bash
wrangler r2 bucket lifecycle put tech-support-documents-production \
  --file=r2-lifecycle.json
```

#### Step 4: Verify Bucket

```bash
# List buckets
wrangler r2 bucket list

# Test upload
echo "test" > test.txt
wrangler r2 object put tech-support-documents-production/test.txt \
  --file=test.txt

# Test download
wrangler r2 object get tech-support-documents-production/test.txt

# Clean up
wrangler r2 object delete tech-support-documents-production/test.txt
rm test.txt
```

### R2 Management Commands

```bash
# List buckets
wrangler r2 bucket list

# Get bucket info
wrangler r2 bucket info tech-support-documents-production

# List objects in bucket
wrangler r2 object list tech-support-documents-production

# List objects with prefix
wrangler r2 object list tech-support-documents-production \
  --prefix=backups/

# Upload object
wrangler r2 object put tech-support-documents-production/path/to/file.txt \
  --file=local-file.txt

# Download object
wrangler r2 object get tech-support-documents-production/path/to/file.txt \
  --file=downloaded-file.txt

# Delete object
wrangler r2 object delete tech-support-documents-production/path/to/file.txt

# Get CORS configuration
wrangler r2 bucket cors get tech-support-documents-production

# Get lifecycle rules
wrangler r2 bucket lifecycle get tech-support-documents-production

# Delete bucket (DANGEROUS!)
wrangler r2 bucket delete tech-support-documents-production
```

---

## Binding Resources

### Bind to Pages Project

#### Via Cloudflare Dashboard

1. Go to **Workers & Pages** → Select `tech-support-client-portal`
2. Click **Settings** → **Functions**

**D1 Database Binding**:
3. Scroll to **D1 database bindings**
4. Click **Add binding**
5. Configure:
   - **Variable name**: `DB`
   - **D1 database**: Select `tech-support-db-production`
6. Click **Save**

**R2 Bucket Binding**:
7. Scroll to **R2 bucket bindings**
8. Click **Add binding**
9. Configure:
   - **Variable name**: `DOCUMENTS`
   - **R2 bucket**: Select `tech-support-documents-production`
10. Click **Save**

#### Via wrangler.toml

Bindings are already configured in `wrangler.toml`:

```toml
[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "tech-support-db-production"
database_id = "your-database-id"

[[env.production.r2_buckets]]
binding = "DOCUMENTS"
bucket_name = "tech-support-documents-production"
```

These bindings are automatically applied when deploying with Wrangler.

### Verify Bindings

After deployment, check that bindings are working:

```bash
# Stream logs and look for binding errors
wrangler pages deployment tail --project-name=tech-support-client-portal

# Test database connection via API
curl https://portal.yourdomain.com/api/health

# Test file upload via UI
# Navigate to Documents page and try uploading a file
```

---

## Initial Data Setup

### Seed Service Packages

Create or update `scripts/seed-data.sql`:

```sql
-- Service Packages
INSERT INTO service_packages (id, name, description, price_monthly, price_annual, features, is_active)
VALUES 
  (
    lower(hex(randomblob(16))),
    'Basic Support',
    'Essential IT support for small businesses',
    99.00,
    990.00,
    '["Email support", "Remote assistance", "Monthly check-in", "Basic monitoring"]',
    1
  ),
  (
    lower(hex(randomblob(16))),
    'Professional Support',
    'Comprehensive IT support with priority response',
    199.00,
    1990.00,
    '["24/7 phone support", "Priority response", "Weekly check-ins", "Advanced monitoring", "Quarterly reviews"]',
    1
  ),
  (
    lower(hex(randomblob(16))),
    'Enterprise Support',
    'Full-service IT management for growing businesses',
    499.00,
    4990.00,
    '["Dedicated account manager", "24/7 emergency support", "Daily monitoring", "Monthly reports", "Strategic planning", "Unlimited tickets"]',
    1
  );
```

Run the seed script:

```bash
wrangler d1 execute tech-support-db-production \
  --remote \
  --file=./scripts/seed-data.sql
```

### Verify Seeded Data

```bash
# Check service packages
wrangler d1 execute tech-support-db-production \
  --remote \
  --command "SELECT id, name, price_monthly FROM service_packages"
```

---

## Admin User Creation

### Prerequisites

1. Create a user in Clerk dashboard first
2. Copy the Clerk User ID (starts with `user_`)
3. Run the admin user creation script

### Create Admin User

#### Automated Method

```bash
./scripts/create-admin-user.sh
```

The script will prompt for:
- Clerk User ID
- Email address
- First name
- Last name

#### Manual Method

```bash
# Generate UUIDs
CLIENT_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
USER_ID="user_xxxxx"  # From Clerk dashboard
EMAIL="admin@yourdomain.com"
FIRST_NAME="Admin"
LAST_NAME="User"

# Create admin client
wrangler d1 execute tech-support-db-production --remote --command \
  "INSERT INTO clients (id, name, email, company_name, status) 
   VALUES ('$CLIENT_ID', 'Admin', '$EMAIL', 'Tech Support Computer Services', 'active')"

# Create admin user
wrangler d1 execute tech-support-db-production --remote --command \
  "INSERT INTO users (id, client_id, email, first_name, last_name, role) 
   VALUES ('$USER_ID', '$CLIENT_ID', '$EMAIL', '$FIRST_NAME', '$LAST_NAME', 'admin')"
```

### Verify Admin User

```bash
# Check admin user
wrangler d1 execute tech-support-db-production --remote --command \
  "SELECT u.id, u.email, u.role, c.name as client_name 
   FROM users u 
   JOIN clients c ON u.client_id = c.id 
   WHERE u.role = 'admin'"
```

### Test Admin Access

1. Log in to the portal with the Clerk user
2. Navigate to `/admin`
3. Verify access to admin dashboard
4. Test admin functions:
   - View all clients
   - Create invoices
   - View usage reports

---

## Verification

### Database Verification Checklist

- [ ] Database created successfully
- [ ] Schema initialized (all tables exist)
- [ ] Indexes created
- [ ] Service packages seeded
- [ ] Admin user created
- [ ] Database bound to Pages project

### R2 Verification Checklist

- [ ] Bucket created successfully
- [ ] CORS configured
- [ ] Lifecycle rules configured
- [ ] Test upload successful
- [ ] Test download successful
- [ ] Bucket bound to Pages project

### Verification Commands

```bash
# Check database size
wrangler d1 execute tech-support-db-production --remote --command \
  "SELECT page_count * page_size as size_bytes FROM pragma_page_count(), pragma_page_size()"

# Count records in each table
wrangler d1 execute tech-support-db-production --remote --command \
  "SELECT 
    (SELECT COUNT(*) FROM clients) as clients,
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM service_packages) as packages,
    (SELECT COUNT(*) FROM projects) as projects,
    (SELECT COUNT(*) FROM tickets) as tickets"

# Check R2 bucket size
wrangler r2 bucket info tech-support-documents-production

# List recent objects
wrangler r2 object list tech-support-documents-production --limit=10
```

---

## Maintenance

### Database Maintenance

#### Regular Maintenance Tasks

```bash
# Optimize database (run monthly)
wrangler d1 execute tech-support-db-production --remote --command "VACUUM"

# Update statistics (run weekly)
wrangler d1 execute tech-support-db-production --remote --command "ANALYZE"

# Check database integrity
wrangler d1 execute tech-support-db-production --remote --command "PRAGMA integrity_check"
```

#### Backup Database

```bash
# Manual backup
wrangler d1 export tech-support-db-production \
  --remote \
  --output=backup-$(date +%Y%m%d).sql

# Automated backup (via cron trigger)
# See scripts/backup-database.ts
```

#### Restore Database

```bash
# Restore from backup
wrangler d1 execute tech-support-db-production \
  --remote \
  --file=backup-20240101.sql
```

### R2 Maintenance

#### Clean Up Old Files

```bash
# List old backups
wrangler r2 object list tech-support-documents-production \
  --prefix=backups/ \
  | grep "2023"

# Delete specific backup
wrangler r2 object delete tech-support-documents-production/backups/old-backup.sql
```

#### Monitor Storage Usage

```bash
# Check bucket size
wrangler r2 bucket info tech-support-documents-production

# List largest objects
wrangler r2 object list tech-support-documents-production \
  | sort -k2 -n -r \
  | head -20
```

### Monitoring Queries

```bash
# Active users
wrangler d1 execute tech-support-db-production --remote --command \
  "SELECT COUNT(*) as active_users FROM users WHERE role = 'user'"

# Open tickets
wrangler d1 execute tech-support-db-production --remote --command \
  "SELECT COUNT(*) as open_tickets FROM tickets WHERE status IN ('open', 'in_progress')"

# Unpaid invoices
wrangler d1 execute tech-support-db-production --remote --command \
  "SELECT COUNT(*) as unpaid_invoices, SUM(total) as total_amount 
   FROM invoices WHERE status IN ('sent', 'overdue')"

# Recent activity
wrangler d1 execute tech-support-db-production --remote --command \
  "SELECT action, COUNT(*) as count 
   FROM activity_log 
   WHERE created_at > datetime('now', '-7 days') 
   GROUP BY action 
   ORDER BY count DESC 
   LIMIT 10"
```

---

## Troubleshooting

### Database Issues

**Issue**: "Database not found"
```bash
# List databases to verify name
wrangler d1 list

# Check wrangler.toml configuration
cat wrangler.toml | grep -A 3 "d1_databases"
```

**Issue**: "Table already exists"
```bash
# Drop and recreate table
wrangler d1 execute tech-support-db-production --remote --command \
  "DROP TABLE IF EXISTS table_name"

# Re-run schema
wrangler d1 execute tech-support-db-production --remote --file=./schema.sql
```

**Issue**: "Database locked"
```bash
# Wait a moment and retry
# D1 has automatic retry logic for locks
```

### R2 Issues

**Issue**: "Bucket not found"
```bash
# List buckets to verify name
wrangler r2 bucket list

# Check wrangler.toml configuration
cat wrangler.toml | grep -A 2 "r2_buckets"
```

**Issue**: "Access denied"
```bash
# Verify authentication
wrangler whoami

# Re-login if needed
wrangler login
```

**Issue**: "CORS error in browser"
```bash
# Check CORS configuration
wrangler r2 bucket cors get tech-support-documents-production

# Reapply CORS if needed
wrangler r2 bucket cors put tech-support-documents-production --file=r2-cors.json
```

---

## Best Practices

1. **Always backup** before making schema changes
2. **Test in development** before running on production
3. **Use transactions** for multi-step operations
4. **Monitor database size** to stay within free tier limits
5. **Clean up old data** regularly
6. **Document schema changes** in migration files
7. **Use indexes** for frequently queried columns
8. **Avoid large transactions** (D1 has limits)
9. **Set up automated backups** via cron triggers
10. **Monitor R2 storage** to avoid unexpected costs

---

## Free Tier Limits

### D1 Database
- **Storage**: 5 GB
- **Reads**: 5 million per day
- **Writes**: 100,000 per day

### R2 Storage
- **Storage**: 10 GB
- **Class A operations**: 1 million per month (PUT, LIST)
- **Class B operations**: 10 million per month (GET, HEAD)

### Monitoring Usage

Check usage in Cloudflare dashboard:
1. Go to **Workers & Pages**
2. Select your project
3. Click **Analytics**
4. View D1 and R2 usage metrics

---

## Support Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler)
- [Community Forum](https://community.cloudflare.com)

---

## Next Steps

After completing database and storage setup:

1. ✅ Set environment variables
2. ✅ Deploy application
3. ✅ Configure webhooks
4. ✅ Test all functionality
5. ✅ Set up monitoring
6. ✅ Document any customizations
