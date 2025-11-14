# End-to-End Testing Guide

This directory contains end-to-end (E2E) tests for the Tech Support Client Portal using Playwright.

## Overview

E2E tests verify complete user workflows from start to finish, simulating real user interactions with the application.

## Setup

### Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### Configuration

Create `playwright.config.ts` in the project root:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Scenarios

### 1. User Registration and Login Flow

**Test File**: `auth.spec.ts`

**Scenarios**:
- User can register with email/password
- User can login with valid credentials
- User cannot login with invalid credentials
- User can reset password
- Session persists across page refreshes
- User can sign out

**Example Test**:
```typescript
import { test, expect } from '@playwright/test';

test('complete user registration and login flow', async ({ page }) => {
  // Navigate to sign up page
  await page.goto('/sign-up');
  
  // Fill registration form
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.fill('[name="firstName"]', 'Test');
  await page.fill('[name="lastName"]', 'User');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
  
  // Sign out
  await page.click('[data-testid="user-button"]');
  await page.click('text=Sign out');
  
  // Verify redirect to home
  await expect(page).toHaveURL('/');
  
  // Sign in again
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  
  // Verify successful login
  await expect(page).toHaveURL('/dashboard');
});
```

### 2. Ticket Creation to Resolution Workflow

**Test File**: `tickets.spec.ts`

**Scenarios**:
- User can create a new support ticket
- Ticket appears in ticket list
- User can view ticket details
- User can add comments to ticket
- Admin can update ticket status
- User receives email notifications

**Example Test**:
```typescript
test('ticket creation to resolution workflow', async ({ page }) => {
  // Login as user
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'client@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Navigate to tickets
  await page.click('text=Tickets');
  await expect(page).toHaveURL('/dashboard/tickets');
  
  // Create new ticket
  await page.click('text=New Ticket');
  await page.fill('[name="title"]', 'Test Support Request');
  await page.fill('[name="description"]', 'This is a test ticket for E2E testing');
  await page.selectOption('[name="priority"]', 'high');
  await page.click('button[type="submit"]');
  
  // Verify ticket created
  await expect(page.locator('text=Test Support Request')).toBeVisible();
  
  // Click on ticket to view details
  await page.click('text=Test Support Request');
  await expect(page.locator('h1')).toContainText('Test Support Request');
  
  // Add comment
  await page.fill('[name="comment"]', 'Additional information about the issue');
  await page.click('button:has-text("Add Comment")');
  await expect(page.locator('text=Additional information')).toBeVisible();
  
  // Verify ticket status
  await expect(page.locator('[data-testid="ticket-status"]')).toContainText('open');
});
```

### 3. Invoice Payment with PayPal Sandbox

**Test File**: `payments.spec.ts`

**Scenarios**:
- User can view unpaid invoices
- User can click "Pay with PayPal" button
- User is redirected to PayPal sandbox
- User completes payment in sandbox
- Invoice status updates to "paid"
- User receives receipt email

**Example Test**:
```typescript
test('invoice payment with PayPal sandbox', async ({ page, context }) => {
  // Login as user
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'client@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Navigate to invoices
  await page.click('text=Invoices');
  await expect(page).toHaveURL('/dashboard/invoices');
  
  // Click on unpaid invoice
  await page.click('text=INV-2024-0001');
  await expect(page.locator('text=Status: Sent')).toBeVisible();
  
  // Click PayPal button
  const [paypalPage] = await Promise.all([
    context.waitForEvent('page'),
    page.click('[data-testid="paypal-button"]')
  ]);
  
  // Wait for PayPal sandbox page
  await paypalPage.waitForLoadState();
  await expect(paypalPage).toHaveURL(/paypal\.com/);
  
  // Complete PayPal sandbox payment
  await paypalPage.fill('[name="login_email"]', 'sb-buyer@example.com');
  await paypalPage.click('button[type="submit"]');
  await paypalPage.fill('[name="login_password"]', 'sandbox123');
  await paypalPage.click('button[type="submit"]');
  await paypalPage.click('button:has-text("Pay Now")');
  
  // Wait for redirect back to portal
  await page.waitForURL(/payment=success/);
  
  // Verify invoice marked as paid
  await expect(page.locator('text=Status: Paid')).toBeVisible();
  await expect(page.locator('[data-testid="payment-date"]')).toBeVisible();
});
```

### 4. Subscription Signup and Cancellation

**Test File**: `subscriptions.spec.ts`

**Scenarios**:
- User can view available service packages
- User can subscribe to a package
- PayPal subscription is created
- User can view active subscriptions
- User can cancel subscription
- Subscription status updates correctly

