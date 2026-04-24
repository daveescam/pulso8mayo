import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { users, employeeProfiles } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { jsPDF } from "jspdf";

export interface SalaryCertificate {
    userId: string;
    userName: string;
    employeeNumber: string | null;
    rfc: string | null;
    curp: string | null;
    year: number;
    totalIncome: number;
    totalTaxWithheld: number;
    employerName: string;
    employerRFC: string;
}

function formatCurrency(cents: number): string {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
    }).format(cents / 100);
}

function toWords(num: number): string {
    const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
    const decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
    constcientos = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
    
    if (num === 0) return "cero pesos 00/100 M.N.";
    if (num < 10) return unidades[num];
    if (num < 100) {
        const d = Math.floor(num / 10);
        const u = num % 10;
        return (d === 2 ? "veinti" : decenas[d]) + (u > 0 ? " y " + unidades[u] : "");
    }
    if (num < 1000) {
        const c = Math.floor(num / 100);
        const d = Math.floor((num % 100) / 10);
        const u = num % 10;
        return cientos[c] + (d > 0 ? " " + (d === 2 ? "veinti" : decenas[d]) : "") + (u > 0 ? " y " + unidades[u] : "");
    }
    return num.toString();
}

/**
 * GET /api/sat/certificates
 * List salary certificates
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const { searchParams } = new URL(req.url);
        const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear() - 1;

        // Get employees with RFC
        const employees = await db
            .select({
                id: users.id,
                name: users.name,
                rfc: employeeProfiles.rfc,
                curp: employeeProfiles.curp,
                employeeNumber: employeeProfiles.employeeNumber,
            })
            .from(users)
            .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
            .where(and(
                eq(users.companyId, tenant.id as string),
                isNull(users.deletedAt)
            ));

        const valid = employees.filter(e => e.rfc && e.rfc.length >= 12);
        const pending = employees.filter(e => !e.rfc || e.rfc.length < 12);

        return NextResponse.json({
            year,
            generated: valid.length,
            pending: pending.length,
            employees: employees.map(e => ({
                userId: e.id,
                name: e.name || "Sin nombre",
                rfc: e.rfc || null,
                hasRFC: !!(e.rfc && e.rfc.length >= 12),
                employeeNumber: e.employeeNumber || null,
            })),
        });
    } catch (error) {
        console.error("Error fetching certificates:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

/**
 * POST /api/sat/certificates
 * Generate/download salary certificate PDF
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const body = await req.json();
        const userId = body.userId;
        const year = body.year || new Date().getFullYear() - 1;

        if (!userId) {
            return NextResponse.json({ error: "userId requerido" }, { status: 400 });
        }

        // Get employee data
        const employee = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!employee) {
            return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
        }

        const profile = await db.query.employeeProfiles.findFirst({
            where: eq(employeeProfiles.userId, userId),
        });

        const rfc = profile?.rfc || "XAXX000101EXX";
        const curp = profile?.curp || "XEXX000101HDFXXR00";
        const employeeNumber = profile?.employeeNumber || "N/A";
        const name = employee.name || "Sin nombre";
        const company = await db.query.companies.findFirst({
            where: eq(users.companyId, tenant.id as string),
        });

        // Generate PDF
        const doc = new jsPDF();
        
        doc.setFontSize(10);
        doc.text("CONSTANCIA DE RETENCIONES E INFORMACIÓN", 105, 15, { align: "center" });
        doc.text("DE NÓMINA (ART. 76 FRACC. IX LISR)", 105, 21, { align: "center" });

        doc.setFontSize(9);
        doc.text(`Año: ${year}`, 15, 35);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString("es-MX")}`, 15, 42);

        doc.setFontSize(10);
        doc.text("DATOS DEL CONTRIBUYENTE", 15, 55);
        doc.text(`RFC: ${rfc}`, 15, 62);
        doc.text(`CURP: ${curp}`, 15, 69);
        doc.text(`Nombre: ${name}`, 15, 76);
        doc.text(`No. Empleado: ${employeeNumber}`, 15, 83);

        doc.text("DATOS DEL PATRÓN", 15, 95);
        doc.text(`RFC: ${company?.taxId || "XAXX000101EXX"}`, 15, 102);
        doc.text(`Nombre o Denominación: ${company?.name || "Empresa"}`, 15, 109);

        doc.text("DECLARACIÓN", 15, 120);
        doc.setFontSize(9);
        doc.text(`El que suscribe, declara bajo protesta de decir verdad que la información contenida en este documento`, 15, 128);
        doc.text(`es correcta y veraz, y que las cantidades均是 de conformidad con lo dispuesto en los artículos`, 15, 135);
        doc.text(`76 fracción IX y 118 de la Ley del Impuesto sobre la Renta.`, 15, 142);

        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
        const blob = new Blob([pdfBuffer], { type: "application/pdf" });

        return new Response(blob, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Constancia_${year}_${name}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Error generating certificate:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}