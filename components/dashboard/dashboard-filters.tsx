"use client"

import { useState, useEffect } from "react"
import { Calendar, Building2, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardFilters() {
    const [branches, setBranches] = useState<any[]>([])
    const [selectedBranchId, setSelectedBranchId] = useState<string>("all")

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await fetch('/api/branches', {
                    credentials: 'include',
                });
                if (response.ok) {
                    const result = await response.json();
                    const data = result.data || result;
                    if (Array.isArray(data)) {
                        setBranches(data);
                    }
                }
            } catch (error) {
                console.error('Error fetching branches:', error);
            }
        };

        fetchBranches();
    }, []);

    const selectedBranch = branches.find(b => b.id === selectedBranchId)
    const displayBranch = selectedBranchId === "all" ? "Todas" : (selectedBranch?.name || "Seleccionar")

    return (
        <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>Sucursal: {displayBranch}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuItem onClick={() => setSelectedBranchId("all")}>
                        <div className="flex w-full items-center justify-between">
                            <span>Todas</span>
                            {selectedBranchId === "all" && <Check className="h-4 w-4" />}
                        </div>
                    </DropdownMenuItem>
                    {branches.map(branch => (
                        <DropdownMenuItem key={branch.id} onClick={() => setSelectedBranchId(branch.id)}>
                            <div className="flex w-full items-center justify-between">
                                <span>{branch.name}</span>
                                {selectedBranchId === branch.id && <Check className="h-4 w-4" />}
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Fecha: Hoy</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>Hoy</DropdownMenuItem>
                    <DropdownMenuItem>Ayer</DropdownMenuItem>
                    <DropdownMenuItem>Últimos 7 días</DropdownMenuItem>
                    <DropdownMenuItem>Este mes</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
