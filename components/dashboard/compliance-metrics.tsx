"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, AlertCircle, CheckCircle, ClipboardList, Users } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

interface Metrics {
    complianceRate: number;
    complianceSentiment: string;
    totalInspections: number;
    openIncidents: number;
    openIncidentsSentiment: string;
    activeStaff?: number;
    activeStaffSentiment?: string;
    period: string;
}

export function ComplianceMetrics() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch("/api/analytics/compliance");
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                }
            } catch (error) {
                console.error("Failed to fetch metrics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
                ))}
            </div>
        );
    }

    if (!metrics) return null;

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'Bueno':
            case 'Normal':
            case 'Bajo' && metrics.openIncidents === 0: return 'success';
            case 'Regular':
            case 'Atención': return 'warning';
            case 'Crítico': return 'danger';
            default: return 'default';
        }
    }

    return (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Workflows"
                value={metrics.totalInspections}
                icon={ClipboardList}
                description="Hoy"
                trend={{ value: 12, isPositive: true }}
                variant="default"
            />

            <StatCard
                title="Compliance"
                value={`${metrics.complianceRate}%`}
                icon={TrendingUp}
                description={`🟢 ${metrics.complianceSentiment}`}
                trend={{ value: 3.2, isPositive: true }}
                variant={metrics.complianceRate > 90 ? "success" : metrics.complianceRate > 75 ? "warning" : "danger"}
            />

            <StatCard
                title="Labor / Turnos"
                value={metrics.activeStaff || 0}
                icon={Users}
                description={`🟢 ${metrics.activeStaffSentiment}`}
                trend={{ value: 5, isPositive: true }}
                variant="default"
            />

            <StatCard
                title="Incidentes"
                value={metrics.openIncidents}
                icon={AlertCircle}
                description={`🟡 ${metrics.openIncidentsSentiment}`}
                trend={{ value: 0, isPositive: true }}
                variant={metrics.openIncidents > 0 ? "danger" : "default"}
            />
        </div>
    );
}
