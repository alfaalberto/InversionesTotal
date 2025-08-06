
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
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Stock } from '@/lib/data';
import { AddAssetForm } from './add-asset-form';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditAssetForm } from './edit-asset-form';
import Image from 'next/image';

type PortfolioTableRow = Stock & {
  currentValue: number;
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

export const columns = (
  onEdit: (asset: PortfolioTableRow) => void,
  onDelete: (assetId: string) => void
): ColumnDef<PortfolioTableRow>[] => [
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
      const logoUrlWithKey = row.original.logoUrl
        ? `${row.original.logoUrl}?apiKey=${process.env.NEXT_PUBLIC_POLYGON_API_KEY}`
        : undefined;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 text-xs">
            {logoUrlWithKey ? (
              <Image src={logoUrlWithKey} alt={row.original.name} width={32} height={32} />
            ) : (
              <AvatarFallback>{row.original.ticker.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <div className="font-medium">
            <div>{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.ticker}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'purchaseDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Fecha de Compra
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-left">
        {format(new Date(row.original.purchaseDate), 'dd/MM/yyyy')}
      </div>
    ),
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-right w-full"
        >
          Cantidad
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-right">{row.original.quantity}</div>
    ),
  },
  {
    accessorKey: "costBasis",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right w-full"
        >
          Costo Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="text-right">{formatCurrency(row.original.costBasis, row.original.originalCurrency ?? row.original.currency)}</div>,
  },
  {
    accessorKey: 'currentValue',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-right w-full"
        >
          Valor de Mercado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-right">
        {formatCurrency(row.original.currentValue, 'USD')}
      </div>
    ),
  },
  {
    accessorKey: 'pnl',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-right w-full"
        >
          Ganancia/Pérdida
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isPositive = row.original.pnl >= 0;
      return (
        <div
          className={`text-right font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatCurrency(row.original.pnl, 'USD')}
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
          className="text-right w-full"
        >
          Retorno
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isPositive = row.original.pnlPercent >= 0;
      return (
        <div
          className={`flex items-center justify-end font-medium ${
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
          className="text-right w-full"
        >
          % del Portafolio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.portfolioShare.toFixed(2)}%
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const asset = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
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
      );
    },
  },
];

interface PortfolioTableProps {
  data: PortfolioTableRow[];
  onAddAsset: (
    asset: Omit<Stock, 'id' | 'currentPrice' | 'logoUrl' | 'name'>
  ) => void;
  onEditAsset: (
    asset: Pick<Stock, 'id' | 'quantity' | 'purchasePrice' | 'purchaseDate'>
  ) => void;
  onDeleteAsset: (assetId: string) => void;
  isLoading: boolean;
}

export function PortfolioTable({
  data,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  isLoading,
}: PortfolioTableProps) {
  const [
    editingAsset,
    setEditingAsset,
  ] = React.useState<PortfolioTableRow | null>(null);

  const tableColumns = React.useMemo(
    () => columns(setEditingAsset, onDeleteAsset),
    [onDeleteAsset]
  );

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
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Activos del Portafolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      return (
                        <TableHead key={header.id}>
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
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="p-2 md:p-4">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
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
