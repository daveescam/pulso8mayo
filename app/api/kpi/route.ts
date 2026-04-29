import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { kpiDefinitions, kpiHistory, kpiAlerts } from "@/lib/db/schema";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

// Validation schema for KPI creation
const kpiSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  formula: z.string().min(1, "La fórmula es requerida"),
  metricType: z.enum(["PERCENTAGE", "COUNT", "AVERAGE", "SUM", "TIME", "RATIO"]),
  category: z.enum(["OPERATIONS", "COMPLIANCE", "LABOR", "INVENTORY"]),
  target: z.string().optional().nullable(),
  warningThreshold: z.string().optional().nullable(),
  criticalThreshold: z.string().optional().nullable(),
  thresholdType: z.enum(["MIN", "MAX", "TARGET", "RANGE"]),
  frequency: z.enum(["REALTIME", "HOURLY", "DAILY", "WEEKLY", "MONTHLY"]),
  unit: z.string().optional().nullable(),
  decimalPlaces: z.string().default("2"),
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false),
});

// GET /api/kpi - List all KPIs for the company
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("activeOnly") === "true";

    // Build query conditions
    const conditions = [
      eq(kpiDefinitions.companyId, session.user.companyId),
    ];

    if (category) {
      conditions.push(eq(kpiDefinitions.category, category as any));
    }

    if (activeOnly) {
      conditions.push(eq(kpiDefinitions.active, true));
    }

    const results = await db.query.kpiDefinitions.findMany({
      where: and(...conditions),
      orderBy: (kpiDefinitions, { asc }) => [asc(kpiDefinitions.category), asc(kpiDefinitions.name)],
    });

    return NextResponse.json({ kpis: results });
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs" },
      { status: 500 }
    );
  }
}

// POST /api/kpi - Create a new KPI
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions (only ADMIN, GERENTE, SUPER_ADMIN can create KPIs)
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "GERENTE"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tienes permiso para crear KPIs" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = kpiSchema.parse(body);

    // Check for duplicate KPI name within company
    const existingKpi = await db.query.kpiDefinitions.findFirst({
      where: and(
        eq(kpiDefinitions.companyId, session.user.companyId),
        eq(kpiDefinitions.name, validatedData.name)
      ),
    });

    if (existingKpi) {
      return NextResponse.json(
        { error: "Ya existe un KPI con este nombre" },
        { status: 409 }
      );
    }

    // Create the KPI
    const [newKpi] = await db
      .insert(kpiDefinitions)
      .values({
        companyId: session.user.companyId,
        name: validatedData.name,
        description: validatedData.description,
        formula: validatedData.formula,
        metricType: validatedData.metricType,
        category: validatedData.category,
        target: validatedData.target ? parseFloat(validatedData.target) : null,
        warningThreshold: validatedData.warningThreshold ? parseFloat(validatedData.warningThreshold) : null,
        criticalThreshold: validatedData.criticalThreshold ? parseFloat(validatedData.criticalThreshold) : null,
        thresholdType: validatedData.thresholdType,
        frequency: validatedData.frequency,
        unit: validatedData.unit,
        decimalPlaces: parseInt(validatedData.decimalPlaces),
        active: validatedData.isActive,
        isSystem: validatedData.isSystem,
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "KPI creado exitosamente",
        kpi: newKpi
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating KPI:", error);
    return NextResponse.json(
      { error: "Error al crear el KPI" },
      { status: 500 }
    );
  }
}

// PATCH /api/kpi - Update an existing KPI
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kpiId = searchParams.get("id");

    if (!kpiId) {
      return NextResponse.json(
        { error: "ID de KPI requerido" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if KPI exists and belongs to user's company
    const existingKpi = await db.query.kpiDefinitions.findFirst({
      where: and(
        eq(kpiDefinitions.id, kpiId),
        eq(kpiDefinitions.companyId, session.user.companyId)
      ),
    });

    if (!existingKpi) {
      return NextResponse.json(
        { error: "KPI no encontrado" },
        { status: 404 }
      );
    }

    // Prevent editing system KPIs (unless SUPER_ADMIN)
    if (existingKpi.isSystem && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No puedes modificar KPIs del sistema" },
        { status: 403 }
      );
    }

    // Update the KPI
    const [updatedKpi] = await db
      .update(kpiDefinitions)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(kpiDefinitions.id, kpiId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "KPI actualizado exitosamente",
      kpi: updatedKpi,
    });
  } catch (error) {
    console.error("Error updating KPI:", error);
    return NextResponse.json(
      { error: "Error al actualizar el KPI" },
      { status: 500 }
    );
  }
}

// DELETE /api/kpi - Delete or deactivate a KPI
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kpiId = searchParams.get("id");
    const hardDelete = searchParams.get("hardDelete") === "true";

    if (!kpiId) {
      return NextResponse.json(
        { error: "ID de KPI requerido" },
        { status: 400 }
      );
    }

    // Check if KPI exists and belongs to user's company
    const existingKpi = await db.query.kpiDefinitions.findFirst({
      where: and(
        eq(kpiDefinitions.id, kpiId),
        eq(kpiDefinitions.companyId, session.user.companyId)
      ),
    });

    if (!existingKpi) {
      return NextResponse.json(
        { error: "KPI no encontrado" },
        { status: 404 }
      );
    }

    // Prevent deleting system KPIs
    if (existingKpi.isSystem) {
      return NextResponse.json(
        { error: "No puedes eliminar KPIs del sistema" },
        { status: 403 }
      );
    }

    if (hardDelete && session.user.role === "SUPER_ADMIN") {
      // Hard delete (only SUPER_ADMIN)
      await db.delete(kpiDefinitions).where(eq(kpiDefinitions.id, kpiId));
    } else {
      // Soft delete - deactivate
      await db
        .update(kpiDefinitions)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(kpiDefinitions.id, kpiId));
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? "KPI eliminado" : "KPI desactivado",
    });
  } catch (error) {
    console.error("Error deleting KPI:", error);
    return NextResponse.json(
      { error: "Error al eliminar el KPI" },
      { status: 500 }
    );
  }
}
