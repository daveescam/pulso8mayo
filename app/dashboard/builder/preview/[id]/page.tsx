import { db } from '@/lib/db';
import { workflowTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PreviewClient } from './preview-client';
import { templateLibrary } from '@/templates';

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;

  // Try DB first (only if id looks like a UUID), then fallback to templateLibrary catalog
  let dbTemplate = null;
  if (UUID_RE.test(id)) {
    dbTemplate = await db.query.workflowTemplates.findFirst({
      where: eq(workflowTemplates.id, id),
    });
  }

  let template: { id: string; name: string; description: string; steps: any[]; isCatalog?: boolean };

  if (dbTemplate) {
    const rawSteps = ((dbTemplate as any).pasos || (dbTemplate as any).steps || dbTemplate.steps || []) as any[];

    template = {
      id: dbTemplate.id,
      name: (dbTemplate as any).nombre || dbTemplate.name,
      description: (dbTemplate as any).descripcion || dbTemplate.description || '',
      isCatalog: false,
      steps: rawSteps.map(step => ({
        id: step.id || crypto.randomUUID(),
        type: step.tipo || step.type || 'TextField',
        title: step.titulo || step.nombre || step.title || 'Untitled Step',
        description: step.descripcion || step.description || '',
        required: step.obligatorio ?? step.required ?? false,
        validation: step.validation || step.validacion,
        aiVerification: step.aiVerification || step.verificacionIA,
        logicRules: step.logicRules || step.reglasLogica,
        branches: step.branches || step.ramas,
        options: step.options || step.opciones,
        readOnly: step.readOnly || step.soloLectura,
        placeholder: step.placeholder,
        defaultValue: step.defaultValue || step.valorPorDefecto,
        conditionalLogic: step.conditionalLogic || step.logicaCondicional,
        config: step.config,
        ...step
      })),
    };
  } else {
    const catalogTemplate = templateLibrary[id];
    if (!catalogTemplate) {
      notFound();
    }

    template = {
      id,
      name: catalogTemplate.title,
      description: catalogTemplate.description || '',
      isCatalog: true,
      steps: (catalogTemplate.steps || []).map(step => ({
        id: step.id,
        type: step.type,
        title: step.title,
        description: step.description || '',
        required: step.required ?? false,
        validation: (step as any).validation,
        aiVerification: (step as any).aiVerification,
        logicRules: (step as any).logicRules,
        branches: (step as any).branches,
        options: (step as any).options,
        readOnly: (step as any).readOnly,
        placeholder: (step as any).placeholder,
        defaultValue: (step as any).defaultValue,
        conditionalLogic: (step as any).conditionalLogic,
        config: step.config,
      })),
    };
  }

  return (
    <PreviewClient
      template={template}
    />
  );
}
