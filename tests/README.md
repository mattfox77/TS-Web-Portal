# Testing Documentation

This directory contains all testing documentation and resources for the Tech Support Client Portal.

## Overview

The testing strategy includes multiple layers:
1. **Unit Tests** - Testing individual functions and utilities
2. **Integration Tests** - Testing API routes with mocked dependencies
3. **End-to-End Tests** - Testing complete user workflows
4. **Security Tests** - Testing security vulnerabilities and protections
5. **Manual Tests** - Comprehensive manual testing checklist

## Directory Structure

```
tests/
├── README.md                           # This file
├── e2e/                                # End-to-end tests
│   └── README.md                       # E2E testing guide with Playwright
├── security/                           # Security testing
│   └── README.md                       # Security testing guide and checklist
└── manual/                             # Manual testing
    └── TESTING_CHECKLIST.md            # Comprehensive manual testing checklist
```

## Quick Start

### Run Unit Tests
```bash
npm test lib/__tests__
```

### Run Integration Tests
```bash
npm test app/api/__tests__
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## Test Coverage

### Current Coverage

#### Unit Tests (lib/__tests__)
- ✅ Pricing calculations (`lib/__tests__/pricing.test.ts`)
- ✅ Email template generation (`lib/__tests__/email.test.ts`)
- ✅ Validation schemas (`lib/__tests__/validation.test.ts`)

#### Integration Tests (app/api/__tests__)
- ✅ Tickets API (`app/api/__tests__/tickets.integration.test.ts`)
  - Ticket creation
  - GitHub integration
  - Email notifications
  - Filtering and pagination
- ✅ Invoices API (`app/api/__tests__/invoices.integration.test.ts`)
  - Invoice creation
  - Total calculations
  - Sequential numbering
  - Payment flow
- ✅ Documents API (`app/api/__tests__/documents.integration.test.ts`)
  - Document upload
  - File validation
  - Download with pre-signed URLs
  - Activity logging
- ✅ Subscriptions API (`app/api/__tests__/subscriptions.integration.test.ts`)
  - Subscription creation
  - PayPal integration
  - Duplicate prevention
  - Status management

### Coverage Goals
- Unit Tests: 90%+
- Integration Tests: 80%+
- E2E Tests: Critical user flows
- Security Tests: All OWASP Top 10

## Testing Guidelines

### Unit Tests
- Test individual functions in isolation
- Mock external dependencies
- Focus on edge cases and error handling
- Keep tests fast and independent

### Integration Tests
- Test API routes with mocked dependencies
- Verify request/response flow
- Test authentication and authorization
- Test error handling and validation

### End-to-End Tests
- Test complete user workflows
- Use real browser interactions
- Test across multiple browsers and devices
- Verify email notifications

### Security Tests
- Test authentication and authorization
- Verify data isolation
- Test input validation
- Check for common vulnerabilities (SQL injection, XSS, CSRF)

### Manual Tests
- Follow comprehensive checklist
- Test on multiple browsers
- Test on mobile devices
- Verify email notifications
- Test accessibility

## Test Data

### Test Accounts

#### Client User
- Email: `client@example.com`
- Password: `TestPass123!`
- Client: Test Company Inc.

#### Admin User
- Email: `admin@example.com`
- Password: `AdminPass123!`
- Role: Admin

### Test Database
Use the test database with seed data:
```bash
npm run db:seed:local
```

### PayPal Sandbox
Configure PayPal sandbox accounts in `.env.test`:
```
PAYPAL_CLIENT_ID=sandbox_client_id
PAYPAL_CLIENT_SECRET=sandbox_secret
PAYPAL_MODE=sandbox
```

## Continuous Integration

Tests run automatically on:
- Every push to main branch
- Every pull request
- Scheduled nightly builds

### GitHub Actions Workflow
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Debugging Tests

### View Detailed Output
```bash
npm test -- --reporter=verbose
```

### Run Single Test
```bash
npm test -- -t "should create ticket successfully"
```

### Debug with Breakpoints
```bash
node --inspect-brk node_modules/.bin/vitest run
```

## Best Practices

1. **Write Tests First** - TDD approach when possible
2. **Keep Tests Independent** - No dependencies between tests
3. **Use Descriptive Names** - Test names should describe what is being tested
4. **Mock External Services** - Don't make real API calls in tests
5. **Clean Up After Tests** - Reset state and mocks
6. **Test Error Cases** - Don't just test happy paths
7. **Keep Tests Fast** - Slow tests won't be run
8. **Maintain Tests** - Update tests when code changes

## Troubleshooting

### Tests Failing Locally
1. Ensure dependencies are installed: `npm ci`
2. Check environment variables are set
3. Verify test database is seeded
4. Clear test cache: `npm test -- --clearCache`

### Tests Passing Locally but Failing in CI
1. Check CI environment variables
2. Verify Node version matches
3. Check for timing issues (add waits)
4. Review CI logs for specific errors

### Flaky Tests
1. Identify the flaky test
2. Add explicit waits instead of arbitrary timeouts
3. Ensure proper cleanup between tests
4. Check for race conditions
5. Consider increasing timeout for slow operations

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

## Contributing

When adding new features:
1. Write unit tests for new utility functions
2. Write integration tests for new API routes
3. Update E2E tests if user workflows change
4. Update manual testing checklist
5. Ensure all tests pass before submitting PR

## Test Reports

### View HTML Report
```bash
npm run test:coverage
open coverage/index.html
```

### View Playwright Report
```bash
npx playwright show-report
```

## Next Steps

1. ✅ Unit tests for utility functions
2. ✅ Integration tests for API routes
3. ✅ E2E testing guide and examples
4. ✅ Security testing guide and checklist
5. ✅ Manual testing checklist
6. ⏳ Implement E2E tests with Playwright
7. ⏳ Set up CI/CD pipeline
8. ⏳ Configure automated security scanning
9. ⏳ Establish test coverage thresholds
10. ⏳ Create test data fixtures

## Support

For questions or issues with testing:
- Check this documentation
- Review test examples in codebase
- Ask in team chat
- Create issue in project repository
