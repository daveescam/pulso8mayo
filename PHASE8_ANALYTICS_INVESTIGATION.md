# Phase 8: Analytics & Reporting — Investigation Results

**Date:** 2026-05-01  
**Scope:** Phase 8.1 (Real-time Dashboards) — Executive, Operations, Branch Performance  
**PRD Reference:** `prd.md` lines 1117-1185

---

## Executive Summary

Phase 8.1 is **partially implemented**. Significant infrastructure exists (KPI system, chart components, API routes, branch filtering, DB schema), but most dashboard-specific features are either mock/stub, incomplete, or missing entirely. The KPI calculation engine is the most critical gap — it returns `Math.random()` instead of real computed values.

| Sub-phase | Overall Status | Completeness |
|-----------|---------------|-------------|
| 8.1.1 Executive Dashboard | **Partial** | ~35% |
| 8.1.2 Operations Dashboard | **Partial** | ~25% |
| 8.1.3 Branch Performance Dashboard | **Not Started** | ~10% |

---

## 8.1.1 Executive Dashboard

### Acceptance Criteria Status

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | Multi-branch view with key metrics | **Partial** | `DashboardFilters` has branch dropdown; main dashboard shows 4 charts + compliance metrics but not all key metrics |
| 2 | Real-time workflow completion rates | **Partial** | Analytics page polls via `setInterval`; main dashboard fetches once on mount only |
| 3 | Alert summary by priority | **Exists** | KPI alerts system with acknowledge/resolve; critical incidents list on main dashboard |
| 4 | Inventory status overview | **Missing** | No inventory overview on executive dashboard |
| 5 | Cost tracking (AI, operations) | **Missing** | No cost data, API, or UI exists |

### Key Metrics Implementation

| Metric | Status | Details |
|--------|--------|---------|
| Workflow completion rate | **Partial** | `workflow-status-chart.tsx` shows status distribution; completion rate KPI defined (`restaurant-kpis.ts:36-56`) but `calculateKpiValue()` is mock |
| On-time % | **Definition only** | KPI template `ops-on-time-completion` at `restaurant-kpis.ts:58-77`; never computed |
| Avg duration | **Definition only** | KPI template `ops-avg-workflow-duration` at `restaurant-kpis.ts:80-99`; never computed |
| Stock value | **Missing** | No stock valuation logic exists |
| Items below minimum | **Partial** | `/api/inventory/low-stock` endpoint exists; not surfaced on executive dashboard |
| Expiring items | **Partial** | `/api/inventory/expirations` endpoint exists; not surfaced on executive dashboard |
| Open alerts by priority | **Exists** | KPI alerts system with severity levels |
| Avg resolution time | **Missing** | No resolution time tracking |
| Total hours | **Partial** | Labor compliance API computes work minutes; attendance dashboard shows hours |
| Overtime hours | **Partial** | Labor compliance API computes overtime; attendance dashboard shows overtime |
| Compliance % | **Partial** | Compliance API + dashboard exist; compliance metrics cards on main dashboard |

### Visualizations Implementation

| Visualization | Status | File |
|---------------|--------|------|
| KPI cards with trend indicators | **Exists** | `components/analytics/kpi-card.tsx` — sparkline + threshold badges; used on analytics page |
| Workflow completion chart (line) | **Missing** | No line chart for workflow completion over time on executive dashboard |
| Alert distribution (pie chart) | **Missing** | Pie chart type exists in `kpi-chart.tsx` but no alert distribution pie |
| Branch comparison (bar chart) | **Missing** | Bar chart exists (`workflow-status-chart.tsx`) but shows status, not branch comparison |
| Cost trends (area chart) | **Mock** | Area chart type exists but uses hardcoded demo data; no cost-specific chart |

### Subtasks Status

| Subtask | Status |
|---------|--------|
| Design dashboard layout | **Done** — Main dashboard at `app/dashboard/page.tsx` (119 lines) |
| Create metric calculation queries | **Partial** — API routes exist but KPI calculations are mock |
| Implement real-time data updates | **Partial** — Polling on analytics page; main dashboard fetches once |
| Build visualization components | **Partial** — 4 charts on main dashboard; missing line/pie/cost charts |
| Add filtering and date range selection | **Partial** — `DashboardFilters` has branch dropdown + date range UI, but server-side fetches ignore date params |
| Implement export functionality | **Partial** — PDF export on analytics page via `jsPDF`; not on executive dashboard |

