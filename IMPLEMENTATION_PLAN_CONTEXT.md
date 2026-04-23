# Pulso - Plan de Implementación con Contexto de Ingeniería

**Fecha**: Marzo 20, 2026  
**Versión**: 1.0  
**Propósito**: Guía completa para nuevos desarrolladores/agentes sobre la arquitectura, estructura, y plan de implementación del proyecto Pulso

---

## 📋 Tabla de Contenidos

1. [Visión General del Proyecto](#visión-general-del-proyecto)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Flujo de Datos](#flujo-de-datos)
5. [Dependencias Clave](#dependencias-clave)
6. [Plan de Implementación por Sprints](#plan-de-implementación-por-sprints)
7. [Guía por Carpetas](#guía-por-carpetas)
8. [Interconexiones entre Módulos](#interconexiones-entre-módulos)
9. [Checklist de Implementación](#checklist-de-implementación)

---

## Visión General del Proyecto

### ¿Qué es Pulso?

Pulso es una plataforma SaaS multi-tenant para la gestión de negocios HORECA (Hotel/Restaurante/Café). La plataforma permite:

- **Gestión de Workflows**: Checklists digitales para operaciones diarias (apertura, cierre, limpieza, control de calidad)
- **Inventario**: Control de stock, proveedores, transferencias entre sucursales
- **Cumplimiento Normativo**: Reportes para NOM-251 (COFEPRIS) y NOM-035 (STPS)
- **WhatsApp Integration**: Ejecución de workflows y notificaciones vía WhatsApp
- **Gestión Laboral**: Turnos, asistencia, horas extras
- **Analytics**: Dashboards y KPIs en tiempo real

### Stack Tecnológico

```
Frontend: Next.js 16.1.6 (App Router) + React 19.2.3
UI: Radix UI + Tailwind CSS + shadcn/ui
Estado: TanStack Query + React Hook Form
Backend: Next.js API Routes + Server Actions
Base de Datos: PostgreSQL (Neon) + Drizzle ORM
Auth: Better Auth
AI: OpenAI + Moondream
WhatsApp: WasenderAPI
Cola: Upstash QStash
```

### Estado Actual: **62% Completado**

---

## Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Browser   │  │   Móvil     │  │   WhatsApp  │              │
│  │   (Next.js) │  │   (PWA)     │  │   (Bot)     │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          └────────────────┴────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP (Vercel)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Middleware                            │   │
│  │  • Auth Verification                                     │   │
│  │  • Tenant Context Injection                              │   │
│  │  • RBAC Permission Check                                 │   │
│  │  • Rate Limiting                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  App Router  │  │  API Routes  │  │  Webhooks    │          │
│  │  (Pages)     │  │  (REST)      │  │  (WhatsApp)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┴─────────────────┘                   │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 Service Layer                            │   │
│  │  • workflow-execution-service.ts                         │   │
│  │  • inventory-service.ts                                  │   │
│  │  • notification-dispatcher.ts                            │   │
│  │  • ai-service.ts                                         │   │
│  │  • compliance-report-service.ts                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 External Services                        │   │
│  │  • Better Auth (Auth)                                    │   │
│  │  • OpenAI/Moondream (AI Verification)                    │   │
│  │  • WasenderAPI (WhatsApp)                                │   │
│  │  • Upstash QStash (Queue)                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ PostgreSQL Protocol
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NEON DATABASE (PostgreSQL)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Tablas Principales (25+)                                │   │
│  │  • users, sessions, accounts                             │   │
│  │  • companies, branches                                   │   │
│  │  • workflow_templates, workflow_instances                │   │
│  │  • inventory_items, inventory_batches                    │   │
│  │  • incidents, notifications                              │   │
│  │  • whatsapp_sessions, whatsapp_messages                  │   │
│  │  • planned_shifts, shift_sessions                        │   │
│  │  • kpi_definitions, kpi_history                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Patrones de Diseño

1. **Multi-Tenant Architecture**: Todas las queries están scopeadas por `companyId` y `branchId`
2. **Service Layer Pattern**: Lógica de negocio separada en `lib/services/`
3. **Repository Pattern**: Drizzle ORM como capa de acceso a datos
4. **Middleware Pattern**: Auth, RBAC, rate limiting en `middleware.ts`
5. **Event-Driven**: Webhooks de WhatsApp, triggers de workflows
6. **Queue-Based**: Upstash QStash para notificaciones asíncronas

---

## Estructura del Proyecto

### Árbol de Directorios Completo

```
pulso29/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 .well-known/              # Well-known URLs (security, etc.)
│   ├── 📁 actions/                  # Server Actions
│   ├── 📁 api/                      # API Routes (REST)
│   │   ├── 📁 auth/                 # Better Auth endpoints
│   │   ├── 📁 users/                # User CRUD
│   │   ├── 📁 companies/            # Company management
│   │   ├── 📁 branches/             # Branch management
│   │   ├── 📁 onboarding/           # Company onboarding
│   │   ├── 📁 workflow/             # Workflow execution
│   │   ├── 📁 workflow-templates/   # Template management
│   │   ├── 📁 workflow-assignments/ # Assignments
│   │   ├── 📁 workflow-schedules/   # Scheduling
│   │   ├── 📁 smart-links/          # WhatsApp smartlinks
│   │   ├── 📁 inventory/            # Inventory management
│   │   ├── 📁 incidents/            # Incident management
│   │   ├── 📁 whatsapp/             # WhatsApp integration
│   │   │   ├── webhook/             # Webhook receiver
│   │   │   └── session/             # Session management
│   │   ├── 📁 shifts/               # Shift management
│   │   ├── 📁 notifications/        # Notifications
│   │   ├── 📁 analytics/            # Analytics endpoints
│   │   ├── 📁 reports/              # Report generation
│   │   ├── 📁 kpi/                  # KPI endpoints
│   │   ├── 📁 cron/                 # Cron jobs
│   │   └── 📁 templates/            # Templates
│   ├── 📁 dashboard/                # Dashboard (protected routes)
│   │   ├── 📁 ai-verifications/     # AI verification management
│   │   ├── 📁 analytics/            # Analytics dashboard
│   │   ├── 📁 audit/                # Audit logs
│   │   ├── 📁 builder/              # Workflow builder UI
│   │   ├── 📁 company/              # Company settings
│   │   ├── 📁 compliance/           # Compliance reports
│   │   ├── 📁 evidence/             # Evidence management
│   │   ├── 📁 execute/              # Workflow execution UI
│   │   ├── 📁 incidents/            # Incident management UI
│   │   ├── 📁 inventory/            # Inventory UI
│   │   ├── 📁 labor/                # Labor management UI
│   │   ├── 📁 my-tasks/             # User tasks
│   │   ├── 📁 operations/           # Operations dashboard
│   │   ├── 📁 profile/              # User profile
│   │   ├── 📁 reports/              # Reports
│   │   ├── 📁 schedules/            # Schedules
│   │   ├── 📁 team/                 # Team management
│   │   ├── 📁 workflow-test/        # Workflow testing
│   │   ├── 📁 workflows/            # Workflows list
│   │   ├── layout.tsx               # Dashboard layout
│   │   └── page.tsx                 # Dashboard home
│   ├── 📁 join/                     # Join flow (invite links)
│   ├── 📁 onboarding/               # Company onboarding flow
│   ├── 📁 sign-in/                  # Sign in page
│   ├── 📁 sign-up/                  # Sign up page
│   ├── 📁 workflow/                 # Public workflow execution
│   ├── 📁 workflows/                # WhatsApp workflow handlers
│   ├── favicon.ico
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home page
│
├── 📁 components/                   # React Components
│   ├── 📁 analytics/                # Analytics components (KPIs, charts)
│   ├── 📁 assignments/              # Workflow assignment components
│   ├── 📁 builder/                  # Workflow builder components
│   │   ├── builder-canvas.tsx
│   │   ├── builder-header.tsx
│   │   ├── builder-properties.tsx
│   │   ├── builder-toolkit.tsx
│   │   ├── toolbox.tsx
│   │   └── sortable-step.tsx
│   ├── 📁 compliance/               # Compliance components
│   │   ├── compliance-metrics.tsx
│   │   ├── report-generator.tsx
│   │   └── (pendientes: nom251-report.tsx, nom035-report.tsx)
│   ├── 📁 dashboard/                # Dashboard components
│   │   ├── compliance-metrics.tsx
│   │   ├── recent-workflows-table.tsx
│   │   └── 📁 operations/
│   ├── 📁 execution/                # Workflow execution components
│   │   └── workflow-stepper.tsx
│   ├── 📁 incidents/                # Incident management components
│   │   ├── incident-list.tsx
│   │   ├── incident-alert.tsx
│   │   └── remediation-wizard.tsx
│   ├── 📁 inventory/                # Inventory components
│   │   ├── inventory-list.tsx
│   │   ├── stock-manager.tsx
│   │   ├── product-form.tsx
│   │   ├── receiving-form.tsx
│   │   ├── receiving-workflow.tsx
│   │   ├── supplier-list.tsx
│   │   ├── supplier-form.tsx
│   │   ├── supplier-detail.tsx
│   │   ├── transfer-list.tsx
│   │   ├── transfer-request.tsx
│   │   ├── stock-alerts.tsx
│   │   ├── barcode-scanner.tsx
│   │   └── scanner-modal.tsx
│   ├── 📁 labor/                    # Labor management components
│   │   ├── attendance-dashboard.tsx
│   │   ├── attendance-report.tsx
│   │   ├── clock-in-map.tsx
│   │   ├── geolocation-verify.tsx
│   │   ├── overtime-dashboard.tsx
│   │   ├── recurring-shift-builder.tsx
│   │   ├── schedule-calendar.tsx
│   │   ├── schedule-publisher.tsx
│   │   ├── shift-assignment.tsx
│   │   ├── shift-assignment-bulk.tsx
│   │   ├── shift-scheduler.tsx
│   │   ├── unified-shift-scheduler.tsx
│   │   └── weekly-shift-planner.tsx
│   ├── 📁 profile/                  # User profile components
│   ├── 📁 schedules/                # Schedule components
│   ├── 📁 team/                     # Team management components
│   │   ├── role-permission-matrix.tsx
│   │   └── user-edit-sheet.tsx
│   ├── 📁 ui/                       # Base UI components (shadcn)
│   ├── 📁 whatsapp/                 # WhatsApp components
│   └── 📁 workflow/                 # Workflow components
│       ├── ai-verification-status.tsx
│       ├── smart-link-generator.tsx
│       └── workflow-history-table.tsx
│   ├── app-sidebar.tsx              # Main sidebar navigation
│   ├── site-header.tsx              # Site header
│   ├── nav-company.tsx              # Company selector
│   ├── nav-user.tsx                 # User menu
│   ├── nav-main.tsx                 # Main navigation
│   ├── mode-toggle.tsx              # Dark/light mode toggle
│   └── theme-provider.tsx           # Theme provider
│
├── 📁 lib/                          # Library Code (Backend Logic)
│   ├── 📁 ai/                       # AI Providers
│   │   └── 📁 providers/
│   │       ├── moondream.ts         # Moondream AI provider
│   │       └── openai.ts            # OpenAI provider
│   ├── 📁 api/                      # API utilities
│   ├── 📁 cron/                     # Cron jobs
│   ├── 📁 db/                       # Database
│   │   ├── index.ts                 # DB connection
│   │   └── schema.ts                # Drizzle schema (731 líneas)
│   ├── 📁 notifications/            # Notification system
│   ├── 📁 rbac/                     # Role-Based Access Control
│   │   └── permissions.ts           # Permission matrix
│   ├── 📁 services/                 # Service Layer (25 archivos)
│   │   ├── ai-service.ts            # AI verification
│   │   ├── billing-service.ts       # Billing (Stripe)
│   │   ├── branch-service.ts        # Branch CRUD
│   │   ├── company-service.ts       # Company CRUD
│   │   ├── ComplianceReportService.ts  # Compliance reports
│   │   ├── escalation-service.ts    # Incident escalation
│   │   ├── holiday-service.ts       # Holiday management
│   │   ├── incident-engine.ts       # Incident detection
│   │   ├── inventory-service.ts     # Inventory management
│   │   ├── kpi-service.ts           # KPI calculations
│   │   ├── labor-calculator.ts      # Labor calculations
│   │   ├── notification-dispatcher.ts  # Notification dispatch
│   │   ├── notification-service.ts  # Notification service
│   │   ├── remediation-service.ts   # Remediation protocols
│   │   ├── shift-service.ts         # Shift management
│   │   ├── shift-workflow-service.ts # Shift-workflow integration
│   │   ├── smart-link-service.ts    # Smartlink generation
│   │   ├── user-service.ts          # User CRUD
│   │   ├── verification-engine.ts   # Verification engine
│   │   ├── whatsapp-service.ts      # WhatsApp integration
│   │   ├── workflow-assignment-service.ts  # Assignments
│   │   ├── workflow-execution-service.ts # Execution
│   │   ├── workflow-schedule-service.ts  # Scheduling
│   │   ├── workflow-template-service.ts  # Templates
│   │   └── workflow-trigger-service.ts   # Triggers
│   ├── 📁 types/                    # TypeScript types
│   ├── 📁 validations/              # Zod schemas
│   ├── 📁 whatsapp/                 # WhatsApp Integration
│   │   ├── 📁 handlers/             # Message handlers
│   │   │   └── labor-handler.ts     # Labor commands
│   │   ├── command-parser.ts        # Command parsing
│   │   ├── message-formatter.ts     # Message templates
│   │   ├── message-router.ts        # Message routing
│   │   ├── notification-dispatcher.ts  # Notification dispatch
│   │   ├── notification-queue.ts    # Queue with QStash
│   │   ├── session-manager.ts       # Session management
│   │   └── wasender-client.ts       # WasenderAPI client
│   ├── auth.ts                      # Auth configuration
│   ├── auth-config.ts               # Auth config
│   ├── auth-client.ts               # Auth client
│   ├── permissions.ts               # Permission utilities
│   ├── rate-limiter.ts              # Rate limiting
│   ├── tenant-context.ts            # Tenant context
│   └── utils.ts                     # Utility functions
│
├── 📁 hooks/                        # React Hooks
│
├── 📁 drizzle/                      # Database Migrations
│   ├── 📁 meta/
│   ├── 0000_dapper_proudstar.sql
│   ├── 0001_solid_blonde_phantom.sql
│   └── 0002_add_workflow_template_to_shifts.sql
│
├── 📁 docs/                         # Documentation
│   ├── SISTEMA_TURNOS.md            # Shift system docs
│   └── WHATSAPP_QUICK_REFERENCE.md  # WhatsApp reference
│
├── 📁 templates/                    # Workflow Templates
│   ├── README.md
│   ├── technical-documentation.md
│   ├── TEMPLATE_SCHEMA.md
│   ├── TEMPLATES_CATALOG.md
│   └── user-guide.md
│
├── 📁 tests/                        # Tests (pendiente)
│   ├── 📁 e2e/                      # E2E tests (Playwright)
│   └── 📁 unit/                     # Unit tests
│
├── 📁 public/                       # Static Assets
│
├── middleware.ts                    # Next.js Middleware
├── next.config.ts                   # Next.js config
├── drizzle.config.ts                # Drizzle config
├── package.json                     # Dependencies
├── components.json                  # shadcn/ui config
├── tailwind.config.ts               # Tailwind config
├── tsconfig.json                    # TypeScript config
├── .env                             # Environment variables
├── .env.example                     # Environment example
└── README.md                        # Project README
```

---

## Flujo de Datos

### 1. Flujo de Autenticación

```
Usuario → /sign-in → POST /api/auth/sign-in
    ↓
Better Auth valida credenciales
    ↓
Crea sesión en tabla `sessions`
    ↓
Devuelve JWT token
    ↓
Middleware verifica cookie en cada request
    ↓
Inyecta userId y companyId en headers (x-user-id, x-pulso-tenant-id)
    ↓
API routes acceden a user desde headers
```

**Archivos clave**:
- `app/api/auth/` - Endpoints de auth
- `lib/auth.ts` - Configuración de Better Auth
- `middleware.ts` - Verificación de sesión
- `lib/tenant-context.ts` - Contexto multi-tenant

### 2. Flujo de Creación de Workflow

```
Usuario (Dashboard) → /dashboard/builder
    ↓
Builder UI (components/builder/)
    ↓
Drag-and-drop de steps
    ↓
Configuración de cada step
    ↓
Guardar → POST /api/workflow-templates
    ↓
workflow-template-service.ts
    ↓
db.insert(workflowTemplates)
    ↓
Workflow template guardado con steps en JSONB
```

**Archivos clave**:
- `app/dashboard/builder/` - UI del builder
- `components/builder/` - Componentes del builder
- `lib/services/workflow-template-service.ts` - Service layer
- `lib/db/schema.ts` - Tabla `workflow_templates`

### 3. Flujo de Ejecución de Workflow

```
Usuario asignado → Recibe notificación WhatsApp
    ↓
Click en smartlink → /workflow/[id]
    ↓
Smartlink valida token (magic_links table)
    ↓
Workflow stepper UI (components/execution/)
    ↓
Step-by-step con validación
    ↓
Cada step → PATCH /api/workflow-instances/:id/step
    ↓
workflow-execution-service.ts
    ↓
Si step tiene AI verification → ai-service.ts
    ↓
Si falla validación → incident-engine.ts
    ↓
Completar workflow → POST /api/workflow-instances/:id/complete
```

**Archivos clave**:
- `app/workflow/` - Ejecución pública
- `app/dashboard/execute/` - Ejecución desde dashboard
- `components/execution/workflow-stepper.tsx` - Stepper UI
- `lib/services/workflow-execution-service.ts` - Service layer
- `lib/services/ai-service.ts` - AI verification
- `lib/services/incident-engine.ts` - Detección de incidentes
- `lib/services/smart-link-service.ts` - Smartlinks

### 4. Flujo de Notificaciones WhatsApp

```
Evento (workflow asignado, incidente, etc.)
    ↓
notification-service.ts
    ↓
notification-dispatcher.ts
    ↓
Encola en QStash (notification-queue.ts)
    ↓
QStash llama a /api/notifications/process
    ↓
notification-dispatcher.ts procesa
    ↓
Verifica preferencias de usuario
    ↓
wasender-client.ts envía mensaje
    ↓
WhatsApp recibe mensaje
    ↓
Usuario responde → Webhook /api/whatsapp/webhook
    ↓
command-parser.ts parsea comando
    ↓
message-router.ts rutea a handler
    ↓
Handler ejecuta acción (clock-in, workflow, etc.)
```

**Archivos clave**:
- `lib/whatsapp/` - Todo el sistema WhatsApp
- `lib/services/notification-*.ts` - Notificaciones
- `app/api/whatsapp/webhook/` - Webhook receiver
- `app/api/notifications/` - Notification endpoints

### 5. Flujo de Inventario

```
Usuario → /dashboard/inventory
    ↓
inventory-list.tsx muestra items
    ↓
GET /api/inventory
    ↓
inventory-service.ts
    ↓
db.select(inventoryItems)
    ↓
Receiving workflow:
  Usuario escanea producto
    ↓
receiving-workflow.tsx
    ↓
POST /api/inventory/receiving
    ↓
inventory-service.ts crea batch
    ↓
db.insert(inventoryBatches)
    ↓
db.insert(inventoryMovements)
    ↓
Actualiza stock
```

**Archivos clave**:
- `app/dashboard/inventory/` - UI de inventario
- `components/inventory/` - Componentes de inventario
- `lib/services/inventory-service.ts` - Service layer
- `lib/db/schema.ts` - Tablas de inventario

---

## Dependencias Clave

### Dependencias de Producción

```json
{
  "@radix-ui/react-*": "Componentes UI accesibles",
  "@dnd-kit/*": "Drag-and-drop para workflow builder",
  "@stepperize/react": "Multi-stepper UI para ejecución",
  "recharts": "Gráficos y dashboards",
  "drizzle-orm": "ORM para PostgreSQL",
  "better-auth": "Autenticación",
  "zod": "Validación de schemas",
  "openai": "AI provider",
  "workflow": "Workflow engine",
  "@upstash/qstash": "Queue para notificaciones"
}
```

### Dependencias de Desarrollo

```json
{
  "drizzle-kit": "Migraciones de DB",
  "typescript": "Type checking",
  "eslint": "Linting",
  "tailwindcss": "Estilos"
}
```

---

## Plan de Implementación por Sprints

### Sprint 1: Compliance Intelligence (Semana 1-2)

**Objetivo**: Sistema de compliance funcional con reportes NOM-251 y NOM-035

#### Tarea 1.1: Reportes NOM-251
**Prioridad**: P0 | **Estimado**: 3 días

**Archivos a crear/modificar**:
```
lib/services/ComplianceReportService.ts  (modificar)
app/api/reports/nom-251/route.ts          (crear)
components/compliance/nom251-report.tsx   (crear)
```

**Qué hacer en cada archivo**:

1. **`lib/services/ComplianceReportService.ts`**:
   - Agregar método `generateNOM251Report(companyId, branchId, dateRange)`
   - Query a `workflow_instances` completados en el período
   - Incluir evidencias (fotos, firmas) desde `workflow_instance_steps`
   - Calcular % de compliance por categoría
   - Retornar objeto con datos para PDF

2. **`app/api/reports/nom-251/route.ts`**:
   - Crear endpoint POST
   - Validar permisos con RBAC
   - Llamar a `ComplianceReportService.generateNOM251Report()`
   - Generar PDF con jspdf
   - Retornar PDF como blob

3. **`components/compliance/nom251-report.tsx`**:
   - Formulario para seleccionar rango de fechas
   - Vista previa de datos antes de generar PDF
   - Botón de descarga
   - Mostrar progreso de generación

**Interconexiones**:
- Depende de: `workflow-execution-service.ts` (para obtener instancias)
- Depende de: `ai-service.ts` (para verificaciones)
- Usa: `jspdf`, `jspdf-autotable`

---

#### Tarea 1.2: Reportes NOM-035
**Prioridad**: P0 | **Estimado**: 3 días

**Archivos a crear/modificar**:
```
lib/services/ComplianceReportService.ts  (modificar)
app/api/reports/nom-035/route.ts          (crear)
components/compliance/nom035-report.tsx   (crear)
components/compliance/psychosocial-dashboard.tsx (crear)
```

**Qué hacer**:
- Similar a NOM-251 pero con datos de evaluación psicosocial
- Incluir encuestas de estrés laboral
- Calcular niveles de riesgo por empleado
- Generar recomendaciones automáticas

---

#### Tarea 1.3: WhatsApp Notifications (Completar)
**Prioridad**: P0 | **Estimado**: 2 días

**Archivos a modificar**:
```
lib/whatsapp/wasender-client.ts           (configurar)
app/api/whatsapp/webhook/route.ts         (testear)
lib/services/notification-dispatcher.ts   (integrar)
```

**Qué hacer**:
- Configurar variables de entorno WASENDER
- Testear webhook con ngrok
- Verificar templates de mensajes
- Integrar con QStash

---

### Sprint 2: Inventario & Seguridad (Semana 3-4)

**Objetivo**: Sistema de inventarios completo y seguridad reforzada

#### Tarea 2.1: Receiving Workflows
**Prioridad**: P0 | **Estimado**: 3 días

**Archivos a crear/modificar**:
```
lib/services/inventory-service.ts         (modificar)
app/api/inventory/receiving/route.ts      (crear)
components/inventory/receiving-workflow.tsx (crear)
components/inventory/receiving-form.tsx   (crear)
```

**Qué hacer**:
- Crear workflow template para recepción
- Escanear/ingresar items
- Verificar cantidad vs orden
- Registrar batches
- Actualizar stock automáticamente

---

#### Tarea 2.2: Rate Limiting
**Prioridad**: P0 | **Estimado**: 2 días

**Archivos a modificar**:
```
middleware.ts                             (modificar)
lib/rate-limiter.ts                       (crear)
app/api/rate-limit-status/route.ts        (crear)
```

**Qué hacer en `lib/rate-limiter.ts`**:
```typescript
import { LRUCache } from 'lru-cache'

const options = {
  max: 10000,
  ttl: 60 * 1000, // 1 minuto
}

const rateLimitCache = new LRUCache(options)

export function checkRateLimit(userId: string, endpoint: string) {
  const key = `${userId}:${endpoint}`
  const current = rateLimitCache.get(key) || 0
  
  if (current >= 100) {
    return { allowed: false, remaining: 0 }
  }
  
  rateLimitCache.set(key, current + 1)
  return { allowed: true, remaining: 100 - current }
}
```

**Interconexiones**:
- Middleware llama a `checkRateLimit()` en cada request API
- Retorna 429 si excede límite
- Headers `X-RateLimit-*` en respuesta

---

### Sprint 3: Labor Management (Semana 5-6)

**Objetivo**: Gestión de turnos funcional

#### Tarea 3.1: Schedule Builder UI
**Prioridad**: P1 | **Estimado**: 4 días

**Archivos a crear/modificar**:
```
app/dashboard/labor/schedule-builder/page.tsx (crear)
components/labor/schedule-calendar.tsx    (modificar)
components/labor/shift-assignment.tsx     (modificar)
```

**Qué hacer**:
- Calendar view semanal/mensual
- Drag-and-drop para asignar turnos
- Configurar tipos de turno
- Publicar schedule (notificar empleados)

---

### Sprint 4: Analytics & MVP Polish (Semana 7-8)

**Objetivo**: Dashboard de analytics y preparación para MVP

#### Tarea 4.1: KPI Definitions Schema
**Prioridad**: P1 | **Estimado**: 2 días

**Archivos a modificar**:
```
lib/db/schema.ts                            (ya está creado)
lib/services/kpi-service.ts                 (modificar)
```

**Qué hacer**:
- La tabla `kpi_definitions` ya existe en schema
- Implementar métodos en `kpi-service.ts`
- Seed data con KPIs predefinidos

---

## Guía por Carpetas

### 📁 `app/`

**Propósito**: Next.js App Router - todas las páginas y API routes

**Subcarpetas principales**:

#### `app/api/`
- **Qué contiene**: Endpoints REST
- **Cuándo modificar**: Cuando necesites crear/modify API endpoints
- **Convenciones**:
  - Cada recurso tiene su carpeta (`/api/users`, `/api/inventory`)
  - Métodos HTTP: GET (list), POST (create), PATCH (update), DELETE (delete)
  - Validación con Zod en cada endpoint
  - Error handling consistente

**Ejemplo - Crear nuevo endpoint**:
```typescript
// app/api/nuevo-recurso/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { nuevoRecurso } from '@/lib/db/schema'

const createSchema = z.object({
  nombre: z.string().min(1),
  // ... más campos
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validated = createSchema.parse(body)
  
  const result = await db.insert(nuevoRecurso).values(validated)
  
  return NextResponse.json({ data: result })
}
```

#### `app/dashboard/`
- **Qué contiene**: Páginas protegidas del dashboard
- **Cuándo modificar**: Cuando agregues nueva funcionalidad UI
- **Requiere**: Autenticación (middleware verifica sesión)
- **Estructura**:
  - Cada feature tiene su carpeta (`/dashboard/inventory`, `/dashboard/workflows`)
  - `page.tsx` - Página principal
  - Componentes en `components/` correspondientes

#### `app/workflow/`
- **Qué contiene**: Ejecución pública de workflows (vía smartlink)
- **Cuándo modificar**: Cuando cambies flujo de ejecución
- **Importante**: No requiere auth (usa token de magic_link)

---

### 📁 `components/`

**Propósito**: Componentes React reutilizables

**Subcarpetas**:

#### `components/builder/`
- **Qué contiene**: Componentes del workflow builder
- **Cuándo modificar**: Cuando agregues nuevos step types o funcionalidad al builder
- **Componentes clave**:
  - `builder-canvas.tsx` - Área principal de diseño
  - `builder-toolkit.tsx` - Herramientas disponibles
  - `sortable-step.tsx` - Step draggable

#### `components/execution/`
- **Qué contiene**: Componentes de ejecución de workflows
- **Cuándo modificar**: Cuando cambies flujo de ejecución
- **Componente clave**: `workflow-stepper.tsx` (536 líneas)

#### `components/inventory/`
- **Qué contiene**: Componentes de inventario
- **Cuándo modificar**: Cuando agregues funcionalidad de inventario
- **Componentes clave**:
  - `inventory-list.tsx` - Lista de items
  - `receiving-workflow.tsx` - Workflow de recepción
  - `transfer-request.tsx` - Transferencias

#### `components/labor/`
- **Qué contiene**: Componentes de gestión laboral
- **Cuándo modificar**: Cuando agregues funcionalidad de turnos/asistencia
- **Componentes clave**:
  - `schedule-calendar.tsx` - Calendario de turnos
  - `shift-assignment.tsx` - Asignación de turnos
  - `attendance-dashboard.tsx` - Dashboard de asistencia

---

### 📁 `lib/`

**Propósito**: Lógica de negocio, servicios, utilidades

#### `lib/db/`
- **`schema.ts`** (731 líneas):
  - **Qué contiene**: Definición de todas las tablas con Drizzle ORM
  - **Cuándo modificar**: Cuando necesites nuevas tablas o campos
  - **Importante**: Después de modificar, correr `pnpm dlx drizzle-kit push`

- **`index.ts`**:
  - **Qué contiene**: Conexión a base de datos
  - **Cuándo modificar**: Rara vez (solo si cambias configuración de DB)

#### `lib/services/`
- **Qué contiene**: Service layer - toda la lógica de negocio
- **Cuándo modificar**: Cuando agregues/modify funcionalidad de negocio
- **Patrón**: Cada servicio maneja un dominio (workflows, inventory, users, etc.)

**Ejemplo - Modificar servicio**:
```typescript
// lib/services/inventory-service.ts
export async function createInventoryItem(data: CreateInventoryItemData) {
  // 1. Validar datos
  // 2. Verificar permisos (tenant isolation)
  // 3. Insertar en DB
  // 4. Crear movimiento inicial
  // 5. Retornar item creado
}
```

**Servicios principales**:
| Servicio | Responsabilidad |
|----------|----------------|
| `workflow-execution-service.ts` | Ejecución de workflows |
| `workflow-template-service.ts` | Templates de workflows |
| `inventory-service.ts` | Gestión de inventario |
| `notification-dispatcher.ts` | Envío de notificaciones |
| `ai-service.ts` | Verificación con AI |
| `incident-engine.ts` | Detección de incidentes |
| `shift-service.ts` | Gestión de turnos |
| `user-service.ts` | CRUD de usuarios |

#### `lib/whatsapp/`
- **Qué contiene**: Integración con WhatsApp (WasenderAPI)
- **Cuándo modificar**: Cuando cambies funcionalidad de WhatsApp
- **Archivos clave**:
  - `wasender-client.ts` - Cliente de WasenderAPI
  - `message-formatter.ts` - Templates de mensajes
  - `notification-dispatcher.ts` - Dispatcher de notificaciones
  - `command-parser.ts` - Parseo de comandos
  - `handlers/labor-handler.ts` - Handler de comandos de labor

#### `lib/rbac/`
- **`permissions.ts`**:
  - **Qué contiene**: Matrix de permisos por rol
  - **Cuándo modificar**: Cuando agregues nuevos roles o permisos
  - **Importante**: Todas las API routes verifican permisos aquí

#### `lib/ai/`
- **Qué contiene**: Proveedores de AI
- **Cuándo modificar**: Cuando agregues nuevos proveedores o cambies lógica de verificación
- **Proveedores**: Moondream, OpenAI

---

### 📁 `drizzle/`

**Propósito**: Migraciones de base de datos

**Cuándo modificar**: Después de cambiar `lib/db/schema.ts`

**Comandos**:
```bash
# Generar nueva migración
pnpm dlx drizzle-kit generate

# Aplicar migraciones
pnpm dlx drizzle-kit push

# Studio (GUI)
pnpm dlx drizzle-kit studio
```

---

### 📁 `hooks/`

**Propósito**: React hooks personalizados

**Cuándo modificar**: Cuando necesites lógica reutilizable en componentes

---

## Interconexiones entre Módulos

### Módulo de Workflows

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW MODULE                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  app/dashboard/builder/ ←→ components/builder/              │
│         ↓ (guarda)                                           │
│  lib/services/workflow-template-service.ts                  │
│         ↓ (inserta en)                                       │
│  lib/db/schema.ts → workflow_templates                      │
│                                                              │
│  app/dashboard/execute/ ←→ components/execution/            │
│         ↓ (ejecuta)                                          │
│  lib/services/workflow-execution-service.ts                 │
│         ↓ (inserta en)                                       │
│  lib/db/schema.ts → workflow_instances                      │
│         ↓ (cada step)                                        │
│  lib/db/schema.ts → workflow_instance_steps                 │
│                                                              │
│  Si step tiene AI verification:                              │
│    → lib/services/ai-service.ts                             │
│    → lib/ai/providers/openai.ts                             │
│                                                              │
│  Si step falla validación:                                   │
│    → lib/services/incident-engine.ts                        │
│    → lib/db/schema.ts → incidents                           │
│                                                              │
│  Si workflow se asigna vía WhatsApp:                         │
│    → lib/services/smart-link-service.ts                     │
│    → lib/db/schema.ts → magic_links                         │
│    → lib/whatsapp/wasender-client.ts                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Módulo de Inventario

```
┌─────────────────────────────────────────────────────────────┐
│                   INVENTORY MODULE                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  app/dashboard/inventory/ ←→ components/inventory/          │
│         ↓ (opera)                                            │
│  lib/services/inventory-service.ts                          │
│         ↓ (inserta en)                                       │
│  lib/db/schema.ts → inventory_items                         │
│  lib/db/schema.ts → inventory_batches                       │
│  lib/db/schema.ts → inventory_movements                     │
│                                                              │
│  Receiving workflow:                                         │
│    → components/inventory/receiving-workflow.tsx            │
│    → app/api/inventory/receiving/route.ts                   │
│    → inventory-service.ts (crea batch + movimiento)         │
│                                                              │
│  Transferencias:                                             │
│    → components/inventory/transfer-request.tsx              │
│    → app/api/inventory/transfers/route.ts                   │
│    → inventory-service.ts (actualiza stock en ambas)        │
│                                                              │
│  Alerts de stock bajo:                                       │
│    → components/inventory/stock-alerts.tsx                  │
│    → inventory-service.ts (verifica minLevel)               │
│    → lib/services/notification-service.ts                   │
│                                                              │
│  Proveedores:                                                │
│    → components/inventory/supplier-*.tsx                    │
│    → lib/db/schema.ts → suppliers                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Módulo de WhatsApp

```
┌─────────────────────────────────────────────────────────────┐
│                   WHATSAPP MODULE                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  WasenderAPI ←→ lib/whatsapp/wasender-client.ts             │
│         ↓ (envía/recibe)                                     │
│  lib/whatsapp/message-formatter.ts (templates)              │
│         ↓                                                    │
│  lib/whatsapp/notification-dispatcher.ts                    │
│         ↓                                                    │
│  lib/whatsapp/notification-queue.ts (QStash)                │
│                                                              │
│  Webhook entrante:                                           │
│    → app/api/whatsapp/webhook/route.ts                      │
│    → lib/whatsapp/command-parser.ts                         │
│    → lib/whatsapp/message-router.ts                         │
│    → lib/whatsapp/handlers/labor-handler.ts                 │
│    → Ejecuta acción (clock-in, workflow, etc.)              │
│                                                              │
│  Smartlinks:                                                 │
│    → lib/services/smart-link-service.ts                     │
│    → lib/db/schema.ts → magic_links                         │
│    → app/workflow/[id] (ejecución pública)                  │
│                                                              │
│  Notificaciones:                                             │
│    → lib/services/notification-service.ts                   │
│    → notification-dispatcher.ts                             │
│    → wasender-client.ts                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Módulo de Labor

```
┌─────────────────────────────────────────────────────────────┐
│                     LABOR MODULE                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  app/dashboard/labor/ ←→ components/labor/                  │
│         ↓ (opera)                                            │
│  lib/services/shift-service.ts                              │
│         ↓ (inserta en)                                       │
│  lib/db/schema.ts → planned_shifts                          │
│  lib/db/schema.ts → shift_sessions                          │
│  lib/db/schema.ts → break_logs                              │
│                                                              │
│  Schedule builder:                                           │
│    → components/labor/schedule-calendar.tsx                 │
│    → components/labor/shift-assignment.tsx                  │
│    → shift-service.ts (crea turnos)                         │
│                                                              │
│  Clock in/out:                                               │
│    → components/labor/geolocation-verify.tsx                │
│    → app/api/shifts/clock-in/route.ts                       │
│    → shift-service.ts (registra sesión)                     │
│    → workflow-execution-service.ts (inicia workflow)        │
│                                                              │
│  Attendance reports:                                         │
│    → components/labor/attendance-report.tsx                 │
│    → app/api/reports/attendance/route.ts                    │
│    → shift-service.ts (calcula horas)                       │
│    → lib/services/labor-calculator.ts                       │
│                                                              │
│  Overtime:                                                   │
│    → components/labor/overtime-dashboard.tsx                │
│    → labor-calculator.ts (calcula 2x, 3x)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Módulo de Compliance

```
┌─────────────────────────────────────────────────────────────┐
│                   COMPLIANCE MODULE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  app/dashboard/compliance/ ←→ components/compliance/        │
│         ↓ (genera)                                           │
│  lib/services/ComplianceReportService.ts                    │
│         ↓ (obtiene datos de)                                 │
│  workflow-execution-service.ts (instancias completadas)     │
│  ai-service.ts (verificaciones)                             │
│  incident-engine.ts (incidentes)                            │
│         ↓ (genera PDF)                                       │
│  jspdf, jspdf-autotable                                     │
│                                                              │
│  Reportes:                                                   │
│    → NOM-251 (COFEPRIS) - workflows de inocuidad            │
│    → NOM-035 (STPS) - riesgos psicosociales                 │
│                                                              │
│  Dashboard:                                                  │
│    → components/compliance/compliance-metrics.tsx           │
│    → Muestra: compliance rate, inspections, incidents       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Checklist de Implementación

### Sprint 1 - Compliance & WhatsApp

- [ ] 1.1.1 Definir estructura de reporte NOM-251
- [ ] 1.1.2 Implementar generación PDF con jspdf
- [ ] 1.1.3 Incluir workflows completados con evidencia
- [ ] 1.1.4 Agregar firmas digitales y timestamps
- [ ] 1.1.5 Calcular porcentajes de compliance
- [ ] 1.1.6 Endpoint API: `POST /api/reports/nom-251`
- [ ] 1.1.7 UI: Vista previa de reporte
- [ ] 1.2.1 Definir estructura de reporte NOM-035
- [ ] 1.2.2 Implementar formato PDF
- [ ] 1.2.3 Incluir encuestas de estrés laboral
- [ ] 1.2.4 Calcular niveles de riesgo
- [ ] 1.2.5 Endpoint API: `POST /api/reports/nom-035`
- [ ] 1.2.6 UI: Dashboard de riesgos psicosociales
- [ ] 1.3.1 Configurar WASENDER API
- [ ] 1.3.2 Testear webhook receiver
- [ ] 1.3.3 Integrar templates de mensajes
- [ ] 1.3.4 Configurar QStash para colas
- [ ] 1.3.5 Testear delivery tracking
- [ ] 1.3.6 Verificar opt-in/opt-out
- [ ] 1.4.1 Generar smartlinks con token
- [ ] 1.4.2 Integrar AI verification en smartlink
- [ ] 1.4.3 Upload de fotos desde WhatsApp
- [ ] 1.5.1 Scorecards visuales de compliance
- [ ] 1.5.2 Deadline tracking
- [ ] 1.5.3 Historical trends

### Sprint 2 - Inventario & Seguridad

- [ ] 2.1.1 Crear workflow template para recepción
- [ ] 2.1.2 Escanear/ingresar items recibidos
- [ ] 2.1.3 Verificar cantidad vs orden
- [ ] 2.1.4 Registrar batches
- [ ] 2.1.5 Actualizar stock automáticamente
- [ ] 2.1.6 UI de receiving móvil-friendly
- [ ] 2.2.1 Solicitar transferencia de origen
- [ ] 2.2.2 Aprobar transferencia
- [ ] 2.2.3 Registrar envío
- [ ] 2.2.4 Confirmar recepción
- [ ] 2.2.5 Actualizar stock en ambas sucursales
- [ ] 2.3.1 Configurar thresholds por item
- [ ] 2.3.2 Job diario para verificar stock
- [ ] 2.3.3 Generar alertas automáticas
- [ ] 2.3.4 Notificar a responsables
- [ ] 2.3.5 Dashboard de alertas
- [ ] 2.4.1 CRUD de proveedores (UI)
- [ ] 2.4.2 Lista de proveedores
- [ ] 2.4.3 Detalle de proveedor
- [ ] 2.5.1 Implementar rate limiting middleware
- [ ] 2.5.2 Configurar límites (100 req/min)
- [ ] 2.5.3 Headers de rate limit
- [ ] 2.5.4 Respuesta 429
- [ ] 2.6.1 Refresh token rotation
- [ ] 2.6.2 Configurar expiry
- [ ] 2.7.1 Integrar barcode scanning
- [ ] 2.7.2 UI de escaneo

### Sprint 3 - Labor Management

- [ ] 3.1.1 Calendar view semanal/mensual
- [ ] 3.1.2 Drag-and-drop para asignar turnos
- [ ] 3.1.3 Configurar tipos de turno
- [ ] 3.1.4 Asignar empleados
- [ ] 3.1.5 Publicar schedule
- [ ] 3.2.1 Obtener geolocalización en clock-in
- [ ] 3.2.2 Verificar ubicación dentro de radio
- [ ] 3.2.3 Registrar coordenadas
- [ ] 3.2.4 Alertar si fuera de rango
- [ ] 3.3.1 Reporte de asistencia por empleado
- [ ] 3.3.2 Reporte por sucursal
- [ ] 3.3.3 Calcular horas, breaks, overtime
- [ ] 3.3.4 Exportar a Excel/PDF
- [ ] 3.4.1 UI de preferencias de notificación
- [ ] 3.4.2 Toggle por canal
- [ ] 3.4.3 Toggle por tipo de evento
- [ ] 3.5.1 Sistema de colas para notificaciones
- [ ] 3.5.2 Router de notificaciones
- [ ] 3.5.3 Templates personalizables
- [ ] 3.5.4 Batch processing
- [ ] 3.6.1 Definir reglas de overtime
- [ ] 3.6.2 Calcular horas extras
- [ ] 3.6.3 Diferenciar tipos de overtime
- [ ] 3.6.4 Reporte de overtime

### Sprint 4 - Analytics & MVP Polish

- [ ] 4.1.1 Seed data con KPIs predefinidos
- [ ] 4.1.2 Métodos en kpi-service.ts
- [ ] 4.2.1 UI para crear KPI personalizado
- [ ] 4.2.2 Editor de fórmulas
- [ ] 4.2.3 Configurar targets y thresholds
- [ ] 4.3.1 Dashboard con múltiples KPIs
- [ ] 4.3.2 Gráficos de tendencias
- [ ] 4.3.3 Drill-down por sucursal
- [ ] 4.4.1 Configurar thresholds de alerta
- [ ] 4.4.2 Monitoreo continuo
- [ ] 4.4.3 Trigger alertas automáticas
- [ ] 4.4.4 Notificar a responsables
- [ ] 4.5.1 Revisar issues de GitHub
- [ ] 4.5.2 Fix bugs críticos (P0)
- [ ] 4.5.3 Fix bugs menores (P1, P2)
- [ ] 4.5.4 Mejorar UX en flujos problemáticos
- [ ] 4.6.1 Documentar API (OpenAPI)
- [ ] 4.6.2 Guía de usuario final
- [ ] 4.6.3 README actualizado
- [ ] 4.7.1 Configurar Playwright
- [ ] 4.7.2 Tests para flujos críticos
- [ ] 4.7.3 Tests para API endpoints

---

## Variables de Entorno Requeridas

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
BETTER_AUTH_SECRET=your_secret_here

# AI Providers
OPENAI_API_KEY=sk-...
MOONDREAM_API_KEY=...

# WhatsApp
WASENDER_API_URL=https://api.wasender.com/v1
WASENDER_API_KEY=your_api_key_here
WASENDER_WEBHOOK_SECRET=your_webhook_secret_here

# Queue
QSTASH_TOKEN=your_qstash_token_here

# App
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

---

## Comandos Útiles

```bash
# Desarrollo
pnpm dev                    # Iniciar dev server
pnpm build                  # Build de producción
pnpm start                  # Start production server

# Database
pnpm dlx drizzle-kit push   # Aplicar migraciones
pnpm dlx drizzle-kit generate  # Generar nueva migración
pnpm dlx drizzle-kit studio    # Abrir DB studio

# Linting
pnpm lint                   # ESLint

# Testing (pendiente configurar)
pnpm test                   # Unit tests
pnpm test:e2e               # E2E tests
```

---

## Recursos Adicionales

- **PRD**: `prd.md` (1912 líneas)
- **Schema**: `lib/db/schema.ts` (731 líneas)
- **Implementación Estado**: `IMPLEMENTACION_ESTADO.md`
- **WhatsApp Implementation**: `WHATSAPP_IMPLEMENTATION.md`
- **Sistema de Turnos**: `docs/SISTEMA_TURNOS.md`

---

**Documento generado para facilitar la incorporación de nuevos desarrolladores al proyecto Pulso**  
*Última actualización: Marzo 20, 2026*
