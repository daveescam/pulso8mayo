"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface DayHours {
  isOpen?: boolean;
  open?: string;
  close?: string;
}

interface OperatingHoursData {
    monday?: DayHours;
    tuesday?: DayHours;
    wednesday?: DayHours;
    thursday?: DayHours;
    friday?: DayHours;
    saturday?: DayHours;
    sunday?: DayHours;
}

interface OperatingHoursPickerProps {
    value?: OperatingHoursData;
    onChange?: (value: OperatingHoursData) => void;
}

const DAYS = [
    { key: "monday", label: "Lunes" },
    { key: "tuesday", label: "Martes" },
    { key: "wednesday", label: "Miércoles" },
    { key: "thursday", label: "Jueves" },
    { key: "friday", label: "Viernes" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" }
] as const;

const DEFAULT_HOURS: OperatingHoursData = {
    monday: { isOpen: true, open: "09:00", close: "18:00" },
    tuesday: { isOpen: true, open: "09:00", close: "18:00" },
    wednesday: { isOpen: true, open: "09:00", close: "18:00" },
    thursday: { isOpen: true, open: "09:00", close: "18:00" },
    friday: { isOpen: true, open: "09:00", close: "18:00" },
    saturday: { isOpen: true, open: "09:00", close: "14:00" },
    sunday: { isOpen: false }
};

export function OperatingHoursPicker({ value, onChange }: OperatingHoursPickerProps) {
    const [hours, setHours] = useState<OperatingHoursData>(value || DEFAULT_HOURS);

    useEffect(() => {
        if (value) {
            setHours(value);
        }
    }, [value]);

    const updateDay = (dayKey: string, updates: Partial<DayHours>) => {
        const newHours = {
            ...hours,
            [dayKey]: { ...hours[dayKey as keyof OperatingHoursData], ...updates }
        };
        setHours(newHours);
        onChange?.(newHours);
    };

    const toggleDay = (dayKey: string) => {
        const currentDay = hours[dayKey as keyof OperatingHoursData];
        const newHours = {
            ...hours,
            [dayKey]: {
                ...currentDay,
                isOpen: !currentDay?.isOpen
            }
        };
        setHours(newHours);
        onChange?.(newHours);
    };

    const setAllWeekdays = (isOpen: boolean) => {
        const newHours: OperatingHoursData = {};
        DAYS.forEach(day => {
            newHours[day.key as keyof OperatingHoursData] = {
                isOpen,
                open: isOpen ? "09:00" : undefined,
                close: isOpen ? "18:00" : undefined
            };
        });
        setHours(newHours);
        onChange?.(newHours);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <div>
                        <CardTitle>Horarios de Operación</CardTitle>
                        <CardDescription>
                            Configura los horarios de apertura y cierre para cada día
                        </CardDescription>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAllWeekdays(true)}
                    >
                        Abrir todos
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAllWeekdays(false)}
                    >
                        Cerrar todos
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {DAYS.map(({ key, label }) => {
                    const dayData = hours[key as keyof OperatingHoursData] || { isOpen: false };
                    return (
                        <div
                            key={key}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={dayData.isOpen}
                                    onCheckedChange={() => toggleDay(key)}
                                />
                                <Label className="font-medium min-w-[100px]">{label}</Label>
                            </div>
                            {dayData.isOpen && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm text-muted-foreground">Apertura:</Label>
                                        <Input
                                            type="time"
                                            value={dayData.open || "09:00"}
                                            onChange={(e) => updateDay(key, { open: e.target.value })}
                                            className="w-28"
                                        />
                                    </div>
                                    <span className="text-muted-foreground">-</span>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm text-muted-foreground">Cierre:</Label>
                                        <Input
                                            type="time"
                                            value={dayData.close || "18:00"}
                                            onChange={(e) => updateDay(key, { close: e.target.value })}
                                            className="w-28"
                                        />
                                    </div>
                                </div>
                            )}
                            {!dayData.isOpen && (
                                <span className="text-sm text-muted-foreground">Cerrado</span>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
