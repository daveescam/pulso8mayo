"use client";

import { createProduct, updateProduct } from "@/app/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar Producto"}
        </Button>
    );
}

interface ProductFormProps {
    suppliers?: { id: string; name: string }[];
    initialData?: any;
}

export function ProductForm({ suppliers = [], initialData }: ProductFormProps) {
    const action = initialData ? updateProduct.bind(null, initialData.id) : createProduct;
    // Divide cost by 100 for display if exists
    const defaultCost = initialData?.lastCost ? (initialData.lastCost / 100).toFixed(2) : "";

    return (
        <form action={action} className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/inventory">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Nuevo Producto</h1>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Producto</Label>
                        <Input id="name" name="name" placeholder="Ej: Harina de Trigo" required defaultValue={initialData?.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sku">SKU (Opcional)</Label>
                            <Input id="sku" name="sku" placeholder="HAR-001" defaultValue={initialData?.sku} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría</Label>
                            <Select name="category" defaultValue={initialData?.category}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ingredientes">Ingredientes Secos</SelectItem>
                                    <SelectItem value="frescos">Frescos / Perecederos</SelectItem>
                                    <SelectItem value="limpieza">Limpieza</SelectItem>
                                    <SelectItem value="empaque">Empaque</SelectItem>
                                    <SelectItem value="equipamiento">Equipamiento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unidad de Medida</Label>
                            <Select name="unit" defaultValue={initialData?.unit || "UNIT"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UNIT">Pieza / Unidad</SelectItem>
                                    <SelectItem value="KG">Kilogramos (KG)</SelectItem>
                                    <SelectItem value="L">Litros (L)</SelectItem>
                                    <SelectItem value="BOX">Caja</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minLevel">Stock Mínimo (Alerta)</Label>
                            <Input id="minLevel" name="minLevel" type="number" min="0" placeholder="0" defaultValue={initialData?.minLevel} />
                        </div>
                    </div>

                    {/* Supplier and Cost Section */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="space-y-2">
                            <Label htmlFor="supplierId">Proveedor Preferido</Label>
                            <Select name="supplierId" defaultValue={initialData?.supplierId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar Proveedor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.length > 0 ? (
                                        suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            No hay proveedores registrados
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastCost">Costo Unitario (Estándar)</Label>
                            <Input id="lastCost" name="lastCost" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={defaultCost} />
                            <p className="text-[10px] text-muted-foreground">Se guardará en historial de precios.</p>
                        </div>
                    </div>

                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Link href="/dashboard/inventory">
                    <Button variant="outline" type="button">Cancelar</Button>
                </Link>
                <SubmitButton />
            </div>
        </form>
    );
}
