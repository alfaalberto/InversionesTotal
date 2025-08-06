'use client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { Pie, PieChart, Cell } from 'recharts';
import * as React from 'react';

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

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#AF19FF',
  '#FF6347',
];

export function PortfolioPieChart({ data }: PortfolioPieChartProps) {
  const chartData = data.map((asset) => ({
    name: asset.name,
    value: asset.currentValue,
  }));

  const totalCurrentValue = data.reduce(
    (acc, asset) => acc + asset.currentValue,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución del Portafolio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ChartContainer config={{}}>
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      `${((value / totalCurrentValue) * 100).toFixed(2)}%`,
                      name,
                    ]}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
