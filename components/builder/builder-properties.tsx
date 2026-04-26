'use client';

import { useBuilder } from "@/components/builder/builder-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function BuilderProperties() {
  const { steps: elements, selectedStepId: selectedElementId, updateStep: updateElement } = useBuilder();

  const selectedElement = elements.find(el => el.id === selectedElementId);

  if (!selectedElement) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 space-y-4">
        <div className="bg-muted p-4 rounded-full">
          <SettingsIcon className="w-8 h-8 opacity-50" />
        </div>
        <div>
          <h3 className="font-medium">Sin selección</h3>
          <p className="text-sm mt-1">Selecciona un elemento del lienzo para editar sus propiedades.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-medium text-lg flex items-center gap-2">
          <span className="text-muted-foreground text-sm uppercase tracking-wider">{selectedElement.type}</span>
        </h3>
      </div>

      <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
            <TabsTrigger value="validation" className="flex-1">Validación</TabsTrigger>
            {(selectedElement.type === "photo" || selectedElement.type === "TemperatureField") && (
              <TabsTrigger value="advanced" className="flex-1">AI & HORECA</TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <TabsContent value="general" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="prop-label">Etiqueta (Pregunta)</Label>
              <Input
                id="prop-label"
                value={selectedElement.title}
                onChange={(e) => updateElement(selectedElement.id, { title: e.target.value })}
              />
            </div>

            {selectedElement.type !== "instruction" && selectedElement.type !== "yes_no" && (
              <div className="space-y-2">
                <Label htmlFor="prop-placeholder">Placeholder</Label>
                <Input
                  id="prop-placeholder"
                  value={selectedElement.placeholder || ''}
                  onChange={(e) => updateElement(selectedElement.id, { placeholder: e.target.value })}
                />
              </div>
            )}

            {selectedElement.type === "instruction" && (
              <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                Las instrucciones sirven para separar secciones en tu formulario.
              </div>
            )}
          </TabsContent>

          <TabsContent value="validation" className="space-y-4 mt-0">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <Label htmlFor="prop-required" className="cursor-pointer">Campo Obligatorio</Label>
              <Switch
                id="prop-required"
                checked={selectedElement.required || false}
                onCheckedChange={(checked) => updateElement(selectedElement.id, { required: checked })}
              />
            </div>

            {(selectedElement.type === "number" || selectedElement.type === "TemperatureField") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mínimo</Label>
                  <Input
                    type="number"
                    value={selectedElement.validation?.min || ''}
                    onChange={(e) => updateElement(selectedElement.id, { validation: { ...selectedElement.validation, min: parseFloat(e.target.value) } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máximo</Label>
                  <Input
                    type="number"
                    value={selectedElement.validation?.max || ''}
                    onChange={(e) => updateElement(selectedElement.id, { validation: { ...selectedElement.validation, max: parseFloat(e.target.value) } })}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-0">
            {selectedElement.type === "photo" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Verificación AI</Label>
                    <p className="text-xs text-muted-foreground">Analizar foto con IA</p>
                  </div>
                  <Switch
                    checked={selectedElement.aiVerification?.enabled || false}
                    onCheckedChange={(checked) => updateElement(selectedElement.id, { aiVerification: { ...selectedElement.aiVerification, enabled: checked } })}
                  />
                </div>

                {selectedElement.aiVerification?.enabled && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-md text-sm">
                    Se utilizará el motor de IA configurado para validar el contenido de la imagen.
                  </div>
                )}
              </div>
            )}

            {selectedElement.type === "TemperatureField" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Unidad de Medida</Label>
                  <Select
                    value={selectedElement.config?.unit || 'C'}
                    onValueChange={(val) => updateElement(selectedElement.id, { config: { ...selectedElement.config, unit: val } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C">Celsius (°C)</SelectItem>
                      <SelectItem value="F">Fahrenheit (°F)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}
