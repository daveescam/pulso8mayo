# Stock Count UI - Design

**Date:** 2026-04-30
**Target:** Pulso HORECA - Inventory Stock Count
**Status:** Approved

---

## 1. Overview

Add UI pages to complete the Stock Count workflow implementation. Reuse existing `WorkflowStepper` component for step-by-step counting.

## 2. Pages

### Page 1: Stock Count Hub (`/dashboard/inventory/stock-count`)

- Category selector (5 predefined options from DEFAULT_CATEGORIES)
- Branch selector (if user has access to multiple branches)
- Button: "Iniciar Conteo"
- Recent counts list (last 5 completed counts)

### Page 2: Execution (Reuse existing)

- Reuse `/dashboard/workflows/[id]/execute` page
- WorkflowStepper renders products one by one
- Each step: product name, SKU, system stock, input for physical count
- Final step: summary with variances → confirm → generates AJUSTE

### Page 3: Results

- Show count results with variance per product
- Flag products with >10% variance
- "Volver al inventario" button

## 3. Data Flow

```
1. User opens /dashboard/inventory/stock-count
2. Selects category + branch → POST /api/inventory/stock-count
3. API returns instance → redirect to /dashboard/workflows/[id]/execute
4. User counts each product (WorkflowStepper)
5. User confirms → POST /api/inventory/stock-count/[id] with action: "complete"
6. Show results page
```

## 4. API Integration

| Action | Endpoint | Body |
|--------|---------|------|
| Init count | `POST /api/inventory/stock-count` | `{branchId, category}` |
| Get instance | `GET /api/inventory/stock-count/{id}` | - |
| Complete count | `POST /api/inventory/stock-count/{id}` | `{action: "complete"}` |
| Get history | `GET /api/inventory/stock-count` | `?branchId=` |

## 5. Acceptance Criteria

- [ ] User can initiate stock count from inventory hub
- [ ] Wizard shows products one at a time
- [ ] System stock is displayed per product
- [ ] Physical count is captured correctly
- [ ] Results show variances
- [ ] >10% variance flagged with alert
- [ ] AJUSTE movements generated on completion