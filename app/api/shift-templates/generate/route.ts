import { NextRequest } from "next/server";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { shiftTemplates, plannedShifts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { addDays, parseISO, format, eachDayOfInterval } from "date-fns";

// Schema para generar turnos desde plantilla
const generateFromTemplateSchema = z.object({
    templateId: z.string().uuid(),
    userIds: z.array(z.string()),
    validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * POST /api/shift-templates/generate
 * Genera turnos concretos desde una plantilla para un rango de fechas
 */
export async function POST(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const body = await req.json();
        const data = generateFromTemplateSchema.parse(body);

        // Obtener la plantilla
        const template = await db.query.shiftTemplates.findFirst({
            where: eq(shiftTemplates.id, data.templateId),
        });

        if (!template) {
            return ApiHandler.error(new Error("Plantilla no encontrada"), { status: 404 });
        }

        // Generar todas las fechas en el rango
        const allDates = eachDayOfInterval({
            start: parseISO(data.validFrom),
            end: parseISO(data.validUntil),
        });

        // Filtrar fechas que coinciden con los días de la semana de la plantilla
        const validDates = allDates.filter(date => {
            const dayOfWeek = date.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
            return template.daysOfWeek?.includes(dayOfWeek);
        });

        // Crear turnos para cada usuario y fecha válida
        const shiftsToCreate = [];

        for (const userId of data.userIds) {
            for (const date of validDates) {
                const dateStr = format(date, "yyyy-MM-dd");

                shiftsToCreate.push({
                    userId,
                    branchId: template.branchId || tenant.companyId, // Fallback a company si no hay branch
                    shiftDate: dateStr,
                    startTime: template.startTime,
                    endTime: template.endTime,
                    role: template.role,
                    templateId: template.id,
                    status: "DRAFT" as const,
                    createdBy: tenant.userId,
                });
            }
        }

        // Insertar en lotes de 100 para evitar timeouts
        const createdShifts = [];
        for (let i = 0; i < shiftsToCreate.length; i += 100) {
            const batch = shiftsToCreate.slice(i, i + 100);
            const result = await db.insert(plannedShifts).values(batch).returning();
            createdShifts.push(...result);
        }

        return ApiHandler.success({
            shifts: createdShifts,
            count: createdShifts.length,
            datesGenerated: validDates.length,
            usersCount: data.userIds.length,
        });
    } catch (error) {
        console.error("Error generating shifts from template:", error);
        if (error instanceof z.ZodError) {
            return ApiHandler.error(new Error(`Validación: ${error.errors.map(e => e.message).join(", ")}`), { status: 400 });
        }
        return ApiHandler.error(error);
    }
}
