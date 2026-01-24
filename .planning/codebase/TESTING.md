# Testing Patterns

**Analysis Date:** 2026-01-25

## Test Framework

**Runner:**

- Vitest `^4.0.18`
- Config: `/Users/shikun/Developer/opensource/sql-pro/apps/electron/vitest.config.ts`

**Assertion Library:**

- Vitest's built-in `expect` (compatible with Jest syntax).
- `@testing-library/jest-dom` for DOM assertions in React components.

**Run Commands:**

```bash
pnpm test              # Run all tests (via `nx run @sqlpro/app:test`)
pnpm test:run          # Run all tests once (via `vitest run`)
pnpm test:coverage     # Run tests with coverage (via `vitest run --coverage`)
pnpm test:ui           # Run tests with UI (via `vitest --ui`)
```

## Test File Organization

**Location:**

- Co-located with the source files they test.
- Examples: `apps/electron/src/renderer/src/stores/query-history-store.test.ts`
- Separate `test/` directory for setup files: `test/setup.ts`

**Naming:**

- `*.test.{ts,tsx}`

**Structure:**

```
[project-root]/
├── apps/
│   └── electron/
│       └── src/
│           └── renderer/
│               └── src/
│                   └── stores/
│                       └── query-history-store.test.ts # Example test file
├── test/
│   └── setup.ts                                       # Test setup file
```

## Test Structure

**Suite Organization:**

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', () => {
    // Test logic
    expect(true).toBe(true);
  });

  it('should do something else', () => {
    // Another test logic
  });
});
```

**Patterns:**

- **Setup pattern:** `beforeEach` is used for resetting states or mocking before individual tests.
- **Teardown pattern:** Not explicitly observed, but Vitest automatically cleans up mocks by default.
- **Assertion pattern:** `expect(value).matcher(expected)`.

## Mocking

**Framework:** Vitest's built-in `vi`.

**Patterns:**

```typescript
import { vi } from 'vitest';

// Mocking a module
vi.mock('some-module', () => ({
  default: vi.fn(),
}));

// Mocking functions
const mockFn = vi.fn();
// ...
expect(mockFn).toHaveBeenCalledWith('arg');
```

**What to Mock:**

- External dependencies, API calls, time-sensitive functions, or any component that makes tests non-deterministic or slow.

**What NOT to Mock:**

- Core logic of the unit under test.

## Fixtures and Factories

**Test Data:**

- Test data is often defined inline within `describe` or `it` blocks for specific test cases.
- Example from `query-history-store.test.ts`:
  ```typescript
  const MOCK_QUERY_HISTORY = [
    {
      id: '1',
      query: 'SELECT * FROM users;',
      status: 'success',
      timestamp: new Date(),
      dbPath: '/test/db.sqlite',
    },
  ];
  ```

**Location:**

- Inline or locally defined within test files. No dedicated global fixture directories were detected.

## Coverage

**Requirements:**

- The `vitest.config.ts` specifies coverage collection.
- `provider: 'v8'`
- `reporter: ['text', 'text-summary', 'html']`
- **Include patterns:** `src/renderer/src/**/*.{ts,tsx}`
- **Exclude patterns:** Test files themselves, declaration files, `main.tsx`, `routeTree.gen.ts`.

**View Coverage:**

```bash
pnpm test:coverage
```

## Test Types

**Unit Tests:**

- Focus on isolated logic, such as store functionalities (e.g., `apps/electron/src/renderer/src/stores/query-history-store.test.ts`).
- Uses `vitest` with `happy-dom` environment for UI-less tests.

**Integration Tests:**

- Not explicitly defined or categorized, but component tests that interact with multiple parts of the UI or simple hooks could be considered integration tests.

**E2E Tests:**

- `playwright` is listed as a dev dependency in `apps/electron/package.json`, suggesting potential for E2E tests, but no explicit E2E test files were identified within the main `apps/electron` test includes. `tsx scripts/capture-screenshots.ts` might be related.

## Common Patterns

**Async Testing:**

```typescript
it('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

- Vitest handles promises naturally; `async/await` syntax is used.

**Error Testing:**

```typescript
it('should throw an error', () => {
  expect(() => {
    throw new Error('Test error');
  }).toThrow('Test error');
});
```

- `toThrow` matcher is used for testing errors.

---

_Testing analysis: 2026-01-25_
