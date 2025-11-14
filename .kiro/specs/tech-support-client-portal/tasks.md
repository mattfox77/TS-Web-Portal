# Implementation Plan

- [x] 1. Initialize project structure and core configuration
  - Create Next.js 14 project with TypeScript, App Router, and Tailwind CSS
  - Install dependencies: @clerk/nextjs, @cloudflare/next-on-pages, wrangler, zod
  - Configure next.config.js for Cloudflare Pages deployment
  - Create wrangler.toml with D1 and R2 bindings
  - Set up environment variables structure (.env.local, .dev.vars)
  - _Requirements: 17.1, 17.2_

- [x] 2. Set up database schema and utilities
  - Create schema.sql with all tables (clients, users, projects, tickets, invoices, payments, etc.)
  - Create indexes for performance optimization
  - Initialize D1 database locally and remotely using wrangler
  - Create lib/db-utils.ts with query helper functions
  - Create TypeScript interfaces in types/index.ts for all data models
  - _Requirements: 2.2, 15.3, 17.4_

- [x] 3. Implement authentication and authorization
  - Configure Clerk provider in app/layout.tsx
  - Create sign-in and sign-up pages using Clerk components
  - Implement lib/auth.ts with requireAuth, requireAdmin, getUserClientId functions
  - Create Clerk webhook handler at app/api/webhooks/clerk/route.ts
  - Implement user creation in D1 when Clerk user is created
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 15.2_

- [x] 4. Build public website pages
  - Create homepage (app/page.tsx) with hero section and service overview
  - Create services page (app/services/page.tsx) with service package cards
  - Create about page (app/about/page.tsx) with company information
  - Create contact page (app/contact/page.tsx) with form and validation
  - Implement shared Header and Footer components
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 16.1, 16.2_

- [x] 5. Create dashboard layout and overview
  - Implement dashboard layout (app/dashboard/layout.tsx) with sidebar navigation
  - Create dashboard page (app/dashboard/page.tsx) with stats cards and activity feed
  - Build StatsCard component for displaying metrics
  - Build ActivityFeed component for recent events
  - Implement API route GET /api/auth/user for fetching user and client data
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Implement support ticket system
- [x] 6.1 Create ticket list page (app/dashboard/tickets/page.tsx) with filtering
  - Build TicketTable component with sortable columns and status badges
  - Implement API route GET /api/tickets with query params for filtering
  - Add client-side state management for filters
  - _Requirements: 4.3_

- [x] 6.2 Create new ticket page (app/dashboard/tickets/new/page.tsx)
  - Build TicketForm component with validation using Zod
  - Implement API route POST /api/tickets
  - Integrate GitHub issue creation when project has repository
  - Send email notification on ticket creation
  - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3, 13.1_

- [x] 6.3 Create ticket detail page (app/dashboard/tickets/[id]/page.tsx)
  - Display ticket information and status
  - Build CommentThread component for viewing and adding comments
  - Implement API routes GET /api/tickets/[id] and POST /api/tickets/[id]/comments
  - Implement API route PATCH /api/tickets/[id] for status updates
  - _Requirements: 4.4, 4.5_

- [x] 6.4 Implement GitHub webhook handler
  - Create app/api/webhooks/github/route.ts
  - Verify GitHub webhook signatures
  - Handle issue closed/reopened events to update ticket status
  - _Requirements: 5.4, 5.5_

- [x] 7. Build project management features
- [x] 7.1 Create projects list page (app/dashboard/projects/page.tsx)
  - Build ProjectCard component with progress indicators
  - Implement API route GET /api/projects
  - Display project status and associated ticket counts
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 7.2 Create project detail page (app/dashboard/projects/[id]/page.tsx)
  - Display project information and timeline
  - Show linked tickets and documents
  - Implement API route GET /api/projects/[id]
  - Build ProjectTimeline component for milestone visualization
  - _Requirements: 6.2, 6.5_

- [x] 8. Implement document management system
- [x] 8.1 Create documents page (app/dashboard/documents/page.tsx)
  - Build DocumentUpload component with drag-and-drop functionality
  - Build DocumentList component with file metadata
  - Implement file type and size validation (max 50MB)
  - _Requirements: 7.1, 7.3, 16.3_

- [x] 8.2 Implement document API routes
  - Create POST /api/documents for file upload to R2
  - Create GET /api/documents with pre-signed URL generation (1-hour expiry)
  - Create DELETE /api/documents/[id] for file deletion
  - Store document metadata in D1
  - _Requirements: 7.2, 7.4, 7.5_

- [x] 9. Build invoice management system
- [x] 9.1 Create invoices list page (app/dashboard/invoices/page.tsx)
  - Build InvoiceTable component with status filtering
  - Implement API route GET /api/invoices with date range filtering
  - Display payment status and amounts
  - _Requirements: 11.1, 11.2, 11.4_

