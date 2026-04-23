"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "next-themes";

const data = [
    {
        date: "Jan 01",
        rate: 85,
    },
    {
        date: "Jan 02",
        rate: 88,
    },
    {
        date: "Jan 03",
        rate: 92,
    },
    {
        date: "Jan 04",
        rate: 90,
    },
    {
        date: "Jan 05",
        rate: 95,
    },
    {
        date: "Jan 06",
        rate: 94,
    },
    {
        date: "Jan 07",
        rate: 98,
    },
];

export function CompletionRateChart() {
    const { theme } = useTheme();

    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
                <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderRadius: '8px' }}
                />
                <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#2563eb" // Blue-600
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
