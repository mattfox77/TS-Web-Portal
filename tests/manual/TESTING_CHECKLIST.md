# Manual Testing Checklist

This comprehensive checklist covers all manual testing scenarios for the Tech Support Client Portal.

## Pre-Testing Setup

- [ ] Application is running locally or on staging environment
- [ ] Test database is seeded with sample data
- [ ] Test user accounts are created (client user, admin user)
- [ ] PayPal sandbox is configured
- [ ] Email testing service is set up (Mailhog, Mailtrap, etc.)
- [ ] Browser DevTools are open for debugging

## Test Accounts

### Client User
- Email: `client@example.com`
- Password: `TestPass123!`
- Client: Test Company Inc.

### Admin User
- Email: `admin@example.com`
- Password: `AdminPass123!`
- Role: Admin

## 1. Authentication Testing

### User Registration
- [ ] Navigate to sign-up page
- [ ] Fill in email, password, first name, last name
- [ ] Submit form
- [ ] Verify redirect to dashboard
- [ ] Verify welcome message displayed
- [ ] Verify user profile shows correct information

### User Login
- [ ] Navigate to sign-in page
- [ ] Enter valid credentials
- [ ] Submit form
- [ ] Verify redirect to dashboard
- [ ] Verify user is authenticated

### Invalid Login
- [ ] Navigate to sign-in page
- [ ] Enter invalid email
- [ ] Verify error message displayed
- [ ] Enter valid email but wrong password
- [ ] Verify error message displayed
- [ ] Verify account not locked after 3 attempts

### Password Reset
- [ ] Click "Forgot Password" link
- [ ] Enter email address
- [ ] Verify reset email received
- [ ] Click reset link in email
- [ ] Enter new password
- [ ] Verify password updated
- [ ] Login with new password

### Session Persistence
- [ ] Login to application
- [ ] Refresh page
- [ ] Verify still logged in
- [ ] Close browser
- [ ] Reopen browser and navigate to site
- [ ] Verify session persists (or requires re-login based on settings)

### Sign Out
- [ ] Click user menu
- [ ] Click "Sign Out"
- [ ] Verify redirect to home page
- [ ] Verify cannot access protected routes
- [ ] Verify session cleared

## 2. Dashboard Testing

### Dashboard Overview
- [ ] Login as client user
- [ ] Navigate to dashboard
- [ ] Verify stats cards display correct numbers:
  - [ ] Open tickets count
  - [ ] Outstanding invoices amount
  - [ ] Active projects count
  - [ ] Recent activity count
- [ ] Verify quick action buttons work:
  - [ ] "New Ticket" button
  - [ ] "View Invoices" button
  - [ ] "View Projects" button

### Activity Feed
- [ ] Verify recent activity is displayed
- [ ] Verify activity items show:
  - [ ] Action type
  - [ ] Timestamp
  - [ ] Related entity
- [ ] Verify clicking activity item navigates to detail page

### Navigation
- [ ] Verify sidebar navigation works:
  - [ ] Dashboard link
  - [ ] Tickets link
  - [ ] Projects link
  - [ ] Documents link
  - [ ] Invoices link
  - [ ] Payments link
  - [ ] Subscriptions link
  - [ ] Settings link
- [ ] Verify active link is highlighted
- [ ] Verify navigation persists across page refreshes

## 3. Ticket Management Testing

### View Tickets List
- [ ] Navigate to tickets page
- [ ] Verify tickets are displayed in table
- [ ] Verify table shows:
  - [ ] Ticket ID
  - [ ] Title
  - [ ] Status
  - [ ] Priority
  - [ ] Created date
  - [ ] Project (if linked)
- [ ] Verify pagination works (if applicable)

### Filter Tickets
- [ ] Filter by status: Open
- [ ] Verify only open tickets displayed
- [ ] Filter by status: Closed
- [ ] Verify only closed tickets displayed
- [ ] Filter by priority: High
- [ ] Verify only high priority tickets displayed
- [ ] Clear filters
- [ ] Verify all tickets displayed

