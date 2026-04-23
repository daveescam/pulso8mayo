"use client"

import * as React from "react"
import { format, addDays, startOfWeek, eachDayOfInterval, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Clock, Calendar, Repeat, Save, Trash2, Plus, Tag } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface Employee {
    id: string
    name: string
    email?: string
    role: string
    image?: string
    branchId: string
}

interface Branch {
    id: string
    name: string
}

interface ShiftTemplate {
    id: string
    name: string
    role: string
    startTime: string
    endTime: string
    daysOfWeek: number[]
    validFrom: string
    validUntil?: string
    isActive: boolean
}

const SHIFT_TYPES = {
    MATUTINO: { label: "Matutino", defaultStart: "07:00", defaultEnd: "15:00", color: "bg-blue-500" },
    VESPERTINO: { label: "Vespertino", defaultStart: "15:00", defaultEnd: "23:00", color: "bg-orange-500" },
    NOCTURNO: { label: "Nocturno", defaultStart: "23:00", defaultEnd: "07:00", color: "bg-purple-500" },
    MIXTO: { label: "Mixto", defaultStart: "10:00", defaultEnd: "18:00", color: "bg-green-500" },
}

const WEEK_DAYS = [
    { index: 0, label: "Dom", full: "Domingo" },
    { index: 1, label: "Lun", full: "Lunes" },
    { index: 2, label: "Mar", full: "Martes" },
    { index: 3, label: "Mié", full: "Miércoles" },
    { index: 4, label: "Jue", full: "Jueves" },
    { index: 5, label: "Vie", full: "Viernes" },
    { index: 6, label: "Sáb", full: "Sábado" },
]

interface RecurringShiftBuilderProps {
    employees?: Employee[]
    branches?: Branch[]
}

