'use client';

import { useState, useEffect } from 'react';
import { ScheduleList } from '@/components/schedules/schedule-list';
import { ScheduleStats } from '@/components/schedules/schedule-stats';
import { ScheduleForm } from '@/components/schedules/schedule-form';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Plus, FilterX } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SchedulesPage() {
    const router = useRouter();
    const [branchId, setBranchId] = useState<string>('');
    const [branches, setBranches] = useState<any[]>([]);
    const [filters, setFilters] = useState<{
        isActive?: boolean;
        frequency?: string;
        assignmentType?: string;
    }>({});
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        // Fetch user's branches
        const fetchBranches = async () => {
            try {
                const response = await fetch('/api/branches', {
                    credentials: 'include',
                });

                if (response.ok) {
                    const result = await response.json();
                    const data = result.data || result;
                    setBranches(data);

                    // Set first branch as default
                    if (Array.isArray(data) && data.length > 0 && !branchId) {
                        setBranchId(data[0].id);
                    }
                }
            } catch (error) {
                console.error('Error fetching branches:', error);
            }
        };

        fetchBranches();
    }, []);

    const handleEdit = (schedule: any) => {
        setSelectedSchedule(schedule);
        setIsFormOpen(true);
    };

    const handleDelete = (scheduleId: string) => {
        setRefreshKey((prev) => prev + 1);
    };

    const handleToggle = (scheduleId: string, isActive: boolean) => {
        setRefreshKey((prev) => prev + 1);
    };

    const handleCreateNew = () => {
        setSelectedSchedule(null);
        setIsFormOpen(true);
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setSelectedSchedule(null);
        setRefreshKey((prev) => prev + 1);
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setSelectedSchedule(null);
    };

    const clearFilters = () => {
        setFilters({});
    };

    const hasFilters = Object.values(filters).some(v => v !== undefined);

    if (!branchId) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Programación de Workflows</h1>
                        <p className="text-muted-foreground">
                            Gestiona la ejecución automática de workflows
                        </p>
                    </div>
                    <Button onClick={handleCreateNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Schedule
                    </Button>
                </div>

                {/* Stats */}
                <ScheduleStats branchId={branchId} />

                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                    <Select value={branchId} onValueChange={setBranchId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Sucursal" />
                        </SelectTrigger>
                        <SelectContent>
                            {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.isActive === undefined ? 'all' : filters.isActive ? 'true' : 'false'}
                        onValueChange={(value) =>
                            setFilters({
                                ...filters,
                                isActive: value === 'all' ? undefined : value === 'true',
                            })
                        }
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="true">Activos</SelectItem>
                            <SelectItem value="false">Inactivos</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.frequency || 'all'}
                        onValueChange={(value) =>
                            setFilters({ ...filters, frequency: value === 'all' ? undefined : value })
                        }
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Frecuencia" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="DAILY">Diario</SelectItem>
                            <SelectItem value="WEEKLY">Semanal</SelectItem>
                            <SelectItem value="MONTHLY">Mensual</SelectItem>
                            <SelectItem value="ONCE">Una vez</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.assignmentType || 'all'}
                        onValueChange={(value) =>
                            setFilters({ ...filters, assignmentType: value === 'all' ? undefined : value })
                        }
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Asignación" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="ROLE">Por rol</SelectItem>
                            <SelectItem value="USER">Por usuario</SelectItem>
                            <SelectItem value="AUTO">Automática</SelectItem>
                        </SelectContent>
                    </Select>

                    {hasFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                            <FilterX className="h-4 w-4 mr-2" />
                            Limpiar filtros
                        </Button>
                    )}
                </div>

                {/* Schedule List */}
                <ScheduleList
                    key={refreshKey}
                    branchId={branchId}
                    filters={filters}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                />
            </div>

            {/* Schedule Form Sheet */}
            <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {selectedSchedule ? 'Editar Schedule' : 'Crear Nuevo Schedule'}
                        </SheetTitle>
                        <SheetDescription>
                            {selectedSchedule
                                ? 'Actualiza la configuración del schedule automático'
                                : 'Configura un nuevo schedule para ejecutar workflows automáticamente'}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <ScheduleForm
                            schedule={selectedSchedule}
                            branchId={branchId}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
