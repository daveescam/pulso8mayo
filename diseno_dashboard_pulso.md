# Diseño de Dashboard - Sistema Pulso HORECA
## Especificación de UI usando shadcn/ui Components & Blocks

---

## 1. Resumen Ejecutivo

Este documento define la arquitectura visual y de componentes para el dashboard del sistema Pulso HORECA, utilizando **shadcn/ui** como biblioteca base de componentes. El diseño prioriza:

- **Usabilidad**: Interfaces intuitivas para usuarios HORECA
- **Responsive Design**: Optimizado para desktop, tablet y móvil
- **Accesibilidad**: Cumplimiento WCAG 2.1 AA
- **Performance**: Carga rápida y actualizaciones en tiempo real
- **Escalabilidad**: Componentes reutilizables y modulares

### Componentes shadcn/ui Disponibles
- ✅ **79 variantes de Charts** (bar, line, pie, area, radar, radial)
- ✅ **63 componentes de Card** (con forms, hover, skeleton)
- ✅ **20 componentes de Table** (data tables, sortable, filterable)
- ✅ **15+ Sidebar variants** (collapsible, with submenus, file tree)
- ✅ **Dashboard-01 block** (dashboard completo con sidebar, charts, data table)

### Componentes UI Ya Implementados
```
/components/ui/
  ├── button.tsx
  ├── checkbox.tsx
  ├── dialog.tsx
  ├── input.tsx
  ├── label.tsx
  ├── progress.tsx
  ├── select.tsx
  ├── switch.tsx
  └── textarea.tsx
```

---

## 2. Arquitectura de Navegación

### 2.1 Layout Principal

```
┌─────────────────────────────────────────────────────────────┐
│  Header (Fixed Top)                                         │
│  [Logo] [Search] [Notifications] [User Menu]               │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ Sidebar  │  Main Content Area                              │
│ (Fixed)  │  (Scrollable)                                   │
│          │                                                  │
│ Nav      │  [Breadcrumbs]                                  │
│ Items    │  [Page Title]                                   │
│          │  [Content]                                      │
│          │                                                  │
│          │                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

**Componentes shadcn recomendados**:
- `sidebar-05` - Sidebar con submenus colapsables
- `dashboard-01` - Layout base completo

### 2.2 Estructura de Navegación

```typescript
const navigation = [
  {
    section: "Principal",
    items: [
      { name: "Dashboard", icon: "LayoutDashboard", href: "/dashboard" },
      { name: "Mis Tareas", icon: "CheckSquare", href: "/dashboard/my-tasks", badge: "5" }
    ]
  },
  {
    section: "Operaciones",
    items: [
      { name: "Workflows", icon: "Workflow", href: "/dashboard/workflows" },
      { name: "Turnos", icon: "Clock", href: "/dashboard/labor" },
      { name: "Incidentes", icon: "AlertTriangle", href: "/dashboard/incidents", badge: "2" }
    ]
  },
  {
    section: "Gestión",
    items: [
      { name: "Organización", icon: "Building", href: "/dashboard/organization" },
      { name: "Equipo", icon: "Users", href: "/dashboard/team" },
      { name: "Compliance", icon: "Shield", href: "/dashboard/compliance" }
    ]
  },
  {
    section: "Configuración",
    items: [
      { name: "Templates", icon: "FileText", href: "/dashboard/builder" },
      { name: "Ajustes", icon: "Settings", href: "/dashboard/settings" }
    ]
  }
]
```

---

## 3. Dashboard Ejecutivo (Home)

### 3.1 Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard Ejecutivo                    [Filtros: Hoy ▼]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ KPI Card │ │ KPI Card │ │ KPI Card │ │ KPI Card │      │
│ │  Workflows│ │ Compliance│ │  Turnos  │ │Incidentes│      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│ ┌─────────────────────────┐ ┌─────────────────────────┐   │
│ │ Compliance Score        │ │ Workflows por Estado    │   │
│ │ [Radial Chart]          │ │ [Bar Chart]             │   │
│ │                         │ │                         │   │
│ └─────────────────────────┘ └─────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Actividad Reciente                                  │   │
│ │ [Data Table con últimas 10 acciones]               │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Componentes Detallados

#### KPI Cards (4 cards superiores)
**Componente shadcn**: `card` + custom styling

```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  change: number; // Porcentaje de cambio
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'red';
}

