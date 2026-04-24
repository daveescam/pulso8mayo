"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  Building2,
  Users,
  Layout,
  FileText,
  AlertOctagon,
  Clock,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ChevronUp,
  User2,
  Calendar,
  CheckSquare,
  Package,
  TrendingUp,
  Wrench,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { NavCompany } from "@/components/nav-company"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Keep static nav data for now, but dynamic user/company data
const navMain = [
  {
    title: "Tablero",
    url: "/dashboard",
    icon: SquareTerminal,
    isActive: true,
    items: [
      {
        title: "General",
        url: "/dashboard",
      },
      {
        title: "Analítica",
        url: "/dashboard/analytics",
      },
      {
        title: "Constructor KPIs",
        url: "/dashboard/analytics/kpi-builder",
      },
    ],
  },
  {
    title: "Organización",
    url: "/dashboard/company",
    icon: Building2,
    items: [
      {
        title: "Sucursales",
        url: "/dashboard/company/branches",
      },
      {
        title: "Equipo",
        url: "/dashboard/team",
      },
      {
        title: "WhatsApp Bot",
        url: "/dashboard/company/whatsapp",
      },
      {
        title: "Comunicaciones",
        url: "/dashboard/company/communications",
      },
    ],
  },
  {
    title: "Flujos de Trabajo",
    url: "/dashboard/workflows",
    icon: Layout,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/workflows",
      },
      {
        title: "Constructor",
        url: "/dashboard/builder",
      },
      {
        title: "Plantillas",
        url: "/dashboard/builder/templates",
      },
      {
        title: "Historial",
        url: "/dashboard/workflows/history",
      },
    ],
  },
  {
    title: "Operación",
    url: "/dashboard/operations",
    icon: BookOpen,
    items: [
      {
        title: "Mis Tareas",
        url: "/dashboard/my-tasks",
      },
      {
        title: "Ejecución Rápida",
        url: "/dashboard/execute",
      },
      {
        title: "Evidencias",
        url: "/dashboard/evidence",
      },
      {
        title: "Incidentes",
        url: "/dashboard/incidents",
      },
      {
        title: "Programación",
        url: "/dashboard/schedules",
      },
    ],
  },
  {
    title: "Inventario",
    url: "/dashboard/inventory",
    icon: Package,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/inventory",
      },
      {
        title: "Recepción",
        url: "/dashboard/inventory/receiving",
      },
      {
        title: "Transferencias",
        url: "/dashboard/inventory/transfers",
      },
      {
        title: "Proveedores",
        url: "/dashboard/inventory/suppliers",
      },
      {
        title: "Alertas de Stock",
        url: "/dashboard/inventory/alerts",
      },
    ],
  },
  {
    title: "Equipos",
    url: "/dashboard/equipment",
    icon: Wrench,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/equipment",
      },
      {
        title: "Catálogo",
        url: "/dashboard/equipment/catalog",
      },
      {
        title: "Mantenimientos",
        url: "/dashboard/equipment/maintenance",
      },
      {
        title: "Servicios Normativos",
        url: "/dashboard/equipment/compliance",
      },
      {
        title: "Proveedores",
        url: "/dashboard/equipment/providers",
      },
    ],
  },
  {
    title: "Cumplimiento",
    url: "/dashboard/compliance",
    icon: ShieldCheck,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/compliance",
      },
      {
        title: "Auditoría",
        url: "/dashboard/audit",
      },
      {
        title: "Reportes",
        url: "/dashboard/reports",
      },
      {
        title: "Verificaciones AI",
        url: "/dashboard/ai-verifications",
      },
    ],
  },
  {
    title: "Personal",
    url: "/dashboard/labor",
    icon: Users,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/labor",
      },
      {
        title: "Directorio",
        url: "/dashboard/employees",
      },
      {
        title: "Onboarding",
        url: "/dashboard/employees/onboarding",
      },
      {
        title: "Offboarding",
        url: "/dashboard/employees/offboarding",
      },
      {
        title: "Asistencia",
        url: "/dashboard/labor/attendance",
      },
      {
        title: "Horas Extras",
        url: "/dashboard/labor/overtime",
      },
      {
        title: "Turnos",
        url: "/dashboard/labor/shifts",
      },
      {
        title: "Cambios de Turno",
        url: "/dashboard/labor/shift-changes",
      },
      {
        title: "Constructor de Horarios",
        url: "/dashboard/labor/schedule-builder",
      },
      {
        title: "Aprobaciones",
        url: "/dashboard/labor/approvals",
      },
      {
        title: "Breaks",
        url: "/dashboard/labor/breaks",
      },
      {
        title: "Vacaciones",
        url: "/dashboard/labor/vacations",
      },
      {
        title: "Geolocalización",
        url: "/dashboard/labor/geolocation",
      },
      {
        title: "Días Festivos",
        url: "/dashboard/labor/holidays",
      },
      {
        title: "Expediente Laboral",
        url: "/dashboard/labor/documents",
      },
    ],
  },
  {
    title: "Desempeño",
    url: "/dashboard/performance",
    icon: TrendingUp,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/performance",
      },
      {
        title: "Evaluaciones",
        url: "/dashboard/performance/reviews",
      },
      {
        title: "Metas",
        url: "/dashboard/performance/goals",
      },
    ],
  },
  {
    title: "Perfil",
    url: "/dashboard/profile",
    icon: User2,
    items: [
      {
        title: "Configuración",
        url: "/dashboard/profile",
      },
      {
        title: "Mi Onboarding",
        url: "/dashboard/profile/onboarding",
      },
      {
        title: "Notificaciones",
        url: "/dashboard/profile/notifications",
      },
    ],
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    avatar: string;
    role?: 'ADMIN' | 'GERENTE' | 'EMPLEADO';
  },
  company: {
    name: string;
    plan: string;
  },
  branches: {
    id: string;
    name: string;
  }[],
  currentBranchId?: string;
}

export function AppSidebar({ user, company, branches, currentBranchId, ...props }: AppSidebarProps) {
  // Filter navigation items based on user role
  const userRole = user.role || 'EMPLEADO';

  const filteredNavMain = navMain.filter(section => {
    // EMPLEADO: Only show Operación and Personal
    if (userRole === 'EMPLEADO') {
      return section.title === 'Operación' || section.title === 'Personal';
    }
    // GERENTE: Hide Organización (company/branches management)
    if (userRole === 'GERENTE') {
      return section.title !== 'Organización';
    }
    // ADMIN: Show everything
    return true;
  }).map(section => {
    // Filter sub-items based on role
    const filteredItems = section.items?.filter(item => {
      if (userRole === 'EMPLEADO') {
        // Empleados can't access schedules, builder, or HR management
        return !item.url.includes('/schedules') && !item.url.includes('/builder') && !item.url.includes('/employees');
      }
      return true;
    });

    return {
      ...section,
      items: filteredItems
    };
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavCompany
          company={company}
          branches={branches}
          currentBranchId={currentBranchId}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
