# Coding Conventions

**Analysis Date:** 2026-04-23

## Naming Patterns

### Files

- **Components:** PascalCase with kebab-case directory names
  - UI components: `components/ui/button.tsx`
  - Feature components: `components/labor/schedule-builder.tsx`
  - Pattern: `[feature]/[component-name].tsx`

- **Services:** kebab-case files with PascalCase classes
  - `lib/services/employee-service.ts` exports `class EmployeeService`
  - `lib/services/user-service.ts` exports `class UserService`

- **Routes:** Route handlers use `route.ts` naming
  - API routes: `app/api/employees/route.ts`
  - Dynamic routes: `app/api/employees/[id]/route.ts`

- **Actions:** `app/actions/[feature].ts` with camelCase function names
  - `app/actions/user.ts` exports `async function switchBranch()`
  - `app/actions/inventory.ts` exports `async function createProduct()`

- **Utilities:** kebab-case, camelCase functions
  - `lib/utils.ts` exports `function cn(...)`
  - `lib/api/error.ts` exports `class ApiError`

### Functions

- **Server Actions:** camelCase with "use server" directive
  ```typescript
  "use server";
  export async function switchBranch(branchId: string) { }
  export async function createProduct(formData: FormData) { }
  ```

- **Service Methods:** Static methods preferred in service classes
  ```typescript
  export class EmployeeService {
    static async listEmployees(companyId: string, options: {}) { }
    static async getEmployee(id: string, options: {}) { }
  }
  ```

- **API Handlers:** Export named async functions for HTTP methods
  ```typescript
  export async function POST(request: NextRequest) { }
  export async function GET(request: NextRequest) { }
  ```

### Variables

- **Constants:** UPPER_SNAKE_CASE for configuration constants
  ```typescript
  export const PERMISSIONS: PermissionMatrix = { }
  export const ROLES_HIERARCHY: Record<Role, number> = { }
  ```

- **Database enums:** camelCase with "Enum" suffix
  ```typescript
  export const roleEnum = pgEnum("role", ['SUPER_ADMIN', 'ADMIN', ...])
  export const shiftTypeEnum = pgEnum("shift_type", ['MATUTINO', ...])
  ```

- **Table definitions:** camelCase, matching SQL table names
  ```typescript
  export const workflowInstances = pgTable("workflow_instances", { })
  export const breakLogs = pgTable("break_logs", { })
  ```

### Types

- **TypeScript types:** PascalCase with descriptive names
  ```typescript
  export type CreateUserInput = z.infer<typeof createUserSchema>;
  export type Role = typeof roleEnum.enumValues[number];
  export type Resource = 'users' | 'companies' | 'branches' | ...
  ```

- **Zod schemas:** camelCase with "Schema" suffix
  ```typescript
  export const createUserSchema = z.object({ })
  export const updateUserSchema = z.object({ })
  ```

## Code Style

### Formatting

- **Tool:** ESLint with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- **Config file:** `eslint.config.mjs` (flat config format)
- **Key settings:**
  - Next.js Core Web Vitals rules enabled
  - TypeScript strict checking: `strict: false` in tsconfig (relaxed)
  - Ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

### TypeScript Configuration

- **Target:** ES2017
- **Module:** ESNext with bundler resolution
- **Path alias:** `@/*` maps to `./*`
- **JSX:** `react-jsx` transform

### Import Organization

**Order (observed in codebase):**

1. Framework imports (React, Next.js)
2. Third-party libraries (Radix UI, date-fns, Zod)
3. Absolute imports with `@/*` alias
4. Relative imports (within same module)

**Example from `lib/services/employee-service.ts`:**
```typescript
// 1. Database imports
import { db } from "@/lib/db";
import { users, employeeProfiles, ... } from "@/lib/db/schema";
import { eq, and, isNull, desc, or, ilike, sql } from "drizzle-orm";

// 2. Local module imports
import { ApiError } from "../api/error";
import { AuditService } from "./audit-service";
```

### Path Aliases

- `@/*` - Root project imports
- Used consistently across `app/`, `lib/`, `components/`
- No relative imports for cross-module dependencies

## Error Handling

### API Errors

Use `ApiError` class from `lib/api/error.ts`:

