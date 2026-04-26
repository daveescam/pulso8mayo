
import { TemplateManager } from "./templates/template-manager"
import { db } from "@/lib/db"; // Assuming direct DB access for server component, or fetch via API if client
import { workflowTemplates } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function BuilderPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

const rawTemplates = await db.select({
    id: workflowTemplates.id,
    name: workflowTemplates.name,
    description: workflowTemplates.description,
    category: workflowTemplates.category,
    steps: workflowTemplates.steps,
  })
  .from(workflowTemplates)
  .where(eq(workflowTemplates.companyId, session.user.companyId || ""))
  .orderBy(desc(workflowTemplates.updatedAt));

  const templates = rawTemplates as unknown as Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    steps?: Array<{ id: string; type: string; title: string; required?: boolean; options?: string[] }>;
    createdAt?: Date;
  }>;

    return (
        <div className="container mx-auto py-8">
            <TemplateManager userTemplates={templates} />
        </div>
    );
}
