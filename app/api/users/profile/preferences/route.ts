import { NextRequest } from "next/server";
import { ApiHandler } from "@/lib/api/response";
import { db } from "@/lib/db";
import { notificationPreferences, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const updatePreferencesSchema = z.object({
    whatsappEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    inAppEnabled: z.boolean().optional(),
    workflowAssignments: z.boolean().optional(),
    workflowDueSoon: z.boolean().optional(),
    workflowOverdue: z.boolean().optional(),
    incidents: z.boolean().optional(),
    whatsappPhone: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return ApiHandler.unauthorized();

        const userId = session.user.id;

        // Get or create preferences
        let prefs = await db.query.notificationPreferences.findFirst({
            where: eq(notificationPreferences.userId, userId),
        });

        if (!prefs) {
            const [newPrefs] = await db.insert(notificationPreferences)
                .values({ userId })
                .returning();
            prefs = newPrefs;
        }

        // Get current whatsapp phone from user
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { whatsappPhone: true }
        });

        return ApiHandler.success({
            ...prefs,
            whatsappPhone: user?.whatsappPhone || null
        });
    } catch (error) {
        return ApiHandler.error(error);
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return ApiHandler.unauthorized();

        const userId = session.user.id;
        const body = await req.json();
        const data = updatePreferencesSchema.parse(body);

        // Separate user fields and preference fields
        const { whatsappPhone, ...prefsData } = data;

        // Update WhatsApp phone if provided
        if (whatsappPhone !== undefined) {
            await db.update(users)
                .set({ whatsappPhone, updatedAt: new Date() })
                .where(eq(users.id, userId));
        }

        // Check if preferences exist
        const existingPrefs = await db.query.notificationPreferences.findFirst({
            where: eq(notificationPreferences.userId, userId),
        });

        let updatedPrefs;
        if (existingPrefs) {
            const [result] = await db.update(notificationPreferences)
                .set({ ...prefsData, updatedAt: new Date() })
                .where(eq(notificationPreferences.userId, userId))
                .returning();
            updatedPrefs = result;
        } else {
            const [result] = await db.insert(notificationPreferences)
                .values({ ...prefsData, userId })
                .returning();
            updatedPrefs = result;
        }

        return ApiHandler.success({
            ...updatedPrefs,
            whatsappPhone: whatsappPhone !== undefined ? whatsappPhone : undefined
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return ApiHandler.error(new Error(`Validation failed: ${error.errors.map(e => e.message).join(", ")}`), { status: 400 });
        }
        return ApiHandler.error(error);
    }
}
