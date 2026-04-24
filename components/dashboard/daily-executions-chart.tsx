"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { TrendingUp } from "lucide-react"

interface DailyData {
    date: string;
    count: number;
}

interface DailyExecutionsChartProps {
    data: DailyData[];
}

const chartConfig = {
  count: {
    label: "Ejecuciones",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function DailyExecutionsChart({ data }: DailyExecutionsChartProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Ejecuciones Diarias</CardTitle>
        <CardDescription>
          Tendencia de los últimos 7 días
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-[250px] w-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("es-MX", { weekday: 'short' });
              }}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <defs>
              <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="count"
              type="natural"
              fill="url(#fillCount)"
              fillOpacity={0.4}
              stroke="var(--color-count)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Crecimiento estable esta semana <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  )
}
