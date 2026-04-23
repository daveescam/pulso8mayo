/**
 * WhatsApp Message Formatter
 * 
 * Formats notification messages for WhatsApp with emojis and structure
 */

export interface WorkflowNotification {
    type: 'ASSIGNED' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED';
    workflowName: string;
    assigneeName: string;
    dueDate?: Date;
    smartLink?: string;
}

export interface IncidentNotification {
    type: 'CREATED' | 'ESCALATED' | 'RESOLVED';
    incidentTitle: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    location?: string;
    assignedTo?: string;
}

export interface InventoryNotification {
    type: 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
    productName: string;
    quantity?: number;
    expirationDate?: Date;
    branchName?: string;
}

export class MessageFormatter {
    /**
     * Format workflow notification
     */
    formatWorkflowNotification(notification: WorkflowNotification): string {
        switch (notification.type) {
            case 'ASSIGNED':
                return `📋 *Nueva Tarea Asignada*

Se te ha asignado el workflow: *${notification.workflowName}*

${notification.dueDate ? `📅 Fecha límite: ${this.formatDate(notification.dueDate)}` : ''}

${notification.smartLink ? `Complétalo aquí:\n${notification.smartLink}` : 'Ingresa al sistema para completarlo.'}`;

            case 'DUE_SOON':
                return `⏰ *Recordatorio de Tarea*

El workflow *${notification.workflowName}* vence pronto.

📅 Fecha límite: ${notification.dueDate ? this.formatDate(notification.dueDate) : 'Hoy'}

${notification.smartLink ? `Accede aquí:\n${notification.smartLink}` : 'Ingresa al sistema para completarlo.'}`;

            case 'OVERDUE':
                return `🚨 *Tarea Vencida*

El workflow *${notification.workflowName}* está vencido.

⚠️ Por favor complétalo lo antes posible.

${notification.smartLink ? `Accede aquí:\n${notification.smartLink}` : 'Ingresa al sistema para completarlo.'}`;

            case 'COMPLETED':
                return `✅ *Tarea Completada*

El workflow *${notification.workflowName}* ha sido completado por ${notification.assigneeName}.

¡Excelente trabajo! 👏`;

            default:
                return `📋 Actualización de workflow: ${notification.workflowName}`;
        }
    }

    /**
     * Format incident notification
     */
    formatIncidentNotification(notification: IncidentNotification): string {
        const severityEmoji = {
            LOW: '🟢',
            MEDIUM: '🟡',
            HIGH: '🟠',
            CRITICAL: '🔴',
        };

        switch (notification.type) {
            case 'CREATED':
                return `${severityEmoji[notification.severity]} *Nuevo Incidente*

${notification.incidentTitle}

${notification.location ? `📍 Ubicación: ${notification.location}` : ''}
⚠️ Severidad: ${notification.severity}
${notification.assignedTo ? `👤 Asignado a: ${notification.assignedTo}` : ''}

Por favor atiende este incidente lo antes posible.`;

            case 'ESCALATED':
                return `🚨 *Incidente Escalado*

${notification.incidentTitle}

${notification.location ? `📍 Ubicación: ${notification.location}` : ''}
⚠️ Severidad: ${notification.severity}
${notification.assignedTo ? `👤 Asignado a: ${notification.assignedTo}` : ''}

Este incidente requiere atención inmediata.`;

            case 'RESOLVED':
                return `✅ *Incidente Resuelto*

${notification.incidentTitle}

${notification.location ? `📍 Ubicación: ${notification.location}` : ''}

El incidente ha sido resuelto exitosamente.`;

            default:
                return `⚠️ Actualización de incidente: ${notification.incidentTitle}`;
        }
    }

    /**
     * Format inventory notification
     */
    formatInventoryNotification(notification: InventoryNotification): string {
        switch (notification.type) {
            case 'LOW_STOCK':
                return `📦 *Alerta de Stock Bajo*

Producto: *${notification.productName}*
${notification.branchName ? `🏢 Sucursal: ${notification.branchName}` : ''}
📊 Cantidad actual: ${notification.quantity || 0} unidades

⚠️ El stock está por debajo del mínimo. Por favor genera una orden de compra.`;

            case 'EXPIRING_SOON':
                return `⏰ *Producto Próximo a Caducar*

Producto: *${notification.productName}*
${notification.branchName ? `🏢 Sucursal: ${notification.branchName}` : ''}
📅 Fecha de caducidad: ${notification.expirationDate ? this.formatDate(notification.expirationDate) : 'Pronto'}
📊 Cantidad: ${notification.quantity || 0} unidades

💡 Considera usar este producto pronto o incluirlo en promociones.`;

            case 'EXPIRED':
                return `🚨 *Producto Caducado*

Producto: *${notification.productName}*
${notification.branchName ? `🏢 Sucursal: ${notification.branchName}` : ''}
📅 Caducó: ${notification.expirationDate ? this.formatDate(notification.expirationDate) : 'Recientemente'}
📊 Cantidad: ${notification.quantity || 0} unidades

⚠️ Este producto debe ser retirado inmediatamente del inventario.`;

            default:
                return `📦 Actualización de inventario: ${notification.productName}`;
        }
    }

    /**
     * Format date in Spanish
     */
    private formatDate(date: Date): string {
        return date.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    /**
     * Format time in Spanish
     */
    private formatTime(date: Date): string {
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    }

    /**
     * Format datetime in Spanish
     */
    formatDateTime(date: Date): string {
        return `${this.formatDate(date)} a las ${this.formatTime(date)}`;
    }
}

// Singleton instance
export const messageFormatter = new MessageFormatter();
