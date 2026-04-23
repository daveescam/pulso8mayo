# Pulso - Tareas Pendientes y Próximos Pasos

**Fecha**: Marzo 20, 2026  
**Basado en**: SINGLE_SOURCE_OF_TRUTH.md  
**Estado del Proyecto**: **91% Completado** - MVP Production-Ready

---

## 📋 Resumen Ejecutivo

El proyecto Pulso está **91% completo** con todas las features principales completamente funcionales. Solo restan 3 tareas no bloqueantes que suman 6-10 días de trabajo.

### Lo Que Está Completo ✅

| Sprint | Área | Completado | Estado |
|--------|------|-----------|--------|
| **Sprint 1** | Compliance & WhatsApp | **100%** | ✅ COMPLETE |
| **Sprint 2** | Inventory & Security | **93%** | ✅ COMPLETE |
| **Sprint 3** | Labor Management | **100%** | ✅ COMPLETE |
| **Sprint 4** | Analytics & KPI | **79%** | ✅ MVP READY |

### Lo Que Falta ⚠️ (No Bloqueante)

| Tarea | Esfuerzo | Impacto | Prioridad |
|-------|----------|---------|-----------|
| Refresh token rotation | 1-2 días | Bajo | P2 |
| Documentación OpenAPI | 2-3 días | Bajo | P2 |
| Tests E2E | 3-5 días | Medio | P1 |

---

## ⚠️ Tareas Pendientes Detalladas

### 1. Refresh Token Rotation (1-2 días)

**Estado**: No implementado  
**Impacto**: Bajo - Las sesiones JWT actuales funcionan con 7 días de expiración  
**Prioridad**: P2 (No bloqueante para MVP)

#### Archivos a Modificar

**`lib/auth.ts`**:
```typescript
// Agregar configuración de refresh token
export const auth = betterAuth({
  // ... configuración existente
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (refresh every day)
    // Habilitar refresh token rotation
    refreshTokens: true,
  }
})
```

**`lib/auth-config.ts`** (crear/modificar):
```typescript
export const authConfig = {
  // Access token: 15 minutos
  accessTokenExpiresIn: 60 * 15,
  // Refresh token: 7 días
  refreshTokenExpiresIn: 60 * 60 * 24 * 7,
  // Rotar refresh token en cada uso
  rotateRefreshTokens: true,
}
```

#### Pasos de Implementación

1. Modificar `lib/auth.ts` para habilitar `refreshTokens: true`
2. Configurar expiry diferenciado (access: 15min, refresh: 7 días)
3. Implementar lógica de rotación en cada uso de refresh token
4. Invalidar refresh tokens antiguos automáticamente
5. Testear flujo completo: login → refresh → logout

#### Criterios de Aceptación

- [ ] Access token expira en 15 minutos
- [ ] Refresh token permite obtener nuevo access token
- [ ] Refresh token se rota en cada uso
- [ ] Tokens antiguos se invalidan automáticamente
- [ ] Logout invalida ambos tokens

---

### 2. Documentación OpenAPI (2-3 días)

**Estado**: No implementado  
**Impacto**: Bajo - La API es funcional y está documentada en código  
**Prioridad**: P2 (No bloqueante para MVP)

#### Archivos a Crear

**`docs/api-reference.md`**:
```markdown
# Pulso API Reference

## Authentication

### POST /api/auth/sign-in
Sign in with email and password

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "ADMIN",
    "companyId": "uuid",
    "branchId": "uuid"
  },
  "session": {
    "token": "jwt_token",
    "expiresAt": "2026-03-27T00:00:00Z"
  }
}
```

## Workflows

### POST /api/workflow-templates
Create workflow template
...
```

**`app/api/openapi/route.ts`** (crear):
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Pulso API',
      version: '1.0.0',
      description: 'HORECA Business Management Platform API'
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
    ],
    paths: {
      '/api/auth/sign-in': {
        post: {
          summary: 'Sign in',
          requestBody: { ... },
          responses: { ... }
        }
      },
      // ... más endpoints
    }
  }

  return NextResponse.json(openApiSpec)
}
```

#### Pasos de Implementación

1. Listar todos los endpoints API (30+ routes)
2. Documentar schemas de request/response para cada uno
3. Incluir ejemplos de uso y códigos de error
4. Crear endpoint `/api/openapi` que retorna spec OpenAPI
5. Opcional: Configurar Swagger UI en `/api/docs`

#### Criterios de Aceptación

- [ ] Todos los 30+ endpoints documentados
- [ ] Schemas de request/response completos
- [ ] Ejemplos de uso para cada endpoint
- [ ] Endpoint `/api/openapi` funcional
- [ ] Opcional: Swagger UI accesible

---

### 3. Tests E2E con Playwright (3-5 días)

**Estado**: No implementado  
**Impacto**: Medio - No hay automated testing  
**Prioridad**: P1 (Recomendado para producción)

#### Archivos a Crear