### Sort Tickets
- [ ] Click "Created Date" column header
- [ ] Verify tickets sorted by date (ascending)
- [ ] Click again
- [ ] Verify tickets sorted by date (descending)
- [ ] Sort by priority
- [ ] Verify correct sorting

### Create New Ticket
- [ ] Click "New Ticket" button
- [ ] Fill in ticket form:
  - [ ] Title: "Test Support Request"
  - [ ] Description: "This is a test ticket"
  - [ ] Priority: High
  - [ ] Project: (select from dropdown)
- [ ] Submit form
- [ ] Verify success message displayed
- [ ] Verify redirect to ticket detail page
- [ ] Verify ticket appears in tickets list
- [ ] Verify email notification received

### View Ticket Details
- [ ] Click on a ticket in the list
- [ ] Verify ticket details displayed:
  - [ ] Title
  - [ ] Description
  - [ ] Status
  - [ ] Priority
  - [ ] Created date
  - [ ] Project link (if applicable)
  - [ ] GitHub issue link (if applicable)
- [ ] Verify comments section displayed

### Add Comment to Ticket
- [ ] On ticket detail page, scroll to comments
- [ ] Enter comment text
- [ ] Click "Add Comment" button
- [ ] Verify comment appears in thread
- [ ] Verify comment shows:
  - [ ] Author name
  - [ ] Timestamp
  - [ ] Comment text
- [ ] Verify email notification sent (if configured)

### Update Ticket Status (Admin)
- [ ] Login as admin user
- [ ] Navigate to ticket detail page
- [ ] Change status to "In Progress"
- [ ] Verify status updated
- [ ] Verify client user receives email notification
- [ ] Change status to "Resolved"
- [ ] Verify status updated
- [ ] Verify resolved date set

### GitHub Integration
- [ ] Create ticket linked to project with GitHub repo
- [ ] Verify GitHub issue created
- [ ] Verify issue number displayed on ticket
- [ ] Verify issue link works
- [ ] Close GitHub issue
- [ ] Verify ticket status updates to "Closed"

## 4. Project Management Testing

### View Projects List
- [ ] Navigate to projects page
- [ ] Verify projects displayed as cards or list
- [ ] Verify each project shows:
  - [ ] Project name
  - [ ] Description
  - [ ] Status
  - [ ] Progress indicator
  - [ ] Start date
  - [ ] Estimated completion
  - [ ] Ticket count

### View Project Details
- [ ] Click on a project
- [ ] Verify project details displayed:
  - [ ] Name
  - [ ] Description
  - [ ] Status
  - [ ] Timeline
  - [ ] GitHub repository link (if applicable)
- [ ] Verify linked tickets displayed
- [ ] Verify linked documents displayed
- [ ] Verify project timeline/milestones displayed

### Filter Projects
- [ ] Filter by status: Active
- [ ] Verify only active projects displayed
- [ ] Filter by status: Completed
- [ ] Verify only completed projects displayed

## 5. Document Management Testing

### View Documents List
- [ ] Navigate to documents page
- [ ] Verify documents displayed in list
- [ ] Verify each document shows:
  - [ ] Filename
  - [ ] File size
  - [ ] Upload date
  - [ ] Uploader name
  - [ ] Project (if linked)
  - [ ] Download button
  - [ ] Delete button

### Upload Document
- [ ] Click "Upload Document" button
- [ ] Select file from computer (PDF, < 50MB)
- [ ] Optionally select project to link
- [ ] Click "Upload" button
- [ ] Verify upload progress indicator
- [ ] Verify success message
- [ ] Verify document appears in list
- [ ] Verify file metadata correct

### Upload via Drag and Drop
- [ ] Drag file from desktop
- [ ] Drop onto upload area
- [ ] Verify upload starts automatically
- [ ] Verify success message
- [ ] Verify document in list

### File Size Validation
- [ ] Try to upload file > 50MB
- [ ] Verify error message displayed
- [ ] Verify upload rejected

### File Type Validation
- [ ] Try to upload .exe file
- [ ] Verify error message displayed
- [ ] Verify upload rejected
- [ ] Try to upload .pdf file
- [ ] Verify upload succeeds

