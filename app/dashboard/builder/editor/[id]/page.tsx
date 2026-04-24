import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import EditorClient from "./editor-client";
import { WorkflowStep } from "@/components/builder/builder-context";
import React from 'react';

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const { id } = await params;

    if (!id) {
        console.error('[EditorPage] Template ID is undefined');
        notFound();
    }

    const template = await db.query.workflowTemplates.findFirst({
        where: eq(workflowTemplates.id, id),
    });

    if (!template) {
        console.error(`[EditorPage] Template not found for id: ${id}`);
        notFound();
    }

    // Ensure steps are properly typed as WorkflowStep[] and normalized
    // Handle both English (steps) and Spanish (pasos) field names
    console.log('[EditorPage] Raw template data:', {
        id: template.id,
        name: template.name,
        steps: (template as any).steps,
        pasos: (template as any).pasos,
        allKeys: Object.keys(template)
    });

    const rawSteps = ((template as any).pasos || (template as any).steps || template.steps || []) as any[];
    console.log('[EditorPage] Raw steps before normalization:', rawSteps);

    if (rawSteps.length > 0) {
        console.log('[EditorPage] First step detailed:', {
            ...rawSteps[0],
            configKeys: rawSteps[0].config ? Object.keys(rawSteps[0].config) : [],
            fullConfig: rawSteps[0].config
        });
    }

    const steps: WorkflowStep[] = rawSteps.map(step => {
        // Extract all possible field variations
        // Support both database format (title/type) and JSON template format (label/fieldType)
        const stepId = step.id || crypto.randomUUID();
        const stepType = step.fieldType || step.tipo || step.type || 'TextField';
        const stepTitle = step.label || step.titulo || step.nombre || step.title || 'Untitled Step';
        const stepDescription = step.descripcion || step.description || '';
        const stepRequired = step.obligatorio ?? step.required ?? false;

        // Build the normalized step object
        return {
            id: stepId,
            type: stepType,
            title: stepTitle,
            description: stepDescription,
            required: stepRequired,
            // Preserve all other fields for compatibility
            config: step.config || step.extraAttributes,
            validation: step.validation || step.validacion,
            aiVerification: step.aiVerification || step.verificacionIA,
            logicRules: step.logicRules || step.reglasLogica,
            options: step.options || step.opciones,
            readOnly: step.readOnly || step.soloLectura || step.static,
            placeholder: step.placeholder,
            defaultValue: step.defaultValue || step.valorPorDefecto,
            conditionalLogic: step.conditionalLogic || step.logicaCondicional,
            branches: step.branches,
            category: step.category || step.categoria,
            // Preserve any other fields
            ...step
        } as WorkflowStep;
    });

    console.log('[EditorPage] Normalized steps:', steps.length, steps);

    return (
        <EditorClient
            id={id}
            title={template.name}
            initialSteps={steps}
        />
    );
}
