
"use client";

import React from 'react';
import { useBuilder } from './builder-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { LogicRule } from './builder-context';
import { LogicRuleCard } from './logic-rule-card';

export function PropertyEditor() {
    const { steps, selectedStepId, updateStep, removeStep } = useBuilder();
    const step = steps.find(s => s.id === selectedStepId);

    if (!step) {
        return (
            <div className="w-80 flex-shrink-0 border-l bg-accent/10 p-6 flex flex-col justify-center items-center text-center">
                <p className="text-muted-foreground">Select a step to edit properties</p>
            </div>
        );
    }

    return (
        <div className="w-80 flex-shrink-0 border-l bg-background p-6 space-y-6 overflow-y-auto h-full">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{step.type} Settings</h3>
                <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                        value={step.title}
                        onChange={(e) => updateStep(step.id, { title: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        value={step.description || ''}
                        onChange={(e) => updateStep(step.id, { description: e.target.value })}
                        className="min-h-[80px]"
                    />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label className="cursor-pointer" htmlFor="req-switch">Required</Label>
                    <Switch
                        id="req-switch"
                        checked={step.required}
                        onCheckedChange={(c: boolean) => updateStep(step.id, { required: c })}
                    />
                </div>
            </div>

            {/* Validation Config */}
            {(step.type === 'number' || step.type === 'TemperatureField') && (
                <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium text-sm">Validation</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Min Value</Label>
                            <Input
                                type="number"
                                value={step.validation?.min ?? ''}
                                onChange={(e) => updateStep(step.id, {
                                    validation: { ...step.validation, min: parseFloat(e.target.value) }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Max Value</Label>
                            <Input
                                type="number"
                                value={step.validation?.max ?? ''}
                                onChange={(e) => updateStep(step.id, {
                                    validation: { ...step.validation, max: parseFloat(e.target.value) }
                                })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Error Message</Label>
                        <Input
                            placeholder="Value out of range"
                            value={step.validation?.message || ''}
                            onChange={(e) => updateStep(step.id, {
                                validation: { ...step.validation, message: e.target.value }
                            })}
                        />
                    </div>
                </div>
            )}

            {/* Type specific config */}
            {(step.type === 'photo' || step.type === 'PhotoField' || step.type === 'Photo') && (
                <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium text-sm">AI Verification</h4>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="ai-enabled">Enable AI Check</Label>
                        <Switch
                            id="ai-enabled"
                            checked={step.aiVerification?.enabled || false}
                            onCheckedChange={(c: boolean) => updateStep(step.id, {
                                aiVerification: { ...step.aiVerification, enabled: c }
                            })}
                        />
                    </div>

                    {(step.aiVerification?.enabled) && (
                        <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label className="text-xs">Prompt Instruction</Label>
                                <Textarea
                                    placeholder="e.g. Verify the employee is wearing a hairnet..."
                                    className="h-20 text-sm"
                                    value={step.aiVerification?.prompt || ''}
                                    onChange={(e) => updateStep(step.id, {
                                        aiVerification: { ...step.aiVerification, enabled: true, prompt: e.target.value }
                                    })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Expected Conditions (comma separated)</Label>
                                <Input
                                    placeholder="hairnet_present, uniform_clean"
                                    className="text-sm"
                                    value={step.aiVerification?.expectedConditions?.join(', ') || ''}
                                    onChange={(e) => updateStep(step.id, {
                                        aiVerification: {
                                            ...step.aiVerification,
                                            enabled: true,
                                            expectedConditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                        }
                                    })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Confidence Threshold (0-1)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="1"
                                    className="text-sm"
                                    value={step.aiVerification?.threshold || 0.8}
                                    onChange={(e) => updateStep(step.id, {
                                        aiVerification: { ...step.aiVerification, enabled: true, threshold: parseFloat(e.target.value) }
                                    })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Checklist Options */}
            {(step.type === 'checklist' || step.type === 'ChecklistField' || step.type === 'Checklist') && (
                <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Checklist Options</h4>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                const currentOptions = step.options || [];
                                updateStep(step.id, {
                                    options: [...currentOptions, `Option ${currentOptions.length + 1}`]
                                });
                            }}
                            className="h-7 text-xs"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                        </Button>
                    </div>

                    {step.options && step.options.length > 0 ? (
                        <div className="space-y-2">
                            {step.options.map((option, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        value={option}
                                        onChange={(e) => {
                                            const newOptions = [...step.options!];
                                            newOptions[idx] = e.target.value;
                                            updateStep(step.id, { options: newOptions });
                                        }}
                                        placeholder={`Option ${idx + 1}`}
                                        className="text-sm"
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                            const newOptions = step.options!.filter((_, i) => i !== idx);
                                            updateStep(step.id, { options: newOptions });
                                        }}
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            No options defined. Click "Add Option" to create one.
                        </p>
                    )}
                </div>
            )}

            {/* Select Options */}
            {(step.type === 'multiple_choice' || step.type === 'ChoiceField' || step.type === 'Choice' || step.type === 'SelectField' || step.type === 'Select') && (
                <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Choice Options</h4>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                const currentOptions = step.options || [];
                                updateStep(step.id, {
                                    options: [...currentOptions, `Option ${currentOptions.length + 1}`]
                                });
                            }}
                            className="h-7 text-xs"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                        </Button>
                    </div>

                    {step.options && step.options.length > 0 ? (
                        <div className="space-y-2">
                            {step.options.map((option, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        value={option}
                                        onChange={(e) => {
                                            const newOptions = [...step.options!];
                                            newOptions[idx] = e.target.value;
                                            updateStep(step.id, { options: newOptions });
                                        }}
                                        placeholder={`Option ${idx + 1}`}
                                        className="text-sm"
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                            const newOptions = step.options!.filter((_, i) => i !== idx);
                                            updateStep(step.id, { options: newOptions });
                                        }}
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            No options defined. Click "Add Option" to create one.
                        </p>
                    )}
                </div>
            )}
            {/* Timer Options */}
            {(step.type === 'timer') && (
                <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium text-sm">Timer Settings</h4>
                    <div className="space-y-2">
                        <Label className="text-xs">Duration (seconds)</Label>
                        <Input
                            type="number"
                            min="1"
                            value={step.config?.durationSeconds || 60}
                            onChange={(e) => updateStep(step.id, {
                                config: { ...step.config, durationSeconds: parseInt(e.target.value) || 0 }
                            })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="auto-start" className="text-xs">Auto Start</Label>
                        <Switch
                            id="auto-start"
                            checked={step.config?.autoStart || false}
                            onCheckedChange={(c) => updateStep(step.id, {
                                config: { ...step.config, autoStart: c }
                            })}
                        />
                    </div>
                </div>
            )}
            {/* Advanced Logic Rules (Visual Editor) */}
            <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Logic Rules & Incidents</h4>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            const newRule: LogicRule = {
                                id: crypto.randomUUID(),
                                condition: '',
                                severity: 'WARNING',
                                message: ''
                            };
                            updateStep(step.id, {
                                logicRules: [...(step.logicRules || []), newRule]
                            });
                        }}
                        className="h-7 text-xs"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Rule
                    </Button>
                </div>

                {step.logicRules && step.logicRules.length > 0 ? (
                    <div className="space-y-2">
                        {step.logicRules.map((rule, idx) => (
                            <LogicRuleCard
                                key={rule.id}
                                rule={rule}
                                onUpdate={(updates) => {
                                    const newRules = [...step.logicRules!];
                                    newRules[idx] = { ...newRules[idx], ...updates };
                                    updateStep(step.id, { logicRules: newRules });
                                }}
                                onDelete={() => {
                                    const newRules = step.logicRules!.filter((_, i) => i !== idx);
                                    updateStep(step.id, { logicRules: newRules });
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                        No logic rules defined. Click "Add Rule" to create one.
                    </p>
                )}
            </div>
        </div>
    );
}
