// Minimal notification dispatcher for MVP
// This is a placeholder to fix build errors - full implementation pending

export type NotificationEventType = 
    | 'WORKFLOW_ASSIGNMENT'
    | 'WORKFLOW_DUE_SOON'
    | 'WORKFLOW_OVERDUE'
    | 'INCIDENT'
    | 'KPI_ALERT'
    | 'INVENTORY_LOW'
    | 'SHIFT_START'
    | 'SHIFT_END';

export type NotificationChannel = 'WHATSAPP' | 'EMAIL' | 'IN_APP';

export interface NotificationPayload {
    userId: string;
    eventType: NotificationEventType;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
}

export class NotificationDispatcher {
    async send(payload: NotificationPayload, channels: NotificationChannel[]): Promise<void> {
        // Placeholder implementation
        console.log('Notification:', payload);
    }
}