---

## 8.1.2 Operations Dashboard

### Acceptance Criteria Status

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | Current workflow status by branch | **Partial** | Workflow status chart exists globally; compliance API supports branchId; no branch-grouped status on operations page |
| 2 | Employee productivity metrics | **Mock** | `employee-leaderboard.tsx` uses hardcoded data; KPI definitions exist but never computed |
| 3 | Task assignment and completion | **Exists (separate)** | Full system on `/dashboard/my-tasks`; not surfaced on operations dashboard |
| 4 | Inventory movements today | **Missing** | DB schema + service exist; no "today's movements" API or UI |
| 5 | Temperature monitoring | **Missing** | No temperature log table, no charts, no API; only KPI definitions + AI extraction |

### Key Metrics Implementation

| Metric | Status | Details |
|--------|--------|---------|
| Active workflows by status | **Mock** | `active-workflows-list.tsx` — 3 hardcoded items; `WorkflowStatusChart` exists but not used on ops page |
| Employee task completion rate | **Mock** | `completion-rate-chart.tsx` — 7 hardcoded data points; real backend stats exist |
| Average task duration by type | **Missing** | KPI definition exists; branch-level avg completion time computed in service; no per-type breakdown or UI |
| Inventory transactions today | **Missing** | No aggregated "today" API endpoint or UI component |
| Temperature compliance | **Missing** | No `temperature_logs` table; KPI template defined; AI extraction exists |

### Components Inventory

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| Operations page | `app/dashboard/operations/page.tsx` | 1-36 | Server component, fetches recent workflows |
| Operations tabs | `components/dashboard/operations/operations-tabs.tsx` | 1-57 | 4 tabs: Overview, Live & Recent, Scheduled, Templates |
| Overview tab | `components/dashboard/operations/overview-tab.tsx` | 1-41 | Renders CompletionRateChart + ActiveWorkflowsList + EmployeeLeaderboard |
| Active workflows list | `components/dashboard/operations/active-workflows-list.tsx` | 1-67 | **MOCK** — 3 hardcoded items |
| Employee leaderboard | `components/dashboard/operations/employee-leaderboard.tsx` | 1-71 | **MOCK** — 5 hardcoded employees |
| Completion rate chart | `components/dashboard/operations/completion-rate-chart.tsx` | 1-70 | **MOCK** — 7 hardcoded data points |
| Scheduled tab | `components/dashboard/operations/scheduled-tab.tsx` | 1-150 | **REAL** — Fetches from `/api/operations/scheduled` |
| Templates tab | `components/dashboard/operations/templates-tab.tsx` | 1-119 | **REAL** — Fetches workflow templates |
| Recent workflows table | `components/dashboard/recent-workflows-table.tsx` | 1-104 | Used in "Live & Recent" tab |

### Subtasks Status

| Subtask | Status |
|---------|--------|
| Create operations-specific queries | **Partial** — `/api/operations/scheduled` exists; `/api/reports/stats` is mock |
| Build task tracking visualizations | **Partial** — Assignment tracking exists on separate page |
| Add employee performance view | **Mock** — Hardcoded leaderboard |
| Implement inventory activity feed | **Missing** — No UI or API |
| Create temperature monitoring charts | **Missing** — No data infrastructure |

---

## 8.1.3 Branch Performance Dashboard

### Acceptance Criteria Status

| # | Criterion | Status | Completeness | Key Gap |
|---|-----------|--------|-------------|---------|
| 1 | Branch-level workflow metrics | **Partial** | ~20% | Compliance breakdown by branch exists; no workflow duration/completion rate by branch |
| 2 | Employee attendance and productivity | **Partial** | ~25% | Attendance dashboard has branch bar chart; no productivity metrics by branch |
| 3 | Inventory health by branch | **Partial** | ~15% | All inventory APIs support `branchId` filter; no aggregated health summary per branch |
| 4 | Cost breakdown by branch | **Not Started** | 0% | No cost data, APIs, or components |
| 5 | Compliance score by branch | **Partial** | ~35% | Best area: compliance trends API + "By Branch" tab; no historical trends or drill-down |

