
"use client"

import * as React from "react"
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
import type { ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface StockHistoryChartProps {
    tickers: string[];
    data: {
        [key: string]: { date: string; price: number }[];
    };
}

const chartConfig = {
    price: {
        label: "Precio",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig

export function StockHistoryChart({ tickers, data }: StockHistoryChartProps) {
    const [selectedTicker, setSelectedTicker] = React.useState(tickers[0] || '');

    const chartData = data[selectedTicker] || [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Histórico por acción</CardTitle>
                    <CardDescription>Rendimiento histórico por acción.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedTicker} onValueChange={setSelectedTicker}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Acción" />
                        </SelectTrigger>
                        <SelectContent>
                            {tickers.map(ticker => (
                                <SelectItem key={ticker} value={ticker}>{ticker}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select defaultValue="3m">
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Rango" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1m">1 Mes</SelectItem>
                            <SelectItem value="3m">3 Meses</SelectItem>
                            <SelectItem value="6m">6 Meses</SelectItem>
                            <SelectItem value="1y">1 Año</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
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
                                const date = parseISO(value)
                                return format(date, "MMM", { locale: es });
                            }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickCount={3}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <defs>
                            <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-price)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-price)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <Area
                            dataKey="price"
                            type="natural"
                            fill="url(#fillPrice)"
                            stroke="var(--color-price)"
                            stackId="a"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
