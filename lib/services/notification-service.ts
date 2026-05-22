/**
 * @deprecated For creating/sending notifications, use NotificationDispatcher from @/lib/services/notification-dispatcher instead.
 * Read operations (getByUserId, markAsRead, etc.) will be migrated in a future version.
 * This module will be removed once all write consumers are migrated.
 */

import { db } from '@/lib/db';
import { users, notifications, notificationPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { whatsappClient } from '@/lib/whatsapp/client-factory';

function isWhatsAppConfigured(): boolean {
  return !!process.env.WAHA_API_URL;
}

let resend: any = null;
async function getResend() {
    if (!resend && process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

export interface NotificationPreferences {
    whatsappEnabled: boolean;
    emailEnabled: boolean;
    inAppEnabled: boolean;
    workflowAssignments: boolean;
    workflowDueSoon: boolean;
    workflowOverdue: boolean;
    incidents: boolean;
    stockAlerts: boolean;
}

export interface Notification {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    actionUrl?: string;
    actionLabel?: string;
}

export interface WorkflowAssignmentData {
    id: string;
    assignedTo: string;
    instance?: {
        workflowTemplateId?: string;
        workflowName?: string;
    };
    dueDate?: string;
    priority?: string;
    [key: string]: unknown;
}

export class NotificationService {
    /**
     * Notify user about workflow assignment
     */
    static async notifyWorkflowAssignment(assignment: WorkflowAssignmentData) {
        const userId = assignment.assignedTo;
        const prefs = await this.getUserNotificationPreferences(userId);

        if (!prefs.workflowAssignments) {
            return; // User has disabled assignment notifications
        }

        const message = `Nueva tarea asignada: ${assignment.instance?.workflowTemplateId || 'Workflow'}`;

        const promises = [];

        if (prefs.whatsappEnabled) {
            promises.push(this.sendWhatsAppNotification(userId, message));
        }

        if (prefs.emailEnabled) {
            promises.push(this.sendEmailNotification(
                userId,
                'Nueva Tarea Asignada',
                message
            ));
        }

        if (prefs.inAppEnabled) {
            promises.push(this.sendInAppNotification(userId, {
                title: 'Nueva Tarea',
                message,
                type: 'info',
                actionUrl: `/dashboard/workflows/${assignment.instanceId}`,
                actionLabel: 'Ver Tarea',
            }));
        }

        await Promise.allSettled(promises);
    }

    /**
     * Notify user about workflow due soon
     */
    static async notifyWorkflowDueSoon(assignment: WorkflowAssignmentData) {
        const userId = assignment.assignedTo;
        const prefs = await this.getUserNotificationPreferences(userId);

        if (!prefs.workflowDueSoon) {
            return;
        }

        const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
        const hoursUntilDue = dueDate
            ? Math.round((dueDate.getTime() - Date.now()) / (1000 * 60 * 60))
            : 0;

        const message = `Recordatorio: Tarea pendiente vence en ${hoursUntilDue} horas`;

        const promises = [];

        if (prefs.whatsappEnabled) {
            promises.push(this.sendWhatsAppNotification(userId, message));
        }

        if (prefs.inAppEnabled) {
            promises.push(this.sendInAppNotification(userId, {
                title: 'Tarea Por Vencer',
                message,
                type: 'warning',
                actionUrl: `/dashboard/workflows/${assignment.instanceId}`,
                actionLabel: 'Completar Ahora',
            }));
        }

        await Promise.allSettled(promises);
    }

    /**
     * Notify user about overdue workflow
     */
    static async notifyWorkflowOverdue(assignment: WorkflowAssignmentData) {
        const userId = assignment.assignedTo;
        const prefs = await this.getUserNotificationPreferences(userId);

        if (!prefs.workflowOverdue) {
            return;
        }

        const message = `⚠️ Tarea VENCIDA: ${assignment.instance?.workflowTemplateId || 'Workflow'}`;

        const promises = [];

        if (prefs.whatsappEnabled) {
            promises.push(this.sendWhatsAppNotification(userId, message));
        }

        if (prefs.emailEnabled) {
            promises.push(this.sendEmailNotification(
                userId,
                '⚠️ Tarea Vencida',
                message
            ));
        }

        if (prefs.inAppEnabled) {
            promises.push(this.sendInAppNotification(userId, {
                title: 'Tarea Vencida',
                message,
                type: 'error',
                actionUrl: `/dashboard/workflows/${assignment.instanceId}`,
                actionLabel: 'Completar Urgente',
            }));
        }

        await Promise.allSettled(promises);
    }

    /**
     * Notify user about low stock alert
     */
    static async notifyLowStock(branchId: string, items: Array<{
        name: string;
        currentStock: number;
        minLevel: number;
        shortage: number;
        suggestedReorder: number;
    }>) {
        // Get managers of the branch
        // For now, we'll notify all users with ADMIN or GERENTE role
        // In production, you'd query users by branch and role

        const message = `⚠️ Stock Bajo: ${items.length} items requieren atención en esta sucursal.`;

        const promises = [];

        // Get all users (in production, filter by branch)
        const allUsers = await db.select().from(users);

        for (const user of allUsers) {
            const prefs = await this.getUserNotificationPreferences(user.id);

            if (!prefs.stockAlerts) {
                continue;
            }

            if (prefs.inAppEnabled) {
                promises.push(this.sendInAppNotification(user.id, {
                    title: 'Stock Bajo',
                    message: `${items.length} items con stock bajo`,
                    type: 'warning',
                    actionUrl: `/dashboard/inventory?filter=low-stock`,
                    actionLabel: 'Ver Alertas',
                }));
            }

            // Only send WhatsApp/Email for critical items (stock = 0)
            const criticalItems = items.filter(i => i.currentStock === 0);
            if (criticalItems.length > 0) {
                const criticalMessage = `🚨 Stock Crítico: ${criticalItems.map(i => i.name).join(', ')}`;

                if (prefs.whatsappEnabled) {
                    promises.push(this.sendWhatsAppNotification(user.id, criticalMessage));
                }

                if (prefs.emailEnabled) {
                    promises.push(this.sendEmailNotification(
                        user.id,
                        '🚨 Alerta de Stock Crítico',
                        `Los siguientes items están sin stock:\n${criticalItems.map(i => `- ${i.name}: 0/${i.minLevel}`).join('\n')}\n\nPor favor, reordenar lo antes posible.`
                    ));
                }
            }
        }

        await Promise.allSettled(promises);
    }

    /**
     * Send batch notifications to multiple users
     */
    static async sendBatchNotifications(assignments: WorkflowAssignmentData[]) {
        const promises = assignments.map(assignment =>
            this.notifyWorkflowAssignment(assignment)
        );

        await Promise.allSettled(promises);
    }

    /**
     * Send WhatsApp notification
     */
    static async sendWhatsAppNotification(userId: string, message: string) {
        try {
            const [userData] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            if (!userData?.phone) {
                console.log(`No phone number for user ${userId}`);
                return;
            }

            if (!isWhatsAppConfigured()) {
                console.log(`[WhatsApp] Not configured, skipping notification to ${userData.phone}`);
                return;
            }

            const sessionId = process.env.WHATSAPP_SESSION_ID || `pulso_${userData.companyId || 'default'}`;
	const result = await whatsappClient.sendMessage({
                sessionId,
                to: userData.phone,
                message,
            });

            console.log(`[WhatsApp] Sent to ${userData.phone}, messageId: ${result.messageId}`);
        } catch (error) {
            console.error('WhatsApp notification failed:', error);
        }
    }

    /**
     * Send email notification
     */
    static async sendEmailNotification(userId: string, subject: string, body: string) {
        try {
            const [userData] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            if (!userData?.email) {
                console.log(`No email for user ${userId}`);
                return;
            }

            const resendService = await getResend();
            if (!resendService) {
                console.log(`[Email] RESEND_API_KEY not configured. Would send to ${userData.email}: ${subject}`);
                return;
            }

            const result = await resendService.emails.send({
                from: 'Pulso <notificaciones@pulso.app>',
                to: userData.email,
                subject,
                html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
            });

            console.log(`[Email] Sent to ${userData.email}, result:`, result);
        } catch (error) {
            console.error('Email notification failed:', error);
        }
    }

    /**
     * Send in-app notification
     */
    static async sendInAppNotification(userId: string, notification: Notification) {
        try {
            await db.insert(notifications).values({
                userId,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                actionUrl: notification.actionUrl || null,
                actionLabel: notification.actionLabel || null,
                read: false,
            });
        } catch (error) {
            console.error('In-app notification failed:', error);
        }
    }

    /**
     * Get user notification preferences
     */
    static async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
        const prefs = await db.query.notificationPreferences.findFirst({
            where: (notificationPreferences, { eq }) => eq(notificationPreferences.userId, userId),
        });

        if (!prefs) {
            return {
                whatsappEnabled: true,
                emailEnabled: true,
                inAppEnabled: true,
                workflowAssignments: true,
                workflowDueSoon: true,
                workflowOverdue: true,
                incidents: true,
                stockAlerts: true,
            };
        }

        return {
            whatsappEnabled: prefs.whatsappEnabled,
            emailEnabled: prefs.emailEnabled,
            inAppEnabled: prefs.inAppEnabled,
            workflowAssignments: prefs.workflowAssignments,
            workflowDueSoon: prefs.workflowDueSoon,
            workflowOverdue: prefs.workflowOverdue,
            incidents: prefs.incidents,
            stockAlerts: prefs.inventoryAlerts,
        };
    }

    /**
     * Update user notification preferences
     */
    static async updateNotificationPreferences(
        userId: string,
        prefs: Partial<NotificationPreferences>
    ) {
        const existing = await db.query.notificationPreferences.findFirst({
            where: (notificationPreferences, { eq }) => eq(notificationPreferences.userId, userId),
        });

        if (existing) {
            await db.update(notificationPreferences)
                .set({ ...prefs, updatedAt: new Date() })
                .where(eq(notificationPreferences.id, existing.id));
        } else {
            await db.insert(notificationPreferences).values({
                userId,
                whatsappEnabled: prefs.whatsappEnabled ?? true,
                emailEnabled: prefs.emailEnabled ?? true,
                inAppEnabled: prefs.inAppEnabled ?? true,
                workflowAssignments: prefs.workflowAssignments ?? true,
                workflowDueSoon: prefs.workflowDueSoon ?? true,
                workflowOverdue: prefs.workflowOverdue ?? true,
                incidents: prefs.incidents ?? true,
                inventoryAlerts: prefs.stockAlerts ?? true,
            });
        }
    }
}
