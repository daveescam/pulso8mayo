import { NextRequest } from "next/server";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { shiftTemplates, plannedShifts } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { addDays, parseISO, format, eachDayOfInterval, isWithinInterval } from "date-fns";

// Schema para crear plantilla
const createTemplateSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    branchId: z.string().uuid("ID de sucursal inválido"),
    role: z.string(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    daysOfWeek: z.array(z.number().min(0).max(6)), // 0=domingo, 6=sábado
    validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Schema para generar turnos desde plantilla
const generateFromTemplateSchema = z.object({
    templateId: z.string().uuid(),
    userIds: z.array(z.string()),
    validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * GET /api/shift-templates
 * Obtiene plantillas de turnos recurrentes
 */
export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const searchParams = req.nextUrl.searchParams;
        const branchId = searchParams.get("branchId");
        const isActive = searchParams.get("isActive");

        const conditions = [eq(shiftTemplates.companyId, tenant.companyId)];
        
        if (branchId) {
            conditions.push(eq(shiftTemplates.branchId, branchId));
        }
        
        if (isActive !== null) {
            conditions.push(eq(shiftTemplates.isActive, isActive === "true"));
        }

        const templates = await db.query.shiftTemplates.findMany({
            where: conditions ? and(...conditions) : undefined,
            orderBy: (templates, { asc }) => [asc(templates.name)],
        });

        return ApiHandler.success(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        return ApiHandler.error(error);
    }
}

/**
 * POST /api/shift-templates
 * Crea una nueva plantilla de turno recurrente
 */
export async function POST(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const body = await req.json();
        const data = createTemplateSchema.parse(body);

        // Validar que endTime > startTime o sea turno nocturno
        const startHour = parseInt(data.startTime.replace(":", ""));
        const endHour = parseInt(data.endTime.replace(":", ""));
        
        if (startHour >= endHour && startHour < 2000) {
            // Podría ser turno nocturno, validar que no exceda 12 horas
            const startMinutes = (Math.floor(startHour / 100) * 60) + (startHour % 100);
            const endMinutes = ((Math.floor(endHour / 100) + 24) * 60) + (endHour % 100);
            const hoursDiff = (endMinutes - startMinutes) / 60;
            
            if (hoursDiff > 12) {
                return ApiHandler.error(new Error("El turno excede el límite de 12 horas"), { status: 400 });
            }
        }

        // Validar que haya al menos un día seleccionado
        if (data.daysOfWeek.length === 0) {
            return ApiHandler.error(new Error("Debe seleccionar al menos un día de la semana"), { status: 400 });
        }

        const [newTemplate] = await db.insert(shiftTemplates).values({
            ...data,
            companyId: tenant.id,
            createdBy: tenant.userId,
            branchId: data.branchId,
            validUntil: data.validUntil || null,
        }).returning();

        return ApiHandler.success(newTemplate);
    } catch (error) {
        console.error("Error creating template:", error);
        if (error instanceof z.ZodError) {
            return ApiHandler.error(new Error(`Validación: ${error.errors.map(e => e.message).join(", ")}`), { status: 400 });
        }
        return ApiHandler.error(error);
    }
}

/**
 * DELETE /api/shift-templates
 * Elimina o desactiva una plantilla
 */
export async function DELETE(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const searchParams = req.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return ApiHandler.error(new Error("Template ID is required"), { status: 400 });
        }

        // Desactivar en lugar de eliminar
        const [updatedTemplate] = await db.update(shiftTemplates)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(shiftTemplates.id, id))
            .returning();

        return ApiHandler.success(updatedTemplate);
    } catch (error) {
        console.error("Error deleting template:", error);
        return ApiHandler.error(error);
    }
}

