/**
 * Shift Workflow Service
 *
 * Handles the association between shifts and workflows.
 * This service manages the relationship between planned shifts and their corresponding workflow templates.
 */

import { db } from "@/lib/db";
import { plannedShifts, shiftTemplates, workflowTemplates, shiftSessions } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface ShiftWorkflowContext {
    plannedShift: typeof plannedShifts.$inferSelect;
    workflowTemplate: typeof workflowTemplates.$inferSelect | null;
    shiftTemplate?: typeof shiftTemplates.$inferSelect | null;
}

export class ShiftWorkflowService {
    /**
     * Get the shift and associated workflow for a user on a specific date
     */
    static async getShiftWorkflowForUser(
        userId: string,
        branchId: string,
        date: Date = new Date()
    ): Promise<ShiftWorkflowContext | null> {
        const dateStr = date.toISOString().split("T")[0]; // "2026-03-20"

        // Find the planned shift for this user on this date
        const plannedShift = await db.query.plannedShifts.findFirst({
            where: and(
                eq(plannedShifts.userId, userId),
                eq(plannedShifts.branchId, branchId),
                eq(plannedShifts.shiftDate, dateStr),
                eq(plannedShifts.status, "PUBLISHED")
            ),
            with: {
                // Optionally include the shift template if needed
            }
        });

        if (!plannedShift) {
            return null;
        }

        // Get the associated workflow template if exists
        let workflowTemplate: typeof workflowTemplates.$inferSelect | null = null;

        if (plannedShift.workflowTemplateId) {
            workflowTemplate = await db.query.workflowTemplates.findFirst({
                where: and(
                    eq(workflowTemplates.id, plannedShift.workflowTemplateId),
                    eq(workflowTemplates.active, true)
                )
            });
        }

        return {
            plannedShift,
            workflowTemplate,
        };
    }

    /**
     * Get today's shift and workflow for a user
     */
    static async getTodayShiftWorkflow(userId: string, branchId: string): Promise<ShiftWorkflowContext | null> {
        return this.getShiftWorkflowForUser(userId, branchId, new Date());
    }

    /**
     * Create a shift session from a planned shift
     */
    static async createShiftSessionFromPlannedShift(
        plannedShiftId: string,
        userId: string,
        branchId: string
    ): Promise<typeof shiftSessions.$inferSelect | null> {
        const plannedShift = await db.query.plannedShifts.findFirst({
            where: eq(plannedShifts.id, plannedShiftId)
        });

        if (!plannedShift) {
            return null;
        }

        // Check if session already exists
        const existingSession = await db.query.shiftSessions.findFirst({
            where: and(
                eq(shiftSessions.plannedShiftId, plannedShiftId),
                eq(shiftSessions.userId, userId)
            )
        });

        if (existingSession) {
            return existingSession;
        }

        // Create new session
        const [session] = await db.insert(shiftSessions).values({
            plannedShiftId,
            userId,
            branchId,
            status: "ACTIVE",
            scheduledStartTime: plannedShift.startTime,
            scheduledEndTime: plannedShift.endTime,
            startedAt: new Date(),
        }).returning();

        return session;
    }

    /**
     * Get active session for a user
     */
    static async getActiveSession(userId: string): Promise<typeof shiftSessions.$inferSelect | null> {
        return await db.query.shiftSessions.findFirst({
            where: and(
                eq(shiftSessions.userId, userId),
                eq(shiftSessions.status, "ACTIVE")
            )
        });
    }

    /**
     * Get planned shift by ID
     */
    static async getPlannedShift(plannedShiftId: string): Promise<typeof plannedShifts.$inferSelect | null> {
        return await db.query.plannedShifts.findFirst({
            where: eq(plannedShifts.id, plannedShiftId)
        });
    }

    /**
     * Get workflow template by ID
     */
    static async getWorkflowTemplate(templateId: string): Promise<typeof workflowTemplates.$inferSelect | null> {
        return await db.query.workflowTemplates.findFirst({
            where: and(
                eq(workflowTemplates.id, templateId),
                eq(workflowTemplates.active, true)
            )
        });
    }
}
