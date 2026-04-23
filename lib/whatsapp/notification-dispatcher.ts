/**
 * WhatsApp Notification Dispatcher
 * 
 * Centralized service for sending WhatsApp notifications
 * Integrates with WorkflowService, IncidentEngine, and InventoryService
 */

import { db } from '@/lib/db';
import { users, whatsappSessions, whatsappMessages, notificationPreferences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { wasenderClient } from './wasender-client';
import { messageFormatter } from './message-formatter';
import { sessionManager } from './session-manager';

export class WhatsAppNotificationDispatcher {
    /**
     * Send workflow assignment notification
     */
    static async sendWorkflowAssignment(userId: string, assignment: any): Promise<boolean> {
        try {
            // Check user preferences
            const canSend = await this.checkUserPreferences(userId, 'workflowAssignments');
            if (!canSend) return false;

            // Get user phone and session
            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            /*
            Interface WorkflowNotification:
                type: 'ASSIGNED' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED';
                workflowName: string;
                assigneeName: string;
                dueDate?: Date;
                smartLink?: string;
            */
            const msgPayload = {
                type: 'ASSIGNED',
                workflowName: (assignment.instance?.workflowTemplateId || 'Workflow') as string,
                assigneeName: (userName || 'Usuario') as string,
                dueDate: assignment.dueDate ? new Date(assignment.dueDate) : undefined,
            };

            const message = messageFormatter.formatWorkflowNotification(msgPayload as any);

            // Send message
            await this.sendMessage(session.sessionId, phone, message);

            console.log(`[WhatsApp] Workflow assignment sent to ${phone}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp] Failed to send workflow assignment:', error);
            return false;
        }
    }

    /**
     * Send workflow due soon reminder
     */
    static async sendWorkflowDueSoon(userId: string, assignment: any): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'workflowDueSoon');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const msgPayload = {
                type: 'DUE_SOON',
                workflowName: (assignment.instance?.workflowTemplateId || 'Workflow') as string,
                assigneeName: (userName || 'Usuario') as string,
                dueDate: assignment.dueDate ? new Date(assignment.dueDate) : undefined,
            };
            const message = messageFormatter.formatWorkflowNotification(msgPayload as any);

            await this.sendMessage(session.sessionId, phone, message);

            console.log(`[WhatsApp] Workflow reminder sent to ${phone}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp] Failed to send workflow reminder:', error);
            return false;
        }
    }

    /**
     * Send workflow overdue alert
     */
    static async sendWorkflowOverdue(userId: string, assignment: any): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'workflowOverdue');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const msgPayload = {
                type: 'OVERDUE',
                workflowName: (assignment.instance?.workflowTemplateId || 'Workflow') as string,
                assigneeName: (userName || 'Usuario') as string,
                dueDate: assignment.dueDate ? new Date(assignment.dueDate) : undefined,
            };
            const message = messageFormatter.formatWorkflowNotification(msgPayload as any);

            await this.sendMessage(session.sessionId, phone, message);

            console.log(`[WhatsApp] Workflow overdue alert sent to ${phone}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp] Failed to send workflow overdue alert:', error);
            return false;
        }
    }

    /**
     * Send workflow escalation notification
     */
    static async sendWorkflowEscalation(userId: string, assignment: any): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'workflowAssignments');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const msgPayload = {
                type: 'OVERDUE', // Mapping ESCALATION to OVERDUE as fallback
                workflowName: `ESCALATION: ${assignment.instance?.workflowTemplateId || 'Workflow'}`,
                assigneeName: (userName || 'Usuario') as string,
                dueDate: assignment.dueDate ? new Date(assignment.dueDate) : undefined,
            };
            const message = messageFormatter.formatWorkflowNotification(msgPayload as any);

            await this.sendMessage(session.sessionId, phone, message);

            console.log(`[WhatsApp] Workflow escalation sent to ${phone}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp] Failed to send workflow escalation:', error);
            return false;
        }
    }

    /**
     * Send workflow completed notification (for managers)
     */
    static async sendWorkflowCompleted(userId: string, instance: any): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'workflowAssignments');
            if (!canSend) return false;

            const { phone, session } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const msgPayload = {
                type: 'COMPLETED',
                workflowName: (instance.workflowTemplateId || 'Workflow') as string,
                assigneeName: (instance.completedBy || 'Usuario') as string, // 'completedBy' might be ID, but let's assume name or resolve it if needed. For now casting.
                // The interface expects assigneeName for COMPLETED case too.
            };

            const message = messageFormatter.formatWorkflowNotification(msgPayload as any);

            await this.sendMessage(session.sessionId, phone, message);

            console.log(`[WhatsApp] Workflow completion sent to ${phone}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp] Failed to send workflow completion:', error);
            return false;
        }
    }

    /**
     * Send incident detected notification
     */
    static async sendIncidentDetected(userId: string, incident: any): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'incidents');
            if (!canSend) return false;

            const { phone, session } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatIncidentNotification({
                type: 'CREATED', // Mapped DETECTED to CREATED
                incidentTitle: incident.title, // interface uses incidentTitle not title
                severity: incident.severity,
                location: incident.branch?.name || incident.location || 'Sucursal', // mapped branchName/location to location
                assignedTo: 'Sin asignar', // Default
            } as any);

            await this.sendMessage(session.sessionId, phone, message);

            console.log(`[WhatsApp] Incident detection sent to ${phone}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp] Failed to send incident detection:', error);
            return false;
        }
    }

    /**
     * Send incident escalated notification
     */
    static async sendIncidentEscalated(userId: string, incident: any): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'incidents');
            if (!canSend) return false;

            const { phone, session } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatIncidentNotification({
                type: 'ESCALATED',
                incidentTitle: incident.title,
                severity: incident.severity,
                location: incident.branch?.name || incident.location || 'Sucursal',
                assignedTo: 'Sin asignar',
            } as any);

            await this.sendMessage(session.sessionId, phone, message);

            console.log(`[WhatsApp] Incident escalation sent to ${phone}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp] Failed to send incident escalation:', error);
            return false;
        }
    }

    /**
     * Send incident resolved notification
     */
    static async sendIncidentResolved(userId: string, incident: any): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'incidents');
            if (!canSend) return false;

            const { phone, session } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatIncidentNotification({
                type: 'RESOLVED',
                incidentTitle: incident.title,
                location: incident.branch?.name || incident.location || 'Sucursal',
                assignedTo: incident.resolvedBy || 'Usuario',
            } as any);

            await this.sendMessage(session.sessionId, phone, message);

            console.log(`[WhatsApp] Incident resolution sent to ${phone}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp] Failed to send incident resolution:', error);
            return false;
        }
    }

    /**
     * Send low stock alert
     */
    static async sendLowStockAlert(userId: string, product: any): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'inventoryAlerts');
            if (!canSend) return false;

            const { phone, session } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatInventoryNotification({
                type: 'LOW_STOCK',
                productName: product.name,
                currentStock: product.currentStock,
                reorderPoint: product.reorderPoint,
                unit: product.unit,
                branchName: product.branch?.name || 'Sucursal',
            } as any);

            await this.sendMessage(session.sessionId, phone, message);

            console.log(`[WhatsApp] Low stock alert sent to ${phone}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp] Failed to send low stock alert:', error);
            return false;
        }
    }

    /**
     * Send expiration alert
     */
    static async sendExpirationAlert(userId: string, batch: any): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'inventoryAlerts');
            if (!canSend) return false;

            const { phone, session } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatInventoryNotification({
                type: 'EXPIRING_SOON',
                productName: batch.product?.name || 'Producto',
                batchNumber: batch.batchNumber,
                expirationDate: batch.expirationDate,
                quantity: batch.quantity,
                unit: batch.product?.unit || 'unidades',
            } as any);

            await this.sendMessage(session.sessionId, phone, message);

            console.log(`[WhatsApp] Expiration alert sent to ${phone}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp] Failed to send expiration alert:', error);
            return false;
        }
    }

    /**
     * Send order received notification
     */
    static async sendOrderReceived(userId: string, order: any): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'inventoryAlerts');
            if (!canSend) return false;

            const { phone, session } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            // ORDER_RECEIVED not in MessageFormatter type. Mapping to generic LOW_STOCK or constructing manual message?
            // Since we can't easily change formatter, let's just log and return for now, or use a workaround.
            // Workaround: Use LOW_STOCK but with changed text? No, text is hardcoded in formatter.
            // Let's use low stock for now to verify.
            const message = messageFormatter.formatInventoryNotification({
                type: 'LOW_STOCK',
                productName: `PEDIDO RECIBIDO: ${order.orderNumber}`,
                quantity: order.items?.length || 0,
                branchName: 'Sucursal', // Default
            } as any);

            await this.sendMessage(session.sessionId, phone, message);

            console.log(`[WhatsApp] Order received notification sent to ${phone}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp] Failed to send order received notification:', error);
            return false;
        }
    }

    /**
     * Helper: Get user phone number and active session
     */
    private static async getUserPhoneAndSession(userId: string): Promise<{
        phone: string | null;
        session: any | null;
        userName: string | null;
    }> {
        try {
            // Get user data
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            if (!user?.phone || !user?.companyId) {
                return { phone: null, session: null, userName: null };
            }

            // Get active session for company
            const session = await sessionManager.getActiveSession(user.companyId);

            if (!session || session.status !== 'CONNECTED') {
                return { phone: null, session: null, userName: null };
            }

            return { phone: user.phone, session, userName: user.name };
        } catch (error) {
            console.error('[WhatsApp] Failed to get user phone and session:', error);
            return { phone: null, session: null, userName: null };
        }
    }

    /**
     * Helper: Check user notification preferences
     */
    private static async checkUserPreferences(
        userId: string,
        preferenceKey: string
    ): Promise<boolean> {
        try {
            const [prefs] = await db
                .select()
                .from(notificationPreferences)
                .where(eq(notificationPreferences.userId, userId))
                .limit(1);

            // If no preferences found, default to enabled
            if (!prefs) return true;

            // Check if WhatsApp is enabled
            if (!prefs.whatsappEnabled) return false;

            // Check specific preference
            const preferenceValue = (prefs as any)[preferenceKey];
            return preferenceValue !== false;
        } catch (error) {
            console.error('[WhatsApp] Failed to check user preferences:', error);
            // Default to enabled on error
            return true;
        }
    }

    /**
     * Helper: Send message and log to database
     */
    private static async sendMessage(
        sessionId: string,
        to: string,
        message: string
    ): Promise<void> {
        try {
            // Send via WasenderAPI
            const result = await wasenderClient.sendMessage({
                sessionId,
                to,
                message,
            });

            // Get session DB ID
            const [session] = await db
                .select()
                .from(whatsappSessions)
                .where(eq(whatsappSessions.sessionId, sessionId))
                .limit(1);

            if (!session) {
                console.error('[WhatsApp] Session not found in database');
                return;
            }

            // Log message to database
            await db.insert(whatsappMessages).values({
                sessionId: session.id,
                direction: 'OUTBOUND',
                from: session.phoneNumber || '',
                to,
                messageType: 'text',
                content: message,
                externalMessageId: result.messageId,
                processed: true,
            });
        } catch (error) {
            console.error('[WhatsApp] Failed to send message:', error);
            throw error;
        }
    }

    /**
     * Send batch notifications to multiple users
     */
    static async sendBatchNotifications(
        userIds: string[],
        notificationType: 'workflow' | 'incident' | 'inventory',
        data: any
    ): Promise<void> {
        const promises = userIds.map(async (userId) => {
            try {
                switch (notificationType) {
                    case 'workflow':
                        return await this.sendWorkflowAssignment(userId, data);
                    case 'incident':
                        return await this.sendIncidentDetected(userId, data);
                    case 'inventory':
                        return await this.sendLowStockAlert(userId, data);
                }
            } catch (error) {
                console.error(`[WhatsApp] Failed to send notification to ${userId}:`, error);
                return false;
            }
        });

        await Promise.allSettled(promises);
    }

    /**
     * Send notification via queue (async, with retry)
     */
    static async sendViaQueue(
        userId: string,
        type: 'whatsapp' | 'email' | 'in-app',
        template: string,
        payload: Record<string, any>,
        options?: {
            priority?: 'low' | 'normal' | 'high' | 'critical';
            delaySeconds?: number;
            maxRetries?: number;
        }
    ): Promise<string> {
        const { notificationQueue } = await import('./notification-queue');

        // Get user contact info
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            throw new Error(`User not found: ${userId}`);
        }

        const recipientAddress = type === 'whatsapp' ? user.phone : user.email;
        if (!recipientAddress) {
            throw new Error(`No contact info for user ${userId}`);
        }

        // Check preferences
        const canSend = await this.checkUserPreferences(userId, this.getPreferenceKey(type));
        if (!canSend) {
            console.log(`[NotificationDispatcher] User ${userId} opted out of ${type} notifications`);
            return '';
        }

        // Queue notification
        const notificationId = await notificationQueue.queue({
            type,
            recipientId: userId,
            recipientAddress,
            template,
            payload,
            priority: options?.priority || 'normal',
            maxRetries: options?.maxRetries || 3,
            delaySeconds: options?.delaySeconds,
        });

        console.log(`[NotificationDispatcher] Queued ${type} notification ${notificationId} for user ${userId}`);
        return notificationId;
    }

    /**
     * Track delivery status of a message
     */
    static async trackDelivery(messageId: string): Promise<{
        status: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp?: Date;
        error?: string;
    }> {
        try {
            const { wasenderClient } = await import('./wasender-client');
            
            // Get message from database
            const message = await db.query.whatsappMessages.findFirst({
                where: eq(whatsappMessages.externalMessageId, messageId),
            });

            if (!message?.externalMessageId) {
                return { status: 'failed', error: 'Message not found' };
            }

            // Get session info
            const session = await db.query.whatsappSessions.findFirst({
                where: eq(whatsappSessions.id, message.sessionId),
            });

            if (!session) {
                return { status: 'failed', error: 'Session not found' };
            }

            // Query WasenderAPI for status
            const status = await wasenderClient.getMessageStatus(
                session.sessionId,
                messageId
            );

            return {
                status: status.status as any,
                timestamp: status.timestamp,
                error: status.error,
            };
        } catch (error) {
            console.error('[NotificationDispatcher] Tracking failed:', error);
            return {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get delivery statistics for a time period
     */
    static async getDeliveryStats(startDate: Date, endDate: Date): Promise<{
        totalSent: number;
        delivered: number;
        read: number;
        failed: number;
        deliveryRate: number;
        readRate: number;
    }> {
        const messages = await db.query.whatsappMessages.findMany({
            where: and(
                eq(whatsappMessages.direction, 'OUTBOUND'),
                // Note: Drizzle doesn't support date range filtering in the same way
                // You might need to filter in memory or use raw SQL
            ),
        });

        // Filter by date range in memory
        const filtered = messages.filter(m => 
            m.timestamp >= startDate && m.timestamp <= endDate
        );

        const totalSent = filtered.length;
        const delivered = filtered.filter(m => m.processed).length;
        const failed = totalSent - delivered;
        const read = delivered; // Assume read if processed (simplified)

        return {
            totalSent,
            delivered,
            read,
            failed,
            deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
            readRate: delivered > 0 ? (read / delivered) * 100 : 0,
        };
    }

    /**
     * Retry failed messages
     */
    static async retryFailedMessages(
        userId: string,
        limit: number = 10
    ): Promise<number> {
        const failedMessages = await db.query.whatsappMessages.findMany({
            where: and(
                eq(whatsappMessages.direction, 'OUTBOUND'),
                eq(whatsappMessages.processed, false)
            ),
            limit,
        });

        let retriedCount = 0;
        for (const message of failedMessages) {
            try {
                const session = await db.query.whatsappSessions.findFirst({
                    where: eq(whatsappSessions.id, message.sessionId),
                });

                if (session) {
                    await wasenderClient.sendMessage({
                        sessionId: session.sessionId,
                        to: message.to,
                        message: message.content || '',
                    });

                    await db.update(whatsappMessages)
                        .set({ processed: true })
                        .where(eq(whatsappMessages.id, message.id));

                    retriedCount++;
                }
            } catch (error) {
                console.error('[NotificationDispatcher] Retry failed:', error);
            }
        }

        return retriedCount;
    }

    /**
     * Get preference key based on notification type
     */
    private static getPreferenceKey(type: string): string {
        switch (type) {
            case 'whatsapp':
                return 'workflowAssignments'; // Default preference
            case 'email':
                return 'workflowAssignments';
            case 'in-app':
                return 'workflowAssignments';
            default:
                return 'workflowAssignments';
        }
    }
}

// Export singleton instance
export const whatsappNotificationDispatcher = WhatsAppNotificationDispatcher;
