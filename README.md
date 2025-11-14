# Tech Support Computer Services - Client Portal

A comprehensive client portal for IT service delivery, support ticketing, billing, and project management. Built with Next.js 14, TypeScript, and deployed on Cloudflare Pages.

## Features

### Client Portal
- 🔐 **Secure Authentication** - Clerk integration with email/password and social login (Google, Microsoft)
- 🎫 **Support Tickets** - Create, track, and comment on support requests with priority levels
- 📊 **Project Tracking** - View project status, timelines, and deliverables
- 📁 **Document Management** - Secure file upload/download with 50MB limit and 1-hour expiring links
- 💰 **Invoice Management** - View invoices, download PDFs, and pay online via PayPal
- 💳 **Subscriptions** - Subscribe to service packages with automatic recurring billing
- 📧 **Email Notifications** - Configurable notifications for tickets, invoices, and payments
- 📱 **Mobile Responsive** - Optimized for all device sizes with touch-friendly interface

### Admin Dashboard
- 👥 **Client Management** - Create and manage client accounts with status tracking
- 🎯 **Project Management** - Create projects, set budgets, track progress
- 📝 **Invoice Generation** - Create invoices with line items, automatic calculations, and PDF generation
- 📊 **Usage Tracking** - Track API usage and costs for client projects
- 🔍 **Audit Logs** - Complete activity logging for security and compliance
- 👤 **User Impersonation** - View portal as client for support purposes
- 📈 **Analytics** - Dashboard metrics and reporting

### Technical Features
- ⚡ **Edge Computing** - Deployed on Cloudflare's global network for low latency
- 🗄️ **Serverless Database** - Cloudflare D1 with automatic scaling
- 🔒 **Security** - HTTPS, role-based access control, webhook signature verification
- 🔗 **GitHub Integration** - Automatic issue creation and status syncing
- 💸 **PayPal Integration** - One-time payments and recurring subscriptions
- 📦 **R2 Storage** - S3-compatible object storage for documents
- 🎨 **Modern UI** - Tailwind CSS with accessible components

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Cloudflare D1 (serverless SQLite)
- **File Storage**: Cloudflare R2
- **Hosting**: Cloudflare Pages
- **Payment Processing**: PayPal REST API
- **Email**: SendGrid or Cloudflare Email Workers

## Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Clerk account
- PayPal developer account
- GitHub account (for issue tracking integration)
- SendGrid account (optional, for email)

## Quick Start

For a complete setup guide, see [QUICKSTART.md](./QUICKSTART.md).

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:

