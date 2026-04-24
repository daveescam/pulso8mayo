# Codebase Concerns

**Analysis Date:** 2026-04-23

## Tech Debt

### TODOs Throughout Codebase
- **Count:** 51 TODO comments across TypeScript/TSX files
- **Files affected:** Multiple service files, API routes, components

**High-Priority TODOs:**
- `app/api/users/route.ts:34`: Missing permission check for user creation
- `lib/tenant-context.ts:27`: Tenant access verification not implemented
- `lib/services/notification-service.ts`: Multiple notification integrations stubbed (WasenderAPI, email, database storage)
- `lib/services/notification-dispatcher.ts:225,269,495`: Actual API calls not implemented
- `lib/whatsapp/evidence-processor.ts`: AI analysis, R2 upload, AI verification all TODO
- `app/api/cron/inventory-checks.ts:25`: Schema update needed (inventoryItems vs inventoryProducts)

**Report Generation TODOs:**
- `app/api/reports/generate/route.ts`: Evidence, NOM-251, inventory, labor, KPI, and incident reports all unimplemented
- `app/dashboard/reports/page.tsx:161`: Send functionality not implemented
- `components/labor/attendance-report.tsx:106`: PDF export using jsPDF not implemented

### Monolithic Schema File
- **Issue:** `lib/db/schema.ts` is 1,714 lines
- **Impact:** Difficult to navigate, increases bundle size, merge conflicts likely
- **Fix approach:** Split into domain-specific modules (users/, workflows/, inventory/, labor/)

### Large Service Classes
- `lib/services/ComplianceReportService.ts`: 1,303 lines
- `lib/whatsapp/notification-dispatcher.ts`: 592 lines
- `lib/services/notification-dispatcher.ts`: 511 lines
- `lib/services/whatsapp-notification-service.ts`: 456 lines
- **Risk:** Violates Single Responsibility Principle, hard to test, complex logic

### Type Safety Degradation
- **Count:** 1,985 `any` type usages across codebase
- **Pattern:** Extensive use of `as any` casts
- **Files with frequent casts:**
  - `app/api/imss/*/route.ts`: Employee data casting
  - `app/api/expediente/route.ts`: Document casting
  - `app/api/communications/announcements/route.ts`: Role casting with `as any`
- **Risk:** Runtime errors, lost IntelliSense, refactoring hazards

## Security Considerations

### Missing Permission Checks
- `app/api/users/route.ts:34`: Only TODO comment for permission check
- `app/api/inventory/products/route.ts:31`: "Strict Tenant Check" is TODO
- `app/api/workflows/execute/route.ts:28`: Permission check TODO
- `app/api/reports/overtime/route.ts:58`: Role-based filtering TODO
- **Risk:** Users may access data from other tenants/branches

### In-Memory Rate Limiting
- **Location:** `lib/rate-limiter.ts`
- **Issue:** Uses in-memory Map (not distributed)
- **Risk:** Rate limits don't work across multiple server instances (Vercel deployment)
- **Recommendation:** Use Redis (Upstash) for distributed rate limiting

### Console Logging in Production
- **Count:** 938 console.log/warn/error statements
- **Files:** Middleware, API routes, services
- **Risk:** Information leakage, performance overhead
- **Recommendation:** Replace with structured Pino logging (`lib/logger.ts` exists but underutilized)

### Session Verification Performance
- **Location:** `middleware.ts:20-52`
- **Issue:** Makes HTTP call to `/api/auth/get-session` on EVERY request
- **Impact:** Adds 20-100ms latency per request
- **Comments acknowledge:** "This is called on every authenticated request, which adds latency"
- **Recommendation:** Implement cookie-based JWT verification (see TODO comments in middleware)

### Missing Input Sanitization
- **Pattern:** Search parameters directly interpolated into SQL queries
- **Example:** `app/api/users/route.ts:17-21` - parseInt without validation
- **Risk:** Potential injection if Zod validation is bypassed

## Performance Bottlenecks

### Database Query Efficiency
- `lib/services/employee-service.ts:41`: Search filter uses `ilike` with wildcards on multiple fields
- **Risk:** Full table scans on large datasets
- **Recommendation:** Add PostgreSQL text search indexes or use tsvector

### N+1 Query Patterns
- Multiple services fetch related data in loops
- `lib/services/employee-service.ts`: Fetches profiles, contracts, documents separately
- **Recommendation:** Use Drizzle's `with` syntax for eager loading

### Large Schema Bundle Impact
- `lib/db/schema.ts` imported throughout codebase
- **Impact:** Serverless functions include entire schema
- **Recommendation:** Split schema and use barrel exports for tree-shaking

### Middleware Session Verification
- **Impact:** Every request triggers fetch call
- **Scale concern:** High-traffic endpoints will bottleneck
- **See:** Comments in `middleware.ts:10-15`

## Fragile Areas

### Incomplete Notification System
- **Files:** `lib/services/notification-service.ts`, `lib/services/notification-dispatcher.ts`
- **State:** Core notification infrastructure exists but integrations are TODO
- **Risk:** Features depending on notifications silently fail
- **Safe modification:** Implement notification queue before adding features

### WhatsApp Integration Gaps
- **Location:** `lib/whatsapp/*`
- **Issues:**
  - `wasender-client.ts`: API key warnings logged but not enforced
  - `evidence-processor.ts`: Multiple TODOs for AI and upload
  - `notification-dispatcher.ts`: WasenderAPI integration stubbed
