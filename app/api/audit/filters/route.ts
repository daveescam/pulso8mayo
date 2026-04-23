import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { users, branches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch users
        const usersList = await db.select({
            id: users.id,
            name: users.name,
        })
            .from(users)
            .where(eq(users.companyId, session.user.companyId));

        // Fetch branches
        const branchesList = await db.select({
            id: branches.id,
            name: branches.name,
        })
            .from(branches)
            .where(eq(branches.companyId, session.user.companyId));

        return NextResponse.json({
            success: true,
            users: usersList,
            branches: branchesList,
        });
    } catch (error) {
        console.error("Failed to fetch audit filter options:", error);
        return NextResponse.json(
            { error: "Failed to fetch audit filter options" },
            { status: 500 }
        );
    }
}
