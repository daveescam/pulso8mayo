# Pulso HORECA - Contexto del Proyecto

> **Documento de referencia para nuevas sesiones**
> 
> **Última actualización:** 2026-04-27
> **Estado del Build:** ✅ EXITOSO
> **Commit:** Ver git log para cambios recientes

---

## 🎯 Visión General

Pulso HORECA es una plataforma integral de gestión para empresas del sector hotelero, restaurantero y cafetero (HORECA). Proporciona herramientas para:

- Gestión de empleados y nómina
- Cumplimiento normativo (NOM-251, NOM-035, LFT)
- Workflows y checklists operativos
- Control de inventario
- Sistema de turnos y asistencia
- Reportes y analytics
- Notificaciones multicanal (WhatsApp, Email, In-App)

---

## 🏗️ Stack Tecnológico

```yaml
Frontend: Next.js 16 (App Router), React 19, TypeScript
UI: Radix UI, Tailwind CSS v4, Recharts
Backend: Next.js API Routes, Server Actions
Database: Neon Postgres + Drizzle ORM
Auth: better-auth (session-based)
Cron/Queues: Upstash QStash + Redis
Notifications: WasenderAPI (WhatsApp), Resend (Email)
Storage: Cloudflare R2 (S3-compatible)
Validation: Zod v4, react-hook-form
Testing: Playwright (E2E)
Package Manager: pnpm (NO usar npm)
```

### Comandos Importantes

```bash
# Instalar dependencias
pnpm install

# Desarrollo
pnpm run dev  # localhost:3000

# Build
pnpm run build

# Testing
pnpm test:e2e

# Database
pnpm db:generate  # drizzle-kit generate
pnpm db:push      # ⚠️ CUIDADO: puede dropear schemas
pnpm db:migrate

# Seed
npx tsx scripts/seed-demo-data.ts
```

---

## ✅ Estado de Implementación

### Fase 1: Notificaciones - COMPLETADA ✅

**Archivos clave implementados:**
- `lib/services/notification-service.ts` - Servicio principal de notificaciones
- `lib/services/notification-dispatcher.ts` - Dispatcher con templates
- `lib/whatsapp/wasender-client.ts` - Cliente WasenderAPI

**Funcionalidades:**
- [x] WhatsApp via WasenderAPI
- [x] Email via Resend (lazy loading)
- [x] In-App notifications (tabla `notifications`)
- [x] User preferences (tabla `notificationPreferences`)
- [x] Templates para workflow assignments, due soon, overdue, incidents, stock alerts
- [x] Fallback con logging cuando servicios no están configurados

### Fase 2: Reportes - COMPLETADA ✅

**Archivos creados:**
- `app/api/imss/sua-generate/route.ts` - Generador SUA
- `app/api/imss/idse-generate/route.ts` - Generador IDSE (existente)
- `app/api/payroll/export/route.ts` - Export CSV para NOI/Contpaqi
- `app/dashboard/compliance/imss/sua/page.tsx` - UI SUA
- `app/dashboard/compliance/imss/altas/page.tsx` - UI Altas
- `app/dashboard/compliance/imss/bajas/page.tsx` - UI Bajas
- `lib/services/compliance/imss-parser.ts` - Parser IMSS

### Fase 3: UI Faltante - COMPLETADA ✅

**Módulos implementados:**
- `app/dashboard/performance/reviews/page.tsx` - Evaluaciones de desempeño
- `app/dashboard/performance/goals/page.tsx` - Objetivos
- `app/dashboard/company/communications/page.tsx` - Comunicaciones internas
- `components/performance/` - Componentes de performance
- `components/communications/` - Componentes de comunicaciones

### Fase 4: Evidence Processor y Type Safety - COMPLETADA ✅

**Archivos modificados/creados:**
- `lib/whatsapp/evidence-processor.ts` - Procesamiento de evidencia con AI
- `lib/r2-client.ts` - Wrapper para R2 storage
- Integración AI verification con `/api/ai/verify`
- Upload a R2 implementado con fallback local

---

## 📋 TODOs Pendientes (Priorizados)

### Alta Prioridad

| Archivo | Línea | Descripción | Impacto |
|---------|-------|-------------|---------|
| `app/api/reports/generate/route.ts` | 89-120 | Implementar reportes: evidence, NOM-251, inventory, labor, KPIs, incidents | Media |
| `lib/services/shift-approval-service.ts` | 56, 140, 311, 320 | Notificaciones de aprobación de turnos | Media |
| `lib/cron/inventory-checks.ts` | 29, 36 | Cálculos de stock y seguimiento de lotes | Alta |

### Media Prioridad

| Archivo | Línea | Descripción | Impacto |
|---------|-------|-------------|---------|
| `lib/whatsapp/workflow-conversation-handler.ts` | 356 | Salto de pasos con aprobación de supervisor | Baja |
| `lib/tenant-context.ts` | 30 | Verificar acceso del usuario al tenant | Alta |
| `app/api/workflows/history/route.ts` | 98 | Agregar verificación de incidentes | Media |
| `app/api/employees/documents/expiring/route.ts` | 91 | Notificaciones via email/WhatsApp/in-app | Media |

### Baja Prioridad (Mejoras UX)

| Archivo | Línea | Descripción | Impacto |
|---------|-------|-------------|---------|
| `components/workflow/workflow-history-table.tsx` | 177 | Exportación CSV | Baja |
| `app/dashboard/ai-verifications/page.tsx` | 163 | Exportación CSV | Baja |
| `components/labor/attendance-report.tsx` | 106 | PDF export con jsPDF | Baja |

