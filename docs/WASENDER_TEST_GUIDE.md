# WASENDER API Test Guide - Pulso HORECA

## Configuración Actual

- **API Key**: `b544f6ee0c773272d5baf69b1cae447617f306f3b640e1967f37ba5f48e9a254`
- **Base URL**: `https://api.wasender.com`
- **Sesión Conectada**: `528183031981`

---

## Pruebas con cURL

### 1. Obtener Sesiones

```bash
curl -X GET \
  https://api.wasender.com/api/whatsapp-sessions \
  -H "Authorization: Bearer b544f6ee0c773272d5baf69b1cae447617f306f3b640e1967f37ba5f48e9a254"
```

### 2. Enviar Mensaje de Prueba

**Desde tu sesión (528183031981) al número 528128924435:**

```bash
curl -X POST \
  https://api.wasender.com/api/send-message \
  -H "Authorization: Bearer b544f6ee0c773272d5baf69b1cae447617f306f3b640e1967f37ba5f48e9a254" \
  -H "Content-Type: application/json" \
  -d '{
    "session": "TU_SESSION_ID_AQUI",
    "phone": "528128924435@c.us",
    "message": "🧪 Test desde Pulso HORECA\n\n¡Hola! Este es un mensaje de prueba."
  }'
```

**Nota**: Reemplaza `TU_SESSION_ID_AQUI` con el ID de sesión obtenido del paso 1.

### 3. Verificar si un número está en WhatsApp

```bash
curl -X GET \
  https://api.wasender.com/api/on-whatsapp/528128924435 \
  -H "Authorization: Bearer b544f6ee0c773272d5baf69b1cae447617f306f3b640e1967f37ba5f48e9a254"
```

### 4. Obtener Información del Usuario

```bash
curl -X GET \
  https://api.wasender.com/api/user \
  -H "Authorization: Bearer b544f6ee0c773272d5baf69b1cae447617f306f3b640e1967f37ba5f48e9a254"
```

---

## Pruebas con Postman

### Configuración Base

1. **Crear una nueva colección** llamada "WASENDER API"
2. **Variables de entorno**:
   - `baseUrl`: `https://api.wasender.com`
   - `apiKey`: `b544f6ee0c773272d5baf69b1cae447617f306f3b640e1967f37ba5f48e9a254`

### Request 1: Get Sessions

- **Method**: GET
- **URL**: `{{baseUrl}}/api/whatsapp-sessions`
- **Headers**:
  - `Authorization`: `Bearer {{apiKey}}`

### Request 2: Send Message

- **Method**: POST
- **URL**: `{{baseUrl}}/api/send-message`
- **Headers**:
  - `Authorization`: `Bearer {{apiKey}}`
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
  "session": "SESSION_ID_AQUI",
  "phone": "528128924435@c.us",
  "message": "🧪 Test desde Pulso HORECA"
}
```

---

## Endpoints de WhatsApp Smartlink Workflow

### Crear Sesión de WhatsApp

```bash
curl -X POST \
  https://api.wasender.com/api/whatsapp-sessions \
  -H "Authorization: Bearer b544f6ee0c773272d5baf69b1cae447617f306f3b640e1967f37ba5f48e9a254" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "pulso_production",
    "webhook": "https://pulsomx.netlify.app/api/whatsapp/webhook"
  }'
```

### Obtener QR Code (para conectar)

```bash
curl -X GET \
  https://api.wasender.com/api/whatsapp-sessions/{sessionId}/qrcode \
  -H "Authorization: Bearer b544f6ee0c773272d5baf69b1cae447617f306f3b640e1967f37ba5f48e9a254"
```

### Conectar Sesión

```bash
curl -X POST \
  https://api.wasender.com/api/whatsapp-sessions/{sessionId}/connect \
  -H "Authorization: Bearer b544f6ee0c773272d5baf69b1cae447617f306f3b640e1967f37ba5f48e9a254"
```

---

## Webhook Payload Example

Cuando recibes mensajes en tu webhook (`/api/whatsapp/webhook`), el payload se ve así:

```json
{
  "event": "message",
  "sessionId": "session_xxx",
  "data": {
    "messageId": "msg_xxx",
    "from": "5215512345678@c.us",
    "to": "5215511111111@c.us",
    "message": "Hola",
    "type": "text",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "fromMe": false
  }
}
```

---

## Integración con Pulso HORECA

### Envío de Notificaciones de Workflow

El sistema está configurado para enviar notificaciones cuando:

1. **Se asigna un workflow** a un usuario
2. **Recordatorio** de workflow pendiente
3. **Alerta de stock** bajo
4. **Incidente de compliance**
5. **Recordatorio de turno**

### Código de Ejemplo

```typescript
import { wasenderClient } from '@/lib/whatsapp/wasender-client';

// Enviar notificación de workflow
await wasenderClient.sendWorkflowAssignment(
  sessionId,           // ID de sesión WASENDER
  '528128924435@c.us', // Teléfono destino
  'Inspección NOM-251', // Nombre del workflow
  'https://pulsomx.netlify.app/workflows/abc123', // Link al workflow
  'ASSIGNED'           // Tipo: ASSIGNED o REMINDER
);
```

---

## Troubleshooting

### Error "Session not connected"

- Verifica que la sesión esté conectada escaneando el QR code
- Usa el endpoint `/api/whatsapp-sessions/{id}/status` para verificar

### Error "fetch failed"

- Verifica conectividad a internet
- Prueba con `curl` o Postman directamente
- Verifica que la URL sea `https://api.wasender.com` (sin /v1)

### Error "Invalid phone number"

- Formato correcto: `5215512345678@c.us` (México +52, seguido del número)
- Sin espacios ni guiones
- Siempre incluir `@c.us` al final

---

## Recursos

- **Documentación WASENDER**: https://wasenderapi.com/api-docs
- **Dashboard WASENDER**: https://wasenderapi.com/dashboard
- **Webhook Testing**: https://webhook.site (para probar webhooks)