**`playwright.config.ts`** (crear):
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // ... más navegadores
  ],
})
```

**`tests/e2e/auth.spec.ts`** (crear):
```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should sign in successfully', async ({ page }) => {
    await page.goto('/sign-in')
    
    await page.fill('[name="email"]', 'admin@empresa.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should redirect to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/sign-in')
  })
})
```

**`tests/e2e/workflows.spec.ts`** (crear):
```typescript
import { test, expect } from '@playwright/test'

test.describe('Workflows', () => {
  test('should create workflow template', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in')
    await page.fill('[name="email"]', 'admin@empresa.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Go to builder
    await page.goto('/dashboard/builder')
    
    // Create template
    await page.click('button:has-text("Nuevo Template")')
    await page.fill('[name="name"]', 'Checklist Apertura')
    await page.fill('[name="description"]', 'Checklist de apertura del restaurante')
    
    // Add step
    await page.click('[data-step-type="photo"]')
    await page.fill('[name="step-label"]', 'Foto de refrigeradores')
    
    // Save
    await page.click('button:has-text("Guardar")')
    
    await expect(page.locator('text=Checklist Apertura')).toBeVisible()
  })

  test('should execute workflow from smartlink', async ({ page }) => {
    // Smartlink execution test
    // ...
  })
})
```

**`tests/e2e/inventory.spec.ts`** (crear):
```typescript
import { test, expect } from '@playwright/test'

test.describe('Inventory', () => {
  test('should receive inventory items', async ({ page }) => {
    // Sign in
    // Go to inventory
    // Scan barcode
    // Complete receiving workflow
    // Verify stock updated
  })

  test('should create transfer request', async ({ page }) => {
    // Create transfer
    // Approve transfer
    // Verify stock updated on both branches
  })
})
```

**`tests/e2e/compliance.spec.ts`** (crear):
```typescript
import { test, expect } from '@playwright/test'

test.describe('Compliance Reports', () => {
  test('should generate NOM-251 report', async ({ page }) => {
    // Sign in
    // Go to compliance dashboard
    // Select date range
    // Generate NOM-251 PDF
    // Verify PDF downloaded
  })

  test('should generate NOM-035 report', async ({ page }) => {
    // Similar flow for NOM-035
  })
})
```

#### Pasos de Implementación

1. Instalar Playwright: `pnpm add -D @playwright/test`
2. Inicializar Playwright: `pnpm exec playwright install`
3. Crear `playwright.config.ts` con configuración
4. Crear tests de autenticación (auth.spec.ts)
5. Crear tests de workflows (workflows.spec.ts)
6. Crear tests de inventario (inventory.spec.ts)
7. Crear tests de compliance (compliance.spec.ts)
8. Configurar CI/CD para tests automáticos en GitHub Actions

#### Comandos

```bash
# Instalar Playwright
pnpm add -D @playwright/test
pnpm exec playwright install

# Correr tests
pnpm exec playwright test

# Correr tests con UI
pnpm exec playwright test --ui

