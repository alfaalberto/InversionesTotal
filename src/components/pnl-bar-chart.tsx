'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  LabelList
} from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';

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
  // Ordenar datos por P&L (de mayor a menor) para mejor visualización
  const sortedData = [...data].sort((a, b) => b.pnl - a.pnl);
  
  const chartData = sortedData.map((asset: PortfolioTableRow, index: number) => {
    const isTop = index < 3 && asset.pnl > 0; // Top 3 performers
    const isWorst = index >= sortedData.length - 3 && asset.pnl < 0; // Worst 3 performers
    
    return {
      name: asset.ticker,
      fullName: asset.name,
      pnl: asset.pnl,
      pnlPercent: asset.pnlPercent,
      fill: asset.pnl >= 0 ? 'url(#positiveGradient)' : 'url(#negativeGradient)',
      color: asset.pnl >= 0 ? '#10b981' : '#ef4444',
      isTop,
      isWorst,
      strokeColor: isTop ? '#059669' : isWorst ? '#dc2626' : 'transparent',
      strokeWidth: isTop || isWorst ? 2 : 0,
    };
  });

  const totalPnl = data.reduce((acc: number, asset: PortfolioTableRow) => acc + asset.pnl, 0);
  const positiveCount = data.filter(asset => asset.pnl >= 0).length;
  const negativeCount = data.length - positiveCount;
  const topPerformer = sortedData[0];
  const worstPerformer = sortedData[sortedData.length - 1];

  // DEBUG: Log de datos de entrada y procesados
  console.log('[PnlBarChart] data:', data);
  console.log('[PnlBarChart] chartData:', chartData);
  console.log('[PnlBarChart] totalPnl:', totalPnl);

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            <BarChart3 className="h-5 w-5 text-primary" />
            Rendimiento por Activo
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={totalPnl >= 0 ? "default" : "destructive"} className="text-xs font-semibold">
              {totalPnl >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              G/P Total: {formatCurrency(totalPnl, 'USD')}
            </Badge>
          </div>
        </div>
        
        {/* Estadísticas mejoradas */}
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 shadow-sm"></div>
              <span className="text-green-600 font-medium">{positiveCount} positivos</span>
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-red-600 shadow-sm"></div>
              <span className="text-red-600 font-medium">{negativeCount} negativos</span>
            </span>
          </div>
          
          {/* Mejores y peores performers */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {topPerformer && topPerformer.pnl > 0 && (
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">{topPerformer.ticker}</span>
              </span>
            )}
            {worstPerformer && worstPerformer.pnl < 0 && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                <span className="text-red-600 font-medium">{worstPerformer.ticker}</span>
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap={6} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
              <defs>
                {/* Gradientes mejorados para barras positivas */}
                <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.7} />
                </linearGradient>
                
                {/* Gradientes mejorados para barras negativas */}
                <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fca5a5" stopOpacity={0.7} />
                  <stop offset="50%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                </linearGradient>
                
                {/* Sombras para efectos visuales */}
                <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)" />
                </filter>
              </defs>
              {/* Línea de referencia en Y=0 */}
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--border))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                opacity={0.7}
              />
              
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (Math.abs(value) >= 1000) {
                    return `${(value / 1000).toFixed(1)}k`;
                  }
                  return formatCurrency(value, 'USD');
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background/98 backdrop-blur-md border-2 rounded-xl shadow-2xl p-4 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          {data.isTop && <Award className="h-4 w-4 text-green-600" />}
                          {data.isWorst && <AlertTriangle className="h-4 w-4 text-red-600" />}
                          <p className="font-bold text-sm">{data.fullName}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 font-medium">{label}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Ganancia/Pérdida:</span>
                            <span className={`text-sm font-bold ${
                              data.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(data.pnl, 'USD')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Rendimiento:</span>
                            <span className={`text-sm font-bold ${
                              data.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {data.pnlPercent >= 0 ? '+' : ''}{data.pnlPercent.toFixed(2)}%
                            </span>
                          </div>
                          {(data.isTop || data.isWorst) && (
                            <div className="mt-2 pt-2 border-t">
                              <span className={`text-xs font-medium ${
                                data.isTop ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {data.isTop ? '🏆 Top Performer' : '⚠️ Necesita Atención'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15, radius: 4 }}
              />
              <Bar
                dataKey="pnl"
                radius={[6, 6, 2, 2]}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
                filter="url(#dropShadow)"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-bar-${index}`} 
                    fill={entry.fill}
                    stroke={entry.strokeColor}
                    strokeWidth={entry.strokeWidth}
                  />
                ))}
                
                {/* Etiquetas de valores mejoradas */}
                <LabelList
                  dataKey="pnl"
                  position="top"
                  content={(props: any) => {
                    const { x, y, width, value, payload } = props;
                    if (Math.abs(value) < 50) return null; // No mostrar etiquetas para valores muy pequeños
                    
                    const isPositive = value >= 0;
                    const displayValue = Math.abs(value) >= 1000 
                      ? `${(value / 1000).toFixed(1)}k`
                      : `$${Math.round(value)}`;
                    
                    return (
                      <text
                        x={x + width / 2}
                        y={isPositive ? y - 8 : y + 20}
                        textAnchor="middle"
                        fill={isPositive ? '#059669' : '#dc2626'}
                        fontSize={10}
                        fontWeight={700}
                        className="drop-shadow-sm"
                      >
                        {displayValue}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Resumen mejorado */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Total G/P</p>
            <p className={`text-lg font-bold ${
              totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(totalPnl, 'USD')}
            </p>
          </div>
          
          {topPerformer && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Mejor</p>
              <p className="text-sm font-semibold text-green-600">
                {topPerformer.ticker}
              </p>
              <p className="text-xs text-green-500">
                +{topPerformer.pnlPercent.toFixed(1)}%
              </p>
            </div>
          )}
          
          {worstPerformer && worstPerformer.pnl < 0 && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Peor</p>
              <p className="text-sm font-semibold text-red-600">
                {worstPerformer.ticker}
              </p>
              <p className="text-xs text-red-500">
                {worstPerformer.pnlPercent.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
