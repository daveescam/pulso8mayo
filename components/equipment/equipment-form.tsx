"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const equipmentTypes = [
  { value: "REFRIGERATOR", label: "Refrigerador" },
  { value: "FREEZER", label: "Congelador" },
  { value: "OVEN", label: "Horno" },
  { value: "STOVE", label: "Estufa" },
  { value: "GRILL", label: "Parrilla" },
  { value: "FRYER", label: "Freidora" },
  { value: "DISHWASHER", label: "Lavavajillas" },
  { value: "COFFEE_MACHINE", label: "Cafetera" },
  { value: "BLENDER", label: "Licuadora" },
  { value: "MIXER", label: "Batidora" },
  { value: "EXHAUST_HOOD", label: "Campana Extractora" },
  { value: "AIR_CONDITIONER", label: "Aire Acondicionado" },
  { value: "FIRE_SUPPRESSION", label: "Sistema Contra Incendios" },
  { value: "SECURITY_CAMERA", label: "Cámara de Seguridad" },
  { value: "POS_SYSTEM", label: "Sistema POS" },
  { value: "OTHER", label: "Otro" },
];

const maintenanceFrequencies = [
  { value: "DAILY", label: "Diario" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quincenal" },
  { value: "MONTHLY", label: "Mensual" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "SEMIANNUAL", label: "Semestral" },
  { value: "ANNUAL", label: "Anual" },
];

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  equipmentCode: z.string().min(1, "El código es requerido"),
  type: z.string().min(1, "El tipo es requerido"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  assetTag: z.string().optional(),
  location: z.string().optional(),
  area: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  vendor: z.string().optional(),
  vendorContact: z.string().optional(),
  invoiceNumber: z.string().optional(),
  maintenanceFrequency: z.string().optional(),
  nextMaintenanceDate: z.string().optional(),
  isCritical: z.boolean(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EquipmentFormProps {
  initialData?: Partial<FormData>;
  onSuccess: () => void;
}

export function EquipmentForm({ initialData, onSuccess }: EquipmentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      equipmentCode: initialData?.equipmentCode || "",
      type: initialData?.type || "",
      brand: initialData?.brand || "",
      model: initialData?.model || "",
      serialNumber: initialData?.serialNumber || "",
      assetTag: initialData?.assetTag || "",
      location: initialData?.location || "",
      area: initialData?.area || "",
      purchaseDate: initialData?.purchaseDate || "",
      purchasePrice: initialData?.purchasePrice || "",
      vendor: initialData?.vendor || "",
      vendorContact: initialData?.vendorContact || "",
      invoiceNumber: initialData?.invoiceNumber || "",
      maintenanceFrequency: initialData?.maintenanceFrequency || "MONTHLY",
      nextMaintenanceDate: initialData?.nextMaintenanceDate || "",
      isCritical: initialData?.isCritical || false,
      notes: initialData?.notes || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        purchasePrice: data.purchasePrice ? parseInt(String(data.purchasePrice)) * 100 : undefined,
      }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear el equipo");
      }

      toast({
        title: "Éxito",
        description: "Equipo creado correctamente",
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el equipo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Información Básica</h3>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Equipo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Refrigerador Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipmentCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Equipo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. REF-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. True" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. T-49" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Serie</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. SN123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assetTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag de Activo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. A-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Location & Purchase */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Ubicación y Compra</h3>
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Cocina Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el área" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BACK_OF_HOUSE">Back of House</SelectItem>
                      <SelectItem value="FRONT_OF_HOUSE">Front of House</SelectItem>
                      <SelectItem value="STORAGE">Almacén</SelectItem>
                      <SelectItem value="OFFICE">Oficina</SelectItem>
                      <SelectItem value="OUTDOOR">Exterior</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Compra</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio de Compra ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del proveedor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendorContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contacto del Proveedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Teléfono o email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Factura</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. INV-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Maintenance Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Configuración de Mantenimiento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="maintenanceFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia de Mantenimiento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la frecuencia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {maintenanceFrequencies.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextMaintenanceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próximo Mantenimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="isCritical"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Equipo Crítico</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Marcar si el equipo es esencial para las operaciones
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notas adicionales sobre el equipo..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Limpiar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Equipo
          </Button>
        </div>
      </form>
    </Form>
  );
}
