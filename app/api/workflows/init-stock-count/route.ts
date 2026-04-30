import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { workflowTemplates } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

const STOCK_COUNT_TEMPLATE_NAME = "Conteo de Inventario";

const DEFAULT_CATEGORIES = [
    { id: "cocina-mp", name: "Cocina - Materias Primas", value: "MATERIA_PRIMA" },
    { id: "cocina-verduras", name: "Cocina - Verduras", value: "VERDURA" },
    { id: "bebidas", name: "Bebidas", value: "BEBIDA" },
    { id: "limpieza", name: "Limpieza", value: "LIMPIEZA" },
    { id: "utensilios", name: "Utilería", value: "UTENSILIO" },
];

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const companyId = session.user.companyId || "";

    try {
        // Check if template already exists
        const existing = await db.select()
            .from(workflowTemplates)
            .where(and(
                eq(workflowTemplates.companyId, companyId),
                eq(workflowTemplates.name, STOCK_COUNT_TEMPLATE_NAME)
            ))
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json({ template: existing[0], created: false });
        }

        // Create the template with base steps
        const baseSteps = [
            {
                id: "category-select",
                type: "SELECT",
                title: "¿Qué área vas a contar?",
                description: "Selecciona la categoría de productos a contar",
                required: true,
                config: {
                    options: DEFAULT_CATEGORIES.map(c => ({ value: c.value, label: c.name }))
                }
            },
            // Note: Product steps are generated dynamically at execution time
            {
                id: "confirm-count",
                type: "SELECT",
                title: "¿Confirmas que el conteo está correcto?",
                description: "Una vez confirmado, se generarán los ajustes automáticamente",
                required: true,
                config: {
                    options: [
                        { value: "yes", label: "Sí, confirmar y generar ajustes" },
                        { value: "no", label: "No, revisar conteo" }
                    ]
                }
            }
        ];

        const [template] = await db.insert(workflowTemplates).values({
            companyId,
            name: STOCK_COUNT_TEMPLATE_NAME,
            description: "Conteo físico de inventario por categoría. Al completar, genera ajustes de inventario automáticamente.",
            category: "INVENTORY",
            steps: JSON.stringify(baseSteps),
            active: true,
            complianceType: null,
            isCritical: false,
        }).returning();

        return NextResponse.json({ template, created: true });
    } catch (error) {
        console.error("Error initializing stock count template:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// GET to check if template exists
export async function GET(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const companyId = session.user.companyId || "";

    const existing = await db.select()
        .from(workflowTemplates)
        .where(and(
            eq(workflowTemplates.companyId, companyId),
            eq(workflowTemplates.name, STOCK_COUNT_TEMPLATE_NAME)
        ))
        .limit(1);

    return NextResponse.json({ exists: existing.length > 0, template: existing[0] || null });
}