### Subtasks Status

| Subtask | Status | Details |
|---------|--------|---------|
| Create branch comparison views | **Not Started** | Only a list view in ComplianceDashboard and bar chart in AttendanceDashboard; no multi-metric comparison |
| Implement branch filtering | **Done (~80%)** | `BranchProvider` context, `DashboardFilters`, cookie persistence all work; Reports page has hardcoded branches |
| Build branch performance scores | **Not Started** | KPI templates defined (`ops-branch-performance-index`, `corp-branch-performance-ranking`) but `calculateKpiValue()` is mock |
| Add branch ranking | **Not Started** | KPI template `corp-branch-performance-ranking` defined; no computation or UI |
| Create branch drill-down views | **Not Started** | Branch detail page exists but admin-only (no performance data); `handleDrillDown` is a stub |

---

## Critical Infrastructure Findings

### 1. KPI Calculation Engine is MOCK ⚠️

**File:** `lib/services/kpi-service.ts:294-312`

```typescript
// calculateKpiValue() returns Math.random() * 100
// NO real formula parsing or DB queries
```

**Impact:** All 20+ KPI templates defined in `lib/analytics/restaurant-kpis.ts` (1-1243) are never actually computed. The entire analytics page shows random values.

### 2. Reports Stats API is MOCK ⚠️

**File:** `app/api/reports/stats/route.ts:1-44`

Returns hardcoded `completionRate` array, empty `activeWorkflows` and `employeeLeaderboard`.

### 3. No Temperature Data Infrastructure ⚠️

- No `temperature_logs` or `temperature_readings` DB table
- No temperature monitoring API endpoint
- AI can extract temperatures from photos (`lib/services/ai-service.ts:118-124`) but readings aren't stored

### 4. No Cost Tracking ⚠️

- No cost data anywhere in the codebase
- No AI cost tracking, no operational cost tracking
- The PRD mentions cost tracking in Phase 8.1.1 but nothing exists

### 5. Analytics Compliance Route Missing Tenant Filter ⚠️

**File:** `app/api/analytics/compliance/route.ts` — doesn't filter by `companyId`

### 6. Scheduled Reports Cron Not Registered ⚠️

`vercel.json` is missing entries for `/api/cron/scheduled-reports` and `/api/cron/compliance-alerts`, so they won't fire in production.

### 7. Employee Analytics API Ignores branchId ⚠️

**File:** `app/api/analytics/employees/route.ts:11-12` — accepts `branchId` param but doesn't use it in queries.

---

## Component Inventory

### Chart Components (all use Recharts via `components/ui/chart.tsx`)

| Component | File | Chart Type | Data Source |
|-----------|------|------------|-------------|
| Workflow status chart | `components/dashboard/workflow-status-chart.tsx` | Bar | Real API |
| Dashboard charts | `components/dashboard/dashboard-charts.tsx` | Area | Demo data |
| Compliance metrics | `components/dashboard/compliance-metrics.tsx` | RadialBar | Real API |
| KPI chart | `components/analytics/kpi-chart.tsx` | Area/Bar/Line/Pie | KPI API (mock values) |
| Completion rate chart | `components/dashboard/operations/completion-rate-chart.tsx` | Line | **Mock** |
| Attendance branch chart | `components/labor/attendance-dashboard.tsx` | Bar | Real API |
| Overtime chart | `components/labor/overtime-dashboard.tsx` | Bar/Area | Real API |

### KPI / Metric Components

| Component | File | Status |
|-----------|------|--------|
| KPI card | `components/analytics/kpi-card.tsx` | Real (sparkline + thresholds) |
| Stat card | `components/ui/stat-card.tsx` | Real (shared primitive) |
| Assignment stats | `components/assignments/assignment-stats.tsx` | Real (6 stat cards) |
| Compliance metrics | `components/dashboard/compliance-metrics.tsx` | Real (4 stat cards) |
| Equipment stats | `components/equipment/stats-cards.tsx` | Real |

