"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  // Encontrar máximos y mínimos para destacar
  const maxValue = Math.max(...exchangeRateHistory.map(d => d.rate));
  const minValue = Math.min(...exchangeRateHistory.map(d => d.rate));
  const currentRate = exchangeRateHistory[exchangeRateHistory.length - 1]?.rate || 0;
  const previousRate = exchangeRateHistory[exchangeRateHistory.length - 2]?.rate || 0;
  const rateChange = currentRate - previousRate;
  const rateChangePercent = previousRate > 0 ? (rateChange / previousRate) * 100 : 0;
  const isPositive = rateChange >= 0;

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            <DollarSign className="h-5 w-5 text-primary" />
            Tipo de Cambio USD/MXN
          </CardTitle>
          <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {isPositive ? '+' : ''}{rateChangePercent.toFixed(2)}%
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Actual:</span>
            <span className="text-lg font-bold">${currentRate.toFixed(4)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Rango: ${minValue.toFixed(4)} - ${maxValue.toFixed(4)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={exchangeRateHistory}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="exchangeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) => {
                  const monthMap: { [key: string]: string } = {
                    Jan: 'Ene', Apr: 'Abr', Aug: 'Ago', Dec: 'Dic'
                  };
                  return monthMap[value] || value.slice(0, 3);
                }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                domain={[minValue * 0.98, maxValue * 1.02]}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    return (
                      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-sm mb-1">{label}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                          <span className="text-sm">USD/MXN:</span>
                          <span className="font-bold text-lg">${typeof data.value === 'number' ? data.value.toFixed(4) : data.value}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          1 USD = {typeof data.value === 'number' ? data.value.toFixed(4) : data.value} MXN
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="url(#exchangeGradient)"
                fill="url(#exchangeGradient)"
                strokeWidth={3}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  stroke: '#fff', 
                  strokeWidth: 2,
                  fill: '#6366f1',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
