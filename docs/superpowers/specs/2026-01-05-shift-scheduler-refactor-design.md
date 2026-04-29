# Diseño: Refactorización del Sistema de Scheduling

**Fecha:** 2026-01-05  
**Status:** Aprobado por usuario  
**Autor:** OpenCode Agent

## Resumen Ejecutivo

El módulo de scheduling actual sufre de duplicación extrema de componentes (`unified-shift-scheduler.tsx` de 1,447 líneas y `weekly-shift-planner.tsx` de 827 líneas), rutas confusas y falta de separación de responsabilidades. Este documento describe la arquitectura para consolidar todo en un sistema limpio, mantenible y escalable.

## Problemas Actuales Identificados

### 1. Duplicación de Componentes
- `unified-shift-scheduler.tsx` - 1,447 líneas, componente monolítico
- `weekly-shift-planner.tsx` - 827 líneas, duplica funcionalidad
- `schedule-builder.tsx` - Constructor adicional
- `recurring-shift-builder.tsx` - Turnos recurrentes separados

### 2. Rutas Confusas
- `/dashboard/labor/shifts` - Usa WeeklyShiftPlanner + RecurringShiftBuilder
- `/dashboard/labor/schedule-builder` - Usa UnifiedShiftScheduler (¿diferente?)

### 3. Falta de Arquitectura Limpia
- Componentes hacen llamadas a API directamente
- Sin hooks personalizados reutilizables
- Lógica de negocio mezclada con UI
- Sin capa de servicios

### 4. Modelo de Datos Fragmentado
- `plannedShifts` - Turnos planificados
- `shiftTemplates` - Plantillas recurrentes
- `shiftSessions` - Sesiones reales
- `shiftChangeRequests` - Cambios de turno
- Sin relación clara entre entidades

## Arquitectura Propuesta

### Principios de Diseño

1. **Separación de Responsabilidades:** UI puros + Hooks + Servicios
2. **Composición sobre Herencia:** Componentes pequeños y reutilizables
3. **Validación en Tiempo Real:** Preview mientras edita + Validación final
4. **Cumplimiento LFT:** Validaciones automáticas de ley federal del trabajo

### Estructura de Archivos

```
📁 components/labor/shifts/
├── index.tsx                          # Export principal
├── ShiftSchedulerContainer.tsx        # Layout y coordinación
├── WeeklyMatrixView.tsx              # Vista matriz semanal
├── ShiftCell.tsx                      # Celda individual de turno
├── ShiftEditorDialog.tsx              # Diálogo edición/creación
├── ShiftTemplateManager.tsx           # Gestión de plantillas
├── FilterToolbar.tsx                  # Barra de filtros avanzados
├── ConflictAlertPanel.tsx             # Panel de alertas LFT
├── BulkAssignmentPanel.tsx            # Asignación masiva
├── ExportActions.tsx                  # Exportación Excel/PDF
└── ComplianceSummary.tsx              # Resumen cumplimiento

📁 lib/services/
├── shift-service.ts                   # CRUD y operaciones
├── shift-validation-service.ts        # Validaciones LFT
├── shift-template-service.ts          # Plantillas recurrentes
└── index.ts                           # Re-exports

📁 hooks/
├── use-shifts.ts                      # Gestión de turnos
├── use-shift-validation.ts            # Validaciones en tiempo real
├── use-shift-templates.ts             # Plantillas
├── use-shift-export.ts                # Exportación
└── use-weekly-schedule.ts             # Vista semanal

📁 lib/types/
└── shifts.ts                          # Tipos centralizados
```

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    ShiftSchedulerContainer                       │
│                 (Coordina estado y layout)                       │
└───────────────────────────┬───────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐   ┌────────▼────────┐   ┌─────▼──────┐
│ FilterToolbar│   │ WeeklyMatrixView│   │Side Panel │
└──────────────┘   └────────┬──────────┘   └────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
        ┌─────▼────┐  ┌────▼────┐  ┌─────▼─────┐
        │ ShiftCell│  │ ShiftCell│  │ ShiftCell │
        └─────┬────┘  └────┬────┘  └─────┬─────┘
              │            │              │
        ┌─────▼────────────▼──────────────▼─────┐
        │      ShiftEditorDialog (modal)       │
        └───────────────────────────────────────┘
