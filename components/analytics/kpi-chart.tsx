"use client";

import * as React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface KpiChartProps {
    title?: string;
    data: Array<{
        date: string;
        value: number;
        target?: number;
        warning?: number;
        critical?: number;
    }>;
    chartType?: "line" | "bar" | "area";
    valueKey?: string;
    unit?: string;
    metricType?: string;
    decimalPlaces?: number;
    height?: number;
    showTarget?: boolean;
    showWarning?: boolean;
    showCritical?: boolean;
}

export function KpiChart({
    title,
    data,
    chartType = "line",
    valueKey = "value",
    unit,
    metricType,
    decimalPlaces = 2,
    height = 300,
    showTarget = true,
    showWarning = false,
    showCritical = false,
}: KpiChartProps) {
    const formatValue = (value: number) => {
        if (metricType === "PERCENTAGE") {
            return `${value.toFixed(decimalPlaces)}%`;
        } else if (metricType === "TIME") {
            return `${value.toFixed(decimalPlaces)} ${unit || "hrs"}`;
        } else {
            return `${value.toFixed(decimalPlaces)} ${unit || "units"}`;
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">{entry.name}:</span>
                            <span className="font-medium">{formatValue(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        const commonProps = {
            data,
            margin: { top: 10, right: 30, left: 0, bottom: 0 },
        };

        const chartComponents = {
            line: (
                <LineChart {...commonProps}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey={valueKey}
                        name="Value"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    {showTarget && data[0]?.target !== undefined && (
                        <Line
                            type="monotone"
                            dataKey="target"
                            name="Target"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                        />
                    )}
                </LineChart>
            ),
            bar: (
                <BarChart {...commonProps}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                        dataKey={valueKey}
                        name="Value"
                        fill="hsl(var(--chart-1))"
                        radius={[4, 4, 0, 0]}
                    />
                    {showTarget && data[0]?.target !== undefined && (
                        <Bar
                            dataKey="target"
                            name="Target"
                            fill="hsl(var(--chart-2))"
                            radius={[4, 4, 0, 0]}
                        />
                    )}
                </BarChart>
            ),
            area: (
                <AreaChart {...commonProps}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey={valueKey}
                        name="Value"
                        stroke="hsl(var(--chart-1))"
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                    {showTarget && data[0]?.target !== undefined && (
                        <Line
                            type="monotone"
                            dataKey="target"
                            name="Target"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                        />
                    )}
                </AreaChart>
            ),
        };

        return chartComponents[chartType];
    };

    return (
        <Card>
            {title && (
                <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
            )}
            <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                    {renderChart()}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
