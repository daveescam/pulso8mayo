import { NextRequest } from "next/server";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { shiftChangeRequests, plannedShifts, users } from "@/lib/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { z } from "zod";

// Schema para crear solicitud de cambio de turno
const createShiftChangeRequestSchema = z.object({
    requestedShiftId: z.string().uuid(),
    counterpartyId: z.string(),
    counterpartyShiftId: z.string().uuid().optional(),
    reason: z.string().min(10, "La razón debe tener al menos 10 caracteres"),
    notes: z.string().optional(),
});

// Schema para responder a solicitud
const respondToShiftChangeRequestSchema = z.object({
    accepted: z.boolean(),
    notes: z.string().optional(),
});

// Schema para aprobar/rechazar solicitud (manager)
const managerDecisionSchema = z.object({
    approved: z.boolean(),
    rejectionReason: z.string().optional(),
});

/**
 * GET /api/shift-change-requests
 * Obtiene solicitudes de cambio de turno
 * Query params: status, userId, branchId
 */
export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const searchParams = req.nextUrl.searchParams;
        const status = searchParams.get("status");
        const userId = searchParams.get("userId");
        const branchId = searchParams.get("branchId");

        const conditions = [eq(shiftChangeRequests.companyId, tenant.companyId)];

        if (status) {
            conditions.push(eq(shiftChangeRequests.status, status));
        }

        if (branchId) {
            conditions.push(eq(shiftChangeRequests.branchId, branchId));
        }

        if (userId) {
            conditions.push(
                or(
                    eq(shiftChangeRequests.requestedBy, userId),
                    eq(shiftChangeRequests.counterpartyId, userId)
                )
            );
        }

        const requests = await db.query.shiftChangeRequests.findMany({
            where: conditions ? and(...conditions) : undefined,
            orderBy: [desc(shiftChangeRequests.createdAt)],
        });

        // Enrich with related data
        const enrichedRequests = await Promise.all(
            requests.map(async (request) => {
                const [requestedShift, counterpartyShift, requestedByUser, counterparty] = await Promise.all([
                    db.query.plannedShifts.findFirst({
                        where: eq(plannedShifts.id, request.requestedShiftId),
                        with: { user: true },
                    }),
                    request.counterpartyShiftId
                        ? db.query.plannedShifts.findFirst({
                            where: eq(plannedShifts.id, request.counterpartyShiftId),
                        })
                        : Promise.resolve(null),
                    db.query.users.findFirst({
                        where: eq(users.id, request.requestedBy),
                    }),
                    db.query.users.findFirst({
                        where: eq(users.id, request.counterpartyId),
                    }),
                ]);

                return {
                    ...request,
                    requestedShift,
                    counterpartyShift,
                    requestedByUser,
                    counterparty,
                };
            })
        );

        return ApiHandler.success(enrichedRequests);
    } catch (error) {
        console.error("Error fetching shift change requests:", error);
        return ApiHandler.error(error);
    }
}

/**
 * POST /api/shift-change-requests
 * Crea una nueva solicitud de cambio de turno
 */
export async function POST(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const body = await req.json();
        const data = createShiftChangeRequestSchema.parse(body);

        // Verificar que el turno solicitado existe y pertenece a la compañía
        const requestedShift = await db.query.plannedShifts.findFirst({
            where: eq(plannedShifts.id, data.requestedShiftId),
        });

        if (!requestedShift) {
            return ApiHandler.error(new Error("Turno no encontrado"), { status: 404 });
        }

        // Verificar que el usuario que solicita es el dueño del turno
        if (requestedShift.userId !== tenant.userId) {
            return ApiHandler.error(new Error("No tienes permiso para solicitar este cambio"), { status: 403 });
        }

        // Verificar que el counterparty existe
        const counterparty = await db.query.users.findFirst({
            where: eq(users.id, data.counterpartyId),
        });

        if (!counterparty) {
            return ApiHandler.error(new Error("Empleado no encontrado"), { status: 404 });
        }

        // Si hay counterpartyShiftId, verificar que existe
        if (data.counterpartyShiftId) {
            const counterpartyShift = await db.query.plannedShifts.findFirst({
                where: eq(plannedShifts.id, data.counterpartyShiftId),
            });

            if (!counterpartyShift) {
                return ApiHandler.error(new Error("Turno de contraparte no encontrado"), { status: 404 });
            }

            // Verificar que el turno de contraparte pertenece al counterparty
            if (counterpartyShift.userId !== data.counterpartyId) {
                return ApiHandler.error(new Error("El turno de contraparte no pertenece al empleado especificado"), { status: 400 });
            }
        }

        // Crear la solicitud
        const newRequest = await db.insert(shiftChangeRequests).values({
            companyId: tenant.companyId,
            branchId: requestedShift.branchId,
            requestedBy: tenant.userId,
            requestedShiftId: data.requestedShiftId,
            counterpartyId: data.counterpartyId,
            counterpartyShiftId: data.counterpartyShiftId || null,
            reason: data.reason,
            notes: data.notes,
            status: 'PENDING',
        }).returning();

        return ApiHandler.success(newRequest[0], 201);
    } catch (error) {
        console.error("Error creating shift change request:", error);
        if (error instanceof z.ZodError) {
            return ApiHandler.error(new Error(`Validación: ${error.errors.map(e => e.message).join(", ")}`), { status: 400 });
        }
        return ApiHandler.error(error);
    }
}

