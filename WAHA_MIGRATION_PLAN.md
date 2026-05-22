# Plan de Migración: WasenderAPI → WAHA

> **Estado actual del proyecto:** Arquitectura dual-provider implementada. Se activa WAHA con `USE_WAHA=true`.  
> **Objetivo:** Migrar completamente a WAHA, eliminar dependencia de WasenderAPI, limpiar código legacy.

---

## Resumen Ejecutivo

| Aspecto | Antes (WasenderAPI) | Después (WAHA) |
|---|---|---|
| **Infraestructura** | SaaS externo (`api.wasender.com`) | Docker auto-hosteado (`localhost:3001`) |
| **Motor** | Único propietario | NOWEB (sin Chromium, ~50-100MB RAM) |
| **Historial de chats** | No soportado | Disponible con store habilitado |
| **Webhooks** | Wasender format | WAHA format (ya normalizado en webhook) |
| **Auth API** | `WASENDER_API_KEY` (Bearer) | `X-Api-Key` header o sin auth |
| **Costo** | Pago por mensaje | Gratis (open source Apache 2.0) |

---

## FASE 0: Despliegue de WAHA (Docker)

### 0.1 Inicializar WAHA

```bash
# Paso 1: Generar archivo .env con credenciales
docker run --rm -v "${PWD}/waha-config:/app/env" devlikeapro/waha init-waha /app/env

# Paso 2: Iniciar WAHA en puerto 3001
docker run -it --env-file waha-config/.env -v "${PWD}/waha-sessions:/app/.sessions" --rm -p 3001:3000 --name waha devlikeapro/waha
```

Esto genera credenciales:
- **Dashboard:** `http://localhost:3001/dashboard` (usuario: `admin`, password en `.env`)
- **API Key:** en `waha-config/.env` → `WAHA_API_KEY`
- **Swagger:** `http://localhost:3001/swagger`

### 0.2 Configurar para producción

Para producción, usar `docker-compose.yml`:

```yaml
version: '3.8'
services:
  waha:
    image: devlikeapro/waha
    restart: unless-stopped
    ports:
      - "3001:3000"
    env_file:
      - ./waha-config/.env
    volumes:
      - ./waha-sessions:/app/.sessions
    environment:
      - WAHA_WEBHOOK_URL=https://tudominio.com/api/whatsapp/webhook
```

### 0.3 Configurar variables en Pulso (.env)

```bash
# Activar WAHA
USE_WAHA=true

# Conexión a WAHA
WAHA_API_URL=http://localhost:3001        # Docker local
WAHA_WEBHOOK_SECRET=tu_secret_aqui
WAHA_DEFAULT_ENGINE=NOWEB
WAHA_SESSION_STORAGE=sqlite
WAHA_WEBHOOK_URL=http://host.docker.internal:3000/api/whatsapp/webhook  # Para Docker→host

# WasenderAPI (MANTENER temporalmente para rollback)
# WASENDER_API_KEY=...  # No borrar aún, solo no se usará si USE_WAHA=true
```

---

## FASE 1: Reparar bypassers del factory (CRÍTICO)

Archivos que importan `wasenderClient` directamente en vez de usar `client-factory.ts`.

### 1.1 `app/api/whatsapp/webhook/route.ts` (L275-289)

**Problema:** En el handler de opt-in/opt-out, importa `wasenderClient` directamente en la rama `else`.

```typescript
// ❌ ANTES (L282-289)
} else {
  const { wasenderClient } = await import('@/lib/whatsapp/wasender-client');
  await wasenderClient.sendMessage({...});
}

// ✅ DESPUÉS
} else {
  const { whatsappClient } = await import('@/lib/whatsapp/client-factory');
  await whatsappClient.sendMessage({...});
}
```

**Adicional:** Simplificar la lógica para usar siempre `client-factory` sin el `if/else`:

```typescript
// ✅ MEJOR - Sin if/else, el factory decide
const { whatsappClient } = await import('@/lib/whatsapp/client-factory');
await whatsappClient.sendMessage({
  sessionId: normalized.sessionId,
  to: normalized.from,
  message: confirmationMessage,
});
```

