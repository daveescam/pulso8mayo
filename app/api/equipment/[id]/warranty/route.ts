import { NextRequest } from "next/server";
import { equipmentService } from "@/lib/services/equipment-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";
import { z } from "zod";

const createWarrantySchema = z.object({
  warrantyNumber: z.string().optional(),
  warrantyType: z.string().optional(),
  provider: z.string().min(1),
  providerContact: z.string().optional(),
  providerPhone: z.string().optional(),
  providerEmail: z.string().optional(),
  coverageDescription: z.string().optional(),
  warrantyTerms: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxClaims: z.number().optional(),
  warrantyDocumentUrl: z.string().optional(),
  purchaseReceiptUrl: z.string().optional(),
  alertDaysBefore: z.number().optional(),
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

    const warranties = await equipmentService.getWarrantiesByEquipment(id);
    
    return ApiHandler.success(warranties);
  } catch (error) {
    return ApiHandler.error(error);
  }
}

export async function POST(
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
    const data = createWarrantySchema.parse(body);

    const warranty = await equipmentService.createWarranty(
      {
        equipmentId: id,
        companyId: tenant.id,
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      tenant.userId
    );
    
    return ApiHandler.success(warranty, 201);
  } catch (error) {
    return ApiHandler.error(error);
  }
}
