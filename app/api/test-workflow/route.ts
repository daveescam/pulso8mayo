
import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { incidentEscalationWorkflow } from "@/app/workflows/incident-escalation";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const incidentId = body.incidentId || crypto.randomUUID();
        const chain = body.chain || [{ level: 1, triggerAfterMinutes: 0 }];

        if (!process.env.QSTASH_TOKEN) {
            return NextResponse.json({ error: "QSTASH_TOKEN is missing in server environment." }, { status: 500 });
        }

        // Create a dummy incident for testing
        // We need this so the EscalationService finds it
        const { db } = await import("@/lib/db");
        const { incidents } = await import("@/lib/db/schema");

        await db.insert(incidents).values({
            id: incidentId,
            instanceId: crypto.randomUUID(), // Dummy workflow instance
            stepId: "test-step",
            branchId: crypto.randomUUID(), // Dummy branch
            severity: "WARNING",
            title: "Test Incident for Workflow",
            description: "This is a test incident created by the test-workflow endpoint",
            status: "DETECTED",
            metadata: { source: "test-endpoint" }
        });

        // Trigger the workflow
        // Note: Vercel Workflow start() takes the function and an array of arguments
        const result = await start(incidentEscalationWorkflow, [incidentId, chain]);
        console.log("Workflow Start Result:", result);

        return NextResponse.json({
            success: true,
            message: "Workflow triggered successfully",
            runId: result.runId,
            incidentId
        });
    } catch (error: any) {
        console.error("Workflow Trigger Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || String(error)
        }, { status: 500 });
    }
}
