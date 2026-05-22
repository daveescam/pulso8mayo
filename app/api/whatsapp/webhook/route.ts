/**
 * WhatsApp Webhook Handler
 *
 * Recibe eventos de WAHA (WhatsApp HTTP API) con motor NOWEB.
 * Maneja mensajes entrantes, cambios de estado, QR codes y ACKs.
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
    mediaUrl?: string;
    caption?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
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
}

// ============================================================================
// NORMALIZAR PAYLOAD
// ============================================================================

function normalizePayload(body: WAHAWebhookPayload): NormalizedPayload {
  const { event, session, payload } = body;

  const from = payload.from.replace(/@c\.us$|@s\.whatsapp\.net$/, '');

  return {
    event,
    sessionId: session,
    from,
    to: undefined,
    message: payload.body || '',
    type: payload.type === 'chat' ? 'text' : payload.type,
    messageId: payload.id,
    timestamp: new Date(payload.timestamp * 1000),
    fromMe: payload.fromMe,
    mediaUrl: payload.mediaUrl,
    location: payload.location ? {
      latitude: payload.location.latitude,
      longitude: payload.location.longitude,
    } : undefined,
  };
}

// ============================================================================
// HANDLERS
// ============================================================================

async function handleQR(normalized: NormalizedPayload) {
  await sessionManager.updateSessionStatus(normalized.sessionId, 'CONNECTING');
}

async function handleReady(normalized: NormalizedPayload) {
  await sessionManager.updateSessionStatus(
    normalized.sessionId,
    'CONNECTED'
  );
  console.log(`[WhatsApp Webhook] Session ${normalized.sessionId} connected`);
}

async function handleDisconnected(normalized: NormalizedPayload) {
  await sessionManager.updateSessionStatus(normalized.sessionId, 'DISCONNECTED');
  console.log(`[WhatsApp Webhook] Session ${normalized.sessionId} disconnected`);
}

async function handleMessageAck(normalized: NormalizedPayload) {
  console.log('[WAHA] Message ACK:', normalized.messageId, normalized.event);

  await db.update(whatsappMessages)
    .set({
      status: mapAckToStatus((normalized as any).ack),
    })
    .where(eq(whatsappMessages.externalMessageId, normalized.messageId));
}

async function handleSessionStatus(normalized: NormalizedPayload) {
  const status = (normalized as any).status;
  console.log('[WAHA] Session status:', normalized.sessionId, status);

  const mappedStatus = mapWAHASessionStatus(status);
  await sessionManager.updateSessionStatus(normalized.sessionId, mappedStatus);
}

async function handleMessage(normalized: NormalizedPayload) {
  if (normalized.fromMe) {
    return;
  }

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

          const confirmationMessage = isOptIn
            ? `✅ *Notificaciones Activadas*\n\nHas activado las notificaciones de WhatsApp.\n\nEscribe *ayuda* para ver los comandos disponibles.`
            : `🛑 *Notificaciones Desactivadas*\n\nHas desactivado las notificaciones de WhatsApp.\n\nPara reactivarlas, escribe *inicio*.`;

          const { whatsappClient } = await import('@/lib/whatsapp/client-factory');
          await whatsappClient.sendMessage({
            sessionId: normalized.sessionId,
            to: normalized.from,
            message: confirmationMessage,
          });

          console.log(`[WhatsApp Webhook] User ${user.id} ${isOptIn ? 'opted-in' : 'opted-out'} WhatsApp notifications`);
        }
      }

      await db.update(whatsappMessages)
        .set({ processed: true })
        .where(eq(whatsappMessages.externalMessageId, normalized.messageId));

      return;
    }
  }

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('[WhatsApp Webhook] Received:', JSON.stringify(body, null, 2));

    const normalized = normalizePayload(body as WAHAWebhookPayload);

    console.log(`[WhatsApp Webhook] WAHA event: ${normalized.event}`);

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
        await handleMessage(normalized);
        break;

      case 'message.ack':
        await handleMessageAck(normalized);
        break;

      case 'session.status':
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

export async function GET(_req: NextRequest) {
  return NextResponse.json({
    status: 'alive',
    service: 'whatsapp-webhook',
    supports: ['waha']
  });
}