### 1.2 `lib/whatsapp/notification-queue.ts` (L163, L183)

**Problema:** `sendWhatsApp()` importa `wasenderClient` directamente.

```typescript
// ❌ ANTES (L163)
const { wasenderClient } = await import('@/lib/whatsapp/wasender-client');

// ✅ DESPUÉS
const { whatsappClient } = await import('@/lib/whatsapp/client-factory');
```

```typescript
// ❌ ANTES (L183)
const result = await wasenderClient.sendMessage({...});

// ✅ DESPUÉS
const result = await whatsappClient.sendMessage({...});
```

### 1.3 `lib/whatsapp/session-manager.ts` (L34-42)

**Problema:** `getWhatsAppClient()` tiene rama legacy que importa `wasender-client`.

```typescript
// ❌ ANTES (L34-42)
async function getWhatsAppClient() {
  if (process.env.USE_WAHA === 'true') {
    const { wahaClient, getWAHAClient } = await import('./waha-client');
    return { client: getWAHAClient(), legacy: wahaClient };
  } else {
    const { wasenderClient, getWasenderClient } = await import('./wasender-client');
    return { client: getWasenderClient(), legacy: wasenderClient };
  }
}

// ✅ DESPUÉS
async function getWhatsAppClient() {
  const { getWAHAClient } = await import('./waha-client');
  return { client: getWAHAClient() };
}
```

---

## FASE 2: Actualizar verificaciones de config

### 2.1 `lib/services/notification-service.ts` (L12-14)

```typescript
// ❌ ANTES
function isWhatsAppConfigured(): boolean {
  return !!(process.env.WASENDER_API_KEY || process.env.WAHA_API_URL);
}

// ✅ DESPUÉS
function isWhatsAppConfigured(): boolean {
  return !!process.env.WAHA_API_URL;
}
```

### 2.2 `lib/whatsapp/evidence-processor.ts` (L13-15)

```typescript
// ❌ ANTES
function isWhatsAppConfigured(): boolean {
  return !!(process.env.WASENDER_API_KEY || process.env.WAHA_API_URL);
}

// ✅ DESPUÉS
function isWhatsAppConfigured(): boolean {
  return !!process.env.WAHA_API_URL;
}
```

---

## FASE 3: Eliminar archivos legacy Wasender

### 3.1 Eliminar

```bash
# Core
rm lib/whatsapp/wasender-client.ts

# Scripts de test
rm scripts/test-wasender-send.ts
rm scripts/test-wasender-real.ts
rm scripts/test-wasender-api.ts

# Documentación Wasender
rm docs/WASENDER_TEST_GUIDE.md
```

---

## FASE 4: Reescribir el Client Factory

### 4.1 `lib/whatsapp/client-factory.ts`

Eliminar la rama Wasender, simplificar a solo WAHA:

