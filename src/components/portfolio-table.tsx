
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Snowflake,
  RotateCcw,
} from 'lucide-react';

import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Stock } from '../lib/data';
import { AddAssetForm } from './add-asset-form';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { EditAssetForm } from './edit-asset-form';
import Image from 'next/image';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

type PortfolioTableRow = Omit<Stock, 'name'> & {
  name: string;
  currentValue: number;
  currentValueMXN?: number;
  pnl: number;
  pnlPercent: number;
  portfolioShare: number;
  purchaseValue: number;
  costBasis: number;
};

const formatCurrency = (value: number, currency: 'USD' | 'MXN') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Helper centralizado para visualización consistente de moneda
function FormatMonetaryValue({
  value,
  displayCurrency,
  exchangeRate,
  label
}: {
  value: number,
  displayCurrency: 'USD' | 'MXN',
  exchangeRate: number | null,
  label: string
}) {
  console.log(`💱 FormatMonetaryValue render:`, { value, displayCurrency, exchangeRate, label });
  
  // TODOS los valores en BD están en USD - conversión simple
  let displayValue = value;
  let tooltip = '';
  
  if (displayCurrency === 'MXN' && exchangeRate) {
    displayValue = value * exchangeRate;
    tooltip = `💵 Valor original (USD): ${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}\n💰 Convertido (MXN): ${displayValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}\n📊 Tipo de cambio: ${exchangeRate.toFixed(4)}`;
  } else {
    displayValue = value; // Ya está en USD
    tooltip = `💵 Valor en USD: ${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
  }
  
  const formattedValue = displayValue.toLocaleString(
    displayCurrency === 'USD' ? 'en-US' : 'es-MX', 
    { style: 'currency', currency: displayCurrency }
  );
  
  console.log(`💱 FormatMonetaryValue result:`, { formattedValue, displayValue, tooltip });
  
  return (
    <div className="text-right flex items-center gap-1 justify-end">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-mono">{formattedValue}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span style={{ whiteSpace: 'pre-line' }}>{tooltip}</span>
        </TooltipContent>
      </Tooltip>
      {displayCurrency === 'MXN' && exchangeRate && (
        <span className="text-xs text-blue-600 font-semibold ml-1">TC: {exchangeRate.toFixed(2)}</span>
      )}
    </div>
  );
}

export const columns = (
  onEdit: (asset: PortfolioTableRow) => void,
  onDelete: (assetId: string) => void,
  marketValueCurrency: 'USD' | 'MXN' = 'USD',
  exchangeRate: number | null = null,
  setMarketValueCurrency?: (currency: 'USD' | 'MXN') => void,
  onFreezeAsset?: (assetId: string, frozenPrice: number, source: string) => void,
  onUnfreezeAsset?: (assetId: string) => void
): ColumnDef<PortfolioTableRow>[] => {
  console.log('🔄 Columns recreated with currency:', marketValueCurrency, 'exchangeRate:', exchangeRate);
  
  return [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Activo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const logoUrl = `https://companiesmarketcap.com/img/company-logos/64/${row.original.ticker}.png`;
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState<string | null>(null);
      const [apiSource, setApiSource] = React.useState<'polygon' | 'finnhub'>('polygon');
      const [lastSource, setLastSource] = React.useState<string | null>(null);

      const handleUpdatePrice = async () => {
        setLoading(true);
        setError(null);
        setLastSource(null);
        let price: number | null = null;
        let source: string | null = null;
        try {
          // Llama al endpoint seguro del servidor
          const res = await fetch(`/api/price?ticker=${encodeURIComponent(row.original.ticker)}&source=${apiSource}`);
          const data = await res.json();
          if (res.ok && data.price && !isNaN(data.price)) {
            price = data.price;
            source = apiSource === 'polygon' ? 'Polygon.io' : 'Finnhub.io';
          } else {
            // fallback: intenta la otra fuente
            const fallback = apiSource === 'polygon' ? 'finnhub' : 'polygon';
            const res2 = await fetch(`/api/price?ticker=${encodeURIComponent(row.original.ticker)}&source=${fallback}`);
            const data2 = await res2.json();
            if (res2.ok && data2.price && !isNaN(data2.price)) {
              price = data2.price;
              source = fallback === 'polygon' ? 'Polygon.io' : 'Finnhub.io';
            }
          }
          if (price && price > 0) {
            // Si el activo está congelado, no actualizar el precio
            if (row.original.isFrozen) {
              setError('Activo congelado. Descongela primero para actualizar.');
              return;
            }
            
            row.original.currentPrice = price;
            if (row.original.currency === 'MXN' && exchangeRate) {
              // Si es MXN, convertir a USD para almacenar
              row.original.currentValue = (price / exchangeRate) * row.original.quantity;
            } else {
              row.original.currentValue = price * row.original.quantity;
            }
            setLastSource(source);
            if (typeof window !== 'undefined' && typeof (window as any).__updatePriceRow === 'function') {
              (window as any).__updatePriceRow(row.original.id, price);
            }
          } else {
            setError('No se pudo obtener el precio.');
          }
        } catch (e) {
          setError('Error al actualizar precio.');
        }
        setLoading(false);
      };

      const handleFreezePrice = async () => {
        if (!onFreezeAsset) return;
        
        setLoading(true);
        setError('');
        
        try {
          // Usar la misma lógica que handleUpdatePrice para obtener el precio
          let price: number | null = null;
          let source: string | null = null;
          
          // Llama al endpoint seguro del servidor
          const res = await fetch(`/api/price?ticker=${encodeURIComponent(row.original.ticker)}&source=${apiSource}`);
          const data = await res.json();
          if (res.ok && data.price && !isNaN(data.price)) {
            price = data.price;
            source = apiSource === 'polygon' ? 'Polygon.io' : 'Finnhub.io';
          } else {
            // fallback: intenta la otra fuente
            const fallback = apiSource === 'polygon' ? 'finnhub' : 'polygon';
            const res2 = await fetch(`/api/price?ticker=${encodeURIComponent(row.original.ticker)}&source=${fallback}`);
            const data2 = await res2.json();
            if (res2.ok && data2.price && !isNaN(data2.price)) {
              price = data2.price;
              source = fallback === 'polygon' ? 'Polygon.io' : 'Finnhub.io';
            }
          }
          
          if (price && price > 0 && source) {
            // Congelar con el precio actualizado
            onFreezeAsset(row.original.id, price, source);
            setLastSource(`${source} (congelado)`);
          } else {
            setError('No se pudo obtener el precio para congelar.');
          }
        } catch (e) {
          setError('Error al congelar precio.');
        }
        setLoading(false);
      };

      const handleUnfreeze = () => {
        if (!onUnfreezeAsset) return;
        onUnfreezeAsset(row.original.id);
        setLastSource('');
        setError('');
      };

      return (
        <div className="flex items-center justify-start gap-3 min-w-[280px] px-2">
          <Avatar className="h-10 w-10 text-xs flex-shrink-0">
            <AvatarImage src={logoUrl} alt={row.original.name} />
            <AvatarFallback className="text-xs font-semibold">{row.original.ticker.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-left">{row.original.name}</span>
              {row.original.isFrozen && (
                <Tooltip>
                  <TooltipTrigger>
                    <Snowflake className="h-3 w-3 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Precio congelado</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-medium text-left">{row.original.ticker}</span>
            {row.original.isFrozen && row.original.frozenDate && (
              <span className="text-xs text-blue-600 font-medium">
                Congelado: {new Date(row.original.frozenDate).toLocaleDateString()}
              </span>
            )}
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <select
                className="px-1 py-0.5 text-xs rounded border border-accent-foreground bg-background"
                value={apiSource}
                onChange={e => setApiSource(e.target.value as 'polygon' | 'finnhub')}
                disabled={loading}
                title="Selecciona fuente de precio"
              >
                <option value="polygon">Polygon.io</option>
                <option value="finnhub">Finnhub.io</option>
              </select>
              
              {!row.original.isFrozen ? (
                <>
                  <button
                    type="button"
                    className="px-2 py-1 text-xs rounded bg-accent hover:bg-accent/70 transition-colors border border-accent-foreground"
                    onClick={handleUpdatePrice}
                    disabled={loading}
                    title="Actualizar valor de mercado"
                  >
                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Actualizar'}
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    onClick={handleFreezePrice}
                    disabled={loading}
                    title="Congelar precio actual"
                  >
                    <Snowflake className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                  onClick={handleUnfreeze}
                  disabled={loading}
                  title="Descongelar precio"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
            </div>
            {loading && (
              <div className="text-xs text-blue-500 mt-1">
                Actualizando...
              </div>
            )}
            {error && (
              <div className="text-xs text-red-500 mt-1">
                {error}
              </div>
            )}
            {lastSource && (
              <div className="text-xs text-green-600 mt-1">
                ✓ {lastSource}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'purchaseDate',
    size: 120, // Ancho reducido para la columna
    header: ({ column }) => {
      return (
        <div className="w-28 mx-auto">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="text-center w-full px-1"
          >
            <span className="font-semibold text-xs">Fecha de Compra</span>
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="w-28 mx-auto text-center">
        <span className="font-medium text-sm">
          {format(new Date(row.original.purchaseDate), 'dd/MM/yyyy')}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'quantity',
    size: 100, // Ancho reducido para la columna
    header: ({ column }) => {
      return (
        <div className="w-20 mx-auto">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="text-center w-full px-1"
          >
            <span className="font-semibold text-xs">Cantidad</span>
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="w-20 mx-auto text-center">
        <span className="font-semibold text-sm">
          {row.original.quantity.toLocaleString()}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "costBasis",
    size: 140, // Ancho reducido para la columna
    header: ({ column }) => {
      return (
        <div className="w-32 mx-auto">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="text-center w-full px-1"
            >
              <span className="font-semibold text-xs">Costo Total</span>
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-pointer text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">i</text></svg>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Cada fila representa una operación individual, normalizada en USD al momento de la compra. No se recalculan ni alteran operaciones previas, aunque sean del mismo ticker.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-xs text-muted-foreground text-center mt-1">(USD)</div>
        </div>
      )
    },
    cell: ({ row }) => {
      console.log('💰 CostBasis cell render:', { value: row.original.costBasis, currency: marketValueCurrency, rate: exchangeRate });
      return (
        <div className="w-32 mx-auto text-center">
          <FormatMonetaryValue
            key={`costBasis-USD-${row.original.id}`}
            value={row.original.costBasis}
            displayCurrency="USD"
            exchangeRate={null}
            label="Costo Total"
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'currentValue',
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-1 justify-center w-full">
          <span className="font-semibold">Valor de Mercado {marketValueCurrency}</span>
          {marketValueCurrency === 'MXN' && exchangeRate && (
            <span className="text-xs text-muted-foreground">(TC: {exchangeRate.toFixed(2)})</span>
          )}
          <button
            type="button"
            className="ml-1 px-1 py-0.5 rounded bg-accent text-xs border border-accent-foreground hover:bg-accent/70"
            onClick={() => {
              console.log('🔄 Toggle clicked! Current:', marketValueCurrency, 'Will change to:', marketValueCurrency === 'MXN' ? 'USD' : 'MXN');
              if (typeof setMarketValueCurrency === 'function') {
                const newCurrency = marketValueCurrency === 'MXN' ? 'USD' : 'MXN';
                console.log('🔄 Calling setMarketValueCurrency with:', newCurrency);
                setMarketValueCurrency(newCurrency);
              } else {
                console.error('❌ setMarketValueCurrency is not a function!');
              }
            }}
            title={`Mostrar en ${marketValueCurrency === 'MXN' ? 'USD' : 'MXN'}`}
          >
            {marketValueCurrency}
          </button>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      );
    },
    cell: ({ row }) => {
      // Usar precio congelado si está disponible
      const effectivePrice = row.original.isFrozen && row.original.frozenPrice 
        ? row.original.frozenPrice 
        : row.original.currentPrice;
      // Mantener valor en USD y delegar conversión a FormatMonetaryValue
      // Si el activo es MXN, convertir precio a USD usando TC
      const currentValueUSD = (row.original.currency === 'MXN' && exchangeRate)
        ? (effectivePrice / exchangeRate) * row.original.quantity
        : effectivePrice * row.original.quantity;

      return (
        <div className="flex items-center gap-2">
          <FormatMonetaryValue
            value={currentValueUSD}
            displayCurrency={marketValueCurrency}
            exchangeRate={exchangeRate}
            label="Valor de Mercado"
          />
          {row.original.isFrozen && (
            <Tooltip>
              <TooltipTrigger>
                <Snowflake className="h-3 w-3 text-blue-500" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p>Precio congelado: ${row.original.frozenPrice?.toFixed(2)}</p>
                  <p>Fecha: {row.original.frozenDate ? new Date(row.original.frozenDate).toLocaleDateString() : 'N/A'}</p>
                  <p>Fuente: {row.original.frozenSource || 'N/A'}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'pnl',
    size: 160, // Ancho reducido para la columna
    header: ({ column }) => {
      return (
        <div className="w-36 mx-auto">
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="text-center w-full px-1"
            >
              <span className="font-semibold text-xs">Ganancia/Pérdida</span>
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground text-center mt-1">
            ({marketValueCurrency})
            {marketValueCurrency === 'MXN' && exchangeRate && (
              <span className="ml-1">TC: {exchangeRate.toFixed(2)}</span>
            )}
          </div>
        </div>
      );
    },
    cell: ({ row }) => {
      // Calcular PnL en USD en tiempo de render, consistente con valor de mercado
      const effectivePrice = row.original.isFrozen && row.original.frozenPrice
        ? row.original.frozenPrice
        : row.original.currentPrice;
      const currentValueUSD = (row.original.currency === 'MXN' && exchangeRate)
        ? (effectivePrice / exchangeRate) * row.original.quantity
        : effectivePrice * row.original.quantity;
      const pnlUSD = currentValueUSD - row.original.costBasis;
      console.log('📊 PnL cell render (computed):', { pnlUSD, currency: marketValueCurrency, rate: exchangeRate });
      const isPositive = pnlUSD >= 0;
      return (
        <div className="w-36 mx-auto text-center">
          <FormatMonetaryValue
            key={`pnl-${marketValueCurrency}-${row.original.id}`}
            value={pnlUSD}
            displayCurrency={marketValueCurrency}
            exchangeRate={exchangeRate}
            label="Ganancia/Pérdida"
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'pnlPercent',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-center w-full"
        >
          <span className="font-semibold">Retorno</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isPositive = row.original.pnlPercent >= 0;
      return (
        <div
          className={`flex items-center justify-center font-semibold text-sm ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 mr-1" />
          )}
          {row.original.pnlPercent.toFixed(2)}%
        </div>
      );
    },
  },
  {
    accessorKey: 'portfolioShare',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-center w-full"
        >
          <span className="font-semibold">% del Portafolio</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-center font-semibold">
        {row.original.portfolioShare.toFixed(2)}%
      </div>
    ),
  },
  {
    id: 'actions',
    header: () => (
      <div className="text-center font-semibold">
        Acciones
      </div>
    ),
    cell: ({ row }) => {
      const asset = row.original;
      return (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent/50">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(asset)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(asset.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
};

interface PortfolioTableProps {
  data: PortfolioTableRow[];
  onAddAsset: (
    asset: Omit<Stock, 'id' | 'currentPrice' | 'logoUrl' | 'name'>
  ) => void;
  onEditAsset: (
    asset: Pick<Stock, 'id' | 'quantity' | 'purchasePrice' | 'purchaseDate'>
  ) => void;
  onDeleteAsset: (assetId: string) => void;
  onFreezeAsset?: (assetId: string, frozenPrice: number, source: string) => void;
  onUnfreezeAsset?: (assetId: string) => void;
  isLoading: boolean;
  highlightedRowId?: string | null;
  marketValueCurrency?: 'USD' | 'MXN';
  exchangeRate?: number | null;
  // Callback to send calculated totals to dashboard
  onTotalsCalculated?: (totals: {
    totalCostBasis: number;
    totalCurrentValue: number;
    totalPnL: number;
    totalPnLPercent: number;
  }) => void;
}

export function PortfolioTable({
  data,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  onFreezeAsset,
  onUnfreezeAsset,
  isLoading,
  highlightedRowId,
  exchangeRate = null,
  onTotalsCalculated,
}: PortfolioTableProps) {
  const [
    editingAsset,
    setEditingAsset,
  ] = React.useState<PortfolioTableRow | null>(null);

  const [marketValueCurrencyState, setMarketValueCurrencyState] = React.useState<'USD' | 'MXN'>('USD');
  
  // Debug logging para el estado
  React.useEffect(() => {
    console.log('🏦 PortfolioTable state changed:', { marketValueCurrencyState, exchangeRate });
  }, [marketValueCurrencyState, exchangeRate]);
  
  // Wrapper para setMarketValueCurrencyState con logging
  const handleCurrencyChange = React.useCallback((newCurrency: 'USD' | 'MXN') => {
    console.log('🔄 handleCurrencyChange called:', { from: marketValueCurrencyState, to: newCurrency });
    setMarketValueCurrencyState(newCurrency);
  }, [marketValueCurrencyState]);

  // Calculate totals and send to dashboard
  const portfolioTotals = React.useMemo(() => {
    const totalCostBasis = data.reduce((sum, asset) => sum + asset.costBasis, 0);
    const totalCurrentValue = data.reduce((sum, asset) => {
      const effectivePrice = asset.isFrozen && asset.frozenPrice
        ? asset.frozenPrice
        : asset.currentPrice;
      // Normalizar a USD siempre; si el activo es MXN y hay TC, convertir a USD
      const valueUSD = (asset.currency === 'MXN' && exchangeRate)
        ? (effectivePrice / exchangeRate) * asset.quantity
        : effectivePrice * asset.quantity;
      return sum + valueUSD;
    }, 0);
    const totalPnL = totalCurrentValue - totalCostBasis;
    const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

    return {
      totalCostBasis,
      totalCurrentValue,
      totalPnL,
      totalPnLPercent,
    };
  }, [data, exchangeRate]);

  // Send calculated totals to dashboard
  React.useEffect(() => {
    if (onTotalsCalculated && portfolioTotals) {
      onTotalsCalculated(portfolioTotals);
    }
  }, [onTotalsCalculated, portfolioTotals]);

  const tableColumns = React.useMemo(() => {
    console.log('🔄 Recalculando columnas de tabla con:', { marketValueCurrencyState, exchangeRate });
    return columns(
      setEditingAsset,
      onDeleteAsset,
      marketValueCurrencyState,
      exchangeRate,
      handleCurrencyChange,
      onFreezeAsset,
      onUnfreezeAsset
    );
  }, [marketValueCurrencyState, exchangeRate, setEditingAsset, onDeleteAsset, handleCurrencyChange, onFreezeAsset, onUnfreezeAsset]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: data.length > 0 ? data.length : 10,
      },
    },
  });

  React.useEffect(() => {
    table.setPageSize(data.length > 0 ? data.length : 10);
  }, [data.length, table]);

  const handleEditSubmit = (
    values: Pick<Stock, 'id' | 'quantity' | 'purchasePrice' | 'purchaseDate'>
  ) => {
    onEditAsset(values);
    setEditingAsset(null);
  };

  return (
    <>
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="font-headline text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Activos del Portafolio
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Gestiona y visualiza todos tus activos de inversión con conversión automática de moneda
          </p>
        </CardHeader>
        <CardContent className="px-6">
          <div className="w-full overflow-x-auto rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm">
            <Table className="w-full min-w-[1200px] rounded-lg" key={`table-${marketValueCurrencyState}-${exchangeRate}`}>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id} className="">
                    {headerGroup.headers.map(header => {
                      return (
                        <TableHead key={header.id} className="text-center font-semibold text-xs px-3 py-4 bg-muted/50 border-b-2 border-border/20 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableColumns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex justify-center items-center">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Cargando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  <>
                    {table.getRowModel().rows.map(row => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        className={`transition-colors hover:bg-muted/40 odd:bg-muted/20 ${highlightedRowId && row.original.id === highlightedRowId ? 'ring-2 ring-primary/40 bg-primary/5' : ''}`}
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id} className="text-center align-middle px-3 py-3 text-sm border-b border-border/10">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {/* Total Row */}
                    <TableRow className="bg-gradient-to-r from-muted/40 via-muted/30 to-muted/40 border-t-2 border-primary/20 font-semibold">
                      <TableCell className="text-center align-middle px-3 py-4 text-sm font-bold">
                        <div className="flex items-center justify-center gap-2">
                          <span>TOTAL</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle px-3 py-4 text-sm"></TableCell>
                      <TableCell className="text-center align-middle px-3 py-4 text-sm"></TableCell>
                      <TableCell className="text-center align-middle px-3 py-4 text-sm"></TableCell>
                      <TableCell className="text-center align-middle px-3 py-4 text-sm font-bold">
                        <div className="w-32 mx-auto text-center">
                          <div className="text-xs text-muted-foreground mb-1 font-medium">Costo Total</div>
                          <FormatMonetaryValue
                            value={data.reduce((sum, asset) => sum + asset.costBasis, 0)}
                            displayCurrency={marketValueCurrencyState}
                            exchangeRate={exchangeRate}
                            label="Total Costo"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle px-3 py-4 text-sm font-bold">
                        <div className="flex flex-col items-center gap-1 justify-center">
                          <div className="text-xs text-muted-foreground font-medium">Valor Total</div>
                          <FormatMonetaryValue
                            value={data.reduce((sum, asset) => {
                              const effectivePrice = asset.isFrozen && asset.frozenPrice 
                                ? asset.frozenPrice 
                                : asset.currentPrice;
                              const currentValueUSD = (asset.currency === 'MXN' && exchangeRate)
                                ? (effectivePrice / exchangeRate) * asset.quantity
                                : effectivePrice * asset.quantity;
                              return sum + currentValueUSD;
                            }, 0)}
                            displayCurrency={marketValueCurrencyState}
                            exchangeRate={exchangeRate}
                            label="Total Valor de Mercado"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle px-3 py-4 text-sm font-bold">
                        <div className="flex flex-col items-center gap-1 justify-center">
                          <div className="text-xs text-muted-foreground font-medium">Ganancia/Pérdida</div>
                          <div className="flex items-center gap-1">
                            {(() => {
                              const totalCostBasis = data.reduce((sum, asset) => sum + asset.costBasis, 0);
                              const totalCurrentValue = data.reduce((sum, asset) => {
                                const effectivePrice = asset.isFrozen && asset.frozenPrice 
                                  ? asset.frozenPrice 
                                  : asset.currentPrice;
                                const valueUSD = (asset.currency === 'MXN' && exchangeRate)
                                  ? (effectivePrice / exchangeRate) * asset.quantity
                                  : effectivePrice * asset.quantity;
                                return sum + valueUSD;
                              }, 0);
                              const totalPnL = totalCurrentValue - totalCostBasis;
                              const totalPnLPercentage = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;
                              
                              return (
                                <>
                                  <FormatMonetaryValue
                                    value={totalPnL}
                                    displayCurrency={marketValueCurrencyState}
                                    exchangeRate={exchangeRate}
                                    label="Total P&L"
                                  />
                                  <span className={`text-xs ml-1 ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ({totalPnLPercentage >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}%)
                                  </span>
                                  {totalPnL >= 0 ? (
                                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle px-3 py-4 text-sm"></TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={tableColumns.length}
                      className="h-24 text-center"
                    >
                      No hay resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <AddAssetForm onAddAsset={onAddAsset} />
      </Card>
      {editingAsset && (
        <EditAssetForm
          asset={editingAsset}
          isOpen={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </>
  );
}
