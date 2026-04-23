
import { NextRequest, NextResponse } from "next/server";
import { SmartLinkService } from "@/lib/services/smart-link-service";
import { WorkflowExecutionService } from "@/lib/services/workflow-execution-service";
import { z } from "zod";

const updateStepSchema = z.object({
    stepId: z.string(),
    value: z.any().optional(),
    evidenceUrl: z.string().optional(), // Can contain single URL or JSON stringified array
    comment: z.string().optional(),
    status: z.enum(['COMPLETED', 'SKIPPED', 'FAILED']),
});

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;

        if (!token) {
            return new NextResponse("Token required", { status: 400 });
        }

        // 1. Validate Token
        const linkData = await SmartLinkService.validateSmartLink(token);
        if (!linkData) {
            return new NextResponse("Invalid or expired token", { status: 404 });
        }

        const body = await req.json();
        const { stepId, value, evidenceUrl, comment, status } = updateStepSchema.parse(body);

        // 2. Update Step
        // We use the 'sessionId' or a placeholder as the userId since this is a public link execution
        const performedBy = linkData.link.sessionId || "public-link-user";

        const result = await WorkflowExecutionService.updateStep(
            linkData.instance.id,
            stepId,
            { value, evidenceUrl, comment, status },
            performedBy
        );

        // 3. Check if workflow is complete to mark link as used? 
        // Logic: If status is COMPLETED, maybe we don't mark link used yet? 
        // Usually we keep link valid until expiry or explicit completion.

        return NextResponse.json(result);

    } catch (error) {
        console.error("Error updating public workflow step:", error);
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid input", { status: 400 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
