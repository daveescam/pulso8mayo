# Migración: WAHA → WHAPI.cloud

**Fecha:** 2026-05-29
**Objetivo:** Reemplazar WAHA (WhatsApp HTTP API, self-hosted) por WHAPI.cloud (cloud-hosted)

## Arquitectura

```
Antes (WAHA):
  App → WAHA Client → WAHA Server (self-hosted, localhost:3001) → WhatsApp

Después (WHAPI):
  App → WhapiClient → WHAPI API (gate.whapi.cloud) → WhatsApp
```

## Estrategia: Canal Compartido (Opción 1)

Un solo token WHAPI, un solo número de WhatsApp para todas las empresas.
La distinción de empresa se hace por `users.companyId` (ya implementado en message-router).

## Archivos modificados (12)

| # | Archivo | Operación |
|---|---------|-----------|
| 1 | `config/whapi-config.ts` | CREAR |
| 2 | `config/waha-config.ts` | ELIMINAR |
| 3 | `lib/env.ts` | EDITAR |
| 4 | `lib/whatsapp/whapi-client.ts` | CREAR |
| 5 | `lib/whatsapp/waha-client.ts` | ELIMINAR |
| 6 | `lib/whatsapp/client-factory.ts` | EDITAR |
| 7 | `lib/whatsapp/whapi-history-service.ts` | CREAR |
| 8 | `lib/whatsapp/waha-history-service.ts` | ELIMINAR |
| 9 | `app/api/whatsapp/webhook/route.ts` | EDITAR |
| 10 | `lib/whatsapp/session-manager.ts` | EDITAR |
| 11 | `lib/whatsapp/evidence-processor.ts` | EDITAR |
| 12 | `lib/services/notification-service.ts` | EDITAR |

## Cambios clave

### Chat ID format
- WAHA: `{phone}@c.us`
- WHAPI: `{phone}@s.whatsapp.net`

### Autenticación
- WAHA: sin auth (servidor interno)
- WHAPI: `Authorization: Bearer {token}`

### Sesiones
- WAHA: múltiples sesiones (pulso_{companyId}), QR code, create/delete
- WHAPI: un canal fijo, sin sesiones programáticas

### Webhook payload
- WAHA: `{ event, session, payload }`
- WHAPI: `{ messages[], event, channel_id }`

### Endpoints
- WAHA base: variable (ej: localhost:3001)
- WHAPI base: fijo `https://gate.whapi.cloud`
