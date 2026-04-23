# Pulso Project - QWEN Context File

## Project Overview

Pulso is a comprehensive business management platform designed for the HORECA (Hotel/Restaurant/Café) industry. The platform combines workflow management, inventory tracking, AI-powered verification, and WhatsApp integration to help businesses digitize operations, ensure compliance, and improve operational efficiency through automated workflows and intelligent monitoring.

### Key Features
- **Workflow Engine**: Customizable workflows for daily operations (opening/closing, quality control, receiving, cleaning, etc.)
- **Inventory Management**: Real-time tracking, automated alerts, batch management
- **AI Verification**: Computer vision for evidence validation and quality control
- **WhatsApp Integration**: Two-way communication for workflow execution and notifications
- **Analytics & Reporting**: Comprehensive dashboards and compliance reports
- **Labor Management**: Work hour tracking, break management, and compliance monitoring

### Technology Stack
- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **AI Providers**: OpenAI, Moondream, Anthropic Claude
- **WhatsApp Integration**: WasenderAPI
- **Deployment**: Vercel
- **Package Manager**: pnpm

## Building and Running

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL database
- Various API keys for external services (OpenAI, WhatsApp, etc.)

### Setup Instructions
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and fill in environment variables
4. Set up the database: `pnpm dlx drizzle-kit push`
5. Run the development server: `pnpm dev`

### Development Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Project Structure

```
pulso29/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── join/              # Join flow
│   ├── onboarding/        # Onboarding flow
│   ├── sign-in/           # Sign in pages
│   ├── sign-up/           # Sign up pages
│   ├── workflow/          # Workflow pages
│   ├── workflows/         # Workflows pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
├── lib/                   # Library files (database, utilities, etc.)
│   ├── db/                # Database schema and utilities
│   └── rbac/              # Role-based access control
├── hooks/                 # React hooks
├── drizzle/               # Database migrations
├── public/                # Static assets
├── middleware.ts          # Next.js middleware
├── next.config.ts         # Next.js configuration
├── drizzle.config.ts      # Drizzle ORM configuration
└── package.json           # Dependencies and scripts
```

## Key Configuration Files

### Middleware (`middleware.ts`)
Implements authentication and authorization logic:
- Checks for valid session via `/api/auth/get-session`
- Redirects unauthenticated users to `/sign-in`
- Enforces onboarding flow if user lacks company association
- Implements role-based access control (RBAC) for different user roles (ADMIN, GERENTE, EMPLEADO)
- Injects user ID and tenant ID into request headers

### Database (`lib/db/schema.ts`)
Contains the complete database schema using Drizzle ORM with tables for:
- Users and authentication
- Companies and branches
- Workflows and workflow instances
- Inventory and products
- AI verifications
- WhatsApp integration
- Labor management

### Authentication
Uses Better Auth for user authentication with OAuth providers and JWT tokens. The system implements role-based access control with different permission levels:
- SUPER_ADMIN: Full access
- ADMIN: Company-wide access
- GERENTE: Branch management
- SUPERVISOR: Workflow assignment and reporting
- EMPLEADO: Execute assigned workflows
- READONLY: View-only access

## Development Conventions

### Naming Conventions
- Component files use PascalCase (e.g., `Button.tsx`)
- Utility functions use camelCase
- Constants use SCREAMING_SNAKE_CASE
- Environment variables use UPPER_SNAKE_CASE

### Code Organization
- Components are organized by feature/functionality
- Shared components are in the `components/` directory
- Database logic is abstracted in `lib/db/`
- Business logic is separated from UI concerns
- Hooks are placed in the `hooks/` directory

### Testing
While not explicitly detailed in the files reviewed, the project follows Next.js best practices for testing with Jest/Vitest for unit tests and Playwright for end-to-end tests.

## Important Notes

1. The project is multi-tenant with data isolation between companies and branches
2. WhatsApp integration is central to the user experience, allowing workflow execution via WhatsApp
3. AI verification is used for validating workflow evidence with cost optimization between different providers
4. The system handles Mexican labor law compliance (NOM-035, federal labor law)
5. The application supports Spanish as the primary language for the target market

## Key Dependencies

- `@radix-ui/react-*` - Accessible UI components
- `drizzle-orm` - Database ORM
- `better-auth` - Authentication solution
- `@tanstack/react-table` - Data table component
- `recharts` - Charting library
- `react-hook-form` - Form management
- `zod` - Schema validation
- `@upstash/qstash` - Queue system
- `workflow` - Workflow engine

## Environment Variables

The application requires various environment variables for external services:
- Database URL
- AI provider API keys (OpenAI, etc.)
- WhatsApp API credentials
- Authentication secrets
- Storage credentials (Cloudflare R2)

## Special Considerations

1. The application implements sophisticated multi-tenant architecture with data isolation
2. Heavy emphasis on mobile-first experience via WhatsApp integration
3. AI cost optimization strategies are implemented to minimize expenses
4. Mexican regulatory compliance is built into the system
5. The workflow engine is the core functionality of the application