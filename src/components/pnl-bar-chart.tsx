'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

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

interface PnlBarChartProps {
  data: PortfolioTableRow[];
}

const formatCurrency = (value: number, currency: 'USD' | 'MXN') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function PnlBarChart({ data }: PnlBarChartProps) {
  const chartData = data.map((asset) => ({
    name: asset.ticker,
    pnl: asset.pnl,
    fill: asset.pnl >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))',
  }));

  const totalPnl = data.reduce((acc, asset) => acc + asset.pnl, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ganancia/Pérdida (G/P) por Activo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
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
                tickFormatter={(value) =>
                  formatCurrency(value as number, 'USD')
                }
              />
              <Tooltip
                formatter={(value, name, props) => [
                  formatCurrency(value as number, 'USD'),
                  props.payload.name,
                ]}
                cursor={{ fill: 'transparent' }}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center text-lg font-medium">
          G/P Total: {formatCurrency(totalPnl, 'USD')}
        </div>
      </CardContent>
    </Card>
  );
}
