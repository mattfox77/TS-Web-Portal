# Unit Tests

This directory contains unit tests for the utility functions in the `lib/` directory.

## Setup

Before running tests, install the required dependencies:

```bash
npm install
```

## Running Tests

### Run all tests once
```bash
npm test
```

### Run tests in watch mode (re-runs on file changes)
```bash
npm run test:watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Files

- **pricing.test.ts**: Tests for API usage cost calculations and aggregations
- **validation.test.ts**: Tests for input validation schemas and sanitization
- **email.test.ts**: Tests for email template generation

## Coverage Goals

- Utility functions: 90%+
- API route handlers: 80%+
- React components: 70%+

## Writing New Tests

When adding new utility functions, create corresponding test files following these patterns:

1. Use descriptive test names that explain what is being tested
2. Test both success and failure cases
3. Test edge cases (empty inputs, null values, large numbers, etc.)
4. Use `describe` blocks to group related tests
5. Keep tests focused and independent

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../my-module';

describe('myFunction', () => {
  it('should return expected result for valid input', () => {
    const result = myFunction('valid input');
    expect(result).toBe('expected output');
  });

  it('should handle edge case', () => {
    const result = myFunction('');
    expect(result).toBe('default value');
  });
});
```

## Mocking

For tests that require external dependencies (database, APIs, etc.), use Vitest's mocking capabilities:

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('../external-service', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mocked' })),
}));
```

## CI/CD Integration

Tests should be run as part of the CI/CD pipeline before deployment:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```