```

### Capa de Servicios

#### ShiftService

```typescript
export class ShiftService {
  // CRUD Básico
  async getShifts(filters: ShiftFilters): Promise<Shift[]>
  async getShiftById(id: string): Promise<Shift>
  async createShift(data: CreateShiftInput): Promise<Shift>
  async updateShift(id: string, data: UpdateShiftInput): Promise<Shift>
  async deleteShift(id: string): Promise<void>
  
  // Operaciones batch
  async bulkCreate(shifts: CreateShiftInput[]): Promise<Shift[]>
  async bulkUpdate(updates: BulkUpdate[]): Promise<Shift[]>
  async bulkDelete(ids: string[]): Promise<void>
  
  // Workflow
  async publishShifts(shiftIds: string[]): Promise<void>
  async unpublishShifts(shiftIds: string[]): Promise<void>
  async duplicateShifts(shiftIds: string[], targetWeek: Date): Promise<Shift[]>
  
  // Exportación
  async exportToExcel(filters: ShiftFilters): Promise<Blob>
  async exportToPDF(filters: ShiftFilters): Promise<Blob>
  async exportToICS(shiftIds: string[]): Promise<Blob>
}
```

#### ShiftValidationService

```typescript
export interface LFTViolation {
  type: 'DAILY_HOURS' | 'WEEKLY_HOURS' | 'REST_PERIOD' | 'OVERTIME'
  severity: 'warning' | 'error'
  message: string
  shiftId: string
}

export class ShiftValidationService {
  // Validaciones LFT México
  validateLFTCompliance(shift: Shift): LFTViolation[]
  validateNoConflicts(shifts: Shift[]): Conflict[]
  validateWeeklyHours(employeeId: string, weekStart: Date): HoursValidation
  validateRestPeriods(employeeId: string, shifts: Shift[]): RestValidation
  validateOvertime(shift: Shift): OvertimeCalculation
  
  // Validaciones de negocio
  validateShiftOverlap(shifts: Shift[]): OverlapCheck
  validateRequiredRoles(shift: Shift, requirements: RoleRequirement[]): RoleValidation
  validateEmployeeAvailability(employeeId: string, shift: Shift): AvailabilityCheck
}
```

#### ShiftTemplateService

```typescript
export class ShiftTemplateService {
  async getTemplates(): Promise<ShiftTemplate[]>
  async getTemplateById(id: string): Promise<ShiftTemplate>
  async createTemplate(data: CreateTemplateInput): Promise<ShiftTemplate>
  async updateTemplate(id: string, data: UpdateTemplateInput): Promise<ShiftTemplate>
  async deleteTemplate(id: string): Promise<void>
  
  // Aplicar plantillas
  async applyTemplate(
    templateId: string, 
    dateRange: DateRange,
    options: ApplyOptions
  ): Promise<Shift[]>
  
