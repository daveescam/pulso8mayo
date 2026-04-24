# External Integrations

**Analysis Date:** 2026-04-23

## APIs & External Services

### Authentication
**better-auth**
- **Purpose:** Session-based authentication with refresh token rotation
- **Implementation:** `lib/auth.ts`, `lib/auth-config.ts`
- **Features:**
  - Email/password authentication
  - OAuth support (Google, Microsoft configured in trusted providers)
  - Refresh token rotation (15 min access, 7 day refresh)
  - Role-based user fields (companyId, branchId, role, phone)
- **SDK:** `better-auth` npm package with `@better-fetch/fetch`

### WhatsApp (WasenderAPI)
**WasenderAPI**
- **Purpose:** WhatsApp business messaging
- **Client:** `lib/whatsapp/wasender-client.ts`
- **Environment Variables:**
  - `WASENDER_API_KEY` - API authentication
  - `WASENDER_API_URL` - API endpoint (default: `https://api.wasender.com/v1`)
  - `WASENDER_WEBHOOK_SECRET` - Webhook signature verification
- **Features:**
  - Session management with QR code pairing
  - Text message sending
  - Media message sending (images, documents)
  - Rate limiting (20/min, 100/hour, 1000/day)
  - Webhook verification with HMAC-SHA256
  - Workflow assignment notifications
  - Bulk messaging
- **Webhook Endpoint:** `/api/whatsapp/webhook`
- **Database Tables:** `whatsappSessions`, `whatsappMessages`, `whatsappConversationStates`

### AI/ML Services

**OpenAI**
- **Purpose:** Image analysis for compliance verification
- **Client:** `lib/ai/providers/openai.ts`
- **Features:**
  - GPT-4 Vision for image analysis
  - Compliance detection (compliant vs non-compliant)
  - Confidence scoring
- **Environment Variables:**
  - `OPENAI_API_KEY` (via env)
- **Usage:** Evidence photo verification in workflows

**Moondream AI**
- **Purpose:** Alternative image analysis provider
- **Client:** `lib/ai/providers/moondream.ts`
- **Endpoint:** `https://api.moondream.ai/v1`
- **Authentication:** `X-Moondream-Auth` header
- **Features:**
  - Image Q&A for compliance verification
  - Base64 image conversion
  - Simple compliance heuristics

### Email Service
**Resend**
- **Purpose:** Transactional email sending
- **SDK:** `resend` npm package (6.10.0)
- **Usage:** Notification emails, authentication emails via better-auth

### File Storage
**Cloudflare R2 (S3-compatible)**
- **Purpose:** Document and media storage
- **Client:** `lib/storage/r2-client.ts`
- **Environment Variables:**
  - `R2_ACCOUNT_ID` - Cloudflare account
  - `R2_ACCESS_KEY_ID` - S3 access key
  - `R2_SECRET_ACCESS_KEY` - S3 secret key
  - `R2_BUCKET_NAME` - Bucket name (default: `pulso-documents`)
  - `R2_PUBLIC_URL` - Public CDN URL
- **SDK:** `@aws-sdk/client-s3` with presigner
- **Features:**
  - Document uploads (employee documents, evidence)
  - Presigned URLs for private access
  - File existence checks
  - Key generation with path structure: `companies/{companyId}/users/{userId}/{documentType}/...`

