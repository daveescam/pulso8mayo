import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ComplianceReportService } from "@/lib/services/ComplianceReportService";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/reports/compliance
 * Generate compliance reports (NOM-251, NOM-035)
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");
        const branchId = searchParams.get("branchId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const format = searchParams.get("format") || "json"; // json, pdf

        if (!type || !["NOM-251", "NOM-035", "LABOR_LAW"].includes(type)) {
            return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
        }

        if (!branchId || !startDate || !endDate) {
            return NextResponse.json({ 
                error: "Branch ID, start date, and end date required" 
            }, { status: 400 });
        }

        // Verify branch belongs to user's company
        const branch = await db.query.branches.findFirst({
            where: eq(branches.id, branchId)
        });

        if (!branch || branch.companyId !== session.user.companyId) {
            return NextResponse.json({ error: "Branch not found" }, { status: 404 });
        }

// Generate report
    const service = new ComplianceReportService();
    const reportData = await service.generateReport(
      type as "NOM-251" | "NOM-035" | "LABOR_LAW",
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        branchId,
        companyId: session.user.companyId
      }
    );

    // For JSON format, we need to get the data object
    // The service returns Uint8Array (PDF bytes), so for JSON we need to call the specific method
    if (type === "NOM-251") {
      const data = await service.generateNOM251Report({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        branchId,
        companyId: session.user.companyId
      });
      return NextResponse.json(data);
    } else if (type === "NOM-035") {
      const data = await service.generateNOM035Report({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        branchId,
        companyId: session.user.companyId
      });
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Report type not supported for JSON format" }, { status: 400 });

    } catch (error) {
        console.error("[Compliance Reports API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/reports/compliance
 * Generate and email compliance report
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { type, branchId, startDate, endDate, email } = body;

        if (!type || !branchId || !startDate || !endDate) {
            return NextResponse.json({ 
                error: "Type, branch ID, start date, and end date required" 
            }, { status: 400 });
        }

        // Verify branch
        const branch = await db.query.branches.findFirst({
            where: eq(branches.id, branchId)
        });

        if (!branch || branch.companyId !== session.user.companyId) {
            return NextResponse.json({ error: "Branch not found" }, { status: 404 });
        }

    // Generate report
    const service = new ComplianceReportService();
    const pdfBytes = await service.generateReport(
      type,
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        branchId,
        companyId: session.user.companyId
      }
    );

    // TODO: Send email with PDF attachment
    // For now, return success
    return NextResponse.json({
      success: true,
      message: "Report generated successfully. Email functionality pending."
    });

    } catch (error) {
        console.error("[Compliance Reports API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
