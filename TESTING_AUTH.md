# Testing Authentication Implementation

This document provides instructions for testing the authentication implementation.

## Manual Testing Checklist

### 1. User Registration Flow

- [ ] Navigate to `/sign-up`
- [ ] Fill in registration form with valid email and password
- [ ] Submit the form
- [ ] Verify redirect to `/dashboard`
- [ ] Check database for new `clients` record
- [ ] Check database for new `users` record with correct `client_id`
- [ ] Verify user role is set to `user` by default

### 2. User Login Flow

- [ ] Sign out from dashboard
- [ ] Navigate to `/sign-in`
- [ ] Enter valid credentials
- [ ] Submit the form
- [ ] Verify redirect to `/dashboard`
- [ ] Verify user ID is displayed on dashboard

### 3. Protected Routes

- [ ] While logged out, try to access `/dashboard`
- [ ] Verify redirect to `/sign-in`
- [ ] Log in and verify redirect back to `/dashboard`

### 4. Public Routes

- [ ] While logged out, access `/` (homepage)
- [ ] Verify no redirect occurs
- [ ] Access `/services`, `/about`, `/contact`
- [ ] Verify all public pages are accessible

### 5. API Authentication

- [ ] Make a request to `/api/auth/user` while logged in
- [ ] Verify response contains user and client data
- [ ] Log out and make the same request
- [ ] Verify 401 Unauthorized response

### 6. Webhook Integration

- [ ] Register a new user through Clerk
- [ ] Check webhook logs in Clerk dashboard
- [ ] Verify webhook was received successfully
- [ ] Check database for new records
- [ ] Verify `client_id` matches between `clients` and `users` tables

### 7. Session Persistence

- [ ] Log in to the portal
- [ ] Refresh the page
- [ ] Verify you remain logged in
- [ ] Close and reopen the browser
- [ ] Verify session persists (if "Remember me" was selected)

### 8. Sign Out

- [ ] Click sign out button (when implemented)
- [ ] Verify redirect to homepage or sign-in page
- [ ] Try to access `/dashboard`
- [ ] Verify redirect to `/sign-in`

## Database Verification Queries

### Check User Records

```bash
# Local database
npx wrangler d1 execute tech-support-db --local --command "SELECT * FROM users"

# Remote database
npx wrangler d1 execute tech-support-db --remote --command "SELECT * FROM users"
```

### Check Client Records

```bash
# Local database
npx wrangler d1 execute tech-support-db --local --command "SELECT * FROM clients"

# Remote database
npx wrangler d1 execute tech-support-db --remote --command "SELECT * FROM clients"
```

### Verify User-Client Relationship

```bash
npx wrangler d1 execute tech-support-db --local --command "
SELECT u.id, u.email, u.role, c.name as client_name, c.email as client_email
FROM users u
JOIN clients c ON u.client_id = c.id
"
```

## Testing Admin Access

### Create an Admin User

1. Register a new user through the normal flow
2. Update their role in the database:

```bash
npx wrangler d1 execute tech-support-db --local --command "
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com'
"
```

3. Test admin-only API routes (when implemented)

## Testing with cURL

### Test User API (Authenticated)

```bash
# This will fail without a valid session cookie
curl -X GET http://localhost:3000/api/auth/user \
  -H "Cookie: __session=your_session_cookie"
```

### Test Webhook Endpoint

```bash
curl -X POST http://localhost:3000/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: test_id" \
  -H "svix-timestamp: 1234567890" \
  -H "svix-signature: test_signature" \
  -d '{
    "type": "user.created",
    "data": {
      "id": "user_test123",
      "email_addresses": [
        {
          "id": "email_test123",
          "email_address": "test@example.com"
        }
      ],
      "primary_email_address_id": "email_test123",
      "first_name": "Test",
      "last_name": "User"
    }
  }'
```

Note: This will fail signature verification unless you use a valid Clerk webhook signature.

## Common Issues and Solutions

### Issue: Webhook not creating user records

**Solution:**
1. Check that `CLERK_WEBHOOK_SECRET` is set correctly
2. Verify the webhook URL in Clerk dashboard is correct
3. Check application logs for errors
4. Ensure database is initialized with correct schema

### Issue: 401 Unauthorized on protected routes

**Solution:**
1. Verify you're logged in
2. Check that Clerk environment variables are set
3. Clear browser cookies and log in again
4. Check middleware configuration in `middleware.ts`

### Issue: User can access admin routes

**Solution:**
1. Verify `requireAdmin()` is being called in the route handler
2. Check user's role in database
3. Ensure role-based access control is implemented correctly

### Issue: Session not persisting

**Solution:**
1. Check Clerk session settings in dashboard
2. Verify cookies are enabled in browser
3. Check for CORS issues if using custom domain

## Next Steps

After verifying authentication works:

1. Implement user profile page
2. Add role-based UI components
3. Create admin dashboard
4. Implement password reset flow
5. Add two-factor authentication (optional)
