import { NextResponse } from "next/server";
import { z } from "zod";
import { WorkflowExecutionService } from "@/lib/services/workflow-execution-service";
import { auth } from "@/lib/auth";

const startExecutionSchema = z.object({
    templateId: z.string(),
    branchId: z.string(),
    sessionId: z.string().optional(),
});

import { headers } from "next/headers";

// ...

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { templateId, branchId, sessionId } = startExecutionSchema.parse(body);

        // TODO: Check permissions (user belongs to branch/company)

        const execution = await WorkflowExecutionService.createExecution(
            templateId,
            branchId,
            session.user.id,
            sessionId || null
        );

        return NextResponse.json(execution);
    } catch (error) {
        console.error("Error starting execution:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
