import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"

import { ComplianceMetrics } from "@/components/dashboard/compliance-metrics"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { workflowInstances, workflowTemplates, users, employeeCommunications } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { RecentWorkflowsTable } from "@/components/dashboard/recent-workflows-table";
import { ComplianceReportGenerator } from "@/components/compliance/report-generator";


export default async function Page() {
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
    .limit(10) : [];

  // Transform data to match component expectations
  const formattedWorkflows = recentWorkflows.map(workflow => ({
    ...workflow,
    templateName: workflow.templateName || "Sin nombre",
    assigneeName: workflow.assigneeName || "Sin asignar"
  }));

  const pinnedAnnouncements = session?.user?.companyId ? await db.select({
    id: employeeCommunications.id,
    title: employeeCommunications.title,
    content: employeeCommunications.content,
    communicationType: employeeCommunications.communicationType,
    createdAt: employeeCommunications.createdAt,
  })
    .from(employeeCommunications)
    .where(and(
      eq(employeeCommunications.companyId, session.user.companyId),
      eq(employeeCommunications.isPinned, true)
    ))
    .orderBy(desc(employeeCommunications.createdAt))
    .limit(3) : [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between px-4 lg:px-6 py-2">
            <h2 className="text-xl font-semibold">Resumen del Dashboard</h2>
            <ComplianceReportGenerator />
          </div>

          {pinnedAnnouncements.length > 0 && (
            <div className="px-4 lg:px-6 mb-2">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pinnedAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="bg-primary/10 border border-primary/20 rounded-lg p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-primary/40"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary-foreground">
                        {announcement.communicationType === 'ANNOUNCEMENT' ? 'Anuncio' : announcement.communicationType === 'NOTIFICATION' ? 'Notificación' : 'Mensaje'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base mb-1">{announcement.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <ComplianceMetrics />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <div className="px-4 lg:px-6">
              <h3 className="text-lg font-medium mb-4">Actividad Reciente</h3>
              <RecentWorkflowsTable workflows={formattedWorkflows} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
