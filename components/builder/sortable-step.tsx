"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WorkflowStep } from "./builder-context";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableStepProps {
    step: WorkflowStep;
    isSelected?: boolean;
    onClick: () => void;
}

export function SortableStep({ step, isSelected, onClick }: SortableStepProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: step.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <Card
                className={cn(
                    "cursor-pointer transition-all border-l-4",
                    isSelected ? "border-l-primary ring-2 ring-primary/20" : "border-l-transparent hover:border-l-gray-300"
                )}
                onClick={onClick}
            >
                <div className="absolute top-1/2 -left-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-move" {...attributes} {...listeners}>
                    <div className="bg-background border rounded p-1 shadow-sm">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>

                <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <span className="text-xs uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold tracking-wider">
                                    {step.type}
                                </span>
                                {step.title}
                            </CardTitle>
                            {step.description && <CardDescription className="mt-1">{step.description}</CardDescription>}
                        </div>
                        {step.required && <span className="text-xs text-red-500 font-semibold">* Req</span>}
                    </div>
                </CardHeader>
            </Card>
        </div>
    );
}