```typescript
/**
 * WhatsApp Client Factory
 * Usa WAHA (WhatsApp HTTP API) con motor NOWEB
 */

import type { SendMessageOptions, SendMediaOptions, RateLimitConfig } from './waha-client';
import type { WAHASession } from './waha-client';

export type WhatsAppSession = WAHASession;

export interface WhatsAppClient {
  sendMessage(options: SendMessageOptions): Promise<{ messageId: string; id?: string }>;
  sendMedia(options: SendMediaOptions): Promise<{ messageId: string; id?: string }>;
  sendImage(sessionId: string, to: string, imageUrl: string, caption?: string): Promise<{ messageId: string }>;
  sendDocument(sessionId: string, to: string, documentUrl: string, caption?: string): Promise<{ messageId: string }>;
  sendWorkflowAssignment(sessionId: string, phone: string, workflowName: string, link: string, type?: 'ASSIGNED' | 'REMINDER'): Promise<{ messageId: string }>;
  createSession(companyId: string): Promise<WhatsAppSession>;
  getSessions(): Promise<WhatsAppSession[]>;
  getSession(sessionId: string): Promise<WhatsAppSession>;
  getSessionStatus(sessionId: string): Promise<WhatsAppSession>;
  deleteSession(sessionId: string): Promise<void>;
  disconnectSession(sessionId: string): Promise<void>;
  getQRCode(sessionId: string): Promise<{ qrCode?: string; code?: string } | null>;
  isOnWhatsApp(phone: string): Promise<{ exists: boolean; jid?: string }>;
  checkRateLimit(sessionId: string): { allowed: boolean; retryAfter?: number };
  setRateLimits(config: Partial<RateLimitConfig>): void;
  verifyWebhookSignature(payload: string, signature: string): boolean;
  sendBulkMessages(sessionId: string, messages: Array<{ to: string; message: string }>): Promise<Array<{ to: string; success: boolean; messageId?: string; error?: string }>>;
  getChatHistory(params: { sessionId: string; chatId: string; limit?: number; cursor?: string }): Promise<{ messages: any[]; hasMore: boolean; cursor?: string }>;
  getChats(sessionId: string): Promise<any[]>;
}

let wahaClientInstance: WhatsAppClient | null = null;

export async function getWhatsAppClient(): Promise<WhatsAppClient> {
  if (!wahaClientInstance) {
    const { getWAHAClient } = await import('./waha-client');
    wahaClientInstance = getWAHAClient();
  }
  return wahaClientInstance;
}

export function resetClients(): void {
  wahaClientInstance = null;
}

export function getClientInfo(): { active: string; wahaConfigured: boolean; wahaUrl: string | undefined } {
  return {
    active: 'waha',
    wahaConfigured: !!process.env.WAHA_API_URL,
    wahaUrl: process.env.WAHA_API_URL,
  };
}

// Singleton para backward compatibility
export const whatsappClient = {
  sendMessage: async (opts: SendMessageOptions) => { const c = await getWhatsAppClient(); return c.sendMessage(opts); },
  sendMedia: async (opts: SendMediaOptions) => { const c = await getWhatsAppClient(); return c.sendMedia(opts); },
  sendImage: async (sessionId: string, to: string, imageUrl: string, caption?: string) => { const c = await getWhatsAppClient(); return c.sendImage(sessionId, to, imageUrl, caption); },
  sendDocument: async (sessionId: string, to: string, documentUrl: string, caption?: string) => { const c = await getWhatsAppClient(); return c.sendDocument(sessionId, to, documentUrl, caption); },
  sendWorkflowAssignment: async (sessionId: string, phone: string, workflowName: string, link: string, type?: 'ASSIGNED' | 'REMINDER') => { const c = await getWhatsAppClient(); return c.sendWorkflowAssignment(sessionId, phone, workflowName, link, type); },
  createSession: async (companyId: string) => { const c = await getWhatsAppClient(); return c.createSession(companyId); },
  getSessions: async () => { const c = await getWhatsAppClient(); return c.getSessions(); },
  getSession: async (sessionId: string) => { const c = await getWhatsAppClient(); return c.getSession(sessionId); },
  deleteSession: async (sessionId: string) => { const c = await getWhatsAppClient(); return c.deleteSession(sessionId); },
  getQRCode: async (sessionId: string) => { const c = await getWhatsAppClient(); return c.getQRCode(sessionId); },
  checkRateLimit: async (sessionId: string) => { const c = await getWhatsAppClient(); return c.checkRateLimit(sessionId); },
  setRateLimits: async (config: Partial<RateLimitConfig>) => { const c = await getWhatsAppClient(); return c.setRateLimits(config); },
  verifyWebhookSignature: async (payload: string, signature: string) => { const c = await getWhatsAppClient(); return c.verifyWebhookSignature(payload, signature); },
  sendBulkMessages: async (sessionId: string, messages: Array<{ to: string; message: string }>) => { const c = await getWhatsAppClient(); return c.sendBulkMessages(sessionId, messages); },
  getChatHistory: async (params: { sessionId: string; chatId: string; limit?: number; cursor?: string }) => { const c = await getWhatsAppClient(); return c.getChatHistory(params); },
  getChats: async (sessionId: string) => { const c = await getWhatsAppClient(); return c.getChats(sessionId); },
};
```

