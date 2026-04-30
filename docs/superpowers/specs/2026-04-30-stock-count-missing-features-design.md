# Stock Count Missing Features - Design

**Date:** 2026-04-30
**Target:** Pulso HORECA - Inventory Stock Count
**Status:** Approved

---

## 1. Overview

Complete the remaining Stock Count features: concurrency validation, variance alerts (>10%), pre-confirmation summary, results page, and post-completion redirect.

---

## 2. Features

### 2.1 Concurrency Check

Prevent creating a new stock count when one is already IN_PROGRESS for the same branch.

**Location:** `StockCountService.createStockCountInstance()`
**Logic:** Before creating instance, query for existing IN_PROGRESS instances with same branchId. If found, throw error with the existing instance ID so UI can redirect to it.

### 2.2 Variance Alert (>10%)

Calculate variance percentage per product during completion. Store alert flag in results.

**Formula:** `variancePercent = |variance| / systemQuantity * 100`
**Threshold:** >10% triggers alert
**Storage:** Add `isAlert: boolean` and `variancePercent: number` to each result item in instance data

### 2.3 Pre-Confirmation Summary

Replace the simple confirm-count SELECT step with a summary table showing all counts before confirmation.

**In WorkflowStepper:** When step ID is `confirm-count`, render a summary table instead of the generic SELECT UI. Table shows: Producto | Sistema | Fisico | Diferencia | Estado (OK/Alerta). Below the table, a "Confirmar y Generar Ajustes" button.

**Data source:** Read from all `count-*` steps' existing values to build the summary.

### 2.4 Results Page

New route: `/dashboard/inventory/stock-count/[id]/results`

Shows:
- Header: category, branch, date, status
- Table: Producto | SKU | Sistema | Fisico | Diferencia | % Varianza | Estado
- Alert rows highlighted in red for >10% variance
- Summary stats: total products, alerts count, total adjustments
- "Volver al Inventario" button

### 2.5 Post-Completion Redirect

After completing the last workflow step, redirect to `/dashboard/inventory/stock-count/[instanceId]/results` instead of the generic `window.location.reload()`.

**In WorkflowStepper:** When completing the last step of a stock count workflow, redirect to the results page.

---

## 3. Data Flow

```
1. User initiates count → concurrency check passes → instance created
2. User counts products one by one via WorkflowStepper
3. User reaches confirm-count step → sees summary table with variances
4. User confirms → completeStockCount() generates AJUSTE movements
5. WorkflowStepper detects completion → redirects to /stock-count/[id]/results
6. Results page shows full variance report with alerts
```

---

## 4. Acceptance Criteria

- [ ] Cannot create duplicate active count for same branch
- [ ] Variance >10% flagged with alert in results
- [ ] Confirmation step shows summary table of all counts
- [ ] Results page accessible at /stock-count/[id]/results
- [ ] Redirect to results page after completing count
- [ ] Alert rows visually distinguished in results table
