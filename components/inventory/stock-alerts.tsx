"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AlertCircle, Package, TrendingDown, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface StockAlertData {
    itemId: string;
    itemName: string;
    sku?: string;
    category?: string;
    currentStock: number;
    minLevel: number;
    maxLevel?: number;
    unit: string;
    lastCost?: number;
    supplierName?: string;
    expirationDate?: string;
    lotNumber?: string;
    status?: string;
}

interface AlertSummary {
    lowStockCount: number;
    outOfStockCount: number;
    expiringSoonCount: number;
    expiredCount: number;
}

interface StockAlertsProps {
    branchId: string;
    onRefresh?: () => void;
}

export function StockAlerts({ branchId, onRefresh }: StockAlertsProps) {
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [alerts, setAlerts] = useState<{
        lowStock: StockAlertData[];
        outOfStock: StockAlertData[];
        expiringSoon: StockAlertData[];
        expired: StockAlertData[];
        summary: AlertSummary;
    } | null>(null);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/inventory/alerts?branchId=${branchId}`);
            if (response.ok) {
                const data = await response.json();
                setAlerts(data);
            } else {
                toast.error("Error al cargar alertas de stock");
            }
        } catch (error) {
            console.error("Error fetching alerts:", error);
            toast.error("Error al cargar alertas de stock");
        } finally {
            setLoading(false);
        }
    };

    const checkAndSendAlerts = async () => {
        setChecking(true);
        try {
            const response = await fetch(`/api/inventory/alerts/check?branchId=${branchId}`, {
                method: "POST"
            });

            if (response.ok) {
                const result = await response.json();
                toast.success(
                    `Alertas verificadas. ${result.notificationsSent} notificaciones enviadas.`
                );
                await fetchAlerts();
                onRefresh?.();
            } else {
                toast.error("Error al verificar alertas");
            }
        } catch (error) {
            console.error("Error checking alerts:", error);
            toast.error("Error al verificar alertas");
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        if (branchId) {
            fetchAlerts();
        }
    }, [branchId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (!alerts) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
                <AlertCircle className="h-6 w-6 mr-2" />
                No se pudieron cargar las alertas
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                        <TrendingDown className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{alerts.summary.lowStockCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Items por debajo del mínimo
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agotados</CardTitle>
                        <Package className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{alerts.summary.outOfStockCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Items sin stock
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
                        <Clock className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{alerts.summary.expiringSoonCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Vencen en 7 días
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{alerts.summary.expiredCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Items vencidos
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Alertas Detalladas</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={checkAndSendAlerts}
                    disabled={checking}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                    {checking ? "Verificando..." : "Verificar y Notificar"}
                </Button>
            </div>

            {/* Out of Stock */}
            {alerts.outOfStock.length > 0 && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <Package className="h-5 w-5" />
                            Productos Agotados
                        </CardTitle>
                        <CardDescription>
                            Estos productos están sin stock. Reordenar inmediatamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Proveedor</TableHead>
                                    <TableHead className="text-right">Costo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alerts.outOfStock.map((item) => (
                                    <TableRow key={item.itemId}>
                                        <TableCell className="font-medium">{item.itemName}</TableCell>
                                        <TableCell>{item.sku || "-"}</TableCell>
                                        <TableCell>{item.category || "-"}</TableCell>
                                        <TableCell>{item.supplierName || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            ${((item.lastCost || 0) / 100).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Low Stock */}
            {alerts.lowStock.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5" />
                            Stock Bajo
                        </CardTitle>
                        <CardDescription>
                            Productos por debajo del nivel mínimo recomendado
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Stock Actual</TableHead>
                                    <TableHead>Mínimo</TableHead>
                                    <TableHead>Máximo</TableHead>
                                    <TableHead>% Restante</TableHead>
                                    <TableHead>Proveedor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alerts.lowStock.map((item) => {
                                    const percentage = item.minLevel > 0
                                        ? Math.round((item.currentStock / item.minLevel) * 100)
                                        : 0;
                                    return (
                                        <TableRow key={item.itemId}>
                                            <TableCell className="font-medium">{item.itemName}</TableCell>
                                            <TableCell>
                                                <Badge variant={percentage <= 25 ? "destructive" : "secondary"}>
                                                    {item.currentStock} {item.unit}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{item.minLevel} {item.unit}</TableCell>
                                            <TableCell>{item.maxLevel || "-"} {item.unit}</TableCell>
                                            <TableCell>
                                                <Badge variant={percentage <= 25 ? "destructive" : percentage <= 50 ? "secondary" : "outline"}>
                                                    {percentage}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{item.supplierName || "-"}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Expiring Soon */}
            {alerts.expiringSoon.length > 0 && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                            <Clock className="h-5 w-5" />
                            Por Vencer Pronto
                        </CardTitle>
                        <CardDescription>
                            Productos que vencen en los próximos 7 días
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Lote</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Fecha Vencimiento</TableHead>
                                    <TableHead>Días Restantes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alerts.expiringSoon.map((item) => {
                                    const daysUntilExpiry = item.expirationDate
                                        ? Math.ceil((new Date(item.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                        : 0;
                                    return (
                                        <TableRow key={item.itemId}>
                                            <TableCell className="font-medium">{item.itemName}</TableCell>
                                            <TableCell>{item.lotNumber || "-"}</TableCell>
                                            <TableCell>{item.currentStock} {item.unit}</TableCell>
                                            <TableCell>
                                                {new Date(item.expirationDate!).toLocaleDateString("es-MX")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={daysUntilExpiry <= 3 ? "destructive" : "secondary"}>
                                                    {daysUntilExpiry} días
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Expired */}
            {alerts.expired.length > 0 && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <AlertCircle className="h-5 w-5" />
                            Productos Vencidos
                        </CardTitle>
                        <CardDescription>
                            Estos productos están vencidos. Retirar de inventario.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Lote</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Fecha Vencimiento</TableHead>
                                    <TableHead>Días Vencido</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alerts.expired.map((item) => {
                                    const daysExpired = item.expirationDate
                                        ? Math.ceil((Date.now() - new Date(item.expirationDate).getTime()) / (1000 * 60 * 60 * 24))
                                        : 0;
                                    return (
                                        <TableRow key={item.itemId}>
                                            <TableCell className="font-medium">{item.itemName}</TableCell>
                                            <TableCell>{item.lotNumber || "-"}</TableCell>
                                            <TableCell>{item.currentStock} {item.unit}</TableCell>
                                            <TableCell>
                                                {new Date(item.expirationDate!).toLocaleDateString("es-MX")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="destructive">
                                                    {daysExpired} días
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {alerts.summary.lowStockCount === 0 &&
                alerts.summary.outOfStockCount === 0 &&
                alerts.summary.expiringSoonCount === 0 &&
                alerts.summary.expiredCount === 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-green-600" />
                                Inventario Saludable
                            </CardTitle>
                            <CardDescription>
                                No hay alertas de stock en este momento
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center p-8 text-muted-foreground">
                                <AlertCircle className="h-12 w-12 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                )}
        </div>
    );
}
