'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Save } from 'lucide-react';
import type { Stock } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
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
  asset: Pick<Stock, 'id' | 'ticker' | 'name' | 'quantity' | 'purchasePrice' | 'purchaseDate'>;
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
        purchasePrice: asset.purchasePrice,
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
            Actualiza los detalles de tu activo.
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
