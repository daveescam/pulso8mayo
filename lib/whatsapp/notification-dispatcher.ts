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
import { NotificationDispatcher, NotificationPayload } from '@/lib/services/notification-dispatcher';

import { SessionInfo } from './session-manager';

export type WhatsAppSessionRow = SessionInfo;

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
      await wasenderClient.sendMessage({ sessionId: session.sessionId, to: phone, message });
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
      await wasenderClient.sendMessage({ sessionId: session.sessionId, to: phone, message });
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
      await wasenderClient.sendMessage({ sessionId: session.sessionId, to: phone, message });
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
      await wasenderClient.sendMessage({ sessionId: session.sessionId, to: phone, message });
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
      await wasenderClient.sendMessage({ sessionId: session.sessionId, to: phone, message });
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
      await wasenderClient.sendMessage({ sessionId: session.sessionId, to: phone, message });
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
      await wasenderClient.sendMessage({ sessionId: session.sessionId, to: phone, message });
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
      await wasenderClient.sendMessage({ sessionId: session.sessionId, to: phone, message });
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
      await wasenderClient.sendMessage({ sessionId: session.sessionId, to: phone, message });
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
      await wasenderClient.sendMessage({ sessionId: session.sessionId, to: phone, message });
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
      await wasenderClient.sendMessage({ sessionId: session.sessionId, to: phone, message });
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
        where: eq(notificationPreferences.userId, userId)
      });

      if (!prefs) return true; // Default to allowing if no preferences set

      // Check if WhatsApp is enabled
      if (!prefs.whatsappEnabled) return false;

      // Check specific notification type preference
      switch (notificationType) {
        case 'workflowAssignments':
          return prefs.workflowAssignments;
        case 'workflowReminders':
          return prefs.workflowDueSoon;
        case 'workflowEscalations':
          return prefs.workflowOverdue;
        case 'incidents':
          return prefs.incidents;
        case 'inventoryAlerts':
        case 'inventoryNotifications':
          return prefs.inventoryAlerts;
        case 'workflowCompleted':
          return prefs.workflowAssignments;
        default:
          return true;
      }
    } catch {
      return true;
    }
  }

  /**
   * Unified notification method - sends WhatsApp notification via the dispatcher
   * This method wraps the WhatsApp-specific dispatching and integrates with
   * the generic NotificationDispatcher
   */
  static async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      switch (payload.eventType) {
      case 'workflow_assignment':
        return await this.sendWorkflowAssignment(payload.userId, {
          id: payload.metadata?.assignmentId as string | undefined || payload.userId,
          workflowName: (payload.metadata?.workflowName as string) || 'Tarea',
          dueDate: payload.metadata?.dueDate as string | undefined,
          priority: payload.metadata?.priority as string | undefined,
        });

      case 'workflow_due_soon':
        return await this.sendWorkflowDueSoon(payload.userId, {
          id: payload.metadata?.assignmentId as string | undefined || payload.userId,
          workflowName: (payload.metadata?.workflowName as string) || 'Tarea',
          dueDate: payload.metadata?.dueDate as string | undefined,
          priority: payload.metadata?.priority as string | undefined,
        });

      case 'workflow_overdue':
        return await this.sendWorkflowOverdue(payload.userId, {
          id: payload.metadata?.assignmentId as string | undefined || payload.userId,
          workflowName: (payload.metadata?.workflowName as string) || 'Tarea',
          dueDate: payload.metadata?.dueDate as string | undefined,
          priority: payload.metadata?.priority as string | undefined,
        });

      case 'incident':
        return await this.sendIncidentDetected(payload.userId, {
          id: payload.metadata?.incidentId as string | undefined || payload.userId,
          title: (payload.metadata?.incidentTitle as string) || 'Incidente',
          severity: (payload.metadata?.severity as string) || 'WARNING',
          description: payload.metadata?.description as string | undefined,
        });

      case 'stock_alert':
        return await this.sendLowStockAlert(payload.userId, {
          id: payload.metadata?.itemId as string | undefined || payload.userId,
          name: (payload.metadata?.itemName as string) || 'Producto',
          sku: (payload.metadata?.sku as string) || '',
          currentStock: payload.metadata?.currentStock as number | undefined,
          minStock: payload.metadata?.minLevel as number | undefined,
        });

        default:
          console.log(`[WhatsAppNotificationDispatcher] No handler for event type: ${payload.eventType}`);
          return false;
      }
    } catch (error) {
      console.error('[WhatsAppNotificationDispatcher] Error in sendNotification:', error);
      return false;
    }
  }
}

// Export singleton instance for use in non-class contexts
export const whatsappNotificationDispatcher = WhatsAppNotificationDispatcher;