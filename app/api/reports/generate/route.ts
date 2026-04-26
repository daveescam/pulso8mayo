import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { workflowInstances, workflowTemplates, branches, users } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { format as formatDate } from "date-fns";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { reportId, format, dateFrom, dateTo, branchId, reportType } = body;

        // Validate required fields
        if (!reportId || !format) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Build date conditions
        const conditions = [
            eq(workflowTemplates.companyId, session.user.companyId),
            eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`)
        ];

        if (dateFrom) {
            conditions.push(gte(workflowInstances.createdAt, new Date(dateFrom)));
        }

        if (dateTo) {
            conditions.push(lte(workflowInstances.createdAt, new Date(dateTo)));
        }

        if (branchId) {
            conditions.push(eq(workflowInstances.branchId, branchId));
        }

        // Fetch data based on report type
        let reportData: any = {};

        switch (reportId) {
            case "workflow-summary":
            case "workflow-detailed":
                const workflows = await db.select({
                    id: workflowInstances.id,
                    templateName: workflowTemplates.name,
                    status: workflowInstances.status,
                    score: workflowInstances.score,
                    assigneeName: users.name,
                    branchName: branches.name,
                    createdAt: workflowInstances.createdAt,
                    completedAt: workflowInstances.completedAt,
                })
                    .from(workflowInstances)
                    .leftJoin(workflowTemplates, eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`))
                    .leftJoin(users, eq(workflowInstances.assigneeId, users.id))
                    .leftJoin(branches, eq(workflowInstances.branchId, branches.id))
                    .where(and(...conditions));

    reportData = {
      title: reportId === "workflow-summary" ? "Resumen de Workflows" : "Reporte Detallado de Workflows",
      company: session.user.name || "Empresa",
      generatedAt: new Date(),
      dateRange: { from: dateFrom, to: dateTo },
      workflows,
      summary: {
        total: workflows.length,
        completed: workflows.filter(w => w.status === "COMPLETED").length,
        inProgress: workflows.filter(w => w.status === "IN_PROGRESS").length,
        pending: workflows.filter(w => w.status === "PENDING").length,
        avgScore: workflows.filter(w => w.score !== null).reduce((acc, w) => acc + (w.score || 0), 0) / workflows.filter(w => w.score !== null).length || 0,
      }
    };
                break;

            case "evidence-report":
                // TODO: Implement evidence report
                reportData = { title: "Reporte de Evidencias", message: "Próximamente" };
                break;

            case "compliance-nom251":
                // TODO: Implement NOM-251 report
                reportData = { title: "Cumplimiento NOM-251", message: "Próximamente" };
                break;

            case "inventory-status":
                // TODO: Implement inventory report
                reportData = { title: "Estado de Inventario", message: "Próximamente" };
                break;

            case "labor-attendance":
                // TODO: Implement labor report
                reportData = { title: "Asistencia y Horas", message: "Próximamente" };
                break;

            case "performance-kpis":
                // TODO: Implement KPI report
                reportData = { title: "KPIs de Rendimiento", message: "Próximamente" };
                break;

            case "incidents-report":
                // TODO: Implement incidents report
                reportData = { title: "Reporte de Incidentes", message: "Próximamente" };
                break;

            default:
                return NextResponse.json(
                    { error: "Unknown report type" },
                    { status: 400 }
                );
        }

        // Generate the desired format
        if (format.toUpperCase() === "EXCEL") {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Reporte");

            sheet.columns = [
                { header: "ID", key: "id", width: 20 },
                { header: "Plantilla", key: "templateName", width: 30 },
                { header: "Asignado a", key: "assigneeName", width: 25 },
                { header: "Sucursal", key: "branchName", width: 20 },
                { header: "Estado", key: "status", width: 15 },
                { header: "Puntuación", key: "score", width: 15 },
                { header: "Fecha Creación", key: "createdAt", width: 25 },
            ];

            if (reportData.workflows) {
                reportData.workflows.forEach((w: any) => {
                    sheet.addRow({
                        id: w.id,
                        templateName: w.templateName || "N/A",
                        assigneeName: w.assigneeName || "N/A",
                        branchName: w.branchName || "N/A",
                        status: w.status,
                        score: w.score,
                        createdAt: w.createdAt ? formatDate(new Date(w.createdAt), "yyyy-MM-dd HH:mm") : "N/A"
                    });
                });
            }

            const buffer = await workbook.xlsx.writeBuffer();
            return new NextResponse(buffer, {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="${reportId}.xlsx"`
                }
            });
        } 
        else if (format.toUpperCase() === "PDF") {
            return await new Promise<NextResponse>((resolve, reject) => {
                try {
                    const doc = new PDFDocument({ margin: 50 });
                    const chunks: Buffer[] = [];
                    doc.on("data", chunk => chunks.push(chunk));
                    doc.on("end", () => {
                        const pdfBuffer = Buffer.concat(chunks);
                        resolve(new NextResponse(pdfBuffer, {
                            headers: {
                                "Content-Type": "application/pdf",
                                "Content-Disposition": `attachment; filename="${reportId}.pdf"`
                            }
                        }));
                    });

                    // Add content
                    doc.fontSize(20).text(reportData.title, { align: "center" });
                    doc.moveDown();
                    
                    doc.fontSize(12).text(`Empresa: ${reportData.company}`);
                    doc.text(`Fecha Generación: ${formatDate(reportData.generatedAt, "yyyy-MM-dd HH:mm")}`);
                    doc.text(`Período: ${reportData.dateRange.from || "Inicio"} a ${reportData.dateRange.to || "Fin"}`);
                    doc.moveDown();

                    if (reportData.summary) {
                        doc.fontSize(14).text("Resumen Ejecutivo");
                        doc.fontSize(10).text(`Total: ${reportData.summary.total}`);
                        doc.text(`Completados: ${reportData.summary.completed}`);
                        doc.text(`En progreso: ${reportData.summary.inProgress}`);
                        doc.text(`Promedio Puntos: ${reportData.summary.avgScore.toFixed(2)}`);
                        doc.moveDown();
                    }

                    if (reportData.workflows && reportData.workflows.length > 0) {
                        doc.fontSize(14).text("Listado de Workflows");
                        doc.moveDown();
                        reportData.workflows.forEach((w: any) => {
                            doc.fontSize(10).text(`[${w.status}] ${w.templateName || "N/A"} - Asignado a: ${w.assigneeName || "N/A"}`);
                            doc.moveDown(0.5);
                        });
                    }

                    doc.end();
                } catch (err) {
                    reject(err);
                }
            });
        }

        // Default or JSON fallback
        return NextResponse.json({
            success: true,
            data: reportData,
            message: "Report generated successfully"
        });
    } catch (error) {
        console.error("Failed to generate report:", error);
        return NextResponse.json(
            { error: "Failed to generate report" },
            { status: 500 }
        );
    }
}
