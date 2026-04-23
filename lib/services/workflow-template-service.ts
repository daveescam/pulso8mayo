import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ApiError } from "@/lib/api/error";

export class WorkflowTemplateService {
    static async createTemplate(data: any, tenantId: string) { // Typing 'data' loosely for now, should use Zod
        // Check if user has permission or company match
        // Insert
        const newTemplate = await db.insert(workflowTemplates).values({
            id: crypto.randomUUID(),
            name: data.title || data.name || "Untitled Workflow",
            description: data.description,
            steps: data.steps, // JSONB
            companyId: tenantId,
            category: data.category || "OPERATIONAL",
            active: true
        }).returning();

        return newTemplate[0];
    }

    static async listTemplates(tenantId: string) {
        if (!tenantId) return [];

        return await db.query.workflowTemplates.findMany({
            where: eq(workflowTemplates.companyId, tenantId),
            orderBy: desc(workflowTemplates.updatedAt)
        });
    }

    static async getTemplate(id: string) {
        const template = await db.query.workflowTemplates.findFirst({
            where: eq(workflowTemplates.id, id)
        });
        if (!template) throw ApiError.notFound("Template not found");
        return template;
    }

    static async findBestMatchForContext(branchId: string, userId: string): Promise<any | null> {
        // Logic to find the "Apertura" or "Cierre" based on time
        // This is a naive implementation for the MVP
        const hour = new Date().getHours();
        let keyword = "Apertura";
        if (hour >= 18) keyword = "Cierre";

        // Find a template that matches the keyword for the branch's company
        // For MVP, we assume permissions are handled elsewhere or we just find ANY template matching

        // Use 'ilike' (case insensitive) if available, or just findMany and filter in JS
        const allTemplates = await db.query.workflowTemplates.findMany({
            where: eq(workflowTemplates.active, true)
        });

        const match = allTemplates.find(t => t.name.includes(keyword));
        return match || null;
    }
}
