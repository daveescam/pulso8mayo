'use client';

import { useBuilder, availableFields, FieldType } from "@/components/builder/builder-context";
import { Button } from "@/components/ui/button";
import {
    Type,
    AlignLeft,
    List,
    CheckSquare,
    ToggleLeft,
    Calendar,
    Mail,
    Lock,
    Heading1,
    Camera,
    ScanBarcode,
    Thermometer,
    MapPin,
    Timer,
    FileText
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";

// Enhanced field definitions with categories
const fieldCategories = [
    {
        name: "Entradas Básicas",
        items: [
            { type: "Heading" as FieldType, icon: Heading1, label: "Encabezado" },
            { type: "Input" as FieldType, icon: Type, label: "Texto Corto" },
            { type: "Textarea" as FieldType, icon: AlignLeft, label: "Texto Largo" },
            { type: "Select" as FieldType, icon: List, label: "Selección" },
            { type: "Checkbox" as FieldType, icon: CheckSquare, label: "Checkbox" },
            { type: "Switch" as FieldType, icon: ToggleLeft, label: "Switch" },
            { type: "Date Picker" as FieldType, icon: Calendar, label: "Fecha" },
            { type: "Email" as FieldType, icon: Mail, label: "Email" },
        ]
    },
    {
        name: "Evidencia y Media",
        items: [
            // Assuming we will add these types to BuilderContext soon
            { type: "Photo" as any, icon: Camera, label: "Foto AI" },
            { type: "Signature" as any, icon: FileText, label: "Firma" },
        ]
    },
    {
        name: "Específicos HORECA",
        items: [
            // To be implemented in BuilderContext
            { type: "Temperature" as any, icon: Thermometer, label: "Temperatura" },
            { type: "Barcode" as any, icon: ScanBarcode, label: "Código Barras" },
        ]
    }
];

export function BuilderToolkit() {
    const { addElement } = useBuilder();

    return (
        <div className="space-y-6">
            <div className="px-1">
                <h3 className="font-semibold mb-2">Componentes</h3>
                <p className="text-xs text-muted-foreground mb-4">
                    Arrastra o haz clic para agregar campos a tu flujo.
                </p>
            </div>

            {fieldCategories.map((category, idx) => (
                <div key={idx} className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground px-1">{category.name}</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {category.items.map((field) => {
                            const Icon = field.icon;
                            return (
                                <Button
                                    key={field.label}
                                    variant="outline"
                                    className="flex flex-col items-center justify-center h-20 p-2 hover:border-primary hover:bg-primary/5 transition-colors gap-2"
                                    onClick={() => addElement(field.type as FieldType)}
                                >
                                    <Icon className="h-6 w-6 text-muted-foreground" />
                                    <span className="text-xs font-medium">{field.label}</span>
                                </Button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
