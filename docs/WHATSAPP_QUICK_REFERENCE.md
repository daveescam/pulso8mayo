# WhatsApp Notifications - Quick Reference Guide

## 🚀 Quick Start

### 1. Environment Setup

Add to `.env.local`:
```bash
# WasenderAPI
WASENDER_API_URL=https://api.wasender.com/v1
WASENDER_API_KEY=your_api_key_here
WASENDER_WEBHOOK_SECRET=your_secret_here

# Upstash QStash (optional, has fallback)
QSTASH_TOKEN=your_token_here

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Create WhatsApp Session

```typescript
// Via API
POST /api/whatsapp/session
Headers: { Authorization: 'Bearer YOUR_TOKEN' }

// Response: { session: { sessionId, qrCode, status } }
```

Scan QR code with WhatsApp mobile app.

### 3. Send First Message

```typescript
import { wasenderClient } from '@/lib/whatsapp/wasender-client';

await wasenderClient.sendMessage({
  sessionId: 'pulso_your-company-id',
  to: '+5215512345678',
  message: 'Hello from Pulso!'
});
```

---

## 📱 Sending Notifications

### Method 1: Direct Send (Simple)

```typescript
import { wasenderClient } from '@/lib/whatsapp/wasender-client';

// Simple message
await wasenderClient.sendMessage({
  sessionId: 'pulso_company-id',
  to: '+5215512345678',
  message: 'Your custom message here'
});

// Workflow assignment with template
await wasenderClient.sendWorkflowAssignment(
  'pulso_company-id',
  '+5215512345678',
  'Checklist Apertura',
  'https://pulso.app/workflow/123',
  'ASSIGNED' // or 'REMINDER'
);
```

### Method 2: Via Dispatcher (Recommended)

```typescript
import { whatsappNotificationDispatcher } from '@/lib/whatsapp/notification-dispatcher';

// Workflow assignment
await whatsappNotificationDispatcher.sendWorkflowAssignment(
  'user-id',
  {
    instance: { workflowTemplateId: 'Checklist Apertura' },
    dueDate: new Date(Date.now() + 86400000),
  }
);

// Incident notification
await whatsappNotificationDispatcher.sendIncidentDetected(
  'user-id',
  {
    title: 'Fuga de agua detectada',
    severity: 'HIGH',
    location: 'Cocina Principal'
  }
);

// Low stock alert
await whatsappNotificationDispatcher.sendLowStockAlert(
  'user-id',
  {
    name: 'Aceite Vegetal',
    currentStock: 2,
    reorderPoint: 5,
    unit: 'litros'
  }
);
```

### Method 3: Via Queue (Async with Retry)

```typescript
import { notificationQueue } from '@/lib/whatsapp/notification-queue';

await notificationQueue.queue({
  type: 'whatsapp',
  recipientId: 'user-id',
  recipientAddress: '+5215512345678',
  template: '📋 *{{workflowName}}*\n\n{{message}}',
  payload: {
    workflowName: 'Limpieza General',
    message: 'Por favor completa esta tarea'
  },
  priority: 'high',
  maxRetries: 3,
  delaySeconds: 60 // Optional delay
});
```

---

## 📊 Message Templates

### Workflow Notifications

```typescript
// ASSIGNED
📋 *Nueva Tarea Asignada*

Se te ha asignado el workflow: *{workflowName}*

📅 Fecha límite: {date}

Complétalo aquí:
{smartLink}

// DUE_SOON
⏰ *Recordatorio de Tarea*

El workflow *{workflowName}* vence pronto.

📅 Fecha límite: {date}

// OVERDUE
🚨 *Tarea Vencida*

El workflow *{workflowName}* está vencido.

⚠️ Por favor complétalo lo antes posible.

// COMPLETED
✅ *Tarea Completada*

El workflow *{workflowName}* ha sido completado por {assigneeName}.

¡Excelente trabajo! 👏
```

### Incident Notifications

```typescript
// CREATED
🟠 *Nuevo Incidente*

{incidentTitle}

📍 Ubicación: {location}
⚠️ Severidad: {severity}

