# Stock Count UI - Implementation Plan

**Goal:** Implement Stock Count UI pages for wizard-style physical inventory counting.

---

## Files
```
New Files:
- app/dashboard/inventory/stock-count/page.tsx    → Stock count hub (init + history)

Modified Files:
- app/dashboard/workflows/[id]/execute/page.tsx → Add stock count redirect
- app/api/inventory/stock-count/route.ts        → Add branchId filter to history
```

---

## Task 1: Hub Page

**File:** `app/dashboard/inventory/stock-count/page.tsx`

- [ ] **Step 1: Create page with category + branch selector**

```typescript
// app/dashboard/inventory/stock-count/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { StockCountService, DEFAULT_CATEGORIES } from "@/lib/services/stock-count-service";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function StockCountPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/auth/login");

    const companyId = session.user.companyId || "";

    const userBranches = await db.select().from(branches)
        .where(eq(branches.companyId, companyId));

    const history = await StockCountService.getStockCountHistory(companyId);

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Conteo de Inventario</h1>
            
            {/* Category Selector */}
            <form action={async (formData) => {
                "use server";
                const body = {
                    branchId: formData.get("branchId"),
                    category: formData.get("category"),
                };
                const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + "/api/inventory/stock-count", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                const result = await res.json();
                if (result.instance?.id) {
                    redirect(`/dashboard/workflows/${result.instance.id}/execute`);
                }
            }}>
                <input type="hidden" name="branchId" value={userBranches[0]?.id} />
                
                <Label>Categoría</Label>
                <select name="category" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1">
                    {DEFAULT_CATEGORIES.map(c => (
                        <option key={c.id} value={c.value}>{c.name}</option>
                    ))}
                </select>
                
                <Button type="submit" className="mt-4 w-full">Iniciar Conteo</Button>
            </form>
        </div>
    );
}
```

---