  async previewTemplateApplication(
    templateId: string,
    dateRange: DateRange
  ): Promise<ShiftPreview[]>
}
```

### Hooks Personalizados

#### useShifts

```typescript
export function useShifts(filters: ShiftFilters) {
  const queryClient = useQueryClient()
  
  // Queries
  const { data: shifts, isLoading, error } = useQuery({
    queryKey: ['shifts', filters],
    queryFn: () => shiftService.getShifts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
  
  // Mutations
  const createMutation = useMutation({
    mutationFn: shiftService.createShift,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] })
  })
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => shiftService.updateShift(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] })
  })
  
  const deleteMutation = useMutation({
    mutationFn: shiftService.deleteShift,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] })
  })
  
  return {
    shifts,
    isLoading,
    error,
    createShift: createMutation.mutateAsync,
    updateShift: updateMutation.mutateAsync,
    deleteShift: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
```

#### useShiftValidation

```typescript
export function useShiftValidation() {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: [],
    warnings: [],
    isValidating: false
  })
  
  const validateShift = useCallback(async (shift: Shift) => {
    setValidationState(prev => ({ ...prev, isValidating: true }))
    
    const violations = await validationService.validateLFTCompliance(shift)
    const conflicts = await validationService.validateNoConflicts([shift])
    
    setValidationState({
      errors: violations.filter(v => v.severity === 'error'),
      warnings: [...violations.filter(v => v.severity === 'warning'), ...conflicts],
      isValidating: false
    })
    
    return violations.length === 0
  }, [])
  
  const validateBatch = useCallback(async (shifts: Shift[]) => {
    // Validación optimizada para batch
  }, [])
  
  return {
    validationState,
    validateShift,
    validateBatch,
    clearValidation: () => setValidationState({ errors: [], warnings: [], isValidating: false })
  }
}
```

#### useShiftTemplates

```typescript
export function useShiftTemplates() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['shift-templates'],
    queryFn: () => templateService.getTemplates()
  })
  
  const applyMutation = useMutation({
    mutationFn: ({ templateId, dateRange, options }) => 
      templateService.applyTemplate(templateId, dateRange, options)
  })
  
  const previewMutation = useMutation({
    mutationFn: ({ templateId, dateRange }) =>
      templateService.previewTemplateApplication(templateId, dateRange)
  })
  
  return {
    templates,
    isLoading,
    applyTemplate: applyMutation.mutateAsync,
    previewTemplate: previewMutation.mutateAsync,
    isApplying: applyMutation.isPending,
    isPreviewing: previewMutation.isPending,
    previewData: previewMutation.data
  }
}
```

### Tipos de Datos Centralizados

```typescript
// lib/types/shifts.ts