### Download Document
- [ ] Click "Download" button on a document
- [ ] Verify file downloads
- [ ] Verify downloaded file opens correctly
- [ ] Verify filename matches original

### Delete Document
- [ ] Click "Delete" button on a document
- [ ] Verify confirmation dialog appears
- [ ] Click "Cancel"
- [ ] Verify document not deleted
- [ ] Click "Delete" again
- [ ] Click "Confirm"
- [ ] Verify document removed from list
- [ ] Verify success message displayed

### Filter Documents
- [ ] Filter by project
- [ ] Verify only documents for that project displayed
- [ ] Clear filter
- [ ] Verify all documents displayed

## 6. Invoice Management Testing

### View Invoices List
- [ ] Navigate to invoices page
- [ ] Verify invoices displayed in table
- [ ] Verify each invoice shows:
  - [ ] Invoice number
  - [ ] Issue date
  - [ ] Due date
  - [ ] Amount
  - [ ] Status
  - [ ] Payment date (if paid)

### Filter Invoices
- [ ] Filter by status: Paid
- [ ] Verify only paid invoices displayed
- [ ] Filter by status: Sent
- [ ] Verify only sent (unpaid) invoices displayed
- [ ] Filter by date range
- [ ] Verify invoices within range displayed

### View Invoice Details
- [ ] Click on an invoice
- [ ] Verify invoice details displayed:
  - [ ] Invoice number
  - [ ] Issue date
  - [ ] Due date
  - [ ] Client information
  - [ ] Line items with descriptions, quantities, prices
  - [ ] Subtotal
  - [ ] Tax amount
  - [ ] Total amount
  - [ ] Payment status
  - [ ] Notes
- [ ] Verify "Download PDF" button present
- [ ] Verify "Pay with PayPal" button present (if unpaid)

### Download Invoice PDF
- [ ] Click "Download PDF" button
- [ ] Verify PDF downloads
- [ ] Open PDF
- [ ] Verify PDF contains:
  - [ ] Company logo and information
  - [ ] Invoice number
  - [ ] Client information
  - [ ] Line items
  - [ ] Totals
  - [ ] Payment instructions

### Create Invoice (Admin)
- [ ] Login as admin user
- [ ] Navigate to admin invoices page
- [ ] Click "New Invoice" button
- [ ] Fill in invoice form:
  - [ ] Select client
  - [ ] Add line items (description, quantity, unit price)
  - [ ] Set due date
  - [ ] Add notes
- [ ] Verify subtotal calculated automatically
- [ ] Verify tax calculated automatically
- [ ] Verify total calculated automatically
- [ ] Submit form
- [ ] Verify invoice created
- [ ] Verify invoice number generated (INV-YYYY-NNNN)
- [ ] Verify client receives email with PDF

## 7. Payment Processing Testing

### Pay Invoice with PayPal
- [ ] Login as client user
- [ ] Navigate to unpaid invoice
- [ ] Click "Pay with PayPal" button
- [ ] Verify redirect to PayPal sandbox
- [ ] Login to PayPal sandbox:
  - Email: `sb-buyer@example.com`
  - Password: (sandbox password)
- [ ] Review payment details
- [ ] Click "Pay Now"
- [ ] Verify redirect back to portal
- [ ] Verify success message displayed
- [ ] Verify invoice status updated to "Paid"
- [ ] Verify payment date displayed
- [ ] Verify transaction ID displayed
- [ ] Verify receipt email received

### Cancel PayPal Payment
- [ ] Start payment process
- [ ] On PayPal page, click "Cancel"
- [ ] Verify redirect back to portal
- [ ] Verify invoice still unpaid
- [ ] Verify no error message

### View Payment History
- [ ] Navigate to payments page
- [ ] Verify all payments displayed
- [ ] Verify each payment shows:
  - [ ] Date
  - [ ] Invoice number
  - [ ] Amount
  - [ ] Payment method
  - [ ] Transaction ID
  - [ ] Receipt download button

