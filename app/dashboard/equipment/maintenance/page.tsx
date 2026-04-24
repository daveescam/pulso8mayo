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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Wrench, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  maintenanceType: string;
  status: string;
  scheduledDate: string;
  completedDate?: string;
  providerName?: string;
  description: string;
}

export default function EquipmentMaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const fetchMaintenance = async () => {
    try {
      const res = await fetch("/api/equipment/maintenance");
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el historial" });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(
    (record) =>
      record.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      SCHEDULED: { label: "Programado", color: "bg-blue-100 text-blue-800" },
      IN_PROGRESS: { label: "En Progreso", color: "bg-yellow-100 text-yellow-800" },
      COMPLETED: { label: "Completado", color: "bg-green-100 text-green-800" },
      CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-800" },
      OVERDUE: { label: "Vencido", color: "bg-red-100 text-red-800" },
    };
    const config = configs[status] || { label: status, color: "bg-gray-100" };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="p-6">Cargando mantenimientos...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mantenimiento de Equipos</h1>
          <p className="text-muted-foreground">Historial y programación de mantenimientos</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Mantenimiento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Programar Mantenimiento</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Selecciona un equipo y programa el mantenimiento
            </p>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="scheduled">Programados</TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
          <TabsTrigger value="overdue">Vencidos</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar mantenimientos..."
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
                    <TableHead>Equipo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha Programada</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Proveedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay registros de mantenimiento</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.equipmentName}</TableCell>
                        <TableCell>{record.maintenanceType}</TableCell>
                        <TableCell>{new Date(record.scheduledDate).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>{record.providerName || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords
                    .filter((r) => r.status === "SCHEDULED")
                    .map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.equipmentName}</TableCell>
                        <TableCell>{record.maintenanceType}</TableCell>
                        <TableCell>{new Date(record.scheduledDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha Completado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords
                    .filter((r) => r.status === "COMPLETED")
                    .map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.equipmentName}</TableCell>
                        <TableCell>{record.maintenanceType}</TableCell>
                        <TableCell>
                          {record.completedDate
                            ? new Date(record.completedDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha Vencida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords
                    .filter((r) => r.status === "OVERDUE")
                    .map((record) => (
                      <TableRow key={record.id} className="bg-red-50">
                        <TableCell className="font-medium">{record.equipmentName}</TableCell>
                        <TableCell>{record.maintenanceType}</TableCell>
                        <TableCell className="text-red-600">
                          {new Date(record.scheduledDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}