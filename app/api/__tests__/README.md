# API Integration Tests

This directory contains integration tests for the API routes in the Tech Support Client Portal.

## Overview

Integration tests verify that API routes work correctly with their dependencies (database, external services, etc.) by mocking those dependencies and testing the complete request/response flow.

## Test Files

- **tickets.integration.test.ts**: Tests for ticket creation and GitHub integration
- **invoices.integration.test.ts**: Tests for invoice creation and payment flow
- **documents.integration.test.ts**: Tests for document upload and download
- **subscriptions.integration.test.ts**: Tests for subscription creation and management

## Running Tests

### Run all integration tests
```bash
npm test app/api/__tests__
```

### Run specific test file
```bash
npm test app/api/__tests__/tickets.integration.test.ts
```

### Run with coverage
```bash
npm run test:coverage -- app/api/__tests__
```

### Run in watch mode
```bash
npm run test:watch app/api/__tests__
```

## Test Structure

Each test file follows this pattern:

1. **Mock Setup**: Mock external dependencies (Clerk auth, Cloudflare context, external APIs)
2. **Test Cases**: Organized by HTTP method (GET, POST, etc.)
3. **Assertions**: Verify response status, data structure, and side effects

### Example Test Structure

```typescript
describe('API Route Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks and set up test environment
  });

  describe('GET /api/resource', () => {
    it('should return unauthorized when not authenticated', async () => {
      // Test authentication
    });

    it('should fetch resources successfully', async () => {
      // Test successful retrieval
    });
  });

  describe('POST /api/resource', () => {
    it('should create resource successfully', async () => {
      // Test successful creation
    });

    it('should validate input data', async () => {
      // Test validation
    });
  });
});
```

## Mocking Strategy

### Clerk Authentication
```typescript
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// In test
(auth as any).mockResolvedValue({ userId: 'user_123' });
```

### Cloudflare Context
```typescript
vi.mock('@cloudflare/next-on-pages', () => ({
  getRequestContext: vi.fn(),
}));

// In test
(getRequestContext as any).mockReturnValue({ env: mockEnv });
```

### Database (D1)
```typescript
const mockDb = {
  prepare: vi.fn((query: string) => ({
    bind: vi.fn((...args: any[]) => ({
      first: vi.fn(() => Promise.resolve(mockData)),
      all: vi.fn(() => Promise.resolve({ results: mockArray })),
      run: vi.fn(() => Promise.resolve({ success: true })),
    })),
  })),
};
```

### External APIs
```typescript
vi.mock('@/lib/github', () => ({
  createGitHubIssue: vi.fn(),
}));

// In test
(createGitHubIssue as any).mockResolvedValue({ number: 42, html_url: '...' });
```

## Test Coverage Goals

- **API Routes**: 80%+ coverage
- **Success Paths**: All happy paths tested
- **Error Handling**: Authentication, validation, and error responses tested
- **Integration Points**: External service interactions verified

## Key Test Scenarios

### Tickets API
- ✅ Create ticket with GitHub issue creation
- ✅ List tickets with filtering
- ✅ Send email notifications
- ✅ Validate ticket data

### Invoices API
- ✅ Create invoice with line items
- ✅ Calculate totals correctly
- ✅ Generate sequential invoice numbers
- ✅ Filter invoices by status and date

### Documents API
- ✅ Upload documents to R2
- ✅ Validate file size and type
- ✅ Associate documents with projects
- ✅ Log upload activity

### Subscriptions API
- ✅ Create PayPal subscriptions
- ✅ Prevent duplicate subscriptions
- ✅ Validate billing cycles
- ✅ Fetch user subscriptions

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external dependencies to avoid network calls and database changes
3. **Assertions**: Test both success and failure scenarios
4. **Cleanup**: Use `beforeEach` to reset mocks and test state
5. **Descriptive Names**: Use clear test names that describe what is being tested

## Debugging Tests

### View detailed output
```bash
npm test -- --reporter=verbose
```

### Run single test
```bash
npm test -- -t "should create ticket successfully"
```

### Debug with breakpoints
```bash
node --inspect-brk node_modules/.bin/vitest run
```

## CI/CD Integration

These tests should run in the CI/CD pipeline before deployment:

```yaml
- name: Run integration tests
  run: npm test app/api/__tests__
  
- name: Check coverage
  run: npm run test:coverage -- app/api/__tests__
```

## Future Enhancements

- Add tests for webhook handlers (PayPal, GitHub, Clerk)
- Add tests for admin-only routes
- Add tests for payment capture flow
- Add performance benchmarks for API routes
- Add tests for rate limiting and security features

## Troubleshooting

### Mock not working
- Ensure mock is defined before importing the module
- Check that mock path matches the actual import path
- Verify mock is reset in `beforeEach`

### Test timeout
- Increase timeout in vitest.config.ts
- Check for unresolved promises
- Verify all async operations are awaited

### Type errors
- Ensure TypeScript types are correct for mocked functions
- Use `as any` for complex mock scenarios
- Check that mock return values match expected types
