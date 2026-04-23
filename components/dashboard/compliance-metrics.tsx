
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface Metrics {
    complianceRate: number;
    totalInspections: number;
    openIncidents: number;
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
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!metrics) return null;

    return (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardDescription>Compliance Rate</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                        {metrics.complianceRate}%
                    </CardTitle>
                    <CardAction>
                        <Badge variant={metrics.complianceRate > 90 ? "default" : "destructive"}>
                            {metrics.complianceRate > 90 ? <TrendingUp className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                            {metrics.complianceRate > 90 ? "High" : "Needs Attention"}
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">
                        Overall score across all completed workflows.
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardDescription>Total Inspections</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                        {metrics.totalInspections}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Completed
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">
                        Total workflow executions completed.
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardDescription>Open Incidents</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                        {metrics.openIncidents}
                    </CardTitle>
                    <CardAction>
                        {metrics.openIncidents > 0 ? (
                            <Badge variant="destructive">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Action Required
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                All good
                            </Badge>
                        )}
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">
                        Incidents requiring manager attention.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
