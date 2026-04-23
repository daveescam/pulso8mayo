/**
 * WhatsApp Webhook Handler
 * 
 * Receives incoming WhatsApp messages from WasenderAPI and routes them
 * to appropriate command handlers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { messageRouter } from '@/lib/whatsapp/message-router';
import { sessionManager } from '@/lib/whatsapp/session-manager';
import { db } from '@/lib/db';
import { whatsappMessages, whatsappSessions, users, notificationPreferences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';


/**
 * POST /api/whatsapp/webhook
 * Handle incoming WhatsApp messages
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Log incoming webhook for debugging
        console.log('[WhatsApp Webhook] Received:', JSON.stringify(body, null, 2));

        // Verify webhook signature (if configured)
        const signature = req.headers.get('x-wasender-signature');
        if (signature && process.env.WASENDER_WEBHOOK_SECRET) {
            const rawBody = await req.text();
            const { wasenderClient } = await import('@/lib/whatsapp/wasender-client');
            const isValid = wasenderClient.verifyWebhookSignature(rawBody, signature);

            if (!isValid) {
                console.error('[WhatsApp Webhook] Invalid signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        // Parse webhook payload
        const { event, sessionId, data } = body;

        // Handle different event types
        switch (event) {
            case 'qr':
                // QR code updated
                await sessionManager.updateSessionStatus(sessionId, 'CONNECTING');
                if (data.qrCode) {
                    await db.update(whatsappSessions)
                        .set({
                            qrCode: data.qrCode,
                            qrCodeExpiresAt: new Date(Date.now() + 60000), // 1 minute
                            updatedAt: new Date(),
                        })
                        .where(eq(whatsappSessions.sessionId, sessionId));
                }
                break;

            case 'ready':
                // Session connected
                await sessionManager.updateSessionStatus(
                    sessionId,
                    'CONNECTED',
                    data.phoneNumber
                );
                console.log(`[WhatsApp Webhook] Session ${sessionId} connected`);
                break;

            case 'disconnected':
                // Session disconnected
                await sessionManager.updateSessionStatus(sessionId, 'DISCONNECTED');
                console.log(`[WhatsApp Webhook] Session ${sessionId} disconnected`);
                break;

            case 'message':
                // Incoming message
                if (data.fromMe) {
                    // Ignore messages sent by us
                    break;
                }

                // Handle location messages
                const messageType = data.type || 'text';
                let locationData = undefined;
                
                if (messageType === 'location') {
                    // Extract location data from WhatsApp message
                    locationData = {
                        latitude: data.latitude || data.loc?.latitude,
                        longitude: data.longitude || data.loc?.longitude,
                        accuracy: data.accuracy,
                    };
                }

                // Log message to database
                await db.insert(whatsappMessages).values({
                    sessionId: (await sessionManager.getSession(sessionId))?.id || '',
                    direction: 'INBOUND',
                    from: data.from,
                    to: data.to,
                    messageType: messageType,
                    content: data.message || data.text,
                    mediaUrl: data.mediaUrl,
                    externalMessageId: data.messageId,
                    processed: false,
                });

                // Check for opt-out/opt-in commands first (only for text messages)
                if (messageType === 'text') {
                    const messageText = (data.message || data.text || '').toLowerCase().trim();
                    const isOptOut = ['stop', 'alto', 'parar', 'no notificar', 'opt-out', 'unsubscribe'].some(cmd =>
                        messageText.includes(cmd)
                    );
                    const isOptIn = ['start', 'inicio', 'comenzar', 'activar', 'opt-in', 'subscribe'].some(cmd =>
                        messageText.includes(cmd)
                    );

                    if (isOptOut || isOptIn) {
                        // Find user by phone
                        const session = await sessionManager.getSession(sessionId);
                        if (session) {
                            const user = await db.query.users.findFirst({
                                where: and(
                                    eq(users.phone, data.from),
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

                                // Send confirmation message
                                const { wasenderClient } = await import('@/lib/whatsapp/wasender-client');
                                const confirmationMessage = isOptIn
                                    ? `✅ *Notificaciones Activadas*\n\nHas activado las notificaciones de WhatsApp.\n\nEscribe *ayuda* para ver los comandos disponibles.`
                                    : `🛑 *Notificaciones Desactivadas*\n\nHas desactivado las notificaciones de WhatsApp.\n\nPara reactivarlas, escribe *inicio*.`;

                                await wasenderClient.sendMessage({
                                    sessionId,
                                    to: data.from,
                                    message: confirmationMessage,
                                });

                                console.log(`[WhatsApp Webhook] User ${user.id} ${isOptIn ? 'opted-in' : 'opted-out'} WhatsApp notifications`);
                            }
                        }

                        // Mark as processed and skip command routing
                        await db.update(whatsappMessages)
                            .set({ processed: true })
                            .where(eq(whatsappMessages.externalMessageId, data.messageId));

                        break;
                    }
                }

                // Route message to command handler
                const result = await messageRouter.routeMessage({
                    sessionId,
                    from: data.from,
                    message: data.message || data.text || '',
                    messageType: messageType as any,
                    mediaUrl: data.mediaUrl,
                    timestamp: new Date(data.timestamp || Date.now()),
                    location: locationData,
                });

                if (!result.success) {
                    console.error('[WhatsApp Webhook] Message routing failed:', result.error);
                    await sessionManager.recordError(sessionId, result.error || 'Unknown error');
                }

                // Mark message as processed
                await db.update(whatsappMessages)
                    .set({ processed: true })
                    .where(eq(whatsappMessages.externalMessageId, data.messageId));

                break;

            default:
                console.log(`[WhatsApp Webhook] Unknown event type: ${event}`);
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
    return NextResponse.json({ status: 'alive', service: 'whatsapp-webhook' });
}
