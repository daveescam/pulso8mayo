/**
 * Notification Queue System
 *
 * Uses Upstash QStash for reliable, asynchronous notification delivery
 * Supports retry logic with exponential backoff
 */

import { Client as QStashClient } from '@upstash/qstash';
import { db } from '@/lib/db';
import { notifications, whatsappMessages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  sendWorkflowAssignmentEmail,
  sendWorkflowReminderEmail,
  sendWorkflowOverdueEmail,
  sendIncidentAlertEmail,
  sendStockAlertEmail,
  sendShiftReminderEmail,
  sendDocumentExpirationEmail,
} from '@/lib/services/email-service';

// Initialize QStash client
const qstashClient = new QStashClient({
    token: process.env.QSTASH_TOKEN || '',
});

export interface NotificationQueueItem {
    id: string;
    type: 'whatsapp' | 'email' | 'in-app';
    recipientId: string;
    recipientAddress: string; // phone for WhatsApp, email for email
    template: string;
    payload: Record<string, any>;
    priority: 'low' | 'normal' | 'high' | 'critical';
    maxRetries: number;
    retryCount: number;
    scheduledAt?: Date;
}

export interface QueueNotificationOptions {
    type: 'whatsapp' | 'email' | 'in-app';
    recipientId: string;
    recipientAddress: string;
    template: string;
    payload: Record<string, any>;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    maxRetries?: number;
    delaySeconds?: number;
}