### Error Tracking
**Sentry**
- **Purpose:** Error tracking and performance monitoring
- **Integration:** `@sentry/nextjs` 8.0.0
- **Configuration:** `lib/sentry.ts`
- **Environment Variables:**
  - `SENTRY_DSN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
- **Features:**
  - Session replay (masked text, blocked media)
  - Browser tracing
  - Sampling rates: 0.1 in production, 1.0 in development

## Data Storage

### Primary Database
**Neon Postgres (Serverless)**
- **Type:** PostgreSQL 15+
- **Provider:** Neon (serverless)
- **Driver:** `@neondatabase/serverless` 1.0.2
- **Connection:** `DATABASE_URL` environment variable
- **ORM:** Drizzle ORM 0.45.2
- **Schema:** `lib/db/schema.ts` (single file, ~1200 lines)
- **Migration Tool:** Drizzle Kit 0.31.8

**Key Tables:**
- `users`, `sessions`, `account`, `verifications` - Authentication (better-auth)
- `companies`, `branches` - Multi-tenant structure
- `employeeProfiles` - Employee records (Mexican labor law)
- `workflowTemplates`, `workflowInstances`, `workflowInstanceSteps` - Workflows
- `workflowSchedules`, `workflowAssignments`, `eventTriggers` - Scheduling
- `plannedShifts`, `shiftSessions`, `shiftTemplates`, `shiftChangeRequests` - Shift management
- `employeeDocuments` - Document storage
- `inventoryItems`, `inventoryBatches`, `inventoryMovements`, `inventoryTransfers` - Inventory
- `kpiDefinitions`, `kpiHistory`, `kpiAlerts` - KPIs
- `notifications`, `notificationPreferences` - Notifications
- `breakLogs`, `breakComplianceRules`, `breakReminderLogs` - Labor compliance
- `whatsappSessions`, `whatsappMessages`, `whatsappConversationStates` - WhatsApp
- `incidents` - Compliance incidents
- `vacationRequests`, `leaveRequests` - Time off
- `shiftApprovals` - Approval workflows

### Caching & Queue
**Upstash Redis**
- **Purpose:** Caching and session storage
- **SDK:** `@upstash/redis` 1.34.8
- **Environment Variables:**
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- **Usage:** Rate limiting, session caching

**Upstash QStash**
- **Purpose:** Serverless message queues and cron jobs
- **SDK:** `@upstash/qstash` 2.9.0
- **Environment Variable:** `UPSTASH_QSTASH_TOKEN`
- **Cron Jobs:**
  - `check-overdue.ts` - Overdue assignment checker
  - `send-reminders.ts` - Due soon reminders
  - `execute-schedules.ts` - Scheduled workflow execution
  - `workflow-reminders.ts` - Workflow reminders
  - `overdue-workflows.ts` - Overdue workflow checker
  - `inventory-checks.ts` - Inventory monitoring
  - `break-reminders.ts` - Break compliance reminders
  - `document-expiration-check.ts` - Document expiration alerts

## Monitoring & Observability

**Pino Logging**
- **Purpose:** Structured logging
- **SDK:** `pino` 10.3.1
- **Configuration:** `lib/logger.ts`
- **Features:**
  - Level-based logging (trace, debug, info, warn, error, fatal)
  - JSON output format

## CI/CD & Deployment

**Build System**
- **Next.js Build:** `next build`
- **Linting:** ESLint with Next.js presets
- **E2E Testing:** Playwright (Chromium only)

**Hosting**
- **Platform:** Vercel (implied by Next.js 16 deployment patterns)
- **Serverless Functions:** Next.js API routes (`app/api/`)
- **Edge Functions:** Not explicitly configured

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - Neon Postgres connection string
- `BETTER_AUTH_SECRET` - JWT signing key
- `BETTER_AUTH_URL` - Auth callback URL

**Optional but Critical in Production:**
- `WASENDER_API_KEY` - WhatsApp messaging
- `R2_*` - File storage credentials
- `UPSTASH_*` - Redis and QStash tokens
- `SENTRY_DSN` - Error tracking

**Application URLs:**
- `NEXT_PUBLIC_APP_URL` - Public-facing URL
- `PLAYWRIGHT_TEST_BASE_URL` - Test base URL (overrides default)

## Webhooks & Callbacks

**Incoming:**
- `/api/whatsapp/webhook` - WhatsApp message webhook (POST)
  - Verifies signature with `WASENDER_WEBHOOK_SECRET`
  - Handles inbound messages, media, status updates
- `/api/ai/verify` - AI verification callback

**Outgoing:**
- Webhook configured in WasenderAPI sessions
- URL: `${NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`

## API Routes Structure

**Cron/Job Endpoints:**
- `POST /api/cron/check-overdue` - Check overdue assignments
- `POST /api/cron/send-reminders` - Send due soon reminders
- `POST /api/cron/execute-schedules` - Execute scheduled workflows
- `POST /api/cron/workflow-reminders` - Workflow reminders
- `POST /api/cron/overdue-workflows` - Overdue workflows
- `POST /api/cron/inventory-checks` - Inventory monitoring
- `POST /api/cron/break-reminders` - Break reminders
- `POST /api/cron/document-expiration-check` - Document expiration
- `POST /api/cron/compliance-alerts` - Compliance alerts
- `POST /api/cron/scheduled-reports` - Scheduled reports

**Auth Endpoints:**
- `/api/auth/[...all]` - better-auth catch-all
- `/api/auth/get-session` - Session retrieval
- `/api/auth/change-password` - Password change

**External Service Endpoints:**
- `/api/whatsapp/*` - WhatsApp session and webhook
- `/api/notifications/*` - Notification dispatch and processing

---

*Integration audit: 2026-04-23*