/**
 * PUT /api/shift-change-requests
 * Actualiza una solicitud (responder o aprobar/rechazar)
 */
export async function PUT(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const body = await req.json();
        const { id, action, ...requestData } = body;

        if (!id) {
            return ApiHandler.error(new Error("Request ID is required"), { status: 400 });
        }

        // Obtener la solicitud existente
        const existingRequest = await db.query.shiftChangeRequests.findFirst({
            where: eq(shiftChangeRequests.id, id),
        });

        if (!existingRequest) {
            return ApiHandler.error(new Error("Solicitud no encontrada"), { status: 404 });
        }

        // Acción: counterparty responde
        if (action === 'respond') {
            // Verificar que el usuario es el counterparty
            if (existingRequest.counterpartyId !== tenant.userId) {
                return ApiHandler.error(new Error("No tienes permiso para responder a esta solicitud"), { status: 403 });
            }

            const respondData = respondToShiftChangeRequestSchema.parse(requestData);

            const [updatedRequest] = await db.update(shiftChangeRequests).set({
                counterpartyAccepted: respondData.accepted,
                counterpartyResponseAt: new Date(),
                notes: respondData.notes || existingRequest.notes,
                status: respondData.accepted ? existingRequest.status : 'REJECTED',
                rejectedBy: respondData.accepted ? null : tenant.userId,
                rejectedAt: respondData.accepted ? null : new Date(),
                rejectionReason: respondData.accepted ? null : (respondData.notes || 'Rechazado por el empleado'),
                updatedAt: new Date(),
            }).where(eq(shiftChangeRequests.id, id)).returning();

            return ApiHandler.success(updatedRequest);
        }

        // Acción: manager aprueba/rechaza
        if (action === 'manager_decision') {
            const managerData = managerDecisionSchema.parse(requestData);

            const [updatedRequest] = await db.update(shiftChangeRequests).set({
                status: managerData.approved ? 'APPROVED' : 'REJECTED',
                approvedBy: managerData.approved ? tenant.userId : null,
                approvedAt: managerData.approved ? new Date() : null,
                rejectedBy: managerData.approved ? null : tenant.userId,
                rejectedAt: managerData.approved ? null : new Date(),
                rejectionReason: managerData.approved ? null : (managerData.rejectionReason || 'Rechazado por el supervisor'),
                updatedAt: new Date(),
            }).where(eq(shiftChangeRequests.id, id)).returning();

            // Si fue aprobado, ejecutar el intercambio de turnos
            if (managerData.approved && existingRequest.counterpartyShiftId) {
                await executeShiftSwap(existingRequest);
            }

            return ApiHandler.success(updatedRequest);
        }

        return ApiHandler.error(new Error("Acción no válida"), { status: 400 });
    } catch (error) {
        console.error("Error updating shift change request:", error);
        if (error instanceof z.ZodError) {
            return ApiHandler.error(new Error(`Validación: ${error.errors.map(e => e.message).join(", ")}`), { status: 400 });
        }
        return ApiHandler.error(error);
    }
}

/**
 * DELETE /api/shift-change-requests
 * Cancela una solicitud de cambio de turno
 */
export async function DELETE(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const searchParams = req.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return ApiHandler.error(new Error("Request ID is required"), { status: 400 });
        }

        const existingRequest = await db.query.shiftChangeRequests.findFirst({
            where: eq(shiftChangeRequests.id, id),
        });

        if (!existingRequest) {
            return ApiHandler.error(new Error("Solicitud no encontrada"), { status: 404 });
        }

        // Solo el solicitante puede cancelar
        if (existingRequest.requestedBy !== tenant.userId) {
            return ApiHandler.error(new Error("No tienes permiso para cancelar esta solicitud"), { status: 403 });
        }

        // Solo se pueden cancelar solicitudes pendientes
        if (existingRequest.status !== 'PENDING') {
            return ApiHandler.error(new Error("Solo se pueden cancelar solicitudes pendientes"), { status: 400 });
        }

        const [updatedRequest] = await db.update(shiftChangeRequests).set({
            status: 'CANCELLED',
            updatedAt: new Date(),
        }).where(eq(shiftChangeRequests.id, id)).returning();

        return ApiHandler.success(updatedRequest);
    } catch (error) {
        console.error("Error cancelling shift change request:", error);
        return ApiHandler.error(error);
    }
}

/**
 * Ejecuta el intercambio de turnos entre dos empleados
 */
async function executeShiftSwap(request: any) {
    if (!request.counterpartyShiftId) return;

    // Obtener ambos turnos
    const requestedShift = await db.query.plannedShifts.findFirst({
        where: eq(plannedShifts.id, request.requestedShiftId),
    });

    const counterpartyShift = await db.query.plannedShifts.findFirst({
        where: eq(plannedShifts.id, request.counterpartyShiftId),
    });

    if (!requestedShift || !counterpartyShift) return;

    // Intercambiar los turnos
    await db.update(plannedShifts).set({
        userId: request.counterpartyId,
        role: counterpartyShift.role,
        updatedAt: new Date(),
    }).where(eq(plannedShifts.id, request.requestedShiftId));

    await db.update(plannedShifts).set({
        userId: request.requestedBy,
        role: requestedShift.role,
        updatedAt: new Date(),
    }).where(eq(plannedShifts.id, request.counterpartyShiftId));
}
