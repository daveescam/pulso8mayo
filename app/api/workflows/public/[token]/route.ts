
import { NextRequest, NextResponse } from "next/server";
import { SmartLinkService } from "@/lib/services/smart-link-service";
import { WorkflowExecutionService } from "@/lib/services/workflow-execution-service";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ token: string }> } // Correct type for Next.js 15+ dynamic params
) {
    try {
        const { token } = await context.params;

        if (!token) {
            return new NextResponse("Token required", { status: 400 });
        }

        const linkData = await SmartLinkService.validateSmartLink(token);

        if (!linkData) {
            return new NextResponse("Invalid or expired token", { status: 404 });
        }

        const execution = await WorkflowExecutionService.getExecution(linkData.instance.id);

        if (!execution) {
            return new NextResponse("Execution not found", { status: 404 });
        }

        return NextResponse.json({
            execution,
            link: {
                expiresAt: linkData.link.expiresAt,
                sessionId: linkData.link.sessionId
            }
        });

    } catch (error) {
        console.error("Error fetching public workflow:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