### 4.2 Eliminar `isWAHAEnabled()`, `setClientMode()`, `getWasenderClient()`

Estas funciones ya no son necesarias. `isWAHAEnabled()` y `setClientMode()` se eliminan; el factory siempre devuelve WAHA.

---

## FASE 5: Limpiar tipos y compatibilidad

### 5.1 `lib/whatsapp/waha-client.ts` (L3, L18, L589, L614)

```typescript
// ❌ ANTES (L3)
 * Reemplazo para wasender-client.ts

// ✅ DESPUÉS
 * Cliente WhatsApp HTTP API (WAHA) - Motor NOWEB
```

```typescript
// ❌ ANTES (L18)
// INTERFACES (Compatibles con wasender-client.ts)

// ✅ DESPUÉS
// INTERFACES
```

```typescript
// ❌ ANTES (L589-603)
// ============================================================================
// COMPATIBILIDAD CON wasender-client.ts
// ============================================================================

// ✅ DESPUÉS
// ============================================================================
// CLIENTE DE CONVENIENCIA
// ============================================================================
```

```typescript
// ❌ ANTES (L614)
export type { WAHASession as WasenderSession };

// ✅ DESPUÉS (ELIMINAR esta línea)
```

### 5.2 `lib/db/schema.ts`

```typescript
// L799-800: Cambiar comentarios
// ❌ "WasenderAPI session info"
// ✅ "WhatsApp session info"

// ❌ "External session ID from WasenderAPI"  
// ✅ "External session ID from WhatsApp API"

// L873: Cambiar comentario
// ❌ "WasenderAPI message ID"
// ✅ "External WhatsApp message ID"
```

### 5.3 `lib/env.ts` (L18-20)

Agregar variables WAHA y marcar Wasender como deprecated:

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
  BETTER_AUTH_URL: optionalUrl(),
  
  // WAHA (WhatsApp HTTP API)
  WAHA_API_URL: optionalUrl(),
  WAHA_WEBHOOK_SECRET: optionalString(),
  
  // @deprecated Usar WAHA_API_URL en su lugar
  WASENDER_API_KEY: optionalString(),
  WASENDER_API_URL: optionalUrl(),
  WASENDER_WEBHOOK_SECRET: optionalString(),
  // ... resto igual
});
```

---

## FASE 6: Limpiar webhook de código Wasender

### 6.1 `app/api/whatsapp/webhook/route.ts`

- **L23-43:** Eliminar interfaz `WasenderWebhookPayload` (ya no se usa)
- **L96-101:** Simplificar `detectPayloadType()` (siempre será WAHA)
- **L106-153:** Simplificar `normalizePayload()` quitando la rama wasender
- **L159-176:** Simplificar `handleQR()` quitando `!normalized.isWAHA`
- **L178-186:** Simplificar `handleReady()` quitando wasenderData
- **L329:** Eliminar variable `isWAHA` del tipo `NormalizedPayload`

---

## FASE 7: Actualizar documentación

Archivos que referencian WasenderAPI en comentarios/docs:

1. `AGENTS.md` - L33, L48, L83 → Cambiar "Wasender API" → "WhatsApp API (WAHA)"
2. `PROJECT_CONTEXT.md` - L74, L182, L200-201
3. `docs/WHATSAPP_QUICK_REFERENCE.md` - Actualizar ejemplos de código
4. `WHATSAPP_PRD_GAP_ANALYSIS.md` - Marcar migración como completada
5. `WHATSAPP_IMPLEMENTATION_STATUS.md` - Actualizar status
6. `WAHA_IMPLEMENTATION_SUMMARY.md` - Actualizar
7. `WAHA_IMPLEMENTATION_PLAN.md` - Marcar como completado
8. `WAHA_MIGRATION_STATUS.md` - Actualizar
9. `docs/WHATSAPP_INTEGRATION_STATUS.md` - Actualizar
10. `cluadeprd.md` - Actualizar referencias
11. `app/workflows/steps/core.ts` L109 - Actualizar comentario

---

## FASE 8: Testing y verificación

### 8.1 Crear sesión de prueba

```bash
# Vía API
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: tu_api_key" \
  -d '{"name": "pulso_test", "config": {"noweb": {"store": {"enabled": true, "fullSync": false}}}}'

