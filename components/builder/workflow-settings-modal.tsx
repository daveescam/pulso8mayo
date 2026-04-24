"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Calendar, Clock, Users, Zap, Plus, X, Trash2 } from 'lucide-react';

interface WorkflowSettingsModalProps {
    open: boolean;
    onClose: () => void;
    templateId: string;
    initialSettings?: {
        version?: number;
        activo?: boolean;
        requiereIA?: boolean;
        duracionEstimada?: string;
        cumplimientoNormativo?: string[];
        tags?: string[];
        aiConfig?: AICofig;
        complianceConfig?: ComplianceConfig;
        completionActions?: CompletionAction[];
        frequency?: string;
        days?: string[];
        assignedRoles?: string[];
        assignedShifts?: string[];
        shiftTimes?: Record<string, string>;
        triggers?: Trigger[];
    };
}

interface AICofig {
    provider?: string;
    fallbackProvider?: string;
    maxRetries?: number;
}

interface ComplianceConfig {
    complianceType?: string;
    regulationSection?: string;
    requiredFrequency?: string;
    auditable?: boolean;
    evidenceRequired?: boolean;
    criticalForCompliance?: boolean;
}

interface CompletionAction {
    type: string;
    target?: string[];
    channel?: string;
    message?: string;
    status?: string;
    validFor?: number;
    template?: string;
    includePhotos?: boolean;
    workflowId?: string;
    delay?: number;
    priority?: string;
    assignTo?: string;
    item?: string;
    quantity?: number;
    requireMedicalClearance?: boolean;
}

const TAGS_SUGGESTIONS = [
    'higiene', 'seguridad', 'ia-verificacion', 'compliance', 'diario', 'semanal',
    'calidad', 'operaciones', 'mantenimiento', 'capacitacion', 'emergencia', 'inventario'
];

const FREQUENCIES = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'on_demand', label: 'On Demand' }
];

const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
];

const ROLES = [
    { value: 'EMPLEADO', label: 'Employee' },
    { value: 'CHEF', label: 'Chef' },
    { value: 'GERENTE', label: 'Manager' },
    { value: 'SUPERVISOR', label: 'Supervisor' },
    { value: 'OWNER', label: 'Owner' }
];

const SHIFTS = [
    { value: 'morning', label: 'Morning (6AM - 2PM)' },
    { value: 'afternoon', label: 'Afternoon (2PM - 10PM)' },
    { value: 'night', label: 'Night (10PM - 6AM)' },
    { value: 'all', label: 'All Shifts' }
];

const EVENTS = [
    { value: 'INVENTORY_LOW', label: 'Low Inventory Alert' },
    { value: 'SHIFT_ENDED', label: 'Shift Ended' },
    { value: 'TEMPERATURE_ALERT', label: 'Critical Temperature' },
    { value: 'ONBOARDING_REQUIRED', label: 'New Employee Onboarding' },
    { value: 'INCIDENT_REPORTED', label: 'Incident Reported' }
];

// Compliance types for Mexican regulations
const COMPLIANCE_TYPES = [
    { value: 'NOM_251', label: 'NOM-251 (COFEPRIS - Buenas Prácticas)' },
    { value: 'NOM_035', label: 'NOM-035 (STPS - Factores de Riesgo Psicosocial)' },
    { value: 'NOM_030', label: 'NOM-030 (STPS - Servicios de Prevención)' },
    { value: 'NOM_019', label: 'NOM-019 (STPS - Seguridad y Salud)' },
    { value: 'NOM_017', label: 'NOM-017 (STPS - Equipo de Protección)' },
    { value: 'LFT', label: 'LFT (Ley Federal del Trabajo)' },
    { value: 'LSSN', label: 'LSSN (Ley del Seguro Social)' },
    { value: 'ISR', label: 'ISR (Impuesto sobre la Renta)' },
    { value: 'IVA', label: 'IVA (Impuesto al Valor Agregado)' },
    { value: 'INFONAVIT', label: 'INFONAVIT (Crédito de Vivienda)' },
    { value: 'FONACOT', label: 'FONACOT (Crédito para Trabajadores)' },
    { value: 'NONE', label: 'No aplica regulación específica' }
];

