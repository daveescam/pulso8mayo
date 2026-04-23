import { db } from "@/lib/db";
import { incidents, users, branches } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { sendWhatsAppNotification } from "@/app/workflows/steps/core";

/**
 * Loads incident details.
 */
export async function loadIncidentStep(incidentId: string) {
    "use step";

    const incident = await db.query.incidents.findFirst({
        where: eq(incidents.id, incidentId),
        with: {
            // We might want branch info
        }
    });

    if (!incident) throw new Error(`Incident ${incidentId} not found`);
    return incident;
}

/**
 * Finds the supervisor for the branch.
 */
export async function findSupervisorStep(branchId: string) {
    "use step";

    // Find a user with role 'SUPERVISOR' or 'GERENTE' linked to this branch
    // For simplicity, pick the first one.
    const supervisor = await db.query.users.findFirst({
        where: and(
            eq(users.branchId, branchId),
            or(eq(users.role, 'SUPERVISOR'), eq(users.role, 'GERENTE'))
        )
    });

    return supervisor; // might be undefined
}

/**
 * Finds the Area Manager or Admin (Escalation Level 2).
 */
export async function findManagerStep(companyId: string) {
    "use step";

    // Find ADMIN or GERENTE at company level (branchId might be null)
    const manager = await db.query.users.findFirst({
        where: and(
            eq(users.companyId, companyId),
            eq(users.role, 'ADMIN')
        )
    });

    return manager;
}

/**
 * Updates incident status to ESCALATED.
 */
export async function escalateIncidentStep(incidentId: string) {
    "use step";

    await db.update(incidents)
        .set({ status: 'ESCALATED', updatedAt: new Date() })
        .where(eq(incidents.id, incidentId));

    return { escalated: true };
}

/**
 * Checks if incident is resolved.
 */
export async function checkIncidentStatusStep(incidentId: string) {
    "use step";

    const incident = await db.query.incidents.findFirst({
        where: eq(incidents.id, incidentId),
        columns: { status: true }
    });

    return incident?.status; // 'RESOLVED', 'ESCALATED', 'DETECTED'
}

/**
 * Creates a new incident in the database.
 */
export async function createIncidentStep(input: {
    instanceId: string;
    branchId: string;
    severity: 'CRITICAL' | 'WARNING' | 'FATAL';
    title: string;
    description: string;
}) {
    "use step";

    const [incident] = await db.insert(incidents).values({
        instanceId: input.instanceId,
        stepId: 'general_timeout', // General timeout doesn't have a specific step ID
        branchId: input.branchId,
        severity: input.severity,
        title: input.title,
        description: input.description,
        status: 'DETECTED',
    }).returning();

    return incident;
}

// Re-export core notification for convenience if needed,
// or strictly import from core in the workflow.
