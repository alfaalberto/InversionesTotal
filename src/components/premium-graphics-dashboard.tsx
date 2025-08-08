'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Activity,
  Target,
  Zap,
  Eye,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { PortfolioPieChart } from './portfolio-pie-chart';
import { PnlBarChart } from './pnl-bar-chart';
import { ExchangeRateChart } from './exchange-rate-chart';
import { StockHistoryChart } from './stock-history-chart';

interface PremiumGraphicsDashboardProps {
  data: any[];
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  exchangeRate: number | null;
}

export function PremiumGraphicsDashboard({
  data,
  totalValue,
  totalPnL,
  totalPnLPercent,
  exchangeRate
}: PremiumGraphicsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = React.useState<'value' | 'pnl' | 'distribution'>('distribution');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Calcular métricas adicionales
  const topPerformer = data.reduce((max, asset) => 
    asset.pnlPercent > max.pnlPercent ? asset : max, data[0] || { pnlPercent: 0, name: 'N/A' }
  );
  
  const worstPerformer = data.reduce((min, asset) => 
    asset.pnlPercent < min.pnlPercent ? asset : min, data[0] || { pnlPercent: 0, name: 'N/A' }
  );

  const positiveAssets = data.filter(asset => asset.pnl > 0).length;
  const totalAssets = data.length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header con métricas clave */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Valor Total</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${totalPnL >= 0 
          ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900'
          : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  Ganancia/Pérdida
                </p>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                  ${totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-sm ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {totalPnL >= 0 ? 
                  <TrendingUp className="h-6 w-6 text-white" /> : 
                  <TrendingDown className="h-6 w-6 text-white" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Activos Positivos</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {positiveAssets}/{totalAssets}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {((positiveAssets / totalAssets) * 100).toFixed(1)}% en ganancia
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Tipo de Cambio</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  ${exchangeRate?.toFixed(4) || 'N/A'}
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400">USD/MXN</p>
              </div>
              <div className="h-12 w-12 bg-orange-500 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de vista */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-card via-card to-muted/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Panel de Visualizaciones Avanzadas
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Análisis visual interactivo y métricas en tiempo real de tu portafolio
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedMetric === 'distribution' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('distribution')}
              className="flex items-center gap-2"
            >
              <PieChart className="h-4 w-4" />
              Distribución
            </Button>
            <Button
              variant={selectedMetric === 'pnl' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('pnl')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Rendimiento
            </Button>
            <Button
              variant={selectedMetric === 'value' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('value')}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Tendencias
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contenido dinámico según pestaña seleccionada */}
      {selectedMetric === 'distribution' && (
        <div className="space-y-6">
          {/* Gráficos de Distribución */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <PieChart className="h-5 w-5 text-primary" />
                      Distribución del Portafolio
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Composición por activos</p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {totalAssets} activos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <PortfolioPieChart data={data.map(asset => ({
                  ...asset,
                  name: asset.name || asset.ticker,
                }))} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-primary" />
                      Concentración de Activos
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Análisis de diversificación</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.slice(0, 5).map((asset, index) => (
                    <div key={asset.ticker} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{asset.name || asset.ticker}</p>
                          <p className="text-sm text-muted-foreground">{asset.ticker}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{asset.portfolioShare?.toFixed(1) || '0.0'}%</p>
                        <p className="text-sm text-muted-foreground">${asset.currentValue?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {selectedMetric === 'pnl' && (
        <div className="space-y-6">
          {/* Gráficos de Rendimiento */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Rendimiento por Activo
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Ganancia/Pérdida individual</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    G/P Total: ${totalPnL.toFixed(2)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <PnlBarChart data={data.map(asset => ({
                  ...asset,
                  name: asset.name || asset.ticker,
                }))} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Métricas de Rendimiento
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Análisis detallado de performance</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">Ganadores</p>
                    </div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {data.filter(asset => asset.pnl > 0).length}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      ${data.filter(asset => asset.pnl > 0).reduce((sum, asset) => sum + asset.pnl, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">Perdedores</p>
                    </div>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {data.filter(asset => asset.pnl < 0).length}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-500">
                      ${data.filter(asset => asset.pnl < 0).reduce((sum, asset) => sum + asset.pnl, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Rendimiento Promedio</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {(data.reduce((sum, asset) => sum + asset.pnlPercent, 0) / data.length).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {selectedMetric === 'value' && (
        <div className="space-y-6">
          {/* Gráficos de Tendencias */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Activity className="h-5 w-5 text-primary" />
                      Tipo de Cambio USD/MXN
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Evolución del tipo de cambio</p>
                  </div>
                  <Badge variant="outline" className="border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-300">
                    Actual: ${exchangeRate?.toFixed(4)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ExchangeRateChart />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="h-5 w-5 text-primary" />
                      Histórico de Precios
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Tendencias de tus activos</p>
                  </div>
                  <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">
                    Múltiples activos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <StockHistoryChart 
                  tickers={data.map(asset => asset.ticker)} 
                  data={{}}
                />
              </CardContent>
            </Card>
          </div>

          {/* Análisis de Tendencias */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                  <Activity className="h-5 w-5" />
                  Volatilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {((Math.max(...data.map(a => a.pnlPercent)) - Math.min(...data.map(a => a.pnlPercent))) / 2).toFixed(2)}%
                  </p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">
                    Rango de rendimiento
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-teal-800 dark:text-teal-200">
                  <Target className="h-5 w-5" />
                  Diversificación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                    {(100 - (data[0]?.portfolioShare || 0)).toFixed(1)}%
                  </p>
                  <p className="text-sm text-teal-600 dark:text-teal-400">
                    Fuera del activo principal
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Zap className="h-5 w-5" />
                  Momentum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {data.filter(asset => asset.pnlPercent > 0).length > data.filter(asset => asset.pnlPercent < 0).length ? 'Positivo' : 'Negativo'}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Tendencia general
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Gráficos secundarios */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  Tipo de Cambio USD/MXN
                </CardTitle>
                <p className="text-sm text-muted-foreground">Evolución del tipo de cambio</p>
              </div>
              <Badge variant="outline" className="border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-300">
                Actual: ${exchangeRate?.toFixed(4)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ExchangeRateChart />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-primary" />
                  Histórico de Precios
                </CardTitle>
                <p className="text-sm text-muted-foreground">Tendencias de tus activos</p>
              </div>
              <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">
                Múltiples activos
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <StockHistoryChart 
              tickers={data.map(asset => asset.ticker)} 
              data={{}}
            />
          </CardContent>
        </Card>
      </div>

      {/* Panel de insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <TrendingUp className="h-5 w-5" />
              Mejor Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold text-green-900 dark:text-green-100">{topPerformer?.name || 'N/A'}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                +{topPerformer?.pnlPercent?.toFixed(2) || '0.00'}%
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                ${topPerformer?.pnl?.toFixed(2) || '0.00'} de ganancia
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <TrendingDown className="h-5 w-5" />
              Menor Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold text-red-900 dark:text-red-100">{worstPerformer?.name || 'N/A'}</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {worstPerformer?.pnlPercent?.toFixed(2) || '0.00'}%
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                ${worstPerformer?.pnl?.toFixed(2) || '0.00'} de pérdida
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