- [x] 9.2 Create invoice detail page (app/dashboard/invoices/[id]/page.tsx)
  - Display invoice header and line items
  - Show payment status and transaction details
  - Implement API route GET /api/invoices/[id]
  - Add download PDF button
  - _Requirements: 8.5, 11.2_

- [x] 9.3 Implement invoice PDF generation
  - Create lib/pdf-generator.ts using a PDF library
  - Implement API route GET /api/invoices/[id]/pdf
  - Generate branded PDF with company logo and invoice details
  - _Requirements: 8.5_

- [x] 9.4 Create admin invoice creation page (app/admin/invoices/new/page.tsx)
  - Build invoice form with dynamic line items
  - Implement automatic calculation of subtotal, tax, and total
  - Implement API route POST /api/invoices (admin only)
  - Generate sequential invoice numbers (INV-YYYY-NNNN)
  - Send invoice email with PDF attachment
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 13.2_

- [x] 10. Integrate PayPal payment processing
- [x] 10.1 Implement PayPal authentication and utilities
  - Create lib/paypal.ts with getPayPalAccessToken function
  - Implement error handling for PayPal API calls
  - Configure PayPal environment variables (client ID, secret, mode)
  - _Requirements: 9.1_

- [x] 10.2 Implement one-time payment flow
  - Create lib/paypal.ts functions: createPayPalOrder, capturePayPalOrder
  - Implement API route POST /api/payments/create-order
  - Implement API route POST /api/payments/capture-order
  - Build PayPalButton component for client-side integration
  - Update invoice status to "paid" after successful payment
  - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [x] 10.3 Implement PayPal webhook handler
  - Create app/api/webhooks/paypal/route.ts
  - Implement webhook signature verification
  - Handle PAYMENT.SALE.COMPLETED event to update invoice
  - Record payment transaction in payments table
  - Send receipt email after payment
  - _Requirements: 9.4, 9.5, 13.3_

- [x] 11. Implement subscription and recurring billing
- [x] 11.1 Create service packages management
  - Seed service_packages table with initial offerings
  - Create API route GET /api/service-packages for listing packages
  - Display service packages on services page with pricing
  - _Requirements: 10.1_

- [x] 11.2 Implement PayPal subscription creation
  - Create lib/paypal-subscriptions.ts with subscription functions
  - Implement createPayPalSubscriptionPlan function
  - Implement createPayPalSubscription function
  - Create API route POST /api/payments/subscriptions
  - _Requirements: 10.1, 10.2_

- [x] 11.3 Create subscriptions management page
  - Create app/dashboard/subscriptions/page.tsx
  - Build SubscriptionCard component showing active subscriptions
  - Implement API route GET /api/payments/subscriptions
  - Add subscription cancellation functionality
  - Implement API route DELETE /api/payments/subscriptions/[id]
  - _Requirements: 10.4_

- [x] 11.4 Handle subscription webhook events
  - Update PayPal webhook handler for subscription events
  - Handle BILLING.SUBSCRIPTION.ACTIVATED event
  - Handle BILLING.SUBSCRIPTION.CANCELLED event
  - Handle BILLING.SUBSCRIPTION.PAYMENT.FAILED event
  - Generate invoice for successful recurring payments
  - Send notification emails for subscription events
  - _Requirements: 10.3, 10.5, 13.2_

- [x] 12. Build payment history and reporting
- [x] 12.1 Create payment history page (app/dashboard/payments/page.tsx)
  - Display all payments with transaction details
  - Implement filtering by date range and status
  - Calculate and display year-to-date total
  - Add download receipt functionality
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12.2 Implement receipt generation and download
  - Create receipt email template in lib/email.ts
  - Implement receipt PDF generation (similar to invoice)
  - Add download receipt button to payment history
  - _Requirements: 11.2, 13.3_

- [x] 13. Implement email notification system
- [x] 13.1 Set up email service integration
  - Choose email provider (SendGrid or Cloudflare Email Workers)
  - Configure API keys and sender email
  - Create lib/email.ts with sendEmail function
  - _Requirements: 13.4_

- [x] 13.2 Create email templates
  - Implement getTicketCreatedEmail template
  - Implement getInvoiceEmail template
  - Implement getPaymentReceiptEmail template
  - Implement subscription notification templates
  - Create HTML and plain text versions for all templates
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 13.3 Implement notification preferences
  - Add notification settings to user profile
  - Create app/dashboard/settings/page.tsx for user preferences
  - Implement API route PATCH /api/auth/user/preferences
  - Respect user preferences when sending notifications
  - _Requirements: 13.5_

