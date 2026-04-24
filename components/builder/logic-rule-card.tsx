"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { LogicRule, RuleAction } from './builder-context';
import { RemediationSection } from './remediation-section';
import { EscalationSection } from './escalation-section';

interface LogicRuleCardProps {
    rule: LogicRule;
    onUpdate: (updates: Partial<LogicRule>) => void;
    onDelete: () => void;
}

export function LogicRuleCard({ rule, onUpdate, onDelete }: LogicRuleCardProps) {
    const [expanded, setExpanded] = useState(true);

    return (
        <Card className="mb-3">
            <CardHeader className="p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {rule.name ? rule.name : `Rule: ${rule.condition || 'New Rule'}`}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="h-6 w-6"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </CardHeader>

            {expanded && (
                <CardContent className="p-3 pt-0 space-y-3">
                    {/* Rule Name */}
                    <div className="space-y-2">
                        <Label className="text-xs">Rule Name (Optional)</Label>
                        <Input
                            placeholder="e.g., Regla de Temperatura"
                            value={rule.name || ""}
                            onChange={(e) => onUpdate({ name: e.target.value })}
                            className="text-sm font-medium"
                        />
                    </div>

                    {/* Condition Builder */}
                    <div className="space-y-2">
                        <Label className="text-xs">Condition</Label>
                        <Input
                            placeholder="e.g., value > 5"
                            value={rule.condition}
                            onChange={(e) => onUpdate({ condition: e.target.value })}
                            className="text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Use "value" to reference the field value
                        </p>
                    </div>

                    {/* Severity */}
                    <div className="space-y-2">
                        <Label className="text-xs">Severity</Label>
                        <Select value={rule.severity} onValueChange={(v) => onUpdate({ severity: v as any })}>
                            <SelectTrigger className="text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PASS">✅ Pass</SelectItem>
                                <SelectItem value="WARNING">⚠️ Warning</SelectItem>
                                <SelectItem value="HIGH">🔶 High</SelectItem>
                                <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <Label className="text-xs">Message</Label>
                        <Input
                            placeholder="Temperature exceeds safe limit"
                            value={rule.message}
                            onChange={(e) => onUpdate({ message: e.target.value })}
                            className="text-sm"
                        />
                    </div>

                    {/* Remediation Protocol */}
                    <RemediationSection
                        remediation={rule.remediationProtocol}
                        onUpdate={(remediation) => onUpdate({ remediationProtocol: remediation })}
                    />

                    {/* Escalation Chain */}
                    <EscalationSection
                        escalationChain={rule.escalationChain || []}
                        onUpdate={(chain) => onUpdate({ escalationChain: chain })}
                    />

                    {/* Automated Actions */}
                    <div className="border-t pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Automated Actions</Label>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const newAction: RuleAction = {
                                        type: 'AUTO_REMINDER',
                                        delay: 30,
                                        message: ''
                                    };
                                    onUpdate({ actions: [...(rule.actions || []), newAction] });
                                }}
                                className="h-6 text-xs"
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Action
                            </Button>
                        </div>

                        {rule.actions && rule.actions.length > 0 && (
                            <div className="space-y-2 pl-2">
                                {rule.actions.map((action, idx) => (
                                    <div key={idx} className="border rounded p-2 space-y-2 bg-muted/20">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-medium">Action {idx + 1}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    const newActions = rule.actions!.filter((_, i) => i !== idx);
                                                    onUpdate({ actions: newActions });
                                                }}
                                                className="h-5 w-5 p-0"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <Select
                                            value={action.type}
                                            onValueChange={(v) => {
                                                const newActions = [...rule.actions!];
                                                newActions[idx] = { ...newActions[idx], type: v };
                                                onUpdate({ actions: newActions });
                                            }}
                                        >
                                            <SelectTrigger className="text-xs h-7">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="AUTO_REMINDER">Auto Reminder</SelectItem>
                                                <SelectItem value="CREATE_MAINTENANCE_TICKET">Create Ticket</SelectItem>
                                                <SelectItem value="BLOCK_WORKFLOW_COMPLETION">Block Completion</SelectItem>
                                                <SelectItem value="SEND_HOME_PROTOCOL">Send Home Protocol</SelectItem>
                                                <SelectItem value="CREATE_PURCHASE_ORDER">Create Purchase Order</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {action.type === 'AUTO_REMINDER' && (
                                            <>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Delay (seconds)</Label>
                                                    <Input
                                                        type="number"
                                                        value={action.delay || 30}
                                                        onChange={(e) => {
                                                            const newActions = [...rule.actions!];
                                                            newActions[idx] = { ...newActions[idx], delay: parseInt(e.target.value) };
                                                            onUpdate({ actions: newActions });
                                                        }}
                                                        className="text-xs h-7"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Message</Label>
                                                    <Input
                                                        placeholder="Reminder message..."
                                                        value={action.message || ''}
                                                        onChange={(e) => {
                                                            const newActions = [...rule.actions!];
                                                            newActions[idx] = { ...newActions[idx], message: e.target.value };
                                                            onUpdate({ actions: newActions });
                                                        }}
                                                        className="text-xs h-7"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {action.type === 'CREATE_MAINTENANCE_TICKET' && (
                                            <>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Priority</Label>
                                                        <Select
                                                            value={action.priority || 'MEDIUM'}
                                                            onValueChange={(v) => {
                                                                const newActions = [...rule.actions!];
                                                                newActions[idx] = { ...newActions[idx], priority: v };
                                                                onUpdate({ actions: newActions });
                                                            }}
                                                        >
                                                            <SelectTrigger className="text-xs h-7">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="LOW">Low</SelectItem>
                                                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                                                <SelectItem value="HIGH">High</SelectItem>
                                                                <SelectItem value="URGENT">Urgent</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Assign To</Label>
                                                        <Select
                                                            value={action.assignTo || 'TECHNICAL_SERVICE'}
                                                            onValueChange={(v) => {
                                                                const newActions = [...rule.actions!];
                                                                newActions[idx] = { ...newActions[idx], assignTo: v };
                                                                onUpdate({ actions: newActions });
                                                            }}
                                                        >
                                                            <SelectTrigger className="text-xs h-7">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="GERENTE">Manager</SelectItem>
                                                                <SelectItem value="TECHNICAL_SERVICE">Technical Service</SelectItem>
                                                                <SelectItem value="CHEF">Chef</SelectItem>
                                                                <SelectItem value="OWNER">Owner</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {action.type === 'CREATE_PURCHASE_ORDER' && (
                                            <>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Item</Label>
                                                    <Input
                                                        placeholder="Item name..."
                                                        value={action.item || ''}
                                                        onChange={(e) => {
                                                            const newActions = [...rule.actions!];
                                                            newActions[idx] = { ...newActions[idx], item: e.target.value };
                                                            onUpdate({ actions: newActions });
                                                        }}
                                                        className="text-xs h-7"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Quantity</Label>
                                                    <Input
                                                        type="number"
                                                        value={action.quantity || 1}
                                                        onChange={(e) => {
                                                            const newActions = [...rule.actions!];
                                                            newActions[idx] = { ...newActions[idx], quantity: parseInt(e.target.value) };
                                                            onUpdate({ actions: newActions });
                                                        }}
                                                        className="text-xs h-7"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {action.type === 'SEND_HOME_PROTOCOL' && (
                                            <div className="space-y-1">
                                                <Label className="text-[10px]">Message</Label>
                                                <Input
                                                    placeholder="Protocol message..."
                                                    value={action.message || ''}
                                                    onChange={(e) => {
                                                        const newActions = [...rule.actions!];
                                                        newActions[idx] = { ...newActions[idx], message: e.target.value };
                                                        onUpdate({ actions: newActions });
                                                    }}
                                                    className="text-xs h-7"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
