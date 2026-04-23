"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Plus, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Holiday {
    id: string;
    name: string;
    date: string;
    description?: string | null;
}

interface HolidaysManagerProps {
    companyId: string;
}

export function HolidaysManager({ companyId }: HolidaysManagerProps) {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [newHoliday, setNewHoliday] = useState({
        name: "",
        date: "",
        description: ""
    });

    useEffect(() => {
        fetchHolidays();
    }, [companyId]);

    async function fetchHolidays() {
        try {
            const res = await fetch(`/api/holidays`);
            if (!res.ok) throw new Error("Failed to load holidays");
            const response = await res.json();
            setHolidays(response.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar días festivos");
        } finally {
            setLoading(false);
        }
    }

    async function handleAddHoliday() {
        if (!newHoliday.name || !newHoliday.date) {
            toast.error("Nombre y fecha son requeridos");
            return;
        }

        setAdding(true);
        try {
            const res = await fetch("/api/holidays", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newHoliday.name,
                    date: newHoliday.date,
                    description: newHoliday.description || undefined
                })
            });

            if (!res.ok) throw new Error("Failed to add holiday");

            toast.success("Día festivo agregado");
            setNewHoliday({ name: "", date: "", description: "" });
            setDialogOpen(false);
            fetchHolidays();
        } catch (error) {
            toast.error("Error al agregar día festivo");
        } finally {
            setAdding(false);
        }
    }

    async function handleDeleteHoliday(id: string) {
        if (!confirm("¿Estás seguro de eliminar este día festivo?")) return;

        try {
            const res = await fetch(`/api/holidays?id=${id}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("Failed to delete holiday");

            toast.success("Día festivo eliminado");
            fetchHolidays();
        } catch (error) {
            toast.error("Error al eliminar día festivo");
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <div>
                        <CardTitle>Días Festivos</CardTitle>
                        <CardDescription>
                            Gestiona los días festivos de la empresa
                        </CardDescription>
                    </div>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agregar Día Festivo</DialogTitle>
                            <DialogDescription>
                                Ingresa la información del nuevo día festivo
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input
                                    placeholder="Ej. Día de la Independencia"
                                    value={newHoliday.name}
                                    onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha</Label>
                                <Input
                                    type="date"
                                    value={newHoliday.date}
                                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción (opcional)</Label>
                                <Input
                                    placeholder="Ej. Feriado nacional"
                                    value={newHoliday.description}
                                    onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAddHoliday} disabled={adding}>
                                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Agregar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center text-muted-foreground py-4">
                        Cargando días festivos...
                    </div>
                ) : holidays.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                        No hay días festivos registrados
                    </div>
                ) : (
                    <div className="space-y-2">
                        {holidays.map((holiday) => (
                            <div
                                key={holiday.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{holiday.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(holiday.date)}
                                        </p>
                                        {holiday.description && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {holiday.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteHoliday(holiday.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