- [x] 14. Build admin dashboard and management
- [x] 14.1 Create admin dashboard (app/admin/page.tsx)
  - Display aggregate metrics (total clients, open tickets, monthly revenue)
  - Show recent activity across all clients
  - Implement API route GET /api/admin/stats (admin only)
  - Add quick links to admin functions
  - _Requirements: 12.1, 12.4_

- [x] 14.2 Implement client management
  - Create app/admin/clients/page.tsx with client list
  - Build AdminClientCard component with account summary
  - Implement API routes GET /api/admin/clients and POST /api/admin/clients
  - Create client detail/edit page
  - _Requirements: 12.2, 12.3_

- [x] 14.3 Implement admin project management
  - Create app/admin/projects/page.tsx for all projects
  - Add create/edit project functionality
  - Implement API routes for project CRUD operations
  - Allow admin to update project status and notes
  - _Requirements: 6.5, 12.3_

- [x] 14.4 Implement user impersonation for support
  - Add impersonation functionality in admin dashboard
  - Create API route POST /api/admin/impersonate
  - Log all impersonation actions to activity_log
  - Add banner when viewing as another user
  - _Requirements: 12.5_

- [x] 15. Implement API usage tracking
- [x] 15.1 Create usage tracking API
  - Implement API route POST /api/usage for recording API calls
  - Create lib/pricing.ts with cost calculation functions
  - Store usage data in api_usage table
  - _Requirements: 14.1, 14.2_

- [x] 15.2 Build usage reports page
  - Create app/admin/usage/page.tsx for usage analytics
  - Implement API route GET /api/admin/usage with aggregations
  - Display usage by project with daily/weekly/monthly views
  - Show cost breakdowns by provider and model
  - _Requirements: 14.3, 14.4_

- [x] 15.3 Implement usage alerts
  - Add budget threshold configuration per project
  - Create background job to check usage against thresholds
  - Send email alerts when thresholds are exceeded
  - _Requirements: 14.4_

- [x] 15.4 Create usage tracking integration example
  - Document how to integrate usage tracking from external apps
  - Provide Python code example for tracking API calls
  - _Requirements: 14.5_

- [x] 16. Implement security features
- [x] 16.1 Add input validation and sanitization
  - Create validation schemas in lib/validation.ts using Zod
  - Apply validation to all API routes
  - Implement error handling for validation failures
  - _Requirements: 15.1, 15.2_

- [x] 16.2 Implement audit logging
  - Create lib/audit.ts with logActivity function
  - Log authentication attempts and admin actions
  - Log sensitive operations (invoice creation, payments, document access)
  - Create admin page to view audit logs
  - _Requirements: 15.5_

- [x] 16.3 Add webhook signature verification
  - Implement verifyPayPalWebhook function
  - Implement GitHub webhook signature verification
  - Implement Clerk webhook signature verification
  - Reject webhooks with invalid signatures
  - _Requirements: 5.5, 15.1_

- [x] 16.4 Implement error handling middleware
  - Create lib/errors.ts with custom error classes
  - Implement handleError function for consistent error responses
  - Add try-catch blocks to all API routes
  - Log errors with context for debugging
  - _Requirements: 15.1_

- [x] 17. Optimize performance and accessibility
- [x] 17.1 Implement caching strategy
  - Add cache headers to appropriate API responses
  - Configure Next.js static generation where applicable
  - Leverage Cloudflare CDN for static assets
  - _Requirements: 17.3_

- [x] 17.2 Add database query optimization
  - Review and optimize all database queries
  - Ensure indexes are used effectively
  - Implement pagination for large result sets
  - Create lib/pagination.ts with helper functions
  - _Requirements: 17.4_

- [x] 17.3 Ensure mobile responsiveness
  - Test all pages on mobile devices (320px to 768px)
  - Adjust layouts and components for small screens
  - Ensure touch targets are at least 44px
  - _Requirements: 16.1, 16.2_

- [x] 17.4 Implement accessibility features
  - Add ARIA labels to interactive elements
  - Ensure keyboard navigation works throughout
  - Test with screen readers
  - Meet WCAG 2.1 Level AA standards
  - _Requirements: 16.3, 16.4, 16.5_

- [x] 17.5 Run Lighthouse performance audit
  - Achieve performance score of 90+
  - Optimize images and assets
  - Minimize JavaScript bundle size
  - _Requirements: 17.1, 17.2_

- [x] 18. Implement backup and recovery
- [x] 18.1 Create database backup script
  - Create scripts/backup-database.ts
  - Export all tables to SQL format
  - Upload backup to R2 with timestamp
  - _Requirements: 18.1_

- [x] 18.2 Implement automated backup scheduling
  - Configure Cloudflare Cron Trigger for daily backups
  - Implement cleanup of backups older than 30 days
  - _Requirements: 18.2_

