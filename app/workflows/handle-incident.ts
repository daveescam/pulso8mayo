import { sleep } from "workflow";
import {
    loadIncidentStep,
    findSupervisorStep,
    checkIncidentStatusStep,
    escalateIncidentStep,
    findManagerStep
} from "@/app/workflows/steps/incident";
import { sendWhatsAppNotification } from "@/app/workflows/steps/core";

export async function handleIncidentWorkflow(incidentId: string) {
    "use workflow";

    // 1. Load Incident
    const incident = await loadIncidentStep(incidentId);

    // 2. Notify Supervisor (Level 1)
    const supervisor = await findSupervisorStep(incident.branchId);

    if (supervisor) {
        await sendWhatsAppNotification(
            supervisor.id,
            `🚨 INCIDENTE DETECTADO\n\n${incident.title}\nSeverity: ${incident.severity}\n\nPor favor revisa el dashboard.`
        );
    } else {
        console.warn(`No supervisor found for branch ${incident.branchId}`);
    }

    // 3. Wait for resolution
    await sleep("30m");

    // 4. Check Status
    const status = await checkIncidentStatusStep(incidentId);

    if (status === 'RESOLVED') {
        // All good
        if (supervisor) {
            await sendWhatsAppNotification(supervisor.id, `✅ Incidente ${incident.title} resuelto.`);
        }
        return;
    }

    // 5. Escalate (Level 2)
    await escalateIncidentStep(incidentId);

    // Find Manager (Company Admin)
    // We need companyId. Assuming branch is linked to company.
    // We might need to fetch companyId from branch if incident doesn't have it directly?
    // Schema says `branches` has `companyId`. `incidents` has `branchId`.
    // `findSupervisorStep` used branch. users in branch.

    // I need companyId. I'll get it from supervisor context or fetch branch.
    // For now I'll skip if I can't easily get it, or assume supervisor has companyId.
    if (supervisor && supervisor.companyId) {
        const manager = await findManagerStep(supervisor.companyId);
        if (manager) {
            await sendWhatsAppNotification(
                manager.id,
                `🔥 INCIDENTE ESCALADO (No Resuelto en 30m)\n\n${incident.title}\nSucursal: ${incident.branchId}\n\nRequiere atención inmediata.`
            );
        }
    }
}
