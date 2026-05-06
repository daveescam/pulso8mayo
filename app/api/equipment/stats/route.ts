import { equipmentService } from "@/lib/services/equipment-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";

export async function GET() {
  try {
    const tenant = await requireTenant();
    if (!tenant.id || !tenant.branchId) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const stats = await equipmentService.getEquipmentStats(tenant.branchId);

    return ApiHandler.success(stats);
  } catch (error) {
    return ApiHandler.error(error);
  }
}
