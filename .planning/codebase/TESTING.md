# Testing Patterns

**Analysis Date:** 2026-04-23

## Test Framework

### Runner

**Playwright** (v1.x implied by config)
- Config: `playwright.config.ts`
- Test directory: `./tests`
- Reporter: HTML

### Run Commands

```bash
# Run all E2E tests
pnpm test:e2e
# or
playwright test

# Tests auto-start dev server via webServer config
```

### Configuration Highlights

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,              // Run tests in parallel
  forbidOnly: !!process.env.CI,      // Fail on test.only in CI
  retries: process.env.CI ? 2 : 0,   // Retry on CI only
  workers: process.env.CI ? 1 : undefined,  // Single worker on CI
  reporter: 'html',                  // HTML test report
  
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',         // Capture trace on retries
  },
  
  // Chromium only (webkit/safari commented out for MVP)
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  
  // Auto-starts dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## Test File Organization

### Location

```
tests/
├── api/
│   └── users.spec.ts          # API endpoint tests
└── e2e/
    ├── auth.spec.ts           # Authentication flow tests
    ├── compliance.spec.ts     # Compliance dashboard tests
    └── workflows.spec.ts      # Workflow navigation tests
```

### Naming Pattern

- Test files: `*.spec.ts` (Playwright convention)
- Co-located with test type: `e2e/` vs `api/`

### Structure

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should load login page', async ({ page }) => { });
  test('should show validation errors on empty submit', async ({ page }) => { });
});
```

## Test Patterns

### E2E Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something specific', async ({ page, request }) => {
    // Arrange
    await page.goto('/path');
    
    // Act
    await page.getByRole('button', { name: /Submit/i }).click();
    
    // Assert
    await expect(page).toHaveURL(/.*\/expected-path.*/);
    await expect(page.getByRole('heading')).toBeVisible();
  });
});
```

### API Test Pattern

```typescript
// tests/api/users.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Users API', () => {
  test('should return 401 Unauthorized without session', async ({ request }) => {
    const response = await request.get('/api/users');
    expect(response.status()).toBe(401);
  });
});
```

### Authentication Testing Pattern

```typescript
// Unauthenticated access test
test('should redirect unauthenticated users to login', async ({ page }) => {
  await page.goto('/dashboard/protected-route');
  await expect(page).toHaveURL(/.*\/sign-in.*/);
});

// Note: Actual login tests require seeded test users
// Comments indicate: "This is a basic test that verifies the page loads correctly"
```

### Protected Route Testing

```typescript
// Tests verify redirect behavior for auth-protected routes
test('should redirect when accessing workflows', async ({ page }) => {
  await page.goto('/dashboard/workflows');
  await expect(page).toHaveURL(/.*\/sign-in.*/);
});
```

## Testing Strategy

### Current Coverage

| Area | Status | Test File |
|------|--------|-----------|
| Authentication (basic) | Partial | `tests/e2e/auth.spec.ts` |
| Compliance (redirects) | Minimal | `tests/e2e/compliance.spec.ts` |
| Workflows (redirects) | Minimal | `tests/e2e/workflows.spec.ts` |
| Users API (401 check) | Minimal | `tests/api/users.spec.ts` |
| Service layer | None | Not tested |
| Component unit tests | None | Not configured |

### What Tests Cover

**Authentication Flow (`tests/e2e/auth.spec.ts`):**
- Page load verification (title, heading visibility)
- Basic validation (form submission without data)
- Note: "Actual login test with credentials should use a seeded test user"

**Compliance Dashboard (`tests/e2e/compliance.spec.ts`):**
- Unauthenticated redirect to login

**Workflows Navigation (`tests/e2e/workflows.spec.ts`):**
- Protected route redirect behavior
- Comment: "In a real E2E environment, you would use global setup for auth state"

**Users API (`tests/api/users.spec.ts`):**
- Single test: 401 response without session

## Mocking

### Framework

**Not implemented.** No mocking framework detected in:
- No MSW (Mock Service Worker) configuration
- No manual mocks in `__mocks__` directories
- No test-specific mock utilities

