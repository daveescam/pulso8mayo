
import { SmartLinkService } from "@/lib/services/smart-link-service";
import { NextResponse } from "next/server";
import { z } from "zod";

const validateSchema = z.object({
    token: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token } = validateSchema.parse(body);

        const context = await SmartLinkService.validateSmartLink(token);

        if (!context) {
            return NextResponse.json(
                { valid: false, error: "Invalid or expired token" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            valid: true,
            context
        });
    } catch (error) {
        console.error("Error validating smart link:", error);
        return NextResponse.json(
            { valid: false, error: "Validation failed" },
            { status: 500 }
        );
    }
}
