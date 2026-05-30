import { NextRequest, NextResponse } from 'next/server';
import { messageRouter } from '@/lib/whatsapp/message-router';
import { sessionManager } from '@/lib/whatsapp/session-manager';
import { db } from '@/lib/db';
import { whatsappMessages, whatsappSessions, users, notificationPreferences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface WhapiMessage {
  id: string;
  from_me: boolean;
  type: string;
  chat_id: string;
  timestamp: number;
  source?: string;
  text?: { body: string };
  caption?: string;
  from?: string;
  from_name?: string;
  media?: string;
  location?: { latitude: number; longitude: number };
}

interface WhapiWebhookPayload {
  messages?: WhapiMessage[];
  event?: { type: string; event: string };
  channel_id?: string;
  statuses?: Array<{
    id: string;
    status: string;
    chat_id: string;
    timestamp: number;
  }>;
}

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
  };
}

const SESSION_ID = 'default';

function normalizePayload(msg: WhapiMessage): NormalizedPayload {
  const from = (msg.from || msg.chat_id || '').replace(/@.*$/, '');

  return {
    event: 'message',
    sessionId: SESSION_ID,
    from,
    to: undefined,
    message: msg.text?.body || msg.caption || '',
    type: msg.type === 'text' ? 'text' : msg.type,
    messageId: msg.id,
    timestamp: new Date(msg.timestamp * 1000),
    fromMe: msg.from_me,
    mediaUrl: msg.media,
    location: msg.location ? {
      latitude: msg.location.latitude,
      longitude: msg.location.longitude,
    } : undefined,
  };
}

async function handleMessagePayload(msg: WhapiMessage): Promise<void> {
  const normalized = normalizePayload(msg);

  if (normalized.fromMe) {
    return;
  }

  await db.insert(whatsappMessages).values({
    sessionId: SESSION_ID,
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
      const session = await sessionManager.getSession(SESSION_ID);
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
            sessionId: SESSION_ID,
            to: normalized.from,
            message: confirmationMessage,
          });
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
    await sessionManager.recordError(SESSION_ID, result.error || 'Unknown error');
  }

  await db.update(whatsappMessages)
    .set({ processed: true })
    .where(eq(whatsappMessages.externalMessageId, normalized.messageId));
}

async function handleStatusUpdate(status: { id: string; status: string }): Promise<void> {
  const statusMap: Record<string, string> = {
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
    failed: 'failed',
  };

  const mapped = statusMap[status.status] || 'unknown';
  await db.update(whatsappMessages)
    .set({ status: mapped })
    .where(eq(whatsappMessages.externalMessageId, status.id));
}

export async function POST(req: NextRequest) {
  try {
    const body: WhapiWebhookPayload = await req.json();

    console.log('[WhatsApp Webhook] Received WHAPI event:', body.event?.type);

    if (body.statuses) {
      for (const status of body.statuses) {
        await handleStatusUpdate(status);
      }
    }

    if (body.messages) {
      for (const msg of body.messages) {
        await handleMessagePayload(msg);
      }
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
    supports: ['whapi'],
  });
}
