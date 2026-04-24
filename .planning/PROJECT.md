# Schema Modularization

## What This Is

Refactor Pulso's monolithic database schema file (`lib/db/schema.ts` - 1,977 lines, 60+ tables) into domain-specific modules. This improves code maintainability, reduces merge conflicts, and makes the schema easier to navigate and understand.

## Core Value

Developers can locate and modify schema definitions quickly without scrolling through a massive file, and schema changes in one domain don't create unnecessary merge conflicts with unrelated domains.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **SCH-01**: Split `lib/db/schema.ts` into domain-specific modules
- [ ] **SCH-02**: Maintain backward compatibility — existing imports must continue to work
- [ ] **SCH-03**: Preserve all table definitions, enums, relations, and indexes exactly as they are
- [ ] **SCH-04**: Update `lib/db/index.ts` to export from new modular structure
- [ ] **SCH-05**: Verify drizzle-kit generate produces identical output

### Out of Scope

- **Schema migrations** — No actual database migrations, only file reorganization
- **Schema changes** — No adding/removing fields or tables
- **Performance optimizations** — Out of scope for this refactor
- **Type reorganization** — Keep inferred types where they are unless necessary

## Context

**Current State:**
- Single file: `lib/db/schema.ts` (1,977 lines)
- 60+ tables spanning: auth, users, companies, workflows, inventory, labor, employees, notifications
- Currently imported via `import * as schema from "./schema"` in `lib/db/index.ts`

**Domain Groupings Identified:**
1. **Auth** — account, users, sessions, verifications, magicLinks
2. **Core** — companies, branches, holidays
3. **Workflows** — workflowTemplates, workflowInstances, workflowInstanceSteps, workflowSchedules, workflowAssignments, eventTriggers, incidents
4. **Labor/Scheduling** — shiftTemplates, plannedShifts, shiftSessions, shiftChangeRequests, shiftApprovals, breakLogs, breakComplianceRules, breakReminderLogs
5. **Employees** — employeeDocuments, employeeProfiles, employeeContracts, salaryHistory, employeeAuditLogs, employeeOnboarding, onboardingSteps, employeeOffboarding, employeeBenefits, employeeTraining, vacationRequests, vacationAccruals, performanceReviews, performanceReviewCriteria, performanceReviewResponses, performanceGoals, leaveTypes, leaveRequests, leaveBalances
6. **Inventory** — suppliers, inventoryItems, inventoryPriceHistory, inventoryBatches, inventoryMovements, inventoryTransfers, inventoryTransferItems, inventoryAlerts, inventoryWaste
7. **Notifications/Comms** — notifications, notificationPreferences, whatsappSessions, whatsappConversationStates, whatsappMessages, employeeCommunications, communicationReadReceipts, messageTemplates
8. **Analytics** — kpiDefinitions, kpiHistory, kpiAlerts, savedSearches, reportTemplates, reportExecutionHistory
9. **Compliance** — psychosocialSurveys, complianceAlerts

## Constraints

- **Tech Stack**: Drizzle ORM with Neon Postgres
- **Compatibility**: All existing imports must continue to work via `lib/db/schema`
- **Safety**: Zero changes to actual table structures
- **Timeline**: Single focused refactor, not drawn out

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep enums co-located with their primary domain | Easier to find, natural grouping | — Pending |
| Use barrel export pattern in `schema/index.ts` | Maintains backward compatibility | — Pending |
| Domain boundaries based on feature areas | Matches mental model of the system | — Pending |

---
*Last updated: 2026-04-23 after initialization*
