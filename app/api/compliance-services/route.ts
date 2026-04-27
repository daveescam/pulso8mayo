import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { branchComplianceServices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireTenant, requireAuth } from "@/lib/tenant-context";

export async function GET(request: Request) {
  try {
    const tenant = await requireTenant();
    if (!tenant.id || !tenant.branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const services = await db.query.branchComplianceServices.findMany({
      where: (services, { eq }) => eq(services.branchId, tenant.branchId!),
      orderBy: (services, { asc }) => [asc(services.serviceName)],
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching compliance services:", error);
    return NextResponse.json({ error: "Error fetching services" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth();
    const tenant = await requireTenant();

    if (!tenant.id || !tenant.branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { serviceType, serviceName, regulationReference, isMandatory, frequency, customDays, providerId, providerName, providerContact, nextServiceDate, serviceAreas, specialInstructions, workflowTemplateId } = body;

    if (!serviceType || !serviceName || !frequency) {
      return NextResponse.json(
        { error: "Missing required fields: serviceType, serviceName, frequency" },
        { status: 400 }
      );
    }

    const newService = await db.insert(branchComplianceServices).values({
      companyId: tenant.id,
      branchId: tenant.branchId,
      serviceType,
      serviceName,
      regulationReference,
      isMandatory: isMandatory ?? true,
      frequency,
      customDays,
      providerId,
      providerName,
      providerContact,
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
      serviceAreas: serviceAreas || [],
      specialInstructions,
      workflowTemplateId,
      createdBy: user.id,
    }).returning();

    return NextResponse.json(newService[0], { status: 201 });
  } catch (error) {
    console.error("Error creating compliance service:", error);
    return NextResponse.json({ error: "Error creating service" }, { status: 500 });
  }
}