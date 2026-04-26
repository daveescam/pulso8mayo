import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, employeeProfiles } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireTenant } from "@/lib/tenant-context";

/**
 * POST /api/imss/idse-generate
 * Generate IDSE batch file for altas/bajas/salary changes
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const tenant = await requireTenant();
        const body = await req.json();
        const { employeeIds, movementType } = body;

        if (!employeeIds || !employeeIds.length) {
            return NextResponse.json(
                { error: "employeeIds requerido" },
                { status: 400 }
            );
        }

        const movementCode = movementType === "08" ? "08" : movementType === "02" ? "02" : "07";

    const employees = await db
      .select({
        id: users.id,
        name: users.name,
        nss: employeeProfiles.nss,
        curp: employeeProfiles.curp,
        rfc: employeeProfiles.rfc,
        hireDate: employeeProfiles.hireDate,
        terminationDate: employeeProfiles.terminationDate,
      })
      .from(users)
      .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
      .where(and(
        eq(users.companyId, tenant.id as string),
        inArray(users.id, employeeIds)
      ));

        const validEmployees = employees.filter(e =>
            e.nss && e.nss.length === 11 && e.curp && e.curp.length === 18
        );

        if (validEmployees.length === 0) {
            return NextResponse.json(
                { error: "No hay empleados con datos válidos" },
                { status: 400 }
            );
        }

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const lines: string[] = [];

        lines.push(`HD|${tenant.id?.slice(0, 11).padEnd(11, " ")}|${validEmployees.length.toString().padStart(5, "0")}|${today}|PULSO_SISTEMA`);

    for (const emp of validEmployees) {
      const nameParts = (emp.name || "").split(" ");
      const sdiFactor = 1.0452;
      // baseSalary should come from employee_contracts, using default for now
      const baseSalary = 0;
      const sdi = Math.round(baseSalary * sdiFactor * 100) / 100;
      const sdiCents = Math.round(sdi * 100).toString().padStart(7, "0");

            const hireDateFormatted = (emp as any).hireDate
                ? new Date((emp as any).hireDate)
                    .toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })
                    .replace(/\//g, "")
                : today;

            const termDateFormatted = (emp as any).terminationDate
                ? new Date((emp as any).terminationDate)
                    .toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })
                    .replace(/\//g, "")
                : today;

            lines.push([
                "DT",
                (emp.nss || "").padStart(11, "0"),
                (emp.curp || "").padEnd(18, " "),
                (emp.rfc || "").padEnd(13, " "),
                (nameParts[0] || "").toUpperCase().padEnd(27, " "),
                (nameParts[1] || nameParts[0] || "").toUpperCase().padEnd(27, " "),
                (nameParts.slice(2).join(" ") || "").toUpperCase().padEnd(27, " "),
                sdiCents,
                movementCode,
                movementCode === "08" ? hireDateFormatted : termDateFormatted,
                "1",
                "1",
                movementCode === "08" ? "00000000" : termDateFormatted,
            ].join("|"));
        }

        lines.push(`TR|${validEmployees.length.toString().padStart(5, "0")}`);

        const content = lines.join("\r\n");
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

        const movLabel = movementCode === "08" ? "ALTAS" : movementCode === "02" ? "BAJAS" : "MOD_SALARIO";
        const filename = `IDSE_${movLabel}_${today}.txt`;

        return new Response(blob, {
            headers: {
                "Content-Type": "text/plain",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Error generating IDSE file:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}