### Opportunities

For future unit/integration testing:
```typescript
// Recommended: Mock service layer for API tests
const mockEmployeeService = {
  listEmployees: jest.fn().mockResolvedValue({ data: [], meta: {} }),
};

// Mock better-auth for session handling
const mockSession = {
  user: { id: 'test-user', companyId: 'test-company', role: 'ADMIN' }
};
```

## Test Data

### Fixtures

**No dedicated fixtures.** Test data should be created via:
1. Seeded database state (mentioned in comments)
2. API calls to create test records
3. Direct database insertion (for integration tests)

### Recommended Fixture Pattern

```typescript
// tests/fixtures/users.ts
export const createTestUser = async (overrides = {}) => ({
  name: 'Test User',
  email: 'test@example.com',
  role: 'EMPLEADO',
  ...overrides
});

// tests/fixtures/companies.ts
export const createTestCompany = async (overrides = {}) => ({
  name: 'Test Company',
  taxId: 'TEST123',
  ...overrides
});
```

## Coverage

### Requirements

**None enforced.** No coverage thresholds configured in:
- `package.json` (no coverage script)
- `playwright.config.ts` (no coverage settings)
- CI configuration (not detected)

### Coverage Gaps

| Area | Risk | Priority |
|------|------|----------|
| Service layer business logic | High - All services untested | High |
| API route handlers | High - Most endpoints untested | High |
| Authentication flows | Medium - Basic coverage only | Medium |
| Role-based access control | High - RBAC logic untested | High |
| Workflow execution engine | High - Complex state machine | High |
| Compliance calculations | Critical - Legal requirements | Critical |
| WhatsApp integration | Medium - External service | Medium |
| Database transactions | High - Data integrity | High |
| Form validation (Zod) | Low - Zod handles this | Low |
| UI components | Low - Manual testing acceptable | Low |

## Test Types

### Unit Tests

**Not configured.** No unit testing framework present:
- No Jest, Vitest, or similar
- No test runner for isolated function tests
- Recommendation: Add Vitest for service layer testing

### Integration Tests

**Partial via Playwright E2E.** Tests full request/response cycle but not:
- Database layer in isolation
- Service method logic
- Internal function behavior

### E2E Tests

**Configured but minimal.** Current E2E tests:
- Verify page loads
- Check redirect behavior
- Do NOT test happy-path workflows
- Do NOT test data mutation
- Do NOT test complex user journeys

## Recommendations

### High Priority

1. **Add unit testing framework** (Vitest recommended)
   ```bash
   pnpm add -D vitest @vitest/ui
   ```

2. **Add service layer tests**
   - Test `EmployeeService`, `WorkflowExecutionService`, etc.
   - Mock database layer with `drizzle-orm` test utilities

3. **Add API integration tests**
   - Test authenticated CRUD operations
   - Test error handling paths
   - Test validation failures

4. **Add RBAC tests**
   - Each role's access to resources
   - Permission boundary tests

### Medium Priority

1. **Add global authentication setup**
   ```typescript
   // playwright.config.ts
   globalSetup: require.resolve('./tests/global-setup'),
   ```

2. **Add test fixtures and factories**
   - Database seeding utilities
   - Test data builders

3. **Add component story tests** (Storybook optional)

### Low Priority

1. **Add API contract tests** (if external integrations)
2. **Add load tests** for cron jobs and background tasks

## Environment Variables for Testing

```bash
# Required for E2E tests
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000

# Test database (separate from dev/prod)
DATABASE_URL=postgresql://test:test@localhost/pulso_test

# Disable Sentry in tests
SENTRY_DSN=
```

## CI/CD Testing

### Current State

No CI configuration detected. Recommend adding:

```yaml
# .github/workflows/test.yml
- name: Run E2E tests
  run: pnpm test:e2e
  env:
    PLAYWRIGHT_TEST_BASE_URL: http://localhost:3000
```

---

*Testing analysis: 2026-04-23*
