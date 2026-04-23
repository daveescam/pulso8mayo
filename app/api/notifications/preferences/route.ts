import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notificationPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * PATCH /api/notifications/preferences
 * Update user notification preferences
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            whatsappEnabled,
            emailEnabled,
            inAppEnabled,
            workflowAssignments,
            workflowDueSoon,
            workflowOverdue,
            incidents,
            stockAlerts,
            shiftReminders
        } = body;

        // Upsert preferences
        await db.insert(notificationPreferences).values({
            userId: session.user.id,
            whatsappEnabled: whatsappEnabled ?? true,
            emailEnabled: emailEnabled ?? true,
            inAppEnabled: inAppEnabled ?? true,
            workflowAssignments: workflowAssignments ?? true,
            workflowDueSoon: workflowDueSoon ?? true,
            workflowOverdue: workflowOverdue ?? true,
            incidents: incidents ?? true,
            ...(stockAlerts !== undefined && { stockAlerts }),
            ...(shiftReminders !== undefined && { shiftReminders })
        }).onConflictDoUpdate({
            target: notificationPreferences.userId,
            set: {
                whatsappEnabled: whatsappEnabled ?? true,
                emailEnabled: emailEnabled ?? true,
                inAppEnabled: inAppEnabled ?? true,
                workflowAssignments: workflowAssignments ?? true,
                workflowDueSoon: workflowDueSoon ?? true,
                workflowOverdue: workflowOverdue ?? true,
                incidents: incidents ?? true,
                ...(stockAlerts !== undefined && { stockAlerts }),
                ...(shiftReminders !== undefined && { shiftReminders })
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[Preferences API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/notifications/preferences
 * Get user notification preferences
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const prefs = await db.query.notificationPreferences.findFirst({
            where: eq(notificationPreferences.userId, session.user.id)
        });

        if (!prefs) {
            // Return defaults
            return NextResponse.json({
                whatsappEnabled: true,
                emailEnabled: true,
                inAppEnabled: true,
                workflowAssignments: true,
                workflowDueSoon: true,
                workflowOverdue: true,
                incidents: true,
                stockAlerts: true,
                shiftReminders: true
            });
        }

        return NextResponse.json(prefs);

    } catch (error) {
        console.error("[Preferences API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
