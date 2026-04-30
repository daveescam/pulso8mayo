# Stock Count Template Integration - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Stock Count into the static template library so it appears in the Template Selector UI, while preserving dynamic product step generation at runtime.

**Architecture:** Create a static JSON template base file in `templates/inventory/`, register it in `templates/index.ts`, and modify `StockCountService.getOrCreateTemplate()` to read from the static library first before falling back to DB-only creation.

**Tech Stack:** TypeScript, Next.js, Drizzle ORM, JSON template system

---

## Files

```
New Files:
- templates/inventory/conteo-inventario-v1.json

Modified Files:
- templates/index.ts
- lib/services/stock-count-service.ts
```

---

### Task 1: Create Static Template JSON

**Files:**
- Create: `templates/inventory/conteo-inventario-v1.json`

- [ ] **Step 1: Create `templates/inventory/` directory**

Run:
```bash
mkdir "C:\Users\david\pulso29\templates\inventory"
```

- [ ] **Step 2: Create the template JSON file**

Write `templates/inventory/conteo-inventario-v1.json`:

```json
{
  "id": "tpl-conteo-inventario-v1",
  "nombre": "📦 Conteo de Inventario",
  "descripcion": "Conteo físico de inventario por categoría con generación automática de ajustes. Los pasos de conteo de productos se generan dinámicamente al iniciar el workflow según la categoría seleccionada.",
  "tipo": "INVENTORY",
  "categoria": "INVENTORY",
  "version": 1,
  "activo": true,
  "requiereIA": false,
  "duracionEstimada": "20-45 min",
  "cumplimientoNormativo": [],
  "tags": ["inventario", "conteo", "ajuste", "stock"],
  "dynamicSteps": true,
  "pasos": [
    {
      "id": "category-select",
      "type": "SelectField",
      "title": "¿Qué área vas a contar?",
      "description": "Selecciona la categoría de productos a contar",
      "required": true,
      "options": [
        "Cocina - Materias Primas",
        "Cocina - Verduras",
        "Bebidas",
        "Limpieza",
        "Utilería"
      ]
    },
    {
      "id": "confirm-count",
      "type": "SelectField",
      "title": "¿Confirmas que el conteo está correcto?",
      "description": "Una vez confirmado, se generarán los ajustes automáticamente. Los pasos de conteo de productos se agregan dinámicamente al iniciar el workflow.",
      "required": true,
      "options": [
        { "value": "yes", "label": "Sí, confirmar y generar ajustes" },
        { "value": "no", "label": "No, revisar conteo" }
      ]
    }
  ]
}
```

- [ ] **Step 3: Verify JSON is valid**

Run:
```bash
node -e "const j = require('./templates/inventory/conteo-inventario-v1.json'); console.log('Valid JSON. ID:', j.id, 'Steps:', j.pasos.length)"
```

Expected: `Valid JSON. ID: tpl-conteo-inventario-v1 Steps: 2`

- [ ] **Step 4: Commit**

```bash
git add templates/inventory/conteo-inventario-v1.json
git commit -m "feat: add stock count base template JSON"
```

---

### Task 2: Register Template in Library Index

**Files:**
- Modify: `templates/index.ts`

- [ ] **Step 1: Add the import for the stock count template**

In `templates/index.ts`, add after the `// Seguridad` import block (after line 38):

```typescript
// Inventario
import conteoInventarioV1 from './inventory/conteo-inventario-v1.json';
```

- [ ] **Step 2: Add the template entry in `templateLibrary`**

In `templates/index.ts`, add after the Seguridad section in `templateLibrary` (after line 90):

```typescript
  // Inventario (1)
  'conteo-inventario-v1': normalizeTemplate(conteoInventarioV1),
```

- [ ] **Step 3: Verify the import resolves**

```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors related to the new import.

- [ ] **Step 4: Commit**

```bash
git add templates/index.ts
git commit -m "feat: register stock count template in template library"
```

---

### Task 3: Update `StockCountService.getOrCreateTemplate()` to read from static library

**Files:**
- Modify: `lib/services/stock-count-service.ts`

- [ ] **Step 1: Add import for template library**

In `lib/services/stock-count-service.ts`, add after line 5:

```typescript
import { templateLibrary } from "@/templates";
```

- [ ] **Step 2: Replace `getOrCreateTemplate()` method**

Replace the existing `getOrCreateTemplate()` method (lines 23-51) with:

```typescript
  static async getOrCreateTemplate(companyId: string) {
    const existing = await db.select()
      .from(workflowTemplates)
      .where(and(
        eq(workflowTemplates.companyId, companyId),
        eq(workflowTemplates.name, STOCK_COUNT_TEMPLATE_NAME),
        eq(workflowTemplates.active, true)
      ))
      .limit(1);

    if (existing.length > 0) return existing[0];

    const staticTemplate = templateLibrary['conteo-inventario-v1'];

    const [template] = await db.insert(workflowTemplates).values({
      companyId,
      name: staticTemplate?.title || STOCK_COUNT_TEMPLATE_NAME,
      description: staticTemplate?.description || "Conteo físico de inventario por categoría",
      category: staticTemplate?.category || "INVENTORY",
      steps: staticTemplate
        ? JSON.stringify(staticTemplate.steps)
        : JSON.stringify(DEFAULT_CATEGORIES.map(cat => ({
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No new errors introduced by this change.

- [ ] **Step 4: Commit**

```bash
git add lib/services/stock-count-service.ts
git commit -m "feat: stock count service reads from static template library first"
```

---

### Task 4: Verify end-to-end flow

- [ ] **Step 1: Run the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify template appears in library**

Open the Template Selector UI and check that "Conteo de Inventario" appears under the INVENTORY category.

- [ ] **Step 3: Verify stock count hub still works**

Navigate to `/dashboard/inventory/stock-count` and confirm the page loads with category and branch selectors.

- [ ] **Step 4: Verify dynamic step injection still works**

Start a stock count, confirm that product counting steps appear in the WorkflowStepper between category-select and confirm-count.