const REGULATION_SECTIONS = [
    { value: 'ARTICLE_132', label: 'Artículo 132 LFT (Obligaciones del patrón)' },
    { value: 'ARTICLE_134', label: 'Artículo 134 LFT (Trabajo de menores)' },
    { value: 'ARTICLE_153', label: 'Artículo 153 LFT (Trabajo peligroso)' },
    { value: 'CHAPTER_V', label: 'Capítulo V LFT (Trabajo de mujeres)' },
    { value: 'CHAPTER_VII', label: 'Capítulo VII LFT (Agencia de empleo)' },
    { value: 'CHAPTER_IX', label: 'Capítulo IX LFT (Subcontratación)' },
    { value: 'SECTION_I', label: 'Sección I NOM-251 (Higiene)' },
    { value: 'SECTION_II', label: 'Sección II NOM-251 (Calidad)' },
    { value: 'SECTION_III', label: 'Sección III NOM-251 (Seguridad)' },
    { value: 'ARTICLE_3', label: 'Artículo 3 NOM-035 (Identificación)' },
    { value: 'ARTICLE_4', label: 'Artículo 4 NOM-035 (Análisis)' },
    { value: 'ARTICLE_5', label: 'Artículo 5 NOM-035 (Medidas)' },
    { value: 'OTHER', label: 'Otra sección' }
];

const FREQUENCIES_COMPLIANCE = [
    { value: 'DAILY', label: 'Diario' },
    { value: 'WEEKLY', label: 'Semanal' },
    { value: 'BIWEEKLY', label: 'Quincenal' },
    { value: 'MONTHLY', label: 'Mensual' },
    { value: 'QUARTERLY', label: 'Trimestral' },
    { value: 'SEMIANNUAL', label: 'Semestral' },
    { value: 'ANNUAL', label: 'Anual' },
    { value: 'ON_DEMAND', label: 'Bajo demanda' }
];

interface Trigger {
    eventName: string;
    conditions: Record<string, any>;
}