export function RecurringShiftBuilder({ employees: propEmployees, branches: propBranches }: RecurringShiftBuilderProps) {
    // State
    const [employees, setEmployees] = React.useState<Employee[]>([])
    const [branches, setBranches] = React.useState<Branch[]>([])
    const [templates, setTemplates] = React.useState<ShiftTemplate[]>([])
    const [loading, setLoading] = React.useState(true)

    // Form state - Step 0: Branch
    const [selectedBranchId, setSelectedBranchId] = React.useState<string>("")

    // Form state - Step 1: Employees
    const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<string[]>([])

    // Form state - Step 2: Shift config
    const [selectedShiftType, setSelectedShiftType] = React.useState<keyof typeof SHIFT_TYPES>("MATUTINO")
    const [customStart, setCustomStart] = React.useState("")
    const [customEnd, setCustomEnd] = React.useState("")
    const [shiftRole, setShiftRole] = React.useState("EMPLEADO")

    // Form state - Step 3: Days
    const [selectedDays, setSelectedDays] = React.useState<number[]>([])

    // Form state - Step 4: Date range
    const [validFrom, setValidFrom] = React.useState(format(new Date(), "yyyy-MM-dd"))
    const [validUntil, setValidUntil] = React.useState(format(addDays(new Date(), 30), "yyyy-MM-dd"))

    // Template name
    const [templateName, setTemplateName] = React.useState("")

    // Dialog for saving template
    const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = React.useState(false)

    // Load data
    React.useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            // Fetch employees
            if (!propEmployees) {
                const usersRes = await fetch("/api/users")
                if (usersRes.ok) {
                    const response = await usersRes.json()
                    const data = response.data?.data || []
                    setEmployees(data.map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        image: u.image,
                        branchId: u.branchId
                    })))
                }
            } else {
                setEmployees(propEmployees)
            }

            // Fetch branches
            if (!propBranches) {
                const branchesRes = await fetch("/api/branches")
                if (branchesRes.ok) {
                    const branchResponse = await branchesRes.json()
                    setBranches(branchResponse.data || [])
                }
            } else {
                setBranches(propBranches)
            }

            // Fetch templates
            await loadTemplates()
        } catch (e) {
            console.error(e)
            toast.error("Error cargando datos")
        } finally {
            setLoading(false)
        }
    }

    const loadTemplates = async () => {
        try {
            const res = await fetch("/api/shift-templates?isActive=true")
            if (res.ok) {
                const response = await res.json()
                setTemplates(response.data || [])
            }
        } catch (e) {
            console.error(e)
        }
    }

    React.useEffect(() => {
        const config = SHIFT_TYPES[selectedShiftType]
        setCustomStart(config.defaultStart)
        setCustomEnd(config.defaultEnd)
        setShiftRole(selectedShiftType === "MATUTINO" || selectedShiftType === "VESPERTINO" ? "COCINERO" : "EMPLEADO")
    }, [selectedShiftType])

    const handleToggleEmployee = (employeeId: string) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        )
    }

    const handleSelectAllEmployees = () => {
        if (selectedEmployeeIds.length === employees.length) {
            setSelectedEmployeeIds([])
        } else {
            setSelectedEmployeeIds(employees.map(e => e.id))
        }
    }

    const handleToggleDay = (dayIndex: number) => {
        setSelectedDays(prev =>
            prev.includes(dayIndex)
                ? prev.filter(d => d !== dayIndex)
                : [...prev, dayIndex]
        )
    }

    const calculateShiftCount = () => {
        if (!validFrom || !validUntil) return 0
        
        const allDates = eachDayOfInterval({
            start: parseISO(validFrom),
            end: parseISO(validUntil),
        })

        const validDates = allDates.filter(date => {
            const dayOfWeek = date.getDay()
            return selectedDays.includes(dayOfWeek)
        })

        return validDates.length * selectedEmployeeIds.length
    }

    const handleSaveTemplate = async () => {
        if (!selectedBranchId) {
            toast.error("Selecciona una sucursal")
            return
        }

        if (selectedEmployeeIds.length === 0) {
            toast.error("Selecciona al menos un empleado")
            return
        }

        if (selectedDays.length === 0) {
            toast.error("Selecciona al menos un día de la semana")
            return
        }

        if (!templateName.trim()) {
            toast.error("Ingresa un nombre para la plantilla")
            return
        }

        try {
            // 1. Create template
            const templateResponse = await fetch("/api/shift-templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: templateName,
                    branchId: selectedBranchId,
                    role: shiftRole,
                    startTime: customStart,
                    endTime: customEnd,
                    daysOfWeek: selectedDays,
                    validFrom,
                    validUntil,
                }),
            })

            if (!templateResponse.ok) {
                const error = await templateResponse.json()
                throw new Error(error.message)
            }

            const template = await templateResponse.json()

            // 2. Generate shifts from template
            const generateResponse = await fetch("/api/shift-templates/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId: template.data.id,
                    userIds: selectedEmployeeIds,
                    validFrom,
                    validUntil,
                }),
            })

            if (!generateResponse.ok) {
                const error = await generateResponse.json()
                throw new Error(error.message)
            }

            const result = await generateResponse.json()

            toast.success(
                `Plantilla "${templateName}" creada. ${result.data.count} turnos generados para ${selectedEmployeeIds.length} empleados.`
            )

            // Reset form
            setTemplateName("")
            setSelectedEmployeeIds([])
            setSelectedDays([])
            setValidFrom(format(new Date(), "yyyy-MM-dd"))
            setValidUntil(format(addDays(new Date(), 30), "yyyy-MM-dd"))
            setSaveTemplateDialogOpen(false)
            loadTemplates()
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Error guardando plantilla")
        }
    }

    const handleDeleteTemplate = async (templateId: string) => {
        try {
            const response = await fetch(`/api/shift-templates?id=${templateId}`, {
                method: "DELETE",
            })

            if (response.ok) {
                toast.success("Plantilla eliminada")
                loadTemplates()
            } else {
                toast.error("Error eliminando plantilla")
            }
        } catch (e) {
            toast.error("Error eliminando plantilla")
        }
    }

    const handleApplyTemplate = async (template: ShiftTemplate) => {
        if (selectedEmployeeIds.length === 0) {
            toast.error("Selecciona empleados para aplicar la plantilla")
            return
        }

        try {
            const generateResponse = await fetch("/api/shift-templates/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId: template.id,
                    userIds: selectedEmployeeIds,
                    validFrom: validFrom,
                    validUntil: validUntil,
                }),
            })

            if (generateResponse.ok) {
                const result = await generateResponse.json()
                toast.success(`${result.data.count} turnos generados desde "${template.name}"`)
            } else {
                const error = await generateResponse.json()
                toast.error(error.message)
            }
        } catch (e) {
            toast.error("Error aplicando plantilla")
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin text-primary">Cargando...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Saved Templates */}
            {templates.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Plantillas Guardadas
                                </CardTitle>
                                <CardDescription>
                                    Aplica una plantilla existente a los empleados seleccionados
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    className="p-4 rounded-lg border bg-card hover:border-primary transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold">{template.name}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                {template.startTime} - {template.endTime}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleDeleteTemplate(template.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            <span>{template.startTime} - {template.endTime}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                            <span>
                                                {template.daysOfWeek?.map(d => WEEK_DAYS[d].label).join(", ")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-3 w-3 text-muted-foreground" />
                                            <span>{template.role}</span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Vigencia: {format(parseISO(template.validFrom), "d MMM")} - {template.validUntil ? format(parseISO(template.validUntil), "d MMM") : "Indefinido"}
                                        </p>
                                        <Button
                                            size="sm"
                                            className="w-full"
                                            onClick={() => handleApplyTemplate(template)}
                                            disabled={selectedEmployeeIds.length === 0}
                                        >
                                            Aplicar a seleccionados
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create New Template */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Crear Turno Recurrente
                    </CardTitle>
                    <CardDescription>
                        Configura un patrón de turnos que se repetirá automáticamente
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Step 0: Select Branch */}
                        <div className="space-y-3">
                            <Label className="text-base">0. Selecciona Sucursal</Label>
                            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una sucursal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(branch => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedBranchId && (
                                <p className="text-sm text-muted-foreground">
                                    Sucursal seleccionada: {branches.find(b => b.id === selectedBranchId)?.name}
                                </p>
                            )}
                        </div>

                        {/* Step 1: Select Employees */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base">1. Selecciona Empleados</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAllEmployees}
                                >
                                    {selectedEmployeeIds.length === employees.length ? "Deseleccionar todos" : "Seleccionar todos"}
                                </Button>
                            </div>
                            
                            <div className="grid gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
                                {employees.map(employee => (
                                    <div
                                        key={employee.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                            selectedEmployeeIds.includes(employee.id)
                                                ? "bg-primary/10 border-primary"
                                                : "hover:bg-muted/50"
                                        )}
                                        onClick={() => handleToggleEmployee(employee.id)}
                                    >
                                        <Checkbox
                                            checked={selectedEmployeeIds.includes(employee.id)}
                                            onCheckedChange={() => handleToggleEmployee(employee.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{employee.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {employee.role}
                                            </div>
                                        </div>
                                        <Badge variant="outline">{employee.role}</Badge>
                                    </div>
                                ))}
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                                {selectedEmployeeIds.length} de {employees.length} empleados seleccionados
                            </p>
                        </div>

                        {/* Step 2: Shift Type */}
                        <div className="space-y-3">
                            <Label className="text-base">2. Tipo de Turno</Label>
                            
                            <div className="grid gap-2">
                                {Object.entries(SHIFT_TYPES).map(([key, config]) => (
                                    <div
                                        key={key}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                            selectedShiftType === key
                                                ? "bg-primary/10 border-primary"
                                                : "hover:bg-muted/50"
                                        )}
                                        onClick={() => setSelectedShiftType(key as keyof typeof SHIFT_TYPES)}
                                    >
                                        <div className={cn("w-4 h-4 rounded-full", config.color)} />
                                        <div className="flex-1">
                                            <div className="font-medium">{config.label}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {config.defaultStart} - {config.defaultEnd}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Hora de Inicio
                                    </Label>
                                    <Input
                                        type="time"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Hora de Fin
                                    </Label>
                                    <Input
                                        type="time"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Rol del Turno</Label>
                                <Select value={shiftRole} onValueChange={setShiftRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="COCINERO">Cocinero</SelectItem>
                                        <SelectItem value="MESERO">Mesero</SelectItem>
                                        <SelectItem value="CAJERO">Cajero</SelectItem>
                                        <SelectItem value="LIMPIEZA">Limpieza</SelectItem>
                                        <SelectItem value="SEGURIDAD">Seguridad</SelectItem>
                                        <SelectItem value="EMPLEADO">Empleado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Step 3: Select Days */}
                        <div className="space-y-3">
                            <Label className="text-base">3. Días de la Semana</Label>
                            
                            <div className="flex gap-2">
                                {WEEK_DAYS.map((day) => (
                                    <Button
                                        key={day.index}
                                        type="button"
                                        variant={selectedDays.includes(day.index) ? "default" : "outline"}
                                        size="sm"
                                        className="w-12 h-12 p-0"
                                        onClick={() => handleToggleDay(day.index)}
                                    >
                                        {day.label}
                                    </Button>
                                ))}
                            </div>
                            
                            {selectedDays.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Días seleccionados: {selectedDays.map(d => WEEK_DAYS[d].full).join(", ")}
                                </p>
                            )}
                        </div>

                        {/* Step 4: Date Range */}
                        <div className="space-y-3">
                            <Label className="text-base">4. Período de Vigencia</Label>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Fecha de Inicio
                                    </Label>
                                    <Input
                                        type="date"
                                        value={validFrom}
                                        onChange={(e) => setValidFrom(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Fecha de Fin
                                    </Label>
                                    <Input
                                        type="date"
                                        value={validUntil}
                                        min={validFrom}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 text-sm">
                                    <Repeat className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Resumen:</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Se crearán <span className="font-medium text-foreground">{calculateShiftCount()}</span> turnos 
                                    para <span className="font-medium text-foreground">{selectedEmployeeIds.length}</span> empleados, 
                                    desde el {format(parseISO(validFrom), "d 'de' MMMM")} hasta el {format(parseISO(validUntil), "d 'de' MMMM, yyyy")}
                                </p>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={() => setSaveTemplateDialogOpen(true)}
                                disabled={
                                    !selectedBranchId ||
                                    selectedEmployeeIds.length === 0 ||
                                    selectedDays.length === 0 ||
                                    !validFrom ||
                                    !validUntil
                                }
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Plantilla y Generar Turnos
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Template Dialog */}
            <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Guardar Plantilla</DialogTitle>
                        <DialogDescription>
                            Ingresa un nombre para esta plantilla de turnos recurrentes
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre de la Plantilla</Label>
                            <Input
                                placeholder="Ej: Turno Mañana Cocina, Fin de Semana, etc."
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                            />
                        </div>

                        <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                            <p><span className="font-medium">Empleados:</span> {selectedEmployeeIds.length}</p>
                            <p><span className="font-medium">Días:</span> {selectedDays.map(d => WEEK_DAYS[d].label).join(", ")}</p>
                            <p><span className="font-medium">Horario:</span> {customStart} - {customEnd}</p>
                            <p><span className="font-medium">Período:</span> {format(parseISO(validFrom), "d MMM")} - {format(parseISO(validUntil), "d MMM, yyyy")}</p>
                            <p className="pt-2 border-t"><span className="font-medium">Total de turnos:</span> {calculateShiftCount()}</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveTemplateDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveTemplate}>
                            Crear Plantilla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
