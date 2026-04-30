# Stock Count Workflow - Specification

**Date:** 2026-04-29
**Target:** Pulso HORECA - Restaurant groups (3-15 branches)
**Status:** Pending User Review

---

## 1. Overview

Implement a Stock Count workflow for inventory management in restaurant groups. The workflow guides employees through physical inventory counting by category, captures real counts, and automatically generates inventory adjustment movements (AJUSTE) to reconcile system vs. physical stock.

---

## 2. User Stories

| ID | Story | Priority |
|---|-------|----------|
| US-1 | Como gerente, quiero asignar conteos semanales por categoría para dividir responsabilidades | P0 |
| US-2 | Como empleado de cocina, quiero contar solo los productos de mi área para ser eficiente | P0 |
| US-3 | Como empleado, quiero capturar la cantidad física de cada producto para сравт | P0 |
| US-4 | Como sistema, quiero generar automáticamente ajustes de inventario al completar el conteo | P0 |
| US-5 | Como gerente, quiero ver el historial de varianzas para identificar patrones | P1 |
| US-6 | Como sistema, quiero detectar y alertar sobre diferencias significativas (>10%) | P1 |

---

## 3. Architecture

### 3.1 Components

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Workflow       │────▶│  Inventory      │────▶│  Inventory      │
│  Template       │     │  Instance       │     │  Movements API  │
│  "Stock Count"  │     │  (with counts)  │     │  (type=AJUSTE)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### 3.2 Workflow Template Structure

```typescript
interface StockCountWorkflow {
  id: string;
  name: "Conteo de Inventario";
  category: "INVENTORY";
  steps: [
    // Step 1: Select Category
    {
      id: "category-select";
      type: "multiple_choice";
      title: "¿Qué área vas a contar?";
      options: ["Cocina - Materias Primas", "Cocina - Verduras", "Bebidas", "Limpieza", "Utilería"];
      required: true;
    },
    // Step 2-N: Dynamic product list (populated at instance creation)
    {
      id: "product-{itemId}";
      type: "number";
      title: "{productName} (Sistema: {currentStock} {unit})";
      description: "Ingresa la cantidad física en inventario";
      required: true;
    },
    // Final Step: Confirmation
    {
      id: "confirm-count";
      type: "yes_no";
      title: "¿Confirmas que el conteo está correcto?";
      description: "Una vez confirmado, se generarán los ajustes automáticamente";
    }
  ];
}
```

### 3.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inventory/stock-count/init` | Create workflow instance with products |
| GET | `/api/inventory/stock-count/{instanceId}` | Get stock count results |
| POST | `/api/inventory/stock-count/{instanceId}/complete` | Complete and generate AJUSTE movements |
| GET | `/api/inventory/stock-count/history` | Get historical counts by branch/date |

### 3.4 Data Model

```typescript
// Extend inventoryMovements with stock count reference
interface InventoryMovement {
  id: string;
  branchId: string;
  itemId: string;
  type: "ENTRADA" | "SALIDA" | "AJUSTE" | "TRANSFERENCIA" | "MERMA" | "DEVOLUCION";
  quantityChange: number; // Positive or negative
  reason: string; // Variance reason
  referenceId: string; // workflow_instance_id
  performedBy: string;
  timestamp: Date;
  // New: Stock count specific
  systemQuantity?: number; // Quantity in system before count
  physicalQuantity?: number; // Physical count from employee
}
```

---

## 4. UI/UX Design

### 4.1 Template Creation (Builder)

- Template name: "Conteo de Inventario"
- Category: INVENTORY
- Pre-configured steps loaded from template
- Manager can customize categories

### 4.2 Workflow Execution

**Step 1: Category Selection**
- Dropdown with predefined categories
- Filters products to count

**Step 2-N: Product Counting**
- One product at a time (multi-stepper)
- Shows: Product name, SKU, current stock in system
- Input: Physical count quantity
- Auto-advance to next product

**Final Step: Confirmation**
- Summary of all counts
- Shows variance per product
- Manager confirmation before final submission

### 4.3 Results Dashboard

| Column | Description |
|--------|-------------|
| Producto | Name + SKU |
| Sistema | Current stock |
| Físico | Counted quantity |
| Diferencia | Variance (+/-) |
| Estado | OK / Alert (>10%) |

---

## 5. Business Rules

1. **Category Filtering**: Only products in selected category appear
2. **Variance Calculation**: `physical - system`
3. **Alert Threshold**: Flag if variance > 10%
4. **Auto-AJUSTE**: Generate movement for each product with variance
5. **Audit Trail**: Log system qty, physical qty, user, timestamp
6. **Concurrency**: Only one active count per branch at a time

---

## 6. Implementation Plan

### Phase 1: Template & API
- [ ] Create workflow template "Conteo de Inventario"
- [ ] Add POST `/api/inventory/stock-count/init`
- [ ] Add POST `/api/inventory/stock-count/{id}/complete`

### Phase 2: Frontend
- [ ] Add stock count UI in inventory module
- [ ] Add results dashboard per branch

### Phase 3: Scheduler (Optional)
- [ ] Create weekly schedule for stock count
- [ ] Auto-assign to employees

---

## 7. Acceptance Criteria

- [ ] Manager can create stock count workflow for any category
- [ ] Employee sees only products in selected category
- [ ] System displays current stock for each product
- [ ] Physical count is captured correctly
- [ ] AJUSTE movements generated on completion
- [ ] Variance history is viewable
- [ ] Alert shown for >10% variance