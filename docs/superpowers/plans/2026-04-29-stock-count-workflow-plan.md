# Stock Count Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Stock Count workflow that guides employees through physical inventory counting by category, captures real counts, and automatically generates inventory adjustment movements (AJUSTE) to reconcile system vs. physical stock.

**Architecture:** Use workflow template system + API endpoints. Create workflow instance with dynamic product list per category, capture counts via workflow steps, generate inventory movements on completion.

**Tech Stack:** Next.js App Router, Drizzle ORM, existing workflow/engine and inventory services.

---

## File Structure

```
New Files:
- app/api/inventory/stock-count/route.ts      → POST init, GET history
- app/api/inventory/stock-count/[id]/route.ts → GET instance, POST complete
- lib/services/stock-count-service.ts    → Business logic

Modified Files:
- lib/services/inventory-service.ts   → Add recordAdjustment method
- app/dashboard/inventory/page.tsx    → Add "Start Stock Count" button
```

---

## Task 1: Database Schema & Service

**Files:**
- Modify: `lib/services/inventory-service.ts:100-200`
- Create: `lib/services/stock-count-service.ts`

- [ ] **Step 1: Add AJUSTE type to inventoryMovements**

The schema already supports AJUSTE type. Verify in schema:

```bash
# Check existing enum in schema.ts
grep -n "inventoryTransactionTypeEnum" lib/db/schema.ts | head -5
```

Expected: enum has 'AJUSTE' already defined from PRd.

- [ ] **Step 2: Add recordAdjustment method to InventoryService**

Add at end of `lib/services/inventory-service.ts`:

```typescript
static async recordAdjustment(data: {
    branchId: string;
    itemId: string;
    batchId?: string;
    quantityChange: number;
    reason?: string;
    performedBy: string;
    referenceId?: string; // workflow instance ID
    metadata?: { systemQuantity?: number; physicalQuantity?: number };
}) {
    return await this.recordMovement({
        ...data,
        type: 'ADJUSTMENT',  // Maps to AJUSTE in DB
    });
}
```

- [ ] **Step 3: Create stock-count-service.ts**

