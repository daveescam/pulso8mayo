/**
 * WhatsApp Message Router
 *
 * Routes incoming WhatsApp messages to appropriate command handlers
 */

import { db } from '@/lib/db';
import { users, whatsappSessions, workflowAssignments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { commandParser } from './command-parser';
import { laborHandler, GeolocationData } from './handlers/labor-handler';
import { workflowConversationHandler } from './workflow-conversation-handler';
import { wasenderClient } from './wasender-client';
import { sessionManager } from './session-manager';

export interface IncomingMessage {
    sessionId: string;
    from: string; // Phone number
    message: string;
    messageType: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location';
    mediaUrl?: string;
    timestamp: Date;
    location?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
    };
}

export interface MessageResponse {
    success: boolean;
    reply?: string;
    error?: string;
}

export class MessageRouter {
    /**
     * Route an incoming message to the appropriate handler
     */
    async routeMessage(message: IncomingMessage): Promise<MessageResponse> {
        try {
            // Update session activity
            await sessionManager.updateActivity(message.sessionId);

            // Get company from session
            const session = await sessionManager.getSession(message.sessionId);
            if (!session) {
                console.error('[MessageRouter] Session not found:', message.sessionId);
                return {
                    success: false,
                    error: 'Session not found',
                };
            }

            // Find user by phone number and company
            const user = await db.query.users.findFirst({
                where: and(
                    eq(users.phone, message.from),
                    eq(users.companyId, session.companyId)
                ),
            });

            if (!user) {
                // User not found - send registration message
                return {
                    success: true,
                    reply: `👋 ¡Hola!

No encontramos tu número registrado en el sistema.

Por favor contacta a tu gerente para que te agregue al sistema Pulso.`,
                };
            }

            // Handle location messages
            if (message.messageType === 'location') {
                return await this.handleLocationMessage(message, user);
            }

            // Check if user has an active workflow conversation
            if (message.messageType === 'image' || message.messageType === 'document') {
                // Try to handle as workflow evidence
                const workflowResult = await workflowConversationHandler.handleMessage(message, user.id);
                if (workflowResult.reply) {
                    return {
                        success: workflowResult.success,
                        reply: workflowResult.reply,
                    };
                }
            }

            // Only process text messages for commands
            if (message.messageType !== 'text') {
                return {
                    success: true,
                    reply: '📎 Archivo recibido. Por ahora solo procesamos comandos de texto.',
                };
            }

            // Check if this message is part of an active workflow conversation
            const workflowResult = await workflowConversationHandler.handleMessage(message, user.id);
            if (workflowResult.reply && workflowResult.reply.includes('Workflow')) {
                // Message was handled by workflow conversation handler
                return {
                    success: workflowResult.success,
                    reply: workflowResult.reply,
                };
            }

            // Parse command
            const command = commandParser.parse(message.message);

            // Route to appropriate handler
            let result;
            switch (command.type) {
                case 'CLOCK_IN':
                    result = await laborHandler.handleClockIn(
                        user.id,
                        user.branchId || session.companyId,
                        message.sessionId,
                        message.from
                    );
                    break;

                case 'CLOCK_OUT':
                    result = await laborHandler.handleClockOut(
                        user.id,
                        message.sessionId,
                        message.from
                    );
                    break;

                case 'BREAK_START':
                    result = await laborHandler.handleBreakStart(
                        user.id,
                        message.sessionId,
                        message.from
                    );
                    break;

                case 'BREAK_END':
                    result = await laborHandler.handleBreakEnd(
                        user.id,
                        message.sessionId,
                        message.from
                    );
                    break;

                case 'STATUS':
                    result = await laborHandler.handleStatus(
                        user.id,
                        message.sessionId,
                        message.from
                    );
                    break;

                case 'TASKS':
                    result = await this.handleTasksCommand(user.id, message.sessionId, message.from);
                    break;

                case 'WORKFLOW':
                    // Handle workflow initiation
                    result = await workflowConversationHandler.handleMessage(message, user.id);
                    break;

                case 'HELP':
                    return {
                        success: true,
                        reply: commandParser.getHelpMessage(),
                    };

                case 'UNKNOWN':
                default:
                    return {
                        success: true,
                        reply: commandParser.getUnknownCommandMessage(),
                    };
            }

            // Send reply if handler returned a message
            if (result.message) {
                await wasenderClient.sendMessage({
                    sessionId: message.sessionId,
                    to: message.from,
                    message: result.message,
                });
            }

            return {
                success: result.success,
                reply: result.message,
            };
        } catch (error) {
            console.error('[MessageRouter] Error routing message:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Handle location messages (GPS coordinates from WhatsApp)
     */
    private async handleLocationMessage(
        message: IncomingMessage,
        user: typeof users.$inferSelect
    ): Promise<MessageResponse> {
        if (!message.location) {
            return {
                success: true,
                reply: '📍 No recibimos la ubicación. Por favor envía tu ubicación nuevamente.',
            };
        }

        const geolocation: GeolocationData = {
            latitude: message.location.latitude,
            longitude: message.location.longitude,
            accuracy: message.location.accuracy,
        };

        // Get session for branch context
        const session = await sessionManager.getSession(message.sessionId);
        if (!session) {
            return {
                success: false,
                error: 'Session not found',
            };
        }

        // Ask user what they want to do with the location
        await wasenderClient.sendMessage({
            sessionId: message.sessionId,
            to: message.from,
            message: `📍 Ubicación recibida\n\n` +
                `¿Qué deseas hacer?\n\n` +
                `• Envía *entrada* para registrar entrada\n` +
                `• Envía *salida* para registrar salida\n` +
                `• Envía *inicio pausa* para iniciar pausa\n` +
                `• Envía *fin pausa* para terminar pausa`,
        });

        // Store the geolocation temporarily for the next command
        // In a real implementation, you might want to cache this in Redis
        // For now, we'll just acknowledge receipt

        return {
            success: true,
            reply: undefined,
        };
    }

    /**
     * Handle tasks command (list pending workflows)
     */
    private async handleTasksCommand(userId: string, sessionId: string, phoneNumber: string) {
        try {
            // Get pending workflow assignments
            const assignments = await db.query.workflowAssignments.findMany({
                where: and(
                    eq(workflowAssignments.assignedToUserId, userId),
                    eq(workflowAssignments.status, 'PENDING')
                ),
                with: {
                    instance: {
                        with: {
                            template: true,
                        },
                    },
                },
                limit: 5,
            });

            if (assignments.length === 0) {
                return {
                    success: true,
                    message: `✅ *No tienes tareas pendientes*

¡Buen trabajo! 🎉`,
                };
            }

            let message = `📋 *Tareas Pendientes* (${assignments.length})

`;

            for (const assignment of assignments) {
                const template = assignment.instance?.template;
                const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
                const dueDateStr = dueDate ? dueDate.toLocaleDateString('es-MX') : 'Sin fecha límite';

                message += `• ${template?.name || 'Workflow'}
  📅 ${dueDateStr}

`;
            }

            message += '\nPara ver los detalles, ingresa al sistema Pulso.';

            return {
                success: true,
                message,
            };
        } catch (error) {
            console.error('[MessageRouter] Tasks command error:', error);
            return {
                success: false,
                message: '❌ Error al obtener tareas. Por favor intenta de nuevo.',
            };
        }
    }
}

// Singleton instance
export const messageRouter = new MessageRouter();
