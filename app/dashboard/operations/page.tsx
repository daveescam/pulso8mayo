"use client";

import { useSearchParams } from "next/navigation";
import { OperationsTabs } from "@/components/dashboard/operations/operations-tabs";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { TemperatureMonitor } from "@/components/dashboard/operations/temperature-monitor";

export default function OperationsPage() {
  const searchParams = useSearchParams();
  const branchId = searchParams.get("branch") || "all";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const period = (() => {
    if (!startDate) return "30d";
    const now = new Date();
    const start = new Date(startDate);
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "7d";
    if (diffDays <= 8) return "7d";
    if (diffDays <= 32) return "30d";
    return "90d";
  })();

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Operations Dashboard</h2>
        <DashboardFilters />
      </div>
      <TemperatureMonitor period={period} branchId={branchId} />
      <OperationsTabs recentWorkflows={[]} period={period} branchId={branchId} />
    </div>
  );
}
