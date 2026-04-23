import { NextRequest, NextResponse } from "next/server";
import { ApiHandler } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";
import { CompanyService } from "@/lib/services/company-service";
import { BranchService } from "@/lib/services/branch-service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    console.log("🔥 [API] /api/onboarding HIT");
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            console.error("Onboarding Error: Unauthorized - No session found");
            throw ApiError.unauthorized();
        }

        const body = await req.json();
        const { companyName, branchName, address } = body;

        console.log("Starting Onboarding:", { 
            companyName, 
            branchName, 
            userId: session.user.id,
            userEmail: session.user.email 
        });

        // 1. Create Company and assign user as Owner/Admin
        const company = await CompanyService.createCompany({
            name: companyName,
            plan: "FREE"
        }, session.user.id);

        console.log("Company Created:", company.id);

        // 2. Create Initial Branch linked to that Company
        const branch = await BranchService.createBranch({
            name: branchName,
            companyId: company.id,
            address: address || "",
            timezone: "America/Mexico_City"
        });

        console.log("Branch Created:", branch.id);

        // 3. Update user with companyId and branchId directly in DB
        await db.update(users).set({
            companyId: company.id,
            branchId: branch.id,
            role: 'ADMIN',
            updatedAt: new Date()
        }).where(eq(users.id, session.user.id));

        console.log("User updated in DB:", {
            userId: session.user.id,
            companyId: company.id,
            branchId: branch.id
        });

        // 4. Return success with redirect
        return NextResponse.json({
            success: true,
            company,
            branch,
            redirectUrl: "/dashboard"
        });
    } catch (error) {
        console.error("Onboarding Failed:", error);
        return ApiHandler.error(error);
    }
}
