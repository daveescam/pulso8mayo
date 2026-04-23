import { NextRequest } from "next/server";
import { WorkflowTemplateService } from "@/lib/services/workflow-template-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";

export async function POST(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const body = await req.json();

        // Basic validation here or in service
        if (!body.steps || !Array.isArray(body.steps)) {
            throw new Error("Invalid steps format");
        }

        const template = await WorkflowTemplateService.createTemplate(body, tenant.id);
        return ApiHandler.success(template, 201);
    } catch (error) {
        return ApiHandler.error(error);
    }
}

export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const templates = await WorkflowTemplateService.listTemplates(tenant.id);
        return ApiHandler.success(templates);
    } catch (error) {
        return ApiHandler.error(error);
    }
}