// Ejemplo de uso:
<KPICard
  title="Workflows Completados"
  value="24"
  change={+12}
  trend="up"
  icon={CheckCircle}
  color="green"
/>
```

**Diseño visual**:
```
┌────────────────────────┐
│ 📊 Workflows Completados│
│                        │
│ 24        ↑ +12%      │
│ Hoy                    │
└────────────────────────┘
```

#### Compliance Score Chart
**Componente shadcn**: `chart-radial-label` o `chart-radial-text`

```typescript
const complianceData = [
  { category: "NOM-251", score: 95, fill: "hsl(var(--chart-1))" },
  { category: "NOM-035", score: 88, fill: "hsl(var(--chart-2))" },
  { category: "Labor", score: 92, fill: "hsl(var(--chart-3))" }
]
```

**Visual**:
```
┌─────────────────────────┐
│ Compliance Score        │
│                         │
│      ╱───╲              │
│     │ 92% │  Overall    │
│      ╲───╱              │
│                         │
│ ● NOM-251: 95%         │
│ ● NOM-035: 88%         │
│ ● Labor: 92%           │
└─────────────────────────┘
```

#### Workflows por Estado
**Componente shadcn**: `chart-bar-mixed` o `chart-bar-label`

```typescript
const workflowStatusData = [
  { status: "Completados", count: 24, fill: "hsl(var(--chart-1))" },
  { status: "En Progreso", count: 8, fill: "hsl(var(--chart-2))" },
  { status: "Pendientes", count: 12, fill: "hsl(var(--chart-3))" },
  { status: "Vencidos", count: 2, fill: "hsl(var(--destructive))" }
]
```

#### Actividad Reciente
**Componente shadcn**: `table` + `data-table-demo`

```typescript
interface ActivityLog {
  id: string;
  user: string;
  action: string;
  workflow: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

const columns = [
  { accessorKey: "user", header: "Usuario" },
  { accessorKey: "action", header: "Acción" },
  { accessorKey: "workflow", header: "Workflow" },
  { accessorKey: "timestamp", header: "Fecha" },
  { accessorKey: "status", header: "Estado" }
]
```

---

## 4. Dashboard de Workflows

### 4.1 Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Workflows                    [+ Nuevo Workflow] [Filtros]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Tabs: Todos | Asignados | Completados | Templates]       │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Búsqueda: [___________] [Filtro: Estado ▼] [Fecha] │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Workflow Cards Grid (3 columnas)                    │   │
│ │                                                      │   │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│ │ │ Apertura │ │  Cierre  │ │Limpieza  │            │   │
│ │ │Restaurant│ │Restaurant│ │          │            │   │
│ │ │          │ │          │ │          │            │   │
│ │ │ [Iniciar]│ │ [Iniciar]│ │ [Iniciar]│            │   │
│ │ └──────────┘ └──────────┘ └──────────┘            │   │
│ │                                                      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Componentes Detallados

#### Workflow Card
**Componente shadcn**: `card` + `card-with-form`

```typescript
interface WorkflowCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: string;
  icon: string;
  status: 'available' | 'in_progress' | 'completed';
  assignedTo?: string;
  dueDate?: Date;
  progress?: number; // 0-100
}
```

**Diseño visual**:
```
┌────────────────────────┐
│ 🍽️ Apertura Restaurant │
│                        │
│ Checklist de apertura  │
│ diaria del restaurante │
│                        │
│ ⏱️ 15 min              │
│ 👤 Juan Pérez          │
│                        │
│ [Progress: 60%]        │
│ ────────────           │
│                        │
│ [Continuar] [Ver]     │
└────────────────────────┘
```

#### Filtros y Búsqueda
**Componentes shadcn**: `input`, `select`, `calendar-27` (chart filter)

```typescript
<div className="flex gap-4">
  <Input 
    placeholder="Buscar workflows..." 
    icon={Search}
  />
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="Estado" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos</SelectItem>
      <SelectItem value="pending">Pendientes</SelectItem>
      <SelectItem value="in_progress">En Progreso</SelectItem>
      <SelectItem value="completed">Completados</SelectItem>
    </SelectContent>
  </Select>
  <DateRangePicker />
