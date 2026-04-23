'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Package, AlertTriangle, Calendar, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Batch {
  id: string;
  lotNumber: string | null;
  currentQuantity: number;
  expirationDate: Date | null;
  branchName: string;
  status: string;
}

interface LotSelectorProps {
  itemId: string;
  branchId: string;
  quantity: number;
  onSelect: (batchId: string, quantity: number) => void;
}

export function LotSelector({ itemId, branchId, quantity, onSelect }: LotSelectorProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string>('');

  useEffect(() => {
    fetchBatches();
  }, [itemId, branchId]);

  const fetchBatches = async () => {
    try {
      const params = new URLSearchParams({
        itemId,
        branchId,
        status: 'AVAILABLE',
      });

      const response = await fetch(`/api/inventory/batches?${params}`);
      if (response.ok) {
        const data = await response.json();
        // Sort by expiration date (FIFO)
        const sorted = data.batches.sort((a: Batch, b: Batch) => {
          if (!a.expirationDate) return 1;
          if (!b.expirationDate) return -1;
          return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
        });
        setBatches(sorted);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiration = (expirationDate: Date | null) => {
    if (!expirationDate) return null;
    const now = new Date();
    const exp = new Date(expirationDate);
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpirationBadge = (days: number | null) => {
    if (days === null) {
      return <Badge variant="secondary">Sin vencimiento</Badge>;
    }
    if (days < 0) {
      return <Badge variant="destructive">Vencido ({Math.abs(days)} días)</Badge>;
    }
    if (days <= 7) {
      return <Badge variant="destructive">Vence en {days} días</Badge>;
    }
    if (days <= 30) {
      return <Badge variant="warning">Vence en {days} días</Badge>;
    }
    return <Badge variant="secondary">Vence en {days} días</Badge>;
  };

  const handleSelect = () => {
    if (selectedBatch) {
      onSelect(selectedBatch, quantity);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Cargando lotes disponibles...</p>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">No hay lotes disponibles</p>
          <p className="text-xs text-muted-foreground mt-1">
            No se encontraron lotes con stock para este producto
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Seleccionar Lote (FIFO)</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {batches.length} lote(s) disponible(s) - Ordenados por fecha de vencimiento
          </p>
        </div>
        <Badge variant="outline">{quantity} unidades a despachar</Badge>
      </div>

      <RadioGroup value={selectedBatch} onValueChange={setSelectedBatch} className="space-y-3">
        {batches.map((batch) => {
          const days = getDaysUntilExpiration(batch.expirationDate);
          const isExpired = days !== null && days < 0;
          const isExpiringSoon = days !== null && days >= 0 && days <= 7;
          const hasEnoughStock = batch.currentQuantity >= quantity;

          return (
            <Label
              key={batch.id}
              htmlFor={batch.id}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedBatch === batch.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${isExpired || !hasEnoughStock ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RadioGroupItem
                id={batch.id}
                value={batch.id}
                disabled={isExpired || !hasEnoughStock}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">
                      Lote: {batch.lotNumber || 'N/A'}
                    </span>
                  </div>
                  {getExpirationBadge(days)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{batch.branchName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {batch.expirationDate
                        ? new Date(batch.expirationDate).toLocaleDateString('es-MX')
                        : 'Sin fecha'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isExpiringSoon && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-xs">Próximo a vencer</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className={hasEnoughStock ? 'text-green-600' : 'text-red-600'}>
                      {batch.currentQuantity} {batch.currentQuantity === 1 ? 'unidad' : 'unidades'}
                    </span>
                    {!hasEnoughStock && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (Stock insuficiente)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Label>
          );
        })}
      </RadioGroup>

      <button
        onClick={handleSelect}
        disabled={!selectedBatch}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Confirmar Selección de Lote
      </button>
    </div>
  );
}
