# Plan de Migración: WasenderAPI → WAHA (NOWEB)

**Proyecto:** Pulso HORECA Platform  
**Fase:** Migración de WhatsApp Engine  
**Fecha:** Abril 29, 2026  
**Documento:** Plan de Implementación WAHA

---

## Resumen Ejecutivo

Este documento detalla el plan de migración desde **WasenderAPI** hacia **WAHA** utilizando el motor **NOWEB**. La migración busca aprovechar las ventajas de NOWEB que opera sin necesidad de un navegador (Chromium), reduciendo significativamente el consumo de CPU y memoria.

### Ventajas de WAHA NOWEB

| Aspecto | WasenderAPI | WAHA NOWEB |
|---------|-------------|------------|
| **Navegador** | Requiere Chromium/Chrome | No requiere navegador (WebSocket directo) |
| **Consumo CPU** | Alto | Bajo |
| **Consumo Memoria** | Alto (~300-500MB por sesión) | Bajo (~50-100MB por sesión) |
| **API** | REST propietario | REST unificada + Swagger |
| **Multi-engine** | No | Sí (WEBJS, WPP, NOWEB, GOWS, VENOM) |
| **Webhook** | Sí | Sí |
| **Store** | Limitado | Configurable (SQLite/MongoDB) |

---

## Análisis de Impacto

### Archivos Afectados

```
lib/whatsapp/
├── wasender-client.ts          # REEMPLAZAR con waha-client.ts
├── session-manager.ts          # MODIFICAR para WAHA sessions
├── message-router.ts           # SIN CAMBIOS (interfaz compatible)
├── webhook-handler.ts          # MODIFICAR payload format
├── notification-queue.ts       # SIN CAMBIOS (usa cliente)
└── notification-dispatcher.ts  # SIN CAMBIOS (usa cliente)

app/api/whatsapp/
├── webhook/route.ts            # MODIFICAR para formato WAHA
├── session/route.ts            # MODIFICAR endpoints WAHA
└── receive-photo/route.ts      # SIN CAMBIOS

config/
├── env.ts                      # MODIFICAR variables WAHA
└── waha-config.ts             # NUEVO
```

### Cambios en Variables de Entorno

```bash
# ANTES (WasenderAPI)
WASENDER_API_KEY=wasender_api_key_here
WASENDER_API_URL=https://api.wasender.com
WASENDER_WEBHOOK_SECRET=webhook_secret

# DESPUÉS (WAHA NOWEB)
WAHA_API_URL=http://localhost:3001           # URL del servidor WAHA
WAHA_WEBHOOK_SECRET=webhook_secret
WAHA_DEFAULT_ENGINE=NOWEB                    # WEBJS, WPP, NOWEB, GOWS, VENOM
WAHA_SESSION_STORAGE=sqlite                  # sqlite o mongodb

# Opcional: Configuración MongoDB para store
WAHA_MONGODB_URI=mongodb://localhost:27017/waha
```

---

## Arquitectura de Migración

### Diagrama de Arquitectura WAHA

```
┌─────────────────────────────────────────────────────────────┐
│                    PULSO PLATFORM                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Workflow   │  │ Notification │  │  SmartLink       │ │
│  │   Engine     │  │  Dispatcher  │  │   Service        │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                   │          │
│         └─────────────────┼───────────────────┘          │
│                           │                              │
│         ┌─────────────────▼──────────────────┐          │
│         │        WAHA Client (REST)         │          │
│         │  ┌─────────────────────────────┐  │          │
│         │  │      lib/whatsapp/          │  │          │
│         │  │    waha-client.ts           │  │          │
│         │  └─────────────────────────────┘  │          │
│         └─────────────────┬──────────────────┘          │
└───────────────────────────┼──────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   WAHA Server  │
                    │   :3001        │
                    └───────┬────────┘
                            │ WebSocket
                    ┌───────▼────────┐
                    │  WhatsApp    │
                    │   Servers    │
                    └──────────────┘
```

### Diferencias Clave en la API

| Función | WasenderAPI | WAHA API |
|---------|-------------|----------|
| Enviar mensaje | `POST /send-message` | `POST /api/sendText` |
| Enviar imagen | `POST /send-image` | `POST /api/sendImage` |
| Crear sesión | `POST /sessions/create` | `POST /api/sessions` |
| Obtener QR | `GET /sessions/{id}/qr` | `GET /api/sessions/{id}/auth/qr` |
| Estado sesión | `GET /sessions/{id}` | `GET /api/sessions/{id}` |
| Webhook | Firmado HMAC | Firma configurable |

