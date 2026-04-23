
import { NextResponse } from "next/server";
import { SmartLinkService } from "@/lib/services/smart-link-service";
import { WorkflowExecutionService } from "@/lib/services/workflow-execution-service";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        // 1. Validate Token
        const context = await SmartLinkService.validateSmartLink(token);

        if (!context || !context.link) {
            return new NextResponse("Invalid or expired link", { status: 404 });
        }

        // 2. Fetch Execution Data
        // uses the instanceId associated with the token
        const execution = await WorkflowExecutionService.getExecution(context.link.instanceId);

        if (!execution) {
            return new NextResponse("Execution not found", { status: 404 });
        }

        return NextResponse.json(execution);
    } catch (error) {
        console.error("Error fetching execution via smart link:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
