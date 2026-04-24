"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Shield, Calendar, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ComplianceService {
  id: string;
  serviceType: string;
  serviceName: string;
  frequency: string;
  nextServiceDate?: string;
  lastServiceDate?: string;
  providerName?: string;
  isMandatory: boolean;
  isActive: boolean;
}

export default function EquipmentCompliancePage() {
  const [services, setServices] = useState<ComplianceService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/compliance-services");
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los servicios" });
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(
    (service) =>
      service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FUMIGATION: "Fumigación",
      FIRE_SYSTEM_CHECK: "Sistema Contra Incendios",
      ELECTRICAL_INSPECTION: "Inspección Eléctrica",
      GAS_INSPECTION: "Inspección de Gas",
      WATER_QUALITY: "Calidad del Agua",
      AIR_QUALITY: "Calidad del Aire",
      PEST_CONTROL: "Control de Plagas",
      HYGIENE_AUDIT: "Auditoría de Higiene",
      SAFETY_INSPECTION: "Inspección de Seguridad",
      OTHER: "Otro",
    };
    return labels[type] || type;
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      DAILY: "Diario",
      WEEKLY: "Semanal",
      BIWEEKLY: "Quincenal",
      MONTHLY: "Mensual",
      BIMONTHLY: "Bimestral",
      QUARTERLY: "Trimestral",
      SEMIANNUAL: "Semestral",
      ANNUAL: "Anual",
      CUSTOM: "Personalizado",
    };
    return labels[freq] || freq;
  };

  if (loading) {
    return <div className="p-6">Cargando servicios...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Servicios Normativos</h1>
          <p className="text-muted-foreground">Gestión de servicios de cumplimiento y normativas</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Servicio Normativo</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Agrega un nuevo servicio de cumplimiento regulatorio
            </p>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-sm text-muted-foreground">Total Servicios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {services.filter((s) => s.isMandatory).length}
            </div>
            <p className="text-sm text-muted-foreground">Obligatorios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {services.filter((s) => {
                if (!s.nextServiceDate) return false;
                return new Date(s.nextServiceDate) <= new Date();
              }).length}
            </div>
            <p className="text-sm text-muted-foreground">Próximos a Vencer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {services.filter((s) => s.lastServiceDate).length}
            </div>
            <p className="text-sm text-muted-foreground">Con Historial</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Próxima Fecha</TableHead>
                <TableHead>Último Servicio</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay servicios configurados</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {service.serviceName}
                        {service.isMandatory && (
                          <Badge variant="destructive" className="text-xs">
                            Obligatorio
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getServiceTypeLabel(service.serviceType)}</TableCell>
                    <TableCell>{getFrequencyLabel(service.frequency)}</TableCell>
                    <TableCell>
                      {service.nextServiceDate
                        ? new Date(service.nextServiceDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {service.lastServiceDate
                        ? new Date(service.lastServiceDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>{service.providerName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? "default" : "secondary"}>
                        {service.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}