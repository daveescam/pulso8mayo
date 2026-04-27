import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, employeeProfiles, employeeContracts } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireTenant } from "@/lib/tenant-context";

/**
 * POST /api/imss/sua-generate
 * Generate SUA (Sistema Único de Autodeterminación) file for salary updates
 * 
 * SUA format: Fixed-width text file for salary registration
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const body = await req.json();
        const { employeeIds, newSalaries, fechaMovimiento } = body;

        if (!employeeIds || !employeeIds.length) {
            return NextResponse.json(
                { error: "employeeIds requerido" },
                { status: 400 }
            );
        }

        const employees = await db
            .select({
                id: users.id,
                name: users.name,
                nss: employeeProfiles.nss,
                curp: employeeProfiles.curp,
                rfc: employeeProfiles.rfc,
                hireDate: employeeProfiles.hireDate,
            })
            .from(users)
            .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
            .where(and(
                eq(users.companyId, tenant.id as string),
                inArray(users.id, employeeIds)
            ));

        const validEmployees = employees.filter(e => e.nss && e.nss.length === 11);

        if (validEmployees.length === 0) {
            return NextResponse.json(
                { error: "No hay empleados con NSS válido" },
                { status: 400 }
            );
        }

        const movementDate = fechaMovimiento || new Date().toISOString().slice(0, 10);
        const dateFormatted = movementDate.replace(/-/g, "");
        const registroPatronal = tenant.id?.slice(0, 11).padEnd(11, " ") || "PULSO".padEnd(11, " ");

        const lines: string[] = [];

        for (const emp of validEmployees) {
            const newSalary = newSalaries?.[emp.id] || 300;
            const sdi = Math.round(newSalary * 1.0452 * 100) / 100;
            const sdiCents = Math.round(sdi * 100).toString().padStart(7, "0");

            const nameParts = (emp.name || "").split(" ").filter(Boolean);
            const apellidoPaterno = (nameParts[0] || "").substring(0, 27).padEnd(27, " ");
            const apellidoMaterno = (nameParts.slice(1, 2)[0] || "").substring(0, 27).padEnd(27, " ");
            const nombres = (nameParts.slice(2).join(" ") || nameParts[0] || "").substring(0, 27).padEnd(27, " ");

            const line = [
                (emp.nss || "").padStart(11, "0"),
                sdiCents,
                dateFormatted,
                registroPatronal,
                apellidoPaterno.toUpperCase(),
                apellidoMaterno.toUpperCase(),
                nombres.toUpperCase(),
                "01",
                "01",
                dateFormatted,
            ].join("");

            lines.push(line);
        }

        const content = lines.join("\r\n");
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

        const filename = `SUA_ACTUALIZACION_${dateFormatted}.txt`;

        return new Response(blob, {
            headers: {
                "Content-Type": "text/plain",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Error generating SUA file:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}