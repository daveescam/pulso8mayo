"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle, XCircle } from "lucide-react";

interface EmployeeBenefitsViewProps {
    userId: string;
    companyId?: string | null;
}

interface EmployeeBenefit {
    id: string;
    benefitType: string;
    provider: string | null;
    policyNumber: string | null;
    coverageAmount: number | null;
    isActive: boolean;
    startDate: string;
    endDate: string | null;
    employeeContribution: number;
    employerContribution: number;
}

export function EmployeeBenefitsView({ userId, companyId }: EmployeeBenefitsViewProps) {
    const [benefits, setBenefits] = useState<EmployeeBenefit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBenefits = async () => {
            if (!userId) return;

            try {
                const response = await fetch(`/api/employees/${userId}/benefits`);
                if (response.ok) {
                    const data = await response.json();
                    setBenefits(data.data || []);
                }
            } catch (error) {
                console.error("Error fetching benefits:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBenefits();
    }, [userId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Mis Beneficios
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
                    <Award className="h-5 w-5" />
                    Mis Beneficios
                </CardTitle>
                <CardDescription>
                    Beneficios laborales asignados
                </CardDescription>
            </CardHeader>
            <CardContent>
                {benefits.length === 0 ? (
                    <p className="text-muted-foreground">No hay beneficios asignados</p>
                ) : (
                    <div className="space-y-4">
                        {benefits.map((benefit) => (
                            <div key={benefit.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium">{benefit.benefitType}</h4>
                                    <Badge variant={benefit.isActive ? "default" : "secondary"}>
                                        {benefit.isActive ? (
                                            <>
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Activo
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Inactivo
                                            </>
                                        )}
                                    </Badge>
                                </div>

                                {benefit.provider && (
                                    <p className="text-sm text-muted-foreground">
                                        Proveedor: {benefit.provider}
                                    </p>
                                )}

                                {benefit.policyNumber && (
                                    <p className="text-sm text-muted-foreground">
                                        Póliza: {benefit.policyNumber}
                                    </p>
                                )}

                                {benefit.coverageAmount && (
                                    <p className="text-sm text-muted-foreground">
                                        Cobertura: {formatCurrency(benefit.coverageAmount)}
                                    </p>
                                )}

                                <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                                    <span>Tu contribución: {formatCurrency(benefit.employeeContribution)}</span>
                                    <span>Contribución empresa: {formatCurrency(benefit.employerContribution)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}