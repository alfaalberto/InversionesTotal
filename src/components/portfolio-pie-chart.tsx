'use client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { Badge } from './ui/badge';
import * as React from 'react';
import type { ChartConfig } from './ui/chart';

type PortfolioTableRow = {
  id: string;
  ticker: string;
  name: string;
  currency: 'USD' | 'MXN';
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  portfolioShare: number;
};

interface PortfolioPieChartProps {
  data: PortfolioTableRow[];
}

// Paleta de colores premium moderna
const PREMIUM_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#f59e0b', // Yellow
  '#ef4444', // Rose
];

// Gradientes para cada color
const createGradient = (color: string, index: number) => {
  return {
    id: `gradient-${index}`,
    color1: color,
    color2: `${color}80`, // 50% opacity
  };
};

// Umbral para agrupar activos menores
const MIN_PERCENT = 0.03; // 3%

function groupSmallAssets(data: PortfolioTableRow[]) {
  const total = data.reduce((acc, asset) => acc + asset.currentValue, 0);
  const mainAssets = data.filter(asset => asset.currentValue / total >= MIN_PERCENT);
  const others = data.filter(asset => asset.currentValue / total < MIN_PERCENT);
  if (others.length === 0) return data;
  const othersValue = others.reduce((acc, asset) => acc + asset.currentValue, 0);
  return [
    ...mainAssets,
    {
      id: 'otros',
      ticker: 'OTROS',
      name: 'Otros',
      currency: 'USD' as const,
      quantity: 0,
      purchasePrice: 0,
      currentPrice: 0,
      currentValue: othersValue,
      pnl: 0,
      pnlPercent: 0,
      portfolioShare: othersValue / total,
    },
  ];
}

const chartConfig = {
  value: {
    label: "Valor",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function PortfolioPieChart({ data }: PortfolioPieChartProps) {
  // Agrupar activos pequeños en "Otros"
  const groupedData = groupSmallAssets(data);
  const chartData = groupedData.map((asset: PortfolioTableRow) => ({
    name: asset.name,
    value: asset.currentValue,
  }));
  const totalCurrentValue = groupedData.reduce(
    (acc: number, asset: PortfolioTableRow) => acc + asset.currentValue,
    0
  );

  // Mostrar etiquetas solo para los principales
  const showLabel = (entry: any, index: number) => {
    if (entry.name === 'Otros') return true;
    return entry.value / totalCurrentValue >= MIN_PERCENT;
  };

  // DEBUG: Log de datos de entrada y procesados
  console.log('[PortfolioPieChart] data:', data);
  console.log('[PortfolioPieChart] groupedData:', groupedData);
  console.log('[PortfolioPieChart] chartData:', chartData);
  console.log('[PortfolioPieChart] totalCurrentValue:', totalCurrentValue);

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Distribución del Portafolio
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {groupedData.length} activos
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Valor total: {totalCurrentValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-80 w-full">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
              <defs>
                {PREMIUM_COLORS.map((color, index) => (
                  <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={1} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={120}
                paddingAngle={2}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
                label={({ name, percent, value }: { name: string; percent: number; value: number }) => {
                  if (typeof value !== 'number' || totalCurrentValue === 0) return '';
                  return showLabel({ name, value }, 0)
                    ? `${name} ${(percent * 100).toFixed(1)}%`
                    : '';
                }}
                stroke="#fff"
                strokeWidth={2}
              >
                {chartData.map((entry: { name: string; value: number }, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#gradient-${index % PREMIUM_COLORS.length})`}
                  />
                ))}
              </Pie>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (typeof value === 'number' && totalCurrentValue) {
                        return [`${((value / totalCurrentValue) * 100).toFixed(2)}%`, name as string];
                      }
                      return ['', name as string];
                    }}
                  />
                }
              />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
