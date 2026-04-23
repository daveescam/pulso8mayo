import { db } from '@/lib/db';
import { workflowTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PreviewClient } from './preview-client';

interface PreviewPageProps {
    params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
    const { id } = await params;

    const template = await db.query.workflowTemplates.findFirst({
        where: eq(workflowTemplates.id, id),
    });

    if (!template) {
        notFound();
    }

    // Normalize template data - handle both English and Spanish field names
    const rawSteps = ((template as any).pasos || (template as any).steps || template.steps || []) as any[];

    const normalizedSteps = rawSteps.map(step => ({
        id: step.id || crypto.randomUUID(),
        type: step.tipo || step.type || 'TextField',
        title: step.titulo || step.nombre || step.title || 'Untitled Step',
        description: step.descripcion || step.description || '',
        required: step.obligatorio ?? step.required ?? false,
        validation: step.validation || step.validacion,
        aiVerification: step.aiVerification || step.verificacionIA,
        logicRules: step.logicRules || step.reglasLogica,
        options: step.options || step.opciones,
        readOnly: step.readOnly || step.soloLectura,
        placeholder: step.placeholder,
        defaultValue: step.defaultValue || step.valorPorDefecto,
        conditionalLogic: step.conditionalLogic || step.logicaCondicional,
        config: step.config,
        ...step
    }));

    return (
        <PreviewClient
            template={{
                id: template.id,
                name: (template as any).nombre || template.name,
                description: (template as any).descripcion || template.description || '',
                steps: normalizedSteps
            }}
        />
    );
}
