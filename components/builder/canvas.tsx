
"use client";

import React from 'react';
import { useBuilder, WorkflowStep } from './builder-context';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

function SortableStep({ step }: { step: WorkflowStep }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });
    const { selectedStepId, selectStep } = useBuilder();

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={cn(
                "mb-3 cursor-pointer border-2 transition-all hover:border-primary/50",
                selectedStepId === step.id ? "border-primary shadow-md" : "border-transparent"
            )}
            onClick={() => selectStep(step.id)}
        >
            <CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
                <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <CardTitle className="text-sm font-medium leading-none">
                        {step.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        {step.type} • {step.required ? 'Required' : 'Optional'}
                    </p>
                </div>
            </CardHeader>
        </Card>
    );
}

export function Canvas() {
    const { steps, moveStep, selectStep } = useBuilder();

    console.log('[Canvas] Rendering with steps:', steps.length, steps);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (active.id !== over?.id) {
            moveStep(active.id as string, over?.id as string);
        }
    }

    return (
        <div className="flex-1 bg-background p-8 overflow-y-auto h-full" onClick={(e) => {
            if (e.target === e.currentTarget) selectStep(null);
        }}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="max-w-xl mx-auto space-y-4 pb-20">
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold tracking-tight">Workflow Canvas</h2>
                        <p className="text-muted-foreground">Drag and drop to reorder. Click to edit properties.</p>
                    </div>

                    <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        {steps.map((step) => (
                            <SortableStep key={step.id} step={step} />
                        ))}
                    </SortableContext>

                    {steps.length === 0 && (
                        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                            <p>Select a tool from the left to start building.</p>
                        </div>
                    )}
                </div>
            </DndContext>
        </div>
    );
}
