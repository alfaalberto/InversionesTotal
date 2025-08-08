'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { CalendarIcon, Save } from 'lucide-react';
import type { Stock } from '../lib/data';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const formSchema = z.object({
  quantity: z.coerce.number().min(0, { message: 'Cantidad debe ser un número positivo.' }),
  purchasePrice: z.coerce.number().min(0, { message: 'Precio debe ser un número positivo.' }),
  purchaseDate: z.date({
    required_error: "La fecha de compra es requerida.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface EditAssetFormProps {
  asset: Pick<Stock, 'id' | 'ticker' | 'name' | 'quantity' | 'purchasePrice' | 'purchaseDate' | 'originalPurchasePrice' | 'originalCurrency'>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: Pick<Stock, 'id' | 'quantity' | 'purchasePrice' | 'purchaseDate'>) => void;
}

export function EditAssetForm({ asset, isOpen, onClose, onSubmit }: EditAssetFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // Default values are set in useEffect to avoid hydration errors.
  });

  useEffect(() => {
    if (asset) {
      form.reset({
        quantity: asset.quantity,
        purchasePrice: asset.originalPurchasePrice ?? asset.purchasePrice,
        purchaseDate: new Date(asset.purchaseDate),
      });
    }
  }, [asset, form]);


  function handleFormSubmit(values: FormValues) {
    onSubmit({
      id: asset.id,
      ...values,
      purchaseDate: values.purchaseDate.toISOString(),
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {asset.name} ({asset.ticker})</DialogTitle>
          <DialogDescription>
            Actualiza los detalles de tu activo. El precio de compra debe estar en {asset.originalCurrency || 'USD'}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
  control={form.control}
  name="purchasePrice"
  render={({ field }) => {
    const [exchangeRate, setExchangeRate] = React.useState<number | null>(null);
    const [convertedUSD, setConvertedUSD] = React.useState<number | null>(null);
    const [warning, setWarning] = React.useState<string | null>(null);
    React.useEffect(() => {
      if (asset.originalCurrency === 'MXN') {
        fetch('/api/exchange-rate?from=MXN&to=USD')
          .then(res => res.json())
          .then(data => {
            setExchangeRate(data.rate);
            if (data.rate && field.value) {
              setConvertedUSD(Number(field.value) / data.rate);
            }
          });
      } else {
        setExchangeRate(null);
        setConvertedUSD(null);
      }
    }, [field.value, asset.originalCurrency]);
    React.useEffect(() => {
      if (asset.originalCurrency !== 'MXN' && field.value > 5000) {
        setWarning('El precio parece muy alto para USD. ¿Seguro que es correcto?');
      } else {
        setWarning(null);
      }
    }, [field.value, asset.originalCurrency]);
    return (
      <FormItem>
        <FormLabel>Precio de Compra ({asset.originalCurrency || 'USD'})</FormLabel>
        <FormControl>
          <Input type="number" step="0.01" placeholder="0.00" {...field} />
        </FormControl>
        {asset.originalCurrency === 'MXN' && exchangeRate && (
          <div className="text-xs text-muted-foreground mt-1">
            Equivalente en USD: <b>${convertedUSD ? convertedUSD.toFixed(2) : '0.00'}</b> (T.C. {exchangeRate})
          </div>
        )}
        {warning && <div className="text-xs text-red-600 mt-1">{warning}</div>}
        <FormMessage />
      </FormItem>
    );
  }}
/>
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Compra</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Elige una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
