
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type StepType =
    | 'text' | 'number' | 'yes_no' | 'multiple_choice' | 'photo' | 'checklist'
    | 'TimeField' | 'TemperatureField' | 'SignatureField' | 'OPSLocationField' | 'PhotoField' | 'timer'
    | 'video' | 'audio';

export interface AIVerificationConfig {
    enabled: boolean;
    prompt?: string;
    threshold?: number;
    expectedConditions?: string[];
    autoFillField?: string;
}


export interface ValidationConfig {
    min?: number;
    max?: number;
    minTime?: string;
    maxTime?: string;
    radiusMeters?: number;
    message?: string;
}

export interface EscalationStep {
    level: number;
    triggerAfterMinutes: number;
    triggerCondition: string;
    notifyRoles: string[];
    channel: string;
    message: string;
    includeData?: Record<string, boolean>;
}

export interface RemediationStep {
    instruction: string;
    waitSeconds: number;
    verification: {
        type: string;
        targetCondition: string;
    };
}

export interface RemediationProtocol {
    enabled: boolean;
    type: string;
    maxAttempts: number;
    timeoutMinutes: number;
    steps: RemediationStep[];
}

export interface LogicRule {
    id: string;
    name?: string;
    condition: string;
    severity: 'PASS' | 'WARNING' | 'HIGH' | 'CRITICAL';
    message: string;
    remediationProtocol?: RemediationProtocol;
    escalationChain?: EscalationStep[];
    actions?: any[];
}

export interface WorkflowStep {
    id: string;
    type: StepType;
    title: string;
    description?: string;
    required: boolean;
    config?: any;
    aiVerification?: AIVerificationConfig;
    validation?: ValidationConfig;
    logicRules?: LogicRule[];
    options?: string[]; // For checklist, select, multiple_choice
}

interface BuilderContextType {
    steps: WorkflowStep[];
    selectedStepId: string | null;
    addStep: (type: StepType) => void;
    updateStep: (id: string, updates: Partial<WorkflowStep>) => void;
    removeStep: (id: string) => void;
    selectStep: (id: string | null) => void;
    moveStep: (activeId: string, overId: string) => void;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export function BuilderProvider({ children, initialSteps = [] }: { children: ReactNode, initialSteps?: WorkflowStep[] }) {
    console.log('[BuilderProvider] Initializing with steps:', initialSteps.length, initialSteps);
    const [steps, setSteps] = useState<WorkflowStep[]>(initialSteps);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

    // Sync initialSteps prop changes with state (e.g., when navigating between templates)
    useEffect(() => {
        console.log('[BuilderProvider] useEffect triggered - initialSteps changed:', initialSteps.length, initialSteps);
        setSteps(initialSteps);
        setSelectedStepId(null); // Reset selection when template changes
    }, [initialSteps]);

    const addStep = (type: StepType) => {
        const newStep: WorkflowStep = {
            id: uuidv4(),
            type,
            title: `New ${type} step`,
            required: false,
            config: {}
        };
        setSteps(prev => [...prev, newStep]);
        setSelectedStepId(newStep.id);
    };

    const updateStep = (id: string, updates: Partial<WorkflowStep>) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeStep = (id: string) => {
        setSteps(prev => prev.filter(s => s.id !== id));
        if (selectedStepId === id) setSelectedStepId(null);
    };

    const selectStep = (id: string | null) => {
        setSelectedStepId(id);
    };

    const moveStep = (activeId: string, overId: string) => {
        setSteps((items) => {
            const oldIndex = items.findIndex(i => i.id === activeId);
            const newIndex = items.findIndex(i => i.id === overId);

            const newItems = [...items];
            const [movedItem] = newItems.splice(oldIndex, 1);
            newItems.splice(newIndex, 0, movedItem);
            return newItems;
        });
    };

    return (
        <BuilderContext.Provider value={{ steps, selectedStepId, addStep, updateStep, removeStep, selectStep, moveStep }}>
            {children}
        </BuilderContext.Provider>
    );
}

export const useBuilder = () => {
    const context = useContext(BuilderContext);
    if (!context) throw new Error("useBuilder must be used within BuilderProvider");
    return context;
};