### Download Receipt
- [ ] Click "Download Receipt" button
- [ ] Verify receipt PDF downloads
- [ ] Open PDF
- [ ] Verify receipt contains:
  - [ ] Payment date
  - [ ] Amount paid
  - [ ] Invoice number
  - [ ] Transaction ID
  - [ ] Company information

### Filter Payments
- [ ] Filter by date range
- [ ] Verify payments within range displayed
- [ ] Verify year-to-date total calculated correctly

## 8. Subscription Management Testing

### View Service Packages
- [ ] Navigate to services page
- [ ] Verify service packages displayed
- [ ] Verify each package shows:
  - [ ] Name
  - [ ] Description
  - [ ] Features list
  - [ ] Monthly price
  - [ ] Annual price
  - [ ] Subscribe buttons

### Subscribe to Package
- [ ] Click "Subscribe Monthly" button
- [ ] Verify redirect to PayPal
- [ ] Login to PayPal sandbox
- [ ] Review subscription details
- [ ] Click "Agree & Subscribe"
- [ ] Verify redirect back to portal
- [ ] Verify success message
- [ ] Verify subscription appears in subscriptions list

### View Active Subscriptions
- [ ] Navigate to subscriptions page
- [ ] Verify active subscriptions displayed
- [ ] Verify each subscription shows:
  - [ ] Package name
  - [ ] Status
  - [ ] Billing cycle
  - [ ] Next billing date
  - [ ] Amount
  - [ ] Cancel button

### Cancel Subscription
- [ ] Click "Cancel Subscription" button
- [ ] Verify confirmation dialog
- [ ] Click "Confirm"
- [ ] Verify subscription status updated to "Cancelled"
- [ ] Verify cancellation email received
- [ ] Verify subscription remains active until end of billing period

### Recurring Payment
- [ ] Wait for next billing date (or simulate)
- [ ] Verify recurring payment processed
- [ ] Verify new invoice generated
- [ ] Verify invoice marked as paid
- [ ] Verify payment recorded
- [ ] Verify email notification received

## 9. Admin Dashboard Testing

### View Admin Dashboard
- [ ] Login as admin user
- [ ] Navigate to admin dashboard
- [ ] Verify aggregate metrics displayed:
  - [ ] Total clients
  - [ ] Open tickets
  - [ ] Monthly revenue
  - [ ] Active subscriptions
- [ ] Verify recent activity across all clients
- [ ] Verify quick links to admin functions

### Manage Clients
- [ ] Navigate to admin clients page
- [ ] Verify all clients displayed
- [ ] Verify each client shows:
  - [ ] Company name
  - [ ] Contact email
  - [ ] Status
  - [ ] Active projects count
  - [ ] Outstanding invoices amount
  - [ ] Actions (view, edit, delete)

### Create New Client
- [ ] Click "New Client" button
- [ ] Fill in client form:
  - [ ] Company name
  - [ ] Contact email
  - [ ] Phone
  - [ ] Address
- [ ] Submit form
- [ ] Verify client created
- [ ] Verify client appears in list

### Edit Client
- [ ] Click "Edit" button on a client
- [ ] Modify client information
- [ ] Submit form
- [ ] Verify changes saved
- [ ] Verify updated information displayed

### View Client Details
- [ ] Click on a client
- [ ] Verify client details displayed
- [ ] Verify associated users listed
- [ ] Verify projects listed
- [ ] Verify tickets listed
- [ ] Verify invoices listed

### Impersonate User
- [ ] On client detail page, click "Impersonate"
- [ ] Verify switched to client user view
- [ ] Verify impersonation banner displayed
- [ ] Verify can only see client's data
- [ ] Click "Stop Impersonating"
- [ ] Verify returned to admin view
- [ ] Verify impersonation logged in audit log

### Manage Projects (Admin)
- [ ] Navigate to admin projects page
- [ ] Verify all projects across all clients displayed
- [ ] Create new project
- [ ] Assign to client
- [ ] Set GitHub repository
- [ ] Verify project created
- [ ] Update project status
- [ ] Verify status updated