---

## 🗂️ Estructura de Directorios Clave

```
app/
├── api/                    # API Routes
│   ├── auth/              # better-auth endpoints
│   ├── employees/         # CRUD empleados
│   ├── imss/              # SUA, IDSE, altas/bajas
│   ├── inventory/         # Stock, alerts, transfers
│   ├── labor/             # Turnos, asistencia, vacaciones
│   ├── performance/       # Reviews y goals
│   ├── reports/           # Generación de reportes
│   └── workflows/         # Workflow engine
├── dashboard/             # Dashboard pages
│   ├── company/           # Sucursales, comunicaciones
│   ├── compliance/        # IMSS, SAT, NOMs
│   ├── employees/         # Gestión de empleados
│   ├── inventory/         # Control de inventario
│   ├── labor/             # Turnos y asistencia
│   ├── performance/       # Desempeño
│   └── workflows/         # Workflows y schedules
components/
├── communications/        # Anuncios y mensajes
├── employees/            # Empleados UI
├── labor/                # Turnos y asistencia
├── performance/          # Reviews y goals
└── ui/                   # Componentes base (shadcn)
lib/
├── auth.ts               # Configuración better-auth
├── cron/                 # Cron jobs (QStash)
├── db/
│   ├── schema.ts         # Schema principal
│   └── schema/           # Módulos de schema
├── services/             # Business logic
│   ├── notification-service.ts
│   ├── notification-dispatcher.ts
│   └── compliance/       # IMSS, SAT parsers
├── whatsapp/             # WhatsApp integration
│   ├── evidence-processor.ts
│   ├── wasender-client.ts
│   └── workflow-conversation-handler.ts
└── storage/              # R2 client
```

---

## 🔐 Variables de Entorno Requeridas

```bash
# Database (Neon Postgres)
DATABASE_URL=postgresql://...

# Auth (better-auth)
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# WhatsApp (WasenderAPI)
WASENDER_API_KEY=
WASENDER_API_URL=https://api.wasender.com
WHATSAPP_SESSION_ID=

# Email (Resend)
RESEND_API_KEY=

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=pulso-documents
R2_PUBLIC_URL=

# Cron (Upstash QStash)
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
QSTASH_URL=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 🧪 Testing

- **E2E Tests:** Playwright en `tests/`
- **Config:** `playwright.config.ts` usa chromium
- **Base URL:** `PLAYWRIGHT_TEST_BASE_URL` env var

```bash
# Run E2E tests
pnpm test:e2e
```

---

## 🚨 Consideraciones de Seguridad

1. **DB Safety:** `drizzle-kit push` puede dropear tablas - siempre verificar contra `.env`
2. **Multi-tenant:** Todo debe scopearse por `tenantId` / `companyId`
3. **Auth:** Usar `getSession()` o `auth.api.getSession()` siempre
4. **Tenant Context:** Usar `lib/tenant-context.ts` para acceso a tenant

---

## 📈 Decisiones Técnicas Tomadas

### 1. Notification Service vs Notification Dispatcher
- **NotificationService:** API simple para enviar notificaciones directas
- **NotificationDispatcher:** Sistema template-based con preferencias de usuario
- Ambos coexisten; Dispatcher usa Service para envío real

### 2. R2 Storage Strategy
- R2 configurado pero con fallback a local si no hay credenciales
- Permite desarrollo local sin dependencias externas
- En producción requiere credenciales válidas

### 3. AI Verification
- Integración con endpoint `/api/ai/verify` existente
- Fallback a aprobación automática si AI no responde (no bloquear workflows)
- Confidence score para calidad de verificación

### 4. Report Generation
- Reportes básicos implementados con TODOs para extensión futura
- Estructura preparada para agregar lógica específica por tipo de reporte

---

## 🎯 Próximos Pasos Recomendados

### Para completar el 100% de TODOs:

1. **Reportes** (Prioridad Media)
   - Implementar queries específicas para cada tipo de reporte
   - Agregar filtros avanzados
   - Generación de gráficos para analytics

2. **Shift Approval Notifications** (Prioridad Media)
   - Integrar `shift-approval-service.ts` con NotificationDispatcher
   - Templates para solicitudes y aprobaciones

3. **Inventory Checks** (Prioridad Alta)
   - Implementar cálculos de stock en `lib/cron/inventory-checks.ts`
   - Alertas automáticas de stock bajo
   - Seguimiento de lotes y fechas de caducidad

4. **Tenant Context** (Prioridad Alta)
   - Verificar acceso de usuarios a tenants en `lib/tenant-context.ts`
   - Middleware de protección de rutas

---

## 📚 Referencias Útiles

- **AGENTS.md:** Instrucciones específicas para agentes en este repo
- **CODEBASE_COMMENTS_ANALYSIS.md:** Análisis detallado de TODOs
- **.planning/:** Documentación de planificación y arquitectura

---

## ✅ Checklist para Nuevas Sesiones

Antes de comenzar a trabajar:

- [ ] Verificar `pnpm install` ejecutado
- [ ] Verificar `.env` configurado
- [ ] Correr `pnpm run build` para confirmar estado base
- [ ] Revisar git status: `git status`
- [ ] Identificar TODOs a trabajar de este documento
- [ ] Crear branch si es necesario: `git checkout -b feature/nombre`

---

*Documento generado para continuidad entre sesiones*
*Pulso HORECA - 2026*