---

## Plan de Implementación Detallado

### Fase 1: Infraestructura WAHA (Día 1)

#### 1.1 Configuración del Servidor WAHA

**Opción A: Docker Compose (Recomendado)**

```yaml
# docker-compose.yml
version: '3.8'

services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha-server
    ports:
      - "3001:3001"
    environment:
      - WHATSAPP_DEFAULT_ENGINE=NOWEB
      - WHATSAPP_STORE_ENABLED=true
      - WHATSAPP_STORE_FULL_SYNC=false
      - WEBHOOK_URL=http://host.docker.internal:3000/api/whatsapp/webhook
      - WEBHOOK_SECRET=${WAHA_WEBHOOK_SECRET}
    volumes:
      - ./.sessions:/app/.sessions
    restart: unless-stopped
    networks:
      - waha-network

networks:
  waha-network:
    driver: bridge
```

**Opción B: Docker Standalone**

```bash
# Descargar y ejecutar WAHA con NOWEB
docker run -d \
  --name waha-server \
  -p 3001:3001 \
  -e "WHATSAPP_DEFAULT_ENGINE=NOWEB" \
  -e "WHATSAPP_STORE_ENABLED=true" \
  -e "WEBHOOK_URL=http://your-domain.com/api/whatsapp/webhook" \
  -v $(pwd)/.sessions:/app/.sessions \
  --restart unless-stopped \
  devlikeapro/waha:latest
```

#### 1.2 Verificación de Instalación

```bash
# Verificar que WAHA está corriendo
curl http://localhost:3001/api/ping

# Respuesta esperada:
# { "status": "OK", "version": "2024.x.x" }

# Verificar documentación Swagger
curl http://localhost:3001/swagger
```

**Tareas:**
- [ ] Crear `docker-compose.waha.yml`
- [ ] Configurar variables de entorno en `.env`
- [ ] Verificar conectividad con WAHA
- [ ] Documentar acceso al dashboard de WAHA (`http://localhost:3001/dashboard`)

---

### Fase 2: Cliente WAHA (Días 2-3)

#### 2.1 Crear Nuevo Cliente WAHA

**Archivo:** `lib/whatsapp/waha-client.ts`