export interface Shift {
  id: string
  userId: string
  userName: string
  userEmail?: string
  branchId: string
  branchName: string
  role: string
  shiftDate: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
  notes?: string
  templateId?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface ShiftTemplate {
  id: string
  name: string
  description?: string
  branchId: string
  role: string
  startTime: string
  endTime: string
  daysOfWeek: number[] // 0-6 (Domingo-Sábado)
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ShiftFilters {
  branchId?: string
  employeeId?: string
  role?: string
  startDate?: string
  endDate?: string
  status?: ('DRAFT' | 'PUBLISHED' | 'CANCELLED')[]
}

export interface CreateShiftInput {
  userId: string
  branchId: string
  role: string
  shiftDate: string
  startTime: string
  endTime: string
  notes?: string
  status?: 'DRAFT' | 'PUBLISHED'
}

export interface LFTViolation {
  type: 'DAILY_HOURS' | 'WEEKLY_HOURS' | 'REST_PERIOD' | 'OVERTIME'
  severity: 'warning' | 'error'
  message: string
  shiftId: string
  details?: Record<string, unknown>
}

export interface WeeklySchedule {
  weekStart: Date
  weekEnd: Date
  shifts: Shift[]
  conflicts: LFTViolation[]
  summary: {
    totalShifts: number
    totalHours: number
    byEmployee: Record<string, { shifts: number; hours: number }>
    byRole: Record<string, { shifts: number; hours: number }>
  }
}
```

### Validaciones LFT Implementadas

#### 1. Máximo de Horas Diarias
- **Diurno:** 8 horas máximo (Art. 66 LFT)
- **Nocturno:** 7 horas máximo (Art. 67 LFT)
- **Mixto:** 8 horas máximo (Art. 66 LFT)

#### 2. Horas Extras
- **Primeras 9 horas:** Pago doble (Art. 68 LFT)
- **Después de 9 horas:** Pago triple (Art. 68 LFT)

#### 3. Descansos Obligatorios
- **Mínimo 30 minutos** después de 5 horas continuas (NOM-035)
- **Entre jornadas:** Mínimo 8 horas de descanso (Art. 69 LFT)

#### 4. Límite Semanal
- **Máximo 48 horas semanales** en jornada ordinaria (Art. 66 LFT)

## Funcionalidades Requeridas

### MVP (Fase 1)
1. ✅ Vista matriz semanal con drag & drop
2. ✅ CRUD de turnos
3. ✅ Filtros básicos (sucursal, empleado, rol)
4. ✅ Validación LFT básica (horas diarias/semanales)
5. ✅ Estados: Draft → Published

### Fase 2
1. ✅ Exportación Excel/PDF
2. ✅ Plantillas de turnos recurrentes
3. ✅ Validación de conflictos en tiempo real
4. ✅ Asignación masiva
5. ✅ Panel de cumplimiento LFT

### Fase 3
1. ✅ Vista calendario mensual
2. ✅ Notificaciones WhatsApp
3. ✅ Solicitudes de cambio de turno
4. ✅ Integración con asistencia

## Ruta de Migración

### Paso 1: Preparación
1. Crear nuevos archivos de tipos
2. Implementar servicios
3. Crear hooks

### Paso 2: Componentes UI
1. Crear componentes atómicos
2. Integrar con hooks
3. Pruebas manuales

### Paso 3: Migración
1. Actualizar `/dashboard/labor/shifts`
2. Eliminar `/dashboard/labor/schedule-builder`
3. Redirigir a ruta única

### Paso 4: Limpieza
1. Deprecar componentes viejos
2. Actualizar documentación
3. Remover código duplicado

## Consideraciones de Performance

### Optimizaciones Implementadas
1. **TanStack Query** para caché y sincronización
2. **Virtualización** de lista para +100 empleados
3. **Debouncing** en filtros (300ms)
4. **Validación lazy** - solo al guardar o al solicitar
5. **Code splitting** por vistas (semanal/mensual)

### Métricas Objetivo
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Validación de shift: < 100ms
- Guardado de cambios: < 500ms

## Documentación API

Los servicios consumirán endpoints REST existentes:

```
GET    /api/shifts                    # Listar turnos
POST   /api/shifts                    # Crear turno
PATCH  /api/shifts/:id                # Actualizar turno
DELETE /api/shifts/:id                # Eliminar turno
POST   /api/shifts/bulk               # Operaciones batch
POST   /api/shifts/:id/publish        # Publicar turno
GET    /api/shifts/templates          # Plantillas
POST   /api/shifts/templates/:id/apply # Aplicar plantilla
GET    /api/shifts/export             # Exportar datos
```

## Criterios de Aceptación

- [ ] Toda funcionalidad de UnifiedShiftScheduler migrada
- [ ] Toda funcionalidad de WeeklyShiftPlanner migrada
- [ ] Validaciones LFT funcionando en tiempo real
- [ ] Exportación Excel/PDF funcionando
- [ ] Plantillas de turnos recurrentes funcionando
- [ ] UI responsive (desktop y tablet)
- [ ] Tests unitarios para servicios
- [ ] Tests de integración para hooks
- [ ] Documentación actualizada
- [ ] Ruta única consolidada

## Notas de Implementación

1. **Backward Compatibility:** Mantener APIs existentes durante migración
2. **Feature Flags:** Usar flags para activar nuevo sistema gradualmente
3. **Rollback Plan:** Script para revertir a componentes anteriores si es necesario
4. **Data Migration:** No requiere migración de datos (misma estructura)

---

**Aprobado por:** David (Usuario)  
**Fecha de aprobación:** 2026-01-05  
**Próximo paso:** Crear plan de implementación con skill writing-plans
