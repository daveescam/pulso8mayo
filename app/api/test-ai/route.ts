
import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai-service";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const imageUrl = body.imageUrl || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"; // Default: Dirty floor/messy room
        const prompt = body.prompt || "Is this area clean? Answer with YES or NO.";

        // Direct call to AI Service
        // This will use the provider configured in .env (MOONDREAM_API_KEY)
        const result = await AIService.verifyPhoto(imageUrl, prompt, {
            provider: 'moondream', // Force Moondream for this test
            useFallback: false
        });

        return NextResponse.json({
            success: true,
            provider: 'moondream',
            result
        });

    } catch (error: any) {
        console.error("[TestAPI] AI Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
