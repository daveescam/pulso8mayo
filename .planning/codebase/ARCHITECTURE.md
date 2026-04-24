# Architecture

**Analysis Date:** 2026-04-23

## Pattern Overview

**Overall:** Multi-tenant SaaS with layered architecture following Next.js App Router conventions.

**Key Characteristics:**
- **Multi-tenancy:** All data scoped via `companyId` and `branchId`
- **Role-Based Access Control (RBAC):** Hierarchical permissions (SUPER_ADMIN > ADMIN > GERENTE > SUPERVISOR > EMPLEADO > READONLY)
- **Service Layer Pattern:** Business logic isolated from routes in `lib/services/`
- **Server Actions:** Next.js Server Actions for form mutations in `app/actions/`
- **Workflow Engine:** Custom workflow system with scheduling, assignment, and execution
- **Cron Job Architecture:** Upstash QStash + Redis for background processing

## Layers

### Presentation Layer
- **Purpose:** React components and UI rendering
- **Location:** `components/`, `app/` (page.tsx files)
- **Contains:** React components, forms, tables, charts
- **Depends on:** Server Actions, Services layer
- **Used by:** Browser clients

### Application/API Layer
- **Purpose:** HTTP endpoints and server actions
- **Location:** `app/api/`, `app/actions/`
- **Contains:** API routes, server actions, request handlers
- **Depends on:** Services layer, Validation layer
- **Used by:** Frontend components, external integrations

### Business Logic Layer (Services)
- **Purpose:** Core business logic and workflows
- **Location:** `lib/services/`
- **Contains:** Service classes (e.g., `workflow-execution-service.ts`, `employee-service.ts`)
- **Depends on:** Data Access layer
- **Used by:** API routes, Server Actions, Cron jobs

### Data Access Layer
- **Purpose:** Database access and ORM operations
- **Location:** `lib/db/`, `lib/db/schema.ts`
- **Contains:** Drizzle ORM schema, database client
- **Depends on:** Neon Postgres
- **Used by:** Services layer

### Cron/Background Layer
- **Purpose:** Scheduled tasks and background processing
- **Location:** `lib/cron/`, `app/api/cron/`
- **Contains:** Scheduled job handlers (document expiration, workflow reminders, inventory checks)
- **Depends on:** Services layer
- **Used by:** Upstash QStash triggers

### Notification Layer
- **Purpose:** Multi-channel notification delivery
- **Location:** `lib/notifications/`, `lib/whatsapp/`
- **Contains:** WhatsApp integration, email, in-app notifications
- **Depends on:** External APIs (WasenderAPI, Resend)
- **Used by:** Services layer, workflow engine

### AI/Validation Layer
- **Purpose:** AI-powered verification and validation
- **Location:** `lib/ai/`, `lib/validations/`
- **Contains:** OpenAI/Moondream providers, Zod schemas
- **Depends on:** External AI services
- **Used by:** Workflow engine, document validation

## Data Flow

### Authentication Flow
1. User submits credentials to `better-auth` API (`app/api/auth/[...all]/route.ts`)
2. `better-auth` validates against database via Drizzle adapter
3. Session cookie set via `nextCookies()` plugin
4. Middleware (`middleware.ts`) validates session on protected routes
5. Role-based redirects enforced in middleware

### Workflow Execution Flow
1. Template defined in `workflowTemplates` table
2. Schedule triggers via `lib/cron/execute-schedules.ts`
3. `WorkflowScheduleService` creates instance via `workflowInstances`
4. `WorkflowAssignmentService` assigns to user/role
5. User receives notification via `NotificationDispatcher`
6. User executes via public token link or dashboard
7. `WorkflowExecutionService` validates and progresses steps
8. AI verification runs if configured (photo steps)
9. Completion triggers next steps or escalations

### Inventory Alert Flow
1. Cron job (`lib/cron/inventory-checks.ts`) runs periodically
2. `StockAlertService` checks levels against thresholds
3. `NotificationDispatcher` sends alerts via configured channels
4. Alert logged to `inventoryAlerts` table
5. Manager views and resolves in dashboard