- **Risk:** Workflow WhatsApp features appear to work but don't send messages

### Incomplete Cron Jobs
- **Location:** `lib/cron/inventory-checks.ts:25`
- **Issue:** Schema references outdated table names
- **Risk:** Cron job may fail or produce incorrect results

### Workflow Type Safety
- **Files:** `app/dashboard/workflows/[id]/execute/page.tsx:38`, `app/workflow/public/[token]/page.tsx:44`
- **Pattern:** `steps as any[]` - TODO comments acknowledge type issues
- **Risk:** Runtime errors in workflow execution

### Shift Service Complexity
- **Location:** `lib/services/shift-service.ts`
- **Lines:** 407 lines with geolocation calculations, session management, break tracking
- **Risk:** Difficult to modify without breaking attendance tracking
- **Test coverage:** None (see Testing section)

## Dependencies at Risk

### Beta Dependency
- **Package:** `workflow` 4.1.0-beta.52
- **Risk:** Breaking changes in stable release, API instability
- **Recommendation:** Pin version or monitor for GA release

### Outdated JSON Web Token Library
- **Package:** `jsonwebtoken` ^9.0.3
- **Alternative:** Already using `better-auth` - consider removing direct JWT dependency
- **Risk:** Redundant dependency, potential version conflicts

### AWS SDK Version
- **Package:** `@aws-sdk/client-s3` ^3.1029.0
- **Note:** Version 3.x is current, but individual package versions may drift
- **Recommendation:** Use SDK v3 consistently across all AWS packages

## Test Coverage Gaps

### Critical Untested Areas
| Area | Risk Level | Files | Notes |
|------|------------|-------|-------|
| Service Layer | **Critical** | `lib/services/*.ts` (15+ files) | Zero unit tests |
| Workflow Engine | **Critical** | `lib/services/workflow-*-service.ts` | Complex state machine, no tests |
| Compliance Calculations | **Critical** | `lib/services/labor-calculator.ts`, `lib/reports/*` | Legal requirements, untested |
| RBAC Permissions | **High** | `lib/rbac/permissions.ts`, `lib/permissions.ts` | Security boundary, no tests |
| API Routes | **High** | `app/api/*/route.ts` (50+ files) | Only one test file (`tests/api/users.spec.ts`) |
| Shift Management | **High** | `lib/services/shift-service.ts` | Attendance tracking, untested |
| WhatsApp Handlers | **Medium** | `lib/whatsapp/handlers/*.ts` | External integration, mocked? |
| Break Compliance | **High** | `lib/services/break-management-service.ts` | Legal compliance, untested |

### Test File Count
- **Total:** 4 test files
- **E2E tests:** 3 files (mostly redirect/401 checks)
- **API tests:** 1 file (single 401 test)
- **Unit tests:** 0 files

### Missing Testing Framework
- **Issue:** No unit testing framework configured
- **Recommendation:** Add Vitest for service layer testing
- **Current:** Only Playwright E2E configured

### No Mocking Strategy
- **Issue:** No MSW or manual mocks detected
- **Risk:** Cannot test services in isolation
- **Impact:** E2E tests require full database setup

## Missing Critical Features

### Reporting Engine
- **Status:** Multiple report types TODO
- **Files:** `app/api/reports/*/route.ts`
- **Impact:** Cannot generate compliance reports (NOM-251, NOM-035, labor law)

### Email Notifications
- **Status:** Resend configured but not integrated
- **Files:** `lib/services/notification-service.ts:269`, `app/api/branches/invite-manager/route.ts`
- **Note:** Invite manager email is implemented, but general notifications are TODO

### Document AI Verification
- **Status:** TODO in evidence processor
- **File:** `lib/whatsapp/evidence-processor.ts:43,145`

### Attendance Table
- **Status:** Referenced but not implemented
- **File:** `lib/services/employee-service.ts:279`
- **TODO:** "Implement attendance table and fetching logic"

## Code Quality Issues

### Error Handling Inconsistency
- **Pattern:** Some services throw, others return error objects
- **Example:** `shift-service.ts` throws Error vs `employee-service.ts` uses ApiError
- **Recommendation:** Standardize on ApiError pattern

### Commented Code
- **Pattern:** Large blocks of commented code in several files
- **Files:** `lib/services/ComplianceReportService.ts` has commented digital signature logic

### Mixed Async Patterns
- **Pattern:** Some files use `.then()`, others use `async/await`
- **Recommendation:** Standardize on async/await

### Import Organization
- **Issue:** Inconsistent import ordering (not grouped by type)
- **Recommendation:** Use ESLint import/order rule

## Recommended Priority Actions

### Immediate (This Sprint)
1. **Add tenant permission checks** to `app/api/users/route.ts` and `app/api/inventory/products/route.ts`
2. **Remove console.log** from middleware production paths
3. **Fix inventory cron job** schema references
4. **Add basic service tests** for `EmployeeService` and `ShiftService`

### Short-term (Next 2 Sprints)
1. **Implement JWT session verification** in middleware (eliminate HTTP call)
2. **Split schema.ts** into domain modules
3. **Add notification service implementations** or remove feature flags
4. **Add RBAC test coverage**

### Medium-term (Next Quarter)
1. **Implement missing report types**
2. **Add distributed rate limiting** via Redis
3. **Refactor large service classes** (ComplianceReportService)
4. **Add compliance calculation tests** (critical for legal requirements)

---

*Concerns audit: 2026-04-23*
