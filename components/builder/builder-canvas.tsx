import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilder, WorkflowStep } from "@/components/builder/builder-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, GripVertical, Trash2 } from "lucide-react";

// Individual Sortable Item Component
function SortableItem({ element }: { element: WorkflowStep }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: element.id });

    const { removeStep, selectStep, selectedStepId } = useBuilder();

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isSelected = selectedStepId === element.id;

    const renderFieldPreview = () => {
        switch (element.type) {
            case "text":
                return <Input disabled placeholder="Short text answer..." />;
            case "number":
                return <Input disabled placeholder="Numeric input..." type="number" />;
            case "multiple_choice":
                return (
                    <Select disabled>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                    </Select>
                );
            case "checklist":
                return (
                    <div className="flex flex-col gap-2">
                        {element.options?.map((opt, i) => (
                            <div key={i} className="flex items-center space-x-2">
                                <Checkbox disabled id={`${element.id}-${i}`} />
                                <Label htmlFor={`${element.id}-${i}`}>{opt}</Label>
                            </div>
                        )) || <div className="text-sm text-muted-foreground">No options defined</div>}
                    </div>
                );
            case "yes_no":
                return (
                    <div className="flex items-center space-x-2">
                        <Switch disabled id={element.id} />
                        <Label htmlFor={element.id}>{element.title}</Label>
                    </div>
                );
            case "photo":
            case "PhotoField":
                return (
                    <div className="h-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground bg-accent/10">
                        <span className="text-xs">Photo Upload Area</span>
                    </div>
                );
            default:
                // Fallback for text inputs or unknown types
                return <Input disabled placeholder="Type answer here..." />;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group flex items-start gap-4 p-4 mb-3 bg-card border rounded-lg transition-all",
                isDragging ? "opacity-50 z-50 shadow-xl" : "shadow-sm",
                isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
            )}
            onClick={(e) => {
                e.stopPropagation();
                selectStep(element.id);
            }}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
                <GripVertical size={20} />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2 pointer-events-none">
                <Label className="font-medium">
                    {element.title} {element.required && <span className="text-red-500">*</span>}
                </Label>
                {element.description && <p className="text-xs text-muted-foreground mb-2">{element.description}</p>}

                {renderFieldPreview()}
            </div>

            {/* Actions */}
            <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                    e.stopPropagation();
                    removeStep(element.id);
                }}
            >
                <Trash2 size={18} />
            </Button>
        </div>
    );
}

export function BuilderCanvas() {
    const { steps, selectStep, moveStep } = useBuilder();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            moveStep(active.id as string, over.id as string);
        }
    }

    return (
        <div
            className="w-full min-h-[500px]"
            onClick={() => selectStep(null)} // Deselect when clicking background
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={steps.map(el => el.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {steps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground">
                            <p>Your form is empty</p>
                            <p className="text-sm">Select a tool to start building</p>
                        </div>
                    ) : (
                        steps.map((step) => (
                            <SortableItem key={step.id} element={step} />
                        ))
                    )}
                </SortableContext>
            </DndContext>
        </div>
    );
}
