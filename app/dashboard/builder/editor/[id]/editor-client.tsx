"use client";

import { BuilderProvider, useBuilder } from "@/components/builder/builder-context";
import { Toolbox } from "@/components/builder/toolbox";
import { Canvas } from "@/components/builder/canvas";
import { PropertyEditor } from "@/components/builder/property-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Eye, Settings, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import React, { useState } from "react";
import { WorkflowStep } from "@/components/builder/builder-context";
import { useRouter } from "next/navigation";
import { WorkflowSettingsModal } from "@/components/builder/workflow-settings-modal";
import { WorkflowPreviewModal } from "@/components/builder/workflow-preview-modal";

// Wrapper component to access context
function EditorHeader({ id, initialTitle }: { id: string, initialTitle?: string }) {
    const { steps } = useBuilder();
    const [title, setTitle] = useState(initialTitle || "Untitled Workflow");
    const [isSaving, setIsSaving] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/templates/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: title,
                    steps: steps
                })
            });

            if (!response.ok) throw new Error('Failed to save');

            toast.success("Template saved successfully!");
        } catch (error) {
            toast.error("Failed to save template");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="border-b bg-background px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <Link href="/dashboard/builder">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1 max-w-md">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-2"
                            placeholder="Template Name"
                        />
                        <p className="text-xs text-muted-foreground px-2">ID: {id} • {steps.length} steps</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowSettings(true)}
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowPreview(true)}
                        disabled={steps.length === 0}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <WorkflowSettingsModal
                open={showSettings}
                onClose={() => setShowSettings(false)}
                templateId={id}
            />

            <WorkflowPreviewModal
                open={showPreview}
                onClose={() => setShowPreview(false)}
                steps={steps}
                title={title}
            />
        </>
    );
}

interface EditorClientProps {
    id: string;
    initialSteps: WorkflowStep[];
    title?: string;
}

export default function EditorClient({ id, initialSteps, title }: EditorClientProps) {
    console.log('[EditorClient] Rendering with initialSteps:', initialSteps.length, initialSteps);
    return (
        <BuilderProvider initialSteps={initialSteps}>
            <div className="flex h-[calc(100vh-4rem)] flex-col">
                <EditorHeader id={id} initialTitle={title} />
                <div className="flex flex-1 overflow-hidden">
                    <Toolbox />
                    <Canvas />
                    <PropertyEditor />
                </div>
            </div>
        </BuilderProvider>
    );
}