### View Usage Reports
- [ ] Navigate to admin usage page
- [ ] Select date range
- [ ] Select project (or all projects)
- [ ] Verify usage data displayed:
  - [ ] API calls by provider
  - [ ] Token usage
  - [ ] Costs
  - [ ] Daily/weekly/monthly aggregations
- [ ] Export report
- [ ] Verify CSV/PDF downloaded

### View Audit Logs
- [ ] Navigate to admin audit logs page
- [ ] Verify audit entries displayed:
  - [ ] Timestamp
  - [ ] User
  - [ ] Action
  - [ ] Entity type
  - [ ] Entity ID
  - [ ] IP address
- [ ] Filter by user
- [ ] Filter by action type
- [ ] Filter by date range
- [ ] Verify filtered results correct

## 10. Settings and Preferences Testing

### View User Settings
- [ ] Navigate to settings page
- [ ] Verify user profile information displayed
- [ ] Verify notification preferences displayed

### Update Profile
- [ ] Update first name
- [ ] Update last name
- [ ] Update phone number
- [ ] Submit form
- [ ] Verify changes saved
- [ ] Verify success message displayed

### Update Notification Preferences
- [ ] Toggle "Email on ticket created"
- [ ] Toggle "Email on ticket updated"
- [ ] Toggle "Email on invoice generated"
- [ ] Toggle "Email on payment received"
- [ ] Submit form
- [ ] Verify preferences saved
- [ ] Create ticket
- [ ] Verify email sent/not sent based on preference

### Change Password
- [ ] Click "Change Password"
- [ ] Enter current password
- [ ] Enter new password
- [ ] Confirm new password
- [ ] Submit form
- [ ] Verify password updated
- [ ] Sign out
- [ ] Sign in with new password
- [ ] Verify login successful

## 11. Mobile Responsiveness Testing

### Test on Mobile Devices (320px - 768px)

#### iPhone (375px)
- [ ] Open site on iPhone or iPhone simulator
- [ ] Verify layout adapts to small screen
- [ ] Verify navigation menu collapses to hamburger
- [ ] Verify tables scroll horizontally or stack
- [ ] Verify forms are usable
- [ ] Verify buttons are at least 44px tap targets
- [ ] Verify text is readable without zooming
- [ ] Test all major workflows:
  - [ ] Login
  - [ ] Create ticket
  - [ ] View invoice
  - [ ] Upload document

#### Android (360px)
- [ ] Open site on Android or Android simulator
- [ ] Verify layout adapts correctly
- [ ] Verify touch interactions work
- [ ] Test all major workflows

#### Tablet (768px)
- [ ] Open site on tablet or tablet simulator
- [ ] Verify layout uses available space
- [ ] Verify navigation is accessible
- [ ] Test all major workflows

### Orientation Testing
- [ ] Test in portrait mode
- [ ] Rotate to landscape mode
- [ ] Verify layout adapts
- [ ] Verify no content is cut off
- [ ] Verify functionality still works

## 12. Cross-Browser Testing

### Chrome (Latest)
- [ ] Open site in Chrome
- [ ] Test all major workflows
- [ ] Verify no console errors
- [ ] Verify styling correct
- [ ] Verify JavaScript works

### Firefox (Latest)
- [ ] Open site in Firefox
- [ ] Test all major workflows
- [ ] Verify no console errors
- [ ] Verify styling correct
- [ ] Verify JavaScript works

### Safari (Latest)
- [ ] Open site in Safari
- [ ] Test all major workflows
- [ ] Verify no console errors
- [ ] Verify styling correct
- [ ] Verify JavaScript works

### Edge (Latest)
- [ ] Open site in Edge
- [ ] Test all major workflows
- [ ] Verify no console errors
- [ ] Verify styling correct
- [ ] Verify JavaScript works

## 13. Email Notification Testing

### Ticket Notifications
- [ ] Create new ticket
- [ ] Verify email received with:
  - [ ] Ticket ID
  - [ ] Title
  - [ ] Description
  - [ ] Link to ticket
