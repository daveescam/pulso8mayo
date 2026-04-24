import { NextRequest } from "next/server";
import { equipmentService } from "@/lib/services/equipment-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";
import { z } from "zod";

const updateEquipmentSchema = z.object({
  name: z.string().min(1).optional(),
  equipmentCode: z.string().min(1).optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  assetTag: z.string().optional(),
  location: z.string().optional(),
  area: z.string().optional(),
  specifications: z.record(z.unknown()).optional(),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().optional(),
  vendor: z.string().optional(),
  vendorContact: z.string().optional(),
  invoiceNumber: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'OUT_OF_ORDER', 'DISPOSED']).optional(),
  statusReason: z.string().optional(),
  maintenanceFrequency: z.string().optional(),
  nextMaintenanceDate: z.string().datetime().optional(),
  lastMaintenanceDate: z.string().datetime().optional(),
  isCritical: z.boolean().optional(),
  notes: z.string().optional(),
});

// GET /api/equipment - Get all equipment for company (across all branches)
export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    
    if (!tenant.id) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    // For now, return equipment from the current branch context
    // This can be extended to support cross-branch queries for managers
    const url = new URL(req.url);
    const branchId = url.searchParams.get("branchId") || tenant.branchId;
    
    if (!branchId) {
      return ApiHandler.error(new Error("Branch ID required"), 400);
    }

    const equipment = await equipmentService.getEquipmentByBranch(branchId);
    return ApiHandler.success(equipment);
  } catch (error) {
    return ApiHandler.error(error);
  }
}