### Break Compliance Flow
1. Employee clocks in (`app/api/shifts/clock-in/route.ts`)
2. `BreakManagementService` schedules break reminders
3. Cron sends reminders via WhatsApp (`lib/cron/send-reminders.ts`)
4. Employee starts/ends break via API or WhatsApp
5. Compliance validated against `breakComplianceRules`
6. Violations trigger incidents and escalations

## Key Abstractions

### TenantContext
- **Purpose:** Access current tenant (company/branch) in server context
- **Location:** `lib/tenant-context.ts`
- **Pattern:** Header-based tenant resolution with fallback to user default
- **Usage:** All multi-tenant queries should use tenant context

### ApiHandler
- **Purpose:** Standardized API response formatting
- **Location:** `lib/api/response.ts`
- **Pattern:** Class with static success/error methods
- **Usage:** All API routes use `ApiHandler.success()` or `ApiHandler.error()`

### Service Classes
- **Purpose:** Encapsulate business logic
- **Location:** `lib/services/*.ts`
- **Pattern:** Static methods for operations
- **Example:** `WorkflowExecutionService.createExecution()`

### Workflow Engine
- **Purpose:** Dynamic form/workflow execution
- **Location:** `lib/services/workflow-*-service.ts`
- **Pattern:** Template → Instance → Steps → Execution
- **Features:** Scheduling, assignment, AI verification, escalations

### Permission System
- **Purpose:** RBAC with hierarchical roles
- **Location:** `lib/permissions.ts`, `lib/rbac/`
- **Pattern:** Permission matrix with resource/action checks
- **Usage:** Middleware and UI conditionals

## Entry Points

### Web Application
- **Location:** `app/page.tsx` (landing), `app/dashboard/page.tsx` (main)
- **Triggers:** Browser navigation
- **Responsibilities:** Render UI, handle user interactions

### API Routes
- **Location:** `app/api/*/route.ts`
- **Triggers:** HTTP requests
- **Responsibilities:** Validate input, call services, return JSON

### Server Actions
- **Location:** `app/actions/*.ts`
- **Triggers:** Form submissions, client calls
- **Responsibilities:** Server-side mutations with revalidation

### Cron Jobs
- **Location:** `app/api/cron/*/route.ts`
- **Triggers:** Upstash QStash schedules
- **Responsibilities:** Background processing, reminders, checks

### WhatsApp Webhook
- **Location:** `app/.well-known/workflow/v1/webhook/[token]/route.ts`
- **Triggers:** Incoming WhatsApp messages
- **Responsibilities:** Parse commands, route to handlers

## Error Handling

**Strategy:** Centralized error handling with custom ApiError class

**Patterns:**
- Custom `ApiError` class with status codes (`lib/api/error.ts`)
- Zod validation errors converted to 400 responses
- Service errors bubble up to API layer
- Sentry integration for error tracking (`lib/sentry.ts`)

**Error Types:**
- `ApiError.unauthorized()` - 401
- `ApiError.badRequest()` - 400
- `ApiError.notFound()` - 404
- `ApiError.internal()` - 500

## Cross-Cutting Concerns

### Logging
- **Framework:** Pino (`lib/logger.ts`)
- **Patterns:** Structured JSON logging
- **Usage:** Service methods log operations

### Validation
- **Framework:** Zod v4 (`lib/validations/`)
- **Patterns:** Schema-first validation for all inputs
- **Usage:** API routes validate before processing

### Authentication
- **Framework:** better-auth
- **Pattern:** Session-based with cookie storage
- **Features:** Email/password, role assignment, tenant linking

### Rate Limiting
- **Location:** `lib/rate-limiter.ts`
- **Pattern:** In-memory sliding window
- **Usage:** Middleware protects API routes

### Multi-tenancy
- **Pattern:** Row-level security via `companyId`/`branchId`
- **Enforcement:** Service layer filters by tenant
- **Context:** `lib/tenant-context.ts` provides current tenant

---

*Architecture analysis: 2026-04-23*
