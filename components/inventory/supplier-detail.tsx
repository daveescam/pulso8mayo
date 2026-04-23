"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Building2, 
    Mail, 
    Phone, 
    MapPin, 
    FileText,
    Calendar,
    Edit,
    X
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Supplier {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

interface SupplierDetailProps {
    supplier: Supplier;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: () => void;
}

export function SupplierDetail({ supplier, open, onOpenChange, onEdit }: SupplierDetailProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl">{supplier.name}</DialogTitle>
                            <DialogDescription>
                                Información detallada del proveedor
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {!supplier.active && (
                                <Badge variant="destructive">Inactivo</Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Información Básica
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {supplier.taxId && (
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">RFC:</span>
                                    <span className="text-sm text-muted-foreground">{supplier.taxId}</span>
                                </div>
                            )}
                            {supplier.contactName && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Contacto:</span>
                                    <span className="text-sm text-muted-foreground">{supplier.contactName}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Información de Contacto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {supplier.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Email:</span>
                                    <a 
                                        href={`mailto:${supplier.email}`}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        {supplier.email}
                                    </a>
                                </div>
                            )}
                            {supplier.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Teléfono:</span>
                                    <a 
                                        href={`tel:${supplier.phone}`}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        {supplier.phone}
                                    </a>
                                </div>
                            )}
                            {supplier.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Dirección:</span>
                                    <span className="text-sm text-muted-foreground">{supplier.address}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Metadata */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Información del Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Creado:</span>
                                <span>{format(new Date(supplier.createdAt), "dd MMM yyyy", { locale: es })}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Última actualización:</span>
                                <span>{format(new Date(supplier.updatedAt), "dd MMM yyyy HH:mm", { locale: es })}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Purchase History Placeholder */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Historial de Compras</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground text-center py-4">
                                El historial de compras estará disponible próximamente.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cerrar
                    </Button>
                    <Button
                        onClick={() => {
                            onOpenChange(false);
                            onEdit?.();
                        }}
                        className="gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Editar Proveedor
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
