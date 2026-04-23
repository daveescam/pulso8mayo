"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Smartphone, Monitor, AlertTriangle, CheckCircle2, Clock, MapPin, Thermometer, Camera, FileText, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    steps: any[];
}

interface PreviewClientProps {
    template: WorkflowTemplate;
}

const STEP_ICONS: Record<string, any> = {
    'TimeField': Clock,
    'TimerField': Clock,
    'TemperatureField': Thermometer,
    'PhotoField': Camera,
    'OPSLocationField': MapPin,
    'GPSLocationField': MapPin,
    'SignatureField': FileText,
    'YesNo': CheckCircle2,
    'TextField': FileText,
    'NumberField': FileText,
    'ChecklistField': CheckSquare,
    'text': FileText,
    'number': FileText,
    'yes_no': CheckCircle2,
    'photo': Camera,
    'checklist': CheckSquare,
};

export function PreviewClient({ template }: PreviewClientProps) {
    const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const currentStep = template.steps[currentStepIndex];
    const StepIcon = STEP_ICONS[currentStep?.type] || FileText;

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
            case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'WARNING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'PASS': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return '🔴';
            case 'HIGH': return '🔶';
            case 'WARNING': return '⚠️';
            case 'PASS': return '✅';
            default: return '📋';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="border-b bg-white shadow-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={`/dashboard/builder/editor/${template.id}`}>
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-semibold">{template.name}</h1>
                                <p className="text-sm text-muted-foreground">Preview Mode</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === 'mobile' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('mobile')}
                            >
                                <Smartphone className="h-4 w-4 mr-2" />
                                Mobile
                            </Button>
                            <Button
                                variant={viewMode === 'desktop' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('desktop')}
                            >
                                <Monitor className="h-4 w-4 mr-2" />
                                Desktop
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Container */}
            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Step List */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Workflow Steps</CardTitle>
                                <CardDescription>{template.steps.length} steps total</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {template.steps.map((step, index) => {
                                        const Icon = STEP_ICONS[step.type] || FileText;
                                        return (
                                            <button
                                                key={step.id}
                                                onClick={() => setCurrentStepIndex(index)}
                                                className={cn(
                                                    "w-full text-left px-4 py-3 hover:bg-accent transition-colors",
                                                    currentStepIndex === index && "bg-accent border-l-4 border-l-primary"
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="h-3 w-3 text-muted-foreground" />
                                                            <p className="text-sm font-medium truncate">{step.title}</p>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{step.type}</p>
                                                        {step.logicRules && step.logicRules.length > 0 && (
                                                            <Badge variant="secondary" className="mt-1 text-xs">
                                                                {step.logicRules.length} rule{step.logicRules.length > 1 ? 's' : ''}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Mobile/Desktop Preview */}
                    <div className="lg:col-span-2">
                        <div className={cn(
                            "mx-auto transition-all",
                            viewMode === 'mobile' ? 'max-w-md' : 'max-w-4xl'
                        )}>
                            {/* Device Frame */}
                            <div className={cn(
                                "bg-white rounded-lg shadow-2xl overflow-hidden",
                                viewMode === 'mobile' && "border-8 border-slate-800 rounded-[2.5rem]"
                            )}>
                                {/* Device Notch (Mobile only) */}
                                {viewMode === 'mobile' && (
                                    <div className="h-6 bg-slate-800 flex items-center justify-center">
                                        <div className="w-32 h-4 bg-slate-900 rounded-full"></div>
                                    </div>
                                )}

                                {/* Content */}
                                <div className={cn(
                                    "bg-white",
                                    viewMode === 'mobile' ? 'h-[600px]' : 'min-h-[600px]',
                                    "overflow-y-auto"
                                )}>
                                    {/* Step Header */}
                                    <div className="sticky top-0 bg-white border-b z-10 px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <StepIcon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="font-semibold">{currentStep?.title}</h2>
                                                <p className="text-xs text-muted-foreground">
                                                    Step {currentStepIndex + 1} of {template.steps.length}
                                                </p>
                                            </div>
                                            {currentStep?.required && (
                                                <Badge variant="destructive">Required</Badge>
                                            )}
                                        </div>
                                        {currentStep?.description && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {currentStep.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Step Content */}
                                    <div className="p-6 space-y-6">
                                        {/* Field Input Preview */}
                                        <Card className="border-2 border-primary/20">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <StepIcon className="h-4 w-4" />
                                                    {currentStep?.type}
                                                </CardTitle>
                                                <CardDescription className="text-xs">
                                                    This is what the user will interact with
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {/* Render different field types */}
                                                {(currentStep?.type === 'PhotoField' || currentStep?.type === 'photo') && (
                                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                                        <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                                        <p className="text-sm text-muted-foreground">Tap to take photo</p>
                                                    </div>
                                                )}

                                                {(currentStep?.type === 'TemperatureField' || currentStep?.type === 'NumberField' || currentStep?.type === 'number') && (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Enter value</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                placeholder="0"
                                                                disabled
                                                            />
                                                            {currentStep?.type === 'TemperatureField' && (
                                                                <span className="text-sm text-muted-foreground">°C</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {(currentStep?.type === 'TextField' || currentStep?.type === 'text') && (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Enter text</label>
                                                        <textarea
                                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                            placeholder="Type here..."
                                                            disabled
                                                        />
                                                    </div>
                                                )}

                                                {(currentStep?.type === 'YesNo' || currentStep?.type === 'yes_no') && (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Select option</label>
                                                        <div className="flex gap-2">
                                                            <button className="flex-1 h-12 rounded-md border-2 border-green-500 bg-green-50 text-green-700 font-medium">
                                                                ✓ Yes
                                                            </button>
                                                            <button className="flex-1 h-12 rounded-md border-2 border-red-500 bg-red-50 text-red-700 font-medium">
                                                                ✗ No
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {(currentStep?.type === 'TimeField' || currentStep?.type === 'TimerField') && (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Select time</label>
                                                        <input
                                                            type="time"
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                            disabled
                                                        />
                                                    </div>
                                                )}

                                                {(currentStep?.type === 'GPSLocationField' || currentStep?.type === 'OPSLocationField') && (
                                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                                        <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                                        <p className="text-sm text-muted-foreground">Tap to capture location</p>
                                                        <p className="text-xs text-muted-foreground mt-1">GPS coordinates will be recorded</p>
                                                    </div>
                                                )}

                                                {currentStep?.type === 'SignatureField' && (
                                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                                        <p className="text-sm text-muted-foreground">Tap to sign</p>
                                                    </div>
                                                )}

                                                {(currentStep?.type === 'ChecklistField' || currentStep?.type === 'checklist') && (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Checklist items</label>
                                                        <div className="space-y-2">
                                                            {currentStep?.options?.map((option: string, i: number) => (
                                                                <div key={i} className="flex items-center gap-2 p-2 border rounded">
                                                                    <input type="checkbox" className="h-4 w-4" disabled />
                                                                    <span className="text-sm">{option}</span>
                                                                </div>
                                                            )) || (
                                                                    <>
                                                                        <div className="flex items-center gap-2 p-2 border rounded">
                                                                            <input type="checkbox" className="h-4 w-4" disabled />
                                                                            <span className="text-sm">Item 1</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 p-2 border rounded">
                                                                            <input type="checkbox" className="h-4 w-4" disabled />
                                                                            <span className="text-sm">Item 2</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStep?.type === 'Select' && (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Select option</label>
                                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled>
                                                            <option>Choose an option...</option>
                                                            {currentStep?.options?.map((option: string, i: number) => (
                                                                <option key={i}>{option}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                        {/* AI Verification */}
                                        {currentStep?.aiVerification?.enabled && (
                                            <Card className="border-blue-200 bg-blue-50/50">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm flex items-center gap-2">
                                                        <span className="text-lg">🤖</span>
                                                        AI Verification Enabled
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="text-xs space-y-2">
                                                    {currentStep.aiVerification.prompt && (
                                                        <p className="text-muted-foreground">
                                                            <strong>Prompt:</strong> {currentStep.aiVerification.prompt}
                                                        </p>
                                                    )}
                                                    {currentStep.aiVerification.expectedConditions && (
                                                        <div>
                                                            <strong>Expected Conditions:</strong>
                                                            <ul className="list-disc list-inside mt-1">
                                                                {currentStep.aiVerification.expectedConditions.map((cond: string, i: number) => (
                                                                    <li key={i}>{cond}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Validation Rules */}
                                        {currentStep?.validation && (
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm">Validation Rules</CardTitle>
                                                </CardHeader>
                                                <CardContent className="text-xs space-y-1">
                                                    {currentStep.validation.min !== undefined && (
                                                        <p>• Minimum: {currentStep.validation.min}</p>
                                                    )}
                                                    {currentStep.validation.max !== undefined && (
                                                        <p>• Maximum: {currentStep.validation.max}</p>
                                                    )}
                                                    {currentStep.validation.minTime && (
                                                        <p>• Earliest time: {currentStep.validation.minTime}</p>
                                                    )}
                                                    {currentStep.validation.maxTime && (
                                                        <p>• Latest time: {currentStep.validation.maxTime}</p>
                                                    )}
                                                    {currentStep.validation.radiusMeters && (
                                                        <p>• Location radius: {currentStep.validation.radiusMeters}m</p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Logic Rules */}
                                        {currentStep?.logicRules && currentStep.logicRules.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-sm">Logic Rules & Incidents</h3>
                                                {currentStep.logicRules.map((rule: any, index: number) => (
                                                    <Card key={rule.id || index} className={cn("border-2", getSeverityColor(rule.severity))}>
                                                        <CardHeader className="pb-3">
                                                            <div className="flex items-start gap-2">
                                                                <span className="text-lg">{getSeverityIcon(rule.severity)}</span>
                                                                <div className="flex-1">
                                                                    <CardTitle className="text-sm">
                                                                        {rule.severity} Alert
                                                                    </CardTitle>
                                                                    <CardDescription className="text-xs mt-1">
                                                                        {rule.message}
                                                                    </CardDescription>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <div className="text-xs">
                                                                <strong>Condition:</strong>
                                                                <code className="ml-2 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                                                    {rule.condition}
                                                                </code>
                                                            </div>

                                                            {/* Remediation */}
                                                            {rule.remediationProtocol?.enabled && (
                                                                <div className="border-t pt-3">
                                                                    <p className="text-xs font-semibold mb-2">🔧 Remediation Protocol</p>
                                                                    <div className="space-y-2">
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Max attempts: {rule.remediationProtocol.maxAttempts} •
                                                                            Timeout: {rule.remediationProtocol.timeoutMinutes} min
                                                                        </p>
                                                                        {rule.remediationProtocol.steps?.map((step: any, i: number) => (
                                                                            <div key={i} className="bg-slate-50 p-2 rounded text-xs">
                                                                                <strong>Step {i + 1}:</strong> {step.instruction}
                                                                                {step.waitSeconds && (
                                                                                    <p className="text-muted-foreground mt-1">
                                                                                        Wait: {step.waitSeconds}s
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Escalation */}
                                                            {rule.escalationChain && rule.escalationChain.length > 0 && (
                                                                <div className="border-t pt-3">
                                                                    <p className="text-xs font-semibold mb-2">📢 Escalation Chain</p>
                                                                    <div className="space-y-2">
                                                                        {rule.escalationChain.map((esc: any, i: number) => (
                                                                            <div key={i} className="bg-slate-50 p-2 rounded text-xs">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <Badge variant="outline" className="text-xs">
                                                                                        Level {esc.level}
                                                                                    </Badge>
                                                                                    <span className="text-muted-foreground">
                                                                                        After {esc.triggerAfterMinutes} min
                                                                                    </span>
                                                                                </div>
                                                                                <p><strong>Notify:</strong> {esc.notifyRoles?.join(', ')}</p>
                                                                                <p><strong>Channel:</strong> {esc.channel}</p>
                                                                                <p className="mt-1 italic">"{esc.message}"</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}

                                        {/* Navigation */}
                                        <div className="flex gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                disabled={currentStepIndex === 0}
                                                onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                className="flex-1"
                                                disabled={currentStepIndex === template.steps.length - 1}
                                                onClick={() => setCurrentStepIndex(prev => Math.min(template.steps.length - 1, prev + 1))}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Device Home Indicator (Mobile only) */}
                                {viewMode === 'mobile' && (
                                    <div className="h-6 bg-white flex items-center justify-center">
                                        <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
