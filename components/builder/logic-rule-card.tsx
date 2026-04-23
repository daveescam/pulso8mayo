"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { LogicRule } from './builder-context';
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
                </CardContent>
            )}
        </Card>
    );
}
