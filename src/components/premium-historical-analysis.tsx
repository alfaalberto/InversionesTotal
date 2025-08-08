'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Activity,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { StockHistoryChart } from './stock-history-chart';

interface PremiumHistoricalAnalysisProps {
  tickers?: string[];
  data?: any;
}

export function PremiumHistoricalAnalysis({ tickers = [], data = {} }: PremiumHistoricalAnalysisProps) {
  const [selectedPeriod, setSelectedPeriod] = React.useState('1Y');
  const [isLoading, setIsLoading] = React.useState(false);

  const periods = [
    { label: '1M', value: '1M', days: 30 },
    { label: '3M', value: '3M', days: 90 },
    { label: '6M', value: '6M', days: 180 },
    { label: '1Y', value: '1Y', days: 365 },
    { label: '2Y', value: '2Y', days: 730 },
    { label: 'Todo', value: 'ALL', days: null }
  ];

  // Mock historical metrics
  const historicalMetrics = {
    totalReturn: 15.8,
    volatility: 18.2,
    sharpeRatio: 0.87,
    maxDrawdown: -12.4,
    bestMonth: 8.9,
    worstMonth: -6.2,
    winRate: 64.2,
    avgMonthlyReturn: 1.2
  };

  const handlePeriodChange = async (period: string) => {
    setIsLoading(true);
    setSelectedPeriod(period);
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            <Calendar className="h-6 w-6 text-primary" />
            Análisis Histórico del Portafolio
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Explora el rendimiento histórico y las métricas de riesgo de tu portafolio a lo largo del tiempo.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange(period.value)}
                disabled={isLoading}
                className="h-8"
              >
                {period.label}
              </Button>
            ))}
          </div>
          {isLoading && (
            <div className="mt-4">
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">Cargando datos históricos...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historical Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Retorno Total</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  +{historicalMetrics.totalReturn}%
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Volatilidad</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {historicalMetrics.volatility}%
                </p>
              </div>
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Ratio Sharpe</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {historicalMetrics.sharpeRatio}
                </p>
              </div>
              <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Max Drawdown</p>
                <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                  {historicalMetrics.maxDrawdown}%
                </p>
              </div>
              <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="h-5 w-5 text-primary" />
              Métricas de Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Mejor Mes</p>
                <p className="text-xl font-bold text-green-600">+{historicalMetrics.bestMonth}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Peor Mes</p>
                <p className="text-xl font-bold text-red-600">{historicalMetrics.worstMonth}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tasa de Éxito</p>
                <p className="text-xl font-bold">{historicalMetrics.winRate}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Retorno Mensual Promedio</p>
                <p className="text-xl font-bold text-blue-600">+{historicalMetrics.avgMonthlyReturn}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-primary" />
              Análisis Temporal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Período Seleccionado</span>
                <Badge variant="secondary">{selectedPeriod}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Consistencia</span>
                  <span className="font-medium">Alta</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estabilidad</span>
                  <span className="font-medium">Moderada</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Chart */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Zap className="h-5 w-5 text-primary" />
            Evolución Histórica del Portafolio
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Visualización del rendimiento acumulado durante el período seleccionado ({selectedPeriod})
          </p>
        </CardHeader>
        <CardContent>
          <StockHistoryChart tickers={tickers} data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
