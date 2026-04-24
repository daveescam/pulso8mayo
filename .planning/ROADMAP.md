# Roadmap: Schema Modularization

**Project:** Schema Modularization
**Created:** 2026-04-23
**Granularity:** Standard

## Overview

Refactor the monolithic `lib/db/schema.ts` (1,977 lines, 60+ tables) into domain-specific modules for improved maintainability and reduced merge conflicts.

| Phase | Name | Goal | Requirements | Est. Plans |
|-------|------|------|--------------|------------|
| 1 | Core & Auth Foundation | Split auth and core tables | SCH-01 to SCH-05, DOM-01, DOM-02 | 2-3 |
| 2 | Business Logic Domains | Split workflows, labor, and employee tables | DOM-03, DOM-04, DOM-05 | 4-5 |
| 3 | Supporting Domains | Split inventory, communications, analytics, compliance | DOM-06, DOM-07, DOM-08, DOM-09 | 3-4 |
| 4 | Verification & Cleanup | Verify backward compatibility and clean up | VER-01 to VER-04 | 1-2 |

---

## Phase 1: Core & Auth Foundation

**Status:** ○ Ready to execute (2 plans)

**Goal:** Create the module structure and migrate the foundational tables (auth and core) that other domains depend on.

**Requirements:** SCH-01, SCH-02, SCH-03, SCH-04, SCH-05, DOM-01, DOM-02

**Plans:** 2 plans

- [ ] 01-01-PLAN.md — Create modular schema structure and auth module
- [ ] 01-02-PLAN.md — Extract core tables and handle cross-domain references

### Success Criteria

1. Directory structure `lib/db/schema/` created with domain folders
2. Barrel export pattern established in `lib/db/schema/index.ts`
3. Auth module exports: account, users, sessions, verifications, magicLinks + all auth enums
4. Core module exports: companies, branches, holidays + all core enums
5. All cross-domain references handled (users.id, companies.id, branches.id)
6. Original `lib/db/schema.ts` updated to re-export from modules (or deprecated)

### Canonical References

- `.planning/codebase/ARCHITECTURE.md` — Architecture patterns
- `lib/db/index.ts` — Current database entry point
- `lib/db/schema.ts` — Current monolithic schema

---

## Phase 2: Business Logic Domains

**Goal:** Split the core business logic tables into their respective domains.

**Requirements:** DOM-03, DOM-04, DOM-05

### Success Criteria

1. **Workflows module** created:
   - Tables: workflowTemplates, workflowInstances, workflowInstanceSteps, workflowSchedules, workflowAssignments, eventTriggers, incidents
   - Enums: scheduleFrequency, assignmentType, assignmentStatus, priority, notificationType

2. **Labor module** created:
   - Tables: shiftTemplates, plannedShifts, shiftSessions, shiftChangeRequests, shiftApprovals, breakLogs, breakComplianceRules, breakReminderLogs
   - Enums: shiftType, dayOfWeek, shiftChangeRequestStatus, shiftApprovalType, shiftApprovalStatus

3. **Employees module** created:
   - Tables: employeeDocuments, employeeProfiles, employeeContracts, salaryHistory, employeeAuditLogs, employeeOnboarding, onboardingSteps, employeeOffboarding, employeeBenefits, employeeTraining, vacationRequests, vacationAccruals, performanceReviews, performanceReviewCriteria, performanceReviewResponses, performanceGoals, leaveTypes, leaveRequests, leaveBalances
   - All employee-related enums

### Dependencies

- Phase 1 must be complete (core tables needed for foreign keys)

---

## Phase 3: Supporting Domains

**Goal:** Split remaining supporting domains.

**Requirements:** DOM-06, DOM-07, DOM-08, DOM-09

### Success Criteria

1. **Inventory module** created:
   - Tables: suppliers, inventoryItems, inventoryPriceHistory, inventoryBatches, inventoryMovements, inventoryTransfers, inventoryTransferItems, inventoryAlerts, inventoryWaste
   - All inventory enums

2. **Communications module** created:
   - Tables: notifications, notificationPreferences, whatsappSessions, whatsappConversationStates, whatsappMessages, employeeCommunications, communicationReadReceipts, messageTemplates
   - All communications enums

3. **Analytics module** created:
   - Tables: kpiDefinitions, kpiHistory, kpiAlerts, savedSearches, reportTemplates, reportExecutionHistory
   - All analytics enums

4. **Compliance module** created:
   - Tables: psychosocialSurveys, complianceAlerts
   - All compliance enums

### Dependencies

- Phase 1 must be complete

---

## Phase 4: Verification & Cleanup

**Goal:** Verify everything works and finalize the refactor.

**Requirements:** VER-01, VER-02, VER-03, VER-04

### Success Criteria

1. All existing imports from `lib/db/schema` continue to work
2. `drizzle-kit generate` produces identical SQL output (compare before/after)
3. TypeScript compilation passes (`tsc --noEmit`)
4. Test suite passes (if applicable)
5. Original `lib/db/schema.ts` can be removed or kept as deprecated re-export
6. `lib/db/index.ts` updated if needed

### Verification Steps

1. Run `grep -r "from.*lib/db/schema" --include="*.ts" | head -20` to verify import patterns
2. Run `drizzle-kit generate` and diff against previous output
3. Run `tsc --noEmit` to verify types
4. Run any existing database tests

---

## Execution Notes

**Order matters:** Auth/Core → Business Logic → Supporting → Verification

**Risk mitigation:** 
- Keep original schema.ts as backup until verification complete
- Each phase is independently committable
- No actual database migrations needed (pure file reorganization)

**Completion criteria:**
- All 60+ tables organized into 9 domain modules
- All existing imports work
- Zero functional changes to application

---
*Last updated: 2026-04-23 after roadmap creation*