```typescript
export class ApiError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) { }

  static badRequest(message: string, details?: any) { }
  static unauthorized(message: string = "Unauthorized") { }
  static forbidden(message: string = "Forbidden") { }
  static notFound(message: string = "Not Found") { }
  static internal(message: string = "Internal Server Error") { }
}
```

### API Response Pattern

Use `ApiHandler` class from `lib/api/response.ts`:

```typescript
import { ApiHandler } from "@/lib/api/response";

// Success
return ApiHandler.success(data, 200);

// Error handling
try {
  // ...
} catch (error) {
  return ApiHandler.error(error);
}
```

### Zod Validation Errors

Automatically handled by `ApiHandler.error()`:
```typescript
if (error instanceof ZodError) {
  return NextResponse.json({
    success: false,
    error: { message: "Validation Error", details: error.flatten() }
  }, { status: 400 });
}
```

### Server Action Errors

Throw standard Errors with descriptive messages:
```typescript
if (!session?.user) {
  throw new Error("Unauthorized");
}
if (!branch) {
  throw new Error("Branch not found or access denied");
}
```

## Logging

### Framework

**Pino** (`lib/logger.ts`):

```typescript
import { logger, createChildLogger, safeLog } from "@/lib/logger";

// Basic logging
logger.info("Message");
logger.error(err);

// Child loggers for components
const serviceLogger = createChildLogger("EmployeeService");
serviceLogger.info("Fetching employees", { companyId });

// Safe logging with redaction
safeLog("error", "Failed to process", { password: "secret", token: "abc123" });
// Output: { password: "[REDACTED]", token: "[REDACTED]" }
```

### Redacted Fields

- `password`, `token`, `secret`, `apiKey`, `creditCard`
- Automatic redaction in `safeLog()` function

### Log Levels

Controlled by `LOG_LEVEL` env var (defaults to `info`):
- `trace`, `debug`, `info`, `warn`, `error`, `fatal`

## Comments

### When to Comment

- **TODO/FIXME markers:** 42 TODOs found in codebase for pending implementations
- **Function documentation:** Minimal JSDoc, prefer self-documenting code
- **Complex logic:** Explain business rules and compliance requirements
- **Workarounds:** Explain temporary fixes with context

### Comment Patterns

```typescript
// TODO: Add strict permission check here (Only ADMIN/MANAGER)

// Note: Actual login test with credentials should use a seeded test user

// Store full form state if needed
// Store in cents if integer, or just number if decimal allowed
```

## Function Design

### Size

- Service methods: typically 50-150 lines
- React components: 50-200 lines (larger components use composition)
- API route handlers: 30-80 lines

### Parameters

- Options objects for multiple optional parameters:
  ```typescript
  static async listEmployees(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      department?: string;
      status?: string;
      branchId?: string;
    } = {}
  )
  ```

### Return Values

- Service methods return typed objects:
  ```typescript
  return { data, meta: { page, limit, total, totalPages } };
  ```

- API responses use standardized format:
  ```typescript
  { success: true, data: T }
  { success: false, error: { message, details?, code? } }
  ```

## Module Design

### Exports

- **Named exports preferred:** `export class EmployeeService`
- **Single instance exports:** `export const complianceReportService = new ComplianceReportService()`
- **Re-exports:** Some barrel patterns in component directories

### Service Pattern

```typescript
// lib/services/[feature]-service.ts
export class FeatureService {
  static async list(...) { }
  static async get(id: string, ...) { }
  static async create(data: InputType) { }
  static async update(id: string, data: UpdateType) { }
  static async delete(id: string) { }
}

// Single instance for singleton services
export const featureService = new FeatureService();
```

### Component Pattern

```typescript
// components/[feature]/[component-name].tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export function ComponentName({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("base-classes", className)} {...props} />
  )
}
```

### Validation Pattern

```typescript
// lib/validations/[feature].ts
import { z } from "zod";
import { roleEnum } from "@/lib/db/schema";

export const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

export type CreateInput = z.infer<typeof createSchema>;
```

## Environment Variables

### Validation

All env vars validated in `lib/env.ts` using Zod:

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
  // ...
});

export const env = _env.data;
export function requireEnv(key: keyof typeof env): string { }
export function isProduction(): boolean { }
```

---

*Convention analysis: 2026-04-23*
