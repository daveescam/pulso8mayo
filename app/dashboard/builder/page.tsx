
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

    const templates = await db.select()
        .from(workflowTemplates)
        .where(eq(workflowTemplates.companyId, session.user.companyId || ""))
        .orderBy(desc(workflowTemplates.updatedAt));

    return (
        <div className="container mx-auto py-8">
            <TemplateManager userTemplates={templates} />
        </div>
    );
}
