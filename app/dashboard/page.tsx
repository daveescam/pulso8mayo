import { ComplianceMetrics } from "@/components/dashboard/compliance-metrics"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { workflowInstances, workflowTemplates, users, employeeCommunications } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { RecentWorkflowsTable } from "@/components/dashboard/recent-workflows-table";
import { ComplianceReportGenerator } from "@/components/compliance/report-generator";
import { getTranslations } from "next-intl/server";
import { KpiSummaryCards } from "@/components/dashboard/kpi-summary-cards"
import { ExecutiveSummary } from "@/components/dashboard/executive-summary"

export default async function Page({ searchParams }: { searchParams: Promise<{ branch?: string; startDate?: string; endDate?: string }> }) {
  const params = await searchParams;
  const selectedBranch = params.branch;
  const startDate = params.startDate;
  const endDate = params.endDate;

  const t = await getTranslations("dashboard.executive");
  const session = await auth.api.getSession({
    headers: await headers()
  });

  const workflowConditions = [eq(workflowTemplates.companyId, session?.user?.companyId ?? '')];
  if (selectedBranch && selectedBranch !== 'all') {
    // @ts-ignore
    workflowConditions.push(eq(workflowInstances.branchId, selectedBranch));
  }

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
    .where(and(...workflowConditions))
    .orderBy(desc(workflowInstances.updatedAt))
    .limit(10) : [];

  const formattedWorkflows = recentWorkflows.map(workflow => ({
    ...workflow,
    templateName: workflow.templateName || t("noName"),
    assigneeName: workflow.assigneeName || t("unassigned")
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
      <div className="flex flex-1 flex-col pb-8">
        <div className="@container/main flex flex-1 flex-col gap-2">
          {/* Executive Header Section */}
          <div className="border-b bg-card">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 lg:px-6 py-6 gap-4 max-w-7xl mx-auto w-full">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h2>
              <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
            </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <DashboardFilters />
                <div className="hidden sm:block h-8 w-px bg-border mx-1" />
                <ComplianceReportGenerator />
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 py-6">
            {/* Pinned Announcements */}
            {pinnedAnnouncements.length > 0 && (
              <div className="px-4 lg:px-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pinnedAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="bg-primary/5 border border-primary/10 rounded-xl p-4 relative overflow-hidden group hover:bg-primary/10 transition-all cursor-pointer shadow-sm">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
                      <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {announcement.communicationType === 'ANNOUNCEMENT' ? t("announcement") : announcement.communicationType === 'NOTIFICATION' ? t("notification") : t("message")}
                    </span>
                      </div>
                      <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">{announcement.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

      {/* KPI Cards section */}
      <ComplianceMetrics />

      {/* Executive Summary: Alerts + Branch Overview + Cost Trends */}
      <ExecutiveSummary />

      {/* KPI Summary Cards */}
      <div className="px-4 lg:px-6">
        <KpiSummaryCards />
      </div>

      {/* Charts Section */}
            <div className="px-4 lg:px-6">
                <DashboardCharts />
            </div>

            {/* Recent Activity Section */}
            <div className="px-4 lg:px-6">
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h3 className="text-lg font-bold">{t("recentActivity")}</h3>
              </div>
                <div className="p-0">
                  <RecentWorkflowsTable workflows={formattedWorkflows} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
