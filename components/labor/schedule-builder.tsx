"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Calendar, Clock, Users, Plus, Trash2, Save, RefreshCw } from "lucide-react";
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
}

interface Shift {
    userId: string;
    userName: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    role: string;
    notes?: string;
}

interface ScheduleBuilderProps {
    branchId: string;
    companyId: string;
}

export function ScheduleBuilder({ branchId, companyId }: ScheduleBuilderProps) {
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("08:00");
    const [endTime, setEndTime] = useState<string>("16:00");
    const [selectedRole, setSelectedRole] = useState<string>("");

    // Get week dates
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekDates = eachDayOfInterval({
        start: weekStart,
        end: addDays(weekStart, 6)
    });

    // Fetch employees
    const fetchEmployees = async () => {
        try {
            const response = await fetch(`/api/users?companyId=${companyId}&branchId=${branchId}`);
            if (response.ok) {
                const data = await response.json();
                setEmployees(data.users || []);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    // Fetch shifts for the week
    const fetchShifts = async () => {
        setLoading(true);
        try {
            const start = format(weekStart, "yyyy-MM-dd");
            const end = format(addDays(weekStart, 6), "yyyy-MM-dd");
            const response = await fetch(`/api/shifts?branchId=${branchId}&start=${start}&end=${end}`);
            if (response.ok) {
                const data = await response.json();
                setShifts(data.shifts || []);
            }
        } catch (error) {
            console.error("Error fetching shifts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (branchId && companyId) {
            fetchEmployees();
        }
    }, [branchId, companyId]);

    useEffect(() => {
        if (branchId) {
            fetchShifts();
        }
    }, [branchId, selectedWeek]);

    const handleAddShift = async () => {
        if (!selectedEmployee || !selectedDate || !startTime || !endTime) {
            toast.error("Completa todos los campos");
            return;
        }

        try {
            const response = await fetch("/api/shifts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedEmployee,
                    branchId,
                    shiftDate: selectedDate,
                    startTime,
                    endTime,
                    role: selectedRole || "EMPLEADO"
                })
            });

            if (response.ok) {
                toast.success("Turno agregado exitosamente");
                setIsDialogOpen(false);
                await fetchShifts();
                // Send shift reminder notification
                await sendShiftReminder(selectedEmployee, selectedDate, startTime);
            } else {
                const error = await response.json();
                toast.error(error.error || "Error al agregar turno");
            }
        } catch (error) {
            console.error("Error adding shift:", error);
            toast.error("Error al agregar turno");
        }
    };

    const handleDeleteShift = async (shift: Shift) => {
        try {
            const response = await fetch("/api/shifts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: shift.userId,
                    branchId,
                    shiftDate: shift.shiftDate,
                    startTime: shift.startTime
                })
            });

            if (response.ok) {
                toast.success("Turno eliminado");
                await fetchShifts();
            } else {
                toast.error("Error al eliminar turno");
            }
        } catch (error) {
            console.error("Error deleting shift:", error);
            toast.error("Error al eliminar turno");
        }
    };

    const sendShiftReminder = async (userId: string, shiftDate: string, shiftTime: string) => {
        try {
            const employee = employees.find(e => e.id === userId);
            await fetch("/api/notifications/test-whatsapp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "shift_reminder",
                    userId,
                    shiftDate: format(parseISO(shiftDate), "EEEE d 'de' MMMM", { locale: es }),
                    shiftTime,
                    branchName: "Sucursal"
                })
            });
        } catch (error) {
            console.error("Error sending shift reminder:", error);
        }
    };

    const handleBulkCreate = async () => {
        // Create shifts for all employees for the entire week
        if (!selectedRole) {
            toast.error("Selecciona un rol");
            return;
        }

        setLoading(true);
        try {
            const bulkShifts = employees.flatMap(employee =>
                weekDates.map(date => ({
                    userId: employee.id,
                    userName: employee.name,
                    shiftDate: format(date, "yyyy-MM-dd"),
                    startTime,
                    endTime,
                    role: selectedRole
                }))
            );

            const response = await fetch("/api/shifts/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shifts: bulkShifts })
            });

            if (response.ok) {
                toast.success(`${bulkShifts.length} turnos creados exitosamente`);
                await fetchShifts();
            } else {
                toast.error("Error al crear turnos masivos");
            }
        } catch (error) {
            console.error("Error in bulk create:", error);
            toast.error("Error al crear turnos masivos");
        } finally {
            setLoading(false);
        }
    };

    const getShiftForEmployee = (employeeId: string, date: Date) => {
        return shifts.find(s =>
            s.userId === employeeId &&
            isSameDay(parseISO(s.shiftDate), date)
        );
    };

    const getTotalHours = (start: string, end: string) => {
        const startParts = start.split(":").map(Number);
        const endParts = end.split(":").map(Number);
        const startMinutes = startParts[0] * 60 + startParts[1];
        const endMinutes = endParts[0] * 60 + endParts[1];
        const diff = endMinutes - startMinutes;
        return diff > 0 ? (diff / 60).toFixed(1) : "0";
    };

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
                    >
                        Anterior
                    </Button>
                    <div className="text-lg font-semibold">
                        {format(weekStart, "d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
                    >
                        Siguiente
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Turno
                    </Button>
                    <Button
                        onClick={handleBulkCreate}
                        disabled={loading || !selectedRole}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Crear Semana Completa
                    </Button>
                </div>
            </div>

            {/* Role Selector for Bulk Create */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Configuración Rápida</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="grid gap-2">
                        <Label htmlFor="role-select">Rol</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="w-[200px]" id="role-select">
                                <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EMPLEADO">Empleado</SelectItem>
                                <SelectItem value="COCINERO">Cocinero</SelectItem>
                                <SelectItem value="MESERO">Mesero</SelectItem>
                                <SelectItem value="GERENTE">Gerente</SelectItem>
                                <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="start-time">Hora Inicio</Label>
                        <Input
                            id="start-time"
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-[150px]"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="end-time">Hora Fin</Label>
                        <Input
                            id="end-time"
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-[150px]"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Schedule Grid */}
            <Card>
                <CardHeader>
                    <CardTitle>Calendario de Turnos Semanales</CardTitle>
                    <CardDescription>
                        Visualiza y gestiona los turnos de la semana
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Empleado</TableHead>
                                    {weekDates.map((date) => (
                                        <TableHead key={date} className="text-center min-w-[120px]">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-medium">
                                                    {format(date, "EEE", { locale: es })}
                                                </span>
                                                <span className="text-sm">
                                                    {format(date, "d")}
                                                </span>
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell className="font-medium">
                                            <div>
                                                <div>{employee.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {employee.role}
                                                </div>
                                            </div>
                                        </TableCell>
                                        {weekDates.map((date) => {
                                            const shift = getShiftForEmployee(employee.id, date);
                                            return (
                                                <TableCell key={date} className="text-center">
                                                    {shift ? (
                                                        <div className="relative group">
                                                            <Badge
                                                                variant="secondary"
                                                                className="cursor-pointer"
                                                            >
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {shift.startTime}-{shift.endTime}
                                                            </Badge>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handleDeleteShift(shift)}
                                                            >
                                                                <Trash2 className="h-3 w-3 text-red-600" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{shifts.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Esta semana
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Horas Totales</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {shifts.reduce((acc, shift) =>
                                acc + parseFloat(getTotalHours(shift.startTime, shift.endTime)), 0
                            ).toFixed(1)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Horas programadas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Empleados</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{employees.length}</div>
                        <p className="text-xs text-muted-foreground">
                            En esta sucursal
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Add Shift Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agregar Turno</DialogTitle>
                        <DialogDescription>
                            Agrega un turno individual para un empleado
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="employee">Empleado</Label>
                            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                <SelectTrigger id="employee">
                                    <SelectValue placeholder="Seleccionar empleado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((employee) => (
                                        <SelectItem key={employee.id} value={employee.id}>
                                            {employee.name} - {employee.role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Select value={selectedDate} onValueChange={setSelectedDate}>
                                <SelectTrigger id="date">
                                    <SelectValue placeholder="Seleccionar fecha" />
                                </SelectTrigger>
                                <SelectContent>
                                    {weekDates.map((date) => (
                                        <SelectItem key={date.toISOString()} value={format(date, "yyyy-MM-dd")}>
                                            {format(date, "EEEE d 'de' MMMM", { locale: es })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start">Hora Inicio</Label>
                                <Input
                                    id="start"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end">Hora Fin</Label>
                                <Input
                                    id="end"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="role-dialog">Rol</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger id="role-dialog">
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EMPLEADO">Empleado</SelectItem>
                                    <SelectItem value="COCINERO">Cocinero</SelectItem>
                                    <SelectItem value="MESERO">Mesero</SelectItem>
                                    <SelectItem value="GERENTE">Gerente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddShift}>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Turno
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
