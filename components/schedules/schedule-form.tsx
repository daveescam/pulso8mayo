'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createScheduleSchema } from '@/lib/validations/workflow-scheduling';

interface WorkflowTemplate {
    id: string;
    name: string;
    description?: string;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface ScheduleFormProps {
    schedule?: any; // For editing
    branchId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

type ScheduleFormValues = z.infer<typeof createScheduleSchema>;

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
];

export function ScheduleForm({ schedule, branchId, onSuccess, onCancel }: ScheduleFormProps) {
    const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(createScheduleSchema),
        defaultValues: schedule
            ? {
                templateId: schedule.templateId,
                branchId: schedule.branchId,
                assignmentType: schedule.assignmentType,
                assignedRole: schedule.assignedRole,
                assignedUserId: schedule.assignedUserId,
                frequency: schedule.frequency,
                dayOfWeek: schedule.dayOfWeek,
                dayOfMonth: schedule.dayOfMonth,
                timeOfDay: schedule.timeOfDay,
                startDate: schedule.startDate,
                endDate: schedule.endDate,
                title: schedule.title,
                description: schedule.description,
                priority: schedule.priority || 'MEDIUM',
            }
            : {
                branchId,
                assignmentType: 'AUTO',
                frequency: 'DAILY',
                priority: 'MEDIUM',
                startDate: new Date().toISOString(),
            },
    });

    const assignmentType = form.watch('assignmentType');
    const frequency = form.watch('frequency');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch templates
                const templatesRes = await fetch('/api/workflows/templates', {
                    credentials: 'include',
                });
                if (templatesRes.ok) {
                    const templatesData = await templatesRes.json();
                    setTemplates(templatesData.data || []);
                }

                // Fetch users for the branch
                const usersRes = await fetch(`/api/users?branchId=${branchId}`, {
                    credentials: 'include',
                });
                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    setUsers(usersData.data?.data || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [branchId]);

    const onSubmit = async (data: ScheduleFormValues) => {
        setSubmitting(true);
        try {
            const url = schedule
                ? `/api/workflows/schedules/${schedule.id}`
                : '/api/workflows/schedules';

            const method = schedule ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to save schedule');
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert(error instanceof Error ? error.message : 'Error al guardar el schedule');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Template Selector */}
                <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Plantilla de Workflow *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una plantilla" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {templates.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Workflow que se ejecutará automáticamente
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Title */}
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título *</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Control de Temperaturas Diario" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Descripción opcional del schedule"
                                    {...field}
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Frequency */}
                <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Frecuencia *</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="DAILY" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Diario</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="WEEKLY" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Semanal</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="MONTHLY" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Mensual</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="ONCE" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Una vez</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Day of Week (if WEEKLY) */}
                {frequency === 'WEEKLY' && (
                    <FormField
                        control={form.control}
                        name="dayOfWeek"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Día de la Semana *</FormLabel>
                                <Select
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    defaultValue={field.value?.toString()}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un día" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {DAYS_OF_WEEK.map((day) => (
                                            <SelectItem key={day.value} value={day.value.toString()}>
                                                {day.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Day of Month (if MONTHLY) */}
                {frequency === 'MONTHLY' && (
                    <FormField
                        control={form.control}
                        name="dayOfMonth"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Día del Mes *</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="31"
                                        placeholder="1-31"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        value={field.value || ''}
                                    />
                                </FormControl>
                                <FormDescription>Día del mes (1-31)</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Time of Day */}
                <FormField
                    control={form.control}
                    name="timeOfDay"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Hora de Ejecución</FormLabel>
                            <FormControl>
                                <Input
                                    type="time"
                                    {...field}
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormDescription>Formato 24 horas (HH:MM)</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Assignment Type */}
                <FormField
                    control={form.control}
                    name="assignmentType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Asignación *</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="AUTO" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Automática (asignar al usuario disponible)
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="ROLE" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Por Rol</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="USER" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Usuario Específico</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="MANUAL" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Manual (asignar después)
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Assigned Role (if ROLE) */}
                {assignmentType === 'ROLE' && (
                    <FormField
                        control={form.control}
                        name="assignedRole"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rol Asignado *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un rol" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                                        <SelectItem value="GERENTE">Gerente</SelectItem>
                                        <SelectItem value="EMPLEADO">Empleado</SelectItem>
                                        <SelectItem value="ADMIN">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Assigned User (if USER) */}
                {assignmentType === 'USER' && (
                    <FormField
                        control={form.control}
                        name="assignedUserId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Usuario Asignado *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un usuario" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name} ({user.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Priority */}
                <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prioridad</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona prioridad" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="LOW">Baja</SelectItem>
                                    <SelectItem value="MEDIUM">Media</SelectItem>
                                    <SelectItem value="HIGH">Alta</SelectItem>
                                    <SelectItem value="URGENT">Urgente</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Start Date */}
                <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Inicio *</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full pl-3 text-left font-normal',
                                                !field.value && 'text-muted-foreground'
                                            )}
                                        >
                                            {field.value ? (
                                                format(new Date(field.value), 'PPP', { locale: es })
                                            ) : (
                                                <span>Selecciona una fecha</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value ? new Date(field.value) : undefined}
                                        onSelect={(date) => field.onChange(date?.toISOString())}
                                        disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                Fecha en la que comenzará a ejecutarse el schedule
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* End Date */}
                <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Fin (Opcional)</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full pl-3 text-left font-normal',
                                                !field.value && 'text-muted-foreground'
                                            )}
                                        >
                                            {field.value ? (
                                                format(new Date(field.value), 'PPP', { locale: es })
                                            ) : (
                                                <span>Sin fecha de fin</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value ? new Date(field.value) : undefined}
                                        onSelect={(date) => field.onChange(date?.toISOString())}
                                        disabled={(date: Date) => {
                                            const startDate = form.getValues('startDate');
                                            return startDate ? date < new Date(startDate) : false;
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                Fecha en la que dejará de ejecutarse (opcional)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Actions */}
                <div className="flex gap-4 justify-end">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {schedule ? 'Actualizar' : 'Crear'} Schedule
                    </Button>
                </div>
            </form>
        </Form>
    );
}
