'use client';

import * as React from 'react';
import { Moon, Sun, TrendingUp, DollarSign, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from './theme-provider';
import { SaveAllButton } from './SaveAllButton';

interface DashboardHeaderProps {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  exchangeRate: number | null;
  onSaveAll: () => Promise<void>;
  isSaving: boolean;
}

export function DashboardHeader({
  totalValue,
  totalPnL,
  totalPnLPercent,
  exchangeRate,
  onSaveAll,
  isSaving
}: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isPositive = totalPnL >= 0;

  return (
    <div className="space-y-6">
      {/* Header with theme toggle and save button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              InversionesTotal
            </h1>
          </div>
          <Badge variant="secondary" className="text-xs">
            Premium Dashboard
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="h-9 w-9"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
          <SaveAllButton onSave={onSaveAll} isSaving={isSaving} />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Portfolio Value */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Valor Total
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {totalValue.toLocaleString('en-US', { 
                      style: 'currency', 
                      currency: 'USD' 
                    })}
                  </p>
                  {exchangeRate && (
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {(totalValue * exchangeRate).toLocaleString('es-MX', { 
                        style: 'currency', 
                        currency: 'MXN' 
                      })}
                    </p>
                  )}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total P&L */}
        <Card className={`border-0 shadow-lg ${
          isPositive 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50'
            : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Ganancia/Pérdida
                </p>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${
                    isPositive 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {isPositive ? '+' : ''}{totalPnL.toLocaleString('en-US', { 
                      style: 'currency', 
                      currency: 'USD' 
                    })}
                  </p>
                  {exchangeRate && (
                    <p className={`text-lg font-semibold ${
                      isPositive 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isPositive ? '+' : ''}{(totalPnL * exchangeRate).toLocaleString('es-MX', { 
                        style: 'currency', 
                        currency: 'MXN' 
                      })}
                    </p>
                  )}
                </div>
                <p className={`text-sm font-medium mt-1 ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isPositive ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                isPositive 
                  ? 'bg-green-100 dark:bg-green-900/50' 
                  : 'bg-red-100 dark:bg-red-900/50'
              }`}>
                <TrendingUp className={`h-6 w-6 ${
                  isPositive 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rate */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tipo de Cambio USD/MXN
                </p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {exchangeRate ? `$${exchangeRate.toFixed(4)}` : 'Cargando...'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Actualizado hoy
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
