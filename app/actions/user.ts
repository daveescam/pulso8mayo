"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function switchBranch(branchId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // Verify branch exists and belongs to user's company (optional but recommended)
    const branch = await db.query.branches.findFirst({
        where: (branches, { eq, and }) => and(
            eq(branches.id, branchId),
            eq(branches.companyId, session.user.companyId!) // Non-null assertion valid if logged in
        )
    });

    if (!branch) {
        throw new Error("Branch not found or access denied");
    }

    // Update user's current branch
    await db.update(users)
        .set({ branchId: branchId })
        .where(eq(users.id, session.user.id));

    // Revalidate dashboard to reflect changes
    revalidatePath("/dashboard");

    return { success: true };
}
