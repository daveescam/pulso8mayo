
"use client";

import React from 'react';
import { useBuilder } from './builder-context';
import { getStepCategory, STEP_TYPE_DISPLAY } from '@/lib/workflow-type-map';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
                <h3 className="font-semibold text-lg">{STEP_TYPE_DISPLAY[step.type] || step.type} Settings</h3>
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
                    <Label>Placeholder</Label>
                    <Input
                        value={step.placeholder || ''}
                        onChange={(e) => updateStep(step.id, { placeholder: e.target.value })}
                        placeholder="Placeholder text..."
                    />
                </div>

                <div className="space-y-2">
                    <Label>Default Value</Label>
                    <Input
                        value={step.defaultValue || ''}
                        onChange={(e) => updateStep(step.id, { defaultValue: e.target.value })}
                        placeholder="Default value..."
                    />
                </div>

                <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                        value={step.category || ''}
                        onChange={(e) => updateStep(step.id, { category: e.target.value })}
                        placeholder="e.g. Safety, Quality, Training"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    {getStepCategory(step.type) === 'INFO' ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Rich Text</Label>
                                <Switch
                                    checked={step.config?.richText || false}
                                    onCheckedChange={(c) => updateStep(step.id, {
                                        config: { ...step.config, richText: c }
                                    })}
                                />
                            </div>
                            {step.config?.richText ? (
                                <Textarea
                                    value={step.description || ''}
                                    onChange={(e) => updateStep(step.id, { description: e.target.value })}
                                    className="min-h-[120px] font-mono text-sm"
                                    placeholder="Use HTML tags for rich formatting: <strong>bold</strong>, <em>italic</em>, <br> for line breaks, etc."
                                />
                            ) : (
                                <Textarea
                                    value={step.description || ''}
                                    onChange={(e) => updateStep(step.id, { description: e.target.value })}
                                    className="min-h-[80px]"
                                />
                            )}
                        </div>
                    ) : (
                        <Textarea
                            value={step.description || ''}
                            onChange={(e) => updateStep(step.id, { description: e.target.value })}
                            className="min-h-[80px]"
                        />
                    )}
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label className="cursor-pointer" htmlFor="req-switch">Required</Label>
                    <Switch
                        id="req-switch"
                        checked={step.required}
                        onCheckedChange={(c: boolean) => updateStep(step.id, { required: c })}
                    />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label className="cursor-pointer" htmlFor="readonly-switch">Read Only</Label>
                    <Switch
                        id="readonly-switch"
                        checked={step.readOnly || false}
                        onCheckedChange={(c: boolean) => updateStep(step.id, { readOnly: c })}
                    />
                </div>
            </div>

            {/* Validation Config */}
            {(getStepCategory(step.type) === 'NUMBER') && (
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

            {/* Time Validation */}
            {(getStepCategory(step.type) === 'TIME' || getStepCategory(step.type) === 'TIMER' || getStepCategory(step.type) === 'DATE') && (
                <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium text-sm">Time Validation</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Min Time</Label>
                            <Input
                                type="time"
                                value={step.validation?.minTime || ''}
                                onChange={(e) => updateStep(step.id, {
                                    validation: { ...step.validation, minTime: e.target.value }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Max Time</Label>
                            <Input
                                type="time"
                                value={step.validation?.maxTime || ''}
                                onChange={(e) => updateStep(step.id, {
                                    validation: { ...step.validation, maxTime: e.target.value }
                                })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Error Message</Label>
                        <Input
                            placeholder="Time out of range"
                            value={step.validation?.message || ''}
                            onChange={(e) => updateStep(step.id, {
                                validation: { ...step.validation, message: e.target.value }
                            })}
                        />
                    </div>
                </div>
            )}

            {/* GPS/Location Validation */}
            {(getStepCategory(step.type) === 'LOCATION') && (
                <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium text-sm">Location Validation</h4>
                    <div className="space-y-2">
                        <Label className="text-xs">Radius (meters)</Label>
                        <Input
                            type="number"
                            placeholder="100"
                            value={step.validation?.radiusMeters || ''}
                            onChange={(e) => updateStep(step.id, {
                                validation: { ...step.validation, radiusMeters: parseInt(e.target.value) }
                            })}
                        />
                    </div>
                </div>
            )}

            {/* Type specific config */}
            {(getStepCategory(step.type) === 'PHOTO') && (
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

                            <div className="grid grid-cols-2 gap-4">
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
                                <div className="space-y-2">
                                    <Label className="text-xs">Auto Fill Field ID</Label>
                                    <Input
                                        placeholder="Field ID to auto-fill"
                                        className="text-sm"
                                        value={step.aiVerification?.autoFillField || ''}
                                        onChange={(e) => updateStep(step.id, {
                                            aiVerification: { ...step.aiVerification, enabled: true, autoFillField: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Conditional Branches */}
            {(getStepCategory(step.type) === 'YESNO' || getStepCategory(step.type) === 'SELECT' || getStepCategory(step.type) === 'CHECKBOX') && (
                <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium text-sm">Conditional Branches</h4>
                    <p className="text-xs text-muted-foreground">
                        Skip to a different step based on the answer
                    </p>

                    {step.branches && step.branches.length > 0 ? (
                        <div className="space-y-2">
                            {step.branches.map((branch, idx) => (
                                <div key={branch.id || idx} className="border rounded p-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium">Branch {idx + 1}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                const newBranches = step.branches!.filter((_, i) => i !== idx);
                                                updateStep(step.id, { branches: newBranches });
                                            }}
                                            className="h-6 w-6 p-0 text-destructive"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <Input
                                        placeholder="Condition (e.g., value == 'no')"
                                        value={branch.condition}
                                        onChange={(e) => {
                                            const newBranches = [...step.branches!];
                                            newBranches[idx] = { ...newBranches[idx], condition: e.target.value };
                                            updateStep(step.id, { branches: newBranches });
                                        }}
                                        className="text-xs"
                                    />
                                    <Input
                                        placeholder="Target Step ID"
                                        value={branch.targetStepId}
                                        onChange={(e) => {
                                            const newBranches = [...step.branches!];
                                            newBranches[idx] = { ...newBranches[idx], targetStepId: e.target.value };
                                            updateStep(step.id, { branches: newBranches });
                                        }}
                                        className="text-xs"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : null}

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            const currentBranches = step.branches || [];
                            updateStep(step.id, {
                                branches: [...currentBranches, {
                                    id: crypto.randomUUID(),
                                    condition: '',
                                    targetStepId: ''
                                }]
                            });
                        }}
                        className="h-7 text-xs"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Branch
                    </Button>
                </div>
            )}

            {/* Checklist Options */}
            {(getStepCategory(step.type) === 'CHECKBOX') && (
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
            {(getStepCategory(step.type) === 'SELECT') && (
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
            {/* Conditional Logic */}
            <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Conditional Visibility</h4>
                    <Switch
                        checked={!!step.conditionalLogic}
                        onCheckedChange={(c) => updateStep(step.id, {
                            conditionalLogic: c ? { fieldId: '', operator: 'equals', value: '' } : undefined
                        })}
                    />
                </div>

                {step.conditionalLogic && (
                    <div className="space-y-3 pl-2">
                        <p className="text-xs text-muted-foreground">
                            This step will only show when the condition is met
                        </p>
                        <div className="space-y-2">
                            <Label className="text-xs">Source Field ID</Label>
                            <Input
                                placeholder="Field ID to check"
                                value={step.conditionalLogic.fieldId || ''}
                                onChange={(e) => updateStep(step.id, {
                                    conditionalLogic: { ...step.conditionalLogic, fieldId: e.target.value }
                                })}
                                className="text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Operator</Label>
                            <Select
                                value={step.conditionalLogic.operator || 'equals'}
                                onValueChange={(v) => updateStep(step.id, {
                                    conditionalLogic: { ...step.conditionalLogic, operator: v }
                                })}
                            >
                                <SelectTrigger className="text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="equals">Equals</SelectItem>
                                    <SelectItem value="not_equals">Not Equals</SelectItem>
                                    <SelectItem value="contains">Contains</SelectItem>
                                    <SelectItem value="greater_than">Greater Than</SelectItem>
                                    <SelectItem value="less_than">Less Than</SelectItem>
                                    <SelectItem value="is_empty">Is Empty</SelectItem>
                                    <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Value</Label>
                            <Input
                                placeholder="Value to compare"
                                value={step.conditionalLogic.value || ''}
                                onChange={(e) => updateStep(step.id, {
                                    conditionalLogic: { ...step.conditionalLogic, value: e.target.value }
                                })}
                                className="text-sm"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Timer Options */}
            {(getStepCategory(step.type) === 'TIMER') && (
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
