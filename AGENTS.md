# Pulso HORECA — Agent Instructions

## Stack
- Next.js 16 (App Router), React 19, TypeScript
- **Package manager**: pnpm (not npm)
- **DB**: Neon Postgres + Drizzle ORM; schema at `lib/db/schema.ts`
- **Auth**: better-auth (`lib/auth.ts`, `lib/auth-config.ts`)
- **Cron/Queues**: Upstash QStash + Redis
- **UI**: Radix UI, Dnd-kit, Tailwind CSS v4, Recharts
- **Validation**: Zod v4, react-hook-form + @hookform/resolvers

## Commands

```bash
pnpm install
pnpm run dev          # dev server on localhost:3000
pnpm run build       # Next.js build
pnpm run lint        # ESLint (uses eslint-config-next)
pnpm test:e2e        # Playwright e2e tests (starts dev server automatically)

pnpm db:generate     # drizzle-kit generate
pnpm db:push         # drizzle-kit push (WARNING: may drop schemas)
pnpm db:migrate      # drizzle-kit migrate

npx tsx scripts/seed-demo-data.ts   # demo seed
```

## Key Architecture

- **Multi-tenant**: All data scoped via `tenantId`. Use `lib/tenant-context.ts` to access current tenant.
- **Auth**: Session-based via better-auth. Roles defined in `lib/permissions.ts`.
- **DB schema**: Single file `lib/db/schema.ts` (not split across modules).
- **Cron jobs**: Defined in `lib/cron/`.
- **Services layer**: `lib/services/` (business logic isolated from routes).
- **Actions**: `app/actions/` (server actions for form mutations).
- **API routes**: `app/api/` (REST endpoints).
- **WhatsApp integration**: `lib/whatsapp/`.

## DB Safety
- `drizzle-kit push` can drop tables — always verify against `.env` connection before running.
- `.env` is checked by `drizzle.config.ts` (not `.env.local`).

## Testing
- E2E tests live in `tests/` and use Playwright with HTML reporter.
- `playwright.config.ts` uses `chromium` only (no webkit/safari).
- `PLAYWRIGHT_TEST_BASE_URL` env var overrides base URL for tests.