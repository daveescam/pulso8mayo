/**
 * WhatsApp Webhook Handler
 * 
 * Soporta ambos formatos:
 * - WasenderAPI (Legacy): { event, sessionId, data }
 * - WAHA NOWEB: { event, session, payload }
 * 
 * Esto permite migración gradual y rollback si es necesario.
 */

import { NextRequest, NextResponse } from 'next/server';
import { messageRouter } from '@/lib/whatsapp/message-router';
import { sessionManager } from '@/lib/whatsapp/session-manager';
import { db } from '@/lib/db';
import { whatsappMessages, whatsappSessions, users, notificationPreferences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// TIPOS DE PAYLOAD
// ============================================================================

/** Payload de WasenderAPI (Legacy) */
interface WasenderWebhookPayload {
  event: string;
  sessionId: string;
  data: {
    from: string;
    to?: string;
    message?: string;
    text?: string;
    type?: string;
    messageId?: string;
    mediaUrl?: string;
    fromMe?: boolean;
    phoneNumber?: string;
    qrCode?: string;
    timestamp?: number;
    latitude?: number;
    longitude?: number;
    loc?: { latitude: number; longitude: number };
    accuracy?: number;
  };
}

/** Payload de WAHA NOWEB */
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
    // Media
    mediaUrl?: string;
    caption?: string;
    // Location
    location?: {
      latitude: number;
      longitude: number;
    };
    // Status
    status?: string;
    error?: string;
  };
}

/** Payload normalizado para procesamiento interno */
interface NormalizedPayload {
  event: string;
  sessionId: string;
  from: string;
  to?: string;
  message: string;
  type: string;
  messageId: string;
  timestamp: Date;
  fromMe: boolean;
  mediaUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  isWAHA: boolean;
}

// ============================================================================
// DETECTAR Y NORMALIZAR PAYLOAD
// ============================================================================

function detectPayloadType(body: any): 'wasender' | 'waha' {
  if (body.session !== undefined && body.payload !== undefined) {
    return 'waha';
  }
  return 'wasender';
}

