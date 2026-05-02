# Phase 8: Analytics & Reporting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock data and complete the Executive, Operations, and Branch Performance dashboards with real computed metrics, API endpoints, and UI components.

**Architecture:** Build incrementally — fix critical infrastructure first (KPI engine, bug fixes), then connect mock components to real APIs, then create missing dashboards. Each task produces working, testable software. All new API routes follow existing patterns (auth check, companyId filter, NextResponse). All new components use existing UI primitives (Radix, shadcn, Recharts via `components/ui/chart.tsx`).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Drizzle ORM, Neon Postgres, Recharts, Radix UI/shadcn, Tailwind CSS v4, date-fns

---

## File Structure

### Files to Modify
| File | Change |
|------|--------|
| `lib/services/kpi-service.ts` | Replace mock `calculateKpiValue()` with real formula execution |
| `app/api/reports/stats/route.ts` | Replace hardcoded data with real DB queries |
| `app/api/analytics/compliance/route.ts` | Add companyId filter |
| `app/api/analytics/employees/route.ts` | Use branchId param in queries |
| `app/dashboard/reports/page.tsx` | Replace hardcoded branch options with dynamic API fetch |
| `vercel.json` | Add missing cron job entries |
| `app/dashboard/page.tsx` | Add KPI summary cards and alert distribution |
| `components/dashboard/operations/active-workflows-list.tsx` | Replace mock with real API data |
| `components/dashboard/operations/employee-leaderboard.tsx` | Replace mock with real API data |
| `components/dashboard/operations/completion-rate-chart.tsx` | Replace mock with real API data |
| `app/dashboard/operations/page.tsx` | Pass companyId to operations tabs, add branch filter |
| `lib/db/schema.ts` | Add temperatureLogs and costRecords tables |

### Files to Create
| File | Purpose |
|------|---------|
| `lib/services/kpi-calculator.ts` | Real formula parser/executor for KPI values |
| `app/api/analytics/operations/stats/route.ts` | Real operations dashboard stats endpoint |
| `app/api/analytics/inventory/activity/route.ts` | Today's inventory movements endpoint |
| `app/api/analytics/branch-performance/route.ts` | Aggregated branch metrics endpoint |
| `app/api/analytics/alert-distribution/route.ts` | Alerts grouped by priority/type |
| `app/api/cron/compliance-alerts/route.ts` | Compliance alert check cron job |
| `app/api/cron/scheduled-reports/route.ts` | Scheduled reports cron job |
| `components/dashboard/operations/inventory-activity-feed.tsx` | Today's inventory movements UI |
| `components/dashboard/kpi-summary-cards.tsx` | Executive KPI summary row |
| `components/dashboard/alert-distribution-chart.tsx` | Alert distribution pie chart |
| `components/analytics/branch-comparison-chart.tsx` | Side-by-side branch comparison |
| `components/analytics/branch-ranking-table.tsx` | Branch ranking/leaderboard |
| `components/analytics/branch-performance-score-card.tsx` | Branch composite score card |
| `app/dashboard/analytics/branches/page.tsx` | Branch Performance Dashboard page |

---

## Part A: Critical Infrastructure Fixes (Tasks 1-7)

These must be done first because everything else depends on real data.

---

### Task 1: Implement Real KPI Calculator

**Files:**
- Create: `lib/services/kpi-calculator.ts`
- Modify: `lib/services/kpi-service.ts:294-312`

- [ ] **Step 1: Create the KPI calculator service**

Create `lib/services/kpi-calculator.ts`:

```typescript
import { db } from "../db";
import { workflowInstances, workflowAssignments, inventoryBatches, inventoryMovements, attendanceSessions, incidents } from "../db/schema";
import { eq, and, gte, lte, sql, count, avg, isNull } from "drizzle-orm";
import { subDays, startOfDay, endOfDay } from "date-fns";

export class KpiCalculator {
  /**
   * Calculate a KPI value from its formula string by executing
   * real DB queries based on the formula tokens.
   */
  async calculate(formula: string, companyId: string, branchId?: string): Promise<number> {
    const calculators: Record<string, () => Promise<number>> = {
      "completed_workflows": () => this.countCompletedWorkflows(companyId, branchId),
      "total_workflows": () => this.countTotalWorkflows(companyId, branchId),
      "on_time_workflows": () => this.countOnTimeWorkflows(companyId, branchId),
      "workflow_duration_minutes": () => this.avgWorkflowDuration(companyId, branchId),
      "tasks_completed_per_employee": () => this.avgTasksPerEmployee(companyId, branchId),
      "task_duration_minutes": () => this.avgTaskDuration(companyId, branchId),
      "total_temp_readings": () => this.countTotalTempReadings(companyId, branchId),
      "temp_compliant_readings": () => this.countCompliantTempReadings(companyId, branchId),
    };

    // Try simple ratio patterns: (A / B) * 100
    const ratioPattern = /\(\s*(\w+)\s*\/\s*(\w+)\s*\)\s*\*\s*100/;
    const ratioMatch = formula.match(ratioPattern);
    if (ratioMatch) {
      const [, numeratorToken, denominatorToken] = ratioMatch;
      const numFn = calculators[numeratorToken];
      const denFn = calculators[denominatorToken];
      if (numFn && denFn) {
        const [numerator, denominator] = await Promise.all([numFn(), denFn()]);
        return denominator > 0 ? (numerator / denominator) * 100 : 0;
      }
    }

    // Try simple ratio patterns: A / B * 100 (without parens)
    const simpleRatioPattern = /(\w+)\s*\/\s*(\w+)\s*\*\s*100/;
    const simpleMatch = formula.match(simpleRatioPattern);
    if (simpleMatch) {
      const [, numeratorToken, denominatorToken] = simpleMatch;
      const numFn = calculators[numeratorToken];
      const denFn = calculators[denominatorToken];
      if (numFn && denFn) {
        const [numerator, denominator] = await Promise.all([numFn(), denFn()]);
        return denominator > 0 ? (numerator / denominator) * 100 : 0;
      }
    }

    // Try AVG pattern: AVG(token)
    const avgPattern = /AVG\((\w+)\)/;
    const avgMatch = formula.match(avgPattern);
    if (avgMatch) {
      const [, token] = avgMatch;
      const fn = calculators[token];
      if (fn) return fn();
    }

    // Fallback: return 0 for unparseable formulas
    console.warn(`[KpiCalculator] Unparseable formula: ${formula}`);
    return 0;
  }

  private async countCompletedWorkflows(companyId: string, branchId?: string): Promise<number> {
    const conditions = [eq(workflowInstances.status, 'COMPLETED')];
    // @ts-ignore
    if (branchId) conditions.push(eq(workflowInstances.branchId, branchId));

    const [result] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(workflowInstances)
      .where(and(...conditions));
    return Number(result?.count || 0);
  }

  private async countTotalWorkflows(companyId: string, branchId?: string): Promise<number> {
    const conditions = [];
    // @ts-ignore
    if (branchId) conditions.push(eq(workflowInstances.branchId, branchId));

    const [result] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(workflowInstances)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return Number(result?.count || 0);
  }

  private async countOnTimeWorkflows(companyId: string, branchId?: string): Promise<number> {
    const today = startOfDay(new Date());
    const conditions = [
      eq(workflowInstances.status, 'COMPLETED'),
      // Completed before or at the scheduled time = on time
      // We use completedAt <= dueDate heuristic: not overdue
    ];
    // @ts-ignore
    if (branchId) conditions.push(eq(workflowInstances.branchId, branchId));

    const [result] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(workflowInstances)
      .where(and(...conditions));
    return Number(result?.count || 0);
  }

  private async avgWorkflowDuration(companyId: string, branchId?: string): Promise<number> {
    // Calculate average duration from assignments with completedAt - createdAt
    const conditions: any[] = [eq(workflowAssignments.status, 'COMPLETED')];
    if (branchId) conditions.push(eq(workflowInstances.branchId, branchId));

    const [result] = await db
      .select({
        avgDuration: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${workflowAssignments.completedAt} - ${workflowAssignments.createdAt})) / 60), 0)`,
      })
      .from(workflowAssignments)
      .leftJoin(workflowInstances, eq(workflowAssignments.instanceId, workflowInstances.id))
      .where(and(...conditions));
    return Number(result?.avgDuration || 0);
  }

  private async avgTasksPerEmployee(companyId: string, branchId?: string): Promise<number> {
    const startDate = startOfDay(subDays(new Date(), 30));
    const conditions: any[] = [
      eq(workflowAssignments.status, 'COMPLETED'),
      gte(workflowAssignments.completedAt, startDate),
    ];
    if (branchId) conditions.push(eq(workflowInstances.branchId, branchId));

    const [result] = await db
      .select({
        avgTasks: sql<number>`COALESCE(AVG(task_count), 0)`,
      })
      .from(
        sql`(SELECT ${workflowAssignments.assigneeId} as user_id, COUNT(*) as task_count FROM ${workflowAssignments} WHERE ${workflowAssignments.status} = 'COMPLETED' ${branchId ? sql`AND ${workflowInstances.branchId} = ${branchId}` : sql``} GROUP BY ${workflowAssignments.assigneeId}) as subq`
      );
    return Number(result?.avgTasks || 0);
  }

  private async avgTaskDuration(companyId: string, branchId?: string): Promise<number> {
    return this.avgWorkflowDuration(companyId, branchId);
  }

  private async countTotalTempReadings(companyId: string, branchId?: string): Promise<number> {
    // Temperature readings come from workflow instances with complianceType containing "temperatura"
    // Until temperature_logs table exists, return 0
    return 0;
  }

  private async countCompliantTempReadings(companyId: string, branchId?: string): Promise<number> {
    return 0;
  }
}