</div>
```

---

## 5. Dashboard de Labor/Turnos

### 5.1 Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Gestión de Turnos              [Hoy: 19 Ene 2026] [◀ ▶]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ Activos  │ │En Descanso│ │Completados│ │Hrs Total│      │
│ │    8     │ │     2     │ │    12     │ │  96.5   │      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│ [Tabs: Vista Tabla | Vista Calendario | Reportes]         │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Turnos Activos                                      │   │
│ │ ┌─────────────────────────────────────────────────┐ │   │
│ │ │ Empleado │ Entrada │ Estado │ Hrs │ Acciones   │ │   │
│ │ ├─────────────────────────────────────────────────┤ │   │
│ │ │ Juan P.  │ 08:00   │ 🟢     │ 3.5 │ [Descanso] │ │   │
│ │ │ María G. │ 08:30   │ 🟡     │ 3.0 │ [Terminar] │ │   │
│ │ │ Carlos R.│ 09:00   │ 🟢     │ 2.5 │ [Descanso] │ │   │
│ │ └─────────────────────────────────────────────────┘ │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────┐ ┌─────────────────────────┐   │
│ │ Horas por Día (Semana)  │ │ Compliance Laboral      │   │
│ │ [Line Chart]            │ │ [Pie Chart]             │   │
│ └─────────────────────────┘ └─────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Componentes Detallados

#### Tabla de Turnos Activos
**Componente shadcn**: `data-table-demo` con acciones

```typescript
interface ShiftRow {
  id: string;
  employee: {
    name: string;
    avatar: string;
    role: string;
  };
  clockIn: Date;
  clockOut?: Date;
  status: 'ACTIVE' | 'ON_BREAK' | 'COMPLETED';
  totalHours: number;
  breakMinutes: number;
  complianceFlags: string[];
}

const columns = [
  {
    accessorKey: "employee",
    header: "Empleado",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={row.original.employee.avatar} />
          <AvatarFallback>{row.original.employee.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{row.original.employee.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.employee.role}</div>
        </div>
      </div>
    )
  },
  {
    accessorKey: "clockIn",
    header: "Entrada",
    cell: ({ row }) => format(row.original.clockIn, "HH:mm")
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => (
      <Badge variant={getStatusVariant(row.original.status)}>
        {getStatusLabel(row.original.status)}
      </Badge>
    )
  },
  {
    accessorKey: "totalHours",
    header: "Horas",
    cell: ({ row }) => `${row.original.totalHours.toFixed(1)}h`
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleBreak(row.original.id)}>
            Iniciar Descanso
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleClockOut(row.original.id)}>
            Terminar Turno
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleViewDetails(row.original.id)}>
            Ver Detalles
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
]
```

#### Horas por Día Chart
**Componente shadcn**: `chart-line-dots` o `chart-area-default`

```typescript
const weeklyHoursData = [
  { day: "Lun", hours: 96, target: 88 },
  { day: "Mar", hours: 92, target: 88 },
  { day: "Mié", hours: 88, target: 88 },
  { day: "Jue", hours: 94, target: 88 },
  { day: "Vie", hours: 102, target: 88 },
  { day: "Sáb", hours: 110, target: 88 },
  { day: "Dom", hours: 85, target: 88 }
]
```

#### Compliance Laboral Chart
**Componente shadcn**: `chart-pie-donut` o `chart-pie-label`

```typescript
const complianceData = [
  { category: "Cumplimiento", value: 85, fill: "hsl(var(--chart-1))" },
  { category: "Tardanzas", value: 10, fill: "hsl(var(--chart-2))" },
  { category: "Faltas", value: 5, fill: "hsl(var(--destructive))" }
]
```

---

## 6. Dashboard de Compliance

### 6.1 Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Compliance & Reportes          [Generar Reporte ▼]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ NOM-251  │ │ NOM-035  │ │  Labor   │ │ Próxima  │      │
│ │   95%    │ │   88%    │ │   92%    │ │Auditoría │      │
│ │  🟢      │ │  🟡      │ │  🟢      │ │ 15 días  │      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Compliance Trend (Últimos 6 meses)                  │   │
│ │ [Area Chart con múltiples series]                   │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌──────────────────────┐ ┌──────────────────────────┐     │
│ │ Workflows Críticos   │ │ Reportes Disponibles     │     │
│ │ [Lista con status]   │ │ [Lista descargable]      │     │
│ └──────────────────────┘ └──────────────────────────┘     │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Próximos Vencimientos                               │   │
│ │ [Timeline con fechas importantes]                   │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Componentes Detallados

#### Compliance Score Cards
**Componente shadcn**: `card` con indicador visual

```typescript
interface ComplianceScoreCardProps {
  standard: string; // "NOM-251", "NOM-035", etc.
  score: number; // 0-100
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastAudit: Date;
  nextAudit: Date;
  trend: number; // Cambio vs mes anterior
}
```

**Diseño visual**:
```
┌────────────────────────┐
│ NOM-251 (COFEPRIS)     │
│                        │
│       95%              │
│   ████████░░           │
│                        │
│ 🟢 Excelente           │
│ Última: 15 Dic 2025   │
│ Próxima: 15 Mar 2026  │
│                        │
│ ↑ +3% vs mes anterior │
└────────────────────────┘
```

#### Compliance Trend Chart
**Componente shadcn**: `chart-area-default` o `chart-line-label`

```typescript
const complianceTrendData = [
  { month: "Ago", nom251: 92, nom035: 85, labor: 90 },
  { month: "Sep", nom251: 93, nom035: 86, labor: 91 },
  { month: "Oct", nom251: 94, nom035: 87, labor: 91 },
  { month: "Nov", nom251: 94, nom035: 87, labor: 92 },
  { month: "Dic", nom251: 95, nom035: 88, labor: 92 },
  { month: "Ene", nom251: 95, nom035: 88, labor: 92 }
]
```

#### Workflows Críticos
**Componente shadcn**: `card` + lista personalizada

```typescript
interface CriticalWorkflow {
  id: string;
  name: string;
  frequency: string;
  lastCompleted: Date;
  nextDue: Date;
  status: 'on_time' | 'due_soon' | 'overdue';
  complianceStandard: string;
}

