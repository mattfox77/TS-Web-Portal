# Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

All Clerk code has been restored and the app is ready to deploy!

- ✅ Clerk authentication restored
- ✅ Build tested successfully
- ✅ Vercel CLI available

## Step-by-Step Deployment

### Step 1: Login to Vercel

Run this command and follow the prompts:

```bash
npx vercel login
```

You'll be asked to:
1. Enter your email address
2. Check your email for a verification link
3. Click the link to authenticate

### Step 2: Deploy to Vercel

Run this command to deploy:

```bash
npx vercel --prod
```

The CLI will ask you several questions:

**Question 1**: "Set up and deploy?"
- Answer: **Y** (yes)

**Question 2**: "Which scope do you want to deploy to?"
- Answer: Select your personal account or team

**Question 3**: "Link to existing project?"
- Answer: **N** (no, create new project)

**Question 4**: "What's your project's name?"
- Answer: **tech-support-client-portal** (or your preferred name)

**Question 5**: "In which directory is your code located?"
- Answer: **./** (press Enter for current directory)

**Question 6**: "Want to override the settings?"
- Answer: **N** (no, use detected settings)

Vercel will then:
1. Build your application
2. Deploy it to production
3. Give you a URL like: `https://tech-support-client-portal.vercel.app`

### Step 3: Configure Environment Variables

After deployment, you need to add your environment variables:

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

#### Required Variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### Optional Variables (add if you have them):

```
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=sandbox
GITHUB_TOKEN=your_github_token
RESEND_API_KEY=your_resend_key
```

**Important**: After adding environment variables, you need to redeploy:

```bash
npx vercel --prod
```

### Step 4: Configure Custom Domain

1. In Vercel dashboard, go to your project
2. Click **Settings** → **Domains**
3. Click **Add Domain**
4. Enter: `techsupportcomputerservices.com`
5. Follow the DNS configuration instructions

You'll need to add these DNS records at your domain registrar:

**For root domain (techsupportcomputerservices.com)**:
- Type: A
- Name: @
- Value: 76.76.21.21

**For www subdomain**:
- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com

### Step 5: Configure Database (Vercel Postgres)

Since you're moving from Cloudflare D1, you have two options:

#### Option A: Use Vercel Postgres (Recommended)

1. In Vercel dashboard, go to **Storage** tab
2. Click **Create Database** → **Postgres**
3. Choose a name: `tech-support-db`
4. Select region (same as your deployment)
5. Click **Create**

Vercel will automatically add these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

You'll need to:
1. Update your database queries to use Postgres instead of D1
2. Run migrations to create tables

#### Option B: Keep Using Cloudflare D1 (Advanced)

You can still use Cloudflare D1 from Vercel by:
1. Creating a Cloudflare Worker API
2. Calling it from your Vercel app
3. More complex setup, not recommended

### Step 6: Configure File Storage (Vercel Blob)

For document uploads, use Vercel Blob Storage:

1. In Vercel dashboard, go to **Storage** tab
2. Click **Create Database** → **Blob**
3. Choose a name: `tech-support-documents`
4. Click **Create**

Vercel will automatically add:
- `BLOB_READ_WRITE_TOKEN`

Update your file upload code to use Vercel Blob instead of R2.

## Quick Commands Reference

```bash
# Login to Vercel
npx vercel login

# Deploy to production
npx vercel --prod

# Deploy to preview (for testing)
npx vercel

# Check deployment status
npx vercel ls

# View logs
npx vercel logs

# Pull environment variables locally
npx vercel env pull
```

## Testing Your Deployment

After deployment:

1. Visit your Vercel URL (e.g., `https://tech-support-client-portal.vercel.app`)
2. Test the home page loads
3. Click "Sign In" and test Clerk authentication
4. Create a test account
5. Access the dashboard
6. Test creating a ticket

## Troubleshooting

### Build Fails

If the build fails:
1. Check the build logs in Vercel dashboard
2. Make sure all dependencies are in `package.json`
3. Try building locally: `npm run build`

### Authentication Not Working

If Clerk isn't working:
1. Check environment variables are set correctly
2. Make sure you added the Clerk keys
3. Redeploy after adding variables

### Database Errors

If you get database errors:
1. You need to set up Vercel Postgres
2. Update your code to use Postgres instead of D1
3. Run database migrations

## Migration Notes

### From Cloudflare to Vercel

**What changes**:
- ❌ D1 Database → ✅ Vercel Postgres
- ❌ R2 Storage → ✅ Vercel Blob
- ❌ Cloudflare Workers → ✅ Vercel Serverless Functions
- ✅ Clerk works perfectly (no changes needed!)

**What stays the same**:
- ✅ All your React/Next.js code
- ✅ All your API routes
- ✅ All your UI components
- ✅ Clerk authentication

## Cost Estimate

**Vercel Hobby (FREE)**:
- 100 GB bandwidth/month
- 100 GB-hours serverless execution
- Unlimited deployments
- Custom domains

**Your expected usage**:
- ~50-100 clients
- ~10-20 GB bandwidth/month
- **Result: FREE tier is plenty**

## Next Steps After Deployment

1. ✅ Deploy to Vercel
2. ✅ Add environment variables
3. ✅ Configure custom domain
4. ⚠️ Set up Vercel Postgres (requires code changes)
5. ⚠️ Set up Vercel Blob (requires code changes)
6. ✅ Test authentication
7. ✅ Invite test users

## Need Help?

If you run into issues:
1. Check Vercel logs: `npx vercel logs`
2. Check build logs in Vercel dashboard
3. Vercel docs: https://vercel.com/docs
4. Clerk docs: https://clerk.com/docs

---

**Ready to deploy?** Run: `npx vercel --prod`
