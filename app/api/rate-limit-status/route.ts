import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRateLimitStatus } from "@/lib/rate-limiter";

/**
 * GET /api/rate-limit-status
 * Get current rate limit status for the user
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        
        // Use IP address or user ID as identifier
        const identifier = session?.user?.id || 
            req.headers.get("x-forwarded-for")?.split(",")[0] || 
            "anonymous";

        const { searchParams } = new URL(req.url);
        const path = searchParams.get("path") || "/api";

        const status = getRateLimitStatus(identifier, path);

        return NextResponse.json({
            success: true,
            identifier,
            path,
            ...status,
        });

    } catch (error) {
        console.error("Get rate limit status error:", error);
        return NextResponse.json(
            { error: "Failed to get rate limit status" },
            { status: 500 }
        );
    }
}
