import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { branches, companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ApiHandler } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";

// Public endpoint - no auth required, just reads branch info from invite token
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) throw ApiError.badRequest("Token is required");

        const branch = await db.query.branches.findFirst({
            where: eq(branches.inviteToken, token),
        });

        if (!branch) throw ApiError.badRequest("Invalid invite link");

        // Get company name
        const company = await db.query.companies.findFirst({
            where: eq(companies.id, branch.companyId),
            columns: { id: true, name: true }
        });

        return ApiHandler.success({
            branchId: branch.id,
            branchName: branch.name,
            branchAddress: branch.address,
            companyName: company?.name,
        });
    } catch (error) {
        return ApiHandler.error(error);
    }
}
