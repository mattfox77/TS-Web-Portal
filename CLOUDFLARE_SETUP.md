# Cloudflare Pages Setup Guide

This guide provides step-by-step instructions for configuring Cloudflare Pages deployment for the Tech Support Client Portal.

## Quick Start

If you're setting up for the first time, follow these steps in order:

1. [Connect GitHub Repository](#1-connect-github-repository)
2. [Configure Build Settings](#2-configure-build-settings)
3. [Set Up D1 Database](#3-set-up-d1-database)
4. [Set Up R2 Storage](#4-set-up-r2-storage)
5. [Configure Environment Variables](#5-configure-environment-variables)
6. [Deploy Application](#6-deploy-application)

---

## 1. Connect GitHub Repository

### Via Cloudflare Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click **Create application** → **Pages** → **Connect to Git**
4. Click **Connect GitHub**
5. Authorize Cloudflare to access your GitHub account
6. Select the repository: `tech-support-client-portal`
7. Click **Begin setup**

### Via Wrangler CLI (Alternative)

```bash
# Login to Cloudflare
wrangler login

# Create Pages project
wrangler pages project create tech-support-client-portal \
  --production-branch=main
```

---

## 2. Configure Build Settings

### Build Configuration

Set these values in the Cloudflare Pages setup:

```yaml
Production branch: main
Build command: npm run pages:build
Build output directory: .vercel/output/static
Root directory: (leave empty)
```

### Build Environment

```yaml
Node version: 18
```

### Advanced Build Settings (Optional)

Enable these for better performance:

- **Build caching**: Enabled
- **Build watch paths**: `src/**, app/**, components/**, lib/**`
- **Ignore build command**: (leave empty)

### Build Command Explanation

The `npm run pages:build` command runs:
```bash
npx @cloudflare/next-on-pages
```

This command:
1. Builds the Next.js application
2. Optimizes for Cloudflare Workers runtime
3. Generates static assets and edge functions
4. Outputs to `.vercel/output/static`

---

## 3. Set Up D1 Database

### Create Database

```bash
# Create production database
wrangler d1 create tech-support-db-production

# Output will show:
# ✅ Successfully created DB 'tech-support-db-production'
# 
# [[d1_databases]]
# binding = "DB"
# database_name = "tech-support-db-production"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Important**: Copy the `database_id` for the next step.

### Update wrangler.toml

Update the production environment in `wrangler.toml`:

```toml
[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "tech-support-db-production"
database_id = "your-actual-database-id-here"  # Replace with actual ID
```

### Initialize Schema

```bash
# Run schema on production database
wrangler d1 execute tech-support-db-production \
  --remote \
  --file=./schema.sql
```

Expected output:
```
🌀 Executing on remote database tech-support-db-production:
🌀 To execute on your local development database, pass the --local flag to 'wrangler d1 execute'
✅ Executed 50 commands in 1.234s
```

### Seed Initial Data

```bash
# Seed service packages and initial data
wrangler d1 execute tech-support-db-production \
  --remote \
  --file=./scripts/seed-data.sql
```

### Bind to Pages Project

#### Via Dashboard:

1. Go to **Workers & Pages** → Select `tech-support-client-portal`
2. Click **Settings** → **Functions**
3. Scroll to **D1 database bindings**
4. Click **Add binding**
5. Configure:
   - **Variable name**: `DB`
   - **D1 database**: Select `tech-support-db-production`
6. Click **Save**

#### Via wrangler.toml (Already configured):

The binding is already defined in `wrangler.toml` and will be applied automatically.

### Verify Database

```bash
# Test database connection
wrangler d1 execute tech-support-db-production \
  --remote \
  --command "SELECT COUNT(*) as count FROM clients"

# List all tables
wrangler d1 execute tech-support-db-production \
  --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table'"
```

---

## 4. Set Up R2 Storage

### Create R2 Bucket

```bash
# Create production bucket for document storage
wrangler r2 bucket create tech-support-documents-production
```

Expected output:
```
✅ Created bucket 'tech-support-documents-production'
```

### Configure CORS (Optional)

If you need direct browser uploads:

```bash
# Create CORS configuration
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

# Apply CORS configuration
wrangler r2 bucket cors put tech-support-documents-production \
  --file=r2-cors.json
```

### Set Up Lifecycle Rules

Automatically delete old backups after 30 days:

```bash
# Create lifecycle configuration
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

# Apply lifecycle rules
wrangler r2 bucket lifecycle put tech-support-documents-production \
  --file=r2-lifecycle.json
```

### Bind to Pages Project

#### Via Dashboard:

1. Go to **Workers & Pages** → Select `tech-support-client-portal`
2. Click **Settings** → **Functions**
3. Scroll to **R2 bucket bindings**
4. Click **Add binding**
5. Configure:
   - **Variable name**: `DOCUMENTS`
   - **R2 bucket**: Select `tech-support-documents-production`
6. Click **Save**

#### Via wrangler.toml (Already configured):

The binding is already defined in `wrangler.toml` and will be applied automatically.

### Verify R2 Bucket

```bash
# List buckets
wrangler r2 bucket list

# Test upload
echo "test" > test.txt
wrangler r2 object put tech-support-documents-production/test.txt \
  --file=test.txt

# Test download
wrangler r2 object get tech-support-documents-production/test.txt

# Clean up test file
wrangler r2 object delete tech-support-documents-production/test.txt
rm test.txt
```

---

## 5. Configure Environment Variables

### Required Environment Variables

Add these in **Workers & Pages** → **Settings** → **Environment variables**:

#### Authentication (Clerk)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**How to get Clerk credentials:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your production application
3. Go to **API Keys**
4. Copy the publishable key and secret key

#### PayPal Integration

```bash
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_client_secret
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=your_webhook_id
```

**How to get PayPal credentials:**
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
2. Navigate to **Apps & Credentials**
3. Switch to **Live** mode
4. Create or select your app
5. Copy Client ID and Secret

#### GitHub Integration

```bash
GITHUB_TOKEN=ghp_xxxxx
```

**How to create GitHub token:**
1. Go to GitHub **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Select scopes: `repo` (for private repos) or `public_repo` (for public repos)
4. Generate and copy the token

#### Email Service (SendGrid)

```bash
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**How to get SendGrid API key:**
1. Go to [SendGrid Dashboard](https://app.sendgrid.com)
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Select **Full Access** or **Restricted Access** with Mail Send permissions
5. Copy the API key

#### Application Configuration

```bash
NEXT_PUBLIC_APP_URL=https://portal.yourdomain.com
```

### How to Add Variables via Dashboard

1. Go to **Workers & Pages** → Select `tech-support-client-portal`
2. Click **Settings** → **Environment variables**
3. Select **Production** environment
4. Click **Add variable**
5. Enter **Variable name** and **Value**
6. Click **Save**
7. Repeat for all variables
8. Click **Deploy** to apply changes

### How to Add Variables via Wrangler

```bash
# Add a single variable
wrangler pages secret put CLERK_SECRET_KEY \
  --project-name=tech-support-client-portal

# You'll be prompted to enter the value

# Add multiple variables from file
cat > .env.production << 'EOF'
CLERK_SECRET_KEY=sk_live_xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
SENDGRID_API_KEY=SG.xxxxx
GITHUB_TOKEN=ghp_xxxxx
EOF

# Upload secrets (requires manual entry for each)
while IFS='=' read -r key value; do
  echo "$value" | wrangler pages secret put "$key" \
    --project-name=tech-support-client-portal
done < .env.production

# Clean up
rm .env.production
```

### Environment Variable Checklist

Use this checklist to ensure all variables are set:

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- [ ] `PAYPAL_CLIENT_ID`
- [ ] `PAYPAL_CLIENT_SECRET`
- [ ] `PAYPAL_MODE`
- [ ] `PAYPAL_WEBHOOK_ID`
- [ ] `GITHUB_TOKEN`
- [ ] `SENDGRID_API_KEY`
- [ ] `SENDGRID_FROM_EMAIL`
- [ ] `NEXT_PUBLIC_APP_URL`

---

## 6. Deploy Application

### Deploy via Dashboard

1. Go to **Workers & Pages** → Select `tech-support-client-portal`
2. Click **Deployments**
3. Click **Create deployment**
4. Select branch: `main`
5. Click **Deploy**

### Deploy via Wrangler CLI

```bash
# Build the application
npm run pages:build

# Deploy to production
wrangler pages deploy .vercel/output/static \
  --project-name=tech-support-client-portal \
  --branch=main
```

### Deploy via GitHub Actions

Push to the `main` branch to trigger automatic deployment:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

The GitHub Actions workflow will:
1. Run tests
2. Build the application
3. Deploy to Cloudflare Pages
4. Report status

### Verify Deployment

After deployment completes:

1. **Check deployment status**:
   ```bash
   wrangler pages deployment list \
     --project-name=tech-support-client-portal
   ```

2. **Visit the site**:
   - Default URL: `https://tech-support-client-portal.pages.dev`
   - Custom domain: `https://portal.yourdomain.com`

3. **Test critical flows**:
   - User registration and login
   - Dashboard loads correctly
   - API endpoints respond
   - Database queries work
   - File uploads work

4. **Check logs**:
   ```bash
   wrangler pages deployment tail \
     --project-name=tech-support-client-portal
   ```

---

## Custom Domain Setup

### Add Custom Domain

1. Go to **Workers & Pages** → Select `tech-support-client-portal`
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain: `portal.yourdomain.com`
5. Click **Continue**

### Configure DNS

#### If domain is on Cloudflare:

DNS records will be added automatically. Wait 1-5 minutes for SSL provisioning.

#### If domain is elsewhere:

Add this CNAME record to your DNS provider:

```
Type: CNAME
Name: portal
Value: tech-support-client-portal.pages.dev
TTL: Auto or 3600
```

Wait up to 48 hours for DNS propagation.

### Verify SSL Certificate

1. Go to **Custom domains** in your Pages project
2. Check that SSL status shows **Active**
3. Visit `https://portal.yourdomain.com` to verify

### Update Environment Variables

After custom domain is active:

1. Update `NEXT_PUBLIC_APP_URL` to `https://portal.yourdomain.com`
2. Redeploy the application
3. Update webhook URLs in external services

---

## Troubleshooting

### Build Fails

**Error**: "Module not found"
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run pages:build
```

**Error**: "Build timeout"
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run pages:build
```

### Database Connection Fails

**Error**: "Binding DB not found"

1. Verify binding in Cloudflare dashboard
2. Check `wrangler.toml` configuration
3. Redeploy the application

**Error**: "Table does not exist"
```bash
# Re-run schema
wrangler d1 execute tech-support-db-production \
  --remote \
  --file=./schema.sql
```

### R2 Upload Fails

**Error**: "Bucket not found"

1. Verify bucket exists:
   ```bash
   wrangler r2 bucket list
   ```
2. Check binding in Cloudflare dashboard
3. Verify bucket name in `wrangler.toml`

### Environment Variables Not Working

1. Verify variables are set in **Production** environment
2. Check variable names match exactly (case-sensitive)
3. Redeploy after adding/changing variables
4. Clear browser cache and test again

---

## Monitoring Setup

### Enable Cloudflare Analytics

Analytics are enabled by default. View them at:
**Workers & Pages** → Select project → **Analytics**

### Set Up Log Streaming

```bash
# Stream real-time logs
wrangler pages deployment tail \
  --project-name=tech-support-client-portal
```

### Configure Alerts (Optional)

1. Go to **Notifications** in Cloudflare dashboard
2. Click **Add**
3. Select **Pages** → **Deployment Failed**
4. Add email or webhook destination
5. Click **Save**

---

## Maintenance Commands

### View Deployments

```bash
# List recent deployments
wrangler pages deployment list \
  --project-name=tech-support-client-portal

# Get deployment details
wrangler pages deployment info <deployment-id>
```

### Rollback Deployment

```bash
# Via CLI
wrangler pages deployment rollback <deployment-id>

# Via Dashboard
# Go to Deployments → Select deployment → Rollback
```

### Database Maintenance

```bash
# Check database size
wrangler d1 execute tech-support-db-production \
  --remote \
  --command "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"

# Optimize database
wrangler d1 execute tech-support-db-production \
  --remote \
  --command "VACUUM; ANALYZE;"
```

### R2 Maintenance

```bash
# List objects
wrangler r2 object list tech-support-documents-production

# Check bucket size
wrangler r2 bucket info tech-support-documents-production
```

---

## Security Best Practices

1. **Never commit secrets** to Git
2. **Use environment variables** for all sensitive data
3. **Rotate credentials** regularly (every 90 days)
4. **Enable 2FA** on Cloudflare account
5. **Restrict API tokens** to minimum required permissions
6. **Monitor access logs** regularly
7. **Keep dependencies updated** with `npm audit`

---

## Support Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler)
- [Community Forum](https://community.cloudflare.com)

---

## Next Steps

After completing this setup:

1. ✅ Configure webhooks (see DEPLOYMENT.md)
2. ✅ Set up monitoring and alerts
3. ✅ Test all critical user flows
4. ✅ Create admin user account
5. ✅ Document any custom configurations
6. ✅ Train team on deployment process
