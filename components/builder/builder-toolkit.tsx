'use client';

import { useBuilder, StepType } from "@/components/builder/builder-context";
import { Button } from "@/components/ui/button";
import {
  Type,
  AlignLeft,
  List,
  CheckSquare,
  ToggleLeft,
  Calendar,
  Mail,
  Heading1,
  Camera,
  ScanBarcode,
  Thermometer,
  MapPin,
  Timer,
  FileText
} from 'lucide-react';

// Enhanced field definitions with categories
const fieldCategories = [
  {
    name: "Entradas Básicas",
    items: [
      { type: "instruction" as StepType, icon: Heading1, label: "Encabezado" },
      { type: "text" as StepType, icon: Type, label: "Texto Corto" },
      { type: "text" as StepType, icon: AlignLeft, label: "Texto Largo" },
      { type: "multiple_choice" as StepType, icon: List, label: "Selección" },
      { type: "checklist" as StepType, icon: CheckSquare, label: "Checkbox" },
      { type: "yes_no" as StepType, icon: ToggleLeft, label: "Switch" },
      { type: "TimeField" as StepType, icon: Calendar, label: "Fecha" },
    ]
  },
  {
    name: "Evidencia y Media",
    items: [
      { type: "photo" as StepType, icon: Camera, label: "Foto AI" },
      { type: "SignatureField" as StepType, icon: FileText, label: "Firma" },
    ]
  },
  {
    name: "Específicos HORECA",
    items: [
      { type: "TemperatureField" as StepType, icon: Thermometer, label: "Temperatura" },
      { type: "timer" as StepType, icon: Timer, label: "Temporizador" },
    ]
  }
];

export function BuilderToolkit() {
  const { addStep } = useBuilder();

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
                  onClick={() => addStep(field.type)}
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
