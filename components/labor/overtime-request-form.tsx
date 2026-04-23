'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

const overtimeRequestSchema = z.object({
    title: z.string().min(1, 'El título es requerido'),
    reason: z.string().min(1, 'La razón es requerida'),
    description: z.string().optional(),
    startTime: z.string().min(1, 'La hora de inicio es requerida'),
    endTime: z.string().min(1, 'La hora de fin es requerida'),
    date: z.string().min(1, 'La fecha es requerida'),
});

type OvertimeRequestValues = z.infer<typeof overtimeRequestSchema>;

interface OvertimeRequestFormProps {
    branchId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function OvertimeRequestForm({ branchId, onSuccess, onCancel }: OvertimeRequestFormProps) {
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<OvertimeRequestValues>({
        resolver: zodResolver(overtimeRequestSchema),
        defaultValues: {
            title: '',
            reason: '',
            description: '',
            startTime: '18:00',
            endTime: '22:00',
            date: new Date().toISOString().split('T')[0],
        },
    });

    const startTime = form.watch('startTime');
    const endTime = form.watch('endTime');

    const calculateOvertime = () => {
        if (!startTime || !endTime) return 0;

        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        return Math.max(0, endMinutes - startMinutes);
    };

    const overtimeMinutes = calculateOvertime();

    async function onSubmit(data: OvertimeRequestValues) {
        try {
            setSubmitting(true);

            const startDateTime = `${data.date}T${data.startTime}`;
            const endDateTime = `${data.date}T${data.endTime}`;

            const response = await fetch('/api/overtime/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    branchId,
                    title: data.title,
                    reason: data.reason,
                    description: data.description,
                    startTime: startDateTime,
                    endTime: endDateTime,
                    durationMinutes: overtimeMinutes,
                    overtimeMinutes,
                }),
            });

            if (!response.ok) {
                throw new Error('Error al crear solicitud');
            }

            toast.success('Solicitud de horas extras creada', {
                description: `Se solicitaron ${overtimeMinutes / 60} horas extras`,
            });

            form.reset();
            onSuccess?.();
        } catch (error) {
            console.error('Error creating overtime request:', error);
            toast.error('Error al crear solicitud', {
                description: 'Intenta de nuevo',
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                        <h3 className="text-lg font-medium">Solicitar Horas Extras</h3>
                        <p className="text-sm text-muted-foreground">
                            Envía una solicitud de horas extras para aprobación
                        </p>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Horas extras para inventario" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Razón</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una razón" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="INVENTARIO">Inventario</SelectItem>
                                    <SelectItem value="DEMANDA_ALTA">Alta demanda</SelectItem>
                                    <SelectItem value="EVENTO_ESPECIAL">Evento especial</SelectItem>
                                    <SelectItem value="CAPACITACION">Capacitación</SelectItem>
                                    <SelectItem value="OTRO">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción (opcional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe el motivo de las horas extras..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fecha</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hora de Inicio</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hora de Fin</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {overtimeMinutes > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                                Total de horas extras: {(overtimeMinutes / 60).toFixed(2)} horas ({overtimeMinutes} minutos)
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={submitting || overtimeMinutes === 0}
                    >
                        {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
