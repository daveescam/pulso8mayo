# Shift Scheduler Completion Design

**Date:** 2026-04-29
**Status:** Approved
**Branch:** master (post-merge feature/refactor-shift-scheduler)

## Context

The shift scheduler feature was merged to master (commit 27a17af) with a composable architecture: 5 hooks, 4 services, 5 UI components, 2 API routes, and full type definitions. However, several critical gaps remain:

- **Mock data** in ShiftSchedulerContainer (branches, employees, roles are hardcoded)
- **5 designed components** don't exist yet (ConflictAlertPanel, BulkAssignmentPanel, ExportActions, ComplianceSummary, ShiftTemplateManager)
- **2 tabs are placeholders** (Plantillas, Asignacion Masiva)
- **4 notification methods** in ShiftApprovalService are TODO stubs (console.log)
- **ShiftCell conflict detection** hardcoded to false
- **Export button** is disabled/non-functional

## Approach: Incremental by Layer

Work layer by layer: real data first (hooks + queries), then new components on top of real data, then connect notifications. This ensures each layer validates before building the next.

---

## Layer 1: Replace Mock Data with Real DB Data

### New Hooks

#### `useBranches`
- TanStack Query hook
- Calls `GET /api/branches` (endpoint already exists)
- Returns `{ branches: Branch[], isLoading, error }`
- File: `hooks/use-branches.ts`

#### `useShiftEmployees`
- TanStack Query hook
- Calls `GET /api/employees` with optional branchId filter
- Returns `{ employees: Employee[], isLoading, error }`
- Derives available roles from employee data
- File: `hooks/use-shift-employees.ts`

#### `useShiftStats`
- Client-side hook (no query — computes from loaded data)
- Takes shifts, employees, branches, conflicts as input
- Returns `{ totalShifts, activeEmployees, branchCount, conflictCount }`
- File: `hooks/use-shift-stats.ts`

### Changes to ShiftSchedulerContainer

- Remove `MOCK_BRANCHES`, `MOCK_ROLES`, `MOCK_EMPLOYEES`, `mockShifts`
- Use `useBranches()`, `useShiftEmployees(branchId)`, `useShiftStats()`
- Pass real data to `WeeklyMatrixView`, `FilterToolbar`, `ShiftEditorDialog`
- Connect Export button with real shift data
- Stats cards show real computed values (replacing `--` and mock counts)

### No new API routes needed for Layer 1 — branches and employees endpoints already exist.

---

## Layer 2: New Components

### 2.1 ConflictAlertPanel

**File:** `components/labor/shifts/ConflictAlertPanel.tsx`

- Displays active LFT violations from `useShiftValidation`
- List of conflicts with: severity (error/warning), type (DAILY_HOURS, WEEKLY_HOURS, REST_PERIOD, OVERTIME, SHIFT_OVERLAP), affected employee
- Click on conflict navigates to the shift in WeeklyMatrixView
- Collapsible panel in ShiftSchedulerContainer header
- Props: `{ conflicts: LFTViolation[], onConflictClick?: (shiftId: string) => void }`

### 2.2 ComplianceSummary

**File:** `components/labor/shifts/ComplianceSummary.tsx`

- Visual summary of LFT compliance for the current week
- 4 stat cards replacing current generic stats:
  - Total Turnos (from shifts count)
  - Empleados Activos (employees with shifts this week)
  - Sucursales (branches with shifts this week)
  - Conflictos LFT (from validation, with color indicator: green/yellow/red)
- Props: `{ stats: ReturnType<typeof useShiftStats> }`

### 2.3 ShiftTemplateManager

**File:** `components/labor/shifts/ShiftTemplateManager.tsx`

- DB-backed CRUD for shift templates
- Table with columns: name, shift type, schedule (start-end), days, branch, status (active/inactive)
- Actions: create, edit, duplicate, toggle active/inactive
- Create/Edit dialog with form fields:
  - Name (text)
  - Shift type (select: MATUTINO, VESPERTINO, NOCTURNO, MIXTO — auto-fills start/end)
  - Custom start/end time (overrides type defaults)
  - Days of week (checkboxes)
  - Branch (optional select — null = all branches)
  - Role (text)
- Calls `GET/POST/PUT/DELETE /api/shifts/templates`
- This is the content of the **"Plantillas" tab**

### 2.4 BulkAssignmentPanel

**File:** `components/labor/shifts/BulkAssignmentPanel.tsx`

- Step-by-step wizard for bulk shift assignment:
  1. Select template (from `useShiftTemplates`, now DB-backed)
  2. Select date range + employees + branch
  3. Preview shifts to be created (with LFT validation warnings)
  4. Confirm and create
- Calls `POST /api/shifts/bulk` for creation (server-side LFT validation)
- Shows per-shift validation results in preview
- This is the content of the **"Asignacion Masiva" tab**

### 2.5 ExportActions

**File:** `components/labor/shifts/ExportActions.tsx`

