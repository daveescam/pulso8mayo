import { NextRequest, NextResponse } from "next/server";
import { NotificationQueue } from "@/lib/notifications/notification-queue";
import { QueueNotificationPayload } from "@/lib/notifications/notification-queue";

/**
 * POST /api/notifications/process
 * Process a notification from the queue
 * This endpoint is called by QStash when a queued notification is ready to be processed
 */
export async function POST(req: NextRequest) {
    try {
        // Verify QStash signature if configured
        // const signature = req.headers.get("Upstash-Signature");
        // if (process.env.QSTASH_SIGNING_KEY && !verifySignature(signature, body)) {
        //     return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        // }

        const body: QueueNotificationPayload = await req.json();

        if (!body.id || !body.userId) {
            return NextResponse.json(
                { error: "Invalid notification payload" },
                { status: 400 }
            );
        }

        console.log(`[Process] Processing notification ${body.id} for user ${body.userId}`);

        // Process the notification
        await NotificationQueue.processNotification(body);

        return NextResponse.json({
            success: true,
            notificationId: body.id,
            message: "Notification processed successfully"
        });
    } catch (error) {
        console.error("Error processing notification:", error);
        
        // Return error so QStash can retry
        return NextResponse.json(
            { 
                error: "Processing failed",
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
