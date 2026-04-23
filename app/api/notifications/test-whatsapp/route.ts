import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { WhatsAppNotificationService } from "@/lib/services/whatsapp-notification-service";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/notifications/test-whatsapp
 * Test WhatsApp notification delivery
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { type, userId, ...data } = body;

        // If no userId provided, use current user
        const targetUserId = userId || session.user.id;

        // Get user to verify they belong to same company
        const user = await db.query.users.findFirst({
            where: eq(users.id, targetUserId)
        });

        if (!user || user.companyId !== session.user.companyId) {
            return NextResponse.json({ error: "User not found or unauthorized" }, { status: 404 });
        }

        let result = false;

        switch (type) {
            case "workflow_assignment":
                result = await WhatsAppNotificationService.sendWorkflowAssignment({
                    instanceId: data.instanceId,
                    userId: targetUserId,
                    workflowName: data.workflowName || "Test Workflow",
                    branchId: data.branchId || ""
                });
                break;

            case "stock_alert":
                result = await WhatsAppNotificationService.sendStockAlert({
                    userId: targetUserId,
                    itemName: data.itemName || "Test Item",
                    currentStock: data.currentStock || 5,
                    minLevel: data.minLevel || 10,
                    branchId: data.branchId || ""
                });
                break;

            case "incident":
                result = await WhatsAppNotificationService.sendIncidentNotification({
                    userId: targetUserId,
                    incidentTitle: data.incidentTitle || "Test Incident",
                    severity: data.severity || "WARNING",
                    branchId: data.branchId || "",
                    actionUrl: data.actionUrl
                });
                break;

            case "shift_reminder":
                result = await WhatsAppNotificationService.sendShiftReminder({
                    userId: targetUserId,
                    shiftDate: data.shiftDate || "2026-03-21",
                    shiftTime: data.shiftTime || "08:00",
                    branchName: data.branchName || "Test Branch"
                });
                break;

            default:
                return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
        }

        return NextResponse.json({
            success: result,
            message: result ? "Notification sent successfully" : "Notification queued (WhatsApp not configured)"
        });

    } catch (error) {
        console.error("[Notifications API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/notifications/test-whatsapp
 * Get notification templates
 */
export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({
            templates: [
                {
                    type: "workflow_assignment",
                    name: "Asignación de Workflow",
                    description: "Notificación cuando se asigna una nueva tarea"
                },
                {
                    type: "stock_alert",
                    name: "Alerta de Stock",
                    description: "Notificación cuando el stock está bajo"
                },
                {
                    type: "incident",
                    name: "Incidente de Compliance",
                    description: "Notificación de incidentes críticos"
                },
                {
                    type: "shift_reminder",
                    name: "Recordatorio de Turno",
                    description: "Recordatorio antes del turno"
                }
            ]
        });

    } catch (error) {
        console.error("[Notifications API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
