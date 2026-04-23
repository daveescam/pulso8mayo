import { NextRequest, NextResponse } from "next/server";
import { ShiftService } from "@/lib/services/shift-service";
import { auth } from "@/lib/auth";

export interface ClockInRequest {
    branchId: string;
    geolocation: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        timestamp?: number;
    };
}

export async function POST(req: NextRequest) {
    try {
        // Get authenticated user
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const body: ClockInRequest = await req.json();
        const { branchId, geolocation } = body;

        if (!branchId) {
            return NextResponse.json(
                { error: "Branch ID es requerido" },
                { status: 400 }
            );
        }

        if (!geolocation?.latitude || !geolocation?.longitude) {
            return NextResponse.json(
                { error: "Geolocalización es requerida" },
                { status: 400 }
            );
        }

        // Perform clock-in with geolocation verification
        const result = await ShiftService.clockInWithGeolocation(
            session.user.id,
            branchId,
            geolocation
        );

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: result.message,
                    distance: result.distance,
                    withinRadius: result.withinRadius
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            session: result.session,
            distance: result.distance,
            withinRadius: result.withinRadius
        });
    } catch (error) {
        console.error("Error in clock-in API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Return API documentation
    return NextResponse.json({
        description: "Clock-in endpoint with geolocation verification",
        method: "POST",
        body: {
            branchId: "string (UUID)",
            geolocation: {
                latitude: "number",
                longitude: "number",
                accuracy: "number (optional, in meters)",
                timestamp: "number (optional, Unix timestamp)"
            }
        },
        responses: {
            200: "Clock-in exitoso",
            400: "Fuera de rango o datos inválidos",
            401: "No autorizado"
        }
    });
}
