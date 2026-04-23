import { NextRequest } from "next/server";
import { BranchService } from "@/lib/services/branch-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const tenant = await requireTenant();
        const { id } = await params;

        const employees = await BranchService.getBranchEmployees(id);
        return ApiHandler.success(employees);
    } catch (error) {
        return ApiHandler.error(error);
    }
}
