'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';

const wasteFormSchema = z.object({
  batchId: z.string().min(1, 'Selecciona un lote'),
  itemId: z.string().min(1, 'Selecciona un producto'),
  quantity: z.coerce.number().min(1, 'Cantidad debe ser mayor a 0'),
  unit: z.string().min(1, 'Unidad es requerida'),
  reason: z.enum(['EXPIRED', 'DAMAGED', 'QUALITY', 'SPILLAGE', 'OTHER']),
  costPerUnit: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type WasteFormValues = z.infer<typeof wasteFormSchema>;

interface WasteFormProps {
  branchId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WasteForm({ branchId, onSuccess, onCancel }: WasteFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<WasteFormValues>({
    resolver: zodResolver(wasteFormSchema),
    defaultValues: {
      batchId: '',
      itemId: '',
      quantity: 1,
      unit: 'UNIT',
      reason: 'EXPIRED',
      costPerUnit: 0,
      notes: '',
    },
  });

  const quantity = form.watch('quantity');
  const costPerUnit = form.watch('costPerUnit');
  const totalLoss = quantity * (costPerUnit || 0);

  async function onSubmit(data: WasteFormValues) {
    try {
      setSubmitting(true);

      const response = await fetch('/api/inventory/waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          branchId,
          totalLoss,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al registrar merma');
      }

      const result = await response.json();

      toast.success('Merma registrada exitosamente', {
        description: `Se registraron ${data.quantity} unidades como merma`,
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting waste form:', error);
      toast.error('Error al registrar merma', {
        description: 'No se pudo completar el registro. Intenta de nuevo.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <h3 className="text-lg font-medium">Registrar Merma</h3>
            <p className="text-sm text-muted-foreground">
              Registra productos vencidos, dañados o con problemas de calidad
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="itemId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Producto</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* This should be populated from API */}
                    <SelectItem value="item1">Producto 1</SelectItem>
                    <SelectItem value="item2">Producto 2</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="batchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lote</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un lote" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* This should be populated from API */}
                    <SelectItem value="batch1">Lote 001</SelectItem>
                    <SelectItem value="batch2">Lote 002</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="UNIT">Unidades</SelectItem>
                    <SelectItem value="KG">Kilogramos</SelectItem>
                    <SelectItem value="L">Litros</SelectItem>
                    <SelectItem value="BOX">Cajas</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="EXPIRED">Caducidad</SelectItem>
                    <SelectItem value="DAMAGED">Dañado</SelectItem>
                    <SelectItem value="QUALITY">Calidad</SelectItem>
                    <SelectItem value="SPILLAGE">Derrame</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="costPerUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Costo por Unidad (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Deja en blanco si no deseas calcular la pérdida económica
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {totalLoss > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">
                Pérdida Estimada: ${totalLoss.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Agrega notas adicionales sobre esta merma..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Registrando...' : 'Registrar Merma'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
