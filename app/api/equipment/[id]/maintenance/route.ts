import { NextRequest } from "next/server";
import { equipmentService } from "@/lib/services/equipment-service";
import { ApiHandler } from "@/lib/api/response";
import { requireTenant } from "@/lib/tenant-context";
import { z } from "zod";

const createMaintenanceSchema = z.object({
  maintenanceType: z.enum(['PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'CLEANING', 'CALIBRATION', 'EMERGENCY']),
  scheduledDate: z.string().datetime(),
  description: z.string().min(1),
  providerType: z.enum(['INTERNAL', 'EXTERNAL', 'CERTIFIED']).optional(),
  providerName: z.string().optional(),
  providerContact: z.string().optional(),
  technicianName: z.string().optional(),
  technicianLicense: z.string().optional(),
  workflowInstanceId: z.string().uuid().optional(),
});

const completeMaintenanceSchema = z.object({
  workPerformed: z.string().min(1),
  tasksCompleted: z.array(z.object({
    task: z.string(),
    completed: z.boolean(),
    notes: z.string().optional(),
  })).optional(),
  partsUsed: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    cost: z.number().optional(),
    partNumber: z.string().optional(),
  })).optional(),
  partsCost: z.number().optional(),
  laborCost: z.number().optional(),
  totalCost: z.number().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  nextMaintenanceDate: z.string().datetime().optional(),
  beforePhotos: z.array(z.string()).optional(),
  afterPhotos: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  signatureUrl: z.string().optional(),
  approvedBy: z.string().optional(),
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

    const url = new URL(req.url);
    const limit = url.searchParams.get("limit") 
      ? parseInt(url.searchParams.get("limit")!) 
      : undefined;

    const history = await equipmentService.getMaintenanceHistory(id, limit);
    
    return ApiHandler.success(history);
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

    // Get equipment to ensure it exists and get branchId
    const equipment = await equipmentService.getEquipmentById(id);
    if (!equipment) {
      return ApiHandler.error(new Error("Equipment not found"), 404);
    }

    const body = await req.json();
    const data = createMaintenanceSchema.parse(body);

    const maintenance = await equipmentService.createMaintenance(
      {
        equipmentId: id,
        companyId: tenant.id,
        branchId: equipment.branchId,
        ...data,
        scheduledDate: new Date(data.scheduledDate),
      },
      tenant.userId
    );
    
    return ApiHandler.success(maintenance, 201);
  } catch (error) {
    return ApiHandler.error(error);
  }
}

// PUT /api/equipment/[id]/maintenance - Complete maintenance
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
    const { maintenanceId, ...data } = body;
    
    if (!maintenanceId) {
      return ApiHandler.error(new Error("maintenanceId is required"), 400);
    }

    const validatedData = completeMaintenanceSchema.parse(data);

    const maintenance = await equipmentService.completeMaintenance(
      maintenanceId,
      {
        ...validatedData,
        nextMaintenanceDate: validatedData.nextMaintenanceDate 
          ? new Date(validatedData.nextMaintenanceDate) 
          : undefined,
      },
      tenant.userId
    );
    
    return ApiHandler.success(maintenance);
  } catch (error) {
    return ApiHandler.error(error);
  }
}
