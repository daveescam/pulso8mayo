"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const professionalSchema = z.object({
  // Employment Details
  employeeNumber: z.string().min(1, "El número de empleado es requerido"),
  position: z.string().min(1, "El puesto es requerido"),
  department: z.string().min(1, "El departamento es requerido"),
  hireDate: z.string().min(1, "La fecha de contratación es requerida"),
  seniorityDate: z.string().optional().or(z.literal("")),
  probationEndDate: z.string().optional().or(z.literal("")),

  // Employment Status
  employeeStatus: z.enum(["ONBOARDING", "ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED", "RESIGNED"]).optional(),
  isActive: z.boolean(),
  rehireEligible: z.boolean().optional(),
  terminationDate: z.string().optional().or(z.literal("")),
  terminationReason: z.enum(["VOLUNTARY_RESIGNATION", "TERMINATION_WITH_CAUSE", "TERMINATION_WITHOUT_CAUSE", "CONTRACT_EXPIRED", "RETIREMENT", "DEATH", "MUTUAL_AGREEMENT", "OTHER"]).optional(),

  // Work Schedule
  standardHoursPerWeek: z.number().min(1).max(168).optional(),

  // Skills & Languages
  skills: z.array(z.string()),
  languages: z.array(z.string()),
  notes: z.string().optional().or(z.literal("")),
});

type ProfessionalFormValues = z.infer<typeof professionalSchema>;

interface ProfessionalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  employeeId: string;
  profile: any;
}

export function ProfessionalDialog({
  open,
  onOpenChange,
  onSuccess,
  employeeId,
  profile,
}: ProfessionalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");

  const form = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      employeeNumber: "",
      position: "",
      department: "",
      hireDate: "",
      seniorityDate: "",
      probationEndDate: "",
      employeeStatus: "ACTIVE",
      isActive: true,
      rehireEligible: true,
      terminationDate: "",
      terminationReason: undefined,
      standardHoursPerWeek: 40,
      skills: [],
      languages: [],
      notes: "",
    },
  });

  // Reset form when profile changes or dialog opens
  useEffect(() => {
    if (open && profile) {
      const skills = profile.skills || [];
      const languages = profile.languages || [];

      setSkillsInput(skills.join(", "));
      setLanguagesInput(languages.join(", "));

      form.reset({
        employeeNumber: profile.employeeNumber || "",
        position: profile.position || "",
        department: profile.department || "",
        hireDate: profile.hireDate ? new Date(profile.hireDate).toISOString().split("T")[0] : "",
        seniorityDate: profile.seniorityDate ? new Date(profile.seniorityDate).toISOString().split("T")[0] : "",
        probationEndDate: profile.probationEndDate ? new Date(profile.probationEndDate).toISOString().split("T")[0] : "",
        employeeStatus: profile.employeeStatus || "ACTIVE",
        isActive: profile.isActive !== false,
        rehireEligible: profile.rehireEligible !== false,
        terminationDate: profile.terminationDate ? new Date(profile.terminationDate).toISOString().split("T")[0] : "",
        terminationReason: profile.terminationReason || undefined,
        standardHoursPerWeek: profile.standardHoursPerWeek || 40,
        skills: skills,
        languages: languages,
        notes: profile.notes || "",
      });
    }
  }, [profile, open, form]);

  const handleSkillsChange = (value: string) => {
    setSkillsInput(value);
    const skills = value.split(",").map(s => s.trim()).filter(s => s.length > 0);
    form.setValue("skills", skills);
  };

  const handleLanguagesChange = (value: string) => {
    setLanguagesInput(value);
    const languages = value.split(",").map(s => s.trim()).filter(s => s.length > 0);
    form.setValue("languages", languages);
  };

  async function onSubmit(values: ProfessionalFormValues) {
    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success("Información profesional actualizada correctamente");
        onOpenChange(false);
        onSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al actualizar la información profesional");
      }
    } catch (error) {
      console.error("Error updating professional information:", error);
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Información Profesional</DialogTitle>
          <DialogDescription>
            Actualiza los detalles laborales, estado e información profesional del empleado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detalles del Empleo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="employeeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Empleado</FormLabel>
                      <FormControl>
                        <Input placeholder="EMP-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puesto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Chef, Mesero, Gerente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Cocina, Servicio, Administración" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hireDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Contratación</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seniorityDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Antigüedad</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="probationEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Fin de Prueba</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Employment Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Estado del Empleo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="employeeStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ONBOARDING">En Inducción</SelectItem>
                          <SelectItem value="ACTIVE">Activo</SelectItem>
                          <SelectItem value="ON_LEAVE">En Licencia</SelectItem>
                          <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                          <SelectItem value="TERMINATED">Terminado</SelectItem>
                          <SelectItem value="RESIGNED">Renunció</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activo</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value ? "true" : "false"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Sí</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rehireEligible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Elegible para Recontratación</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value ? "true" : "false"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Sí</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="terminationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Baja</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="terminationReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo de Baja</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar motivo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="VOLUNTARY_RESIGNATION">Renuncia Voluntaria</SelectItem>
                          <SelectItem value="TERMINATION_WITH_CAUSE">Terminación con Causa</SelectItem>
                          <SelectItem value="TERMINATION_WITHOUT_CAUSE">Terminación sin Causa</SelectItem>
                          <SelectItem value="CONTRACT_EXPIRED">Contrato Vencido</SelectItem>
                          <SelectItem value="RETIREMENT">Jubilación</SelectItem>
                          <SelectItem value="DEATH">Fallecimiento</SelectItem>
                          <SelectItem value="MUTUAL_AGREEMENT">Acuerdo Mutuo</SelectItem>
                          <SelectItem value="OTHER">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Work Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Horario Laboral</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="standardHoursPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Semanales Estándar</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="168"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 40)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Skills & Languages */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Habilidades e Idiomas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Habilidades</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Cocina, Servicio al Cliente, Liderazgo"
                          value={skillsInput}
                          onChange={(e) => handleSkillsChange(e.target.value)}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Separa las habilidades con comas
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idiomas</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Español, Inglés, Francés"
                          value={languagesInput}
                          onChange={(e) => handleLanguagesChange(e.target.value)}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Separa los idiomas con comas
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas de RH</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales sobre el empleado..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
