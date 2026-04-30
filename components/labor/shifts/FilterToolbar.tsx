"use client";

/**
 * FilterToolbar Component
 * Provides filtering and search capabilities for the shift scheduler
 */

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShiftFilters } from "@/lib/types";

interface FilterToolbarProps {
  filters: ShiftFilters;
  onFiltersChange: (filters: ShiftFilters) => void;
  branches: { id: string; name: string }[];
  roles: string[];
  conflictCount?: number;
  className?: string;
}

export function FilterToolbar({
  filters,
  onFiltersChange,
  branches,
  roles,
  conflictCount = 0,
  className,
}: FilterToolbarProps) {
  const hasActiveFilters =
    filters.search || filters.branchId || filters.role || filters.status?.length;

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg",
        className
      )}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar empleado..."
          className="pl-9"
          value={filters.search || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
        />
      </div>

      {/* Branch Filter */}
      <Select
        value={filters.branchId || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            branchId: value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Sucursal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las sucursales</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Role Filter */}
      <Select
        value={filters.role || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            role: value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Rol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los roles</SelectItem>
          {roles.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status?.[0] || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status:
              value === "all" ? undefined : ([value] as ("DRAFT" | "PUBLISHED" | "CANCELLED")[]),
          })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="DRAFT">Borrador</SelectItem>
          <SelectItem value="PUBLISHED">Publicado</SelectItem>
          <SelectItem value="CANCELLED">Cancelado</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-4 w-4" />
          Limpiar
        </Button>
      )}

      {/* Conflict Badge */}
      {conflictCount > 0 && (
        <Badge variant="destructive" className="gap-1 ml-auto">
          <AlertTriangle className="h-3 w-3" />
          {conflictCount} conflicto{conflictCount !== 1 ? "s" : ""}
        </Badge>
      )}
    </div>
  );
}
