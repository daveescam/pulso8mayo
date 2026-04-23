import { NextResponse } from "next/server";
import { z } from "zod";
import { WorkflowExecutionService } from "@/lib/services/workflow-execution-service";
import { auth } from "@/lib/auth";

const updateStepSchema = z.object({
    value: z.any().optional(),
    evidenceUrl: z.string().optional(),
    comment: z.string().optional(),
    status: z.enum(['COMPLETED', 'SKIPPED', 'FAILED']).optional(),
});

import { headers } from "next/headers";

// ...

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; stepId: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const data = updateStepSchema.parse(body);
        const { id, stepId } = await params;


        const updatedStep = await WorkflowExecutionService.updateStep(
            id, // Instance ID
            stepId,
            data,
            session.user.id
        );

        return NextResponse.json(updatedStep);
    } catch (error) {
        console.error("Error updating step:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
