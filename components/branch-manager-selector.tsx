"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserCog, Users } from "lucide-react";

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    branchId?: string | null;
}

interface BranchManagerSelectorProps {
    currentManagerId?: string | null;
    currentManager?: User | null;
    companyId: string;
    branchId: string;
    onChange?: (managerId: string | null) => void;
}

export function BranchManagerSelector({
    currentManagerId,
    currentManager,
    companyId,
    branchId,
    onChange
}: BranchManagerSelectorProps) {
    const [managers, setManagers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedManager, setSelectedManager] = useState<string | undefined>(
        currentManagerId || undefined
    );

    useEffect(() => {
        fetchManagers();
    }, [companyId, branchId]);

    useEffect(() => {
        if (currentManagerId !== undefined) {
            setSelectedManager(currentManagerId || undefined);
        }
    }, [currentManagerId]);

    async function fetchManagers() {
        try {
            const res = await fetch(`/api/branches/managers?branchId=${branchId}`);
            if (!res.ok) throw new Error("Failed to load managers");
            const response = await res.json();
            setManagers(response.data || []);
            
            // If current manager is not in the list, add it
            if (currentManager && !response.data?.find((m: User) => m.id === currentManager.id)) {
                setManagers(prev => [currentManager, ...prev]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const handleManagerChange = (value: string) => {
        const managerId = value === "none" ? null : value;
        setSelectedManager(managerId || undefined);
        onChange?.(managerId);
    };

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    <div>
                        <CardTitle>Gerente de Sucursal</CardTitle>
                        <CardDescription>
                            Asigna un gerente responsable para esta sucursal
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Seleccionar Gerente</Label>
                    <Select
                        value={selectedManager}
                        onValueChange={handleManagerChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar gerente..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin gerente asignado</SelectItem>
                            {managers.map((manager) => (
                                <SelectItem key={manager.id} value={manager.id}>
                                    <div className="flex items-center gap-2">
                                        <span>{manager.name || manager.email}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {manager.role}
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Solo usuarios con rol ADMIN o GERENTE pueden ser asignados como gerentes de sucursal.
                    </p>
                </div>

                {currentManager && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="" />
                            <AvatarFallback>{getInitials(currentManager.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-medium">{currentManager.name || "Sin nombre"}</p>
                            <p className="text-sm text-muted-foreground">{currentManager.email}</p>
                        </div>
                        <Badge>{currentManager.role}</Badge>
                    </div>
                )}

                {!currentManager && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Users className="h-4 w-4" />
                        <span>No hay un gerente asignado para esta sucursal</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