**Example Test**:
```typescript
test('subscription signup and cancellation', async ({ page, context }) => {
  // Login as user
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'client@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Navigate to services page
  await page.goto('/services');
  
  // Select a service package
  await page.click('text=Basic Support');
  await page.click('button:has-text("Subscribe Monthly")');
  
  // Handle PayPal subscription flow
  const [paypalPage] = await Promise.all([
    context.waitForEvent('page'),
    page.click('button:has-text("Continue to PayPal")')
  ]);
  
  // Complete PayPal subscription
  await paypalPage.waitForLoadState();
  await paypalPage.fill('[name="login_email"]', 'sb-buyer@example.com');
  await paypalPage.click('button[type="submit"]');
  await paypalPage.fill('[name="login_password"]', 'sandbox123');
  await paypalPage.click('button[type="submit"]');
  await paypalPage.click('button:has-text("Agree & Subscribe")');
  
  // Wait for redirect
  await page.waitForURL(/status=success/);
  
  // Navigate to subscriptions page
  await page.click('text=Subscriptions');
  await expect(page).toHaveURL('/dashboard/subscriptions');
  
  // Verify subscription is active
  await expect(page.locator('text=Basic Support')).toBeVisible();
  await expect(page.locator('text=Status: Active')).toBeVisible();
  
  // Cancel subscription
  await page.click('button:has-text("Cancel Subscription")');
  await page.click('button:has-text("Confirm Cancellation")');
  
  // Verify cancellation
  await expect(page.locator('text=Status: Cancelled')).toBeVisible();
});
```

### 5. Document Upload and Access

**Test File**: `documents.spec.ts`

**Scenarios**:
- User can upload documents
- Document appears in list with correct metadata
- User can download documents
- User can delete own documents
- File size validation works
- File type validation works

**Example Test**:
```typescript
test('document upload and access', async ({ page }) => {
  // Login as user
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'client@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Navigate to documents
  await page.click('text=Documents');
  await expect(page).toHaveURL('/dashboard/documents');
  
  // Upload document
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'test-document.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('PDF content here'),
  });
  
  // Wait for upload to complete
  await expect(page.locator('text=Upload successful')).toBeVisible();
  
  // Verify document in list
  await expect(page.locator('text=test-document.pdf')).toBeVisible();
  await expect(page.locator('[data-testid="file-size"]')).toContainText('KB');
  
  // Download document
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Download")')
  ]);
  
  // Verify download
  expect(download.suggestedFilename()).toBe('test-document.pdf');
  
  // Delete document
  await page.click('button:has-text("Delete")');
  await page.click('button:has-text("Confirm")');
  
  // Verify deletion
  await expect(page.locator('text=test-document.pdf')).not.toBeVisible();
});
```

## Running Tests

### Run all E2E tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run tests on specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests on mobile devices
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## Test Data Setup

Before running E2E tests, ensure test data is set up:

1. **Database**: Use test database with seed data
2. **PayPal**: Configure PayPal sandbox accounts
3. **Email**: Use email testing service (e.g., Mailhog, Mailtrap)
4. **Environment**: Set test environment variables

### Test Environment Variables

Create `.env.test`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
PAYPAL_CLIENT_ID=sandbox_client_id
PAYPAL_CLIENT_SECRET=sandbox_secret
PAYPAL_MODE=sandbox
DATABASE_URL=test_database_url
```

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after each test
3. **Waits**: Use explicit waits instead of arbitrary timeouts
4. **Selectors**: Use data-testid attributes for stable selectors
5. **Screenshots**: Take screenshots on failure for debugging
6. **Videos**: Record videos for complex workflows
7. **Parallel**: Run tests in parallel when possible
8. **Retries**: Configure retries for flaky tests in CI

## Troubleshooting

### Test Timeouts
- Increase timeout in playwright.config.ts
- Check for slow network requests
- Verify application is running

### Element Not Found
- Check selector is correct
- Wait for element to be visible
- Verify element exists in DOM

### PayPal Sandbox Issues
- Verify sandbox credentials are correct
- Check PayPal sandbox is accessible
- Ensure webhook URLs are configured

### Authentication Issues
- Clear browser storage between tests
- Verify Clerk test keys are correct
- Check session management

## Test Coverage

E2E tests should cover:
- ✅ User registration and login flow
- ✅ Ticket creation to resolution workflow
- ✅ Invoice payment with PayPal sandbox
- ✅ Subscription signup and cancellation
- ✅ Document upload and access
- ✅ Project viewing and tracking
- ✅ Settings and preferences
- ✅ Mobile responsiveness
- ✅ Cross-browser compatibility

## Reporting

After running tests, view the HTML report:

```bash
npx playwright show-report
```

The report includes:
- Test results (passed/failed)
- Screenshots of failures
- Videos of test runs
- Execution times
- Browser/device information

## Next Steps

1. Implement test files for each scenario
2. Set up test data and fixtures
3. Configure CI/CD pipeline
4. Run tests regularly
5. Monitor and fix flaky tests
6. Expand coverage as needed
