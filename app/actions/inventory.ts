"use server";

import { InventoryService } from "@/lib/services/inventory-service";
import { inventoryItems } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProduct(formData: FormData) {
    const session = await getSession();
    // @ts-ignore
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const category = formData.get("category") as string;
    const minLevel = Number(formData.get("minLevel") || 0);
    const unit = formData.get("unit") as string;
    const supplierId = formData.get("supplierId") as string || undefined;
    const lastCost = formData.get("lastCost") ? Math.round(Number(formData.get("lastCost")) * 100) : undefined; // Store in cents if integer, or just number if decimal allowed. Schema says integer. Let's assume cents.

    await InventoryService.createItem({
        companyId: session.user.companyId as string, // Cast as it's added by schema
        name,
        sku,
        category,
        minLevel,
        unit,
        active: true,
        supplierId,
        lastCost,
        userId: session.user.id
    });

    revalidatePath("/dashboard/inventory");
    redirect("/dashboard/inventory");
}

export async function updateProduct(id: string, formData: FormData) {
    const session = await getSession();
    // @ts-ignore
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const category = formData.get("category") as string;
    const minLevel = Number(formData.get("minLevel") || 0);
    const unit = formData.get("unit") as string;
    const supplierId = formData.get("supplierId") as string || undefined;
    const lastCost = formData.get("lastCost") ? Math.round(Number(formData.get("lastCost")) * 100) : undefined;

    await InventoryService.updateItem(id, {
        name,
        sku,
        category,
        minLevel,
        unit,
        supplierId,
        lastCost
    }, session.user.id);

    revalidatePath("/dashboard/inventory");
    revalidatePath(`/dashboard/inventory/${id}`);
    redirect(`/dashboard/inventory/${id}`);
}

export async function getCompanyProducts(companyId: string) {
    return await InventoryService.getItems(companyId);
}

export async function getSuppliers(companyId: string) {
    const { suppliers } = await import("@/lib/db/schema");
    const { db } = await import("@/lib/db");
    const { eq, and } = await import("drizzle-orm");

    return await db.select()
        .from(suppliers)
        .where(
            and(
                eq(suppliers.companyId, companyId),
                eq(suppliers.active, true)
            )
        );
}

export async function getPriceHistory(itemId: string) {
    const { inventoryPriceHistory, users } = await import("@/lib/db/schema");
    const { db } = await import("@/lib/db");
    const { eq, desc } = await import("drizzle-orm");

    return await db.select({
        id: inventoryPriceHistory.id,
        previousCost: inventoryPriceHistory.previousCost,
        newCost: inventoryPriceHistory.newCost,
        changedAt: inventoryPriceHistory.changedAt,
        changedByName: users.name
    })
        .from(inventoryPriceHistory)
        .leftJoin(users, eq(inventoryPriceHistory.changedBy, users.id))
        .where(eq(inventoryPriceHistory.itemId, itemId))
        .orderBy(desc(inventoryPriceHistory.changedAt));
}