### Filter / Export Components

| Component | File | Status |
|-----------|------|--------|
| Dashboard filters | `components/dashboard/dashboard-filters.tsx` | Real (branch + date range) |
| Branch context | `lib/branch-context.tsx` | Real (React context + cookie) |
| Calendar | `components/ui/calendar.tsx` | Real (primitive) |
| PDF export | `app/dashboard/analytics/page.tsx`, `app/dashboard/reports/page.tsx` | Real (jsPDF) |
| CSV export | `app/dashboard/inventory/page.tsx`, `components/labor/payroll-export.tsx` | Real (manual string) |

### Alert Components

| Component | File | Status |
|-----------|------|--------|
| KPI alerts | `components/analytics/kpi-alerts.tsx` | Real (acknowledge/resolve) |
| Critical incidents | `components/dashboard/critical-incidents.tsx` | Real |
| Equipment alerts | `components/equipment/equipment-alerts.tsx` | Real |
| Stock alerts | `components/inventory/stock-alerts.tsx` | Real |

---

## API Routes Inventory

### Analytics APIs

| Route | Method | Status | Notes |
|-------|--------|--------|-------|
| `/api/analytics/compliance` | GET | **Real** | Missing companyId filter |
| `/api/analytics/compliance/trends` | GET | **Real** | Branch breakdown query |
| `/api/analytics/labor-compliance` | GET | **Real** | Supports branchId |
| `/api/analytics/employees` | GET | **Partial** | Accepts branchId but ignores it |
| `/api/kpi/dashboard` | GET | **Mock** | Fetches KPIs, calculates with random values |
| `/api/kpi/definitions` | GET/POST | **Real** | CRUD for KPI definitions |
| `/api/kpi/[id]` | GET/PATCH/DELETE | **Real** | Single KPI operations |
| `/api/kpi/[id]/history` | GET | **Real** | KPI value history |
| `/api/kpi/[id]/alerts` | GET | **Real** | KPI alert management |
| `/api/reports/stats` | GET | **Mock** | Hardcoded data |
| `/api/operations/scheduled` | GET | **Real** | Scheduled workflows by branch |

### Missing API Endpoints

| Needed Endpoint | Purpose |
|----------------|---------|
| `/api/analytics/branch-performance` | Aggregated branch metrics (workflow, inventory, labor, compliance) |
| `/api/analytics/inventory/activity` | Today's inventory movements across all types |
| `/api/analytics/temperature` | Temperature readings and compliance |
| `/api/analytics/costs` | AI and operational cost tracking |
| `/api/analytics/workflow-completion-trend` | Workflow completion rate over time |
| `/api/analytics/alert-distribution` | Alerts grouped by priority/type |

---

## Database Schema Relevant to Phase 8

### Existing Tables

| Table | File Location | Relevance |
|-------|--------------|-----------|
| `kpiDefinitions` | `lib/db/schema.ts` | KPI metadata |
| `kpiHistory` | `lib/db/schema.ts` | KPI value history over time |
| `kpiAlerts` | `lib/db/schema.ts` | KPI threshold alerts |
| `workflowInstances` | `lib/db/schema.ts` | Workflow execution records |
| `workflowAssignments` | `lib/db/schema.ts` | Task assignments |
| `inventoryMovements` | `lib/db/schema.ts:595-606` | Inventory transactions (RECEIVING, USAGE, ADJUSTMENT, TRANSFER, WASTE, RETURN) |
| `inventoryBatches` | `lib/db/schema.ts` | Batch tracking |
| `branches` | `lib/db/schema/core.ts:18-39` | Branch master data |
| `attendanceRecords` | Schema | Attendance tracking |

### Missing Tables

| Table | Purpose |
|-------|---------|
| `temperatureLogs` | Store temperature readings with timestamp, branch, equipment, value |
| `costRecords` | Track AI costs, operational costs per branch |
| `branchPerformanceScores` | Store computed branch performance index over time |

---

## KPI Templates Defined (Not Computed)

**File:** `lib/analytics/restaurant-kpis.ts` (1243 lines)

