# Stock Count Template Integration - Design

**Date:** 2026-04-30
**Target:** Pulso HORECA - Inventory Stock Count
**Status:** Approved

---

## 1. Overview

Integrate the Stock Count workflow into the static template library so it appears in the Template Selector UI, while preserving the dynamic product step generation that happens at runtime.

---

## 2. Problem

The Stock Count workflow is fully implemented (service, API, pages, WorkflowStepper) but is invisible in the template library because:

1. No JSON template file exists in `templates/`
2. No entry in `templates/index.ts`
3. Template is created dynamically in DB via `StockCountService.getOrCreateTemplate()`
4. No `templates/inventory/` directory exists

---

## 3. Solution: Static Base Template + Dynamic Override

### 3.1 New File: `templates/inventory/conteo-inventario-v1.json`

Static JSON template with fixed steps (category-select + confirm-count) and a `dynamicSteps: true` flag to signal that product steps are injected at runtime.

**Structure:**

```json
{
  "id": "tpl-conteo-inventario-v1",
  "nombre": "📦 Conteo de Inventario",
  "descripcion": "Conteo físico de inventario por categoría con generación automática de ajustes",
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

### 3.2 Modification: `templates/index.ts`

- Import JSON from `./inventory/conteo-inventario-v1.json`
- Add `// Inventario` section comment
- Add `'conteo-inventario-v1': normalizeTemplate(conteoInventarioV1)` entry

### 3.3 Modification: `lib/services/stock-count-service.ts`

Update `getOrCreateTemplate()` to:

1. Import `templateLibrary` from `@/templates`
2. Check if `conteo-inventario-v1` exists in `templateLibrary`
3. If found, use it as base data for the DB template (name, description, category, steps)
4. Fallback to current behavior if not in library

This preserves backward compatibility — if the static template is removed, the service still works by creating the template from scratch.

### 3.4 New Directory: `templates/inventory/`

Create the directory to hold the stock count template JSON, following the existing convention of `templates/{category}/`.

---

## 4. Data Flow

```
1. User opens Template Selector → sees "Conteo de Inventario" in INVENTORY category
2. User selects template → redirected to /dashboard/inventory/stock-count
3. User selects category + branch → POST /api/inventory/stock-count
4. StockCountService.createStockCountInstance() reads base template from library
5. Dynamic product steps (count-{itemId}) injected between category-select and confirm-count
6. Instance created in DB with all steps (static + dynamic)
7. WorkflowStepper executes steps one by one
8. On completion → AJUSTE movements generated → redirect to results
```

---

## 5. Acceptance Criteria

- [ ] `templates/inventory/conteo-inventario-v1.json` exists with valid schema
- [ ] Template appears in Template Selector UI under INVENTORY category
- [ ] `templates/index.ts` includes the stock count template import and entry
- [ ] `StockCountService.getOrCreateTemplate()` reads from static library first
- [ ] Dynamic product step injection still works correctly
- [ ] Existing stock count flow (hub → execute → results) unaffected
- [ ] Backward compatibility: removing the JSON still allows template creation in DB
