
import { auth } from "@/lib/auth"; // or auth helper
import { db } from "@/lib/db";
import { inventoryItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const productSchema = z.object({
    name: z.string().min(1),
    sku: z.string().optional(),
    category: z.string().optional(),
    minLevel: z.number().optional(),
    unit: z.string().default('UNIT'),
});

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.session?.userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Filter by companyId (assuming user has companyId)
        // If user is accessing this, they should be in a company.
        // For simplicity, fetching all items for the user's company or first found company relation

        // TODO: Strict Tenant Check
        const items = await db.select().from(inventoryItems).orderBy(desc(inventoryItems.createdAt));

        return NextResponse.json(items);
    } catch (error) {
        console.error("Failed to fetch products", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.session?.userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, sku, category, minLevel, unit } = productSchema.parse(body);

        // Mock company ID for now if not on user session
        const companyId = session.user.companyId || "default-company-id";

        const newItem = await db.insert(inventoryItems).values({
            companyId,
            name,
            sku,
            category,
            minLevel,
            unit
        }).returning();

        return NextResponse.json(newItem[0]);
    } catch (error) {
        console.error("Failed to create product", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
