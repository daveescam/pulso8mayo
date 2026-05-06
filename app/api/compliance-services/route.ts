import { NextRequest } from "next/server";
import { equipmentService } from "@/lib/services/equipment-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant, requireAuth } from "@/lib/tenant-context";
import { z } from "zod";

const createComplianceServiceSchema = z.object({
  serviceType: z.string().min(1, "El tipo de servicio es requerido"),
  serviceName: z.string().min(1, "El nombre del servicio es requerido"),
  regulationReference: z.string().optional(),
  isMandatory: z.boolean().optional(),
  frequency: z.string().min(1, "La frecuencia es requerida"),
  customDays: z.number().optional(),
  providerId: z.string().optional(),
  providerName: z.string().optional(),
  providerContact: z.string().optional(),
  nextServiceDate: z.string().optional(),
  serviceAreas: z.array(z.string()).optional(),
  specialInstructions: z.string().optional(),
  workflowTemplateId: z.string().optional(),
});

export async function GET() {
  try {
    const tenant = await requireTenant();
    if (!tenant.id || !tenant.branchId) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const services = await equipmentService.getComplianceServicesByBranch(tenant.branchId);

    return ApiHandler.success(services);
  } catch (error) {
    return ApiHandler.error(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const tenant = await requireTenant();

    if (!tenant.id || !tenant.branchId) {
      return ApiHandler.error(new Error("Unauthorized"), 401);
    }

    const body = await request.json();
    const validatedData = createComplianceServiceSchema.parse(body);

    const service = await equipmentService.createComplianceService({
      companyId: tenant.id,
      branchId: tenant.branchId,
      serviceType: validatedData.serviceType,
      serviceName: validatedData.serviceName,
      regulationReference: validatedData.regulationReference,
      isMandatory: validatedData.isMandatory ?? true,
      frequency: validatedData.frequency,
      customDays: validatedData.customDays,
      providerId: validatedData.providerId,
      providerName: validatedData.providerName,
      providerContact: validatedData.providerContact,
      nextServiceDate: validatedData.nextServiceDate ? new Date(validatedData.nextServiceDate) : undefined,
      serviceAreas: validatedData.serviceAreas || [],
      specialInstructions: validatedData.specialInstructions,
      workflowTemplateId: validatedData.workflowTemplateId,
    }, user.id);

    return ApiHandler.success(service, 201);
  } catch (error) {
    return ApiHandler.error(error);
  }
}
