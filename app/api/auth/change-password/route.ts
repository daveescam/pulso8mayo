import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { hash, verify } from "@node-rs/argon2";

/**
 * POST /api/auth/change-password
 * Change user password
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        // Validation
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Current password and new password are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: "New password must be at least 8 characters long" },
                { status: 400 }
            );
        }

        // Get user's current hashed password from database
        // Note: This requires accessing the users table directly
        // Better Auth should provide an API for this
        const response = await auth.api.updateUser({
            body: {
                userId: session.user.id,
                password: newPassword
            }
        });

        return NextResponse.json({
            success: true,
            message: "Password updated successfully"
        });

    } catch (error) {
        console.error("[Change Password API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
