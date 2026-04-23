import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { NotificationQueue } from "@/lib/notifications/notification-queue";

/**
 * GET /api/notifications
 * Get user notifications
 */
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
        const limit = parseInt(searchParams.get("limit") || "50");
        const unreadOnly = searchParams.get("unreadOnly") === "true";

        const whereConditions = [eq(notifications.userId, session.user.id)];
        if (unreadOnly) {
            whereConditions.push(eq(notifications.read, false));
        }

        const userNotifications = await db.query.notifications.findMany({
            where: and(...whereConditions),
            orderBy: [desc(notifications.createdAt)],
            limit
        });

        return NextResponse.json({
            data: userNotifications,
            unreadCount: userNotifications.filter(n => !n.read).length
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/notifications
 * Mark notification as read
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { notificationId, markAllAsRead } = body;

        if (markAllAsRead) {
            // Mark all as read
            await db.update(notifications)
                .set({ read: true, readAt: new Date() })
                .where(eq(notifications.userId, session.user.id));

            return NextResponse.json({
                success: true,
                message: "Todas las notificaciones marcadas como leídas"
            });
        }

        if (!notificationId) {
            return NextResponse.json(
                { error: "notificationId es requerido" },
                { status: 400 }
            );
        }

        // Mark specific notification as read
        await db.update(notifications)
            .set({ read: true, readAt: new Date() })
            .where(eq(notifications.id, notificationId));

        return NextResponse.json({
            success: true,
            message: "Notificación marcada como leída"
        });
    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
