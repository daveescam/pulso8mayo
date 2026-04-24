"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

interface VacationBalanceCardProps {
    userId: string;
    companyId?: string | null;
}

interface VacationBalance {
    leaveTypeName: string;
    leaveTypeDescription: string | null;
    totalEntitlement: number;
    used: number;
    pending: number;
    balance: number;
}

export function VacationBalanceCard({ userId, companyId }: VacationBalanceCardProps) {
    const [balances, setBalances] = useState<VacationBalance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalances = async () => {
            if (!userId) return;

            try {
                const response = await fetch(`/api/leave/balances?userId=${userId}&companyId=${companyId}`);
                if (response.ok) {
                    const data = await response.json();
                    setBalances(data.data || []);
                }
            } catch (error) {
                console.error("Error fetching vacation balances:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBalances();
    }, [userId, companyId]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Balance de Vacaciones
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
                    <Calendar className="h-5 w-5" />
                    Balance de Vacaciones
                </CardTitle>
                <CardDescription>
                    Días disponibles para tomar vacaciones
                </CardDescription>
            </CardHeader>
            <CardContent>
                {balances.length === 0 ? (
                    <p className="text-muted-foreground">No hay balances de vacaciones disponibles</p>
                ) : (
                    <div className="space-y-4">
                        {balances.map((balance, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{balance.leaveTypeName}</p>
                                    {balance.leaveTypeDescription && (
                                        <p className="text-sm text-muted-foreground">
                                            {balance.leaveTypeDescription}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <Badge variant={balance.balance > 0 ? "default" : "secondary"}>
                                        {balance.balance} días disponibles
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Usados: {balance.used} | Pendientes: {balance.pending}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}