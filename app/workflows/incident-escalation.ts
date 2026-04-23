
import { sleep } from "workflow";
import { EscalationService } from "@/lib/services/escalation-service";

// Step Wrapper to execute escalation level
export async function executeEscalationLevelStep(incidentId: string, level: any) {
    "use step";
    await EscalationService.executeEscalationLevel(incidentId, level);
}

// Workflow Definition
export async function incidentEscalationWorkflow(incidentId: string, chain: any[]) {
    "use workflow";

    for (const level of chain) {
        // Calculate delay in seconds
        const delayMinutes = level.triggerAfterMinutes || 0;

        // Vercel Workflow sleep takes string like "10s", "1h"
        if (delayMinutes > 0) {
            await sleep(`${delayMinutes}m`);
        }

        await executeEscalationLevelStep(incidentId, level);
    }
}
