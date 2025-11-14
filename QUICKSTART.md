# Quick Start Guide

Get the Tech Support Client Portal running locally in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm installed

## Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials (see SETUP.md for detailed instructions).

**Minimum required for local development:**
- Clerk keys (sign up at https://clerk.com)
- Other services can be configured later

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## What's Next?

1. **Configure Clerk** - Set up authentication
2. **Create Database** - Initialize Cloudflare D1 database
3. **Add Schema** - Run database migrations
4. **Configure PayPal** - Set up payment processing
5. **Deploy** - Push to Cloudflare Pages

See [SETUP.md](./SETUP.md) for complete setup instructions.

## Project Structure

```
├── app/                 # Next.js pages and API routes
├── components/          # React components
├── lib/                 # Utility functions
├── types/               # TypeScript types
├── public/              # Static files
├── .env.local          # Environment variables (create this)
├── wrangler.toml       # Cloudflare configuration
└── next.config.js      # Next.js configuration
```

## Common Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run pages:build  # Build for Cloudflare Pages
npm run preview      # Preview with Cloudflare Workers
npm run deploy       # Deploy to Cloudflare Pages
```

## Need Help?

- Check [SETUP.md](./SETUP.md) for detailed setup
- Review [Requirements](/.kiro/specs/tech-support-client-portal/requirements.md)
- See [Design Document](/.kiro/specs/tech-support-client-portal/design.md)
- Follow [Implementation Tasks](/.kiro/specs/tech-support-client-portal/tasks.md)
