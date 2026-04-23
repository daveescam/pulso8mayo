import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vacationRequests, users, branches, notifications, notificationPreferences } from "@/lib/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { differenceInDays, parseISO } from "date-fns";

async function notifyManagersOfNewRequest(
    vacationId: string,
    userId: string,
    branchId: string | null,
    startDate: Date,
    endDate: Date
) {
    try {
        // Get managers for the branch (users with ADMIN or GERENTE role)
        const managers = await db.query.users.findMany({
            where: branchId 
                ? and(eq(users.branchId, branchId), or(eq(users.role, "ADMIN"), eq(users.role, "GERENTE")))
                : or(eq(users.role, "ADMIN"), eq(users.role, "GERENTE"))
        });

        const employee = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });

        for (const manager of managers) {
            // Create in-app notification
            await db.insert(notifications).values({
                userId: manager.id,
                title: "📋 Nueva Solicitud de Vacaciones",
                message: `${employee?.name || "Un empleado"} ha solicitado vacaciones del ${startDate.toLocaleDateString()} al ${endDate.toLocaleDateString()}`,
                type: "warning",
                actionUrl: `/dashboard/labor/vacations?id=${vacationId}`,
                actionLabel: "Revisar solicitud"
            });
        }
    } catch (error) {
        console.error("Error notifying managers:", error);
    }
}

export interface VacationRequest {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    companyId: string;
    branchId?: string;
    branchName?: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
    reason?: string;
    managerComments?: string;
    rejectionReason?: string;
    requestedAt: string;
    approvedAt?: string;
    approvedBy?: string;
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const branchId = searchParams.get("branchId");
        const status = searchParams.get("status");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Build conditions
        const conditions = [];

        // Filter by user if provided (or use current user)
        if (userId) {
            conditions.push(eq(vacationRequests.userId, userId));
        }

        // Filter by branch if provided
        if (branchId) {
            conditions.push(eq(vacationRequests.branchId, branchId));
        }

        // Filter by status if provided
        if (status) {
            conditions.push(eq(vacationRequests.status, status as any));
        }

        // Filter by date range
        if (startDate && endDate) {
            conditions.push(
                or(
                    and(
                        gte(vacationRequests.startDate, new Date(startDate)),
                        lte(vacationRequests.startDate, new Date(endDate))
                    ),
                    and(
                        gte(vacationRequests.endDate, new Date(startDate)),
                        lte(vacationRequests.endDate, new Date(endDate))
                    )
                )
            );
        }

        // Fetch vacation requests with user and branch data
        const requests = await db
            .select({
                id: vacationRequests.id,
                userId: vacationRequests.userId,
                userName: users.name,
                userEmail: users.email,
                companyId: vacationRequests.companyId,
                branchId: vacationRequests.branchId,
                branchName: branches.name,
                startDate: vacationRequests.startDate,
                endDate: vacationRequests.endDate,
                totalDays: vacationRequests.totalDays,
                status: vacationRequests.status,
                reason: vacationRequests.reason,
                managerComments: vacationRequests.managerComments,
                rejectionReason: vacationRequests.rejectionReason,
                requestedAt: vacationRequests.requestedAt,
                approvedAt: vacationRequests.approvedAt,
                approvedBy: vacationRequests.approvedBy
            })
            .from(vacationRequests)
            .leftJoin(users, eq(vacationRequests.userId, users.id))
            .leftJoin(branches, eq(vacationRequests.branchId, branches.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(vacationRequests.requestedAt);

        return NextResponse.json({
            data: requests,
            total: requests.length
        });
    } catch (error) {
        console.error("Error fetching vacation requests:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            userId,
            companyId,
            branchId,
            startDate,
            endDate,
            reason
        } = body;

        // Validate required fields
        if (!userId || !companyId || !startDate || !endDate) {
            return NextResponse.json(
                { error: "Campos requeridos: userId, companyId, startDate, endDate" },
                { status: 400 }
            );
        }

        // Calculate total days
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const totalDays = differenceInDays(end, start) + 1;

        if (totalDays <= 0) {
            return NextResponse.json(
                { error: "La fecha de fin debe ser posterior a la fecha de inicio" },
                { status: 400 }
            );
        }

        // Check for overlapping vacations
        const overlapping = await db.query.vacationRequests.findFirst({
            where: and(
                eq(vacationRequests.userId, userId),
                eq(vacationRequests.status, "APPROVED"),
                or(
                    and(
                        gte(vacationRequests.startDate, start),
                        lte(vacationRequests.startDate, end)
                    ),
                    and(
                        gte(vacationRequests.endDate, start),
                        lte(vacationRequests.endDate, end)
                    )
                )
            )
        });

        if (overlapping) {
            return NextResponse.json(
                { error: "Ya tienes vacaciones aprobadas en este período" },
                { status: 400 }
            );
        }

        // Create vacation request
        const [newRequest] = await db.insert(vacationRequests).values({
            userId,
            companyId,
            branchId,
            startDate: start,
            endDate: end,
            totalDays,
            status: "PENDING",
            reason: reason || null
        }).returning();

        // Notify managers of new request
        await notifyManagersOfNewRequest(
            newRequest.id,
            userId,
            branchId,
            start,
            end
        );

        return NextResponse.json({
            success: true,
            data: newRequest,
            message: "Solicitud de vacaciones creada exitosamente"
        });
    } catch (error) {
        console.error("Error creating vacation request:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "ID de solicitud requerido" },
                { status: 400 }
            );
        }

        // Get the vacation request
        const request = await db.query.vacationRequests.findFirst({
            where: eq(vacationRequests.id, id)
        });

        if (!request) {
            return NextResponse.json(
                { error: "Solicitud no encontrada" },
                { status: 404 }
            );
        }

        // Only allow cancellation if pending or approved by the same user
        if (request.status !== "PENDING" && request.status !== "APPROVED") {
            return NextResponse.json(
                { error: "Solo se pueden cancelar solicitudes pendientes o aprobadas" },
                { status: 400 }
            );
        }

        // Update to cancelled
        const [updated] = await db.update(vacationRequests).set({
            status: "CANCELLED",
            cancelledAt: new Date()
        }).where(eq(vacationRequests.id, id)).returning();

        return NextResponse.json({
            success: true,
            data: updated,
            message: "Solicitud de vacaciones cancelada"
        });
    } catch (error) {
        console.error("Error deleting vacation request:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
