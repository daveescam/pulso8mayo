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
  specifications: z.record(z.string(), z.unknown()).optional(),
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;
    
    if (!tenant.id) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const equipment = await equipmentService.getEquipmentWithDetails(id);
    
    if (!equipment) {
      return ApiHandler.error(new Error("Equipment not found"), 404);
    }
    
    return ApiHandler.success(equipment);
  } catch (error) {
    return ApiHandler.error(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;
    
    if (!tenant.id) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const body = await req.json();
    const data = updateEquipmentSchema.parse(body);

    const equipment = await equipmentService.updateEquipment(
      id,
      {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        nextMaintenanceDate: data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : undefined,
        lastMaintenanceDate: data.lastMaintenanceDate ? new Date(data.lastMaintenanceDate) : undefined,
      },
      tenant.userId
    );
    
    return ApiHandler.success(equipment);
  } catch (error) {
    return ApiHandler.error(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;
    
    if (!tenant.id) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const equipment = await equipmentService.deleteEquipment(id, tenant.userId);
    
    return ApiHandler.success(equipment);
  } catch (error) {
    return ApiHandler.error(error);
  }
}
