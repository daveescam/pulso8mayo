"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, Search, Package, X } from "lucide-react";
import { BarcodeScannerComponent } from "./barcode-scanner";
import { toast } from "sonner";

interface ScannerModalProps {
    items?: Array<{
        id: string;
        name: string;
        sku?: string;
        barcode?: string;
        unit?: string;
        stock?: number;
    }>;
    onItemSelected?: (item: any) => void;
    trigger?: React.ReactNode;
}

export function ScannerModal({ items = [], onItemSelected, trigger }: ScannerModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [manualCode, setManualCode] = useState("");
    const [scannedItem, setScannedItem] = useState<any>(null);

    // Find item by barcode
    const findItemByBarcode = (barcode: string) => {
        return items.find(item => 
            item.barcode === barcode || 
            item.sku === barcode
        );
    };

    // Handle barcode scanned
    const handleBarcodeScanned = (barcode: string) => {
        const item = findItemByBarcode(barcode);
        
        if (item) {
            setScannedItem(item);
            toast.success(`Item encontrado: ${item.name}`);
            
            if (onItemSelected) {
                onItemSelected(item);
            }
        } else {
            toast.error(`Item no encontrado para código: ${barcode}`);
            setScannedItem(null);
        }
        
        setIsScannerOpen(false);
    };

    // Handle manual code entry
    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!manualCode.trim()) {
            toast.error("Ingresa un código");
            return;
        }

        const item = findItemByBarcode(manualCode.trim());
        
        if (item) {
            setScannedItem(item);
            toast.success(`Item encontrado: ${item.name}`);
            
            if (onItemSelected) {
                onItemSelected(item);
            }
        } else {
            toast.error(`Item no encontrado para código: ${manualCode}`);
            setScannedItem(null);
        }
    };

    // Reset state
    const resetState = () => {
        setScannedItem(null);
        setManualCode("");
        setIsScannerOpen(false);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) resetState();
            }}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant="outline" className="gap-2">
                            <Scan className="w-4 h-4" />
                            Escanear / Buscar Item
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5" />
                            Buscar Item por Código
                        </DialogTitle>
                        <DialogDescription>
                            Escanea un código de barras o ingresa el código manualmente
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Manual Entry Form */}
                        <form onSubmit={handleManualSearch} className="space-y-2">
                            <Label htmlFor="manualCode">Código del Item</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="manualCode"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="Ingresa el código de barras o SKU"
                                    className="flex-1"
                                />
                                <Button type="submit" variant="secondary">
                                    <Search className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>

                        {/* Scanner Button */}
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                onClick={() => setIsScannerOpen(true)}
                                className="flex-1 gap-2"
                                variant="outline"
                            >
                                <Scan className="w-4 h-4" />
                                Abrir Escáner de Código de Barras
                            </Button>
                        </div>

                        {/* Scanned Item Result */}
                        {scannedItem && (
                            <div className="p-4 border rounded-lg bg-card space-y-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">{scannedItem.name}</h3>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setScannedItem(null)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                <div className="grid gap-2 text-sm">
                                    {scannedItem.sku && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">SKU:</span>
                                            <span className="font-mono">{scannedItem.sku}</span>
                                        </div>
                                    )}
                                    {scannedItem.barcode && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Código de Barras:</span>
                                            <span className="font-mono">{scannedItem.barcode}</span>
                                        </div>
                                    )}
                                    {scannedItem.unit && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Unidad:</span>
                                            <span>{scannedItem.unit}</span>
                                        </div>
                                    )}
                                    {scannedItem.stock !== undefined && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Stock:</span>
                                            <span className="font-semibold">{scannedItem.stock} {scannedItem.unit}</span>
                                        </div>
                                    )}
                                </div>

                                {onItemSelected && (
                                    <Button
                                        onClick={() => {
                                            onItemSelected(scannedItem);
                                            setIsOpen(false);
                                        }}
                                        className="w-full"
                                    >
                                        Seleccionar Item
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Info */}
                        {!scannedItem && (
                            <div className="text-center text-sm text-muted-foreground py-4">
                                <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>
                                    Escanea un código de barras o ingrésalo manualmente para buscar el item
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Barcode Scanner Dialog */}
            <Dialog open={isScannerOpen} onOpenChange={(open) => {
                setIsScannerOpen(open);
                if (!open) {
                    // Don't reset scanned item when closing scanner
                }
            }}>
                <DialogContent className="max-w-md p-0">
                    <BarcodeScannerComponent
                        onScan={handleBarcodeScanned}
                        onClose={() => setIsScannerOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
