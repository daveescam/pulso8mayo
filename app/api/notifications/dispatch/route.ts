import { NextRequest, NextResponse } from "next/server";
import { NotificationQueue } from "@/lib/notifications/notification-queue";
import { NotificationDispatcher } from "@/lib/services/notification-dispatcher";
import { auth } from "@/lib/auth";

/**
 * POST /api/notifications/dispatch
 * Dispatch a notification (will be queued for async processing)
 */
export async function POST(req: NextRequest) {
    try {
        // Verify authentication (optional - some notifications might be system-triggered)
        const session = await auth.api.getSession({ headers: req.headers });
        
        const body = await req.json();
        const { userId, title, message, type, eventType, actionUrl, actionLabel, metadata } = body;

        if (!userId || !title || !message || !eventType) {
            return NextResponse.json(
                { error: "userId, title, message, and eventType are required" },
                { status: 400 }
            );
        }

        // Create notification payload
        const payload = {
            userId,
            title,
            message,
            type: type || "info",
            eventType,
            actionUrl,
            actionLabel,
            metadata: metadata || {}
        };

        // Queue notification for async processing
        const notificationId = await NotificationQueue.enqueue(payload);

        return NextResponse.json({
            success: true,
            notificationId,
            message: "Notification queued for delivery"
        });
    } catch (error) {
        console.error("Error dispatching notification:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/notifications/dispatch
 * Get dispatch status
 */
export async function GET() {
    try {
        const status = await NotificationQueue.getStatus();
        return NextResponse.json({
            status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error getting dispatch status:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
