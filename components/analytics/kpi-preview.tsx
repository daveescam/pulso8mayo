"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiPreviewProps {
    values: {
        name?: string;
        description?: string;
        formula?: string;
        metricType?: string;
        target?: number;
        warningThreshold?: number;
        criticalThreshold?: number;
        thresholdType?: string;
        unit?: string;
        decimalPlaces?: number;
        category?: string;
    };
}

export function KpiPreview({ values }: KpiPreviewProps) {
    // Mock current value for preview
    const mockValue = values.metricType === "PERCENTAGE"
        ? 87.5
        : values.metricType === "TIME"
        ? 25.3
        : 142;

    const formatValue = (value: number) => {
        const decimals = values.decimalPlaces || 2;
        const unit = values.unit || "";

        if (values.metricType === "PERCENTAGE") {
            return `${value.toFixed(decimals)}%`;
        } else if (values.metricType === "TIME") {
            return `${value.toFixed(decimals)} ${unit || "hrs"}`;
        } else {
            return `${value.toFixed(decimals)} ${unit}`;
        }
    };

    const getStatusColor = () => {
        if (!values.target) return "bg-blue-500";

        const target = values.target;
        const warningRange = values.warningThreshold || (target * 0.1);
        const criticalRange = values.criticalThreshold || (target * 0.2);

        if (values.thresholdType === "MIN") {
            if (mockValue < target - criticalRange) return "bg-red-500";
            if (mockValue < target - warningRange) return "bg-yellow-500";
            return "bg-green-500";
        } else if (values.thresholdType === "MAX") {
            if (mockValue > target + criticalRange) return "bg-red-500";
            if (mockValue > target + warningRange) return "bg-yellow-500";
            return "bg-green-500";
        } else {
            if (Math.abs(mockValue - target) > criticalRange) return "bg-red-500";
            if (Math.abs(mockValue - target) > warningRange) return "bg-yellow-500";
            return "bg-green-500";
        }
    };

    const getStatusIcon = () => {
        const statusColor = getStatusColor();
        if (statusColor === "bg-green-500") {
            return <TrendingUp className="h-4 w-4 text-green-600" />;
        } else if (statusColor === "bg-yellow-500") {
            return <Minus className="h-4 w-4 text-yellow-600" />;
        } else {
            return <TrendingDown className="h-4 w-4 text-red-600" />;
        }
    };

    return (
        <Card className="bg-muted/50">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-semibold">
                            {values.name || "KPI Name"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {values.description || "KPI description will appear here"}
                        </p>
                    </div>
                    {getStatusIcon()}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Current Value */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{formatValue(mockValue)}</span>
                        <Badge variant="outline" className={getStatusColor().replace("bg-", "text-").replace("500", "700") + " border-" + getStatusColor().replace("bg-", "")}>
                            {values.thresholdType || "TARGET"}
                        </Badge>
                    </div>

                    {/* Target Info */}
                    {(values.target || values.warningThreshold || values.criticalThreshold) && (
                        <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                                <div className="text-muted-foreground">Target</div>
                                <div className="font-semibold">{values.target ? formatValue(values.target) : "-"}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Warning</div>
                                <div className="font-semibold text-yellow-600">
                                    {values.warningThreshold ? formatValue(values.warningThreshold) : "-"}
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Critical</div>
                                <div className="font-semibold text-red-600">
                                    {values.criticalThreshold ? formatValue(values.criticalThreshold) : "-"}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Formula Preview */}
                    {values.formula && (
                        <div className="pt-2 border-t">
                            <div className="text-xs text-muted-foreground mb-1">Formula</div>
                            <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                                {values.formula}
                            </code>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="flex gap-2 flex-wrap pt-2 border-t">
                        {values.metricType && (
                            <Badge variant="secondary" className="text-xs">
                                {values.metricType}
                            </Badge>
                        )}
                        {values.category && (
                            <Badge variant="secondary" className="text-xs">
                                {values.category}
                            </Badge>
                        )}
                        {values.frequency && (
                            <Badge variant="secondary" className="text-xs">
                                {values.frequency}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
