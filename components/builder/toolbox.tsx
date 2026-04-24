
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Type, Hash, CheckSquare, Camera, List, ToggleLeft, Clock, Thermometer, PenTool, MapPin, Hourglass, Video, Mic, Info } from 'lucide-react';
import { useBuilder, StepType } from './builder-context';

const tools: { type: StepType; label: string; icon: React.ReactNode }[] = [
    { type: 'instruction', label: 'Instruction', icon: <Info className="w-4 h-4 mr-2" /> },
    { type: 'text', label: 'Text Input', icon: <Type className="w-4 h-4 mr-2" /> },
    { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4 mr-2" /> },
    { type: 'yes_no', label: 'Yes/No', icon: <ToggleLeft className="w-4 h-4 mr-2" /> },
    { type: 'multiple_choice', label: 'Choice', icon: <List className="w-4 h-4 mr-2" /> },
    { type: 'checklist', label: 'Checklist', icon: <CheckSquare className="w-4 h-4 mr-2" /> },
    { type: 'photo', label: 'Photo/AI', icon: <Camera className="w-4 h-4 mr-2" /> },
    { type: 'TimeField', label: 'Time', icon: <Clock className="w-4 h-4 mr-2" /> },
    { type: 'TemperatureField', label: 'Temperature', icon: <Thermometer className="w-4 h-4 mr-2" /> },
    { type: 'SignatureField', label: 'Signature', icon: <PenTool className="w-4 h-4 mr-2" /> },
    { type: 'OPSLocationField', label: 'GPS Location', icon: <MapPin className="w-4 h-4 mr-2" /> },
    { type: 'timer', label: 'Timer', icon: <Hourglass className="w-4 h-4 mr-2" /> },
    { type: 'video', label: 'Video', icon: <Video className="w-4 h-4 mr-2" /> },
    { type: 'audio', label: 'Audio', icon: <Mic className="w-4 h-4 mr-2" /> },
];

export function Toolbox() {
    const { addStep } = useBuilder();

    return (
        <div className="w-64 border-r bg-muted/20 p-4 space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground mb-4">Toolbox</h3>
            <div className="grid gap-2">
                {tools.map((tool) => (
                    <Button
                        key={tool.type}
                        variant="secondary"
                        className="justify-start"
                        onClick={() => addStep(tool.type)}
                    >
                        {tool.icon}
                        {tool.label}
                    </Button>
                ))}
            </div>
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900 rounded text-xs text-muted-foreground">
                <p>Click items to add them to the bottom of the workflow canvas.</p>
            </div>
        </div>
    );
}
