import { db } from '@/lib/db';
import { eventTriggers, workflowInstances } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface CreateTriggerInput {
    templateId: string;
    branchId: string;
    eventName: string;
    conditions: Record<string, any>;
    createdBy: string;
}

export class WorkflowTriggerService {
    /**
     * Create a new event trigger
     */
    static async createTrigger(data: CreateTriggerInput) {
        const [trigger] = await db.insert(eventTriggers).values({
            templateId: data.templateId,
            branchId: data.branchId,
            eventName: data.eventName,
            conditions: data.conditions,
            createdBy: data.createdBy,
        }).returning();

        return trigger;
    }

    /**
     * Get active triggers for a branch and event
     */
    static async getActiveTriggers(branchId: string, eventName: string) {
        return await db.select()
            .from(eventTriggers)
            .where(and(
                eq(eventTriggers.branchId, branchId),
                eq(eventTriggers.eventName, eventName),
                eq(eventTriggers.isActive, true)
            ));
    }

    /**
     * Evaluate conditions against event payload
     * Simple subset match: all keys in condition must match payload values
     */
    static evaluateConditions(conditions: any, payload: any): boolean {
        if (!conditions || Object.keys(conditions).length === 0) return true;

        for (const key in conditions) {
            // Check for simple equality
            if (payload[key] !== conditions[key]) {
                // Could add complex logic here (operators like >, <), but for now strict equality
                return false;
            }
        }
        return true;
    }

    /**
     * Handle an incoming system event
     * Checks triggers and launches workflows if conditions match
     */
    static async handleEvent(branchId: string, eventName: string, payload: any) {
        const triggers = await this.getActiveTriggers(branchId, eventName);
        const initiatedWorkflows = [];

        for (const trigger of triggers) {
            if (this.evaluateConditions(trigger.conditions, payload)) {
                // Launch Workflow
                console.log(`[TriggerService] Event ${eventName} matched trigger ${trigger.id}. Launching template ${trigger.templateId}`);

                const [instance] = await db.insert(workflowInstances).values({
                    workflowTemplateId: trigger.templateId,
                    branchId: trigger.branchId,
                    status: 'PENDING',
                    priority: 'HIGH', // Triggered events are usually important
                    dueDate: new Date(), // Due immediately?
                    data: {
                        triggerEvent: eventName,
                        triggerPayload: payload
                    }
                }).returning();

                initiatedWorkflows.push(instance);
            }
        }

        return initiatedWorkflows;
    }


    /**
     * Get all triggers for a specific template
     */
    static async getTriggersForTemplate(templateId: string, branchId: string) {
        return await db.select()
            .from(eventTriggers)
            .where(and(
                eq(eventTriggers.templateId, templateId),
                eq(eventTriggers.branchId, branchId),
                eq(eventTriggers.isActive, true)
            ));
    }

    /**
     * Sync triggers for a template (Replace all)
     */
    static async syncTriggers(
        templateId: string,
        branchId: string,
        triggers: { eventName: string; conditions: any }[],
        userId: string
    ) {
        // 1. Deactivate/Delete existing triggers for this template
        // We use delete for simplicity in this MVP config sync
        await db.delete(eventTriggers)
            .where(and(
                eq(eventTriggers.templateId, templateId),
                eq(eventTriggers.branchId, branchId)
            ));

        if (triggers.length === 0) return [];

        // 2. Insert new triggers
        const newTriggers = triggers.map(t => ({
            templateId,
            branchId,
            eventName: t.eventName,
            conditions: t.conditions,
            createdBy: userId,
            isActive: true
        }));

        return await db.insert(eventTriggers).values(newTriggers).returning();
    }
}