- **Clerk**: Get keys from [Clerk Dashboard](https://dashboard.clerk.com)
- **PayPal**: Get credentials from [PayPal Developer](https://developer.paypal.com)
- **GitHub**: Create a personal access token
- **SendGrid**: Get API key from [SendGrid](https://sendgrid.com)

### 3. Set Up Cloudflare Resources

#### Create D1 Database

```bash
npx wrangler d1 create tech-support-db
```

Update `wrangler.toml` with the database ID returned.

#### Create R2 Bucket

```bash
npx wrangler r2 bucket create tech-support-documents
```

#### Initialize Database Schema

```bash
npx wrangler d1 execute tech-support-db --local --file=./schema.sql
npx wrangler d1 execute tech-support-db --remote --file=./schema.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Preview with Cloudflare Workers

```bash
npm run preview
```

### 6. Create Admin User

After first deployment, create an admin user:

```bash
./scripts/create-admin-user.sh
```

Or manually update the database:

```bash
npx wrangler d1 execute tech-support-db --remote --command="UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com'"
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (Edge functions)
│   ├── dashboard/         # Client portal pages
│   ├── admin/             # Admin dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
├── public/                # Static assets
├── schema.sql             # Database schema
├── wrangler.toml          # Cloudflare configuration
└── next.config.js         # Next.js configuration
```

## Deployment

### Quick Deployment

For experienced developers, see the [Quick Deployment Guide](./QUICK_DEPLOYMENT_GUIDE.md) (~40 minutes).

### Production Deployment

For detailed production deployment:

1. **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Complete checklist
2. **[Cloudflare Setup](./CLOUDFLARE_SETUP.md)** - Configure Cloudflare Pages, D1, R2
3. **[Environment Setup](./ENVIRONMENT_SETUP.md)** - Configure all environment variables
4. **[Database & Storage](./DATABASE_STORAGE_SETUP.md)** - Initialize database and storage
5. **[Webhook Setup](./WEBHOOK_SETUP.md)** - Configure webhooks
6. **[Monitoring Setup](./MONITORING_SETUP.md)** - Set up monitoring and alerts

### Automated Deployment

```bash
# Validate environment variables
./scripts/validate-env.sh

# Initialize production resources
./scripts/init-production.sh

# Deploy to production
./scripts/deploy-production.sh

# Create admin user
./scripts/create-admin-user.sh

# Verify deployment
./scripts/check-health.sh https://portal.yourdomain.com
```

### Manual Deployment

```bash
# Build and deploy
npm run pages:build
npx wrangler pages deploy .vercel/output/static --project-name=tech-support-client-portal
```

See [Complete Deployment Guide](./DEPLOYMENT.md) for full instructions.

## Environment Variables

### Required Variables

#### Clerk Authentication
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx  # Public key for client-side
CLERK_SECRET_KEY=sk_test_xxx                    # Secret key for server-side
CLERK_WEBHOOK_SECRET=whsec_xxx                  # Webhook signature verification
```

#### PayPal Integration
```env
PAYPAL_CLIENT_ID=xxx                            # PayPal app client ID
PAYPAL_CLIENT_SECRET=xxx                        # PayPal app secret
PAYPAL_MODE=sandbox                             # 'sandbox' or 'live'
PAYPAL_WEBHOOK_ID=xxx                           # Webhook ID from PayPal dashboard
```

#### GitHub Integration (Optional)
```env
GITHUB_TOKEN=ghp_xxx                            # Personal access token for issue creation
```

#### Email Service
```env
SENDGRID_API_KEY=SG.xxx                         # SendGrid API key (or use Cloudflare Email Workers)
```

#### Application
```env
APP_URL=https://portal.yourdomain.com           # Your portal URL (for redirects and emails)
```

### Cloudflare Bindings

Configured in `wrangler.toml`:
- `DB` - D1 database binding
- `DOCUMENTS` - R2 bucket binding

See [Environment Setup Guide](./ENVIRONMENT_SETUP.md) for detailed configuration instructions.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run pages:build` - Build for Cloudflare Pages
- `npm run preview` - Preview with Cloudflare Workers locally
- `npm run deploy` - Deploy to Cloudflare Pages
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode

## Documentation

### User Documentation
- [User Guide](./docs/USER_GUIDE.md) - Complete guide for portal users
  - Getting started and account setup
  - Creating and managing support tickets
  - Viewing projects and documents
  - Paying invoices and managing subscriptions
  - Account settings and troubleshooting

### Admin Documentation
- [Admin Guide](./docs/ADMIN_GUIDE.md) - Complete guide for administrators
  - Admin dashboard overview
  - Client and user management
  - Project management
  - Invoice creation and management
  - Usage tracking and reporting
  - Audit logs and security

### Developer Documentation
- [Developer Guide](./docs/DEVELOPER_GUIDE.md) - Technical documentation for developers
  - Architecture overview
  - Database schema and API endpoints
  - Authentication and authorization
  - External integrations (PayPal, GitHub, SendGrid)
  - Development setup and testing
  - Deployment procedures

### Deployment Documentation
- [Quick Deployment Guide](./QUICK_DEPLOYMENT_GUIDE.md) - Fast track for experienced developers
- [Complete Deployment Guide](./DEPLOYMENT.md) - Comprehensive deployment instructions
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
- [Cloudflare Setup](./CLOUDFLARE_SETUP.md) - Cloudflare Pages, D1, and R2 configuration
- [Environment Setup](./ENVIRONMENT_SETUP.md) - Environment variables guide
- [Database & Storage Setup](./DATABASE_STORAGE_SETUP.md) - Database and storage initialization
- [Webhook Setup](./WEBHOOK_SETUP.md) - Webhook configuration for all services
- [Monitoring Setup](./MONITORING_SETUP.md) - Monitoring and alerts configuration

### Project Documentation
- [Requirements](/.kiro/specs/tech-support-client-portal/requirements.md) - Feature requirements
- [Design](/.kiro/specs/tech-support-client-portal/design.md) - System design and architecture
- [Implementation Tasks](/.kiro/specs/tech-support-client-portal/tasks.md) - Development tasks

### Setup Guides
- [Authentication Setup Guide](/AUTH_SETUP.md) - Clerk authentication setup
- [Quick Authentication Reference](/QUICK_AUTH_REFERENCE.md) - Quick auth reference
- [Testing Authentication](/TESTING_AUTH.md) - Authentication testing guide
- [Testing Guide](./TESTING_GUIDE.md) - Testing procedures and guidelines

## Troubleshooting

### Common Issues

#### Authentication Issues
**Problem**: Can't log in or "Unauthorized" errors

**Solutions**:
- Verify Clerk environment variables are set correctly
- Check that Clerk webhook is configured and receiving events
- Ensure user record exists in database (check `users` table)
- Clear browser cookies and try again

#### Database Connection Issues
**Problem**: "Database not found" or query errors

**Solutions**:
- Verify D1 database is created: `npx wrangler d1 list`
- Check `wrangler.toml` has correct database ID
- Ensure schema is initialized: `npx wrangler d1 execute tech-support-db --remote --file=./schema.sql`
- Check database bindings in Cloudflare dashboard

#### PayPal Integration Issues
**Problem**: Payments not processing or webhook not working

**Solutions**:
- Verify PayPal credentials are correct (client ID and secret)
- Check `PAYPAL_MODE` is set to "sandbox" for testing
- Ensure webhook URL is configured in PayPal dashboard
- Verify webhook signature verification is working
- Check PayPal API logs for errors

#### File Upload Issues
**Problem**: Document uploads fail

**Solutions**:
- Verify R2 bucket exists: `npx wrangler r2 bucket list`
- Check R2 binding in `wrangler.toml`
- Ensure file size is under 50MB limit
- Verify CORS settings if uploading from browser

#### Email Not Sending
**Problem**: Notification emails not received

**Solutions**:
- Verify SendGrid API key is valid
- Check SendGrid daily limit (100 emails on free tier)
- Look for emails in spam folder
- Verify sender email is verified in SendGrid
- Check application logs for email errors

### Getting Help

- **User Issues**: See [User Guide](./docs/USER_GUIDE.md)
- **Admin Issues**: See [Admin Guide](./docs/ADMIN_GUIDE.md)
- **Developer Issues**: See [Developer Guide](./docs/DEVELOPER_GUIDE.md)
- **Deployment Issues**: See [Deployment Guide](./DEPLOYMENT.md)

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Write tests for new functionality
5. Run tests: `npm test`
6. Run linter: `npm run lint`
7. Commit changes: `git commit -m "Add new feature"`
8. Push to branch: `git push origin feature/new-feature`
9. Create a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing code patterns and conventions
- Add JSDoc comments for functions
- Use meaningful variable and function names
- Keep functions small and focused
- Write tests for new features

### Testing

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Test edge cases and error conditions
- Ensure all tests pass before submitting PR

## Support

For technical support or questions:

- **Email**: support@techsupportcs.com
- **Documentation**: See [docs/](./docs/) directory
- **Issues**: Create an issue in the repository

## License

Private - Tech Support Computer Services
TS Web Portal for Client Service

---

**Built with ❤️ using Next.js, TypeScript, and Cloudflare**
