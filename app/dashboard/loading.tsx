import { PageContainer } from "@/components/shared/page-container"
import { PageHeaderSkeleton, KpiCardsSkeleton, ChartSkeleton, DataTableSkeleton } from "@/components/shared/skeletons"

export default function DashboardLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <KpiCardsSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <DataTableSkeleton columns={5} rows={5} />
    </PageContainer>
  )
}
