import { NextRequest } from "next/server";
import { BranchService } from "@/lib/services/branch-service";
import { ApiHandler } from "@/lib/api/response";
import { createBranchSchema } from "@/lib/validations/branch";
import { requireTenant } from "@/lib/tenant-context";

export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        
        // If user doesn't have a company assigned, return empty list
        if (!tenant.id) {
            return ApiHandler.success([]);
        }
        
        const branches = await BranchService.listBranches(tenant.id);
        return ApiHandler.success(branches);
    } catch (error) {
        return ApiHandler.error(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const body = await req.json();
        const data = createBranchSchema.parse(body);

        // Force companyId from tenant
        data.companyId = tenant.id!;

        const branch = await BranchService.createBranch(data);
        return ApiHandler.success(branch, 201);
    } catch (error) {
        return ApiHandler.error(error);
    }
}
