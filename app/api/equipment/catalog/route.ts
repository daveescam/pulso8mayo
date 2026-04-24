import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { equipmentCatalog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const catalog = await db.query.equipmentCatalog.findMany({
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
    const body = await request.json();
    const { name, type, brand, model, companyId, createdBy, specifications, defaultMaintenanceFrequency, defaultMaintenanceTasks } = body;

    if (!name || !type || !companyId || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newCatalogItem = await db.insert(equipmentCatalog).values({
      name,
      type,
      brand,
      model,
      companyId,
      createdBy,
      specifications: specifications || {},
      defaultMaintenanceFrequency,
      defaultMaintenanceTasks: defaultMaintenanceTasks || [],
    }).returning();

    return NextResponse.json(newCatalogItem[0], { status: 201 });
  } catch (error) {
    console.error("Error creating catalog item:", error);
    return NextResponse.json({ error: "Error creating catalog item" }, { status: 500 });
  }
}