"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, Clock, PackageOpen, CalendarClock, Building2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface AlertSummary {
  criticalIncidents: number;
  overdueWorkflows: number;
  lowStockItems: number;
  expiringBatches: number;
}

interface BranchOverview {
  totalBranches: number;
  topPerformer: { branchId: string; branchName: string; performanceIndex: number } | null;
  bottomPerformer: { branchId: string; branchName: string; performanceIndex: number } | null;
  avgPerformanceIndex: number;
}

interface CostTrends {
  currentPeriod: { total: number; byCategory: Record<string, number> };
  previousPeriod: { total: number; byCategory: Record<string, number> };
  changePercent: number;
}

interface ComplianceOverview {
  avgScore: number;
  totalWorkflows: number;
  completedWorkflows: number;
  completionRate: number;
}

interface ExecutiveData {
  alertSummary: AlertSummary;
  branchOverview: BranchOverview;
  costTrends: CostTrends;
  complianceOverview: ComplianceOverview;
}

export function ExecutiveSummary() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    const branch = searchParams.get("branch");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (branch && branch !== "all") params.set("branchId", branch);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

      fetch(`/api/analytics/executive-summary?${params}`)
      .then((res) => res.json())
      .then((result) => {
        if (result && result.alertSummary) {
          setData(result);
        } else {
          setData(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <div className="space-y-4 px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-[200px] bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.alertSummary) return null;

  const totalAlerts =
    data.alertSummary.criticalIncidents +
    data.alertSummary.overdueWorkflows +
    data.alertSummary.lowStockItems +
    data.alertSummary.expiringBatches;

  const costCategories = Object.entries(data.costTrends.currentPeriod.byCategory);
  const chartData = costCategories.map(([category, current]) => ({
    category,
    actual: Number(current),
    anterior: Number(data.costTrends.previousPeriod.byCategory[category] || 0),
  }));

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className={data.alertSummary.criticalIncidents > 0 ? "border-red-200 bg-red-50/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${data.alertSummary.criticalIncidents > 0 ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground"}`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Incidentes Críticos</p>
                <p className="text-2xl font-bold">{data.alertSummary.criticalIncidents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={data.alertSummary.overdueWorkflows > 0 ? "border-orange-200 bg-orange-50/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${data.alertSummary.overdueWorkflows > 0 ? "bg-orange-100 text-orange-600" : "bg-muted text-muted-foreground"}`}>
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Workflows Vencidos</p>
                <p className="text-2xl font-bold">{data.alertSummary.overdueWorkflows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={data.alertSummary.lowStockItems > 0 ? "border-yellow-200 bg-yellow-50/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${data.alertSummary.lowStockItems > 0 ? "bg-yellow-100 text-yellow-600" : "bg-muted text-muted-foreground"}`}>
                <PackageOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold">{data.alertSummary.lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={data.alertSummary.expiringBatches > 0 ? "border-purple-200 bg-purple-50/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${data.alertSummary.expiringBatches > 0 ? "bg-purple-100 text-purple-600" : "bg-muted text-muted-foreground"}`}>
                <CalendarClock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lotes por Vencer</p>
                <p className="text-2xl font-bold">{data.alertSummary.expiringBatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Rendimiento de Sucursales
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {data.branchOverview.totalBranches} sucursales
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rendimiento Promedio</span>
                <span className="text-2xl font-bold">{data.branchOverview.avgPerformanceIndex.toFixed(1)}</span>
              </div>

              {data.branchOverview.topPerformer && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-green-600 font-medium">Mejor Sucursal</p>
                      <p className="text-sm font-medium">{data.branchOverview.topPerformer.branchName}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-700">
                    {data.branchOverview.topPerformer.performanceIndex.toFixed(1)}
                  </span>
                </div>
              )}

              {data.branchOverview.bottomPerformer && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-xs text-red-600 font-medium">Requiere Atención</p>
                      <p className="text-sm font-medium">{data.branchOverview.bottomPerformer.branchName}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-red-700">
                    {data.branchOverview.bottomPerformer.performanceIndex.toFixed(1)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Cumplimiento</span>
                <span className="font-medium">{data.complianceOverview.completionRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score Promedio</span>
                <span className="font-medium">{data.complianceOverview.avgScore.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {data.costTrends.changePercent >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                Tendencia de Costos
              </CardTitle>
              <Badge
                variant={data.costTrends.changePercent > 0 ? "destructive" : "secondary"}
                className="text-xs"
              >
                {data.costTrends.changePercent > 0 ? "+" : ""}
                {data.costTrends.changePercent.toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
                Sin datos de costos
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="category"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="anterior" name="Período Anterior" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Período Actual" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Total Actual</span>
                  <span className="text-lg font-bold">
                    ${data.costTrends.currentPeriod.total.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
