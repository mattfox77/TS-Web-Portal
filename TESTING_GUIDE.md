# Testing Guide

This document provides comprehensive information about testing the Tech Support Client Portal application.

## Overview

The application uses **Vitest** as the testing framework with the following test types:
- **Unit Tests**: Test individual functions and utilities
- **Integration Tests**: Test API routes and database interactions (to be implemented)
- **End-to-End Tests**: Test complete user workflows (to be implemented)

## Prerequisites

### Install Dependencies

```bash
npm install
```

This will install all required testing dependencies including:
- `vitest`: Test framework
- `@vitest/ui`: Interactive test UI
- `@vitest/coverage-v8`: Code coverage reporting
- `@testing-library/react`: React component testing utilities
- `@testing-library/jest-dom`: DOM matchers
- `happy-dom`: Lightweight DOM implementation

### Node.js Version

Ensure you have Node.js 18.17.0 or higher installed (as specified in `.node-version`).

## Running Tests

### Quick Start

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Test Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once and exit |
| `npm run test:watch` | Run tests in watch mode (re-runs on file changes) |
| `npm run test:ui` | Open interactive test UI in browser |
| `npm run test:coverage` | Generate code coverage report |

## Test Structure

### Unit Tests

Located in `lib/__tests__/`, these tests cover utility functions:

#### Pricing Tests (`lib/__tests__/pricing.test.ts`)
- ✅ Token cost calculations for various AI providers
- ✅ Cost formatting
- ✅ Usage aggregation by provider, model, and date
- ✅ Edge cases (unknown providers, zero tokens, large numbers)

**Coverage**: 100% of pricing utility functions

#### Validation Tests (`lib/__tests__/validation.test.ts`)
- ✅ Zod schema validation for all input types
- ✅ Ticket, invoice, project, and client schemas
- ✅ Input sanitization functions
- ✅ Error handling and validation error formatting

**Coverage**: 100% of validation utility functions

#### Email Template Tests (`lib/__tests__/email.test.ts`)
- ✅ Email template generation for all notification types
- ✅ Ticket creation emails
- ✅ Invoice and payment receipt emails
- ✅ Subscription lifecycle emails (activated, cancelled, renewal reminders, payment failed)
- ✅ Template structure validation (subject, HTML, text)

**Coverage**: 100% of email template functions

### Integration Tests (To Be Implemented)

Integration tests will cover API routes and database interactions:

```typescript
// Example: tests/integration/tickets.test.ts
describe('Ticket API', () => {
  it('should create ticket and GitHub issue', async () => {
    // Test POST /api/tickets
    // Verify ticket created in D1
    // Verify GitHub issue created
    // Verify email sent
  });
});
```

### End-to-End Tests (To Be Implemented)

E2E tests will use Playwright to test complete user workflows:

```typescript
// Example: tests/e2e/invoice-payment.spec.ts
test('complete invoice payment flow', async ({ page }) => {
  // Login as user
  // Navigate to invoices
  // Click on unpaid invoice
  // Complete PayPal payment
  // Verify invoice marked as paid
});
```

## Test Configuration

### Vitest Config (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Setup File (`vitest.setup.ts`)

- Configures test environment
- Sets up cleanup after each test
- Mocks environment variables

## Writing Tests

### Best Practices

1. **Descriptive Test Names**: Use clear, descriptive names that explain what is being tested
   ```typescript
   it('should calculate cost correctly for OpenAI GPT-4', () => {
     // Test implementation
   });
   ```

2. **Arrange-Act-Assert Pattern**:
   ```typescript
   it('should validate valid ticket data', () => {
     // Arrange: Set up test data
     const validData = { title: 'Test', description: 'Description', priority: 'medium' };
     
     // Act: Execute the function
     const result = createTicketSchema.parse(validData);
     
     // Assert: Verify the result
     expect(result).toEqual(validData);
   });
   ```

3. **Test Edge Cases**: Always test boundary conditions
   - Empty inputs
   - Null/undefined values
   - Very large numbers
   - Invalid data types

4. **Keep Tests Independent**: Each test should be able to run in isolation

5. **Use Descriptive Assertions**:
   ```typescript
   expect(result).toBe(expected);
   expect(array).toHaveLength(3);
   expect(object).toHaveProperty('key');
   expect(string).toContain('substring');
   ```

### Example Test File

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../my-module';

describe('myFunction', () => {
  describe('with valid input', () => {
    it('should return expected result', () => {
      const result = myFunction('valid');
      expect(result).toBe('expected');
    });
  });

  describe('with invalid input', () => {
    it('should throw error', () => {
      expect(() => myFunction('invalid')).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = myFunction('');
      expect(result).toBe('default');
    });
  });
});
```

## Code Coverage

### Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Utility Functions | 90%+ |
| API Route Handlers | 80%+ |
| React Components | 70%+ |

### Viewing Coverage Reports

After running `npm run test:coverage`, open the HTML report:

```bash
open coverage/index.html
```

The report shows:
- Line coverage
- Branch coverage
- Function coverage
- Uncovered lines highlighted in red

### Improving Coverage

1. Identify uncovered lines in the coverage report
2. Add tests for those code paths
3. Focus on critical business logic first
4. Don't aim for 100% coverage on trivial code

## Mocking

### Mocking Modules

```typescript
import { vi } from 'vitest';

vi.mock('../external-service', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mocked' })),
}));
```

### Mocking Environment Variables

```typescript
import { beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  process.env.TEST_VAR = 'test-value';
});

afterEach(() => {
  delete process.env.TEST_VAR;
});
```

### Mocking Cloudflare Bindings

For tests that require D1 or R2:

```typescript
const mockDB = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({
      first: vi.fn(() => Promise.resolve({ id: '123' })),
      all: vi.fn(() => Promise.resolve({ results: [] })),
    })),
  })),
};

const mockEnv = {
  DB: mockDB,
  DOCUMENTS: mockR2Bucket,
};
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Troubleshooting

### Tests Not Running

1. Ensure Node.js is installed: `node --version`
2. Install dependencies: `npm install`
3. Check for syntax errors in test files

### Import Errors

If you see module resolution errors:
1. Check `vitest.config.ts` alias configuration
2. Ensure `tsconfig.json` paths match
3. Verify file extensions are correct

### Slow Tests

1. Use `test.concurrent` for independent tests
2. Mock external API calls
3. Use in-memory database for integration tests

### Coverage Not Generated

1. Ensure `@vitest/coverage-v8` is installed
2. Check `vitest.config.ts` coverage configuration
3. Run with `--coverage` flag explicitly

## Next Steps

### Immediate Tasks

1. ✅ Unit tests for utility functions (COMPLETED)
2. ⏳ Integration tests for API routes
3. ⏳ End-to-end tests for user workflows
4. ⏳ Security testing
5. ⏳ Manual testing checklist

### Future Enhancements

- Add visual regression testing with Percy or Chromatic
- Implement performance testing with k6
- Add accessibility testing with axe-core
- Set up mutation testing with Stryker

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Test-Driven Development Guide](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

## Support

For questions or issues with testing:
1. Check this guide first
2. Review existing test files for examples
3. Consult Vitest documentation
4. Ask the development team

---

**Note**: This is a living document. Update it as testing practices evolve.
