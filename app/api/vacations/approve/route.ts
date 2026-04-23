import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vacationRequests, users, notificationPreferences, notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function createNotification(
    userId: string,
    title: string,
    message: string,
    type: "info" | "warning" | "error" | "success",
    actionUrl?: string
) {
    try {
        await db.insert(notifications).values({
            userId,
            title,
            message,
            type,
            actionUrl,
            actionLabel: "Ver detalles"
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

async function sendVacationNotification(
    userId: string,
    subject: string,
    message: string,
    vacationId: string
) {
    try {
        // Get user preferences
        const prefs = await db.query.notificationPreferences.findFirst({
            where: eq(notificationPreferences.userId, userId)
        });

        // Create in-app notification
        await createNotification(
            userId,
            subject,
            message,
            "info",
            `/dashboard/labor/vacations?id=${vacationId}`
        );

        // TODO: Send WhatsApp notification if enabled
        if (prefs?.whatsappEnabled) {
            // Integration with WhatsApp service would go here
            console.log(`Would send WhatsApp to ${userId}: ${subject}`);
        }

        // TODO: Send email notification if enabled
        if (prefs?.emailEnabled) {
            // Integration with email service would go here
            console.log(`Would send email to ${userId}: ${subject}`);
        }
    } catch (error) {
        console.error("Error sending notification:", error);
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
        const { id, action, managerComments, rejectionReason } = body;

        if (!id || !action) {
            return NextResponse.json(
                { error: "ID y acción requeridos" },
                { status: 400 }
            );
        }

        if (!["APPROVED", "REJECTED"].includes(action)) {
            return NextResponse.json(
                { error: "Acción inválida. Debe ser APPROVED o REJECTED" },
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

        if (request.status !== "PENDING") {
            return NextResponse.json(
                { error: "Solo se pueden aprobar/rechazar solicitudes pendientes" },
                { status: 400 }
            );
        }

        // Update based on action
        const updateData: any = {
            status: action as "APPROVED" | "REJECTED",
            approvedBy: session.user.id,
            approvedAt: new Date()
        };

        if (action === "APPROVED") {
            updateData.managerComments = managerComments || null;
        } else if (action === "REJECTED") {
            updateData.rejectionReason = rejectionReason || null;
            updateData.rejectedBy = session.user.id;
            updateData.rejectedAt = new Date();
        }

        const [updated] = await db.update(vacationRequests).set(updateData).where(eq(vacationRequests.id, id)).returning();

        // Send notification to employee
        if (action === "APPROVED") {
            await sendVacationNotification(
                request.userId,
                "✅ Vacaciones Aprobadas",
                `Tu solicitud de vacaciones del ${new Date(request.startDate).toLocaleDateString()} al ${new Date(request.endDate).toLocaleDateString()} ha sido aprobada.${managerComments ? " Comentarios: " + managerComments : ""}`,
                id
            );
        } else {
            await sendVacationNotification(
                request.userId,
                "❌ Vacaciones Rechazadas",
                `Tu solicitud de vacaciones del ${new Date(request.startDate).toLocaleDateString()} al ${new Date(request.endDate).toLocaleDateString()} ha sido rechazada.${rejectionReason ? " Motivo: " + rejectionReason : ""}`,
                id
            );
        }

        return NextResponse.json({
            success: true,
            data: updated,
            message: `Solicitud ${action === "APPROVED" ? "aprobada" : "rechazada"} exitosamente`
        });
    } catch (error) {
        console.error("Error processing vacation request:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