# Generar reporte HTML
pnpm exec playwright show-report
```

#### Criterios de Aceptación

- [ ] Playwright instalado y configurado
- [ ] Tests de autenticación (2-3 tests)
- [ ] Tests de workflows (3-4 tests)
- [ ] Tests de inventario (2-3 tests)
- [ ] Tests de compliance (2 tests)
- [ ] CI/CD configurado para tests automáticos
- [ ] Coverage >70% en flujos críticos

---

## 📅 Plan de Implementación Restante

### Semana 1 (6 días)

| Día | Tarea | Entregable |
|-----|-------|------------|
| **Lun-Mar** | Refresh token rotation | `lib/auth.ts` modificado, tests manuales |
| **Mié-Vie** | Documentación OpenAPI | `docs/api-reference.md`, endpoint `/api/openapi` |
| **Sáb** | Tests E2E - Auth & Workflows | `auth.spec.ts`, `workflows.spec.ts` |

### Semana 2 (4 días)

| Día | Tarea | Entregable |
|-----|-------|------------|
| **Lun-Mar** | Tests E2E - Inventory & Compliance | `inventory.spec.ts`, `compliance.spec.ts` |
| **Mié** | CI/CD para tests | GitHub Actions workflow |
| **Jue-Vie** | Bug fixes y polish | Issues resueltos, UX improvements |

---

## ✅ Checklist Final de Implementación

### Refresh Token Rotation
- [ ] Modificar `lib/auth.ts` con `refreshTokens: true`
- [ ] Configurar expiry en `lib/auth-config.ts`
- [ ] Implementar rotación de refresh tokens
- [ ] Invalidar tokens antiguos
- [ ] Testear flujo completo

### Documentación OpenAPI
- [ ] Listar 30+ endpoints
- [ ] Documentar schemas request/response
- [ ] Incluir ejemplos de uso
- [ ] Crear `docs/api-reference.md`
- [ ] Crear endpoint `/api/openapi`
- [ ] Opcional: Swagger UI

### Tests E2E
- [ ] Instalar Playwright
- [ ] Crear `playwright.config.ts`
- [ ] Tests de autenticación (2-3 tests)
- [ ] Tests de workflows (3-4 tests)
- [ ] Tests de inventario (2-3 tests)
- [ ] Tests de compliance (2 tests)
- [ ] Configurar CI/CD en `.github/workflows/`

---

## 🎯 Criterios para MVP Production-Ready

El proyecto **YA CUMPLE** con los criterios de MVP:

### Features Principales ✅
- [x] Workflow engine completo (builder + execution)
- [x] Inventario completo (receiving, transfers, suppliers, barcode)
- [x] Reportes NOM-251 y NOM-035 en PDF funcionales
- [x] WhatsApp bot bidireccional completo
- [x] Gestión laboral completa (shifts, geolocation, overtime)
- [x] KPIs y analytics dashboard funcionales
- [x] Multi-tenant architecture (companyId, branchId scoping)
- [x] RBAC con 6 roles
- [x] Rate limiting implementado

### Seguridad ✅
- [x] Autenticación con Better Auth (JWT sessions)
- [x] RBAC permission matrix
- [x] Rate limiting (sliding window)
- [x] Input validation con Zod
- [x] Tenant isolation
- [ ] Refresh token rotation (pendiente, no crítico)

### Calidad ⚠️
- [x] Código TypeScript tipado
- [x] ESLint configurado
- [x] 100+ componentes React
- [x] 25+ servicios backend
- [x] 25+ tablas de base de datos
- [ ] Tests E2E (pendiente, recomendado)
- [ ] Documentación OpenAPI (pendiente, no crítica)

---

## 🚀 Próximos Pasos Inmediatos

### Para Nuevos Desarrolladores

1. **Leer documentos de contexto**:
   - `SINGLE_SOURCE_OF_TRUTH.md` (838 líneas) - Estado verificado
   - `IMPLEMENTATION_PLAN_CONTEXT.md` - Arquitectura y estructura
   - `WHATSAPP_IMPLEMENTATION.md` - WhatsApp integration
   - `docs/SISTEMA_TURNOS.md` - Sistema de turnos

2. **Configurar entorno de desarrollo**:
   ```bash
   pnpm install
   cp .env.example .env
   # Llenar variables de entorno
   pnpm dev
   ```

3. **Elegir tarea pendiente** (ver checklist arriba)

4. **Seguir guía "Qué Modificar y Cuándo"** en `IMPLEMENTATION_PLAN_CONTEXT.md`

### Para Product Owner

1. **Aprobar lanzamiento del MVP** (91% completo, funcional)
2. **Priorizar tareas restantes**:
   - P1: Tests E2E (calidad)
   - P2: Refresh token rotation (seguridad)
   - P2: Documentación OpenAPI (DX)
3. **Planear rollout a clientes piloto**

---

## 📊 Resumen Visual de Progreso

```
Sprint 1: Compliance & WhatsApp ████████████████████ 100%
Sprint 2: Inventory & Security  ██████████████████░░  93%
Sprint 3: Labor Management      ████████████████████ 100%
Sprint 4: Analytics & KPI       ███████████████░░░░░  79%
────────────────────────────────────────────────────────
TOTAL                           ██████████████████░░  91%
```

### Features por Estado

```
✅ Production Ready:
  - Workflow Engine
  - Inventory Management
  - WhatsApp Integration
  - Compliance Reports (NOM-251, NOM-035)
  - Labor Management
  - KPI Dashboard
  - Multi-Tenant Auth
  - RBAC
  - Rate Limiting

⚠️ Pending (No Blocking):
  - Refresh Token Rotation
  - OpenAPI Documentation
  - E2E Tests
```

---

## 📞 Soporte y Recursos

### Documentación Principal
- `SINGLE_SOURCE_OF_TRUTH.md` - **Leer primero** (838 líneas)
- `IMPLEMENTATION_PLAN_CONTEXT.md` - Arquitectura y estructura
- `prd.md` - Product Requirements Document (1912 líneas)
- `IMPLEMENTACION_ESTADO.md` - Estado detallado por fase

### Documentación Específica
- `WHATSAPP_IMPLEMENTATION.md` - WhatsApp integration completa
- `docs/SISTEMA_TURNOS.md` - Sistema de turnos
- `docs/WHATSAPP_QUICK_REFERENCE.md` - Referencia rápida de WhatsApp
- `templates/` - Workflow templates documentation

### Comandos Útiles
```bash
# Desarrollo
pnpm dev                    # Iniciar dev server

# Database
pnpm dlx drizzle-kit push   # Aplicar migraciones
pnpm dlx drizzle-kit studio # DB GUI

# Linting
pnpm lint                   # ESLint

# Tests (cuando se implementen)
pnpm exec playwright test   # E2E tests
```

---

**Documento Complementario a `IMPLEMENTATION_PLAN_CONTEXT.md`**  
*Generado: Marzo 20, 2026*  
*Estado: 91% Completado - MVP Production-Ready*  
*Próximo Hito: 100% con tests y documentación (6-10 días)*
