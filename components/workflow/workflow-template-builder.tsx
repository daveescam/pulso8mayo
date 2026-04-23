'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { DraggableStep } from './draggable-step';
import { toast } from 'sonner';

export interface WorkflowStep {
    id: string;
    title: string;
    description: string;
    type: 'PHOTO' | 'TEXT' | 'CHECKBOX' | 'NUMBER';
    required: boolean;
    order: number;
}

export function WorkflowTemplateBuilder() {
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setSteps((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                
                // Update order
                return newItems.map((item, index) => ({
                    ...item,
                    order: index,
                }));
            });
        }
    };

    const addStep = () => {
        const newStep: WorkflowStep = {
            id: `step-${Date.now()}`,
            title: `Paso ${steps.length + 1}`,
            description: '',
            type: 'PHOTO',
            required: true,
            order: steps.length,
        };

        setSteps([...steps, newStep]);
    };

    const updateStep = (id: string, updates: Partial<WorkflowStep>) => {
        setSteps(steps.map(step => 
            step.id === id ? { ...step, ...updates } : step
        ));
    };

    const removeStep = (id: string) => {
        setSteps(steps.filter(step => step.id !== id));
    };

    const saveTemplate = async () => {
        if (!templateName.trim()) {
            toast.error('El nombre del workflow es requerido');
            return;
        }

        if (steps.length === 0) {
            toast.error('Agrega al menos un paso al workflow');
            return;
        }

        try {
            setSaving(true);

            const response = await fetch('/api/workflows/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: templateName,
                    description: templateDescription,
                    steps: steps.map((step, index) => ({
                        ...step,
                        order: index,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error('Error al guardar el template');
            }

            toast.success('Template guardado exitosamente', {
                description: `${templateName} ha sido creado con ${steps.length} pasos`,
            });

            // Reset form
            setTemplateName('');
            setTemplateDescription('');
            setSteps([]);
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Error al guardar el template', {
                description: 'Intenta de nuevo',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Template Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Información del Template</CardTitle>
                    <CardDescription>
                        Nombre y descripción del workflow
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Nombre del Workflow</label>
                        <Input
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="Ej: Limpieza de Cocina"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Descripción</label>
                        <Textarea
                            value={templateDescription}
                            onChange={(e) => setTemplateDescription(e.target.value)}
                            placeholder="Describe el propósito de este workflow..."
                            className="resize-none"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Steps Builder */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Pasos del Workflow</CardTitle>
                            <CardDescription>
                                {steps.length} paso(s) - Arrastra para reordenar
                            </CardDescription>
                        </div>
                        <Button onClick={addStep} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Paso
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {steps.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No hay pasos aún</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Haz clic en "Agregar Paso" para comenzar
                            </p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={steps.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-4">
                                    {steps.map((step, index) => (
                                        <DraggableStep
                                            key={step.id}
                                            step={step}
                                            index={index}
                                            onUpdate={(updates) => updateStep(step.id, updates)}
                                            onRemove={() => removeStep(step.id)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={() => {
                        setTemplateName('');
                        setTemplateDescription('');
                        setSteps([]);
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={saveTemplate}
                    disabled={saving}
                >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Template'}
                </Button>
            </div>
        </div>
    );
}
