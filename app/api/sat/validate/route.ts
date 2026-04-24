import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant-context";
import { z } from "zod";

const validateRFCSchema = z.object({
    rfc: z.string().min(12).max(13),
});

const validateCURPSchema = z.object({
    curp: z.string().length(18),
});

/**
 * RFC regex: ^[A-Z&Ñ]{3,4}[0-9]{6}[0-9A-Z]{2,3}$
 */
function isValidRFC(rfc: string): boolean {
    const clean = rfc.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length !== 12 && clean.length !== 13) return false;
    const pattern = /^[A-Z&Ñ]{3,4}[0-9]{6}[0-9A-Z]{2,3}$/;
    return pattern.test(clean);
}

/**
 * CURP regex: ^[A-Z]{4}[0-9]{6}[A-Z]{6}[0-9]{2}$
 */
function isValidCURP(curp: string): boolean {
    const clean = curp.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length !== 18) return false;
    const pattern = /^[A-Z]{4}[0-9]{6}[A-Z]{6}[0-9]{2}$/;
    return pattern.test(clean);
}

/**
 * POST /api/sat/validate-rfc
 * Validate RFC format and checksum
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        await requireTenant();

        const body = await req.json();
        const data = validateRFCSchema.parse(body);
        const rfc = data.rfc.toUpperCase().replace(/[^A-Z0-9]/g, "");

        const isValid = isValidRFC(rfc);

        return NextResponse.json({
            rfc,
            isValid,
            message: isValid
                ? "RFC válido"
                : "RFC inválido. Formato esperado: ABCD123456EFG",
        });
    } catch (error) {
        console.error("Error validating RFC:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

/**
 * GET /api/sat/validate-rfc
 * Validate RFC from query param
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        await requireTenant();

        const { searchParams } = new URL(req.url);
        const rfc = searchParams.get("rfc");
        const curp = searchParams.get("curp");

        if (rfc) {
            const clean = rfc.toUpperCase().replace(/[^A-Z0-9]/g, "");
            const isValid = isValidRFC(clean);
            return NextResponse.json({ rfc: clean, isValid });
        }

        if (curp) {
            const clean = curp.toUpperCase().replace(/[^A-Z0-9]/g, "");
            const isValid = isValidCURP(clean);
            return NextResponse.json({ curp: clean, isValid });
        }

        return NextResponse.json(
            { error: "rfc or curp query param required" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}