// Visual:
<Card>
  <CardHeader>
    <CardTitle>Workflows Críticos</CardTitle>
  </CardHeader>
  <CardContent>
    {criticalWorkflows.map(workflow => (
      <div key={workflow.id} className="flex items-center justify-between py-3 border-b">
        <div>
          <div className="font-medium">{workflow.name}</div>
          <div className="text-sm text-muted-foreground">
            {workflow.complianceStandard} • {workflow.frequency}
          </div>
        </div>
        <Badge variant={getStatusVariant(workflow.status)}>
          {getStatusLabel(workflow.status)}
        </Badge>
      </div>
    ))}
  </CardContent>
</Card>
```

#### Reportes Disponibles
**Componente shadcn**: `card` + lista con acciones

```typescript
interface ComplianceReport {
  id: string;
  name: string;
  type: 'NOM-251' | 'NOM-035' | 'LABOR' | 'CUSTOM';
  period: string;
  generatedAt: Date;
  format: 'PDF' | 'EXCEL';
  size: string;
}

// Visual con botones de descarga
<Card>
  <CardHeader>
    <CardTitle>Reportes Disponibles</CardTitle>
    <Button size="sm" onClick={handleGenerateReport}>
      + Generar Nuevo
    </Button>
  </CardHeader>
  <CardContent>
    {reports.map(report => (
      <div key={report.id} className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-medium">{report.name}</div>
            <div className="text-sm text-muted-foreground">
              {format(report.generatedAt, "dd MMM yyyy")} • {report.size}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => handleDownload(report.id)}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    ))}
  </CardContent>
</Card>
```

---

## 7. Dashboard de Incidentes

### 7.1 Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Incidentes                     [Filtros] [Exportar]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ Críticos │ │Advertencia│ │Resueltos │ │Tiempo Prom│      │
│ │    2     │ │     5     │ │    18    │ │  2.3h    │      │
│ │  🔴      │ │  🟡       │ │  🟢      │ │          │      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Incidentes Activos                                  │   │
│ │ ┌─────────────────────────────────────────────────┐ │   │
│ │ │ Severidad│Título│Workflow│Detectado│Estado│Acción│ │   │
│ │ ├─────────────────────────────────────────────────┤ │   │
│ │ │ 🔴 CRÍTICO│Temp.│Apertura│10:30│Abierto│[Ver]│ │   │
│ │ │ 🟡 WARNING│Limpieza│Cierre│09:15│Proceso│[Ver]│ │   │
│ │ └─────────────────────────────────────────────────┘ │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌──────────────────────┐ ┌──────────────────────────┐     │
│ │ Incidentes por Tipo  │ │ Tiempo de Resolución     │     │
│ │ [Pie Chart]          │ │ [Bar Chart]              │     │
│ └──────────────────────┘ └──────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Componentes Detallados

#### Tabla de Incidentes
**Componente shadcn**: `data-table-demo` con expandible rows

```typescript
interface IncidentRow {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'FATAL';
  title: string;
  description: string;
  workflowName: string;
  executionId: string;
  detectedAt: Date;
  status: 'DETECTED' | 'IN_REMEDIATION' | 'RESOLVED' | 'ESCALATED';
  assignedTo?: string;
  remediationProtocol?: {
    steps: string[];
    maxAttempts: number;
    currentAttempt: number;
  };
  photoUrl?: string;
}