export function WorkflowSettingsModal({ open, onClose, templateId, initialSettings }: WorkflowSettingsModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Workflow metadata
    const [version, setVersion] = useState(1);
    const [activo, setActivo] = useState(true);
    const [requiereIA, setRequiereIA] = useState(false);
    const [duracionEstimada, setDuracionEstimada] = useState('');
    const [cumplimientoNormativo, setCumplimientoNormativo] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');

    // AI Config
    const [aiProvider, setAiProvider] = useState('moondream');
    const [aiFallbackProvider, setAiFallbackProvider] = useState('openai');
    const [aiMaxRetries, setAiMaxRetries] = useState(2);

    // Compliance Config
    const [complianceType, setComplianceType] = useState('');
    const [regulationSection, setRegulationSection] = useState('');
    const [requiredFrequency, setRequiredFrequency] = useState('');
    const [auditable, setAuditable] = useState(false);
    const [evidenceRequired, setEvidenceRequired] = useState(false);
    const [criticalForCompliance, setCriticalForCompliance] = useState(false);

    // Completion Actions
    const [completionActions, setCompletionActions] = useState<CompletionAction[]>([]);

    // Scheduling settings
    const [enabled, setEnabled] = useState(true);
    const [frequency, setFrequency] = useState('daily');
    const [selectedDays, setSelectedDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);

    // Assignment settings
    const [assignedRoles, setAssignedRoles] = useState<string[]>(['EMPLEADO']);
    const [assignedShifts, setAssignedShifts] = useState<string[]>(['morning']);

    // Shift-specific times
    const [shiftTimes, setShiftTimes] = useState<Record<string, string>>({
        morning: '08:00',
        afternoon: '15:00',
        night: '23:00',
        all: '08:00'
    });

    const [autoAssign, setAutoAssign] = useState(true);

    // Trigger settings
    const [triggers, setTriggers] = useState<Trigger[]>([]);
    const [newTriggerEvent, setNewTriggerEvent] = useState('');

    useEffect(() => {
        if (open) {
            loadSettings();
        }
    }, [open, templateId]);

    // Initialize state from initialSettings prop when it changes or when modal opens
    useEffect(() => {
        if (initialSettings) {
            setVersion(initialSettings.version || 1);
            setActivo(initialSettings.activo ?? true);
            setRequiereIA(initialSettings.requiereIA ?? false);
            setDuracionEstimada(initialSettings.duracionEstimada || '');
            setCumplimientoNormativo(initialSettings.cumplimientoNormativo || []);
            setTags(initialSettings.tags || []);
            setCompletionActions(initialSettings.completionActions || []);

            if (initialSettings.aiConfig) {
                setAiProvider(initialSettings.aiConfig.provider || 'moondream');
                setAiFallbackProvider(initialSettings.aiConfig.fallbackProvider || 'openai');
                setAiMaxRetries(initialSettings.aiConfig.maxRetries || 2);
            }

            if (initialSettings.complianceConfig) {
                setComplianceType(initialSettings.complianceConfig.complianceType || '');
                setRegulationSection(initialSettings.complianceConfig.regulationSection || '');
                setRequiredFrequency(initialSettings.complianceConfig.requiredFrequency || '');
                setAuditable(initialSettings.complianceConfig.auditable ?? false);
                setEvidenceRequired(initialSettings.complianceConfig.evidenceRequired ?? false);
                setCriticalForCompliance(initialSettings.complianceConfig.criticalForCompliance ?? false);
            }

            setFrequency(initialSettings.frequency || "daily");
            setSelectedDays(initialSettings.days || []);
            setAssignedRoles(initialSettings.assignedRoles || []);
            setAssignedShifts(initialSettings.assignedShifts || []);
            setShiftTimes(initialSettings.shiftTimes || {
                morning: "08:00",
                afternoon: "14:00",
                night: "22:00",
            });
            setTriggers(initialSettings.triggers || []);
        }
    }, [initialSettings, open]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/templates/${templateId}/settings`);
            if (response.ok) {
                const data = await response.json();
                if (data.settings) {
                    const s = data.settings;
                    setEnabled(s.enabled ?? true);
                    setFrequency(s.frequency || 'daily');
                    setVersion(s.version || 1);
                    setActivo(s.activo ?? true);
                    setRequiereIA(s.requiereIA ?? false);
                    setDuracionEstimada(s.duracionEstimada || '');
                    setCumplimientoNormativo(s.cumplimientoNormativo || []);
                    setTags(s.tags || []);
                    setCompletionActions(s.completionActions || []);

                    if (s.shiftTimes) {
                        setShiftTimes(s.shiftTimes);
                    } else if (s.time) {
                        setShiftTimes({ morning: s.time, afternoon: s.time, night: s.time, all: s.time });
                    }

                    setSelectedDays(s.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
                    setAssignedRoles(s.assignedRoles || ['EMPLEADO']);
                    setAssignedShifts(s.assignedShifts || ['morning']);
                    setAutoAssign(s.autoAssign ?? true);
                    setTriggers(s.triggers || []);

                    if (s.aiConfig) {
                        setAiProvider(s.aiConfig.provider || 'moondream');
                        setAiFallbackProvider(s.aiConfig.fallbackProvider || 'openai');
                        setAiMaxRetries(s.aiConfig.maxRetries || 2);
                    }

                    if (s.complianceConfig) {
                        setComplianceType(s.complianceConfig.complianceType || '');
                        setRegulationSection(s.complianceConfig.regulationSection || '');
                        setRequiredFrequency(s.complianceConfig.requiredFrequency || '');
                        setAuditable(s.complianceConfig.auditable ?? false);
                        setEvidenceRequired(s.complianceConfig.evidenceRequired ?? false);
                        setCriticalForCompliance(s.complianceConfig.criticalForCompliance ?? false);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/templates/${templateId}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    version,
                    activo,
                    requiereIA,
                    duracionEstimada,
                    cumplimientoNormativo,
                    tags,
                    aiConfig: {
                        provider: aiProvider,
                        fallbackProvider: aiFallbackProvider,
                        maxRetries: aiMaxRetries
                    },
                    complianceConfig: {
                        complianceType,
                        regulationSection,
                        requiredFrequency,
                        auditable,
                        evidenceRequired,
                        criticalForCompliance
                    },
                    completionActions,
                    enabled,
                    frequency,
                    shiftTimes,
                    days: selectedDays,
                    assignedRoles,
                    assignedShifts,
                    autoAssign,
                    triggers
                })
            });

            if (!response.ok) throw new Error('Failed to save settings');

            toast.success('Workflow settings saved successfully!');
            onClose();
        } catch (error) {
            toast.error('Failed to save settings');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const toggleRole = (role: string) => {
        setAssignedRoles(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    const toggleShift = (shift: string) => {
        setAssignedShifts(prev =>
            prev.includes(shift)
                ? prev.filter(s => s !== shift)
                : [...prev, shift]
        );
    };

    const addTrigger = () => {
        if (!newTriggerEvent) return;
        setTriggers(prev => [...prev, { eventName: newTriggerEvent, conditions: {} }]);
        setNewTriggerEvent('');
    };

    const removeTrigger = (index: number) => {
        setTriggers(prev => prev.filter((_, i) => i !== index));
    };

    const toggleTag = (tag: string) => {
        setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const addCustomTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags(prev => [...prev, newTag.trim()]);
            setNewTag('');
        }
    };

    const addCompletionAction = (type: string) => {
        const action: CompletionAction = { type };
        if (type === 'SEND_NOTIFICATION') {
            action.target = ['GERENTE'];
            action.channel = 'whatsapp';
            action.message = 'Workflow completed';
        } else if (type === 'UPDATE_EMPLOYEE_STATUS') {
            action.status = 'VERIFIED';
            action.validFor = 480;
        } else if (type === 'GENERATE_PDF_REPORT') {
            action.template = 'default';
            action.includePhotos = true;
        }
        setCompletionActions(prev => [...prev, action]);
    };

    const removeCompletionAction = (index: number) => {
        setCompletionActions(prev => prev.filter((_, i) => i !== index));
    };

    const updateCompletionAction = (index: number, updates: Partial<CompletionAction>) => {
        setCompletionActions(prev => {
            const newActions = [...prev];
            newActions[index] = { ...newActions[index], ...updates };
            return newActions;
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Workflow Settings</DialogTitle>
                    <DialogDescription>
                        Configure scheduling and role assignments for this workflow
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Enable/Disable */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Enable Workflow</Label>
                                <p className="text-sm text-muted-foreground">
                                    Activate this workflow for automatic scheduling
                                </p>
                            </div>
                            <Switch checked={enabled} onCheckedChange={setEnabled} />
                        </div>

                        {/* Workflow Metadata */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold">Workflow Metadata</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Version</Label>
                                    <Input type="number" value={version} onChange={(e) => setVersion(parseInt(e.target.value))} className="text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Duration (est.)</Label>
                                    <Input value={duracionEstimada} onChange={(e) => setDuracionEstimada(e.target.value)} placeholder="5-10 min" className="text-sm" />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-2">
                                    <Label className="text-xs">Active</Label>
                                    <Switch checked={activo} onCheckedChange={setActivo} />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-2">
                                    <Label className="text-xs">Requires AI</Label>
                                    <Switch checked={requiereIA} onCheckedChange={setRequiereIA} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Compliance Standards (NOM-XXX)</Label>
                                <div className="flex flex-wrap gap-2">
                                    {['NOM-251', 'NOM-035', 'NOM-030', 'NOM-019', 'NOM-017', 'LFT'].map(norm => (
                                        <button key={norm} onClick={() => {
                                            setCumplimientoNormativo(prev => prev.includes(norm) ? prev.filter(n => n !== norm) : [...prev, norm]);
                                        }} className={`px-2 py-1 rounded-md text-xs border ${cumplimientoNormativo.includes(norm) ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                            {norm}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Tags</Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {TAGS_SUGGESTIONS.map(tag => (
                                        <button key={tag} onClick={() => toggleTag(tag)} className={`px-2 py-1 rounded-md text-xs border ${tags.includes(tag) ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add custom tag..." className="text-sm" />
                                    <Button size="sm" onClick={addCustomTag} className="h-8">Add</Button>
                                </div>
                            </div>
                        </div>

                        {/* AI Configuration */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold">AI Configuration</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Provider</Label>
                                    <Select value={aiProvider} onValueChange={setAiProvider}>
                                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="moondream">Moondream</SelectItem>
                                            <SelectItem value="openai">OpenAI</SelectItem>
                                            <SelectItem value="gemini">Gemini</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Fallback Provider</Label>
                                    <Select value={aiFallbackProvider} onValueChange={setAiFallbackProvider}>
                                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="openai">OpenAI</SelectItem>
                                            <SelectItem value="moondream">Moondream</SelectItem>
                                            <SelectItem value="gemini">Gemini</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Max Retries</Label>
                                    <Input type="number" value={aiMaxRetries} onChange={(e) => setAiMaxRetries(parseInt(e.target.value))} className="text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Compliance Configuration */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold">Compliance Configuration</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Compliance Type</Label>
                                    <Select value={complianceType} onValueChange={setComplianceType}>
                                        <SelectTrigger className="text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {COMPLIANCE_TYPES.map(c => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Regulation Section</Label>
                                    <Select value={regulationSection} onValueChange={setRegulationSection}>
                                        <SelectTrigger className="text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {REGULATION_SECTIONS.map(s => (
                                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Required Frequency</Label>
                                    <Select value={requiredFrequency} onValueChange={setRequiredFrequency}>
                                        <SelectTrigger className="text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {FREQUENCIES_COMPLIANCE.map(f => (
                                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <Switch checked={auditable} onCheckedChange={setAuditable} />
                                    <Label className="text-xs">Auditable</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={evidenceRequired} onCheckedChange={setEvidenceRequired} />
                                    <Label className="text-xs">Evidence Required</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={criticalForCompliance} onCheckedChange={setCriticalForCompliance} />
                                    <Label className="text-xs">Critical for Compliance</Label>
                                </div>
                            </div>
                        </div>

                        {/* Completion Actions */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold">Completion Actions</h3>
                            <p className="text-xs text-muted-foreground">Actions executed when workflow is completed</p>

                            <div className="space-y-2">
                                <Select onValueChange={(v) => { addCompletionAction(v); }} value="">
                                    <SelectTrigger className="text-sm"><SelectValue placeholder="Add completion action..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SEND_NOTIFICATION">Send Notification</SelectItem>
                                        <SelectItem value="UPDATE_EMPLOYEE_STATUS">Update Employee Status</SelectItem>
                                        <SelectItem value="GENERATE_PDF_REPORT">Generate PDF Report</SelectItem>
                                        <SelectItem value="UPDATE_BRANCH_STATUS">Update Branch Status</SelectItem>
                                        <SelectItem value="TRIGGER_NEXT_WORKFLOW">Trigger Next Workflow</SelectItem>
                                    </SelectContent>
                                </Select>

                                {completionActions.map((action, idx) => (
                                    <div key={idx} className="border rounded p-3 space-y-2 bg-muted/20">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{action.type}</span>
                                            <Button size="sm" variant="ghost" onClick={() => removeCompletionAction(idx)} className="h-6 w-6 p-0"><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                        {action.type === 'SEND_NOTIFICATION' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Target Roles</Label>
                                                    <Input value={action.target?.join(', ') || ''} onChange={(e) => updateCompletionAction(idx, { target: e.target.value.split(',').map(s => s.trim()) })} className="text-xs" placeholder="GERENTE, OWNER" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Channel</Label>
                                                    <Select value={action.channel || 'whatsapp'} onValueChange={(v) => updateCompletionAction(idx, { channel: v })}>
                                                        <SelectTrigger className="text-xs h-7"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                                            <SelectItem value="email">Email</SelectItem>
                                                            <SelectItem value="sms">SMS</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
                                        {action.type === 'UPDATE_EMPLOYEE_STATUS' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Status</Label>
                                                    <Input value={action.status || ''} onChange={(e) => updateCompletionAction(idx, { status: e.target.value })} className="text-xs" placeholder="VERIFIED" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Valid For (min)</Label>
                                                    <Input type="number" value={action.validFor || 480} onChange={(e) => updateCompletionAction(idx, { validFor: parseInt(e.target.value) })} className="text-xs" />
                                                </div>
                                            </div>
                                        )}
                                        {action.type === 'GENERATE_PDF_REPORT' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Template</Label>
                                                    <Input value={action.template || ''} onChange={(e) => updateCompletionAction(idx, { template: e.target.value })} className="text-xs" placeholder="default" />
                                                </div>
                                                <div className="flex items-center gap-2 pt-4">
                                                    <Switch checked={action.includePhotos || false} onCheckedChange={(c) => updateCompletionAction(idx, { includePhotos: c })} />
                                                    <Label className="text-[10px]">Include Photos</Label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Scheduling Section */}
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold">Scheduling</h3>
                            </div>

                            <div className="space-y-2">
                                <Label>Frequency</Label>
                                <Select value={frequency} onValueChange={setFrequency}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FREQUENCIES.map(f => (
                                            <SelectItem key={f.value} value={f.value}>
                                                {f.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {frequency === 'weekly' && (
                                <div className="space-y-2">
                                    <Label>Days of Week</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS_OF_WEEK.map(day => (
                                            <button
                                                key={day.value}
                                                onClick={() => toggleDay(day.value)}
                                                className={`px-3 py-1 rounded-md text-sm border ${selectedDays.includes(day.value)
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-background'
                                                    }`}
                                            >
                                                {day.label.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Role Assignment Section */}
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold">Role Assignment</h3>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <Label className="text-sm">Auto-assign to available employees</Label>
                                <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
                            </div>

                            <div className="space-y-2">
                                <Label>Assigned Roles</Label>
                                <div className="flex flex-wrap gap-2">
                                    {ROLES.map(role => (
                                        <button
                                            key={role.value}
                                            onClick={() => toggleRole(role.value)}
                                            className={`px-3 py-1.5 rounded-md text-sm border ${assignedRoles.includes(role.value)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background'
                                                }`}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Assigned Shifts</Label>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Select shifts and set execution time for each
                                </p>
                                <div className="space-y-3">
                                    {SHIFTS.map(shift => {
                                        const isSelected = assignedShifts.includes(shift.value);
                                        return (
                                            <div key={shift.value} className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleShift(shift.value)}
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm border text-left ${isSelected
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-background'
                                                        }`}
                                                >
                                                    {shift.label}
                                                </button>
                                                {isSelected && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            type="time"
                                                            value={shiftTimes[shift.value] || '08:00'}
                                                            onChange={(e) => setShiftTimes(prev => ({
                                                                ...prev,
                                                                [shift.value]: e.target.value
                                                            }))}
                                                            className="w-32"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Event Triggers Section */}
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold">Event Triggers</h3>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Automatically start this workflow when specific events occur.
                            </p>

                            <div className="space-y-3">
                                {triggers.map((trigger, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-yellow-500" />
                                            <span className="font-medium">
                                                {EVENTS.find(e => e.value === trigger.eventName)?.label || trigger.eventName}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeTrigger(index)}
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="flex gap-2">
                                    <Select value={newTriggerEvent} onValueChange={setNewTriggerEvent}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select event..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EVENTS.map(e => (
                                                <SelectItem key={e.value} value={e.value}>
                                                    {e.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={addTrigger} disabled={!newTriggerEvent}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="rounded-lg bg-muted p-4 space-y-2">
                            <p className="text-sm font-medium">Summary</p>
                            <p className="text-xs text-muted-foreground">
                                This workflow will run <strong>{frequency}</strong>
                                {frequency === 'weekly' && ` on ${selectedDays.join(', ')}`}.
                                It will be assigned to <strong>{assignedRoles.join(', ')}</strong> during:
                            </p>
                            <ul className="text-xs text-muted-foreground list-disc list-inside pl-2">
                                {assignedShifts.map(shift => {
                                    const shiftLabel = SHIFTS.find(s => s.value === shift)?.label || shift;
                                    const time = shiftTimes[shift] || '08:00';
                                    return (
                                        <li key={shift}>
                                            <strong>{shiftLabel}</strong> at <strong>{time}</strong>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Settings'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
