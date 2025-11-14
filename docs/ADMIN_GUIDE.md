# Tech Support Computer Services - Admin Guide

This guide provides comprehensive documentation for administrators managing the Tech Support Computer Services Client Portal.

## Table of Contents

1. [Admin Dashboard Overview](#admin-dashboard-overview)
2. [Client Management](#client-management)
3. [User Management](#user-management)
4. [Project Management](#project-management)
5. [Invoice Creation and Management](#invoice-creation-and-management)
6. [Usage Tracking and Reporting](#usage-tracking-and-reporting)
7. [Support Ticket Management](#support-ticket-management)
8. [Document Management](#document-management)
9. [Subscription Management](#subscription-management)
10. [Audit Logs and Security](#audit-logs-and-security)
11. [System Administration](#system-administration)
12. [Best Practices](#best-practices)

---

## Admin Dashboard Overview

### Accessing the Admin Dashboard

1. Log in with an admin account
2. Navigate to `/admin` or click **Admin** in the main navigation
3. Admin dashboard is only accessible to users with `role = 'admin'`

### Dashboard Components

**Key Metrics Cards**:
- **Total Clients**: Active client accounts
- **Open Tickets**: All unresolved support tickets across clients
- **Monthly Revenue**: Total invoiced amount for current month
- **Active Projects**: Projects currently in progress

**Recent Activity Feed**:
- Cross-client activity timeline
- Ticket creations and updates
- Invoice generation and payments
- New client registrations
- Project status changes

**Quick Actions**:
- Create New Client
- Generate Invoice
- View All Tickets
- Create Project
- View Usage Reports

### API Endpoint

```
GET /api/admin/stats
```

**Response**:
```json
{
  "total_clients": 45,
  "active_clients": 42,
  "open_tickets": 23,
  "monthly_revenue": 15750.00,
  "active_projects": 18,
  "recent_activity": [...]
}
```

---

## Client Management

### Viewing All Clients


1. Navigate to **Admin → Clients**
2. View client list with summary information:
   - Client name and company
   - Contact email and phone
   - Account status (Active, Inactive, Suspended)
   - Number of users
   - Active projects count
   - Outstanding invoice amount
   - Total lifetime value

### Creating a New Client

1. Click **New Client** button
2. Fill in client information:
   - **Name**: Primary contact name
   - **Email**: Primary contact email (required, unique)
   - **Company Name**: Business name
   - **Phone**: Contact phone number
   - **Address**: Business address
   - **Status**: Active (default), Inactive, or Suspended
3. Click **Create Client**
4. Client record is created in database
5. Client can now register users linked to this account

**API Endpoint**:
```
POST /api/admin/clients
```

**Request Body**:
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "company_name": "Example Corp",
  "phone": "+1-555-0123",
  "address": "123 Main St, City, ST 12345",
  "status": "active"
}
```

### Editing Client Information

1. Click on a client card or name
2. Navigate to client detail page
3. Click **Edit Client** button
4. Update any fields
5. Click **Save Changes**

**API Endpoint**:
```
PATCH /api/admin/clients/[id]
```

### Client Status Management

**Active**: Normal operations, full access to portal
**Inactive**: Temporary deactivation, users cannot log in
**Suspended**: Account suspended (e.g., non-payment), access blocked

To change status:
1. Open client detail page
2. Select new status from dropdown
3. Click **Update Status**
4. Confirm action
5. Users will be notified via email

### Client Account Summary

View comprehensive client information:
- Contact details and account status
- All associated users
- Active and completed projects
- Open and closed tickets
- Invoice history and payment status
- Subscription details
- Total revenue from client
- API usage (if applicable)

---

## User Management

### Viewing Users

**All Users**:
1. Navigate to **Admin → Users**
2. View all portal users across all clients

**Client-Specific Users**:
1. Open client detail page
2. Scroll to **Users** section
3. View all users linked to this client

### User Information

- User ID (Clerk ID)
- Name and email
- Role (User or Admin)
- Associated client
- Registration date
- Last login date

### Adding Users to Client Account

**Method 1: User Self-Registration**
- User registers through portal
- Clerk webhook creates user record
- User is automatically linked to client based on email domain or manual assignment

**Method 2: Admin Creation**
1. Navigate to client detail page
2. Click **Add User**
3. Enter user email
4. Send invitation email
5. User completes registration via invitation link

**API Endpoint**:
```
POST /api/admin/clients/[id]/users
```

### Changing User Roles

1. Find user in user list
2. Click **Edit** or user name
3. Change role dropdown:
   - **User**: Standard client access
   - **Admin**: Full administrative access
4. Click **Save**
5. **Warning**: Be cautious granting admin access

### User Impersonation

For support purposes, admins can view the portal as a specific user:

1. Navigate to client detail page
2. Find user in user list
3. Click **Impersonate** button
4. Confirm action
5. Portal reloads with user's perspective
6. **Impersonation banner** appears at top
7. Click **Exit Impersonation** to return to admin view

**Important**:
- All impersonation actions are logged in audit trail
- Use only for legitimate support purposes
- Users are notified of impersonation sessions

**API Endpoint**:
```
POST /api/admin/impersonate
```

**Request Body**:
```json
{
  "user_id": "user_abc123"
}
```

---

## Project Management

### Viewing All Projects

1. Navigate to **Admin → Projects**
2. View all projects across all clients
3. Filter by:
   - Client
   - Status (Planning, Active, On Hold, Completed, Cancelled)
   - Date range

### Creating a New Project

1. Click **New Project** button
2. Fill in project details:
   - **Client**: Select from dropdown (required)
   - **Name**: Project name (required)
   - **Description**: Detailed project description
   - **Status**: Planning, Active, On Hold, Completed, Cancelled
   - **GitHub Repository**: URL to GitHub repo (optional)
   - **Start Date**: Project start date
   - **Estimated Completion**: Target completion date
3. Click **Create Project**

**API Endpoint**:
```
POST /api/admin/projects
```

**Request Body**:
```json
{
  "client_id": "client_123",
  "name": "Website Redesign",
  "description": "Complete overhaul of company website",
  "status": "planning",
  "github_repo": "https://github.com/company/website",
  "start_date": "2024-01-15",
  "estimated_completion": "2024-03-30"
}
```

### Editing Projects

1. Click on project name or card
2. View project detail page
3. Click **Edit Project**
4. Update any fields
5. Click **Save Changes**

**API Endpoint**:
```
PATCH /api/admin/projects/[id]
```

### Project Status Updates

Update project status to reflect current state:

1. Open project detail page
2. Select new status from dropdown
3. Add status update notes (optional but recommended)
4. Click **Update Status**
5. Client users are notified of status change

### Adding Project Notes

1. Open project detail page
2. Scroll to **Notes** section
3. Click **Add Note**
4. Enter note content
5. Click **Save**
6. Notes are timestamped and attributed to admin user

### Linking Tickets to Projects

Tickets can be linked to projects for organization:

1. When creating/editing a ticket, select project from dropdown
2. Linked tickets appear on project detail page
3. Helps track project-related support requests

### Project Budget Tracking

For projects with API usage:

1. Navigate to project detail page
2. View **Budget** section
3. Set budget thresholds:
   - **Warning Threshold**: Percentage to trigger warning (e.g., 75%)
   - **Critical Threshold**: Percentage to trigger alert (e.g., 90%)
   - **Maximum Budget**: Total budget in USD
4. Click **Save Budget Settings**
5. Automatic alerts sent when thresholds exceeded

**API Endpoint**:
```
PATCH /api/admin/projects/[id]/budget
```

---

## Invoice Creation and Management

### Creating an Invoice

1. Navigate to **Admin → Invoices → New Invoice**
2. Fill in invoice details:

**Client Information**:
- Select client from dropdown

**Line Items**:
- Click **Add Line Item**
- Enter description (e.g., "Website Development - 20 hours")
- Enter quantity (e.g., 20)
- Enter unit price (e.g., 125.00)
- Amount calculated automatically (quantity × unit_price)
- Add multiple line items as needed
- Click **Remove** to delete a line item

**Invoice Details**:
- **Issue Date**: Date invoice is issued (defaults to today)
- **Due Date**: Payment due date (defaults to 30 days from issue)
- **Tax Rate**: Percentage (e.g., 8 for 8%)
- **Notes**: Additional information for client (optional)

**Calculations** (automatic):
- Subtotal: Sum of all line item amounts
- Tax Amount: Subtotal × tax_rate
- Total: Subtotal + tax_amount

3. Click **Generate Invoice**
4. Invoice is created with sequential number (INV-YYYY-NNNN)
5. Invoice status set to "Sent"
6. Email sent to client with PDF attachment

**API Endpoint**:
```
POST /api/invoices
```

**Request Body**:
```json
{
  "client_id": "client_123",
  "line_items": [
    {
      "description": "Website Development",
      "quantity": 20,
      "unit_price": 125.00
    },
    {
      "description": "Server Setup",
      "quantity": 1,
      "unit_price": 500.00
    }
  ],
  "issue_date": "2024-01-15",
  "due_date": "2024-02-14",
  "tax_rate": 0.08,
  "notes": "Payment due within 30 days"
}
```

### Invoice Numbering

Invoices are automatically numbered sequentially:
- Format: `INV-YYYY-NNNN`
- Example: `INV-2024-0001`, `INV-2024-0002`
- Counter resets each year
- Numbers are never reused

### Viewing All Invoices

1. Navigate to **Admin → Invoices**
2. View all invoices across all clients
3. Filter by:
   - Client
   - Status (Draft, Sent, Paid, Overdue, Cancelled)
   - Date range
4. Sort by invoice number, date, amount, or status

### Invoice Status Management

**Draft**: Invoice being prepared, not yet sent to client
**Sent**: Invoice issued and awaiting payment
**Paid**: Payment received and processed
**Overdue**: Due date passed without payment
**Cancelled**: Invoice voided or cancelled

To change status manually:
1. Open invoice detail page
2. Select new status from dropdown
3. Click **Update Status**
4. Add reason for change (for audit trail)

**Note**: Status automatically updates to "Paid" when payment received via PayPal webhook

### Sending Invoice Emails

**Automatic**: Emails sent automatically when invoice created

**Manual Resend**:
1. Open invoice detail page
2. Click **Resend Email** button
3. Confirm action
4. Email sent to client with PDF attachment

**API Endpoint**:
```
POST /api/admin/invoices/send-email
```

### Invoice PDF Generation

PDFs are automatically generated and include:
- Company logo and branding
- Invoice number and dates
- Client billing information
- Itemized line items
- Subtotal, tax, and total
- Payment instructions
- PayPal payment link

To download PDF:
1. Open invoice detail page
2. Click **Download PDF**

### Handling Payments

**Automatic Payment Processing**:
- Client pays via PayPal button on invoice
- PayPal webhook notifies system
- Invoice status updated to "Paid"
- Payment record created
- Receipt email sent to client

**Manual Payment Recording**:
1. Open invoice detail page
2. Click **Record Payment**
3. Enter payment details:
   - Amount
   - Payment method
   - Transaction ID
   - Payment date
4. Click **Save Payment**
5. Invoice status updated to "Paid"

### Overdue Invoice Management

Invoices automatically marked "Overdue" when:
- Current date > due_date
- Status is still "Sent"

**Overdue Actions**:
1. View overdue invoices in filtered list
2. Send payment reminders:
   - Click **Send Reminder** on invoice
   - Automated reminder email sent
3. Contact client directly
4. Consider late fees (per service agreement)
5. Suspend services if necessary

---

## Usage Tracking and Reporting

### Overview

Track API usage and costs for client projects using external APIs (OpenAI, Anthropic, etc.).

### Recording API Usage

**Automatic Tracking** (via client integration):
- Clients integrate usage tracking in their applications
- POST requests sent to `/api/usage` endpoint
- Usage data stored in `api_usage` table

**Manual Entry**:
1. Navigate to **Admin → Usage → Record Usage**
2. Fill in usage details:
   - Project
   - Provider (OpenAI, Anthropic, etc.)
   - Model (gpt-4, claude-3, etc.)
   - Input tokens
   - Output tokens
   - Cost (calculated automatically based on pricing)
3. Click **Save**

**API Endpoint**:
```
POST /api/usage
```

**Request Body**:
```json
{
  "project_id": "project_123",
  "provider": "openai",
  "model": "gpt-4",
  "input_tokens": 1500,
  "output_tokens": 500,
  "cost_usd": 0.045
}
```

### Viewing Usage Reports

1. Navigate to **Admin → Usage**
2. Select filters:
   - **Client**: Specific client or all clients
   - **Project**: Specific project or all projects
   - **Date Range**: Daily, weekly, monthly, or custom
   - **Provider**: Filter by API provider
3. Click **Generate Report**

**Report Data**:
- Total requests
- Total tokens (input + output)
- Total cost in USD
- Breakdown by provider and model
- Daily/weekly/monthly trends
- Cost per project
- Top consuming projects

**API Endpoint**:
```
GET /api/admin/usage?client_id=xxx&date_from=2024-01-01&date_to=2024-01-31
```

### Budget Alerts

Set up automatic alerts when projects exceed budget thresholds:

1. Navigate to project detail page
2. Configure budget settings:
   - Maximum budget
   - Warning threshold (e.g., 75%)
   - Critical threshold (e.g., 90%)
3. Save settings

**Alert Triggers**:
- Email sent to admin when warning threshold reached
- Email sent to admin and client when critical threshold reached
- Daily budget check runs via cron job

**API Endpoint**:
```
GET /api/admin/usage/check-budgets
```

### Pricing Configuration

Update API pricing in `lib/pricing.ts`:

```typescript
export const API_PRICING = {
  openai: {
    'gpt-4': {
      input: 0.03 / 1000,  // per token
      output: 0.06 / 1000
    },
    'gpt-3.5-turbo': {
      input: 0.0015 / 1000,
      output: 0.002 / 1000
    }
  },
  anthropic: {
    'claude-3-opus': {
      input: 0.015 / 1000,
      output: 0.075 / 1000
    }
  }
};
```

### Including Usage in Invoices

When creating invoices:

1. Select project with API usage
2. Click **Add Usage Charges**
3. Select date range
4. System calculates total usage cost
5. Line item automatically added to invoice
6. Description includes usage breakdown

---

## Support Ticket Management

### Viewing All Tickets

1. Navigate to **Admin → Tickets**
2. View all tickets across all clients
3. Filter by:
   - Client
   - Status
   - Priority
   - Assigned technician
   - Date range

### Ticket Assignment

1. Open ticket detail page
2. Select technician from **Assigned To** dropdown
3. Click **Assign**
4. Assigned technician receives notification
5. Ticket appears in their assigned tickets list

### Updating Ticket Status

1. Open ticket detail page
2. Select new status from dropdown:
   - Open
   - In Progress
   - Waiting on Client
   - Resolved
   - Closed
3. Add status update comment (recommended)
4. Click **Update Status**
5. Client receives email notification

### Adding Internal Notes

Internal notes are visible only to admins:

1. Open ticket detail page
2. Scroll to comments section
3. Check **Internal Note** checkbox
4. Enter note content
5. Click **Add Comment**
6. Note marked with "Internal" badge

### GitHub Integration

For tickets linked to projects with GitHub repositories:

**Automatic Issue Creation**:
- When ticket created for project with `github_repo`
- GitHub issue automatically created
- Issue includes ticket details and link back to portal
- GitHub issue URL stored in ticket record

**Syncing Status**:
- GitHub webhook listens for issue events
- When GitHub issue closed → ticket status updated to "Closed"
- When GitHub issue reopened → ticket status updated to "Open"

**Manual GitHub Link**:
1. Open ticket detail page
2. Click **Create GitHub Issue**
3. Issue created and linked
4. GitHub issue URL displayed

### Ticket Metrics

View ticket statistics:
- Average response time
- Average resolution time
- Tickets by status
- Tickets by priority
- Tickets by client
- Busiest support periods

---

## Document Management

### Viewing All Documents

1. Navigate to **Admin → Documents**
2. View all documents across all clients
3. Filter by:
   - Client
   - Project
   - File type
   - Upload date

### Document Access

Admins can:
- View all client documents
- Download any document
- Delete documents (with caution)
- See who uploaded each document

### Document Security

- Files stored in Cloudflare R2 with encryption
- Pre-signed URLs expire after 1 hour
- Access logged in audit trail
- Client isolation enforced (clients can only see their own documents)

### Storage Management

Monitor storage usage:
- Total storage used
- Storage per client
- Largest files
- Storage trends

**R2 Free Tier**: 10GB storage
- Monitor usage to stay within limits
- Archive or delete old documents as needed

---

## Subscription Management

### Viewing All Subscriptions

1. Navigate to **Admin → Subscriptions**
2. View all active subscriptions
3. Filter by:
   - Client
   - Service package
   - Status
   - Billing cycle

### Service Package Management

**Creating Service Packages**:
1. Navigate to **Admin → Service Packages**
2. Click **New Package**
3. Fill in package details:
   - Name
   - Description
   - Monthly price
   - Annual price
   - Features (JSON array)
4. Click **Create Package**

**Editing Packages**:
- Update pricing
- Modify features
- Activate/deactivate packages

**Database**:
```sql
INSERT INTO service_packages 
(id, name, description, price_monthly, price_annual, features, is_active)
VALUES 
('pkg_1', 'Basic Support', 'Email support, 5 hours/month', 299.00, 2990.00, 
 '["Email support", "5 hours/month", "Response within 24 hours"]', 1);
```

### Subscription Status

- **Active**: Subscription is current and billing
- **Cancelled**: Cancelled but active until period end
- **Expired**: Subscription period ended
- **Suspended**: Payment failures or manual suspension

### Handling Failed Payments

When subscription payment fails:
1. Admin receives email notification
2. Navigate to subscription detail
3. View payment failure reason
4. Contact client to update payment method
5. After 3 failures, subscription auto-suspended

### Manual Subscription Management

**Cancel Subscription**:
1. Open subscription detail
2. Click **Cancel Subscription**
3. Enter cancellation reason
4. Confirm action
5. Subscription remains active until period end

**Reactivate Subscription**:
1. Open cancelled/expired subscription
2. Click **Reactivate**
3. Client must approve in PayPal
4. Subscription resumes

---

## Audit Logs and Security

### Viewing Audit Logs

1. Navigate to **Admin → Audit Logs**
2. View all logged activities
3. Filter by:
   - User
   - Client
   - Action type
   - Date range
   - Entity type

### Logged Activities

**Authentication**:
- Login attempts (successful and failed)
- Password resets
- Account lockouts

**Admin Actions**:
- Client creation/modification
- User role changes
- User impersonation sessions
- Invoice generation
- Payment recording
- Project status updates

**Sensitive Operations**:
- Document access and downloads
- Invoice payments
- Subscription changes
- Budget threshold modifications

### Audit Log Details

Each log entry includes:
- Timestamp
- User ID and name
- Client ID (if applicable)
- Action performed
- Entity type and ID
- Additional details (JSON)
- IP address

### Security Monitoring

**Review Regularly**:
- Failed login attempts (potential brute force)
- Unusual access patterns
- Impersonation sessions
- Large data exports
- Permission changes

**Alerts**:
- Multiple failed logins from same IP
- Admin actions outside business hours
- Bulk data access
- Unauthorized access attempts

---

## System Administration

### Database Management

**Backup**:
- Automatic daily backups to R2
- Retention: 30 days
- Manual backup trigger available

**Restore**:
- Follow restoration procedures in deployment docs
- Test restores quarterly

### Environment Variables

Critical environment variables (set in Cloudflare dashboard):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_MODE (sandbox or live)
PAYPAL_WEBHOOK_ID
GITHUB_TOKEN
SENDGRID_API_KEY
APP_URL
```

### Webhook Configuration

**Clerk Webhook**:
- URL: `https://your-domain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`
- Verify signature with `CLERK_WEBHOOK_SECRET`

**PayPal Webhook**:
- URL: `https://your-domain.com/api/webhooks/paypal`
- Events: Payment and subscription events
- Verify signature with PayPal API

**GitHub Webhook**:
- URL: `https://your-domain.com/api/webhooks/github`
- Events: `issues` (closed, reopened)
- Verify signature with `GITHUB_TOKEN`

### Monitoring

**Cloudflare Analytics**:
- Request volume
- Error rates
- Response times
- Geographic distribution

**Application Health**:
- Endpoint: `GET /api/health`
- Returns system status
- Monitor with uptime service

**Error Tracking**:
- Console logs in Cloudflare dashboard
- Optional: Sentry integration for detailed error tracking

### Performance Optimization

**Database**:
- Monitor query performance
- Ensure indexes are used
- Review slow queries

**Caching**:
- Static assets cached at edge
- API responses cached where appropriate
- Clear cache when needed

**R2 Storage**:
- Monitor bandwidth usage
- Optimize file sizes
- Clean up old files

---

## Best Practices

### Client Onboarding

1. Create client record with accurate information
2. Set up initial project (if applicable)
3. Add client users or send invitation
4. Configure notification preferences
5. Create initial invoice or subscription
6. Provide client with portal URL and user guide

### Invoice Management

1. Generate invoices promptly after work completed
2. Include detailed line item descriptions
3. Set reasonable due dates (typically 30 days)
4. Send reminders for overdue invoices
5. Record all payments accurately
6. Maintain consistent invoicing schedule

### Ticket Management

1. Respond to tickets within SLA timeframes
2. Keep clients updated on progress
3. Use internal notes for team communication
4. Link tickets to projects for organization
5. Close tickets only after client confirmation
6. Review ticket metrics regularly

### Project Management

1. Create projects for all significant engagements
2. Update status regularly
3. Set realistic completion estimates
4. Link related tickets and documents
5. Track budget for API usage projects
6. Communicate milestones to clients

### Security

1. Use strong passwords and 2FA
2. Review audit logs regularly
3. Limit admin access to necessary personnel
4. Use impersonation only for support purposes
5. Keep environment variables secure
6. Monitor for suspicious activity
7. Update dependencies regularly

### Communication

1. Respond to client inquiries promptly
2. Set clear expectations for response times
3. Use professional, friendly tone
4. Document important decisions
5. Keep clients informed of system maintenance
6. Provide regular status updates on projects

### Data Management

1. Back up database regularly
2. Test restore procedures
3. Archive old data as needed
4. Monitor storage usage
5. Clean up unused documents
6. Maintain data integrity

---

## Troubleshooting

### Common Admin Issues

**Can't Access Admin Dashboard**:
- Verify your user role is set to "admin" in database
- Check authentication is working
- Clear browser cache
- Try different browser

**Webhook Not Working**:
- Verify webhook URL is correct
- Check webhook secret matches environment variable
- Review webhook logs in external service
- Test webhook with manual trigger
- Check firewall/security settings

**Invoice Email Not Sending**:
- Verify SendGrid API key is valid
- Check email quota (100/day on free tier)
- Review email logs
- Verify recipient email is valid
- Check spam folder

**PayPal Integration Issues**:
- Verify PayPal credentials are correct
- Check PayPal mode (sandbox vs live)
- Review PayPal API logs
- Verify webhook is configured
- Test with PayPal sandbox

**Database Query Slow**:
- Check if indexes exist on queried columns
- Review query complexity
- Monitor D1 usage metrics
- Consider pagination for large result sets

### Getting Help

**Technical Support**:
- Review developer documentation
- Check Cloudflare documentation
- Review error logs
- Contact Cloudflare support for platform issues

**Application Issues**:
- Check GitHub repository for known issues
- Review deployment logs
- Test in development environment
- Contact development team

---

## Appendix

### API Quick Reference

**Admin Endpoints**:
```
GET    /api/admin/stats
GET    /api/admin/clients
POST   /api/admin/clients
GET    /api/admin/clients/[id]
PATCH  /api/admin/clients/[id]
POST   /api/admin/clients/[id]/users
GET    /api/admin/projects
POST   /api/admin/projects
PATCH  /api/admin/projects/[id]
PATCH  /api/admin/projects/[id]/budget
GET    /api/admin/usage
GET    /api/admin/usage/check-budgets
POST   /api/admin/impersonate
GET    /api/admin/audit-logs
POST   /api/admin/backup
```

### Database Schema Reference

Key tables:
- `clients`: Client accounts
- `users`: Portal users (linked to Clerk)
- `projects`: Client projects
- `tickets`: Support tickets
- `ticket_comments`: Ticket comments
- `invoices`: Invoices
- `invoice_items`: Invoice line items
- `payments`: Payment transactions
- `subscriptions`: Recurring subscriptions
- `service_packages`: Available service offerings
- `documents`: File metadata
- `api_usage`: API usage tracking
- `activity_log`: Audit trail

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + /`: Toggle sidebar
- `Ctrl/Cmd + N`: New ticket/invoice (context-dependent)
- `Esc`: Close modal/dialog

---

*Last Updated: [Date]*
*Version: 1.0*

For technical issues with this documentation or the portal system, contact the development team.