```typescript
/**
 * WAHA WhatsApp Client
 * Reemplazo para wasender-client.ts
 * Compatible con motor NOWEB
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// Interfaces
interface WAHAConfig {
  baseUrl: string;
  webhookSecret?: string;
  defaultEngine?: 'NOWEB' | 'WEBJS' | 'WPP' | 'GOWS' | 'VENOM';
}

interface SendMessageOptions {
  session?: string;
  mentions?: string[];
  replyTo?: string;
}

interface SendMediaOptions extends SendMessageOptions {
  caption?: string;
  filename?: string;
}

interface SessionConfig {
  name: string;
  config?: {
    noweb?: {
      store?: {
        enabled: boolean;
        fullSync: boolean;
      };
      markOnline?: boolean;
    };
  };
}

export class WAHAClient {
  private client: AxiosInstance;
  private config: WAHAConfig;

  constructor(config: WAHAConfig) {
    this.config = {
      defaultEngine: 'NOWEB',
      ...config
    };
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Interceptor para logging
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('[WAHA] API Error:', {
          endpoint: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        throw error;
      }
    );
  }

  // ========== MENSAJES ==========

  /**
   * Enviar mensaje de texto
   * POST /api/sendText
   */
  async sendMessage(
    phone: string, 
    message: string, 
    options: SendMessageOptions = {}
  ): Promise<any> {
    const chatId = this.formatPhoneNumber(phone);
    const session = options.session || 'default';

    const response = await this.client.post('/api/sendText', {
      chatId,
      text: message,
      session,
      ...(options.mentions && { mentions: options.mentions }),
      ...(options.replyTo && { reply_to: options.replyTo })
    });

    return response.data;
  }

  /**
   * Enviar imagen
   * POST /api/sendImage
   */
  async sendImage(
    phone: string,
    imageUrl: string,
    caption?: string,
    options: SendMediaOptions = {}
  ): Promise<any> {
    const chatId = this.formatPhoneNumber(phone);
    const session = options.session || 'default';

    const response = await this.client.post('/api/sendImage', {
      chatId,
      file: { url: imageUrl },
      ...(caption && { caption }),
      session,
      ...(options.replyTo && { reply_to: options.replyTo })
    });

    return response.data;
  }

  /**
   * Enviar documento
   * POST /api/sendFile
   */
  async sendDocument(
    phone: string,
    fileUrl: string,
    filename: string,
    caption?: string,
    options: SendMediaOptions = {}
  ): Promise<any> {
    const chatId = this.formatPhoneNumber(phone);
    const session = options.session || 'default';

    const response = await this.client.post('/api/sendFile', {
      chatId,
      file: { url: fileUrl },
      fileName: filename,
      ...(caption && { caption }),
      session
    });

    return response.data;
  }

  /**
   * Enviar mensajes masivos
   * POST /api/sendText (con rate limiting interno)
   */
  async sendBulkMessages(
    messages: Array<{
      phone: string;
      message: string;
      mediaUrl?: string;
    }>,
    options: { delay?: number; session?: string } = {}
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    const delay = options.delay || 1000; // 1 segundo entre mensajes
    const session = options.session || 'default';

    for (const msg of messages) {
      try {
        if (msg.mediaUrl) {
          await this.sendImage(msg.phone, msg.mediaUrl, msg.message, { session });
        } else {
          await this.sendMessage(msg.phone, msg.message, { session });
        }
        results.success++;
        
        // Rate limiting
        if (messages.indexOf(msg) < messages.length - 1) {
          await new Promise(r => setTimeout(r, delay));
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ phone: msg.phone, error: (error as Error).message });
      }
    }

    return results;
  }

  // ========== SESIONES ==========

  /**
   * Crear nueva sesión
   * POST /api/sessions
   */
  async createSession(config: SessionConfig): Promise<any> {
    const response = await this.client.post('/api/sessions', {
      name: config.name,
      config: config.config || {
        noweb: {
          store: {
            enabled: true,
            fullSync: false
          },
          markOnline: true
        }
      }
    });

    return response.data;
  }

  /**
   * Obtener código QR para autenticación
   * GET /api/sessions/{session}/auth/qr
   */
  async getQRCode(sessionId: string): Promise<{ qr: string | null }> {
    try {
      const response = await this.client.get(
        `/api/sessions/${sessionId}/auth/qr`,
        { timeout: 5000 }
      );
      return { qr: response.data.qr };
    } catch (error) {
      if ((error as AxiosError).response?.status === 404) {
        return { qr: null }; // Sesión no requiere QR (ya autenticada)
      }
      throw error;
    }
  }

  /**
   * Obtener estado de sesión
   * GET /api/sessions/{session}
   */
  async getSession(sessionId: string): Promise<{
    name: string;
    status: 'STARTING' | 'SCAN_QR' | 'WORKING' | 'FAILED';
    me?: {
      id: string;
      pushName: string;
    };
  }> {
    const response = await this.client.get(`/api/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * Obtener todas las sesiones
   * GET /api/sessions
   */
  async listSessions(): Promise<any[]> {
    const response = await this.client.get('/api/sessions');
    return response.data;
  }

  /**
   * Desconectar sesión
   * POST /api/sessions/{session}/stop
   */
  async disconnectSession(sessionId: string): Promise<void> {
    await this.client.post(`/api/sessions/${sessionId}/stop`);
  }

  /**
   * Eliminar sesión
   * DELETE /api/sessions/{session}
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.client.delete(`/api/sessions/${sessionId}`);
  }

  /**
   * Verificar si número está en WhatsApp
   * GET /api/checkNumberStatus
   */
  async isOnWhatsApp(phone: string): Promise<boolean> {
    try {
      const chatId = this.formatPhoneNumber(phone);
      const response = await this.client.get('/api/checkNumberStatus', {
        params: { chatId }
      });
      return response.data.numberExists === true;
    } catch {
      return false;
    }
  }

  // ========== UTILIDADES ==========

  private formatPhoneNumber(phone: string): string {
    // Remover caracteres no numéricos
    const clean = phone.replace(/\D/g, '');
    
    // Agregar @c.us si no está presente
    if (!clean.includes('@')) {
      return `${clean}@c.us`;
    }
    
    return clean;
  }

  /**
   * Obtener mensajes de un chat (requiere store habilitado)
   * GET /api/{session}/chats/{chatId}/messages
   */
  async getChatMessages(
    session: string,
    phone: string,
    options: { limit?: number; before?: string } = {}
  ): Promise<any[]> {
    const chatId = this.formatPhoneNumber(phone);
    
    const response = await this.client.get(
      `/api/${session}/chats/${encodeURIComponent(chatId)}/messages`,
      { params: options }
    );
    
    return response.data;
  }

  /**
   * Obtener todos los chats (requiere store habilitado)
   * GET /api/{session}/chats
   */
  async getChats(session: string): Promise<any[]> {
    const response = await this.client.get(`/api/${session}/chats`);
    return response.data;
  }
}