- [x] 18.3 Document restoration procedures
  - Create admin documentation for data restoration
  - Test backup restoration process
  - _Requirements: 18.3, 18.4_

- [x] 18.4 Implement quarterly backup testing
  - Schedule quarterly restoration tests
  - Document test results
  - _Requirements: 18.5_

- [x] 19. Deploy and configure production environment
- [x] 19.1 Configure Cloudflare Pages deployment
  - Connect GitHub repository to Cloudflare Pages
  - Set build command and output directory
  - Configure custom domain (if applicable)
  - _Requirements: 17.1_

- [x] 19.2 Set up production environment variables
  - Add all required environment variables in Cloudflare dashboard
  - Configure PayPal for live mode
  - Set up production Clerk application
  - _Requirements: 15.4_

- [x] 19.3 Initialize production database and storage
  - Create production D1 database
  - Run schema.sql on production database
  - Create production R2 bucket
  - Seed initial data (service packages, admin user)
  - _Requirements: 17.4_

- [x] 19.4 Configure webhooks in external services
  - Set up Clerk webhook with production URL
  - Set up PayPal webhook with production URL
  - Set up GitHub webhook for issue tracking (if applicable)
  - Test webhook delivery
  - _Requirements: 5.5, 9.5, 13.4_

- [x] 19.5 Set up monitoring and alerts
  - Configure Cloudflare Analytics
  - Set up uptime monitoring (e.g., UptimeRobot)
  - Configure error alerting
  - _Requirements: 17.5_

- [x] 20. Testing and quality assurance
- [x] 20.1 Write unit tests for utility functions
  - Test pricing calculations
  - Test authentication helpers
  - Test validation schemas
  - Test email template generation

- [x] 20.2 Write integration tests for API routes
  - Test ticket creation and GitHub integration
  - Test invoice creation and payment flow
  - Test document upload and download
  - Test subscription creation and management

- [x] 20.3 Perform end-to-end testing
  - Test complete user registration and login flow
  - Test ticket creation to resolution workflow
  - Test invoice payment with PayPal sandbox
  - Test subscription signup and cancellation
  - Test document upload and access

- [x] 20.4 Conduct security testing
  - Test authentication and authorization
  - Verify client data isolation
  - Test webhook signature verification
  - Check for SQL injection and XSS vulnerabilities

- [x] 20.5 Perform manual testing checklist
  - Complete all items in manual testing checklist from design doc
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test on mobile devices (iOS and Android)
  - Verify email delivery for all notification types

- [x] 21. Documentation and training materials
- [x] 21.1 Create user documentation
  - Write user guide for client portal features
  - Document how to create tickets and track projects
  - Explain invoice payment process
  - Document subscription management

- [x] 21.2 Create admin documentation
  - Document admin dashboard features
  - Explain client and project management
  - Document invoice creation process
  - Explain usage tracking and reporting

- [x] 21.3 Create developer documentation
  - Document API endpoints and authentication
  - Explain database schema and relationships
  - Document deployment and configuration process
  - Provide troubleshooting guide

- [x] 21.4 Create README and setup instructions
  - Write comprehensive README.md
  - Document local development setup
  - List all environment variables
  - Provide quick start guide

- [ ] 22. Migrate from Cloudflare D1 to Vercel Postgres
- [x] 22.1 Update database utility functions
  - Replace D1Database types with Vercel Postgres sql client
  - Convert db.prepare().bind() pattern to sql template literals
  - Update queryAll, queryOne, execute, and executeBatch functions
  - Test all database utility functions
  - _Requirements: 2.2, 15.3, 17.4_

- [x] 22.2 Update all API routes to use Vercel Postgres
  - Replace getRequestContext().env.DB with Vercel Postgres import
  - Update all API route files in app/api directory
  - Convert parameterized queries from ? placeholders to $1, $2 format
  - Test each API endpoint after migration
  - _Requirements: All API-related requirements_

- [x] 22.3 Update library functions for Postgres
  - Update lib/audit.ts to use Postgres client
  - Update lib/email.ts to use Postgres client
  - Update lib/usage-alerts.ts to use Postgres client
  - Update lib/pagination.ts to use Postgres client
  - Test all library functions
  - _Requirements: 13.4, 14.1, 15.5_

- [x] 22.4 Update test files for Postgres
  - Update integration test mocks to use Postgres
  - Remove @cloudflare/next-on-pages mocks
  - Update test database setup and teardown
  - Run all tests to verify migration
  - _Requirements: Testing requirements_

- [x] 22.5 Update deployment configuration
  - Remove Cloudflare-specific configuration
  - Update environment variables for Vercel Postgres
  - Update deployment documentation
  - Test deployment on Vercel
  - _Requirements: 19.1, 19.2, 19.3_
