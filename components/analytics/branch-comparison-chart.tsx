"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface BranchMetric {
  branchId: string;
  branchName: string;
  workflowMetrics: { completionRate: number };
  complianceScore: number;
  assignmentMetrics: { completionRate: number };
  performanceIndex: number;
}

export function BranchComparisonChart({ period }: { period: string }) {
  const [branches, setBranches] = useState<BranchMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/branch-performance?period=${period}`)
      .then(res => res.json())
      .then(data => {
        setBranches(data.branches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) {
    return <Card><CardContent className="p-6"><div className="h-[400px] flex items-center justify-center text-muted-foreground">Cargando...</div></CardContent></Card>;
  }

  if (branches.length === 0) {
    return <Card><CardContent className="p-6"><div className="h-[400px] flex items-center justify-center text-muted-foreground">Sin datos de sucursales</div></CardContent></Card>;
  }

  const chartData = branches.map(b => ({
    name: b.branchName.length > 12 ? b.branchName.substring(0, 12) + '...' : b.branchName,
    'Completitud Tareas': b.workflowMetrics.completionRate,
    'Score Cumplimiento': b.complianceScore,
    'Completitud Asignaciones': b.assignmentMetrics.completionRate,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo entre Sucursales</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={100} />
            <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`]} />
            <Legend />
            <Bar dataKey="Completitud Tareas" fill="#2563eb" />
            <Bar dataKey="Score Cumplimiento" fill="#16a34a" />
            <Bar dataKey="Completitud Asignaciones" fill="#9333ea" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
