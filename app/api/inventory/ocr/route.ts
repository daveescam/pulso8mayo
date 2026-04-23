import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AIService } from "@/lib/services/ai-service";
import { z } from "zod";

const ocrRequestSchema = z.object({
    image: z.string().min(1, "Image base64 is required"),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { image } = ocrRequestSchema.parse(body);

        // Define prompt tailored for invoices / remisiones using Moondream
        const prompt = `Analiza esta factura o nota de remisión. Extrae la lista de productos y cantidades recibidos.
Devuelve el resultado ESTRICTAMENTE en formato JSON plano con la siguiente estructura, sin texto adicional ni código markdown de formato alrededor:
{
  "supplierName": "nombre del proveedor",
  "poNumber": "numero de la orden o folio",
  "items": [
    { "name": "nombre del producto", "quantity": numero, "unitPrice": numero_opcional }
  ]
}`;

        // Call Moondream via AIService (can pass base64 directly as 'photoUrl' because MoondreamProvider checks for startsWith('http'))
        const ocrResult = await AIService.verifyPhoto(image, prompt, {
            provider: 'moondream',
            useFallback: false
        });

        // The answer is in ocrResult.reason. Let's parse JSON from it.
        const responseText = ocrResult.reason || "{}";
        let parsedData;
        try {
            // Attempt to strip out markdown JSON block if Moondream happened to return it despite instructions
            const cleanedText = responseText.replace(/```json\n|\n```|```/g, '').trim();
            parsedData = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse OCR JSON response from Moondream:", responseText);
            return NextResponse.json(
                { error: "No se pudo extraer la información en formato estructurado de la imagen. Verifica la calidad de la foto." },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: parsedData,
        });

    } catch (error) {
        console.error("OCR endpoint error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Datos inválidos", details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Fallo al procesar la imagen con OCR" },
            { status: 500 }
        );
    }
}