```typescript
// lib/services/stock-count-service.ts
import { db } from "@/lib/db";
import { inventoryItems, inventoryBatches, inventoryMovements, workflowTemplates, workflowInstances, workflowInstanceSteps } from "@/lib/db/schema";
import { eq, and, sql, desc, inArray, isNotNull } from "drizzle-orm";
import { InventoryService } from "./inventory-service";

export const STOCK_COUNT_TEMPLATE_NAME = "Conteo de Inventario";

export const DEFAULT_CATEGORIES = [
    { id: "cocina-mp", name: "Cocina - Materias Primas", value: "MATERIA_PRIMA" },
    { id: "cocina-verduras", name: "Cocina - Verduras", value: "VERDURA" },
    { id: "bebidas", name: "Bebidas", value: "BEBIDA" },
    { id: "limpieza", name: "Limpieza", value: "LIMPIEZA" },
    { id: "utensilios", name: "Utilería", value: "UTENSILIO" },
];

export class StockCountService {
    static async getOrCreateTemplate(companyId: string) {
        // Check if template exists
        const existing = await db.select()
            .from(workflowTemplates)
            .where(and(
                eq(workflowTemplates.companyId, companyId),
                eq(workflowTemplates.name, STOCK_COUNT_TEMPLATE_NAME),
                eq(workflowTemplates.active, true)
            ))
            .limit(1);

        if (existing.length > 0) return existing[0];

        // Create new template
        const [template] = await db.insert(workflowTemplates).values({
            companyId,
            name: STOCK_COUNT_TEMPLATE_NAME,
            description: " conteo físico de inventario por categoría",
            category: "INVENTORY",
            steps: JSON.stringify(DEFAULT_CATEGORIES.map(cat => ({
                id: `cat-${cat.id}`,
                type: "multiple_choice",
                title: "¿Qué área vas a contar?",
                options: DEFAULT_CATEGORIES.map(c => c.name),
                required: true,
            }))),
            active: true,
        }).returning();

        return template;
    }

    static async getProductsByCategory(companyId: string, categoryValue: string) {
        return db.select({
            id: inventoryItems.id,
            name: inventoryItems.name,
            sku: inventoryItems.sku,
            category: inventoryItems.category,
            unit: inventoryItems.unit,
        })
            .from(inventoryItems)
            .where(and(
                eq(inventoryItems.companyId, companyId),
                eq(inventoryItems.category, categoryValue),
                eq(inventoryItems.active, true)
            ));
    }

    static async getProductsWithStock(companyId: string, branchId: string, categoryValue?: string) {
        const conditions = [
            eq(inventoryItems.companyId, companyId),
            eq(inventoryItems.active, true),
        ];
        
        if (categoryValue) {
            conditions.push(eq(inventoryItems.category, categoryValue));
        }

        const items = await db.select({
            id: inventoryItems.id,
            name: inventoryItems.name,
            sku: inventoryItems.sku,
            category: inventoryItems.category,
            unit: inventoryItems.unit,
            currentStock: sql<number>`COALESCE((
                SELECT sum(${inventoryBatches.currentQuantity})
                FROM ${inventoryBatches}
                WHERE ${inventoryBatches.itemId} = ${inventoryItems.id}
                AND ${inventoryBatches.branchId} = ${branchId}
                AND ${inventoryBatches.status} = 'AVAILABLE'
            ), 0)`,
        })
            .from(inventoryItems)
            .where(and(...conditions));

        return items;
    }

    static async createStockCountInstance(data: {
        companyId: string;
        branchId: string;
        assigneeId: string;
        categoryValue: string;
    }) {
        // Get template (create if needed)
        const template = await this.getOrCreateTemplate(data.companyId);

        // Get products for category
        const products = await this.getProductsWithStock(data.companyId, data.branchId, data.categoryValue);

        if (products.length === 0) {
            throw new Error("No products found for selected category");
        }

        // Build workflow steps
        const steps = [
            // Category selection step
            {
                id: "category-select",
                type: "multiple_choice" as const,
                title: "¿Qué área vas a contar?",
                options: DEFAULT_CATEGORIES.map(c => c.name),
                required: true,
                value: data.categoryValue,
            },
            // Product count steps - one per product
            ...products.map(p => ({
                id: `count-${p.id}`,
                type: "number" as const,
                title: `${p.name} (SKU: ${p.sku})`,
                description: `Cantidad en sistema: ${p.currentStock || 0} ${p.unit}. Ingresa la cantidad física encontradas:`,
                required: true,
                unit: p.unit,
                systemQuantity: p.currentStock || 0,
                itemId: p.id,
            })),
            // Confirmation step
            {
                id: "confirm-count",
                type: "yes_no" as const,
                title: "¿Confirmas que el conteo está correcto?",
                description: "Una vez confirmado, se generarán los ajustes automáticamente",
            },
        ];

        // Create workflow instance
        const [instance] = await db.insert(workflowInstances).values({
            workflowTemplateId: template.id,
            branchId: data.branchId,
            assigneeId: data.assigneeId,
            status: "in_progress",
            startedAt: new Date(),
            // Store metadata about the count
            metadata: JSON.stringify({
                category: data.categoryValue,
                productCount: products.length,
                startTime: new Date().toISOString(),
            }),
        }).returning();

        // Save initial step data
        for (const step of steps) {
            await db.insert(workflowInstanceSteps).values({
                instanceId: instance.id,
                stepId: step.id,
                stepType: step.type,
                title: step.title,
                description: step.description,
                response: step.value || null,
            });
        }

        return { instance, template, products, steps };
    }

    static async completeStockCount(instanceId: string, userId: string) {
        const instance = await db.query.workflowInstances.findFirst({
            where: eq(workflowInstances.id, instanceId),
        });

        if (!instance) throw new Error("Instance not found");
        if (instance.status === "completed") throw new Error("Already completed");

        // Get all steps
        const steps = await db.select()
            .from(workflowInstanceSteps)
            .where(eq(workflowInstanceSteps.instanceId, instanceId));

        const metadata = instance.metadata ? JSON.parse(instance.metadata) : {};

        // Get confirmation response
        const confirmStep = steps.find(s => s.stepId === "confirm-count");
        if (!confirmStep?.response || confirmStep.response !== "yes") {
            throw new Error("Count not confirmed");
        }

        // Process each product count
        const results: Array<{
            itemId: string;
            systemQuantity: number;
            physicalQuantity: number;
            variance: number;
        }> = [];

        for (const step of steps) {
            if (step.stepId.startsWith("count-")) {
                const itemId = step.stepId.replace("count-", "");
                const systemQty = step.metadata?.systemQuantity || 0;
                const physicalQty = parseInt(step.response || "0", 10);
                const variance = physicalQty - systemQty;

                if (variance !== 0) {
                    // Record adjustment movement
                    await InventoryService.recordAdjustment({
                        branchId: instance.branchId,
                        itemId,
                        quantityChange: variance,
                        reason: `Stock count variance: sistema=${systemQty}, físico=${physicalQty}`,
                        performedBy: userId,
                        referenceId: instanceId,
                        metadata: { systemQuantity: systemQty, physicalQuantity: physicalQty },
                    });
                }

                results.push({
                    itemId,
                    systemQuantity: systemQty,
                    physicalQuantity: physicalQty,
                    variance,
                });
            }
        }

        // Mark instance as completed
        await db.update(workflowInstances)
            .set({
                status: "completed",
                completedAt: new Date(),
                completedBy: userId,
                score: 100, // Always 100 since user confirms
                metadata: JSON.stringify({
                    ...metadata,
                    results,
                    completedAt: new Date().toISOString(),
                }),
            })
            .where(eq(workflowInstances.id, instanceId));

        return { instanceId, results };
    }

    static async getStockCountHistory(companyId: string, branchId?: string) {
        const conditions = [
            sql`${workflowTemplates.name} = ${STOCK_COUNT_TEMPLATE_NAME}`,
        ];

        if (branchId) {
            conditions.push(eq(workflowInstances.branchId, branchId));
        }

        const history = await db.select({
            id: workflowInstances.id,
            branchId: workflowInstances.branchId,
            status: workflowInstances.status,
            metadata: workflowInstances.metadata,
            createdAt: workflowInstances.createdAt,
            completedAt: workflowInstances.completedAt,
        })
            .from(workflowInstances)
            .innerJoin(workflowTemplates, sql`${workflowInstances.workflowTemplateId}::text = ${workflowTemplates.id}::text`)
            .where(and(...conditions))
            .orderBy(desc(workflowInstances.completedAt));

        return history;
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/services/inventory-service.ts lib/services/stock-count-service.ts
git commit -m "feat(inventory): add stock count service for inventory adjustments"
```

