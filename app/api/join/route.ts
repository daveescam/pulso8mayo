import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, branches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ApiHandler } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, inviteToken } = body;

        console.log('Join API - Received inviteToken:', inviteToken);
        console.log('Join API - Token length:', inviteToken?.length);

        if (!inviteToken || typeof inviteToken !== 'string') {
            throw ApiError.badRequest("Invalid or missing invite token");
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(inviteToken)) {
            console.error('Invalid UUID format. Received:', inviteToken);
            throw ApiError.badRequest(`Invalid invite token format. Expected UUID, got: ${inviteToken}`);
        }

        // 1. Validate Token
        const branch = await db.query.branches.findFirst({
            where: eq(branches.inviteToken, inviteToken)
        });

        if (!branch) throw ApiError.badRequest("Invalid invite link");

        // 2. Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (existingUser) {
            // User exists, update their role and branch assignment
            await db.update(users).set({
                companyId: branch.companyId,
                branchId: branch.id,
                role: "GERENTE",
                emailVerified: true,
                name: name || existingUser.name
            }).where(eq(users.id, existingUser.id));

            // Update branch managerId to point to this user
            await db.update(branches).set({
                managerId: existingUser.id
            }).where(eq(branches.id, branch.id));

            return ApiHandler.success({ userId: existingUser.id, existing: true });
        }

        // 3. Create new user via Auth
        const newUserRes = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name
            },
            asResponse: false
        });

        if (!newUserRes?.user) throw new Error("Failed to create user");

        // 4. Update User with Role and Branch
        await db.update(users).set({
            companyId: branch.companyId,
            branchId: branch.id,
            role: "GERENTE",
            emailVerified: true
        }).where(eq(users.id, newUserRes.user.id));

        // Update branch managerId to point to this new user
        await db.update(branches).set({
            managerId: newUserRes.user.id
        }).where(eq(branches.id, branch.id));

        return ApiHandler.success({ userId: newUserRes.user.id, existing: false });

    } catch (error) {
        return ApiHandler.error(error);
    }
}
