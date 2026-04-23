import { NextRequest } from "next/server";
import { UserService } from "@/lib/services/user-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";
import { createUserSchema } from "@/lib/validations/user";

export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant();
        
        // If user doesn't have a company assigned, return empty list or handle appropriately
        if (!tenant.id) {
            return ApiHandler.success({ users: [], total: 0, page: 1, totalPages: 1 });
        }
        
        const { searchParams } = new URL(req.url);
        const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
        const search = searchParams.get('search') || undefined;
        const role = searchParams.get('role') || undefined;

        const result = await UserService.listUsers(tenant.id, { page, limit, search, role });
        return ApiHandler.success(result);
    } catch (error) {
        return ApiHandler.error(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const tenant = await requireTenant();

        // TODO: Add strict permission check here (Only ADMIN/MANAGER)

        const body = await req.json();
        const validatedData = createUserSchema.parse({
            ...body,
            companyId: tenant.id // Enforce user creation in current tenant
        });

        const newUser = await UserService.createUser(validatedData);
        return ApiHandler.success(newUser, 201);
    } catch (error) {
        return ApiHandler.error(error);
    }
}
