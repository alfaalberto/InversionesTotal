'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { getExchangeFromTicker } from '@/lib/data';
import { useState, useRef } from 'react';
import { fetchCompanyName } from '@/lib/fetchCompanyName';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import type { Stock } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const formSchema = z.object({
  ticker: z.string().min(1, { message: 'Ticker es requerido.' }).max(10),
  quantity: z.coerce.number().min(0, { message: 'Cantidad debe ser un número positivo.' }),
  purchasePrice: z.coerce.number().min(0, { message: 'Precio debe ser un número positivo.' }),
  currency: z.enum(['USD', 'MXN'], { required_error: 'La moneda es requerida.' }),
  purchaseDate: z.date({
    required_error: "La fecha de compra es requerida.",
  }),
  
});

type FormValues = z.infer<typeof formSchema>;

interface AddAssetFormProps {
  onAddAsset: (asset: Omit<Stock, 'id' | 'currentPrice' | 'logoUrl'> & Partial<Pick<Stock, 'name'>>) => void;
}

export function AddAssetForm({ onAddAsset }: AddAssetFormProps) {
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const lastTickerRef = useRef<string>('');
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: '',
      quantity: 0,
      purchasePrice: 0,
      currency: 'USD',
    },
  });

  useEffect(() => {
    form.reset({
      ...form.getValues(),
      purchaseDate: new Date(),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: FormValues) {
    let name = companyName;
    // Si el nombre no se ha buscado, intenta buscarlo ahora
    if (!name && values.ticker) {
      setIsSearching(true);
      name = await fetchCompanyName(values.ticker.toUpperCase());
      setIsSearching(false);
    }
    onAddAsset({
      ticker: values.ticker.toUpperCase(),
      quantity: values.quantity,
      purchasePrice: values.purchasePrice,
      name: name || values.ticker.toUpperCase(),
  currency: values.currency,
  purchaseDate: values.purchaseDate.toISOString(),
  exchange: getExchangeFromTicker(values.ticker),
});
    form.reset({
      ticker: '',
      quantity: 0,
      purchasePrice: 0,
      currency: 'USD',
      purchaseDate: new Date(),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end p-4 border-t">
        <FormField
          control={form.control}
          name="ticker"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ticker</FormLabel>
              <FormControl>
                <Input placeholder="Ej. AAPL" {...field}
  onChange={async (e) => {
    const value = e.target.value.toUpperCase();
    field.onChange(value);
    setCompanyName(null);
    if (value.length >= 1 && value !== lastTickerRef.current) {
      setIsSearching(true);
      lastTickerRef.current = value;
      const name = await fetchCompanyName(value);
      setCompanyName(name);
      setIsSearching(false);
    }
  }}
/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio de Compra</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem className="w-full lg:w-32">
              <FormLabel>Moneda</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona moneda" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="MXN">MXN</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full lg:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Activo
        </Button>
      </form>
    </Form>
  );
}
