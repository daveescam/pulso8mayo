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

export interface WhatsAppSessionRow {
    id: string;
    companyId: string;
    sessionId: string;
    phoneNumber: string | null;
    status: string;
    qrCode: string | null;
    qrCodeExpiresAt: Date | null;
    connectedAt: Date | null;
    lastActivityAt: Date | null;
    disconnectedAt: Date | null;
    webhookUrl: string | null;
    isActive: boolean;
    lastError: string | null;
    errorCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkflowAssignmentNotification {
    id: string;
    workflowName: string;
    dueDate?: string;
    priority?: string;
    assignedAt?: string;
}

export interface WorkflowInstanceNotification {
    id: string;
    workflowName: string;
    completedAt?: string;
    score?: number;
}

export interface IncidentNotification {
    id: string;
    title: string;
    severity: string;
    description?: string;
    detectedAt?: string;
}

export interface InventoryItemNotification {
    id: string;
    name: string;
    sku: string;
    currentStock?: number;
    minStock?: number;
}

export interface InventoryBatchNotification {
    id: string;
    itemId: string;
    itemName: string;
    expirationDate: string;
    quantity?: number;
}

export class WhatsAppNotificationDispatcher {
    /**
     * Send workflow assignment notification
     */
    static async sendWorkflowAssignment(userId: string, assignment: WorkflowAssignmentNotification): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'workflowAssignments');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatWorkflowAssignment(assignment, userName || 'Usuario');
            await wasenderClient.sendMessage(session.sessionId, phone, message);
            return true;
        } catch (error) {
            console.error('[WhatsAppNotificationDispatcher] Error sending workflow assignment:', error);
            return false;
        }
    }

    static async sendWorkflowDueSoon(userId: string, assignment: WorkflowAssignmentNotification): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'workflowReminders');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatWorkflowDueSoon(assignment, userName || 'Usuario');
            await wasenderClient.sendMessage(session.sessionId, phone, message);
            return true;
        } catch (error) {
            console.error('[WhatsAppNotificationDispatcher] Error sending due soon:', error);
            return false;
        }
    }

    static async sendWorkflowOverdue(userId: string, assignment: WorkflowAssignmentNotification): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'workflowReminders');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatWorkflowOverdue(assignment, userName || 'Usuario');
            await wasenderClient.sendMessage(session.sessionId, phone, message);
            return true;
        } catch (error) {
            console.error('[WhatsAppNotificationDispatcher] Error sending overdue:', error);
            return false;
        }
    }

    static async sendWorkflowEscalation(userId: string, assignment: WorkflowAssignmentNotification): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'workflowEscalations');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatWorkflowEscalation(assignment, userName || 'Usuario');
            await wasenderClient.sendMessage(session.sessionId, phone, message);
            return true;
        } catch (error) {
            console.error('[WhatsAppNotificationDispatcher] Error sending escalation:', error);
            return false;
        }
    }

    static async sendWorkflowCompleted(userId: string, instance: WorkflowInstanceNotification): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'workflowCompleted');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatWorkflowCompleted(instance, userName || 'Usuario');
            await wasenderClient.sendMessage(session.sessionId, phone, message);
            return true;
        } catch (error) {
            console.error('[WhatsAppNotificationDispatcher] Error sending completed:', error);
            return false;
        }
    }

    static async sendIncidentDetected(userId: string, incident: IncidentNotification): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'incidents');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatIncidentDetected(incident, userName || 'Usuario');
            await wasenderClient.sendMessage(session.sessionId, phone, message);
            return true;
        } catch (error) {
            console.error('[WhatsAppNotificationDispatcher] Error sending incident:', error);
            return false;
        }
    }

    static async sendIncidentEscalated(userId: string, incident: IncidentNotification): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'incidents');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatIncidentEscalated(incident, userName || 'Usuario');
            await wasenderClient.sendMessage(session.sessionId, phone, message);
            return true;
        } catch (error) {
            console.error('[WhatsAppNotificationDispatcher] Error sending escalation:', error);
            return false;
        }
    }

    static async sendIncidentResolved(userId: string, incident: IncidentNotification): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'incidents');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatIncidentResolved(incident, userName || 'Usuario');
            await wasenderClient.sendMessage(session.sessionId, phone, message);
            return true;
        } catch (error) {
            console.error('[WhatsAppNotificationDispatcher] Error sending resolved:', error);
            return false;
        }
    }

    static async sendLowStockAlert(userId: string, product: InventoryItemNotification): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'inventoryAlerts');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatLowStockAlert(product, userName || 'Usuario');
            await wasenderClient.sendMessage(session.sessionId, phone, message);
            return true;
        } catch (error) {
            console.error('[WhatsAppNotificationDispatcher] Error sending low stock:', error);
            return false;
        }
    }

    static async sendExpirationAlert(userId: string, batch: InventoryBatchNotification): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'inventoryAlerts');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatExpirationAlert(batch, userName || 'Usuario');
            await wasenderClient.sendMessage(session.sessionId, phone, message);
            return true;
        } catch (error) {
            console.error('[WhatsAppNotificationDispatcher] Error sending expiration:', error);
            return false;
        }
    }

    static async sendOrderReceived(userId: string, order: { id: string; items: Array<{ itemId: string; itemName: string; quantity: number }>; receivedAt?: string }): Promise<boolean> {
        try {
            const canSend = await this.checkUserPreferences(userId, 'inventoryNotifications');
            if (!canSend) return false;

            const { phone, session, userName } = await this.getUserPhoneAndSession(userId);
            if (!phone || !session) return false;

            const message = messageFormatter.formatOrderReceived(order, userName || 'Usuario');
            await wasenderClient.sendMessage(session.sessionId, phone, message);
            return true;
        } catch (error) {
            console.error('[WhatsAppNotificationDispatcher] Error sending order received:', error);
            return false;
        }
    }

    private static async getUserPhoneAndSession(userId: string): Promise<{
        phone: string | null;
        session: WhatsAppSessionRow | null;
        userName: string | null;
    }> {
        try {
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            if (!user?.phone || !user?.companyId) {
                return { phone: null, session: null, userName: null };
            }

            const phone = user.phone;
            const userName = user.name;

            const session = await sessionManager.getActiveSession(user.companyId);

            return { phone, session, userName };
        } catch (error) {
            console.error('[WhatsAppNotificationDispatcher] Error getting user phone:', error);
            return { phone: null, session: null, userName: null };
        }
    }

  private static async checkUserPreferences(userId: string, notificationType: string): Promise<boolean> {
    try {
      const prefs = await db.query.notificationPreferences.findFirst({
        where: and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.channel, 'WHATSAPP')
        )
      });

      if (!prefs?.enabled) return false;

      return true;
    } catch {
      return true;
    }
  }
}

// Export singleton instance for use in non-class contexts
export const whatsappNotificationDispatcher = WhatsAppNotificationDispatcher;