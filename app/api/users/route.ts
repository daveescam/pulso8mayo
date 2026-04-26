import { NextRequest } from "next/server";
import { UserService } from "@/lib/services/user-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant, requireAuth } from "@/lib/tenant-context";
import { createUserSchema } from "@/lib/validations/user";
import { hasPermission, canManageRole } from "@/lib/permissions";

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
        const branchId = searchParams.get('branchId') || undefined;

        const result = await UserService.listUsers(tenant.id, { page, limit, search, role: role as any, branchId });
        return ApiHandler.success(result);
    } catch (error) {
        return ApiHandler.error(error);
    }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const tenant = await requireTenant();

    // Permission check: Only ADMIN, SUPER_ADMIN, or GERENTE can create users
    if (!hasPermission(user.role, 'users', 'create')) {
      return ApiHandler.error({
        message: "No tienes permisos para crear usuarios",
        code: "FORBIDDEN"
      }, 403);
    }

    const body = await req.json();
    const validatedData = createUserSchema.parse({
      ...body,
      companyId: tenant.id // Enforce user creation in current tenant
    });

    // Role hierarchy check: cannot create users with higher or equal role
    if (validatedData.role && !canManageRole(user.role, validatedData.role)) {
      return ApiHandler.error({
        message: "No puedes crear usuarios con un rol igual o superior al tuyo",
        code: "FORBIDDEN"
      }, 403);
    }

    const newUser = await UserService.createUser(validatedData);
    return ApiHandler.success(newUser, 201);
  } catch (error) {
    return ApiHandler.error(error);
  }
}
