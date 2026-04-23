import { start } from "workflow/api";
import { NextResponse } from "next/server";

// Import all workflows
import { executeWorkflow } from "@/app/workflows/execute-workflow";
import { handleIncidentWorkflow } from "@/app/workflows/handle-incident";
import { incidentEscalationWorkflow } from "@/app/workflows/incident-escalation";
import { handleClockInWorkflow } from "@/app/workflows/handle-clock-in";
import { handleClockOutWorkflow } from "@/app/workflows/handle-clock-out";
import { handleBreakStartWorkflow } from "@/app/workflows/handle-break-start";
import { handleBreakEndWorkflow } from "@/app/workflows/handle-break-end";

const WORKFLOW_MAP: Record<string, Function> = {
    'executeWorkflow': executeWorkflow,
    'handleIncidentWorkflow': handleIncidentWorkflow,
    'incidentEscalationWorkflow': incidentEscalationWorkflow,
    'handleClockInWorkflow': handleClockInWorkflow,
    'handleClockOutWorkflow': handleClockOutWorkflow,
    'handleBreakStartWorkflow': handleBreakStartWorkflow,
    'handleBreakEndWorkflow': handleBreakEndWorkflow,
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { workflow, args } = body;

        if (!workflow || typeof workflow !== 'string') {
            return NextResponse.json({ error: "Missing or invalid 'workflow' argument" }, { status: 400 });
        }

        const workflowFn = WORKFLOW_MAP[workflow];
        if (!workflowFn) {
            return NextResponse.json({ error: `Workflow '${workflow}' not found` }, { status: 404 });
        }

        const runId = await start(workflowFn, args || []);

        return NextResponse.json({
            success: true,
            runId,
            message: `Started workflow ${workflow}`
        });
    } catch (error) {
        console.error("Error starting workflow:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