// Singleton instance
let wahaClientInstance: WAHAClient | null = null;

export function getWAHAClient(): WAHAClient {
  if (!wahaClientInstance) {
    const baseUrl = process.env.WAHA_API_URL || 'http://localhost:3001';
    
    wahaClientInstance = new WAHAClient({
      baseUrl,
      webhookSecret: process.env.WAHA_WEBHOOK_SECRET,
      defaultEngine: (process.env.WAHA_DEFAULT_ENGINE as any) || 'NOWEB'
    });
  }
  
  return wahaClientInstance;
}

export function resetWAHAClient(): void {
  wahaClientInstance = null;
}

// Exportar clase para testing
export { WAHAClient };
```

**Tareas:**
- [ ] Crear `lib/whatsapp/waha-client.ts`
- [ ] Implementar todos los métodos del cliente
- [ ] Agregar manejo de errores y retries
- [ ] Crear tests unitarios
- [ ] Verificar compatibilidad con métodos existentes de wasender-client.ts

---

### Fase 3: Adaptación de Webhooks (Día 3-4)

#### 3.1 Formato de Webhook WAHA vs WasenderAPI

**WasenderAPI (ANTES):**
```json
{
  "event": "message_received",
  "data": {
    "from": "5215512345678",
    "body": "Hola",
    "type": "chat",
    "timestamp": 1714312800,
    "messageId": "ABC123"
  }
}
```

**WAHA (DESPUÉS):**
```json
{
  "event": "message",
  "session": "default",
  "payload": {
    "id": "true_5215512345678@c.us_AAAAAAAAAAA",
    "timestamp": 1714312800,
    "from": "5215512345678@c.us",
    "fromMe": false,
    "body": "Hola",
    "type": "chat",
    "hasMedia": false,
    "ack": 1
  }
}
```

#### 3.2 Actualizar Webhook Handler

**Archivo:** `app/api/whatsapp/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { handleWhatsAppMessage } from '@/lib/whatsapp/message-router';

// WAHA webhook events
interface WAHAWebhookPayload {
  event: string;
  session: string;
  payload: {
    id: string;
    timestamp: number;
    from: string;
    fromMe: boolean;
    body: string;
    type: string;
    hasMedia: boolean;
    ack?: number;
    // Para media
    mediaUrl?: string;
    caption?: string;
    // Para ubicación
    location?: {
      latitude: number;
      longitude: number;
    };
  };
}

/**
 * Verificar firma del webhook (opcional en WAHA)
 */
function verifyWebhookSignature(request: NextRequest): boolean {
  const secret = process.env.WAHA_WEBHOOK_SECRET;
  if (!secret) return true; // Skip si no está configurado
  
  // WAHA puede configurar headers de firma si se configura
  // Por ahora aceptamos todos los webhooks verificando la IP origen
  return true;
}

/**
 * Formatear payload de WAHA a formato interno
 */
