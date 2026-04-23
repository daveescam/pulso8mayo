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
import { Loader2, Calendar, Clock, Users, Zap, Plus, X } from 'lucide-react';

interface WorkflowSettingsModalProps {
    open: boolean;
    onClose: () => void;
    templateId: string;
}

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

interface Trigger {
    eventName: string;
    conditions: Record<string, any>;
}

export function WorkflowSettingsModal({ open, onClose, templateId }: WorkflowSettingsModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

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

    const loadSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/templates/${templateId}/settings`);
            if (response.ok) {
                const data = await response.json();
                if (data.settings) {
                    setEnabled(data.settings.enabled ?? true);
                    setFrequency(data.settings.frequency || 'daily');

                    // Handle both old format (single time) and new format (shiftTimes object)
                    if (data.settings.shiftTimes) {
                        setShiftTimes(data.settings.shiftTimes);
                    } else if (data.settings.time) {
                        // Backward compatibility: use old single time for all shifts
                        setShiftTimes({
                            morning: data.settings.time,
                            afternoon: data.settings.time,
                            night: data.settings.time,
                            all: data.settings.time
                        });
                    }

                    setSelectedDays(data.settings.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
                    setAssignedRoles(data.settings.assignedRoles || ['EMPLEADO']);
                    setAssignedShifts(data.settings.assignedShifts || ['morning']);
                    setAutoAssign(data.settings.autoAssign ?? true);
                    setTriggers(data.settings.triggers || []);
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
