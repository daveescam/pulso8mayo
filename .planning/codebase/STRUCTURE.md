# Codebase Structure

**Analysis Date:** 2026-04-23

## Directory Layout

```
C:\Users\david\pulso29/
├── app/                           # Next.js App Router
│   ├── actions/                   # Server Actions for mutations
│   ├── api/                       # REST API endpoints
│   ├── dashboard/                 # Protected dashboard pages
│   ├── join/[token]/              # Public join links
│   ├── onboarding/                # Company setup flow
│   ├── sign-in/                   # Authentication pages
│   ├── sign-up/                   # Registration pages
│   ├── workflow/public/[token]/    # Public workflow execution
│   └── page.tsx                   # Landing page (not configured)
├── components/                    # React components
│   ├── analytics/                 # KPI charts and analytics
│   ├── builder/                   # Workflow builder UI
│   ├── profiles/                  # Employee profile views
│   ├── schedules/                 # Shift scheduling
│   ├── team/                      # Team management
│   ├── ui/                        # shadcn/ui components
│   ├── workflow/                  # Workflow execution
│   └── whatsapp/                  # WhatsApp status UI
├── lib/                           # Application code
│   ├── ai/                        # AI providers (OpenAI, Moondream)
│   ├── api/                       # API utilities (response, error)
│   ├── cron/                      # Cron job handlers
│   ├── db/                        # Database schema and client
│   ├── notifications/             # Notification dispatcher
│   ├── rbac/                      # Role-based access control
│   ├── reports/                   # PDF report generators
│   ├── services/                  # Business logic services
│   ├── storage/                   # Cloudflare R2/S3 client
│   ├── types/                     # TypeScript type definitions
│   ├── utils/                     # Utility functions
│   ├── validations/               # Zod validation schemas
│   └── whatsapp/                  # WhatsApp integration
├── hooks/                         # React hooks
├── public/                        # Static assets
├── scripts/                       # Database scripts and seeding
├── templates/                     # Email/message templates
├── tests/                         # E2E tests (Playwright)
├── drizzle/                       # Database migrations
├── drizzle.config.ts              # Drizzle configuration
├── middleware.ts                  # Next.js middleware (auth, RBAC)
├── next.config.ts                 # Next.js configuration
├── playwright.config.ts           # Playwright test config
├── tailwind.config.ts             # Tailwind CSS config
└── tsconfig.json                  # TypeScript configuration
```

## Directory Purposes

### `app/`
- **Purpose:** Next.js 16 App Router pages and API routes
- **Contains:** Page components, API route handlers, layouts
- **Key files:**
  - `app/page.tsx` - Landing page (default Next.js template)
  - `app/layout.tsx` - Root layout with providers
  - `app/dashboard/page.tsx` - Main dashboard
  - `app/api/auth/[...all]/route.ts` - better-auth endpoints

### `app/actions/`
- **Purpose:** Server Actions for form mutations
- **Contains:** Server action functions
- **Key files:**
  - `user.ts` - User mutations
  - `inventory.ts` - Inventory mutations
  - `inventory-transactions.ts` - Transaction actions

### `app/api/`
- **Purpose:** REST API endpoints
- **Contains:** Route handlers organized by domain
- **Key directories:**
  - `auth/` - Authentication endpoints
  - `branches/` - Branch management
  - `employees/` - Employee CRUD
  - `inventory/` - Inventory operations
  - `workflows/` - Workflow management
  - `cron/` - Scheduled job endpoints

### `components/`
- **Purpose:** React UI components
- **Contains:** Feature-specific and shared components
- **Key directories:**
  - `ui/` - shadcn/ui base components (Button, Input, Dialog, etc.)
  - `analytics/` - KPI cards, charts
  - `builder/` - Workflow builder canvas, toolbox
  - `workflow/` - Workflow execution components

### `lib/`
- **Purpose:** Core application logic
- **Contains:** Services, database, utilities, integrations
- **Key subdirectories:**

#### `lib/services/`
- **Purpose:** Business logic encapsulation
- **Pattern:** Static method classes
- **Key files:**
  - `workflow-execution-service.ts` - Workflow execution engine
  - `workflow-schedule-service.ts` - Scheduling logic
  - `employee-service.ts` - Employee management
  - `notification-service.ts` - Notification dispatch

#### `lib/db/`
- **Purpose:** Database access
- **Contains:** Drizzle schema and connection
- **Key files:**
  - `schema.ts` - Complete database schema (1300+ lines)
  - `index.ts` - Database client configuration

#### `lib/cron/`
- **Purpose:** Background job handlers
- **Key files:**
  - `execute-schedules.ts` - Workflow scheduling
  - `send-reminders.ts` - Notification reminders
  - `inventory-checks.ts` - Stock monitoring
  - `document-expiration-check.ts` - Document expiry

#### `lib/validations/`
- **Purpose:** Zod validation schemas
- **Key files:**
  - `workflow-scheduling.ts` - Schedule/assignment schemas
  - `branch.ts` - Branch validation
  - `company.ts` - Company validation

#### `lib/whatsapp/`
- **Purpose:** WhatsApp integration
- **Key files:**
  - `session-manager.ts` - Session lifecycle
  - `message-router.ts` - Incoming message routing
  - `workflow-conversation-handler.ts` - WhatsApp workflows
  - `wasender-client.ts` - WasenderAPI client

