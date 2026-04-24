import { NextResponse } from "next/server";
import { WorkflowExecutionService } from "@/lib/services/workflow-execution-service";
import { auth } from "@/lib/auth";

import { headers } from "next/headers";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const executionId = (await params).id;

        const execution = await WorkflowExecutionService.getExecution(executionId);

        if (!execution) {
            return new NextResponse("Execution not found", { status: 404 });
        }

        return NextResponse.json(execution);
    } catch (error) {
        console.error("Error fetching execution:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