export class NotificationQueue {
    private static readonly QUEUE_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/process`;
    private static readonly DEFAULT_MAX_RETRIES = 3;

    /**
     * Queue a notification for async processing
     */
    static async queue(options: QueueNotificationOptions): Promise<string> {
        const notificationId = this.generateId();

        // Create notification record in database
        await db.insert(notifications).values({
            userId: options.recipientId,
            type: 'info', // Map options.type to valid enum value
            title: options.template,
            message: JSON.stringify(options.payload),
            read: false,
        });

        // Calculate delay if specified
        const delaySeconds = options.delaySeconds || 0;
        const scheduledAt = delaySeconds > 0 
            ? new Date(Date.now() + delaySeconds * 1000) 
            : undefined;

        // Queue in QStash
        if (process.env.QSTASH_TOKEN) {
            try {
      await qstashClient.publishJSON({
        url: this.QUEUE_URL,
                    body: {
                        id: notificationId,
                        type: options.type,
                        recipientId: options.recipientId,
                        recipientAddress: options.recipientAddress,
                        template: options.template,
                        payload: options.payload,
                        priority: options.priority || 'normal',
                        maxRetries: options.maxRetries || this.DEFAULT_MAX_RETRIES,
                        retryCount: 0,
                        scheduledAt: scheduledAt,
                    } as NotificationQueueItem,
                    headers: {
                        'x-notification-id': notificationId,
                        'x-notification-type': options.type,
                    },
                    // QStash handles retry with exponential backoff automatically
                    // but we can customize it
                    retries: options.maxRetries || this.DEFAULT_MAX_RETRIES,
                });

                console.log(`[NotificationQueue] Queued notification ${notificationId} for ${options.recipientId}`);
            } catch (error) {
                console.error('[NotificationQueue] Failed to queue in QStash:', error);
                // Fall back to immediate processing if QStash fails
                await this.processImmediately(options);
            }
        } else {
            console.warn('[NotificationQueue] QSTASH_TOKEN not configured, processing immediately');
            await this.processImmediately(options);
        }

        return notificationId;
    }

    /**
     * Queue multiple notifications for batch processing
     */
    static async queueBatch(
        notifications: QueueNotificationOptions[]
    ): Promise<string[]> {
        const ids = [];

        for (const notification of notifications) {
            const id = await this.queue(notification);
            ids.push(id);
        }

        return ids;
    }

    /**
     * Process a queued notification immediately
     */
    static async processImmediately(options: QueueNotificationOptions): Promise<boolean> {
        try {
            switch (options.type) {
                case 'whatsapp':
                    return await this.sendWhatsApp(options);
                case 'email':
                    return await this.sendEmail(options);
                case 'in-app':
                    return await this.sendInApp(options);
                default:
                    console.error('[NotificationQueue] Unknown notification type:', options.type);
                    return false;
            }
        } catch (error) {
            console.error('[NotificationQueue] Immediate processing failed:', error);
            return false;
        }
    }

    /**
     * Send WhatsApp notification
     */
    private static async sendWhatsApp(options: QueueNotificationOptions): Promise<boolean> {
        try {
            const { whatsappNotificationDispatcher } = await import('@/lib/whatsapp/notification-dispatcher');
            
            // Use the dispatcher to send based on template type
            // This is a simplified version - in production you'd map templates to specific methods
            const { wasenderClient } = await import('@/lib/whatsapp/wasender-client');
            const { sessionManager } = await import('@/lib/whatsapp/session-manager');

            // Get user's company to find session
            const user = await db.query.users.findFirst({
                where: eq(users.id, options.recipientId),
            });

            if (!user?.companyId) {
                console.error('[NotificationQueue] User not found:', options.recipientId);
                return false;
            }

            const session = await sessionManager.getActiveSession(user.companyId);
            if (!session) {
                console.error('[NotificationQueue] No active WhatsApp session for company:', user.companyId);
                return false;
            }

            // Send message
            const result = await wasenderClient.sendMessage({
                sessionId: session.sessionId,
                to: options.recipientAddress,
                message: this.formatMessage(options.template, options.payload),
            });

            // Log to database
            await db.insert(whatsappMessages).values({
                sessionId: session.id,
                direction: 'OUTBOUND',
                from: session.phoneNumber || '',
                to: options.recipientAddress,
                messageType: 'text',
                content: this.formatMessage(options.template, options.payload),
                externalMessageId: result.messageId,
                processed: true,
            });

            console.log(`[NotificationQueue] WhatsApp sent to ${options.recipientAddress}`);
            return true;
        } catch (error) {
            console.error('[NotificationQueue] WhatsApp send failed:', error);
            return false;
        }
    }

  /**
   * Send email notification
   */
  private static async sendEmail(options: QueueNotificationOptions): Promise<boolean> {
    try {
      const { template, payload, recipientAddress } = options;

      // Get user data for personalization
      const user = await db.query.users.findFirst({
        where: eq(users.id, options.recipientId),
      });

      const userName = user?.name || 'Usuario';

      // Route to appropriate email template based on template name
      switch (template) {
        case 'workflow_assignment':
          const assignmentResult = await sendWorkflowAssignmentEmail(recipientAddress, {
            userName,
            workflowName: payload.workflowName || 'Tarea',
            dueDate: payload.dueDate || new Date().toISOString(),
            priority: payload.priority || 'MEDIUM',
            assignmentUrl: payload.assignmentUrl || '#',
          });
          return assignmentResult.success;

        case 'workflow_due_soon':
        case 'workflow_reminder':
          const reminderResult = await sendWorkflowReminderEmail(recipientAddress, {
            userName,
            workflowName: payload.workflowName || 'Tarea',
            hoursUntilDue: payload.hoursUntilDue || 1,
            reminderType: payload.reminderType || '1h',
            assignmentUrl: payload.assignmentUrl || '#',
          });
          return reminderResult.success;

        case 'workflow_overdue':
          const overdueResult = await sendWorkflowOverdueEmail(recipientAddress, {
            userName,
            workflowName: payload.workflowName || 'Tarea',
            overdueTime: payload.overdueTime || 'hace poco',
            assignmentUrl: payload.assignmentUrl || '#',
          });
          return overdueResult.success;

        case 'incident':
          const incidentResult = await sendIncidentAlertEmail(recipientAddress, {
            userName,
            incidentTitle: payload.incidentTitle || 'Incidente',
            severity: payload.severity || 'WARNING',
            description: payload.description,
            incidentUrl: payload.incidentUrl || '#',
          });
          return incidentResult.success;

        case 'stock_alert':
        case 'inventory_alert':
          const stockResult = await sendStockAlertEmail(recipientAddress, {
            userName,
            itemName: payload.itemName || 'Producto',
            currentStock: payload.currentStock || 0,
            minLevel: payload.minLevel || 0,
            branchName: payload.branchName || 'Sucursal',
            inventoryUrl: payload.inventoryUrl || '#',
          });
          return stockResult.success;

        case 'shift_reminder':
          const shiftResult = await sendShiftReminderEmail(recipientAddress, {
            userName,
            shiftDate: payload.shiftDate || new Date().toLocaleDateString('es-MX'),
            shiftTime: payload.shiftTime || '',
            branchName: payload.branchName || '',
            scheduleUrl: payload.scheduleUrl,
          });
          return shiftResult.success;

        case 'document_expiration':
          const docResult = await sendDocumentExpirationEmail(recipientAddress, {
            userName,
            documentName: payload.documentName || 'Documento',
            documentType: payload.documentType || 'General',
            expirationDate: payload.expirationDate || new Date().toISOString(),
            daysUntilExpiration: payload.daysUntilExpiration || 0,
            documentsUrl: payload.documentsUrl || '#',
          });
          return docResult.success;

        default:
          // For unknown templates, use a generic approach with the formatMessage helper
          console.log(`[NotificationQueue] Unknown email template: ${template}, using generic formatting`);
          // Could implement a generic email sending here
          return false;
      }
    } catch (error) {
      console.error('[NotificationQueue] Email send failed:', error);
      return false;
    }
  }

    /**
     * Send in-app notification
     */
    private static async sendInApp(options: QueueNotificationOptions): Promise<boolean> {
        try {
            // In-app notifications are already stored in the notifications table
            // The record was created in the queue method above
            console.log(`[NotificationQueue] In-app notification created for ${options.recipientId}`);
            return true;
        } catch (error) {
            console.error('[NotificationQueue] In-app notification failed:', error);
            return false;
        }
    }

    /**
     * Format message template with payload values
     */
    private static formatMessage(template: string, payload: Record<string, any>): string {
        let message = template;
        
        // Replace placeholders like {{name}} with actual values
        for (const [key, value] of Object.entries(payload)) {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            message = message.replace(placeholder, String(value));
        }

        return message;
    }

    /**
     * Generate unique notification ID
     */
    private static generateId(): string {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get queue status
     */
    static async getQueueStatus(): Promise<{
        queued: number;
        processing: number;
        failed: number;
    }> {
        // This would require additional tracking tables
        // For now, return placeholder
        return {
            queued: 0,
            processing: 0,
            failed: 0,
        };
    }
}

// Import users for type resolution
import { users } from '@/lib/db/schema';

// Export singleton
export const notificationQueue = NotificationQueue;
