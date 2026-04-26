
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inventoryItems } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/tenant-context";
import { hasPermission, type Role } from "@/lib/permissions";

const productSchema = z.object({
    name: z.string().min(1),
    sku: z.string().optional(),
    category: z.string().optional(),
    minLevel: z.number().optional(),
    unit: z.string().default('UNIT'),
});

export async function GET(req: Request) {
  try {
    const { user } = await requireAuth();

    // Permission check
    if (!hasPermission(user.role, 'inventory', 'read')) {
      return NextResponse.json(
        { error: "No tienes permisos para ver el inventario" },
        { status: 403 }
      );
    }

    // Strict Tenant Check: Filter by user's company
    if (!user.companyId) {
      return NextResponse.json(
        { error: "Usuario no asignado a una empresa" },
        { status: 403 }
      );
    }

    const items = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.companyId, user.companyId))
      .orderBy(desc(inventoryItems.createdAt));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch products", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requireAuth();

    // Permission check
    if (!hasPermission(user.role, 'inventory', 'create')) {
      return NextResponse.json(
        { error: "No tienes permisos para crear productos" },
        { status: 403 }
      );
    }

    // Strict Tenant Check: Must have company assigned
    if (!user.companyId) {
      return NextResponse.json(
        { error: "Usuario no asignado a una empresa" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, sku, category, minLevel, unit } = productSchema.parse(body);

    const newItem = await db.insert(inventoryItems).values({
      companyId: user.companyId,
      name,
      sku,
      category,
      minLevel,
      unit
    }).returning();

    return NextResponse.json(newItem[0]);
  } catch (error) {
    console.error("Failed to create product", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
