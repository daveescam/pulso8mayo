import { db } from "@/lib/db";
import { workflowInstances, users, whatsappSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sign } from "jsonwebtoken";
import { WasenderClient } from "@/lib/whatsapp/wasender-client";

// Ensure we have a valid JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "default_dev_secret";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Loads a workflow instance from the database with its template.
 */
export async function loadWorkflowInstance(instanceId: string) {
    "use step";

    const instance = await db.query.workflowInstances.findFirst({
        where: eq(workflowInstances.id, instanceId),
        with: {
            template: true,
        },
    });

    if (!instance) {
        throw new Error(`Workflow instance not found: ${instanceId}`);
    }

    return instance;
}

/**
 * Marks a workflow instance as IN_PROGRESS.
 */
export async function markWorkflowStarted(instanceId: string) {
    "use step";

    await db.update(workflowInstances)
        .set({
            status: "IN_PROGRESS",
            startedAt: new Date(),
        })
        .where(eq(workflowInstances.id, instanceId));

    return { success: true };
}

/**
 * Marks a workflow instance as COMPLETED.
 */
export async function markWorkflowCompleted(instanceId: string) {
    "use step";

    await db.update(workflowInstances)
        .set({
            status: "COMPLETED",
            completedAt: new Date(),
        })
        .where(eq(workflowInstances.id, instanceId));

    return { success: true };
}

/**
 * Marks a workflow instance as EXPIRED (e.g. timeout).
 */
export async function markWorkflowExpired(instanceId: string) {
    "use step";

    await db.update(workflowInstances)
        .set({
            status: "EXPIRED",
        })
        .where(eq(workflowInstances.id, instanceId));

    return { success: true };
}

/**
 * Generates a Smartlink (JWT signed URL) for the user to access the workflow.
 */
export async function generateSmartlink(instanceId: string, userId: string) {
    "use step";

    const token = sign(
        { instanceId, userId, type: "workflow" },
        JWT_SECRET,
        { expiresIn: "4h" } // Matches the typical max duration of a shift/task
    );

    return `${APP_URL}/w/${token}`;
}

/**
 * Checks the current status of a workflow instance.
 */
export async function getWorkflowStatus(instanceId: string) {
    "use step";

    const instance = await db.query.workflowInstances.findFirst({
        where: eq(workflowInstances.id, instanceId),
        columns: { status: true },
    });

    return instance?.status || "UNKNOWN";
}

/**
 * Sends a WhatsApp notification to the user.
 * Wraps the WasenderClient to be used as a workflow step.
 */
export async function sendWhatsAppNotification(userId: string, message: string) {
    "use step";

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user || !user.whatsappPhone) {
        console.warn(`User ${userId} has no WhatsApp phone number. Skipping notification.`);
        return { sent: false, reason: "no_phone" };
    }

    // We need a session ID to send messages. 
    // Ideally, we get this from the user's company or a default system session.
    // For now, we'll try to find an active session for the company.
    // If user has no company (e.g. system admin), this might fail without a default.

    if (!user.companyId) {
        console.warn(`User ${userId} not linked to a company. Skipping notification.`);
        return { sent: false, reason: "no_company" };
    }

    const session = await db.query.whatsappSessions.findFirst({
        where: eq(whatsappSessions.companyId, user.companyId),
    });

    if (!session || !session.sessionId) {
        console.warn(`No active WhatsApp session found for company ${user.companyId}.`);
        return { sent: false, reason: "no_session" };
    }

    try {
        const client = new WasenderClient();
        await client.sendMessage({
            sessionId: session.sessionId,
            phone: user.whatsappPhone,
            message: message
        });
        return { sent: true };
    } catch (error) {
        console.error("Failed to send WhatsApp message via workflow step:", error);
        // We don't throw here to avoid crashing the workflow loop, 
        // unless we want it to retry. 
        // For notifications, usually "fire and forget" or "log error" is safer 
        // than infinite retries if the API is down.
        // However, Workflow DevKit retries on error. Let's return error status instead.
        return { sent: false, error: String(error) };
    }
}