- [ ] Update ticket status
- [ ] Verify email received with status change

### Invoice Notifications
- [ ] Admin creates invoice
- [ ] Verify client receives email with:
  - [ ] Invoice number
  - [ ] Amount due
  - [ ] Due date
  - [ ] PDF attachment
  - [ ] Payment link

### Payment Notifications
- [ ] Complete payment
- [ ] Verify receipt email received with:
  - [ ] Payment amount
  - [ ] Invoice number
  - [ ] Transaction ID
  - [ ] Payment date

### Subscription Notifications
- [ ] Subscribe to package
- [ ] Verify confirmation email
- [ ] Cancel subscription
- [ ] Verify cancellation email
- [ ] Recurring payment processed
- [ ] Verify payment notification

### Notification Preferences
- [ ] Disable ticket notifications
- [ ] Create ticket
- [ ] Verify no email received
- [ ] Enable ticket notifications
- [ ] Create ticket
- [ ] Verify email received

## 14. Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators visible
- [ ] Verify tab order logical
- [ ] Press Enter on buttons
- [ ] Verify actions trigger
- [ ] Press Escape on modals
- [ ] Verify modals close

### Screen Reader Testing
- [ ] Enable screen reader (NVDA, JAWS, VoiceOver)
- [ ] Navigate through pages
- [ ] Verify all content is announced
- [ ] Verify form labels are read
- [ ] Verify button purposes are clear
- [ ] Verify images have alt text
- [ ] Verify headings are hierarchical

### Color Contrast
- [ ] Use browser extension (WAVE, axe DevTools)
- [ ] Check all text has sufficient contrast
- [ ] Verify links are distinguishable
- [ ] Verify buttons are visible
- [ ] Test in high contrast mode

### ARIA Labels
- [ ] Inspect interactive elements
- [ ] Verify ARIA labels present where needed
- [ ] Verify ARIA roles correct
- [ ] Verify ARIA states update dynamically

## 15. Performance Testing

### Page Load Times
- [ ] Open DevTools Network tab
- [ ] Navigate to dashboard
- [ ] Verify page loads in < 2 seconds on 3G
- [ ] Check for:
  - [ ] Large images (should be optimized)
  - [ ] Unnecessary requests
  - [ ] Blocking resources

### Lighthouse Audit
- [ ] Open DevTools Lighthouse tab
- [ ] Run audit
- [ ] Verify scores:
  - [ ] Performance: 90+
  - [ ] Accessibility: 90+
  - [ ] Best Practices: 90+
  - [ ] SEO: 90+
- [ ] Review recommendations
- [ ] Fix critical issues

### Bundle Size
- [ ] Run `npm run build`
- [ ] Check bundle sizes
- [ ] Verify no excessively large bundles
- [ ] Verify code splitting working

## 16. Error Handling Testing

### Network Errors
- [ ] Disconnect internet
- [ ] Try to load page
- [ ] Verify error message displayed
- [ ] Reconnect internet
- [ ] Verify page loads

### API Errors
- [ ] Simulate 500 error from API
- [ ] Verify user-friendly error message
- [ ] Verify no stack trace shown
- [ ] Verify error logged

### Form Validation Errors
- [ ] Submit form with missing required fields
- [ ] Verify validation errors displayed
- [ ] Verify fields highlighted
- [ ] Fix errors
- [ ] Verify form submits successfully

### 404 Errors
- [ ] Navigate to non-existent page
- [ ] Verify 404 page displayed
- [ ] Verify link back to home
- [ ] Verify navigation still works

## Testing Sign-Off

### Tester Information
- Tester Name: _______________
- Date: _______________
- Environment: _______________
- Browser/Device: _______________

### Results Summary
- Total Tests: _______________
- Passed: _______________
- Failed: _______________
- Blocked: _______________

### Critical Issues Found
1. _______________
2. _______________
3. _______________

### Recommendations
_______________
_______________
_______________

### Approval
- [ ] All critical tests passed
- [ ] All blockers resolved
- [ ] Ready for deployment

Approved by: _______________
Date: _______________