// ESCALATED
🚨 *Incidente Escalado*

{incidentTitle}

⚠️ Severidad: {severity}

Este incidente requiere atención inmediata.

// RESOLVED
✅ *Incidente Resuelto*

{incidentTitle}

El incidente ha sido resuelto exitosamente.
```

### Inventory Notifications

```typescript
// LOW_STOCK
📦 *Alerta de Stock Bajo*

Producto: *{productName}*
📊 Cantidad actual: {quantity} unidades

⚠️ El stock está por debajo del mínimo.

// EXPIRING_SOON
⏰ *Producto Próximo a Caducar*

Producto: *{productName}*
📅 Fecha de caducidad: {date}

💡 Considera usar este producto pronto.

// EXPIRED
🚨 *Producto Caducado*

Producto: *{productName}*
📅 Caducó: {date}

⚠️ Este producto debe ser retirado inmediatamente.
```

---

## 👤 User Preferences

### Check User Preferences

```typescript
import { db } from '@/lib/db';
import { notificationPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const prefs = await db.query.notificationPreferences.findFirst({
  where: eq(notificationPreferences.userId, 'user-id')
});

console.log(prefs?.whatsappEnabled); // true/false
```

### Update Preferences

```typescript
await db.insert(notificationPreferences)
  .values({
    userId: 'user-id',
    whatsappEnabled: true,
    workflowAssignments: true,
    workflowDueSoon: true,
    workflowOverdue: true,
    incidents: true,
  })
  .onConflictDoUpdate({
    target: notificationPreferences.userId,
    set: {
      whatsappEnabled: true,
      updatedAt: new Date(),
    }
  });
```

---

## 🔄 Opt-in/Opt-out (User Commands)

Users can control notifications via WhatsApp commands:

### Opt-out Commands
- `stop`
- `alto`
- `parar`
- `no notificar`
- `opt-out`
- `unsubscribe`

**Response**: `🛑 *Notificaciones Desactivadas*`

### Opt-in Commands
- `start`
- `inicio`
- `comenzar`
- `activar`
- `opt-in`
- `subscribe`

**Response**: `✅ *Notificaciones Activadas*`

---

## 📈 Tracking & Analytics

### Track Message Delivery

```typescript
import { whatsappNotificationDispatcher } from '@/lib/whatsapp/notification-dispatcher';

const status = await whatsappNotificationDispatcher.trackDelivery('message-id');

console.log(status);
// { status: 'delivered' | 'read' | 'failed', timestamp?: Date, error?: string }
```

### Get Delivery Statistics

```typescript
const stats = await whatsappNotificationDispatcher.getDeliveryStats(
  new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
  new Date()
);

console.log(stats);
// {
//   totalSent: 100,
//   delivered: 95,
//   read: 90,
//   failed: 5,
//   deliveryRate: 95,
//   readRate: 94.7
// }
```

### Retry Failed Messages

```typescript
const retriedCount = await whatsappNotificationDispatcher.retryFailedMessages(
  'user-id',
  10 // limit
);

console.log(`Retried ${retriedCount} messages`);
```

---

## ⚠️ Rate Limiting

### Default Limits (WhatsApp Recommended)

```typescript
{
  maxMessagesPerMinute: 20,
  maxMessagesPerHour: 100,
  maxMessagesPerDay: 1000
}
```

### Check Rate Limit

```typescript
import { wasenderClient } from '@/lib/whatsapp/wasender-client';

const rateLimit = wasenderClient.checkRateLimit('pulso_company-id');

if (!rateLimit.allowed) {
  console.log(`Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds`);
} else {
  // Safe to send
}
```

### Customize Limits

```typescript
wasenderClient.setRateLimits({
  maxMessagesPerMinute: 30,
  maxMessagesPerHour: 150,
  maxMessagesPerDay: 1500,
});
```

⚠️ **Warning**: Don't exceed WhatsApp limits to avoid account bans.

---

## 🧪 Testing

### Run Test Script

```bash
# Configure test environment first
export TEST_PHONE='+5215512345678'
export TEST_USER_ID='user-uuid'
export TEST_COMPANY_ID='company-uuid'

# Run tests
pnpm tsx scripts/test-whatsapp.ts
```

### Manual Testing

```typescript
// 1. Send test message
import { wasenderClient } from '@/lib/whatsapp/wasender-client';
import { sessionManager } from '@/lib/whatsapp/session-manager';

const session = await sessionManager.getActiveSession('company-id');
if (session) {
  await wasenderClient.sendMessage({
    sessionId: session.sessionId,
    to: '+5215512345678',
    message: '🧪 Test message from Pulso'
  });
}
```

---

## 🐛 Troubleshooting

### Session Not Connected

```typescript
const session = await sessionManager.getSession('pulso_company-id');
console.log(session?.status); // Should be 'CONNECTED'

// If not connected, create new session
POST /api/whatsapp/session
```

### Message Not Sending

1. Check session status is `CONNECTED`
2. Verify phone number format: `+52...`
3. Check rate limits not exceeded
4. Verify API key is valid

### Webhook Not Receiving

1. Check webhook URL in WasenderAPI dashboard
2. Verify app is publicly accessible (use ngrok for dev)
3. Check webhook signature if configured

### QStash Not Processing

1. Verify `QSTASH_TOKEN` is valid
2. Check `/api/notifications/process` is accessible
3. System will fallback to immediate processing

---

## 📚 API Reference

### WasenderClient

```typescript
// Session management
createSession(companyId: string)
getQRCode(sessionId: string)
getSessionStatus(sessionId: string)
deleteSession(sessionId: string)

// Messaging
sendMessage({ sessionId, to, message })
sendMedia({ sessionId, to, mediaUrl, caption })
sendWorkflowAssignment(sessionId, phone, workflowName, link, type)
sendBulkMessages(sessionId, messages[])

// Rate limiting
checkRateLimit(sessionId: string)
setRateLimits(config)

// Status tracking
getMessageStatus(sessionId, messageId)
```

### WhatsAppNotificationDispatcher

```typescript
// Workflow notifications
sendWorkflowAssignment(userId, assignment)
sendWorkflowDueSoon(userId, assignment)
sendWorkflowOverdue(userId, assignment)
sendWorkflowEscalation(userId, assignment)
sendWorkflowCompleted(userId, instance)

// Incident notifications
sendIncidentDetected(userId, incident)
sendIncidentEscalated(userId, incident)
sendIncidentResolved(userId, incident)

// Inventory notifications
sendLowStockAlert(userId, product)
sendExpirationAlert(userId, batch)
sendOrderReceived(userId, order)

// Batch operations
sendBatchNotifications(userIds[], type, data)

// Tracking
trackDelivery(messageId)
getDeliveryStats(startDate, endDate)
retryFailedMessages(userId, limit)

// Queue integration
sendViaQueue(userId, type, template, payload, options)
```

### NotificationQueue

```typescript
queue(options: QueueNotificationOptions): Promise<string>
queueBatch(notifications: QueueNotificationOptions[]): Promise<string[]>
processImmediately(options: QueueNotificationOptions): Promise<boolean>
getQueueStatus(): Promise<{ queued, processing, failed }>
```

---

## 🔗 Related Files

- `lib/whatsapp/wasender-client.ts` - WasenderAPI client
- `lib/whatsapp/notification-dispatcher.ts` - Notification dispatcher
- `lib/whatsapp/notification-queue.ts` - Queue system
- `lib/whatsapp/message-formatter.ts` - Message templates
- `lib/whatsapp/session-manager.ts` - Session management
- `app/api/whatsapp/webhook/route.ts` - Webhook handler
- `app/api/whatsapp/session/route.ts` - Session API
- `app/api/notifications/process/route.ts` - Notification processor

---

## 📖 Additional Resources

- [Full Implementation Guide](./WHATSAPP_IMPLEMENTATION.md)
- [WasenderAPI Docs](https://docs.wasender.com)
- [Upstash QStash Docs](https://upstash.com/docs/qstash)
- [WhatsApp Rate Limits](https://developers.facebook.com/docs/whatsapp/api/rate-limiting)
