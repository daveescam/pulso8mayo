# Technology Stack

**Analysis Date:** 2026-04-23

## Languages

**Primary:**
- **TypeScript** - All source code, configuration files, and server-side logic
- **CSS** - Styling via Tailwind CSS v4 (CSS-first, no JS config)

**Secondary:**
- **JavaScript** - Runtime scripts and build configuration
- **JSON** - Data schemas and configuration

## Runtime

**Environment:**
- **Node.js** - JavaScript runtime for development and production
- **V8 Engine** - Via Next.js/Vercel runtime

**Package Manager:**
- **pnpm** - Primary package manager (lockfile: `pnpm-lock.yaml`)
- Note: Project explicitly uses pnpm, not npm

## Frameworks

**Core:**
- **Next.js** 16.1.6 - Full-stack React framework with App Router
  - Config: `next.config.ts`
  - App Router pattern for routing (`app/` directory)
  - Server Actions enabled with 2MB body size limit
  - Experimental features: `serverActions.bodySizeLimit: '2mb'`
  
- **React** 19.2.3 - UI library
  - Server Components by default
  - Client Components via `'use client'` directive

- **React DOM** 19.2.3 - DOM renderer

**UI Framework:**
- **Tailwind CSS** v4 - Utility-first CSS framework
  - Config: `postcss.config.mjs` (CSS-first, no `tailwind.config.js`)
  - Plugin: `@tailwindcss/postcss`

- **Radix UI** - Headless UI primitives for accessibility
  - Components: Avatar, Checkbox, Collapsible, Dialog, Dropdown Menu, Label, Popover, Progress, Radio Group, Select, Separator, Slot, Switch, Tabs, Toggle, Toggle Group, Tooltip

- **Dnd Kit** - Drag and drop primitives
  - `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

**State Management:**
- **TanStack Query** 5.90.20 - Server state management
- **TanStack Table** 8.21.3 - Table/Grid state
- **Zustand** (implied) - Client state (via workflow library)

**Forms & Validation:**
- **Zod** v4.3.6 - Schema validation
- **react-hook-form** 7.71.1 - Form state management
- **@hookform/resolvers** 5.2.2 - Zod integration

**Database & ORM:**
- **Drizzle ORM** 0.45.2 - TypeScript-first ORM
- **Drizzle Kit** 0.31.8 - Database migration toolkit

**Authentication:**
- **better-auth** 1.4.18 - Authentication framework
  - Session-based auth with refresh token rotation
  - Drizzle adapter for database integration
  - Config: `lib/auth.ts`, `lib/auth-config.ts`

**Charts & Visualization:**
- **Recharts** 2.15.4 - React charting library

**Testing:**
- **Playwright** - E2E testing framework
  - Config: `playwright.config.ts`
  - Browser: Chromium only
  - HTML reporter enabled
  - Test directory: `tests/`

**Build/Dev:**
- **TypeScript** 5.x - Type system
  - Config: `tsconfig.json` (ES2017 target, strict: false)
- **tsx** 4.21.0 - TypeScript execution for scripts
- **dotenv** 17.2.3 - Environment variable loading
- **tw-animate-css** 1.4.0 - Tailwind CSS animations

## Key Dependencies

**Critical:**
- **@neondatabase/serverless** 1.0.2 - Neon Postgres serverless driver
- **pg** 8.20.0 - Postgres client
- **@upstash/qstash** 2.9.0 - Upstash QStash for cron jobs
- **@upstash/redis** 1.34.8 - Redis client for caching
- **@aws-sdk/client-s3** 3.1029.0 - AWS S3 SDK for file storage
- **@aws-sdk/s3-request-presigner** 3.1029.0 - S3 presigned URLs
- **@sentry/nextjs** 8.0.0 - Error tracking
- **openai** 6.17.0 - AI/LLM integration
- **resend** 6.10.0 - Email service
- **pino** 10.3.1 - Structured logging
- **@node-rs/argon2** 2.0.2 - Password hashing

**PDF & Document Generation:**
- **jspdf** 4.0.0 - PDF generation
- **jspdf-autotable** 5.0.7 - PDF tables
- **pdfkit** 0.18.0 - PDF generation
- **exceljs** 4.4.0 - Excel file generation

**Utilities:**
- **date-fns** 4.1.0 - Date manipulation
- **uuid** 13.0.0 - UUID generation
- **nanoid** 5.1.6 - ID generation
- **class-variance-authority** 0.7.1 - Component variants
- **tailwind-merge** 3.4.0 - Tailwind class merging
- **clsx** 2.1.1 - Conditional class names
- **qrcode.react** 4.2.0 - QR code generation

**Icons:**
- **lucide-react** 0.563.0 - Icon library
- **@tabler/icons-react** 3.36.1 - Additional icons

**UI Components:**
- **@radix-ui/react-stepper** via `@stepperize/react` 6.0.0 - Stepper component
- **next-themes** 0.4.6 - Theme switching
- **sonner** 2.0.7 - Toast notifications
- **vaul** 1.1.2 - Drawer component

**Workflow Engine:**
- **workflow** 4.1.0-beta.52 - Custom workflow library

## Configuration

**Environment:**
- **.env** - Environment configuration (not committed)
- **lib/env.ts** - Environment variable validation with Zod

**Required env vars:**
- `DATABASE_URL` - Neon Postgres connection
- `BETTER_AUTH_SECRET` - Auth signing key
- `BETTER_AUTH_URL` - Auth service URL
- `NEXT_PUBLIC_APP_URL` - Public app URL

**Optional env vars:**
- `WASENDER_API_KEY`, `WASENDER_API_URL` - WhatsApp integration
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` - Cloudflare R2 storage
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - Redis
- `UPSTASH_QSTASH_TOKEN` - Cron jobs
- `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` - Error tracking
- `LOG_LEVEL` - Logging level

**Build:**
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration (paths: `@/*` → `./*`)
- `postcss.config.mjs` - PostCSS/Tailwind configuration
- `drizzle.config.ts` - Database migration configuration
- `playwright.config.ts` - E2E test configuration
- `eslint.config.mjs` - ESLint configuration (Next.js presets)

## Platform Requirements

**Development:**
- Node.js 18+
- pnpm package manager
- `.env` file with required environment variables

**Production:**
- Vercel or similar Node.js hosting
- Neon Postgres database
- Cloudflare R2 or compatible S3 storage
- Redis (Upstash) for caching and queues

**Database:**
- PostgreSQL (Neon)
- Schema: `lib/db/schema.ts`

---

*Stack analysis: 2026-04-23*