// Expandible row para mostrar detalles de remediación
const ExpandedRow = ({ incident }: { incident: IncidentRow }) => (
  <div className="p-4 bg-muted/50">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="font-semibold mb-2">Descripción</h4>
        <p className="text-sm">{incident.description}</p>
        
        {incident.photoUrl && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Evidencia</h4>
            <img src={incident.photoUrl} alt="Evidencia" className="rounded-lg" />
          </div>
        )}
      </div>
      
      {incident.remediationProtocol && (
        <div>
          <h4 className="font-semibold mb-2">Protocolo de Remediación</h4>
          <div className="space-y-2">
            {incident.remediationProtocol.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="mt-1">
                  {idx < incident.remediationProtocol.currentAttempt ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Progress 
              value={(incident.remediationProtocol.currentAttempt / incident.remediationProtocol.maxAttempts) * 100} 
            />
            <p className="text-sm text-muted-foreground mt-1">
              Intento {incident.remediationProtocol.currentAttempt} de {incident.remediationProtocol.maxAttempts}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
)
```

---

## 8. Workflow Builder

### 8.1 Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Constructor de Workflows      [Guardar] [Vista Previa]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────┐ ┌──────────────────────────────────────┐ │
│ │ Componentes  │ │ Canvas (Drag & Drop Area)            │ │
│ │              │ │                                      │ │
│ │ 📝 Texto     │ │  ┌─────────────────┐                │ │
│ │ 🔢 Número    │ │  │ 1. Título       │                │ │
│ │ ✅ Sí/No     │ │  │ [Text Input]    │                │ │
│ │ 📷 Foto      │ │  └─────────────────┘                │ │
│ │ ✍️ Firma     │ │         ↓                            │ │
│ │ ☑️ Checklist │ │  ┌─────────────────┐                │ │
│ │ ⏱️ Timer     │ │  │ 2. Temperatura  │                │ │
│ │ 📋 Selección │ │  │ [Number + Photo]│                │ │
│ │              │ │  │ [AI Verify: ✓]  │                │ │
│ │              │ │  └─────────────────┘                │ │
│ │              │ │         ↓                            │ │
│ │              │ │  ┌─────────────────┐                │ │
│ │              │ │  │ 3. Limpieza OK? │                │ │
│ │              │ │  │ [Yes/No]        │                │ │
│ │              │ │  └─────────────────┘                │ │
│ └──────────────┘ └──────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Propiedades del Step Seleccionado                   │   │
│ │ [Form con configuración: título, tipo, validación]  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Componentes Detallados

**Componentes shadcn necesarios**:
- `card` para step containers
- `dialog` para configuración de steps
- `select` para tipo de step
- `switch` para opciones (required, AI verification)
- `textarea` para descripciones
- Drag & Drop library (react-dnd o dnd-kit)

---

## 9. Perfil de Usuario y Configuración

### 9.1 Layout de Perfil

```
┌─────────────────────────────────────────────────────────────┐
│ Mi Perfil                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────────────┐ ┌──────────────────────────────┐ │
│ │ Información Personal │ │ Configuración de Cuenta      │ │
│ │                      │ │                              │ │
│ │ [Avatar]             │ │ 🔔 Notificaciones            │ │
│ │ Juan Pérez           │ │ ├─ Email: ✓                 │ │
│ │ Gerente              │ │ ├─ WhatsApp: ✓              │ │
│ │ juan@restaurant.com  │ │ └─ Push: ✗                  │ │
│ │                      │ │                              │ │
│ │ [Editar Perfil]      │ │ 🌐 Idioma: Español          │ │
│ │                      │ │ 🎨 Tema: Sistema            │ │
│ └──────────────────────┘ │ 🕐 Zona Horaria: CDMX       │ │
│                          └──────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Actividad Reciente                                  │   │
│ │ [Timeline de últimas acciones]                      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Componentes Reutilizables Recomendados

### 10.1 Componentes shadcn a Instalar

#### Componentes Base (Ya instalados ✅)
- ✅ `button`
- ✅ `card`
- ✅ `checkbox`
- ✅ `dialog`
- ✅ `input`
- ✅ `label`
- ✅ `progress`
- ✅ `select`
- ✅ `switch`
- ✅ `textarea`

#### Componentes Necesarios (Por instalar 📦)
```bash
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
npx shadcn@latest add calendar
npx shadcn@latest add popover
npx shadcn@latest add separator
npx shadcn@latest add skeleton
npx shadcn@latest add toast
npx shadcn@latest add tooltip
npx shadcn@latest add chart
```

#### Blocks Recomendados
```bash
# Dashboard completo base
npx shadcn@latest add dashboard-01

# Sidebar con submenus
npx shadcn@latest add sidebar-05

# Charts específicos
npx shadcn@latest add chart-bar-label
npx shadcn@latest add chart-line-dots
npx shadcn@latest add chart-pie-donut
npx shadcn@latest add chart-radial-label
npx shadcn@latest add chart-area-default
```

### 10.2 Componentes Custom a Crear

#### KPICard Component
```typescript
// components/dashboard/KPICard.tsx
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red'
}

export function KPICard({ title, value, change, trend, icon, color = 'blue' }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    orange: 'bg-orange-500/10 text-orange-500',
    red: 'bg-red-500/10 text-red-500'
  }

  const trendIcon = {
    up: <ArrowUp className="h-4 w-4" />,
    down: <ArrowDown className="h-4 w-4" />,
    neutral: <Minus className="h-4 w-4" />
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          {change !== undefined && trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {trendIcon[trend]}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### StatusBadge Component
```typescript
// components/ui/status-badge.tsx
import { Badge } from "@/components/ui/badge"

type Status = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface StatusBadgeProps {
  status: Status
  children: React.ReactNode
}

const statusVariants = {
  success: 'bg-green-500/10 text-green-700 hover:bg-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20',
  error: 'bg-red-500/10 text-red-700 hover:bg-red-500/20',
  info: 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20',
  neutral: 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20'
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return (
    <Badge className={statusVariants[status]}>
      {children}
    </Badge>
  )
}
```

#### EmptyState Component
```typescript
// components/ui/empty-state.tsx
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

---

## 11. Sistema de Diseño y Tokens

### 11.1 Colores (Tailwind + shadcn)

```css
/* globals.css - Variables CSS */
:root {
  /* Brand Colors */
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  
  /* Semantic Colors */
  --success: 142 76% 36%;
  --warning: 38 92% 50%;
  --error: 0 84% 60%;
  --info: 221 83% 53%;
  
  /* Chart Colors */
  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;
  
  /* Status Colors */
  --status-active: 142 76% 36%;
  --status-pending: 38 92% 50%;
  --status-completed: 221 83% 53%;
  --status-failed: 0 84% 60%;
}
```

### 11.2 Tipografía

```typescript
// Font Stack
const fontConfig = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace']
}

// Type Scale
const typography = {
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-semibold tracking-tight',
  h3: 'text-2xl font-semibold tracking-tight',
  h4: 'text-xl font-semibold',
  body: 'text-base',
  small: 'text-sm',
  xs: 'text-xs'
}
```

### 11.3 Spacing y Layout

```typescript
// Container Sizes
const containers = {
  sm: 'max-w-screen-sm',   // 640px
  md: 'max-w-screen-md',   // 768px
  lg: 'max-w-screen-lg',   // 1024px
  xl: 'max-w-screen-xl',   // 1280px
  '2xl': 'max-w-screen-2xl' // 1536px
}

// Sidebar Width
const sidebarWidth = '280px'
const sidebarCollapsedWidth = '80px'

// Header Height
const headerHeight = '64px'
```

---

## 12. Responsive Design Strategy

### 12.1 Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / Small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px' // Large desktop
}
```

### 12.2 Layout Adaptations

#### Mobile (< 768px)
- Sidebar colapsado por defecto (drawer)
- KPI cards en 2 columnas
- Charts en stack vertical
- Tablas con scroll horizontal
- Bottom navigation bar

#### Tablet (768px - 1024px)
- Sidebar colapsable
- KPI cards en 2-3 columnas
- Charts en 2 columnas
- Tablas completas

#### Desktop (> 1024px)
- Sidebar fijo
- KPI cards en 4 columnas
- Charts en grid flexible
- Tablas con todas las columnas

---

## 13. Data Loading States

### 13.1 Skeleton Loaders

```typescript
// components/ui/skeleton-card.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function KPICardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
```

### 13.2 Empty States

Usar `EmptyState` component para:
- No hay workflows asignados
- No hay incidentes activos
- No hay turnos hoy
- Búsqueda sin resultados

---

## 14. Interacciones y Animaciones

### 14.1 Transiciones

```typescript
// Usar motion de framer-motion (ya instalado)
import { motion } from "motion/react"

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>

// Slide in from bottom
<motion.div
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.4 }}
>
  {content}
