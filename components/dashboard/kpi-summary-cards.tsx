"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface KpiSummary {
  id: string;
  name: string;
  currentValue: number;
  previousValue: number;
  status: string;
  unit: string;
  target: number | null;
  category: string;
}

const categoryLabels: Record<string, string> = {
  OPERATIONS: 'Operaciones',
  COMPLIANCE: 'Cumplimiento',
  LABOR: 'RH',
  INVENTORY: 'Inventario',
};

const statusIcons = {
  NORMAL: CheckCircle2,
  WARNING: AlertTriangle,
  CRITICAL: XCircle,
};

const statusColors = {
  NORMAL: 'text-green-600',
  WARNING: 'text-yellow-600',
  CRITICAL: 'text-red-600',
};

export function KpiSummaryCards({ branchId }: { branchId?: string }) {
  const [kpis, setKpis] = useState<KpiSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ period: '7d' });
    if (branchId && branchId !== 'all') params.set('branchId', branchId);
    fetch(`/api/kpi/dashboard?${params}`)
      .then(res => res.json())
      .then(data => {
        setKpis((data.kpis || []).slice(0, 4));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [branchId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (kpis.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const trend = kpi.previousValue === 0
          ? 0
          : ((kpi.currentValue - kpi.previousValue) / kpi.previousValue) * 100;
        const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
        const StatusIcon = statusIcons[kpi.status as keyof typeof statusIcons] || CheckCircle2;
        const statusColor = statusColors[kpi.status as keyof typeof statusColors] || 'text-gray-600';

        return (
          <Card key={kpi.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[kpi.category] || kpi.category}
                </p>
                <StatusIcon className={`h-4 w-4 ${statusColor}`} />
              </div>
              <p className="text-2xl font-bold">
                {kpi.currentValue.toFixed(1)}{kpi.unit}
              </p>
              <p className="text-sm text-muted-foreground mt-1 truncate">{kpi.name}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendIcon className={`h-3 w-3 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">vs. periodo anterior</span>
              </div>
              {kpi.target && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Meta: {kpi.target}{kpi.unit}</span>
                    <span>{Math.min(100, Math.round((kpi.currentValue / kpi.target) * 100))}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${kpi.status === 'NORMAL' ? 'bg-green-500' : kpi.status === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, Math.round((kpi.currentValue / kpi.target) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
