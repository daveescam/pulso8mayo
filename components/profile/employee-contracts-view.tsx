"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmployeeContractsViewProps {
    userId: string;
    companyId?: string | null;
}

interface EmployeeContract {
    id: string;
    contractNumber: string;
    contractType: string;
    workRegime: string;
    startDate: string;
    endDate: string | null;
    baseSalary: number;
    monthlySalary: number | null;
    status: string;
    hasHealthInsurance: boolean | null;
    hasLifeInsurance: boolean | null;
    hasSavingsFund: boolean | null;
    hasFoodVouchers: boolean | null;
    hasTransportationBonus: boolean | null;
}

export function EmployeeContractsView({ userId, companyId }: EmployeeContractsViewProps) {
    const [contracts, setContracts] = useState<EmployeeContract[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContracts = async () => {
            if (!userId) return;

            try {
                const response = await fetch(`/api/employees/${userId}/contracts`);
                if (response.ok) {
                    const data = await response.json();
                    setContracts(data.data || []);
                }
            } catch (error) {
                console.error("Error fetching contracts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContracts();
    }, [userId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const getContractStatusBadge = (status: string) => {
        const statusConfig = {
            ACTIVE: { variant: "default" as const, label: "Activo" },
            PENDING: { variant: "secondary" as const, label: "Pendiente" },
            EXPIRED: { variant: "destructive" as const, label: "Expirado" },
            TERMINATED: { variant: "destructive" as const, label: "Terminado" }
        };
        return statusConfig[status as keyof typeof statusConfig] || { variant: "secondary" as const, label: status };
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Mis Contratos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Mis Contratos
                </CardTitle>
                <CardDescription>
                    Historial de contratos laborales
                </CardDescription>
            </CardHeader>
            <CardContent>
                {contracts.length === 0 ? (
                    <p className="text-muted-foreground">No hay contratos disponibles</p>
                ) : (
                    <div className="space-y-4">
                        {contracts.map((contract) => {
                            const statusBadge = getContractStatusBadge(contract.status);
                            return (
                                <div key={contract.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium">{contract.contractNumber}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {contract.contractType} - {contract.workRegime}
                                            </p>
                                        </div>
                                        <Badge variant={statusBadge.variant}>
                                            {statusBadge.label}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <p className="text-sm font-medium">Fecha de inicio</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(contract.startDate), "dd/MM/yyyy", { locale: es })}
                                            </p>
                                        </div>
                                        {contract.endDate && (
                                            <div>
                                                <p className="text-sm font-medium">Fecha de fin</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(contract.endDate), "dd/MM/yyyy", { locale: es })}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <p className="text-sm font-medium">Salario base mensual</p>
                                        <p className="text-lg font-semibold">
                                            {formatCurrency(contract.monthlySalary || contract.baseSalary)}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {contract.hasHealthInsurance && (
                                            <Badge variant="outline">Seguro médico</Badge>
                                        )}
                                        {contract.hasLifeInsurance && (
                                            <Badge variant="outline">Seguro de vida</Badge>
                                        )}
                                        {contract.hasSavingsFund && (
                                            <Badge variant="outline">Fondo de ahorro</Badge>
                                        )}
                                        {contract.hasFoodVouchers && (
                                            <Badge variant="outline">Vales de despensa</Badge>
                                        )}
                                        {contract.hasTransportationBonus && (
                                            <Badge variant="outline">Bono transporte</Badge>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-1" />
                                            Ver contrato
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Download className="h-4 w-4 mr-1" />
                                            Descargar
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}