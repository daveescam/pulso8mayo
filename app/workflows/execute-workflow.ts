import { sleep } from "workflow";
import {
    loadWorkflowInstance,
    markWorkflowStarted,
    markWorkflowCompleted,
    markWorkflowExpired,
    generateSmartlink,
    sendWhatsAppNotification,
    getWorkflowStatus
} from "@/app/workflows/steps/core";
import { createIncidentStep } from "@/app/workflows/steps/incident";
// import { handleIncidentWorkflow } from "@/app/workflows/handle-incident"; // Deprecated in favor of dynamic chain

// Define timeout logic
const TIMEOUT_MINUTES = 120; // 2 hours
const POLLING_INTERVAL = "1m"; // Check every minute

export async function executeWorkflow(instanceId: string, userId: string) {
    "use workflow";

    // 1. Load Instance
    const instance = await loadWorkflowInstance(instanceId);
    if (!instance) {
        console.error(`Workflow instance ${instanceId} not found`);
        return;
    }

    // 2. Mark Started
    await markWorkflowStarted(instanceId);

    // 3. Generate Link
    const link = await generateSmartlink(instanceId, userId);

    // 4. Send Notification
    await sendWhatsAppNotification(
        userId,
        `📋 Tienes una nueva tarea: *${instance.template.title}*\n\nCompleta tu checklist aquí: ${link}`
    );

    // 5. Wait for Completion (Polling Loop)
    let completed = false;

    for (let i = 0; i < TIMEOUT_MINUTES; i++) {
        // Sleep first to give user time to click
        await sleep(POLLING_INTERVAL);

        // Check status
        const status = await getWorkflowStatus(instanceId);

        if (status === "COMPLETED") {
            completed = true;
            break;
        }

        if (status === "EXPIRED" || status === "CANCELLED") {
            // Externally cancelled
            return;
        }
    }

    // 6. Handle Result
    if (completed) {
        await sendWhatsAppNotification(
            userId,
            `✅ *${instance.template.title}* completado exitosamente. ¡Buen trabajo!`
        );
    } else {
        // Timeout
        await markWorkflowExpired(instanceId);
        await sendWhatsAppNotification(
            userId,
            `⚠️ La tarea *${instance.template.title}* ha expirado por tiempo.`
        );

        // Raise incident for timeout
        const incident = await createIncidentStep({
            instanceId,
            branchId: instance.branchId,
            severity: 'WARNING',
            title: `Checklist Timeout: ${instance.template.title}`,
            description: `Workflow expired after ${TIMEOUT_MINUTES} minutes without completion.`
        });

        // Define default escalation chain for timeouts
        const timeoutEscalationChain = [
            {
                level: 1,
                triggerAfterMinutes: 0, // Immediate
                notifyRoles: ['SUPERVISOR', 'GERENTE'],
                channel: 'whatsapp',
                message: `⚠️ Timeout: Checklist *${instance.template.title}* expired. Action required.`
            },
            {
                level: 2,
                triggerAfterMinutes: 30, // 30 min later
                notifyRoles: ['ADMIN'], // Area Manager/Owner
                channel: 'whatsapp',
                message: `🔥 Escalation: Checklist *${instance.template.title}* still unresolved after timeout.`
            }
        ];

        // Trigger Durable Escalation Workflow
        // We import dynamically or use the imported one if available. 
        // Note: We need to make sure incidentEscalationWorkflow is imported.
        const { start } = await import("workflow/api");
        const { incidentEscalationWorkflow } = await import("@/app/workflows/incident-escalation");

        await start(incidentEscalationWorkflow, [
            incident.id,
            timeoutEscalationChain
        ]);
    }
}