</motion.div>
```

### 14.2 Hover States

```typescript
// Card hover effect
className="transition-all hover:shadow-lg hover:scale-[1.02]"

// Button hover
className="transition-colors hover:bg-primary/90"
```

---

## 15. Implementación Roadmap

### Sprint 1: Core Dashboard (1 semana)
1. ✅ Instalar componentes shadcn faltantes
2. ✅ Crear layout base con sidebar
3. ✅ Implementar Dashboard Ejecutivo
4. ✅ Crear KPICard component
5. ✅ Integrar charts básicos

### Sprint 2: Workflows & Labor (1 semana)
1. ✅ Dashboard de Workflows
2. ✅ Workflow cards grid
3. ✅ Dashboard de Labor/Turnos
4. ✅ Tabla de turnos activos
5. ✅ Charts de labor analytics

### Sprint 3: Compliance & Incidents (1 semana)
1. ✅ Dashboard de Compliance
2. ✅ Compliance score cards
3. ✅ Dashboard de Incidentes
4. ✅ Tabla de incidentes con expandible rows
5. ✅ Generador de reportes

### Sprint 4: Builder & Settings (1 semana)
1. ✅ Workflow Builder UI
2. ✅ Drag & drop functionality
3. ✅ Perfil de usuario
4. ✅ Configuración general
5. ✅ Polish y optimizaciones

---

## 16. Conclusiones y Recomendaciones

### ✅ Ventajas de usar shadcn/ui

1. **Componentes Accesibles**: Basados en Radix UI (WCAG compliant)
2. **Customizable**: Código fuente en tu proyecto, 100% customizable
3. **Type-Safe**: TypeScript nativo
4. **Modern Stack**: React 19, Tailwind CSS 4
5. **Rich Library**: 79 charts, 63 cards, 20 tables, 15+ sidebars

### 🎯 Mejores Prácticas

1. **Consistencia**: Usar componentes shadcn para todo
2. **Reutilización**: Crear componentes custom solo cuando sea necesario
3. **Performance**: Lazy load charts y tablas grandes
4. **Accessibility**: Mantener estructura semántica HTML
5. **Responsive**: Mobile-first approach

### 📦 Componentes Prioritarios

**Alta Prioridad**:
- `table` + `data-table-demo` (para todas las tablas)
- `chart` + variants (para analytics)
- `badge` (para status indicators)
- `avatar` (para usuarios)
- `dropdown-menu` (para acciones)
- `tabs` (para navegación secundaria)

**Media Prioridad**:
- `calendar` (para date pickers)
- `popover` (para tooltips avanzados)
- `toast` (para notificaciones)
- `skeleton` (para loading states)

**Baja Prioridad**:
- `tooltip` (puede usar title attribute inicialmente)
- `separator` (puede usar border classes)

### 🚀 Next Steps

1. Instalar componentes shadcn faltantes
2. Crear layout base con `dashboard-01` block
3. Implementar KPICard y StatusBadge components
4. Integrar charts en Dashboard Ejecutivo
5. Crear data tables para Workflows, Labor, Incidents
6. Implementar responsive design
7. Agregar loading states y empty states
8. Testing de accesibilidad

---

*Documento generado el 19 de enero de 2026*
*Basado en análisis del sistema Pulso HORECA y shadcn/ui registry*
