"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scan, PackagePlus, Trash2, CheckCircle, AlertCircle, Loader2, Barcode } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReceivingItem {
    itemId: string;
    itemName: string;
    sku?: string;
    quantity: number;
    batchNumber: string;
    expirationDate?: string;
    productionDate?: string;
    unitCost?: number;
    unit?: string;
    temperature?: number | "";
    ocrData?: boolean;
}

interface ReceivingWorkflowProps {
    suppliers?: Array<{ id: string; name: string }>;
    items?: Array<{ id: string; name: string; sku?: string; unit?: string; barcode?: string }>;
    onComplete?: (receiving: any) => void;
}

export function ReceivingWorkflow({ suppliers = [], items = [], onComplete }: ReceivingWorkflowProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOCRing, setIsOCRing] = useState(false);
    const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<string>("");
    const [purchaseOrderNumber, setPurchaseOrderNumber] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [scanMode, setScanMode] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState("");

    // Add item to receiving list
    const addItem = useCallback(() => {
        setReceivingItems(prev => [
            ...prev,
            {
                itemId: "",
                itemName: "",
                quantity: 0,
                batchNumber: `BATCH-${Date.now()}`,
                expirationDate: "",
                productionDate: "",
                unitCost: 0,
                temperature: "",
            }
        ]);
    }, []);

    // Handle OCR file upload via Moondream
    const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            setIsOCRing(true);
            try {
                const response = await fetch('/api/inventory/ocr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: reader.result })
                });
                const res = await response.json();
                
                if (!response.ok) throw new Error(res.error || 'Failed to process OCR');
                
                if (res.data?.items) {
                    const newItems: ReceivingItem[] = res.data.items.map((ocrItem: any) => {
                        // Find matching item by name roughly
                        const matchedItem = items.find(i => i.name.toLowerCase().includes(String(ocrItem.name).toLowerCase()));
                        return {
                            itemId: matchedItem ? matchedItem.id : "",
                            itemName: ocrItem.name || "Desconocido",
                            quantity: Number(ocrItem.quantity) || 1,
                            batchNumber: `BATCH-OCR-${Date.now()}`,
                            expirationDate: "",
                            unitCost: Number(ocrItem.unitPrice) || 0,
                            temperature: "",
                            ocrData: true,
                        };
                    });
                    
                    setReceivingItems(prev => [...prev, ...newItems]);
                    toast.success("Factura escaneada y productos agregados");
                    if (res.data.poNumber) setPurchaseOrderNumber(res.data.poNumber);
                } else {
                    toast.warning("No se encontraron productos en la imagen");
                }
            } catch (error: any) {
                console.error("OCR Error:", error);
                toast.error(error.message || "Error al procesar la imagen con OCR");
            } finally {
                setIsOCRing(false);
                // clear the input
                e.target.value = '';
            }
        };
        reader.readAsDataURL(file);
    };

    // Remove item from list
    const removeItem = useCallback((index: number) => {
        setReceivingItems(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Update item field
    const updateItem = useCallback((index: number, field: keyof ReceivingItem, value: any) => {
        setReceivingItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            
            // If updating itemId, also update itemName and unit from the items list
            if (field === "itemId") {
                const selectedItem = items.find(item => item.id === value);
                if (selectedItem) {
                    updated[index].itemName = selectedItem.name;
                    updated[index].sku = selectedItem.sku;
                    updated[index].unit = selectedItem.unit;
                }
            }
            
            return updated;
        });
    }, [items]);

    // Handle barcode scanning
    const handleBarcodeScanned = useCallback((barcode: string) => {
        const foundItem = items.find(item => item.barcode === barcode);
        if (foundItem) {
            // Add or update item in receiving list
            const existingIndex = receivingItems.findIndex(
                item => item.itemId === foundItem.id && !item.quantity
            );
            
            if (existingIndex >= 0) {
                updateItem(existingIndex, "quantity", 1);
            } else {
                setReceivingItems(prev => [
                    ...prev,
                    {
                        itemId: foundItem.id,
                        itemName: foundItem.name,
                        sku: foundItem.sku,
                        quantity: 1,
                        batchNumber: `BATCH-${Date.now()}`,
                        expirationDate: "",
                        unit: foundItem.unit,
                    }
                ]);
            }
            toast.success(`Item escaneado: ${foundItem.name}`);
        } else {
            toast.error("Barcode no encontrado");
        }
        setScannedBarcode("");
    }, [items, receivingItems, updateItem]);

    // Handle keyboard input for barcode scanner
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" && scanMode && scannedBarcode) {
            e.preventDefault();
            handleBarcodeScanned(scannedBarcode);
        }
    }, [scanMode, scannedBarcode, handleBarcodeScanned]);

    // Submit receiving
    const handleSubmit = async () => {
        // Validate
        if (receivingItems.length === 0) {
            toast.error("Agrega al menos un item");
            return;
        }

        const invalidItems = receivingItems.filter(item => !item.itemId || item.quantity <= 0);
        if (invalidItems.length > 0) {
            toast.error("Completa todos los campos requeridos (item y cantidad)");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/inventory/receiving", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: receivingItems.map(item => ({
                        itemId: item.itemId,
                        quantity: item.quantity,
                        batchNumber: item.batchNumber,
                        expirationDate: item.expirationDate || undefined,
                        productionDate: item.productionDate || undefined,
                        unitCost: item.unitCost,
                        temperature: item.temperature !== "" ? Number(item.temperature) : undefined,
                    })),
                    supplierId: selectedSupplier || undefined,
                    purchaseOrderId: purchaseOrderNumber || undefined,
                    notes: notes || undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to process receiving");
            }

            toast.success("Recepción completada exitosamente");
            
            if (onComplete) {
                onComplete(result.receiving);
            }

            // Reset form
            setReceivingItems([]);
            setSelectedSupplier("");
            setPurchaseOrderNumber("");
            setNotes("");
            setIsDialogOpen(false);

        } catch (error: any) {
            console.error("Receiving error:", error);
            toast.error(error.message || "Error al procesar recepción");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="gap-2">
                        <PackagePlus className="w-4 h-4" />
                        Nueva Recepción
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Recepción de Inventario</DialogTitle>
                        <DialogDescription>
                            Registra la recepción de items. Escanea barcodes o ingresa manualmente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Header Info */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="supplier">Proveedor</Label>
                                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar proveedor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(supplier => (
                                            <SelectItem key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="po">Orden de Compra (Opcional)</Label>
                                <Input
                                    id="po"
                                    placeholder="PO-2024-001"
                                    value={purchaseOrderNumber}
                                    onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Scan Mode Toggle */}
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant={scanMode ? "default" : "outline"}
                                size="sm"
                                onClick={() => setScanMode(!scanMode)}
                                className="gap-2"
                            >
                                <Barcode className="w-4 h-4" />
                                Modo Escaneo: {scanMode ? "ON" : "OFF"}
                            </Button>
                            {scanMode && (
                                <Input
                                    placeholder="Escanear barcode..."
                                    value={scannedBarcode}
                                    onChange={(e) => setScannedBarcode(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="max-w-xs"
                                    autoFocus
                                />
                            )}
                            
                            <div className="ml-auto">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    id="ocr-upload" 
                                    onChange={handleOCRUpload} 
                                    disabled={isOCRing}
                                />
                                <Label htmlFor="ocr-upload" className={cn("cursor-pointer", isOCRing && "opacity-50 cursor-not-allowed")}>
                                    <div className="flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
                                        {isOCRing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                                        {isOCRing ? "Analizando IA..." : "Escanear Remisión (OCR)"}
                                    </div>
                                </Label>
                            </div>
                        </div>

                        {/* Items List */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Items a Recibir</CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addItem}
                                        className="gap-2"
                                    >
                                        <PackagePlus className="w-4 h-4" />
                                        Agregar Item
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {receivingItems.length === 0 ? (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            No hay items agregados. Usa "Agregar Item" o escanea un barcode.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    receivingItems.map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-4 border rounded-lg space-y-3 bg-card"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 grid gap-3 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label>Item *</Label>
                                                        <Select
                                                            value={item.itemId}
                                                            onValueChange={(value) => updateItem(index, "itemId", value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Seleccionar item" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {items.map(i => (
                                                                    <SelectItem key={i.id} value={i.id}>
                                                                        {i.name} {i.sku && `(${i.sku})`}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Cantidad ({item.unit || 'units'}) *</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity || ""}
                                                            onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(index)}
                                                    className="shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="grid gap-3 md:grid-cols-3">
                                                <div className="space-y-2">
                                                    <Label>Batch / Lote</Label>
                                                    <Input
                                                        value={item.batchNumber}
                                                        onChange={(e) => updateItem(index, "batchNumber", e.target.value)}
                                                        placeholder="BATCH-001"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Fecha de Caducidad</Label>
                                                    <Input
                                                        type="date"
                                                        value={item.expirationDate || ""}
                                                        onChange={(e) => updateItem(index, "expirationDate", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Costo Unitario</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unitCost || ""}
                                                        onChange={(e) => updateItem(index, "unitCost", Number(e.target.value))}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Temp. (°C)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        value={item.temperature ?? ""}
                                                        onChange={(e) => updateItem(index, "temperature", e.target.value === "" ? "" : Number(e.target.value))}
                                                        placeholder="Ej. 4.0"
                                                        className={cn(typeof item.temperature === 'number' && item.temperature > 4 ? "border-destructive focus-visible:ring-destructive" : "")}
                                                    />
                                                </div>
                                            </div>

                                            {typeof item.temperature === 'number' && item.temperature > 4 && (
                                                <Alert variant="destructive" className="mt-2 py-2">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription className="text-xs">
                                                        Temperatura fuera de rango ( &gt; 4°C ). Este producto será enviado a <strong>CUARENTENA</strong> (Auto-rechazo).
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas / Comentarios</Label>
                            <textarea
                                id="notes"
                                className="w-full min-h-[80px] p-3 border rounded-md bg-background text-sm resize-y"
                                placeholder="Notas adicionales sobre esta recepción..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || receivingItems.length === 0}
                            className="gap-2"
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