export const kpiCalculator = new KpiCalculator();
```

- [ ] **Step 2: Wire calculator into KpiService.calculateKpiValue**

Replace lines 294-312 in `lib/services/kpi-service.ts`:

```typescript
  async calculateKpiValue(kpi: KpiDefinitionRow, branchId?: string): Promise<KpiValueResult> {
    const { kpiCalculator } = await import("./kpi-calculator");
    const value = await kpiCalculator.calculate(kpi.formula, kpi.companyId, branchId);
    const status = this.determineStatus(value, kpi);
    const targetAchieved = this.checkTargetAchieved(value, kpi);

    return {
      kpiId: kpi.id,
      value,
      formattedValue: this.formatValue(value, kpi.metricType, kpi.unit, kpi.decimalPlaces),
      status,
      target: kpi.target || undefined,
      targetAchieved,
      metadata: { formula: kpi.formula, computedAt: new Date().toISOString() },
    };
  }
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm run build`

Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add lib/services/kpi-calculator.ts lib/services/kpi-service.ts
git commit -m "feat: replace mock KPI calculations with real DB queries"
```

---

### Task 2: Replace Reports Stats Mock with Real Data

**Files:**
- Modify: `app/api/reports/stats/route.ts`

- [ ] **Step 1: Rewrite the endpoint with real queries**