### Operations KPIs (lines 33-262)
- `ops-workflow-completion-rate` — `(completed_workflows / total_workflows) * 100`
- `ops-on-time-completion` — `(on_time_workflows / completed_workflows) * 100`
- `ops-avg-workflow-duration` — `AVG(workflow_duration_minutes)`
- `ops-temperature-compliance` — `(temp_compliant_readings / total_temp_readings) * 100`
- `ops-branch-performance-index` — `(workflow_score * 0.4) + (quality_score * 0.3) + (compliance_score * 0.3)`

### Labor KPIs (lines 483-781)
- `labor-tasks-per-employee` — `AVG(tasks_completed_per_employee)`
- `labor-time-per-task` — `AVG(task_duration_minutes)`

### Corporate KPIs (lines 1110-1243)
- `corp-branch-performance-ranking` — `RANK(branch_performance_score)`
- `corp-inter-branch-variance` — `STDEV(branch_performance_scores)`
- `corp-total-active-branches` — `COUNT(active_branches)`
- `corp-branch-compliance-consistency` — `(branches_above_90_compliance / total_branches) * 100`

**All return `Math.random() * 100`** via `kpi-service.ts:294-312`.

---

## Files That Need to Be Created

| File | Purpose |
|------|---------|
| `app/dashboard/analytics/branches/page.tsx` | Dedicated Branch Performance Dashboard |
| `app/api/analytics/branch-performance/route.ts` | Aggregated branch metrics API |
| `app/api/analytics/inventory/activity/route.ts` | Today's inventory movements API |
| `app/api/analytics/temperature/route.ts` | Temperature monitoring API |
| `app/api/analytics/costs/route.ts` | Cost tracking API |
| `app/api/analytics/workflow-completion-trend/route.ts` | Completion rate over time |
| `components/analytics/branch-comparison-chart.tsx` | Side-by-side branch comparison |
| `components/analytics/branch-ranking-table.tsx` | Branch ranking/leaderboard |
| `components/analytics/branch-performance-score-card.tsx` | Composite score card |
| `components/analytics/branch-drill-down.tsx` | Drill-down component |
| `components/analytics/date-range-picker.tsx` | Reusable date range picker |
| `components/analytics/real-time-indicator.tsx` | Live data indicator |
| `components/dashboard/operations/inventory-activity-feed.tsx` | Today's inventory movements |
| `components/dashboard/operations/temperature-monitor.tsx` | Temperature monitoring |
| `lib/services/branch-performance-service.ts` | Branch score computation |
| `lib/db/schema/temperature.ts` | Temperature logs schema |
| `lib/db/schema/costs.ts` | Cost tracking schema |

---

## Priority Fixes Before New Feature Work

1. **Replace `calculateKpiValue()` mock** (`lib/services/kpi-service.ts:294-312`) — Implement real formula parsing and DB queries
2. **Replace `/api/reports/stats` mock** — Connect to real `WorkflowAssignmentService.getBranchAssignmentStats()`
3. **Add `companyId` filter** to `/api/analytics/compliance/route.ts`
4. **Fix `/api/analytics/employees` branchId** — Actually use the `branchId` param in queries
5. **Register cron jobs** — Add `/api/cron/scheduled-reports` and `/api/cron/compliance-alerts` to `vercel.json`
6. **Fix Reports page hardcoded branches** (`app/dashboard/reports/page.tsx:253-256`) — Use dynamic branch list
7. **Connect operations dashboard mock components** — Wire `active-workflows-list.tsx`, `employee-leaderboard.tsx`, and `completion-rate-chart.tsx` to real APIs

---

## Overall Assessment

### What works well:
- KPI system architecture (definitions, history, alerts, dashboard API)
- Branch filtering infrastructure (BranchProvider, DashboardFilters, cookie persistence)
- Compliance analytics (branch breakdown, trends API, dashboard tab)
- Recharts component library integration
- Assignment/task tracking backend (WorkflowAssignmentService)
- Inventory movement recording (DB schema + service)

### What's most broken:
- KPI calculation engine is entirely mock (random values)
- Operations dashboard has 3 mock components with hardcoded data
- No temperature monitoring infrastructure
- No cost tracking infrastructure
- No branch performance page/scores/rankings
- No real-time push updates (only polling on analytics page)
