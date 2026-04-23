import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            console.log("[Auth API] No session found");
            return NextResponse.json(
                { error: "No session found" },
                { status: 401 }
            );
        }

        console.log("[Auth API] Session retrieved:", {
            userId: session.user?.id,
            email: session.user?.email,
            companyId: session.user?.companyId,
            branchId: session.user?.branchId,
            role: session.user?.role
        });

        // CRITICAL FIX: If user has companyId: null, check DB for fresh data
        // This handles the onboarding flow where user data was updated but session is stale
        if (!session.user.companyId && session.user.id) {
            console.log("[Auth API] User has null companyId, fetching fresh data from DB...");
            
            const freshUser = await db.query.users.findFirst({
                where: eq(users.id, session.user.id)
            });

            console.log("[Auth API] Fresh user data from DB:", {
                userId: freshUser?.id,
                companyId: freshUser?.companyId,
                branchId: freshUser?.branchId,
                role: freshUser?.role
            });

            if (freshUser?.companyId) {
                // User has been updated in DB (e.g., after onboarding)
                // Update session with fresh data
                session.user.companyId = freshUser.companyId;
                session.user.branchId = freshUser.branchId;
                session.user.role = freshUser.role;

                console.log("[Auth API] ✓ Refreshed user data from DB:", {
                    userId: session.user.id,
                    companyId: freshUser.companyId,
                    branchId: freshUser.branchId
                });
            }
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error("[Auth API] Error getting session:", error);
        return NextResponse.json(
            { error: "Failed to get session" },
            { status: 500 }
        );
    }
}