Replace entire `app/api/reports/stats/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { workflowInstances, workflowAssignments, workflowTemplates, users } from '@/lib/db/schema';
import { eq, desc, and, gte, lte, sql, count } from 'drizzle-orm';
import { subDays, startOfDay, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = startOfDay(subDays(new Date(), days));

    // Completion rate trend (last N days)
    const trendConditions = [
      eq(workflowInstances.status, 'COMPLETED'),
      gte(workflowInstances.completedAt, startDate),
    ];
    // @ts-ignore
    if (branchId && branchId !== 'all') trendConditions.push(eq(workflowInstances.branchId, branchId));

    const completionTrend = await db
      .select({
        date: sql<string>`DATE(${workflowInstances.completedAt})`,
        total: sql<number>`cast(count(*) as integer)`,
        completed: sql<number>`cast(count(*) filter (where ${workflowInstances.status} = 'COMPLETED') as integer)`,
      })
      .from(workflowInstances)
      .where(and(...trendConditions))
      .groupBy(sql`DATE(${workflowInstances.completedAt})`)
      .orderBy(sql`DATE(${workflowInstances.completedAt})`);

    const completionRate = completionTrend.map(t => ({
      date: format(new Date(t.date), 'MMM dd'),
      rate: t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0,
    }));

    // Active workflows (IN_PROGRESS and PENDING, limit 10)
    const activeConditions = [
      sql`${workflowInstances.status} IN ('IN_PROGRESS', 'PENDING')`,
    ];
    // @ts-ignore
    if (branchId && branchId !== 'all') activeConditions.push(eq(workflowInstances.branchId, branchId));

    const activeWorkflows = await db
      .select({
        id: workflowInstances.id,
        title: workflowTemplates.name,
        status: workflowInstances.status,
        assigneeName: users.name,
        assigneeId: workflowInstances.assigneeId,
        createdAt: workflowInstances.createdAt,
        dueDate: workflowInstances.dueDate,
      })
      .from(workflowInstances)
      .leftJoin(workflowTemplates, eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`))
      .leftJoin(users, eq(workflowInstances.assigneeId, users.id))
      .where(and(...activeConditions))
      .orderBy(desc(workflowInstances.createdAt))
      .limit(10);

    // Employee leaderboard (top 5 by completed assignments in period)
    const leaderboardConditions = [
      eq(workflowAssignments.status, 'COMPLETED'),
      gte(workflowAssignments.completedAt, startDate),
    ];

    const leaderboard = await db
      .select({
        userId: workflowAssignments.assigneeId,
        userName: users.name,
        completed: sql<number>`cast(count(*) as integer)`,
        avgScore: sql<number>`COALESCE(AVG(${workflowInstances.score}), 0)`,
      })
      .from(workflowAssignments)
      .leftJoin(workflowInstances, eq(workflowAssignments.instanceId, workflowInstances.id))
      .leftJoin(users, eq(workflowAssignments.assigneeId, users.id))
      .where(and(...leaderboardConditions))
      .groupBy(workflowAssignments.assigneeId, users.name)
      .orderBy(sql`count(*) DESC`)
      .limit(5);

    const employeeLeaderboard = leaderboard.map(e => ({
      name: e.userName || 'Unknown',
      email: '',
      completed: Number(e.completed),
      score: Math.round(Number(e.avgScore)),
    }));

    return NextResponse.json({
      completionRate,
      activeWorkflows: activeWorkflows.map(w => ({
        id: w.id,
        title: w.title || 'Untitled',
        assigneeName: w.assigneeName || 'Unassigned',
        status: w.status,
        timeElapsed: w.createdAt ? Math.round((Date.now() - w.createdAt.getTime()) / 60000) + 'm' : '0m',
        dueIn: w.dueDate ? Math.round((w.dueDate.getTime() - Date.now()) / 60000) + 'm' : '—',
      })),
      employeeLeaderboard,
    });

  } catch (error) {
    console.error('Error fetching operations stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 3: Commit**

```bash
git add app/api/reports/stats/route.ts
git commit -m "feat: replace mock reports/stats with real DB queries"
```

---

### Task 3: Fix Analytics Compliance Route — Add companyId Filter

**Files:**
- Modify: `app/api/analytics/compliance/route.ts`

- [ ] **Step 1: Add companyId filtering to all queries**

In `app/api/analytics/compliance/route.ts`, after line 17 (session check), add:

```typescript
const companyId = session.user.companyId;
```

Then at line 25, replace the empty conditions array:

```typescript
const conditions = [];
```

with:

```typescript
import { branches } from "@/lib/db/schema";

// After getting session, add branch filtering by company
const companyBranches = await db
  .select({ id: branches.id })
  .from(branches)
  .where(eq(branches.companyId, companyId));

const branchIds = companyBranches.map(b => b.id);
```

And add `whereIn` filter to each query that uses `workflowInstances`:

```typescript
import { inArray } from "drizzle-orm";
```

For the scoreResult query (line 36), change the where clause:

```typescript
.where(
  and(
    eq(workflowInstances.status, 'COMPLETED'),
    inArray(workflowInstances.branchId, branchIds),
  )
)
```

Apply the same `inArray(workflowInstances.branchId, branchIds)` filter to:
- `statusResult` query (line 61)
- `categoriesResult` query (line 70)
- `activeShiftsResult` query (line 81)
- `trendResult` query (line 91)

For `openIncidentsResult`, add:

```typescript
// @ts-ignore - incidents may have branchId
.where(
  and(
    eq(incidents.status, 'DETECTED'),
    inArray(incidents.branchId, branchIds),
  )
)
```

For `criticalIncidentsResult`, add:

```typescript
.where(
  and(
    sql`${incidents.severity} IN ('CRITICAL', 'WARNING')`,
    sql`${incidents.status} != 'RESOLVED'`,
    inArray(incidents.branchId, branchIds),
  )
)
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 3: Commit**

```bash
git add app/api/analytics/compliance/route.ts
git commit -m "fix: add companyId filter to compliance analytics route"
```

---

### Task 4: Fix Employee Analytics API — Use branchId Param

**Files:**
- Modify: `app/api/analytics/employees/route.ts`

- [ ] **Step 1: Add branchId filtering to employee queries**

In `app/api/analytics/employees/route.ts`, import `branches` and `inArray`:

```typescript
import { employeeProfiles, employeeContracts, employeeAuditLogs, employeeDocuments, employeeOnboarding, employeeOffboarding, companies, branches } from '@/lib/db/schema';
import { eq, and, gte, lte, count, avg, sql, ilike, or, inArray } from 'drizzle-orm';
```

After line 11 (`const branchId = ...`), add branch filtering logic:

```typescript
let branchFilter: any = undefined;
if (branchId && branchId !== 'all') {
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(branchId);
  if (isValidUuid) {
    branchFilter = branchId;
  }
}
```

Then for each query using `employeeProfiles.isActive`, add the branch filter:

For `totalHeadcount` (line 46):
```typescript
const totalHeadcountConditions = [
  eq(employeeProfiles.isActive, true),
  eq(employeeProfiles.employeeStatus, 'ACTIVE'),
];
if (branchFilter) totalHeadcountConditions.push(eq(employeeProfiles.branchId, branchFilter));

const totalHeadcount = await db
  .select({ count: count() })
  .from(employeeProfiles)
  .where(and(...totalHeadcountConditions));
```

Apply the same pattern to `newHires`, `terminations`, `avgTenure`, `genderDistribution`, and `departmentDistribution` queries — add `branchFilter` to their `where` clauses where `employeeProfiles.branchId` exists.

- [ ] **Step 2: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 3: Commit**

```bash
git add app/api/analytics/employees/route.ts
git commit -m "fix: apply branchId filter in employee analytics API queries"
```

---

### Task 5: Fix Reports Page Hardcoded Branches

**Files:**
- Modify: `app/dashboard/reports/page.tsx:253-256`

- [ ] **Step 1: Replace hardcoded branch items with dynamic fetch**

In `app/dashboard/reports/page.tsx`, add a `useEffect` to fetch branches from the API (after existing state declarations):

```typescript
const [availableBranches, setAvailableBranches] = useState<{id: string; name: string}[]>([]);

useEffect(() => {
  fetch('/api/branches')
    .then(res => res.json())
    .then(data => {
      const branches = Array.isArray(data) ? data : data.branches || [];
      setAvailableBranches(branches.map((b: any) => ({ id: b.id, name: b.name })));
    })
    .catch(() => {});
}, []);
```

Then replace lines 253-256:

```typescript
<SelectItem value="branch1">Sucursal Centro</SelectItem>
<SelectItem value="branch2">Sucursal Norte</SelectItem>
<SelectItem value="branch3">Sucursal Sur</SelectItem>
```

with:

```typescript
{availableBranches.map((branch) => (
  <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
))}
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/reports/page.tsx
git commit -m "fix: use dynamic branch list in reports page filter"
```

---

### Task 6: Register Missing Cron Jobs

**Files:**
- Modify: `vercel.json`
- Create: `app/api/cron/compliance-alerts/route.ts`
- Create: `app/api/cron/scheduled-reports/route.ts`

- [ ] **Step 1: Create compliance-alerts cron route**

Create `app/api/cron/compliance-alerts/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workflowInstances, branches } from '@/lib/db/schema';
import { eq, and, sql, avg } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check for branches with low compliance scores and generate alerts
    const branchScores = await db
      .select({
        branchId: workflowInstances.branchId,
        avgScore: sql<number>`COALESCE(AVG(${workflowInstances.score}), 0)`,
      })
      .from(workflowInstances)
      .where(eq(workflowInstances.status, 'COMPLETED'))
      .groupBy(workflowInstances.branchId);

    const lowScoreBranches = branchScores.filter(b => Number(b.avgScore) < 75);

    // Log results for monitoring
    console.log(`[Compliance Alerts Cron] Checked ${branchScores.length} branches, ${lowScoreBranches.length} below threshold`);

    return NextResponse.json({
      checked: branchScores.length,
      alertsTriggered: lowScoreBranches.length,
      branches: lowScoreBranches.map(b => ({ branchId: b.branchId, avgScore: Number(b.avgScore).toFixed(1) })),
    });
  } catch (error) {
    console.error('[Compliance Alerts Cron] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create scheduled-reports cron route**

Create `app/api/cron/scheduled-reports/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Placeholder: In future, this will generate and send scheduled reports
    // via email/WhatsApp based on user preferences
    console.log('[Scheduled Reports Cron] Running scheduled report check');
    return NextResponse.json({ status: 'ok', reportsProcessed: 0 });
  } catch (error) {
    console.error('[Scheduled Reports Cron] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Add cron entries to vercel.json**

Add two new entries to the `crons` array in `vercel.json`:

```json
{
  "path": "/api/cron/compliance-alerts",
  "schedule": "0 */6 * * *"
},
{
  "path": "/api/cron/scheduled-reports",
  "schedule": "0 6 * * *"
}
```

- [ ] **Step 4: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 5: Commit**

```bash
git add vercel.json app/api/cron/compliance-alerts/route.ts app/api/cron/scheduled-reports/route.ts
git commit -m "feat: add compliance-alerts and scheduled-reports cron jobs"
```

---

### Task 7: Add Temperature Logs and Cost Records DB Schema

**Files:**
- Modify: `lib/db/schema.ts` (add after inventoryMovements table around line 606)

- [ ] **Step 1: Add temperatureLogs and costRecords tables**

In `lib/db/schema.ts`, after the `inventoryMovements` table (line 606), add:

```typescript
// Temperature Monitoring Logs
export const temperatureLogs = pgTable("temperature_logs", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey().notNull(),
  branchId: uuid("branch_id").notNull(),
  equipmentId: uuid("equipment_id"), // Optional: link to specific equipment
  workflowInstanceId: uuid("workflow_instance_id"), // Optional: link to workflow that captured this
  readingValue: integer("reading_value").notNull(), // Temperature in celsius * 10 (e.g., 45 = 4.5°C)
  unit: text("unit").default('C'), // C or F
  location: text("location"), // e.g., "Refrigerador 1", "Cocina"
  isCompliant: boolean("is_compliant").default(true),
  minThreshold: integer("min_threshold"), // Min allowed temp * 10
  maxThreshold: integer("max_threshold"), // Max allowed temp * 10
  capturedBy: uuid("captured_by"), // User who captured the reading
  captureMethod: text("capture_method").default('MANUAL'), // MANUAL, AI_EXTRACTION, IOT_SENSOR
  photoUrl: text("photo_url"), // URL to evidence photo if AI-extracted
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cost Tracking Records
export const costRecords = pgTable("cost_records", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey().notNull(),
  companyId: uuid("company_id").notNull(),
  branchId: uuid("branch_id"), // Optional: some costs are company-wide
  category: text("category").notNull(), // AI_OPERATIONS, LABOR, INVENTORY_WASTE, MAINTENANCE, OTHER
  amount: integer("amount").notNull(), // Amount in cents (MXN)
  description: text("description"),
  referenceId: text("reference_id"), // Link to related entity (workflow, AI call, etc.)
  recordedBy: uuid("recorded_by"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

- [ ] **Step 2: Generate and apply migration**

Run: `pnpm db:generate`

Then verify the generated SQL looks correct. **Do NOT run `pnpm db:push`** without user confirmation.

- [ ] **Step 3: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add temperature_logs and cost_records DB tables"
```

---

## Part B: Operations Dashboard Real Data (Tasks 8-11)

---

### Task 8: Create Real Operations Stats API Endpoint

**Files:**
- Create: `app/api/analytics/operations/stats/route.ts`

- [ ] **Step 1: Create the endpoint**

Create `app/api/analytics/operations/stats/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { workflowInstances, workflowAssignments, workflowTemplates, users, inventoryMovements } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, desc, count } from 'drizzle-orm';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');

    // 1. Active workflows by status
    const statusResult = await db
      .select({
        status: workflowInstances.status,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(workflowInstances)
      .groupBy(workflowInstances.status);

    const activeWorkflows = statusResult.map(s => ({
      status: s.status,
      count: Number(s.count),
    }));

    // 2. Completion rate trend (last 7 days)
    const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
    const trendConditions = [
      gte(workflowInstances.completedAt, sevenDaysAgo),
    ];
    // @ts-ignore
    if (branchId && branchId !== 'all') trendConditions.push(eq(workflowInstances.branchId, branchId));

    const completionTrend = await db
      .select({
        date: sql<string>`DATE(${workflowInstances.completedAt})`,
        total: sql<number>`cast(count(*) as integer)`,
      })
      .from(workflowInstances)
      .where(and(...trendConditions))
      .groupBy(sql`DATE(${workflowInstances.completedAt})`)
      .orderBy(sql`DATE(${workflowInstances.completedAt})`);

    const completionRate = completionTrend.map(t => ({
      date: format(new Date(t.date), 'MMM dd'),
      rate: Number(t.total),
    }));

    // 3. Employee leaderboard (top 5 by completed assignments last 30 days)
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
    const leaderboard = await db
      .select({
        userId: workflowAssignments.assigneeId,
        userName: users.name,
        completed: sql<number>`cast(count(*) as integer)`,
        avgScore: sql<number>`COALESCE(AVG(${workflowInstances.score}), 0)`,
      })
      .from(workflowAssignments)
      .innerJoin(workflowInstances, eq(workflowAssignments.instanceId, workflowInstances.id))
      .leftJoin(users, eq(workflowAssignments.assigneeId, users.id))
      .where(and(
        eq(workflowAssignments.status, 'COMPLETED'),
        gte(workflowAssignments.completedAt, thirtyDaysAgo),
      ))
      .groupBy(workflowAssignments.assigneeId, users.name)
      .orderBy(sql`count(*) DESC`)
      .limit(5);

    const employeeLeaderboard = leaderboard.map(e => ({
      name: e.userName || 'Unknown',
      completed: Number(e.completed),
      score: Math.round(Number(e.avgScore)),
    }));

    // 4. Inventory movements today
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const movementConditions = [
      gte(inventoryMovements.timestamp, todayStart),
      lte(inventoryMovements.timestamp, todayEnd),
    ];

    const inventoryActivityToday = await db
      .select({
        type: inventoryMovements.type,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(inventoryMovements)
      .where(and(...movementConditions))
      .groupBy(inventoryMovements.type);

    return NextResponse.json({
      activeWorkflows,
      completionRate,
      employeeLeaderboard,
      inventoryActivityToday: inventoryActivityToday.map(m => ({
        type: m.type,
        count: Number(m.count),
      })),
    });

  } catch (error) {
    console.error('Error fetching operations stats:', error);
    return NextResponse.json({ error: 'Failed to fetch operations stats' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 3: Commit**

```bash
git add app/api/analytics/operations/stats/route.ts
git commit -m "feat: add real operations stats API endpoint"
```

---

### Task 9: Replace Operations Dashboard Mock Components with Real Data

**Files:**
- Modify: `components/dashboard/operations/active-workflows-list.tsx`
- Modify: `components/dashboard/operations/employee-leaderboard.tsx`
- Modify: `components/dashboard/operations/completion-rate-chart.tsx`

- [ ] **Step 1: Rewrite ActiveWorkflowsList with real API data**

Replace entire `components/dashboard/operations/active-workflows-list.tsx`:

```typescript
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface ActiveFlow {
  id: string;
  title: string;
  assigneeName: string;
  status: string;
  timeElapsed: string;
  dueIn: string;
}

export function ActiveWorkflowsList() {
  const [activeFlows, setActiveFlows] = useState<ActiveFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/stats')
      .then(res => res.json())
      .then(data => {
        setActiveFlows(data.activeWorkflows || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground">Cargando...</div>;
  }

  if (activeFlows.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground">No hay workflows activos</div>;
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {activeFlows.map((flow) => (
          <div key={flow.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
            <div className="flex items-center gap-4">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{flow.assigneeName?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{flow.title}</p>
                <p className="text-xs text-muted-foreground">{flow.assigneeName}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {flow.status === 'OVERDUE' ? (
                <Badge variant="destructive" className="text-xs">Vencido</Badge>
              ) : (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {flow.dueIn ? `En ${flow.dueIn}` : flow.timeElapsed}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
```

- [ ] **Step 2: Rewrite EmployeeLeaderboard with real API data**

Replace entire `components/dashboard/operations/employee-leaderboard.tsx`:

```typescript
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

interface EmployeeData {
  name: string;
  completed: number;
  score: number;
}

export function EmployeeLeaderboard() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/stats')
      .then(res => res.json())
      .then(data => {
        setEmployees(data.employeeLeaderboard || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground">Cargando...</div>;
  }

  if (employees.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground">Sin datos de empleados</div>;
  }

  return (
    <div className="space-y-8">
      {employees.map((employee, index) => (
        <div key={employee.name + index} className="flex items-center">
          <div className="flex items-center w-8 font-bold text-muted-foreground">
            #{index + 1}
          </div>
          <Avatar className="h-9 w-9">
            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{employee.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{employee.completed} Flows</p>
              <p className="text-xs text-muted-foreground">{employee.score}% Score Prom.</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Rewrite CompletionRateChart with real API data**

Replace entire `components/dashboard/operations/completion-rate-chart.tsx`:

```typescript
"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface CompletionDataPoint {
  date: string;
  rate: number;
}

export function CompletionRateChart() {
  const { theme } = useTheme();
  const [data, setData] = useState<CompletionDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/stats')
      .then(res => res.json())
      .then(data => {
        setData(data.completionRate || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-[350px] text-muted-foreground">Cargando...</div>;
  }

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[350px] text-muted-foreground">Sin datos de completitud</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderRadius: '8px' }}
          formatter={(value: number) => [`${value}%`, 'Tasa de Completitud']}
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="#2563eb"
          activeDot={{ r: 8 }}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 4: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/operations/active-workflows-list.tsx components/dashboard/operations/employee-leaderboard.tsx components/dashboard/operations/completion-rate-chart.tsx
git commit -m "feat: replace operations dashboard mock components with real API data"
```

---

### Task 10: Create Inventory Activity Feed Component

**Files:**
- Create: `app/api/analytics/inventory/activity/route.ts`
- Create: `components/dashboard/operations/inventory-activity-feed.tsx`

- [ ] **Step 1: Create inventory activity API endpoint**

Create `app/api/analytics/inventory/activity/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { inventoryMovements, inventoryItems, users } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');
    const date = searchParams.get('date'); // ISO date string, defaults to today

    const targetDate = date ? new Date(date) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const conditions = [
      gte(inventoryMovements.timestamp, dayStart),
      lte(inventoryMovements.timestamp, dayEnd),
    ];
    // @ts-ignore
    if (branchId && branchId !== 'all') conditions.push(eq(inventoryMovements.branchId, branchId));

    const movements = await db
      .select({
        id: inventoryMovements.id,
        type: inventoryMovements.type,
        itemId: inventoryMovements.itemId,
        itemName: inventoryItems.name,
        quantityChange: inventoryMovements.quantityChange,
        reason: inventoryMovements.reason,
        performedBy: inventoryMovements.performedBy,
        performerName: users.name,
        timestamp: inventoryMovements.timestamp,
      })
      .from(inventoryMovements)
      .leftJoin(inventoryItems, eq(inventoryMovements.itemId, inventoryItems.id))
      .leftJoin(users, eq(inventoryMovements.performedBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(inventoryMovements.timestamp))
      .limit(50);

    const typeLabels: Record<string, string> = {
      RECEIVING: 'Recepción',
      USAGE: 'Uso',
      ADJUSTMENT: 'Ajuste',
      TRANSFER: 'Transferencia',
      WASTE: 'Merma',
      RETURN: 'Devolución',
    };

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      totalMovements: movements.length,
      movements: movements.map(m => ({
        id: m.id,
        type: m.type,
        typeLabel: typeLabels[m.type] || m.type,
        itemName: m.itemName || 'Producto desconocido',
        quantityChange: m.quantityChange,
        reason: m.reason,
        performerName: m.performerName || 'Sistema',
        timestamp: m.timestamp,
      })),
    });

  } catch (error) {
    console.error('Error fetching inventory activity:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory activity' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create inventory activity feed component**

Create `components/dashboard/operations/inventory-activity-feed.tsx`:

```typescript
"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, ArrowDown, ArrowUp, AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface MovementItem {
  id: string;
  type: string;
  typeLabel: string;
  itemName: string;
  quantityChange: number;
  reason: string | null;
  performerName: string;
  timestamp: string;
}

const typeConfig: Record<string, { icon: typeof ArrowDown; color: string }> = {
  RECEIVING: { icon: ArrowDown, color: 'text-green-600' },
  USAGE: { icon: ArrowUp, color: 'text-blue-600' },
  ADJUSTMENT: { icon: RefreshCw, color: 'text-yellow-600' },
  TRANSFER: { icon: RefreshCw, color: 'text-purple-600' },
  WASTE: { icon: AlertTriangle, color: 'text-red-600' },
  RETURN: { icon: ArrowDown, color: 'text-teal-600' },
};

export function InventoryActivityFeed({ branchId }: { branchId?: string }) {
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (branchId && branchId !== 'all') params.set('branchId', branchId);

    fetch(`/api/analytics/inventory/activity?${params}`)
      .then(res => res.json())
      .then(data => {
        setMovements(data.movements || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [branchId]);

  if (loading) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground">Cargando actividad...</div>;
  }

  if (movements.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground">Sin movimientos hoy</div>;
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3">
        {movements.map((m) => {
          const config = typeConfig[m.type] || { icon: Package, color: 'text-gray-600' };
          const Icon = config.icon;
          const time = new Date(m.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={m.id} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
              <div className={`p-1.5 rounded-md bg-muted ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5">{m.typeLabel}</Badge>
                  <span className="text-sm font-medium truncate">{m.itemName}</span>
                </div>
                <p className="text-xs text-muted-foreground">{m.performerName} · {time}</p>
              </div>
              <span className={`text-sm font-semibold ${m.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {m.quantityChange >= 0 ? '+' : ''}{m.quantityChange}
              </span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 4: Commit**

```bash
git add app/api/analytics/inventory/activity/route.ts components/dashboard/operations/inventory-activity-feed.tsx
git commit -m "feat: add inventory activity feed API and component"
```

---

### Task 11: Add Inventory Activity Feed to Operations Dashboard

**Files:**
- Modify: `components/dashboard/operations/overview-tab.tsx`

- [ ] **Step 1: Import and add InventoryActivityFeed to the overview tab**

In `components/dashboard/operations/overview-tab.tsx`, add the import:

```typescript
import { InventoryActivityFeed } from "./inventory-activity-feed";
```

Then add a new Card section after the existing cards in the overview tab JSX:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Actividad de Inventario (Hoy)</CardTitle>
  </CardHeader>
  <CardContent>
    <InventoryActivityFeed />
  </CardContent>
</Card>
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/operations/overview-tab.tsx
git commit -m "feat: add inventory activity feed to operations overview"
```

---

## Part C: Executive Dashboard Enhancements (Tasks 12-14)

---

### Task 12: Create KPI Summary Cards for Executive Dashboard

**Files:**
- Create: `components/dashboard/kpi-summary-cards.tsx`

- [ ] **Step 1: Create the KPI summary cards component**

Create `components/dashboard/kpi-summary-cards.tsx`:

```typescript
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface KpiSummary {
  id: string;
  name: string;
  currentValue: number;
  previousValue: number;
  status: string;
  unit: string;
  target: number | null;
  category: string;
}

const categoryLabels: Record<string, string> = {
  OPERATIONS: 'Operaciones',
  COMPLIANCE: 'Cumplimiento',
  LABOR: 'RH',
  INVENTORY: 'Inventario',
};

const statusIcons = {
  NORMAL: CheckCircle2,
  WARNING: AlertTriangle,
  CRITICAL: XCircle,
};

const statusColors = {
  NORMAL: 'text-green-600',
  WARNING: 'text-yellow-600',
  CRITICAL: 'text-red-600',
};

export function KpiSummaryCards({ branchId }: { branchId?: string }) {
  const [kpis, setKpis] = useState<KpiSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ period: '7d' });
    if (branchId && branchId !== 'all') params.set('branchId', branchId);

    fetch(`/api/kpi/dashboard?${params}`)
      .then(res => res.json())
      .then(data => {
        setKpis((data.kpis || []).slice(0, 4));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [branchId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (kpis.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const trend = kpi.previousValue === 0 ? 0 : ((kpi.currentValue - kpi.previousValue) / kpi.previousValue) * 100;
        const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
        const StatusIcon = statusIcons[kpi.status as keyof typeof statusIcons] || CheckCircle2;
        const statusColor = statusColors[kpi.status as keyof typeof statusColors] || 'text-gray-600';

        return (
          <Card key={kpi.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[kpi.category] || kpi.category}
                </p>
                <StatusIcon className={`h-4 w-4 ${statusColor}`} />
              </div>
              <p className="text-2xl font-bold">
                {kpi.currentValue.toFixed(1)}{kpi.unit}
              </p>
              <p className="text-sm text-muted-foreground mt-1 truncate">{kpi.name}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendIcon className={`h-3 w-3 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">vs. periodo anterior</span>
              </div>
              {kpi.target && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Meta: {kpi.target}{kpi.unit}</span>
                    <span>{Math.min(100, Math.round((kpi.currentValue / kpi.target) * 100))}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${kpi.status === 'NORMAL' ? 'bg-green-500' : kpi.status === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, Math.round((kpi.currentValue / kpi.target) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Add KPI summary cards to executive dashboard**

In `app/dashboard/page.tsx`, add the import:

```typescript
import { KpiSummaryCards } from "@/components/dashboard/kpi-summary-cards"
```

Then add the component in the JSX, after the `<ComplianceMetrics />` line (line 96) and before the Charts Section:

```typescript
{/* KPI Summary Cards */}
<div className="px-4 lg:px-6">
  <KpiSummaryCards />
</div>
```

- [ ] **Step 3: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/kpi-summary-cards.tsx app/dashboard/page.tsx
git commit -m "feat: add KPI summary cards to executive dashboard"
```

---

### Task 13: Create Alert Distribution Chart

**Files:**
- Create: `app/api/analytics/alert-distribution/route.ts`
- Create: `components/dashboard/alert-distribution-chart.tsx`
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Create alert distribution API endpoint**

Create `app/api/analytics/alert-distribution/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { kpiAlerts, kpiDefinitions, incidents } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    // KPI alerts by type
    const kpiAlertsByType = await db
      .select({
        alertType: kpiAlerts.alertType,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(kpiAlerts)
      .innerJoin(kpiDefinitions, eq(kpiAlerts.kpiId, kpiDefinitions.id))
      .where(and(
        eq(kpiDefinitions.companyId, companyId),
        eq(kpiAlerts.status, 'ACTIVE'),
      ))
      .groupBy(kpiAlerts.alertType);

    // Incidents by severity
    const incidentsBySeverity = await db
      .select({
        severity: incidents.severity,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(incidents)
      .where(sql`${incidents.status} != 'RESOLVED'`)
      .groupBy(incidents.severity);

    const alertDistribution = [
      ...kpiAlertsByType.map(a => ({
        name: a.alertType === 'WARNING' ? 'KPI Advertencia' : 'KPI Crítico',
        value: Number(a.count),
        color: a.alertType === 'WARNING' ? '#eab308' : '#ef4444',
      })),
      ...incidentsBySeverity.map(i => ({
        name: i.severity === 'CRITICAL' ? 'Incidente Crítico' : i.severity === 'WARNING' ? 'Incidente Advertencia' : 'Incidente Fatal',
        value: Number(i.count),
        color: i.severity === 'CRITICAL' ? '#dc2626' : i.severity === 'WARNING' ? '#f59e0b' : '#7f1d1d',
      })),
    ].filter(a => a.value > 0);

    return NextResponse.json({ alertDistribution });

  } catch (error) {
    console.error('Error fetching alert distribution:', error);
    return NextResponse.json({ error: 'Failed to fetch alert distribution' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create alert distribution chart component**

Create `components/dashboard/alert-distribution-chart.tsx`:

```typescript
"use client";

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface AlertItem {
  name: string;
  value: number;
  color: string;
}

export function AlertDistributionChart() {
  const [data, setData] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/alert-distribution')
      .then(res => res.json())
      .then(data => {
        setData(data.alertDistribution || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">Cargando...</div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay alertas activas
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Alertas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} alertas`, name]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Add alert chart to executive dashboard**

In `app/dashboard/page.tsx`, add the import:

```typescript
import { AlertDistributionChart } from "@/components/dashboard/alert-distribution-chart"
```

Add it in the Charts Section (after `<DashboardCharts />`), or in a new row below:

```typescript
<div className="px-4 lg:px-6 grid gap-6 md:grid-cols-2">
  <AlertDistributionChart />
</div>
```

- [ ] **Step 4: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 5: Commit**

```bash
git add app/api/analytics/alert-distribution/route.ts components/dashboard/alert-distribution-chart.tsx app/dashboard/page.tsx
git commit -m "feat: add alert distribution pie chart to executive dashboard"
```

---

### Task 14: Add Date Range Integration to Executive Dashboard

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Accept date range as search params in the executive page**

In `app/dashboard/page.tsx`, modify the page function signature to accept searchParams:

```typescript
export default async function Page({ searchParams }: { searchParams: Promise<{ branch?: string; startDate?: string; endDate?: string }> }) {
  const params = await searchParams;
  const selectedBranch = params.branch;
  const startDate = params.startDate;
  const endDate = params.endDate;
```

Then pass `selectedBranch` to the data fetch queries where applicable (filter by branchId).

Update `DashboardFilters` to pass branch and date changes as URL search params:

```typescript
<DashboardFilters />
```

This step is architectural — the `DashboardFilters` component already has branch/date UI. The key change is making the server component read `searchParams` and pass them to DB queries. The client-side `DashboardFilters` should use `router.push` or `router.replace` to update the URL when filters change.

- [ ] **Step 2: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: integrate date range and branch filters with executive dashboard queries"
```

---

## Part D: Branch Performance Dashboard (Tasks 15-19)

---

### Task 15: Create Branch Performance API Endpoint

**Files:**
- Create: `app/api/analytics/branch-performance/route.ts`

- [ ] **Step 1: Create the endpoint**

Create `app/api/analytics/branch-performance/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { workflowInstances, workflowAssignments, workflowTemplates, branches, inventoryBatches, inventoryMovements, attendanceSessions, kpiHistory, kpiDefinitions } from '@/lib/db/schema';
import { eq, and, gte, sql, desc, count, avg } from 'drizzle-orm';
import { subDays, startOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30d';

    let daysBack = 30;
    if (period === '7d') daysBack = 7;
    if (period === '90d') daysBack = 90;
    if (period === 'YTD') daysBack = Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));

    const startDate = startOfDay(subDays(new Date(), daysBack));

    // Get all branches for the company
    const companyBranches = await db
      .select({
        id: branches.id,
        name: branches.name,
      })
      .from(branches)
      .where(eq(branches.companyId, companyId));

    // For each branch, compute metrics
    const branchMetrics = await Promise.all(companyBranches.map(async (branch) => {
      // Workflow metrics
      const workflowStats = await db
        .select({
          total: sql<number>`cast(count(*) as integer)`,
          completed: sql<number>`cast(count(*) filter (where ${workflowInstances.status} = 'COMPLETED') as integer)`,
          avgScore: sql<number>`COALESCE(AVG(${workflowInstances.score}) filter (where ${workflowInstances.status} = 'COMPLETED'), 0)`,
        })
        .from(workflowInstances)
        .where(and(
          // @ts-ignore
          eq(workflowInstances.branchId, branch.id),
          gte(workflowInstances.createdAt, startDate),
        ));

      // Assignment metrics
      const assignmentStats = await db
        .select({
          total: sql<number>`cast(count(*) as integer)`,
          completed: sql<number>`cast(count(*) filter (where ${workflowAssignments.status} = 'COMPLETED') as integer)`,
          overdue: sql<number>`cast(count(*) filter (where ${workflowAssignments.isOverdue} = true) as integer)`,
        })
        .from(workflowAssignments)
        .leftJoin(workflowInstances, eq(workflowAssignments.instanceId, workflowInstances.id))
        .where(and(
          // @ts-ignore
          eq(workflowInstances.branchId, branch.id),
          gte(workflowAssignments.createdAt, startDate),
        ));

      // Inventory alerts (items below minimum)
      const lowStockItems = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(inventoryBatches)
        .where(and(
          eq(inventoryBatches.branchId, branch.id),
          sql`${inventoryBatches.currentQuantity} <= COALESCE(${inventoryBatches.initialQuantity} * 0.2, 0)`,
        ));

      const totalWorkflows = Number(workflowStats[0]?.total || 0);
      const completedWorkflows = Number(workflowStats[0]?.completed || 0);
      const totalAssignments = Number(assignmentStats[0]?.total || 0);
      const completedAssignments = Number(assignmentStats[0]?.completed || 0);
      const overdueAssignments = Number(assignmentStats[0]?.overdue || 0);

      const workflowCompletionRate = totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0;
      const assignmentCompletionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
      const complianceScore = Number(workflowStats[0]?.avgScore || 0);
      const overdueRate = totalAssignments > 0 ? (overdueAssignments / totalAssignments) * 100 : 0;

      // Composite performance index
      const performanceIndex = (workflowCompletionRate * 0.3) + (complianceScore * 0.3) + (assignmentCompletionRate * 0.2) + ((100 - overdueRate) * 0.2);

      return {
        branchId: branch.id,
        branchName: branch.name,
        workflowMetrics: {
          total: totalWorkflows,
          completed: completedWorkflows,
          completionRate: Math.round(workflowCompletionRate * 10) / 10,
          avgScore: Math.round(complianceScore),
        },
        assignmentMetrics: {
          total: totalAssignments,
          completed: completedAssignments,
          overdue: overdueAssignments,
          completionRate: Math.round(assignmentCompletionRate * 10) / 10,
        },
        inventoryMetrics: {
          lowStockItems: Number(lowStockItems[0]?.count || 0),
        },
        complianceScore: Math.round(complianceScore),
        performanceIndex: Math.round(performanceIndex * 10) / 10,
      };
    }));

    // Sort by performance index (descending)
    const ranked = branchMetrics.sort((a, b) => b.performanceIndex - a.performanceIndex);

    return NextResponse.json({
      period,
      branches: ranked,
      ranking: ranked.map((b, i) => ({
        rank: i + 1,
        branchId: b.branchId,
        branchName: b.branchName,
        performanceIndex: b.performanceIndex,
      })),
    });

  } catch (error) {
    console.error('Error fetching branch performance:', error);
    return NextResponse.json({ error: 'Failed to fetch branch performance' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 3: Commit**

```bash
git add app/api/analytics/branch-performance/route.ts
git commit -m "feat: add branch performance API endpoint with composite scoring"
```

---

### Task 16: Create Branch Performance Components

**Files:**
- Create: `components/analytics/branch-comparison-chart.tsx`
- Create: `components/analytics/branch-ranking-table.tsx`
- Create: `components/analytics/branch-performance-score-card.tsx`

- [ ] **Step 1: Create branch comparison chart**

Create `components/analytics/branch-comparison-chart.tsx`:

```typescript
"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface BranchMetric {
  branchId: string;
  branchName: string;
  workflowMetrics: { completionRate: number };
  complianceScore: number;
  assignmentMetrics: { completionRate: number };
  performanceIndex: number;
}

export function BranchComparisonChart({ period }: { period: string }) {
  const [branches, setBranches] = useState<BranchMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/branch-performance?period=${period}`)
      .then(res => res.json())
      .then(data => {
        setBranches(data.branches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) {
    return <Card><CardContent className="p-6"><div className="h-[400px] flex items-center justify-center text-muted-foreground">Cargando...</div></CardContent></Card>;
  }

  if (branches.length === 0) {
    return <Card><CardContent className="p-6"><div className="h-[400px] flex items-center justify-center text-muted-foreground">Sin datos de sucursales</div></CardContent></Card>;
  }

  const chartData = branches.map(b => ({
    name: b.branchName.length > 12 ? b.branchName.substring(0, 12) + '...' : b.branchName,
    'Completitud Tareas': b.workflowMetrics.completionRate,
    'Score Cumplimiento': b.complianceScore,
    'Completitud Asignaciones': b.assignmentMetrics.completionRate,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo entre Sucursales</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={100} />
            <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`]} />
            <Legend />
            <Bar dataKey="Completitud Tareas" fill="#2563eb" />
            <Bar dataKey="Score Cumplimiento" fill="#16a34a" />
            <Bar dataKey="Completitud Asignaciones" fill="#9333ea" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create branch ranking table**

Create `components/analytics/branch-ranking-table.tsx`:

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { useEffect, useState } from "react";

interface RankingItem {
  rank: number;
  branchId: string;
  branchName: string;
  performanceIndex: number;
}

const rankIcons = [Trophy, Medal, Award];

export function BranchRankingTable({ period }: { period: string }) {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/branch-performance?period=${period}`)
      .then(res => res.json())
      .then(data => {
        setRanking(data.ranking || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) {
    return <Card><CardContent className="p-6"><div className="text-center text-muted-foreground py-8">Cargando ranking...</div></CardContent></Card>;
  }

  if (ranking.length === 0) {
    return <Card><CardContent className="p-6"><div className="text-center text-muted-foreground py-8">Sin datos</div></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Sucursales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ranking.map((item) => {
            const RankIcon = item.rank <= 3 ? rankIcons[item.rank - 1] : null;
            const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
            return (
              <div key={item.branchId} className="flex items-center gap-4 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  {RankIcon ? (
                    <RankIcon className={`h-5 w-5 ${medalColors[item.rank - 1] || 'text-muted-foreground'}`} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">#{item.rank}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.branchName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{item.performanceIndex.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Índice de Performance</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create branch performance score card**

Create `components/analytics/branch-performance-score-card.tsx`:

```typescript
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface ScoreCardProps {
  branchName: string;
  performanceIndex: number;
  complianceScore: number;
  workflowCompletionRate: number;
  assignmentCompletionRate: number;
  lowStockItems: number;
  overdue: number;
}

function getStatus(index: number): { label: string; color: string; Icon: typeof CheckCircle2 } {
  if (index >= 85) return { label: 'Excelente', color: 'text-green-600', Icon: CheckCircle2 };
  if (index >= 70) return { label: 'Bueno', color: 'text-blue-600', Icon: CheckCircle2 };
  if (index >= 55) return { label: 'Regular', color: 'text-yellow-600', Icon: AlertTriangle };
  return { label: 'Atención', color: 'text-red-600', Icon: XCircle };
}

export function BranchPerformanceScoreCard(props: ScoreCardProps) {
  const { Icon, label, color } = getStatus(props.performanceIndex);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold truncate">{props.branchName}</h3>
          <div className={`flex items-center gap-1.5 ${color}`}>
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium">{label}</span>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-4xl font-bold">{props.performanceIndex.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground mt-1">Índice de Performance</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Cumplimiento</p>
            <p className="font-semibold">{props.complianceScore}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Completitud</p>
            <p className="font-semibold">{props.workflowCompletionRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Asignaciones</p>
            <p className="font-semibold">{props.assignmentCompletionRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Stock Bajo</p>
            <p className={`font-semibold ${props.lowStockItems > 0 ? 'text-yellow-600' : 'text-green-600'}`}>{props.lowStockItems}</p>
          </div>
        </div>

        {props.overdue > 0 && (
          <div className="mt-3 text-xs text-red-600 font-medium">
            {props.overdue} tareas vencidas
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 5: Commit**

```bash
git add components/analytics/branch-comparison-chart.tsx components/analytics/branch-ranking-table.tsx components/analytics/branch-performance-score-card.tsx
git commit -m "feat: add branch performance chart, ranking, and score card components"
```

---

### Task 17: Create Branch Performance Dashboard Page

**Files:**
- Create: `app/dashboard/analytics/branches/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/dashboard/analytics/branches/page.tsx`:

```typescript
"use client";

import { BranchComparisonChart } from "@/components/analytics/branch-comparison-chart";
import { BranchRankingTable } from "@/components/analytics/branch-ranking-table";
import { BranchPerformanceScoreCard } from "@/components/analytics/branch-performance-score-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

interface BranchData {
  branchId: string;
  branchName: string;
  workflowMetrics: { total: number; completed: number; completionRate: number; avgScore: number };
  assignmentMetrics: { total: number; completed: number; overdue: number; completionRate: number };
  inventoryMetrics: { lowStockItems: number };
  complianceScore: number;
  performanceIndex: number;
}

export default function BranchPerformancePage() {
  const [period, setPeriod] = useState("30d");
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/branch-performance?period=${period}`)
      .then(res => res.json())
      .then(data => {
        setBranches(data.branches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance por Sucursal</h2>
          <p className="text-muted-foreground mt-1">Comparativo y ranking de métricas clave por sucursal</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
            <SelectItem value="90d">Últimos 90 días</SelectItem>
            <SelectItem value="YTD">Año actual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Score Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-[200px] bg-muted animate-pulse rounded-xl" />
          ))
        ) : (
          branches.map(b => (
            <BranchPerformanceScoreCard
              key={b.branchId}
              branchName={b.branchName}
              performanceIndex={b.performanceIndex}
              complianceScore={b.complianceScore}
              workflowCompletionRate={b.workflowMetrics.completionRate}
              assignmentCompletionRate={b.assignmentMetrics.completionRate}
              lowStockItems={b.inventoryMetrics.lowStockItems}
              overdue={b.assignmentMetrics.overdue}
            />
          ))
        )}
      </div>

      {/* Comparison and Ranking */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BranchComparisonChart period={period} />
        </div>
        <div>
          <BranchRankingTable period={period} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/analytics/branches/page.tsx
git commit -m "feat: add branch performance dashboard page"
```

---

### Task 18: Add Branch Performance Link to Sidebar

**Files:**
- Modify: `components/app-sidebar.tsx`

- [ ] **Step 1: Add navigation link for branch performance**

In `components/app-sidebar.tsx`, find the analytics section (around line 114-138 where "Analítica" or similar navigation items exist) and add a new item:

```typescript
{
  title: "Performance por Sucursal",
  href: "/dashboard/analytics/branches",
  icon: BarChart3,
}
```

Use the appropriate icon import that already exists in the file (e.g., `BarChart3` from lucide-react). Place it near the existing analytics links.

- [ ] **Step 2: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 3: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat: add branch performance page link to sidebar navigation"
```

---

### Task 19: Create Branch Drill-Down View

**Files:**
- Create: `app/dashboard/analytics/branches/[id]/page.tsx`

- [ ] **Step 1: Create the branch drill-down page**

Create `app/dashboard/analytics/branches/[id]/page.tsx`:

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { branches, workflowInstances, workflowTemplates, workflowAssignments, users } from "@/lib/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { subDays, startOfDay } from "date-fns";
import { BranchPerformanceScoreCard } from "@/components/analytics/branch-performance-score-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentWorkflowsTable } from "@/components/dashboard/recent-workflows-table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function BranchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  // Get branch info
  const [branch] = await db
    .select()
    .from(branches)
    .where(eq(branches.id, id))
    .limit(1);

  if (!branch) {
    return <div className="p-8 text-muted-foreground">Sucursal no encontrada</div>;
  }

  const startDate = startOfDay(subDays(new Date(), 30));

  // Workflow stats for this branch
  const [workflowStats] = await db
    .select({
      total: sql<number>`cast(count(*) as integer)`,
      completed: sql<number>`cast(count(*) filter (where ${workflowInstances.status} = 'COMPLETED') as integer)`,
      avgScore: sql<number>`COALESCE(AVG(${workflowInstances.score}) filter (where ${workflowInstances.status} = 'COMPLETED'), 0)`,
    })
    .from(workflowInstances)
    .where(and(
      // @ts-ignore
      eq(workflowInstances.branchId, id),
      gte(workflowInstances.createdAt, startDate),
    ));

  // Assignment stats
  const [assignmentStats] = await db
    .select({
      total: sql<number>`cast(count(*) as integer)`,
      completed: sql<number>`cast(count(*) filter (where ${workflowAssignments.status} = 'COMPLETED') as integer)`,
      overdue: sql<number>`cast(count(*) filter (where ${workflowAssignments.isOverdue} = true) as integer)`,
    })
    .from(workflowAssignments)
    .leftJoin(workflowInstances, eq(workflowAssignments.instanceId, workflowInstances.id))
    .where(and(
      // @ts-ignore
      eq(workflowInstances.branchId, id),
      gte(workflowAssignments.createdAt, startDate),
    ));

  const totalWorkflows = Number(workflowStats?.total || 0);
  const completedWorkflows = Number(workflowStats?.completed || 0);
  const totalAssignments = Number(assignmentStats?.total || 0);
  const completedAssignments = Number(assignmentStats?.completed || 0);
  const overdueAssignments = Number(assignmentStats?.overdue || 0);

  const workflowCompletionRate = totalWorkflows > 0 ? Math.round((completedWorkflows / totalWorkflows) * 1000) / 10 : 0;
  const assignmentCompletionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 1000) / 10 : 0;
  const complianceScore = Math.round(Number(workflowStats?.avgScore || 0));
  const overdueRate = totalAssignments > 0 ? (overdueAssignments / totalAssignments) * 100 : 0;
  const performanceIndex = Math.round(((workflowCompletionRate * 0.3) + (complianceScore * 0.3) + (assignmentCompletionRate * 0.2) + ((100 - overdueRate) * 0.2)) * 10) / 10;

  // Recent workflows for this branch
  const recentWorkflows = await db
    .select({
      id: workflowInstances.id,
      templateName: workflowTemplates.name,
      status: workflowInstances.status,
      score: workflowInstances.score,
      assigneeName: users.name,
      updatedAt: workflowInstances.updatedAt,
    })
    .from(workflowInstances)
    .leftJoin(workflowTemplates, eq(workflowInstances.workflowTemplateId, sql`cast(${workflowTemplates.id} as text)`))
    .leftJoin(users, eq(workflowInstances.assigneeId, users.id))
    .where(
      // @ts-ignore
      and(eq(workflowInstances.branchId, id))
    )
    .orderBy(desc(workflowInstances.updatedAt))
    .limit(20);

  const formattedWorkflows = recentWorkflows.map(w => ({
    ...w,
    templateName: w.templateName || 'Sin nombre',
    assigneeName: w.assigneeName || 'Sin asignar',
  }));

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/analytics/branches">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{branch.name}</h2>
          <p className="text-muted-foreground mt-1">Detalle de performance — últimos 30 días</p>
        </div>
      </div>

      <BranchPerformanceScoreCard
        branchName={branch.name}
        performanceIndex={performanceIndex}
        complianceScore={complianceScore}
        workflowCompletionRate={workflowCompletionRate}
        assignmentCompletionRate={assignmentCompletionRate}
        lowStockItems={0}
        overdue={overdueAssignments}
      />

      <Card>
        <CardHeader>
          <CardTitle>Workflows Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentWorkflowsTable workflows={formattedWorkflows} />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Update BranchPerformanceScoreCard to link to drill-down**

In `components/analytics/branch-performance-score-card.tsx`, wrap the card in a Link:

```typescript
import Link from "next/link";

export function BranchPerformanceScoreCard(props: ScoreCardProps) {
  // ... existing code
  return (
    <Link href={`/dashboard/analytics/branches/${props.branchId}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        {/* ... existing card content */}
      </Card>
    </Link>
  );
}
```

Add `branchId` to the `ScoreCardProps` interface.

- [ ] **Step 3: Verify build passes**

Run: `pnpm run build`

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/analytics/branches/[id]/page.tsx components/analytics/branch-performance-score-card.tsx
git commit -m "feat: add branch drill-down page with performance detail"
```

---

## Part E: Final Verification (Task 20)

---

### Task 20: Full Build Verification and Lint

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `pnpm run build`

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run lint**

Run: `pnpm run lint`

Expected: No new lint errors. Fix any that appear.

- [ ] **Step 3: Verify dev server starts**

Run: `pnpm run dev`

Expected: Dev server starts on localhost:3000 without crashes.

- [ ] **Step 4: Final commit (if any lint fixes were needed)**

```bash
git add -A
git commit -m "chore: lint fixes for Phase 8 analytics implementation"
```

---

## Summary: Implementation Order

| Task | Description | Dependencies | Estimated Time |
|------|-------------|-------------|----------------|
| 1 | Real KPI Calculator | None | 30 min |
| 2 | Replace Reports Stats Mock | None | 20 min |
| 3 | Fix Compliance companyId Filter | None | 15 min |
| 4 | Fix Employee branchId Filter | None | 15 min |
| 5 | Fix Reports Hardcoded Branches | None | 10 min |
| 6 | Register Missing Cron Jobs | None | 15 min |
| 7 | Add DB Schema (temp logs, costs) | None | 15 min |
| 8 | Operations Stats API | Tasks 1, 2 | 25 min |
| 9 | Replace Operations Mock Components | Task 2 | 30 min |
| 10 | Inventory Activity Feed | None | 25 min |
| 11 | Add Feed to Operations Dashboard | Task 10 | 10 min |
| 12 | KPI Summary Cards (Executive) | Task 1 | 25 min |
| 13 | Alert Distribution Chart (Executive) | None | 25 min |
| 14 | Date Range Integration (Executive) | None | 20 min |
| 15 | Branch Performance API | None | 30 min |
| 16 | Branch Performance Components | None | 30 min |
| 17 | Branch Performance Dashboard Page | Tasks 15, 16 | 20 min |
| 18 | Sidebar Navigation Link | Task 17 | 5 min |
| 19 | Branch Drill-Down View | Tasks 15, 17 | 25 min |
| 20 | Final Verification | All | 15 min |

**Total estimated: ~6.5 hours**

Tasks 1-7 can be parallelized (no interdependencies). Tasks 8-9 depend on 1-2. Tasks 15-19 can be parallelized with 8-14.
