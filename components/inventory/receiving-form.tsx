"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scan, PackagePlus, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ReceivingFormProps {
    itemId: string;
    itemName: string;
    itemUnit?: string;
    suppliers?: Array<{ id: string; name: string }>;
    onSuccess?: () => void;
}

export function ReceivingForm({ itemId, itemName, itemUnit = "UNIT", suppliers = [], onSuccess }: ReceivingFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        quantity: "",
        batchNumber: `BATCH-${Date.now()}`,
        expirationDate: "",
        supplierId: suppliers[0]?.id || "",
        unitCost: "",
        notes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.quantity || Number(formData.quantity) <= 0) {
            toast.error("Ingresa una cantidad válida");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/inventory/receiving", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: [{
                        itemId,
                        quantity: Number(formData.quantity),
                        batchNumber: formData.batchNumber,
                        expirationDate: formData.expirationDate || undefined,
                        unitCost: formData.unitCost ? Number(formData.unitCost) : undefined,
                    }],
                    supplierId: formData.supplierId || undefined,
                    notes: formData.notes || undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to process receiving");
            }

            toast.success(`Stock recibido: ${formData.quantity} ${itemUnit}`);
            
            // Reset form
            setFormData({
                quantity: "",
                batchNumber: `BATCH-${Date.now()}`,
                expirationDate: "",
                supplierId: suppliers[0]?.id || "",
                unitCost: "",
                notes: "",
            });

            if (onSuccess) {
                onSuccess();
            }

        } catch (error: any) {
            console.error("Receiving error:", error);
            toast.error(error.message || "Error al recibir stock");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <PackagePlus className="w-5 h-5" />
                    Recibir Stock - {itemName}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Cantidad ({itemUnit}) *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                placeholder="0"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="batchNumber">Batch / Lote</Label>
                            <Input
                                id="batchNumber"
                                value={formData.batchNumber}
                                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                                placeholder="BATCH-001"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="expirationDate">Fecha de Caducidad</Label>
                            <Input
                                id="expirationDate"
                                type="date"
                                value={formData.expirationDate}
                                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="supplierId">Proveedor</Label>
                            <select
                                id="supplierId"
                                className="w-full border rounded-md p-2 text-sm bg-background"
                                value={formData.supplierId}
                                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                            >
                                <option value="">Seleccionar proveedor</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="unitCost">Costo Unitario</Label>
                            <Input
                                id="unitCost"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.unitCost}
                                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas</Label>
                            <Input
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Notas opcionales"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting || !formData.quantity}
                        className="w-full gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Confirmar Recepción
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
