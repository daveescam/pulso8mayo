import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * PATCH /api/profile
 * Update user profile
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, whatsappPhone } = body;

        // Build update object
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (whatsappPhone !== undefined) updateData.whatsappPhone = whatsappPhone;

        // Update user
        const [updated] = await db.update(users)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(users.id, session.user.id))
            .returning();

        return NextResponse.json({
            success: true,
            user: updated
        });

    } catch (error) {
        console.error("[Profile API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/profile
 * Get current user profile
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id)
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);

    } catch (error) {
        console.error("[Profile API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
