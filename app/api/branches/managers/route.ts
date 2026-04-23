import { NextRequest } from "next/server";
import { BranchService } from "@/lib/services/branch-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";

export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId") || undefined;

        const managers = await BranchService.getBranchManagers(tenant.id, branchId);
        return ApiHandler.success(managers);
    } catch (error) {
        return ApiHandler.error(error);
    }
}