function normalizePayload(body: WasenderWebhookPayload | WAHAWebhookPayload): NormalizedPayload {
  const type = detectPayloadType(body);
  
  if (type === 'waha') {
    const wahaBody = body as WAHAWebhookPayload;
    const { payload, session } = wahaBody;
    
    // Extraer número de teléfono del formato "5215512345678@c.us"
    const from = payload.from.replace(/@c\.us$|@s\.whatsapp\.net$/, '');
    
    return {
      event: wahaBody.event,
      sessionId: session,
      from,
      to: undefined,
      message: payload.body || '',
      type: payload.type === 'chat' ? 'text' : payload.type,
      messageId: payload.id,
      timestamp: new Date(payload.timestamp * 1000), // WAHA envía segundos
      fromMe: payload.fromMe,
      mediaUrl: payload.mediaUrl,
      location: payload.location ? {
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
      } : undefined,
      isWAHA: true,
    };
  } else {
    const wasenderBody = body as WasenderWebhookPayload;
    const { event, sessionId, data } = wasenderBody;
    
    return {
      event,
      sessionId,
      from: data.from,
      to: data.to,
      message: data.message || data.text || '',
      type: data.type || 'text',
      messageId: data.messageId || '',
      timestamp: new Date(data.timestamp || Date.now()),
      fromMe: data.fromMe || false,
      mediaUrl: data.mediaUrl,
      location: data.latitude ? {
        latitude: data.latitude,
        longitude: data.longitude || data.loc?.longitude,
        accuracy: data.accuracy,
      } : undefined,
      isWAHA: false,
    };
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

async function handleQR(normalized: NormalizedPayload) {
  await sessionManager.updateSessionStatus(normalized.sessionId, 'CONNECTING');
  
  // Para WAHA, el QR se obtiene por separado vía API
  // Para Wasender, viene en el webhook
  if (!normalized.isWAHA) {
    const wasenderData = (normalized as any).wasenderData;
    if (wasenderData?.qrCode) {
      await db.update(whatsappSessions)
        .set({
          qrCode: wasenderData.qrCode,
          qrCodeExpiresAt: new Date(Date.now() + 60000),
          updatedAt: new Date(),
        })
        .where(eq(whatsappSessions.sessionId, normalized.sessionId));
    }
  }
}

async function handleReady(normalized: NormalizedPayload) {
  const wasenderData = (normalized as any).wasenderData;
  await sessionManager.updateSessionStatus(
    normalized.sessionId,
    'CONNECTED',
    wasenderData?.phoneNumber
  );
  console.log(`[WhatsApp Webhook] Session ${normalized.sessionId} connected`);
}

async function handleDisconnected(normalized: NormalizedPayload) {
  await sessionManager.updateSessionStatus(normalized.sessionId, 'DISCONNECTED');
  console.log(`[WhatsApp Webhook] Session ${normalized.sessionId} disconnected`);
}

async function handleMessageAck(normalized: NormalizedPayload) {
  // WAHA envía message.ack para confirmar estado de mensajes enviados
  // ack: 1 = Enviado, 2 = Recibido, 3 = Leído
  console.log('[WAHA] Message ACK:', normalized.messageId, normalized.event);
  
  // Actualizar estado del mensaje en base de datos
  await db.update(whatsappMessages)
    .set({
      status: mapAckToStatus((normalized as any).ack),
    })
    .where(eq(whatsappMessages.externalMessageId, normalized.messageId));
}

async function handleSessionStatus(normalized: NormalizedPayload) {
  // WAHA envía session.status para cambios de estado
  const status = (normalized as any).status;
  console.log('[WAHA] Session status:', normalized.sessionId, status);
  
  const mappedStatus = mapWAHASessionStatus(status);
  await sessionManager.updateSessionStatus(normalized.sessionId, mappedStatus);
}

async function handleMessage(normalized: NormalizedPayload, req: NextRequest) {
  // Ignorar mensajes propios
  if (normalized.fromMe) {
    return;
  }

  // Log message to database
  await db.insert(whatsappMessages).values({
    sessionId: (await sessionManager.getSession(normalized.sessionId))?.id || '',
    direction: 'INBOUND',
    from: normalized.from,
    to: normalized.to || '',
    messageType: normalized.type,
    content: normalized.message,
    mediaUrl: normalized.mediaUrl,
    externalMessageId: normalized.messageId,
    processed: false,
  });

  // Check for opt-out/opt-in commands
  if (normalized.type === 'text') {
    const messageText = normalized.message.toLowerCase().trim();
    const isOptOut = ['stop', 'alto', 'parar', 'no notificar', 'opt-out', 'unsubscribe'].some(cmd =>
      messageText.includes(cmd)
    );
    const isOptIn = ['start', 'inicio', 'comenzar', 'activar', 'opt-in', 'subscribe'].some(cmd =>
      messageText.includes(cmd)
    );

    if (isOptOut || isOptIn) {
      const session = await sessionManager.getSession(normalized.sessionId);
      if (session) {
        const user = await db.query.users.findFirst({
          where: and(
            eq(users.phone, normalized.from),
            eq(users.companyId, session.companyId)
          ),
        });

        if (user) {
          // Update notification preferences
          await db.insert(notificationPreferences)
            .values({
              userId: user.id,
              whatsappEnabled: isOptIn,
            })
            .onConflictDoUpdate({
              target: notificationPreferences.userId,
              set: {
                whatsappEnabled: isOptIn,
                updatedAt: new Date(),
              },
            });

          // Enviar confirmación usando el cliente apropiado
          const confirmationMessage = isOptIn
            ? `✅ *Notificaciones Activadas*\n\nHas activado las notificaciones de WhatsApp.\n\nEscribe *ayuda* para ver los comandos disponibles.`
            : `🛑 *Notificaciones Desactivadas*\n\nHas desactivado las notificaciones de WhatsApp.\n\nPara reactivarlas, escribe *inicio*.`;

          // Importar cliente dinámicamente según configuración
          if (process.env.USE_WAHA === 'true') {
            const { wahaClient } = await import('@/lib/whatsapp/waha-client');
            await wahaClient.sendMessage({
              sessionId: normalized.sessionId,
              to: normalized.from,
              message: confirmationMessage,
            });
          } else {
            const { wasenderClient } = await import('@/lib/whatsapp/wasender-client');
            await wasenderClient.sendMessage({
              sessionId: normalized.sessionId,
              to: normalized.from,
              message: confirmationMessage,
            });
          }

          console.log(`[WhatsApp Webhook] User ${user.id} ${isOptIn ? 'opted-in' : 'opted-out'} WhatsApp notifications`);
        }
      }

      // Mark as processed and skip command routing
      await db.update(whatsappMessages)
        .set({ processed: true })
        .where(eq(whatsappMessages.externalMessageId, normalized.messageId));

      return;
    }
  }

  // Route message to command handler
  const result = await messageRouter.routeMessage({
    sessionId: normalized.sessionId,
    from: normalized.from,
    message: normalized.message,
    messageType: normalized.type as any,
    mediaUrl: normalized.mediaUrl,
    timestamp: normalized.timestamp,
    location: normalized.location,
  });

  if (!result.success) {
    console.error('[WhatsApp Webhook] Message routing failed:', result.error);
    await sessionManager.recordError(normalized.sessionId, result.error || 'Unknown error');
  }

  // Mark message as processed
  await db.update(whatsappMessages)
    .set({ processed: true })
    .where(eq(whatsappMessages.externalMessageId, normalized.messageId));
}

// ============================================================================
// HELPERS
// ============================================================================

function mapAckToStatus(ack: number): string {
  switch (ack) {
    case 1: return 'sent';
    case 2: return 'delivered';
    case 3: return 'read';
    default: return 'unknown';
  }
}

function mapWAHASessionStatus(status: string): 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'FAILED' {
  const statusMap: Record<string, 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'FAILED'> = {
    'STARTING': 'DISCONNECTED',
    'SCAN_QR': 'CONNECTING',
    'WORKING': 'CONNECTED',
    'FAILED': 'FAILED',
    'STOPPED': 'DISCONNECTED',
  };
  return statusMap[status] || 'DISCONNECTED';
}

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * POST /api/whatsapp/webhook
 * Handle incoming WhatsApp messages from WasenderAPI or WAHA
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Log incoming webhook for debugging
    console.log('[WhatsApp Webhook] Received:', JSON.stringify(body, null, 2));

    // Detectar y normalizar payload
    const normalized = normalizePayload(body as any);
    
    console.log(`[WhatsApp Webhook] Detected ${normalized.isWAHA ? 'WAHA' : 'Wasender'} format, event: ${normalized.event}`);

    // Manejar diferentes tipos de eventos
    switch (normalized.event) {
      case 'qr':
        await handleQR(normalized);
        break;

      case 'ready':
        await handleReady(normalized);
        break;

      case 'disconnected':
        await handleDisconnected(normalized);
        break;

      case 'message':
        await handleMessage(normalized, req);
        break;

      case 'message.ack':
        // WAHA específico: acknowledgement de mensajes
        await handleMessageAck(normalized);
        break;

      case 'session.status':
        // WAHA específico: cambios de estado de sesión
        await handleSessionStatus(normalized);
        break;

      default:
        console.log(`[WhatsApp Webhook] Unknown event type: ${normalized.event}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/whatsapp/webhook
 * Health check endpoint
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    status: 'alive', 
    service: 'whatsapp-webhook',
    supports: ['wasender', 'waha']
  });
}
