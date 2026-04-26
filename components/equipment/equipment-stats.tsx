"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Shield,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";

interface EquipmentStats {
  total: number;
  active: number;
  underMaintenance: number;
  outOfOrder: number;
  critical: number;
  byType: Record<string, number>;
}

export function EquipmentStats() {
  const { toast } = useToast();
  const { tenant } = useTenant();
  const branchId = tenant?.branchId;
  const [stats, setStats] = useState<EquipmentStats>({
    total: 0,
    active: 0,
    underMaintenance: 0,
    outOfOrder: 0,
    critical: 0,
    byType: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (branchId) {
      fetchStats();
    }
  }, [branchId]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      // For now we'll use the equipment endpoint and calculate stats
      // In production, this would have a dedicated stats endpoint
      const response = await fetch(`/api/equipment?branchId=${branchId}`);
      if (!response.ok) throw new Error("Failed to fetch equipment");
      
      const data = await response.json();
      const equipment = data.data || [];
      
      const byType: Record<string, number> = {};
      equipment.forEach((item: any) => {
        byType[item.type] = (byType[item.type] || 0) + 1;
      });

      setStats({
        total: equipment.length,
        active: equipment.filter((e: any) => e.status === 'ACTIVE').length,
        underMaintenance: equipment.filter((e: any) => e.status === 'UNDER_MAINTENANCE').length,
        outOfOrder: equipment.filter((e: any) => e.status === 'OUT_OF_ORDER').length,
        critical: equipment.filter((e: any) => e.isCritical).length,
        byType,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total de Equipos",
      value: stats.total,
      icon: <Wrench className="w-5 h-5 text-blue-500" />,
      color: "bg-blue-50 border-blue-200",
    },
    {
      title: "Equipos Activos",
      value: stats.active,
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      color: "bg-green-50 border-green-200",
    },
    {
      title: "En Mantenimiento",
      value: stats.underMaintenance,
      icon: <Clock className="w-5 h-5 text-yellow-500" />,
      color: "bg-yellow-50 border-yellow-200",
    },
    {
      title: "Fuera de Servicio",
      value: stats.outOfOrder,
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      color: "bg-red-50 border-red-200",
    },
    {
      title: "Equipos Críticos",
      value: stats.critical,
      icon: <AlertCircle className="w-5 h-5 text-purple-500" />,
      color: "bg-purple-50 border-purple-200",
    },
  ];

  const topTypes = Object.entries(stats.byType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const equipmentTypeLabels: Record<string, string> = {
    REFRIGERATOR: "Refrigeradores",
    FREEZER: "Congeladores",
    OVEN: "Hornos",
    STOVE: "Estufas",
    GRILL: "Parrillas",
    FRYER: "Freidoras",
    DISHWASHER: "Lavavajillas",
    COFFEE_MACHINE: "Cafeteras",
    BLENDER: "Licuadoras",
    MIXER: "Batidoras",
    EXHAUST_HOOD: "Campanas",
    AIR_CONDITIONER: "Aires Acond.",
    FIRE_SUPPRESSION: "Sist. Contra Inc.",
    SECURITY_CAMERA: "Cámaras",
    POS_SYSTEM: "Sistemas POS",
    OTHER: "Otros",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className={`${stat.color} border`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {isLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className="p-2 bg-white rounded-full shadow-sm">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {topTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Distribución por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topTypes.map(([type, count]) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="text-sm px-3 py-1"
                >
                  {equipmentTypeLabels[type] || type}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
