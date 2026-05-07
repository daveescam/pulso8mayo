"use client";

import { useState, useEffect } from "react";
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
  FormDescription,
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
import { maintenanceTypes, providerTypes } from "@/lib/equipment-constants";

interface Equipment {
  id: string;
  name: string;
  equipmentCode: string;
}

interface ServiceProvider {
  id: string;
  name: string;
  providerType: string;
}

const formSchema = z.object({
  equipmentId: z.string().min(1, "El equipo es requerido"),
  maintenanceType: z.string().min(1, "El tipo de mantenimiento es requerido"),
  scheduledDate: z.string().min(1, "La fecha es requerida"),
  description: z.string().min(1, "La descripción es requerida"),
  providerType: z.string(),
  providerId: z.string().optional(),
  providerName: z.string().optional(),
  providerContact: z.string().optional(),
  technicianName: z.string().optional(),
  technicianLicense: z.string().optional(),
  estimatedDuration: z.number().optional(),
  isScheduled: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface MaintenanceFormProps {
  initialData?: Partial<FormData>;
  equipmentId?: string;
  onSuccess: () => void;
}

export function MaintenanceForm({ initialData, equipmentId: defaultEquipmentId, onSuccess }: MaintenanceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      equipmentId: defaultEquipmentId || initialData?.equipmentId || "",
      maintenanceType: initialData?.maintenanceType || "PREVENTIVE",
      scheduledDate: initialData?.scheduledDate || new Date().toISOString().split("T")[0],
      description: initialData?.description || "",
      providerType: initialData?.providerType || "INTERNAL",
      providerId: initialData?.providerId || "",
      providerName: initialData?.providerName || "",
      providerContact: initialData?.providerContact || "",
      technicianName: initialData?.technicianName || "",
      technicianLicense: initialData?.technicianLicense || "",
      estimatedDuration: initialData?.estimatedDuration || 60,
      isScheduled: initialData?.isScheduled ?? true,
    },
  });

  useEffect(() => {
    fetchEquipment();
    fetchProviders();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await fetch("/api/equipment");
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/equipment/providers");
      if (response.ok) {
      const data = await response.json();
      setProviders(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Find selected equipment to get company and branch info
      const selectedEquipment = equipment.find(e => e.id === data.equipmentId);
      if (!selectedEquipment) {
        throw new Error("Equipo no encontrado");
      }

      const response = await fetch("/api/equipment/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          scheduledDate: new Date(data.scheduledDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear el mantenimiento");
      }

      toast({
        title: "Éxito",
        description: "Mantenimiento programado correctamente",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el mantenimiento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProviderType = form.watch("providerType");

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Equipment Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Equipo</h3>

            <FormField
              control={form.control}
              name="equipmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipo *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el equipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipment.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.equipmentCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Maintenance Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Detalles del Mantenimiento</h3>

            <FormField
              control={form.control}
              name="maintenanceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Mantenimiento *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {maintenanceTypes.map((type) => (
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

            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha Programada *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración Estimada (minutos)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Provider Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Proveedor</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="providerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Proveedor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providerTypes.map((type) => (
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

            {selectedProviderType !== "INTERNAL" && (
              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor Existente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un proveedor (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers
                          .filter(p => p.providerType === selectedProviderType)
                          .map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="providerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Proveedor / Técnico</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la empresa o técnico" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="providerContact"
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
              name="technicianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Técnico Asignado</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del técnico específico" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="technicianLicense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Licencia / Certificación del Técnico</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de licencia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción del Trabajo *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el trabajo a realizar..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Incluye detalles sobre las tareas a realizar y piezas necesarias
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Limpiar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Programar Mantenimiento
          </Button>
        </div>
      </form>
    </Form>
  );
}