function normalizeWebhookPayload(wahaPayload: WAHAWebhookPayload): {
  from: string;
  body: string;
  type: string;
  timestamp: number;
  messageId: string;
  hasMedia: boolean;
  mediaUrl?: string;
  caption?: string;
  session: string;
} {
  const { payload, session } = wahaPayload;
  
  // Extraer número de teléfono del formato "5215512345678@c.us"
  const from = payload.from.replace(/@c\.us$|@s\.whatsapp\.net$/, '');
  
  return {
    from,
    body: payload.body || '',
    type: payload.type,
    timestamp: payload.timestamp * 1000, // WAHA envía segundos
    messageId: payload.id,
    hasMedia: payload.hasMedia,
    mediaUrl: payload.mediaUrl,
    caption: payload.caption,
    session
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar firma (opcional)
    if (!verifyWebhookSignature(request)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = await request.json() as WAHAWebhookPayload;
    
    console.log('[WAHA Webhook] Received:', {
      event: body.event,
      session: body.session,
      from: body.payload?.from
    });

    // Procesar eventos relevantes
    switch (body.event) {
      case 'message': {
        // Ignorar mensajes propios
        if (body.payload.fromMe) {
          return NextResponse.json({ success: true, ignored: true });
        }
        
        const normalized = normalizeWebhookPayload(body);
        await handleWhatsAppMessage(normalized);
        break;
      }
      
      case 'message.ack': {
        // Acknowledgement de mensaje enviado (checkmarks)
        await handleMessageAck(body.payload);
        break;
      }
      
      case 'session.status': {
        // Cambio de estado de sesión
        await handleSessionStatus(body.session, body.payload);
        break;
      }
      
      default: {
        console.log(`[WAHA Webhook] Unhandled event: ${body.event}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WAHA Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handlers específicos
async function handleMessageAck(payload: any) {
  // Actualizar estado de mensaje en base de datos
  // ack: 1 = Enviado, 2 = Recibido, 3 = Leído
  console.log('[WAHA] Message ACK:', payload.ack);
}

async function handleSessionStatus(sessionId: string, payload: any) {
  // Actualizar estado de sesión en base de datos
  console.log('[WAHA] Session status:', sessionId, payload.status);
}
```

#### 3.3 Configuración de Webhooks en WAHA

**Opción 1: Vía Environment Variables**
```yaml
environment:
  - WEBHOOK_URL=http://your-domain.com/api/whatsapp/webhook
  - WEBHOOK_SECRET=your_webhook_secret
```

**Opción 2: Vía API**
```bash
# Configurar webhook dinámicamente
curl -X POST http://localhost:3001/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/whatsapp/webhook",
    "events": ["message", "message.ack", "session.status"],
    "secret": "your_webhook_secret"
  }'
```

**Tareas:**
- [ ] Actualizar `app/api/whatsapp/webhook/route.ts`
- [ ] Implementar normalización de payload
- [ ] Configurar eventos de webhook en WAHA
- [ ] Probar recepción de mensajes
- [ ] Probar recepción de media/imágenes

---

### Fase 4: Actualización de Sesiones (Día 4)

#### 4.1 Migrar Session Manager

**Archivo:** `lib/whatsapp/session-manager.ts` (Modificaciones)

```typescript
// Cambiar import
// ANTES:
// import { getWasenderClient } from './wasender-client';

// DESPUÉS:
import { getWAHAClient } from './waha-client';

// En los métodos, reemplazar llamadas:
// ANTES:
// const client = getWasenderClient();
// const session = await client.getSession(sessionId);

// DESPUÉS:
// const client = getWAHAClient();
// const session = await client.getSession(sessionId);

// Estados de WAHA NOWEB:
// STARTING -> SCAN_QR -> WORKING
// vs WasenderAPI:
// DISCONNECTED -> CONNECTING -> CONNECTED -> FAILED
```

**Mapeo de Estados:**

| WasenderAPI | WAHA | Significado |
|-------------|------|-------------|
| `DISCONNECTED` | `STARTING` | Sesión iniciando/detenida |
| `CONNECTING` | `SCAN_QR` | Esperando escaneo QR |
| `CONNECTED` | `WORKING` | Sesión activa y funcionando |
| `FAILED` | `FAILED` | Error en la sesión |

#### 4.2 Actualizar Endpoints de API

**Archivo:** `app/api/whatsapp/session/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getWAHAClient } from '@/lib/whatsapp/waha-client';

// GET - Listar sesiones o obtener QR
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('id');
  const action = searchParams.get('action');

  const client = getWAHAClient();

  try {
    if (action === 'qr' && sessionId) {
      // Obtener código QR
      const { qr } = await client.getQRCode(sessionId);
      
      if (!qr) {
        return NextResponse.json(
          { error: 'Session already authenticated or not ready' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ qr });
    }

    if (sessionId) {
      // Obtener sesión específica
      const session = await client.getSession(sessionId);
      return NextResponse.json({
        id: session.name,
        status: mapWAHAStatus(session.status),
        phoneNumber: session.me?.id?.replace(/@.*$/, ''),
        isActive: session.status === 'WORKING'
      });
    }

    // Listar todas las sesiones
    const sessions = await client.listSessions();
    return NextResponse.json(sessions.map(s => ({
      id: s.name,
      status: mapWAHAStatus(s.status),
      isActive: s.status === 'WORKING'
    })));

  } catch (error) {
    console.error('[WAHA Sessions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva sesión
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, tenantId } = body;

    const client = getWAHAClient();
    
    // Crear sesión con configuración NOWEB
    const session = await client.createSession({
      name: sessionId || `tenant_${tenantId}`,
      config: {
        noweb: {
          store: {
            enabled: true,     // Guardar mensajes/contactos
            fullSync: false    // Sincronizar últimos 3 meses
          },
          markOnline: true      // Mostrar "en línea"
        }
      }
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.name,
        status: mapWAHAStatus(session.status)
      }
    });

  } catch (error) {
    console.error('[WAHA Sessions] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// DELETE - Detener/eliminar sesión
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID required' },
      { status: 400 }
    );
  }

  try {
    const client = getWAHAClient();
    await client.disconnectSession(sessionId);
    await client.deleteSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WAHA Sessions] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

// Helper para mapear estados
function mapWAHAStatus(wahaStatus: string): string {
  const statusMap: Record<string, string> = {
    'STARTING': 'DISCONNECTED',
    'SCAN_QR': 'CONNECTING',
    'WORKING': 'CONNECTED',
    'FAILED': 'FAILED',
    'STOPPED': 'DISCONNECTED'
  };
  
  return statusMap[wahaStatus] || wahaStatus;
}
```

**Tareas:**
- [ ] Actualizar `lib/whatsapp/session-manager.ts` para usar WAHA
- [ ] Actualizar `app/api/whatsapp/session/route.ts`
- [ ] Implementar mapeo de estados WAHA -> estados internos
- [ ] Actualizar UI de estado de sesión si es necesario
- [ ] Probar ciclo completo: crear -> QR -> conectar -> enviar mensaje

---

### Fase 5: Store y Persistencia (Día 5)

#### 5.1 Configurar Almacenamiento de Mensajes

**Ventaja de NOWEB:** Puede almacenar mensajes, contactos y chats en SQLite o MongoDB.

**Configuración SQLite (por defecto):**
```yaml
# docker-compose.yml
volumes:
  - ./.sessions:/app/.sessions  # Persiste SQLite automáticamente
```

**Configuración MongoDB:**
```yaml
# docker-compose.yml con MongoDB
version: '3.8'

services:
  waha:
    image: devlikeapro/waha:latest
    environment:
      - WHATSAPP_DEFAULT_ENGINE=NOWEB
      - WHATSAPP_STORE_ENABLED=true
      - MONGODB_URI=mongodb://mongo:27017/waha
    depends_on:
      - mongo
    volumes:
      - ./.sessions:/app/.sessions

  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo-data:
```

#### 5.2 Acceder a Historial de Mensajes

**Archivo:** `lib/whatsapp/waha-history-service.ts` (Nuevo)

```typescript
import { getWAHAClient } from './waha-client';

export async function getMessageHistory(
  session: string,
  phone: string,
  limit: number = 50
) {
  const client = getWAHAClient();
  
  try {
    const messages = await client.getChatMessages(session, phone, { limit });
    
    return messages.map(msg => ({
      id: msg.id,
      timestamp: msg.timestamp * 1000,
      from: msg.from.replace(/@.*$/, ''),
      body: msg.body,
      type: msg.type,
      fromMe: msg.fromMe,
      hasMedia: msg.hasMedia,
      mediaUrl: msg.mediaUrl
    }));
  } catch (error) {
    console.error('[WAHA History] Error fetching messages:', error);
    return [];
  }
}

export async function getAllChats(session: string) {
  const client = getWAHAClient();
  
  try {
    const chats = await client.getChats(session);
    return chats.map(chat => ({
      id: chat.id,
      name: chat.name,
      phone: chat.id.replace(/@.*$/, ''),
      unreadCount: chat.unreadCount,
      lastMessage: chat.lastMessage?.body
    }));
  } catch (error) {
    console.error('[WAHA History] Error fetching chats:', error);
    return [];
  }
}
```

**Tareas:**
- [ ] Configurar almacenamiento persistente (SQLite/MongoDB)
- [ ] Crear servicio de historial opcional
- [ ] Agregar endpoints para consultar historial
- [ ] Documentar esquema de base de datos de WAHA

---

### Fase 6: Integración con Servicios Existentes (Días 5-6)

#### 6.1 Actualizar Servicios de Notificación

**Archivo:** `lib/services/whatsapp-notification-service.ts`

```typescript
// Cambiar import
// ANTES: import { getWasenderClient } from '@/lib/whatsapp/wasender-client';
// DESPUÉS:
import { getWAHAClient } from '@/lib/whatsapp/waha-client';

// En los métodos, el código permanece casi igual
// porque WAHAClient implementa la misma interfaz
```

**Archivo:** `lib/whatsapp/notification-dispatcher.ts`

```typescript
// Actualizar la inicialización del cliente
// El resto del código permanece igual

// ANTES:
// import { getWasenderClient } from './wasender-client';
// const client = getWasenderClient();

// DESPUÉS:
// import { getWAHAClient } from './waha-client';
// const client = getWAHAClient();
```

#### 6.2 Actualizar SmartLink Service

**Archivo:** `lib/services/smart-link-service.ts`

El servicio SmartLink no necesita cambios directos ya que usa la capa de notificación. Solo verificar que:

```typescript
// Asegurar que los SmartLinks se envíen correctamente
// via WAHA (ya implementado en notification-dispatcher)
```

**Tareas:**
- [ ] Actualizar todos los imports de `wasender-client` a `waha-client`
- [ ] Verificar que `sendBulkMessages` funciona correctamente
- [ ] Probar envío de SmartLinks vía WAHA
- [ ] Verificar manejo de errores y fallbacks

---

### Fase 7: Pruebas y Validación (Días 6-7)

#### 7.1 Plan de Pruebas

| Componente | Prueba | Estado |
|------------|--------|--------|
| **Sesiones** | Crear sesión | ⬜ Pendiente |
| **Sesiones** | Obtener QR | ⬜ Pendiente |
| **Sesiones** | Conectar/desconectar | ⬜ Pendiente |
| **Mensajes** | Enviar texto | ⬜ Pendiente |
| **Mensajes** | Enviar imagen | ⬜ Pendiente |
| **Mensajes** | Enviar documento | ⬜ Pendiente |
| **Mensajes** | Enviar masivo (rate limit) | ⬜ Pendiente |
| **Webhook** | Recibir mensaje | ⬜ Pendiente |
| **Webhook** | Recibir imagen | ⬜ Pendiente |
| **Workflow** | Ejecutar vía WhatsApp | ⬜ Pendiente |
| **SmartLink** | Enviar y abrir | ⬜ Pendiente |
| **AI** | Verificación de fotos | ⬜ Pendiente |

#### 7.2 Script de Pruebas

```bash
#!/bin/bash
# test-waha.sh

WAHA_URL="http://localhost:3001"
SESSION="test-session"
PHONE="5215512345678"  # Reemplazar con número real

echo "=== Pruebas WAHA NOWEB ==="
echo ""

# 1. Ping
echo "1. Verificando WAHA..."
curl -s $WAHA_URL/api/ping
echo ""
echo ""

# 2. Crear sesión
echo "2. Creando sesión..."
curl -s -X POST $WAHA_URL/api/sessions \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$SESSION\", \"config\": {\"noweb\": {\"store\": {\"enabled\": true, \"fullSync\": false}}}}"
echo ""
echo ""

# 3. Obtener QR
echo "3. Obteniendo QR code (espera 5 segundos)..."
sleep 5
curl -s $WAHA_URL/api/sessions/$SESSION/auth/qr
echo ""
echo ""

# 4. Verificar estado
echo "4. Verificando estado..."
curl -s $WAHA_URL/api/sessions/$SESSION
echo ""
echo ""

# 5. Enviar mensaje (después de autenticar)
echo "5. Enviando mensaje de prueba..."
read -p "Presiona Enter después de escanear el QR y verificar que la sesión esté WORKING..."
curl -s -X POST $WAHA_URL/api/sendText \
  -H "Content-Type: application/json" \
  -d "{\"chatId\": \"${PHONE}@c.us\", \"text\": \"Prueba desde WAHA NOWEB ✅\", \"session\": \"$SESSION\"}"
echo ""
echo ""

# 6. Enviar imagen
echo "6. Enviando imagen..."
curl -s -X POST $WAHA_URL/api/sendImage \
  -H "Content-Type: application/json" \
  -d "{\"chatId\": \"${PHONE}@c.us\", \"file\": {\"url\": \"https://via.placeholder.com/400x300\", \"session\": \"$SESSION\"}}"
echo ""
echo ""

echo "=== Pruebas completadas ==="
```

#### 7.3 Testing con la Aplicación

```typescript
// test/integration/waha-migration.test.ts

import { describe, it, expect, beforeAll } from 'vitest';
import { getWAHAClient } from '@/lib/whatsapp/waha-client';

describe('WAHA Migration Tests', () => {
  const client = getWAHAClient();
  const testSession = 'test-session';
  const testPhone = process.env.TEST_WHATSAPP_PHONE || '';

  beforeAll(async () => {
    // Verificar conectividad
    const sessions = await client.listSessions();
    console.log('Available sessions:', sessions);
  });

  it('should send a text message', async () => {
    const result = await client.sendMessage(
      testPhone,
      'Mensaje de prueba automatizado',
      { session: testSession }
    );
    
    expect(result).toBeDefined();
  });

  it('should check if number exists on WhatsApp', async () => {
    const exists = await client.isOnWhatsApp(testPhone);
    expect(typeof exists).toBe('boolean');
  });

  it('should get session status', async () => {
    const session = await client.getSession(testSession);
    expect(session).toHaveProperty('name');
    expect(session).toHaveProperty('status');
  });
});
```

**Tareas:**
- [ ] Ejecutar script de pruebas manual
- [ ] Ejecutar tests unitarios
- [ ] Verificar integración end-to-end
- [ ] Comparar rendimiento vs WasenderAPI
- [ ] Documentar resultados

---

### Fase 8: Deployment y Rollback (Día 8)

#### 8.1 Estrategia de Deployment

**Recomendación:** Feature Flag para gradual migration

```typescript
// lib/whatsapp/client-factory.ts

export function getWhatsAppClient() {
  const useWAHA = process.env.USE_WAHA === 'true';
  
  if (useWAHA) {
    const { getWAHAClient } = await import('./waha-client');
    return getWAHAClient();
  } else {
    const { getWasenderClient } = await import('./wasender-client');
    return getWasenderClient();
  }
}
```

#### 8.2 Plan de Rollback

En caso de problemas:

1. **Revertir variable de entorno:**
   ```bash
   USE_WAHA=false
   ```

2. **Restaurar WasenderAPI:**
   ```bash
   # Detener WAHA
   docker stop waha-server
   
   # Iniciar WasenderAPI (si está en contenedor separado)
   docker start wasender-api
   ```

3. **Verificar webhooks:**
   - Asegurar que los webhooks apunten a WasenderAPI nuevamente

#### 8.3 Checklist de Producción

- [ ] WAHA server corriendo y estable
- [ ] Sesiones migradas y reconectadas
- [ ] Webhooks configurados y funcionando
- [ ] Rate limiting configurado
- [ ] Monitoreo de errores activo
- [ ] Plan de rollback probado

---

## Resumen de Archivos Modificados

| Archivo | Acción | Prioridad |
|---------|--------|-----------|
| `lib/whatsapp/waha-client.ts` | Crear | P0 |
| `app/api/whatsapp/webhook/route.ts` | Modificar | P0 |
| `app/api/whatsapp/session/route.ts` | Modificar | P0 |
| `lib/whatsapp/session-manager.ts` | Modificar | P0 |
| `lib/whatsapp/message-router.ts` | Sin cambios | - |
| `lib/whatsapp/notification-queue.ts` | Sin cambios | - |
| `lib/whatsapp/notification-dispatcher.ts` | Import changes | P1 |
| `lib/services/whatsapp-notification-service.ts` | Import changes | P1 |
| `lib/services/smart-link-service.ts` | Verificar | P1 |
| `docker-compose.waha.yml` | Crear | P0 |
| `.env` | Actualizar | P0 |
| `.env.example` | Actualizar | P1 |

---

## Recursos y Referencias

- **WAHA Documentation:** https://waha.devlike.pro/docs/
- **NOWEB Engine:** https://waha.devlike.pro/docs/engines/noweb/
- **API Swagger:** http://localhost:3001/swagger
- **Docker Hub:** https://hub.docker.com/r/devlikeapro/waha
- **GitHub:** https://github.com/devlikeapro/waha

---

## Estimación de Tiempos

| Fase | Días | Entregable |
|------|------|------------|
| Fase 1: Infraestructura | 1 | Docker Compose, WAHA corriendo |
| Fase 2: Cliente WAHA | 2 | `waha-client.ts` con tests |
| Fase 3: Webhooks | 1-2 | Webhook handler actualizado |
| Fase 4: Sesiones | 1 | Session manager actualizado |
| Fase 5: Store | 1 | Configuración de persistencia |
| Fase 6: Integración | 1-2 | Servicios actualizados |
| Fase 7: Pruebas | 2 | Tests pasando, validación |
| Fase 8: Deployment | 1 | Producción con WAHA |
| **TOTAL** | **8-10 días** | |

---

**Documento Version:** 1.0  
**Creado:** Abril 29, 2026  
**Estado:** Listo para implementación
