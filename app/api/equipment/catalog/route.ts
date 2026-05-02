import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { equipmentCatalog } from "@/lib/db/schema";
import { requireTenant, requireAuth } from "@/lib/tenant-context";

export async function GET() {
  try {
    const tenant = await requireTenant();

    if (!tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const catalog = await db.query.equipmentCatalog.findMany({
      where: (catalog, { eq, and }) => and(
        eq(catalog.companyId, tenant.id!),
      ),
      orderBy: (catalog, { asc }) => [asc(catalog.name)],
    });

    return NextResponse.json(catalog);
  } catch (error) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json({ error: "Error fetching catalog" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth();
    const tenant = await requireTenant();

    if (!tenant.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, brand, model, specifications, defaultMaintenanceFrequency, defaultMaintenanceTasks, serialNumberFormat, manualUrl, technicalSpecsUrl, isActive } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: name, type" },
        { status: 400 }
      );
    }

    const newCatalogItem = await db.insert(equipmentCatalog).values({
      name,
      type,
      brand,
      model,
      companyId: tenant.id,
      createdBy: user.id,
      specifications: specifications || {},
      defaultMaintenanceFrequency,
      defaultMaintenanceTasks: defaultMaintenanceTasks || [],
      serialNumberFormat,
      manualUrl,
      technicalSpecsUrl,
      isActive: isActive !== undefined ? isActive : true,
    }).returning();

    return NextResponse.json(newCatalogItem[0], { status: 201 });
  } catch (error) {
    console.error("Error creating catalog item:", error);
    return NextResponse.json({ error: "Error creating catalog item" }, { status: 500 });
  }
}