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

  // Methods for notification-dispatcher.ts compatibility
  formatWorkflowAssignment(assignment: { workflowName: string; dueDate?: string }, userName: string): string {
    return `📋 *Nueva Tarea Asignada*\n\nHola ${userName},\n\nSe te ha asignado: *${assignment.workflowName}*${assignment.dueDate ? `\n📅 Fecha límite: ${assignment.dueDate}` : ''}\n\nPor favor, revisa tu dashboard.`;
  }

  formatWorkflowDueSoon(assignment: { workflowName: string; dueDate?: string }, userName: string): string {
    return `⏰ *Recordatorio: Tarea Por Vencer*\n\nHola ${userName},\n\nTu tarea "${assignment.workflowName}" vence pronto.${assignment.dueDate ? `\n📅 Fecha límite: ${assignment.dueDate}` : ''}\n\n¡No la olvides!`;
  }

  formatWorkflowOverdue(assignment: { workflowName: string; dueDate?: string }, userName: string): string {
    return `🚨 *TAREA VENCIDA*\n\nHola ${userName},\n\nLa tarea "${assignment.workflowName}" está VENCIDA.${assignment.dueDate ? `\n📅 Fecha límite: ${assignment.dueDate}` : ''}\n\nPor favor, complétala lo antes posible.`;
  }

  formatWorkflowEscalation(assignment: { workflowName: string }, userName: string): string {
    return `🚨 *Escalación de Tarea*\n\nHola ${userName},\n\nLa tarea "${assignment.workflowName}" requiere atención inmediata.`;
  }

  formatWorkflowCompleted(instance: { workflowName: string; completedAt?: string }, userName: string): string {
    return `✅ *Tarea Completada*\n\nHola ${userName},\n\nLa tarea "${instance.workflowName}" ha sido completada.${instance.completedAt ? `\n📅 Fecha: ${instance.completedAt}` : ''}`;
  }

  formatIncidentDetected(incident: { title: string; severity: string }, userName: string): string {
    const severityEmoji = incident.severity === 'CRITICAL' ? '🔴' : incident.severity === 'HIGH' ? '🟠' : '🟡';
    return `${severityEmoji} *Nuevo Incidente*\n\nHola ${userName},\n\n*${incident.title}*\n\nSeveridad: ${incident.severity}\n\nSe requiere acción inmediata.`;
  }

  formatIncidentEscalated(incident: { title: string; severity: string }, userName: string): string {
    return `🚨 *Incidente Escalado*\n\nHola ${userName},\n\n*${incident.title}*\n\nSeveridad: ${incident.severity}\n\nEste incidente requiere atención inmediata.`;
  }

  formatIncidentResolved(incident: { title: string }, userName: string): string {
    return `✅ *Incidente Resuelto*\n\nHola ${userName},\n\n*${incident.title}*\n\nEl incidente ha sido resuelto exitosamente.`;
  }

  formatLowStockAlert(product: { name: string; currentStock?: number; minStock?: number }, userName: string): string {
    return `📦 *Alerta de Stock Bajo*\n\nHola ${userName},\n\nProducto: *${product.name}*\n📊 Cantidad actual: ${product.currentStock || 0} unidades\n📈 Mínimo: ${product.minStock || 0} unidades\n\n⚠️ El stock está por debajo del mínimo.`;
  }

  formatExpirationAlert(batch: { itemName: string; expirationDate: string; quantity?: number }, userName: string): string {
    return `⏰ *Producto Próximo a Caducar*\n\nHola ${userName},\n\nProducto: *${batch.itemName}*\n📅 Fecha de caducidad: ${batch.expirationDate}${batch.quantity ? `\n📊 Cantidad: ${batch.quantity} unidades` : ''}\n\n💡 Considera usar este producto pronto.`;
  }

  formatOrderReceived(order: { id: string; items: Array<{ itemName: string; quantity: number }>; receivedAt?: string }, userName: string): string {
    const itemsList = order.items.map(item => `• ${item.itemName}: ${item.quantity}`).join('\n');
    return `📦 *Orden Recibida*\n\nHola ${userName},\n\nOrden #${order.id}${order.receivedAt ? `\n📅 Fecha: ${order.receivedAt}` : ''}\n\nItems:\n${itemsList}`;
  }
}

// Singleton instance
export const messageFormatter = new MessageFormatter();
