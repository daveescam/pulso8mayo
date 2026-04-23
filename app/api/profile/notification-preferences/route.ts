import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notificationPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export interface NotificationPreferencesData {
    whatsappEnabled: boolean;
    emailEnabled: boolean;
    inAppEnabled: boolean;
    workflowAssignments: boolean;
    workflowDueSoon: boolean;
    workflowOverdue: boolean;
    incidents: boolean;
    stockAlerts: boolean;
    shiftReminders: boolean;
    scheduleChanges: boolean;
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

        // Get user preferences
        const prefs = await db.query.notificationPreferences.findFirst({
            where: eq(notificationPreferences.userId, session.user.id)
        });

        if (!prefs) {
            // Return default preferences if none exist
            return NextResponse.json({
                data: {
                    whatsappEnabled: true,
                    emailEnabled: true,
                    inAppEnabled: true,
                    workflowAssignments: true,
                    workflowDueSoon: true,
                    workflowOverdue: true,
                    incidents: true,
                    stockAlerts: true,
                    shiftReminders: true,
                    scheduleChanges: true
                }
            });
        }

        return NextResponse.json({
            data: {
                whatsappEnabled: prefs.whatsappEnabled,
                emailEnabled: prefs.emailEnabled,
                inAppEnabled: prefs.inAppEnabled,
                workflowAssignments: prefs.workflowAssignments,
                workflowDueSoon: prefs.workflowDueSoon,
                workflowOverdue: prefs.workflowOverdue,
                incidents: prefs.incidents,
                stockAlerts: true, // Default value, not in schema yet
                shiftReminders: true, // Default value, not in schema yet
                scheduleChanges: true // Default value, not in schema yet
            }
        });
    } catch (error) {
        console.error("Error fetching notification preferences:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const body: Partial<NotificationPreferencesData> = await req.json();
        const userId = session.user.id;

        // Check if preferences exist
        const existingPrefs = await db.query.notificationPreferences.findFirst({
            where: eq(notificationPreferences.userId, userId)
        });

        if (existingPrefs) {
            // Update existing preferences
            const [updated] = await db
                .update(notificationPreferences)
                .set({
                    whatsappEnabled: body.whatsappEnabled ?? existingPrefs.whatsappEnabled,
                    emailEnabled: body.emailEnabled ?? existingPrefs.emailEnabled,
                    inAppEnabled: body.inAppEnabled ?? existingPrefs.inAppEnabled,
                    workflowAssignments: body.workflowAssignments ?? existingPrefs.workflowAssignments,
                    workflowDueSoon: body.workflowDueSoon ?? existingPrefs.workflowDueSoon,
                    workflowOverdue: body.workflowOverdue ?? existingPrefs.workflowOverdue,
                    incidents: body.incidents ?? existingPrefs.incidents,
                    updatedAt: new Date()
                })
                .where(eq(notificationPreferences.userId, userId))
                .returning();

            return NextResponse.json({
                data: {
                    whatsappEnabled: updated.whatsappEnabled,
                    emailEnabled: updated.emailEnabled,
                    inAppEnabled: updated.inAppEnabled,
                    workflowAssignments: updated.workflowAssignments,
                    workflowDueSoon: updated.workflowDueSoon,
                    workflowOverdue: updated.workflowOverdue,
                    incidents: updated.incidents,
                    stockAlerts: true,
                    shiftReminders: true,
                    scheduleChanges: true
                }
            });
        } else {
            // Create new preferences
            const [created] = await db
                .insert(notificationPreferences)
                .set({
                    userId,
                    whatsappEnabled: body.whatsappEnabled ?? true,
                    emailEnabled: body.emailEnabled ?? true,
                    inAppEnabled: body.inAppEnabled ?? true,
                    workflowAssignments: body.workflowAssignments ?? true,
                    workflowDueSoon: body.workflowDueSoon ?? true,
                    workflowOverdue: body.workflowOverdue ?? true,
                    incidents: body.incidents ?? true
                })
                .returning();

            return NextResponse.json({
                data: {
                    whatsappEnabled: created.whatsappEnabled,
                    emailEnabled: created.emailEnabled,
                    inAppEnabled: created.inAppEnabled,
                    workflowAssignments: created.workflowAssignments,
                    workflowDueSoon: created.workflowDueSoon,
                    workflowOverdue: created.workflowOverdue,
                    incidents: created.incidents,
                    stockAlerts: true,
                    shiftReminders: true,
                    scheduleChanges: true
                }
            });
        }
    } catch (error) {
        console.error("Error updating notification preferences:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