### `hooks/`
- **Purpose:** React custom hooks
- **Key files:**
  - `use-session.ts` - Session management
  - `use-toast.ts` - Toast notifications
  - `use-mobile.ts` - Mobile detection

### `scripts/`
- **Purpose:** Database utilities and seeding
- **Key files:**
  - `seed-demo-data.ts` - Demo data seeding
  - `test-db.ts` - Database connection tests
  - Various debug/query scripts

### `tests/`
- **Purpose:** E2E tests with Playwright
- **Contains:** Page object pattern tests
- **Key files:**
  - `e2e/auth.spec.ts` - Authentication flows
  - `e2e/workflows.spec.ts` - Workflow execution
  - `e2e/compliance.spec.ts` - Compliance features

### `drizzle/`
- **Purpose:** Database migrations
- **Contains:** SQL migration files and snapshots
- **Key files:**
  - `meta/_journal.json` - Migration journal
  - `0000_*.sql` through `0003_*.sql` - Migration files

## Key File Locations

### Entry Points
- `app/page.tsx` - Public landing (needs customization)
- `app/dashboard/page.tsx` - Authenticated dashboard
- `app/sign-in/page.tsx` - Login page
- `app/api/auth/[...all]/route.ts` - Auth API entry

### Configuration
- `next.config.ts` - Next.js config (server actions, workflow plugin)
- `drizzle.config.ts` - Database migration config
- `middleware.ts` - Auth middleware, RBAC, rate limiting
- `tsconfig.json` - TypeScript paths (`@/*` alias)
- `playwright.config.ts` - E2E test configuration

### Core Logic
- `lib/db/schema.ts` - Database schema (single source of truth)
- `lib/auth.ts` - better-auth configuration
- `lib/permissions.ts` - RBAC definitions
- `lib/tenant-context.ts` - Multi-tenant context

### API Utilities
- `lib/api/response.ts` - Standardized API responses
- `lib/api/error.ts` - Custom error classes

### Workflows
- `app/workflows/handle-*.ts` - Workflow step handlers
- `app/workflows/steps/core.ts` - Step execution core
- `app/workflows/steps/incident.ts` - Incident handling

## Naming Conventions

### Files
- **Pages:** `page.tsx` (Next.js convention)
- **Layouts:** `layout.tsx`
- **API Routes:** `route.ts`
- **Components:** `PascalCase.tsx` (e.g., `WorkflowBuilder.tsx`)
- **Services:** `kebab-case-service.ts` (e.g., `workflow-execution-service.ts`)
- **Hooks:** `use-kebab-case.ts` (e.g., `use-session.ts`)
- **Utilities:** `kebab-case.ts` (e.g., `csv-export.ts`)

### Directories
- **Feature-based:** `kebab-case/` (e.g., `workflow-builder/`)
- **Domain-based:** `kebab-case/` (e.g., `inventory/`)
- **Generic:** `kebab-case/` (e.g., `utils/`)

### Database Tables
- **snake_case:** `workflow_instances`, `employee_documents`
- **Enums:** `status_enum`, `role_enum`
- **Relations:** Implicit via Drizzle ORM

## Where to Add New Code

### New Feature (e.g., Payroll Module)
- **Primary code:** `app/dashboard/payroll/page.tsx`
- **API routes:** `app/api/payroll/*/route.ts`
- **Service:** `lib/services/payroll-service.ts`
- **Components:** `components/payroll/*.tsx`
- **Tests:** `tests/e2e/payroll.spec.ts`

### New Component
- **Base UI:** `components/ui/[component-name].tsx` (shadcn pattern)
- **Feature:** `components/[feature]/[component-name].tsx`
- **Export:** Add to barrel file if exists

### New API Endpoint
- **Route:** `app/api/[domain]/[action]/route.ts`
- **Validation:** Add Zod schema to `lib/validations/[domain].ts`
- **Service:** Call from `lib/services/[domain]-service.ts`

### New Database Table
- **Schema:** Add to `lib/db/schema.ts`
- **Migration:** Run `pnpm db:generate` then `pnpm db:push`
- **Types:** Derive from schema if needed

### New Cron Job
- **Handler:** `lib/cron/[job-name].ts`
- **Endpoint:** `app/api/cron/[job-name]/route.ts`
- **Schedule:** Configure in Upstash QStash dashboard

## Special Directories

### `.github/workflows/`
- **Purpose:** GitHub Actions CI/CD
- **Contains:** `e2e-tests.yml` for Playwright tests
- **Generated:** No
- **Committed:** Yes

### `.next/`
- **Purpose:** Next.js build output
- **Generated:** Yes (by `next build`)
- **Committed:** No (in .gitignore)

### `node_modules/`
- **Purpose:** Dependencies
- **Generated:** Yes (by `pnpm install`)
- **Committed:** No

### `public/`
- **Purpose:** Static assets
- **Contains:** Images, fonts, static files
- **Served:** At root path (`/logo.png`)

### `drizzle/meta/`
- **Purpose:** Migration metadata
- **Generated:** Yes (by drizzle-kit)
- **Committed:** Yes

---

*Structure analysis: 2026-04-23*