# Obtener QR
curl http://localhost:3001/api/sessions/pulso_test/auth/qr \
  -H "X-Api-Key: tu_api_key"
```

### 8.2 Verificar webhook

```bash
# Verificar que el webhook responde
curl http://localhost:3000/api/whatsapp/webhook
# Debe devolver: {"status":"alive","service":"whatsapp-webhook","supports":["waha"]}

# Simular mensaje entrante de WAHA
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"message","session":"pulso_test","payload":{"id":"test_123","timestamp":1700000000,"from":"5215512345678@c.us","fromMe":false,"body":"ayuda","type":"chat","hasMedia":false}}'
```

### 8.3 Verificar envío de mensajes

```bash
# Desde el dashboard de Pulso, enviar una notificación de prueba
curl -X POST http://localhost:3000/api/notifications/test-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"template":"workflow_assignment","phone":"5215512345678"}'
```

### 8.4 Checklist de funcionalidades

- [ ] Crear sesión WhatsApp desde el dashboard
- [ ] Escanear QR y conectar
- [ ] Recibir mensajes entrantes (comandos: `ayuda`, `entrada`, `salida`)
- [ ] Enviar notificaciones de workflow
- [ ] Enviar recordatorios
- [ ] Procesar fotos como evidencia
- [ ] Manejar opt-in/opt-out
- [ ] Verificar rate limits
- [ ] Sincronizar estados de sesión
- [ ] Cron jobs funcionando (recordatorios, overdue)

---

## FASE 9: Cleanup final (.env)

Una vez todo funcione estable por al menos 1 semana:

```bash
# Eliminar variables legacy de .env
# WASENDER_API_KEY=b544f6ee...  ← ELIMINAR
# WASENDER_API_URL=https://api.wasender.com  ← ELIMINAR
```

---

## Rollback de Emergencia

Si algo falla y necesitas volver a WasenderAPI:

```bash
# 1. Revertir .env
USE_WAHA=false

# 2. Restaurar archivos desde git
git checkout lib/whatsapp/wasender-client.ts
git checkout scripts/test-wasender-*.ts
git checkout lib/whatsapp/client-factory.ts
git checkout app/api/whatsapp/webhook/route.ts
git checkout lib/whatsapp/session-manager.ts

# 3. Reiniciar la app
pnpm run dev
```

---

## Orden de Ejecución Recomendado

| Orden | Fase | Riesgo | Tiempo estimado |
|---|---|---|---|
| 1 | Fase 0 - Desplegar WAHA Docker | Bajo | 10 min |
| 2 | Fase 1 - Reparar bypassers | **Alto** (crítico) | 15 min |
| 3 | Fase 2 - Actualizar verificaciones config | Bajo | 5 min |
| 4 | Fase 4 - Reescribir factory | **Alto** (rompe si falla) | 20 min |
| 5 | Fase 5 - Limpiar tipos/compatibilidad | Bajo | 10 min |
| 6 | Fase 6 - Limpiar webhook | Bajo | 10 min |
| 7 | Fase 3 - Eliminar archivos legacy | Bajo | 2 min |
| 8 | Fase 8 - Testing | Medio | 30 min |
| 9 | Fase 7 - Documentación | Bajo | 15 min |
| 10 | Fase 9 - Cleanup final (.env) | Bajo | 1 min |

**Tiempo total estimado:** ~2 horas

---

## Notas Importantes

1. **NOWEB** es el motor recomendado (sin Chromium). Si necesitas más funcionalidades, evaluar WEBJS.
2. **WAHA Plus** (pago) necesario para múltiples sesiones simultáneas en un solo contenedor. Alternativa: múltiples contenedores.
3. El **webhook ya está normalizado** - el endpoint actual maneja ambos formatos, facilitando la migración.
4. El **factory pattern con feature flag** permite activar WAHA sin tocar código (`USE_WAHA=true`).
5. Los **cron jobs** (Vercel) usan `client-factory`, por lo que migrarán automáticamente.
