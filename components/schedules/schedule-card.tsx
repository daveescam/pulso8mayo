'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, Clock, MoreVertical, Power, User, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Schedule {
    id: string;
    templateId: string;
    title: string;
    description?: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';
    assignmentType: 'ROLE' | 'USER' | 'AUTO' | 'MANUAL';
    assignedRole?: string;
    assignedUserId?: string;
    timeOfDay?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    isActive: boolean;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    nextExecutionAt?: Date;
    executionCount: number;
    createdAt: Date;
}

interface ScheduleCardProps {
    schedule: Schedule;
    onEdit: () => void;
    onDelete: () => void;
    onToggle: () => void;
}

const frequencyLabels = {
    DAILY: 'Diario',
    WEEKLY: 'Semanal',
    MONTHLY: 'Mensual',
    ONCE: 'Una vez',
};

const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

export function ScheduleCard({ schedule, onEdit, onDelete, onToggle }: ScheduleCardProps) {
    const nextExecution = schedule.nextExecutionAt
        ? formatDistanceToNow(new Date(schedule.nextExecutionAt), {
            addSuffix: true,
            locale: es,
        })
        : 'No programado';

    return (
        <Card className={!schedule.isActive ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                        <h3 className="font-semibold text-lg leading-none">{schedule.title}</h3>
                        {schedule.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {schedule.description}
                            </p>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={onToggle}>
                                {schedule.isActive ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="text-red-600">
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="pb-3">
                <div className="flex flex-wrap gap-2">
                    <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                        <Power className="h-3 w-3 mr-1" />
                        {schedule.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>

                    <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {frequencyLabels[schedule.frequency]}
                    </Badge>

                    <Badge className={priorityColors[schedule.priority]}>
                        {schedule.priority}
                    </Badge>

                    {schedule.assignmentType === 'ROLE' && schedule.assignedRole && (
                        <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {schedule.assignedRole}
                        </Badge>
                    )}

                    {schedule.assignmentType === 'USER' && (
                        <Badge variant="outline">
                            <User className="h-3 w-3 mr-1" />
                            Usuario específico
                        </Badge>
                    )}
                </div>

                <div className="mt-4 space-y-2 text-sm">
                    {schedule.timeOfDay && (
                        <div className="flex items-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>
                                {schedule.frequency === 'DAILY' && `Diario a las ${schedule.timeOfDay}`}
                                {schedule.frequency === 'WEEKLY' && schedule.dayOfWeek !== undefined &&
                                    `${['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][schedule.dayOfWeek]} a las ${schedule.timeOfDay}`}
                                {schedule.frequency === 'MONTHLY' && schedule.dayOfMonth &&
                                    `Día ${schedule.dayOfMonth} a las ${schedule.timeOfDay}`}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-muted-foreground">
                        <span>Próxima ejecución: {nextExecution}</span>
                        <span>Ejecutado {schedule.executionCount}x</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
