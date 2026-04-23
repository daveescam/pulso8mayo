import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

export class NotificationService {
    /**
     * Notify user about workflow assignment
     */
    static async notifyWorkflowAssignment(assignment: any) {
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
    static async notifyWorkflowDueSoon(assignment: any) {
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
    static async notifyWorkflowOverdue(assignment: any) {
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
                        `Los siguientes items están sin stock:\n${criticalItems.map(i => `- ${i.name}: 0/${i.minLevel} ${i.unit}`).join('\n')}\n\nPor favor, reordenar lo antes posible.`
                    ));
                }
            }
        }

        await Promise.allSettled(promises);
    }

    /**
     * Send batch notifications to multiple users
     */
    static async sendBatchNotifications(assignments: any[]) {
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
            // Get user's phone number
            const [userData] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            if (!userData?.phone) {
                console.log(`No phone number for user ${userId}`);
                return;
            }

            // TODO: Integrate with WasenderAPI
            // For now, just log
            console.log(`[WhatsApp] To: ${userData.phone}, Message: ${message}`);

            // Example integration:
            // const response = await fetch('https://api.wasender.com/send', {
            //   method: 'POST',
            //   headers: {
            //     'Authorization': `Bearer ${process.env.WASENDER_API_KEY}`,
            //     'Content-Type': 'application/json',
            //   },
            //   body: JSON.stringify({
            //     phone: userData.phone,
            //     message,
            //   }),
            // });

        } catch (error) {
            console.error('WhatsApp notification failed:', error);
        }
    }

    /**
     * Send email notification
     */
    static async sendEmailNotification(userId: string, subject: string, body: string) {
        try {
            // Get user's email
            const [userData] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            if (!userData?.email) {
                console.log(`No email for user ${userId}`);
                return;
            }

            // TODO: Integrate with email service (Resend, SendGrid, etc.)
            // For now, just log
            console.log(`[Email] To: ${userData.email}, Subject: ${subject}, Body: ${body}`);

            // Example integration with Resend:
            // const { Resend } = await import('resend');
            // const resend = new Resend(process.env.RESEND_API_KEY);
            // await resend.emails.send({
            //   from: 'Pulso <notifications@pulso.app>',
            //   to: userData.email,
            //   subject,
            //   html: body,
            // });

        } catch (error) {
            console.error('Email notification failed:', error);
        }
    }

    /**
     * Send in-app notification
     */
    static async sendInAppNotification(userId: string, notification: Notification) {
        try {
            // TODO: Store notification in database or push to real-time service
            // For now, just log
            console.log(`[In-App] To: ${userId}, Notification:`, notification);

            // Example: Store in notifications table
            // await db.insert(notifications).values({
            //   userId,
            //   title: notification.title,
            //   message: notification.message,
            //   type: notification.type,
            //   actionUrl: notification.actionUrl,
            //   actionLabel: notification.actionLabel,
            //   read: false,
            // });

        } catch (error) {
            console.error('In-app notification failed:', error);
        }
    }

    /**
     * Get user notification preferences
     */
    static async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
        // TODO: Fetch from database
        // For now, return defaults
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

    /**
     * Update user notification preferences
     */
    static async updateNotificationPreferences(
        userId: string,
        prefs: Partial<NotificationPreferences>
    ) {
        // TODO: Store in database
        console.log(`Updating preferences for user ${userId}:`, prefs);
    }
}
