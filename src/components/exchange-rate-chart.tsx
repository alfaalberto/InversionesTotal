"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { exchangeRateHistory } from "@/lib/data"
import type { ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  rate: {
    label: "USD/MXN",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function ExchangeRateChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Tipo de Cambio USD/MXN</CardTitle>
        <CardDescription>Rendimiento histórico del par de divisas.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={exchangeRateHistory}
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
                const monthMap: { [key: string]: string } = {
                  Jan: 'Ene',
                  Apr: 'Abr',
                  Aug: 'Ago',
                  Dec: 'Dic'
                };
                return monthMap[value] || value.slice(0, 3);
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={3}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
                <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                    <stop
                    offset="5%"
                    stopColor="var(--color-rate)"
                    stopOpacity={0.8}
                    />
                    <stop
                    offset="95%"
                    stopColor="var(--color-rate)"
                    stopOpacity={0.1}
                    />
                </linearGradient>
            </defs>
            <Area
              dataKey="rate"
              type="natural"
              fill="url(#fillRate)"
              stroke="var(--color-rate)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