---

## Task 2: API Endpoints

**Files:**
- Create: `app/api/inventory/stock-count/route.ts`
- Create: `app/api/inventory/stock-count/[id]/route.ts`

- [ ] **Step 1: Create stock-count init API**

```typescript
// app/api/inventory/stock-count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { StockCountService, DEFAULT_CATEGORIES } from "@/lib/services/stock-count-service";

export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { branchId, category } = body;

        if (!branchId || !category) {
            return NextResponse.json({ error: "branchId and category required" }, { status: 400 });
        }

        const result = await StockCountService.createStockCountInstance({
            companyId: session.user.companyId || "",
            branchId,
            assigneeId: session.user.id,
            categoryValue: category,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Stock count init error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const history = await StockCountService.getStockCountHistory(
        session.user.companyId || "",
        branchId || undefined
    );

    return NextResponse.json(history);
}
```

- [ ] **Step 2: Create stock-count instance API**

```typescript
// app/api/inventory/stock-count/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { StockCountService } from "@/lib/services/stock-count-service";
import { db } from "@/lib/db";
import { workflowInstances, workflowInstanceSteps, workflowTemplates } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const instance = await db.select({
        id: workflowInstances.id,
        status: workflowInstances.status,
        metadata: workflowInstances.metadata,
        createdAt: workflowInstances.createdAt,
        completedAt: workflowInstances.completedAt,
        templateName: workflowTemplates.name,
    })
        .from(workflowInstances)
        .innerJoin(workflowTemplates, sql`${workflowInstances.workflowTemplateId}::text = ${workflowTemplates.id}::text`)
        .where(eq(workflowInstances.id, id))
        .limit(1);

    if (!instance.length) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const steps = await db.select()
        .from(workflowInstanceSteps)
        .where(eq(workflowInstanceSteps.instanceId, id));

    return NextResponse.json({ instance: instance[0], steps });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { action, stepId, response, stepMetadata } = body;

        if (action === "complete") {
            const result = await StockCountService.completeStockCount(id, session.user.id);
            return NextResponse.json(result);
        }

        if (action === "updateStep" && stepId && response !== undefined) {
            await db.update(workflowInstanceSteps)
                .set({
                    response,
                    metadata: stepMetadata ? JSON.stringify(stepMetadata) : undefined,
                    completedAt: new Date(),
                })
                .where(sql`${workflowInstanceSteps.instanceId} = ${id} AND ${workflowInstanceSteps.stepId} = ${stepId}`);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Stock count error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/inventory/stock-count/route.ts app/api/inventory/stock-count/\[id\]/route.ts
git commit -m "feat(inventory): add stock count API endpoints"
```

---

## Task 3: UI Integration

**Files:**
- Modify: `app/dashboard/inventory/page.tsx`

- [ ] **Step 1: Add Stock Count button**

Add import and button in the quick actions section:

```typescript
// In app/dashboard/inventory/page.tsx, add:
import { ClipboardList } from "lucide-react";

// Add this card in the quick actions grid:
<Link href="/dashboard/inventory/stock-count">
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
                Stock Count
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-blue-900">Conteo</div>
            <p className="text-xs text-muted-foreground">
                Iniciar conteo físico de inventario
            </p>
        </CardContent>
    </Card>
</Link>
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(inventory): add stock count button to inventory page"
```

---

## Task 4: Verification

- [ ] **Step 1: Test the implementation**

```bash
# Check build
npm run build

# Test API (example)
curl -X GET http://localhost:3000/api/inventory/stock-count \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test initiating a stock count
curl -X POST http://localhost:3000/api/inventory/stock-count \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"branchId":"BRANCH_ID","category":"MATERIA_PRIMA"}'
```

- [ ] **Step 2: Document**

Add to `stories.md`:
```markdown
- [x] Stock Count Workflow - Conteo físico de inventario por categoría
```

---

## Acceptance Criteria

- [ ] Manager can create stock count for any category
- [ ] Employee sees only products in selected category
- [ ] System displays current stock for each product
- [ ] Physical count is captured correctly
- [ ] AJUSTE movements generated on completion
- [ ] Variance history is viewable
- [ ] Alert shown for >10% variance