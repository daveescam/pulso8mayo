import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { branchComplianceServices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const branchId = searchParams.get("branchId");

    let query = db.query.branchComplianceServices.findMany({
      orderBy: (services, { asc }) => [asc(services.serviceName)],
    });

    const services = await query;

    const filtered = services.filter((service) => {
      if (companyId && service.companyId !== companyId) return false;
      if (branchId && service.branchId !== branchId) return false;
      return true;
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching compliance services:", error);
    return NextResponse.json({ error: "Error fetching services" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, branchId, serviceType, serviceName, regulationReference, isMandatory, frequency, customDays, providerId, providerName, providerContact, nextServiceDate, serviceAreas, specialInstructions, workflowTemplateId, createdBy } = body;

    if (!companyId || !branchId || !serviceType || !serviceName || !frequency || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newService = await db.insert(branchComplianceServices).values({
      companyId,
      branchId,
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
      createdBy,
    }).returning();

    return NextResponse.json(newService[0], { status: 201 });
  } catch (error) {
    console.error("Error creating compliance service:", error);
    return NextResponse.json({ error: "Error creating service" }, { status: 500 });
  }
}