- Dropdown button with options: CSV, Excel, PDF
- Receives shifts as prop (real data from `useShifts`)
- Uses existing `useShiftExport` hook (client-side CSV/Excel/PDF generation)
- Replaces current disabled Export button in header
- Props: `{ shifts: Shift[], isLoading: boolean }`

### Composition in ShiftSchedulerContainer

```
ShiftSchedulerContainer
├── Header
│   ├── ComplianceSummary ← useShiftStats()
│   ├── ExportActions ← useShifts()
│   └── ConflictAlertPanel ← useShiftValidation() [collapsible]
├── Tabs
│   ├── "Vista Semanal" → WeeklyMatrixView [existing, now with real data]
│   ├── "Plantillas" → ShiftTemplateManager [new]
│   └── "Asignacion Masiva" → BulkAssignmentPanel [new]
```

### Wire ShiftCell.conflict

- Change `ShiftCell` to accept `conflicts: LFTViolation[]` prop
- Parent (WeeklyMatrixView) passes per-cell conflicts from `useShiftValidation`
- Replace `const hasConflict = false` with actual conflict check

---

## Layer 3: API Routes + Service Updates

### 3.1 `/api/shifts/templates` (new)

| Method | Action | Query/Body |
|--------|--------|------------|
| GET | List templates | `?companyId=X&branchId=Y&isActive=true` |
| POST | Create template | `{ name, companyId, branchId?, role, startTime, endTime, daysOfWeek[], isActive }` |
| PUT | Update template | `{ id, ...fields }` |
| DELETE | Soft-delete | `{ id }` → sets `isActive = false` |

Uses `shiftTemplates` DB table. Extends `ShiftTemplateService` with DB methods (following `PlannedShiftServiceImpl` pattern — direct DB access with drizzle).

### 3.2 `/api/shifts/bulk` (new)

| Method | Action | Body |
|--------|--------|------|
| POST | Create bulk shifts | `{ templateId, employeeIds[], startDate, endDate, branchId, pattern }` |

Validates each shift against LFT before creating. Returns `{ created[], failed[] }`.

### 3.3 `/api/shifts/export` (new)

| Method | Action | Query |
|--------|--------|-------|
| GET | Export shifts | `?branchId=X&startDate=Y&endDate=Z&format=csv\|excel` |

Server-side CSV and Excel. PDF remains client-side (print dialog) to avoid heavy server dependencies.

### 3.4 ShiftApprovalService → NotificationService

Replace 4 console.log stubs with real `NotificationService.sendNotification()` calls:

- `notifyManagers(approvalId)` → sends notification to branch managers
- `notifyDecision(approvalId, approved: boolean)` → notifies requester (called from both `approveShift` and `rejectShift`)
- `escalateToHR()` notification → sends to HR contacts

Uses existing `NotificationService` singleton (WhatsApp/Email/In-App already functional from Phase 1). Respects user notification preferences from `notificationPreferences` table.

---

## Data Flow

```
useBranches()        → branches[]
useShiftEmployees()  → employees[]
useShifts(filters)   → shifts[]
useShiftValidation() → conflicts[], warnings[]
useShiftStats()      → stats (computed, no query)
useShiftTemplates()  → templates[] (now DB-backed)

ShiftSchedulerContainer
├── Header
│   ├── ComplianceSummary    ← stats
│   ├── ExportActions         ← shifts
│   └── ConflictAlertPanel   ← conflicts (collapsible)
├── Tabs
│   ├── WeeklyMatrixView     ← shifts, branches, employees, conflicts
│   ├── ShiftTemplateManager ← useShiftTemplates (DB-backed)
│   └── BulkAssignmentPanel  ← useShiftTemplates, useShiftEmployees
```

---

## Error Handling

- **Query failures:** TanStack Query with `retry: 1`, toast error via `onError` callback
- **Mutations:** No optimistic updates (shift data is critical), toast success/error per mutation
- **LFT validation in bulk:** Preview before confirm — violations shown as non-blocking warnings. User can choose to create shifts with violations (marked in DB)
- **Export failures:** Graceful fallback — if server-side export fails, offer client-side CSV download

---

## Loading States

- Skeleton loaders in tables (ShiftTemplateManager, BulkAssignmentPanel)
- Spinner on action buttons (create, export, bulk assign)
- WeeklyMatrixView shows grid with placeholders while shifts load
- Stats cards show `--` while data loads

---

## Legacy Cleanup

Delete 3 `@deprecated` components:
- `components/labor/unified-shift-scheduler.tsx` (1,453 lines)
- `components/labor/weekly-shift-planner.tsx` (833 lines)
- `components/labor/recurring-shift-builder.tsx` (722 lines)

Before deletion: search codebase for active imports referencing these files. If found, redirect imports to `ShiftSchedulerContainer`. Other legacy components (shift-scheduler.tsx, shift-assignment.tsx, etc.) are left untouched — not in scope.

---

## Out of Scope

- PDF server-side generation (remains client-side print dialog)
- Optimistic updates on mutations
- Deleting non-deprecated legacy components
- Template versioning/history
- Shift approval workflow UI (approval service exists, no UI management panel)
