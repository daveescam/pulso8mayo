# Requirements: Schema Modularization

**Defined:** 2026-04-23
**Core Value:** Developers can locate and modify schema definitions quickly without scrolling through a massive file

## v1 Requirements

### Schema Organization

- [ ] **SCH-01**: Create domain-specific modules under `lib/db/schema/`
- [ ] **SCH-02**: Move enums to their respective domain modules
- [ ] **SCH-03**: Move tables to their respective domain modules
- [ ] **SCH-04**: Handle cross-domain references (e.g., users.id referenced by many tables)
- [ ] **SCH-05**: Maintain backward compatibility via barrel exports

### Domain Modules

- [ ] **DOM-01**: Auth module — account, users, sessions, verifications, magicLinks
- [ ] **DOM-02**: Core module — companies, branches, holidays
- [ ] **DOM-03**: Workflows module — templates, instances, steps, schedules, assignments, events, incidents
- [ ] **DOM-04**: Labor module — shifts, sessions, change requests, approvals, break logs/rules/reminders
- [ ] **DOM-05**: Employees module — profiles, contracts, documents, onboarding/offboarding, benefits, training, vacation, performance, leaves
- [ ] **DOM-06**: Inventory module — suppliers, items, batches, movements, transfers, alerts, waste
- [ ] **DOM-07**: Communications module — notifications, preferences, WhatsApp sessions/states/messages, employee comms, templates
- [ ] **DOM-08**: Analytics module — KPIs, reports, saved searches
- [ ] **DOM-09**: Compliance module — psychosocial surveys, compliance alerts

### Verification

- [ ] **VER-01**: All existing imports continue to work
- [ ] **VER-02**: `drizzle-kit generate` produces identical SQL output
- [ ] **VER-03**: TypeScript compilation passes without errors
- [ ] **VER-04**: No runtime behavior changes

## v2 Requirements

Deferred to future — not in current scope.

### Potential Future Work

- Extract shared types/utilities to separate module
- Add schema documentation generation
- Create schema visualization/diagram

## Out of Scope

| Feature | Reason |
|---------|--------|
| Database migrations | No schema changes, only file organization |
| Adding/removing fields | Pure refactor, no functional changes |
| Performance optimizations | Out of scope for this refactor |
| Type reorganization | Keep inferred types where they are unless necessary |
| Index reorganization | Keep existing indexes as-is |
| Relations extraction | Manual relations at end of file can stay |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCH-01 | Phase 1 | Pending |
| SCH-02 | Phase 1 | Pending |
| SCH-03 | Phase 1 | Pending |
| SCH-04 | Phase 1 | Pending |
| SCH-05 | Phase 1 | Pending |
| DOM-01 | Phase 1 | Pending |
| DOM-02 | Phase 1 | Pending |
| DOM-03 | Phase 2 | Pending |
| DOM-04 | Phase 2 | Pending |
| DOM-05 | Phase 2 | Pending |
| DOM-06 | Phase 3 | Pending |
| DOM-07 | Phase 3 | Pending |
| DOM-08 | Phase 3 | Pending |
| DOM-09 | Phase 3 | Pending |
| VER-01 | Phase 4 | Pending |
| VER-02 | Phase 4 | Pending |
| VER-03 | Phase 4 | Pending |
| VER-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-23*
*Last updated: 2026-04-23 after initial definition*
