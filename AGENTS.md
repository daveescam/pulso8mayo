# Pulso HORECA - Agent Instructions

Software for HORECA chains (hotels, restaurants, cafés) focused on quality control, NOM-251/NOM-035 compliance, inventory audits, RH/attendance, and WhatsApp automations.

## 🚀 Core Commands

```bash
# Package manager: pnpm (NOT npm)
pnpm install              # Install deps
pnpm run dev              # Dev server (localhost:3000)
pnpm run build            # Production build
pnpm run lint             # ESLint
pnpm test:e2e             # Playwright E2E tests

# Database (Drizzle ORM + Neon Postgres)
pnpm db:generate          # Generate migrations
pnpm db:push              # ⚠️ DANGER: can drop tables
pnpm db:migrate           # Apply migrations

# Utilities
npx tsx scripts/seed-demo-data.ts  # Seed demo data
```

## 📁 Architecture

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Drizzle ORM, Neon Postgres, better-auth, Radix UI, Tailwind CSS v4, Recharts

**Key directories:**
- `app/api/` - API routes (workflows, inventory, labor, compliance, WhatsApp)
- `app/dashboard/` - Main dashboard pages
- `lib/db/schema/` - Drizzle schema modules
- `lib/services/` - Business logic layer
- `lib/whatsapp/` - WhatsApp integration (Wasender API)
- `components/workflow/` - Workflow executor & builder
- `templates/` - Pre-built workflow templates (15+ HORECA operations)

**Entry points:**
- Workflow execution: `app/api/workflows/execute/route.ts`
- WhatsApp webhook: `app/api/whatsapp/webhook/route.ts`
- AI verification: `app/api/ai/verify/route.ts`
- Cron jobs: `app/api/cron/*` (6 scheduled tasks via Vercel)

## ⚙️ Configuration

**Environment (.env required):**
- `DATABASE_URL` - Neon Postgres connection
- `BETTER_AUTH_SECRET` - Auth secret
- `WASENDER_API_KEY`, `WASENDER_API_URL` - WhatsApp (Wasender)
- `QSTASH_TOKEN`, `QSTASH_*` - Upstash cron/redis
- `R2_*` - Cloudflare R2 storage (or local fallback)
- `RESEND_API_KEY` - Email notifications

**Vercel Cron Jobs** (`vercel.json`):
- `*/5 * * * *` - Execute scheduled workflows
- `0 * * * *` - Check overdue items, send reminders
- `0 8 * * *` - Daily reminders
- `0 */6 * * *` - Inventory checks

## 🧪 Testing

```bash
# E2E tests (Playwright)
pnpm test:e2e

# Test config: playwright.config.ts
# Base URL: PLAYWRIGHT_TEST_BASE_URL env var (default: localhost:3000)
# Runs dev server automatically via webServer config
```

**Note:** Tests excluded from TypeScript (`tsconfig.json`), run separately.

## 🏗️ Key Conventions

**Multi-tenant:** All data scoped by `tenantId`/`companyId`. Use `lib/tenant-context.ts` for access checks.

**Auth:** `better-auth` with session-based auth. Always verify with `getSession()`.

**Database safety:** `drizzle-kit push` can drop tables - verify against `.env` before running.

**Notification flow:**
- `NotificationService` - Direct notification API
- `NotificationDispatcher` - Template-based with user preferences
- Channels: WhatsApp (Wasender), Email (Resend), In-App (DB table)

**Storage:** R2 with local fallback when credentials missing.

## 📝 Workflow System

Core workflow engine (`workflow` package) handles:
- Template-based workflow definitions (`templates/*.json`)
- Step-by-step execution with AI verification
- Evidence collection (photos, text, OCR)
- WhatsApp conversation integration
- Smart links for external execution

**AI Verification:** `/api/ai/verify` endpoint with confidence scoring. Auto-approves >85%, marks for review otherwise.

## 📊 Database Schema

Modular schema in `lib/db/schema/`:
- `core.ts` - Core business tables
- `auth.ts` - Auth & permissions
- `equipment.ts` - Equipment tracking
- Additional modules as needed

Main schema: `lib/db/schema.ts`

## 🚨 Common Gotchas

1. **Strict mode:** TypeScript `strict: false` - some type issues may not surface
2. **i18n:** Uses `next-intl` with config at `./i18n/config.ts`
3. **Workflow package:** Custom `workflow` npm package (v4.1.0-beta.52)
4. **Playwright tests:** Excluded from TS build, run via separate command
5. **Cron paths:** Must match Vercel cron job paths exactly

## 📚 Documentation

- `PROJECT_CONTEXT.md` - Phase completion status, TODOs
- `docs/user-guide.md` - End user guide (Spanish)
- `docs/admin-guide.md` - Admin documentation
- `plans/system-architecture.md` - Architecture diagrams
- `templates/README.md` - Template library docs

## 🔧 Development Flow

1. `pnpm install` (one-time setup)
2. Copy `.env` with required credentials
3. `pnpm db:push` (caution: can drop tables)
4. `npx tsx scripts/seed-demo-data.ts` (optional demo data)
5. `pnpm run dev`
6. Run `pnpm run build` before committing to verify
