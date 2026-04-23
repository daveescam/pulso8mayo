"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    X,
    Clock,
    Bell,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KpiAlert {
    id: string;
    kpiId: string;
    kpiName?: string;
    alertType: "WARNING" | "CRITICAL";
    status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" | "FALSE_POSITIVE";
    triggeredValue: number;
    threshold: number;
    title: string;
    message: string;
    createdAt: string;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    resolutionNotes?: string;
}

interface KpiAlertsProps {
    alerts: KpiAlert[];
    onAcknowledge?: () => void;
}

export function KpiAlerts({ alerts, onAcknowledge }: KpiAlertsProps) {
    const { toast } = useToast();
    const [selectedAlert, setSelectedAlert] = React.useState<KpiAlert | null>(null);
    const [isResolving, setIsResolving] = React.useState(false);
    const [resolutionNotes, setResolutionNotes] = React.useState("");

    const handleAcknowledge = async (alertId: string) => {
        try {
            const response = await fetch(`/api/kpi/alerts/${alertId}/acknowledge`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                toast({
                    title: "Alert Acknowledged",
                    description: "The alert has been marked as acknowledged",
                });
                onAcknowledge?.();
            } else {
                throw new Error("Failed to acknowledge alert");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to acknowledge alert",
                variant: "destructive",
            });
        }
    };

    const handleResolve = async () => {
        if (!selectedAlert) return;

        setIsResolving(true);
        try {
            const response = await fetch(`/api/kpi/alerts/${selectedAlert.id}/resolve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resolutionNotes }),
            });

            if (response.ok) {
                toast({
                    title: "Alert Resolved",
                    description: "The alert has been marked as resolved",
                });
                setSelectedAlert(null);
                setResolutionNotes("");
                onAcknowledge?.();
            } else {
                throw new Error("Failed to resolve alert");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to resolve alert",
                variant: "destructive",
            });
        } finally {
            setIsResolving(false);
        }
    };

    const getAlertIcon = (alertType: string, status: string) => {
        if (status === "RESOLVED") {
            return <CheckCircle className="h-5 w-5 text-green-600" />;
        } else if (alertType === "CRITICAL") {
            return <AlertCircle className="h-5 w-5 text-red-600" />;
        } else {
            return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return (
                    <Badge variant="destructive" className="gap-1">
                        <Bell className="h-3 w-3" />
                        Active
                    </Badge>
                );
            case "ACKNOWLEDGED":
                return (
                    <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3" />
                        Acknowledged
                    </Badge>
                );
            case "RESOLVED":
                return (
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Resolved
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleString("es-MX", {
            dateStyle: "short",
            timeStyle: "short",
        });
    };

    const activeAlerts = alerts.filter((a) => a.status === "ACTIVE" || a.status === "ACKNOWLEDGED");

    if (activeAlerts.length === 0) {
        return null;
    }

    return (
        <>
            <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                Active Alerts ({activeAlerts.length})
                            </CardTitle>
                            <CardDescription>
                                KPIs that require your immediate attention
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {activeAlerts.slice(0, 3).map((alert) => (
                            <Alert
                                key={alert.id}
                                className={
                                    alert.alertType === "CRITICAL"
                                        ? "border-red-300 bg-white"
                                        : "border-yellow-300 bg-white"
                                }
                            >
                                {getAlertIcon(alert.alertType, alert.status)}
                                <AlertTitle className="flex items-center gap-2">
                                    {alert.title}
                                    {getStatusBadge(alert.status)}
                                </AlertTitle>
                                <AlertDescription className="mt-1">
                                    <div className="space-y-2">
                                        <p>{alert.message}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>Triggered: {formatDate(alert.createdAt)}</span>
                                            <span>Value: {alert.triggeredValue}</span>
                                            <span>Threshold: {alert.threshold}</span>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {alert.status === "ACTIVE" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAcknowledge(alert.id)}
                                                >
                                                    Acknowledge
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedAlert(alert);
                                                }}
                                            >
                                                Resolve
                                            </Button>
                                        </div>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        ))}
                        {activeAlerts.length > 3 && (
                            <Button variant="ghost" size="sm" className="w-full">
                                View all {activeAlerts.length} alerts
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Resolve Dialog */}
            <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resolve Alert</DialogTitle>
                        <DialogDescription>
                            Mark this alert as resolved and add resolution notes
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAlert && (
                        <div className="space-y-4">
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="font-semibold">{selectedAlert.title}</div>
                                <div className="text-sm text-muted-foreground">
                                    {selectedAlert.message}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Resolution Notes</label>
                                <Textarea
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    placeholder="Describe how the issue was resolved..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleResolve} disabled={isResolving}>
                            {isResolving ? "Resolving..." : "Resolve Alert"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
