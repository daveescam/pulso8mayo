import { OperationsTabs } from "@/components/dashboard/operations/operations-tabs";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { workflowInstances, workflowTemplates, users } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export default async function OperationsPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const recentWorkflows = session?.user?.companyId ? await db.select({
        id: workflowInstances.id,
        templateName: workflowTemplates.name,
        status: workflowInstances.status,
        score: workflowInstances.score,
        assigneeName: users.name,
        updatedAt: workflowInstances.updatedAt
    })
        .from(workflowInstances)
        .leftJoin(workflowTemplates, eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`))
        .leftJoin(users, eq(workflowInstances.assigneeId, users.id))
        .where(eq(workflowTemplates.companyId, session.user.companyId))
        .orderBy(desc(workflowInstances.updatedAt))
        .limit(20) : [];

    return (
        <div className="flex flex-col gap-4 p-8">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Operations Dashboard</h2>
            </div>
            <OperationsTabs recentWorkflows={recentWorkflows} />
        </div>
    );
}
