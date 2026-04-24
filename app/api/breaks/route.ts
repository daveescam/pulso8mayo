import { NextRequest } from "next/server";
import { ApiHandler } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";
import { requireTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { breakLogs, shiftSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { differenceInMinutes } from "date-fns";

const createBreakLogSchema = z.object({
    sessionId: z.string().uuid(),
    type: z.enum(["STANDARD", "MEAL", "REST", "EMERGENCY"]).default("STANDARD"),
});

const updateBreakLogSchema = z.object({
    id: z.string().uuid(),
    endTime: z.string().datetime(),
});

export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        
        if (!tenant.id) {
            return ApiHandler.success([]);
        }
        
        const searchParams = req.nextUrl.searchParams;
        const sessionId = searchParams.get("sessionId");

        if (!sessionId) {
            return ApiHandler.error(ApiError.badRequest("Session ID es requerido"));
        }

        const breaks = await db.query.breakLogs.findMany({
            where: eq(breakLogs.sessionId, sessionId),
            orderBy: (breaks, { asc }) => asc(breaks.startTime),
        });

        return ApiHandler.success(breaks);
    } catch (error) {
        console.error("Error fetching break logs:", error);
        return ApiHandler.error(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        
        if (!tenant.id) {
            return ApiHandler.error(ApiError.forbidden("Company not assigned to user"));
        }

        const body = await req.json();
        const data = createBreakLogSchema.parse(body);

        const session = await db.query.shiftSessions.findFirst({
            where: eq(shiftSessions.id, data.sessionId),
        });

        if (!session) {
            return ApiHandler.error(ApiError.notFound("Sesión no encontrada"));
        }

        if (session.status !== "ACTIVE") {
            return ApiHandler.error(ApiError.badRequest("La sesión debe estar activa para tomar un descanso"));
        }

        const newBreak = await db.insert(breakLogs).values({
            sessionId: data.sessionId,
            type: data.type,
            startTime: new Date(),
        }).returning();

        return ApiHandler.success(newBreak[0]);
    } catch (error) {
        console.error("Error creating break log:", error);
        if (error instanceof z.ZodError) {
            return ApiHandler.error(ApiError.badRequest(`Validación fallida: ${error.issues.map(i => i.message).join(", ")}`));
        }
        return ApiHandler.error(error as Error);
    }
}

export async function PUT(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        
        if (!tenant.id) {
            return ApiHandler.error(ApiError.forbidden("Company not assigned to user"));
        }

        const body = await req.json();
        const data = updateBreakLogSchema.parse(body);

        const existing = await db.query.breakLogs.findFirst({
            where: eq(breakLogs.id, data.id),
        });

        if (!existing) {
            return ApiHandler.error(ApiError.notFound("Break no encontrado"));
        }

        if (existing.endTime) {
            return ApiHandler.error(ApiError.badRequest("Este break ya fue finalizado"));
        }

        const endTime = new Date(data.endTime);
        const durationMinutes = differenceInMinutes(endTime, existing.startTime);

        const minDurationMap: Record<string, number> = {
            MEAL: 30,
            REST: 15,
            STANDARD: 15,
            EMERGENCY: 0,
        };
        
        const isCompliant = durationMinutes >= (minDurationMap[existing.type] || 15);

        const [updated] = await db.update(breakLogs)
            .set({
                endTime,
                durationMinutes,
                isCompliant,
                complianceNotes: isCompliant ? null : `Duración mínima requerida: ${minDurationMap[existing.type]} min`,
            })
            .where(eq(breakLogs.id, data.id))
            .returning();

        return ApiHandler.success(updated);
    } catch (error) {
        console.error("Error updating break log:", error);
        if (error instanceof z.ZodError) {
            return ApiHandler.error(ApiError.badRequest(`Validación fallida: ${error.issues.map(i => i.message).join(", ")}`));
        }
        return ApiHandler.error(error as Error);
    }
}