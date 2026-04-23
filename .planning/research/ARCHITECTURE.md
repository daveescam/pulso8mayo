# HR Module Architecture

**Domain:** HORECA HR/People Management System
**Researched:** April 2026
**Confidence:** HIGH

## Executive Summary

This document defines the architecture for integrating HR modules within Pulso HORECA. The system already contains foundational HR tables in `lib/db/schema.ts`. The architecture recommendations focus on connecting recruitment → onboarding → employee profile → performance → training → compliance in a cohesive data flow.

**Key finding:** The existing schema provides 80% of required data structures. Gaps exist in recruitment (ATS) integration and NOM-035 specific compliance workflows.

---

## Component Boundaries

### Core Employee System (Existing)

| Component | Responsibility | Tables |
|-----------|---------------|--------|
| **Employee Core** | Master employee records, identity, employment status | `users`, `employeeProfiles` |
| **Contracts** | Labor contracts, compensation, work schedules | `employeeContracts`, `salaryHistory` |
| **Documents** | Personnel files, legal documents, certificates | `employeeDocuments` |
| **Attendance** | Shift tracking, time worked, breaks | `shiftSessions`, `plannedShifts` |

### HR Modules (To Integrate/Build)

| Component | Responsibility | Proposed Tables |
|-----------|---------------|-----------------|
| **Recruitment (ATS)** | Job postings, candidates, hiring pipeline | New: `jobPostings`, `candidates`, `applications` |
| **Onboarding** | New hire checklists, buddy/mentor assignment | Existing: `employeeOnboarding`, `onboardingSteps` |
| **Performance** | Reviews, goals, competencies | Existing: `performanceReviews`, `performanceGoals` |
| **Training** | Course catalog, enrollments, certifications | Existing: `employeeTraining` |
| **Compliance** | NOM-035 assessments, risk factors, interventions | New: `nom035Assessments`, `riskFactors`, `interventions` |
| **Leave** | Vacation, sick leave, balances | Existing: `leaveRequests`, `leaveBalances`, `vacationAccruals` |

---

## Data Flow Between Modules

### Flow 1: Recruitment → Onboarding → Employee Profile

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│  Job Posting    │────▶│  Candidate      │────▶│  Application         │
│  (ATS Module)   │     │  (ATS Module)   │     │  (ATS Module)        │
└─────────────────┘     └─────────────────┘     └──────────┬───────────┘
                                                            │
                                                           HIRE EVENT
                                                            │
                                                            ▼
┌─────────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  Employee Profile   │◀────│  Onboarding        │◀────│  Contract        │
│  (System of Record) │     │  Checklist         │     │  Creation        │
└─────────────────────┘     └────────────────────┘     └──────────────────┘
```

**Integration Points:**

1. **Hire Event Trigger**: When offer is accepted in ATS, trigger `POST /api/hr/employees/hire`
2. **Data Mapping**:
   - ATS candidate name/email → `users` table
   - Position/department → `employeeProfiles.position`, `employeeProfiles.department`
   - Start date → `employeeProfiles.hireDate`, `employeeContracts.startDate`
3. **Onboarding Auto-Init**: On hire, automatically create `employeeOnboarding` record with default checklist

**Database Relationship:**
```sql
-- New recruitment tables reference existing user IDs
-- After hire, candidate record links to users.id via userId field
```

### Flow 2: Performance Reviews → Employee Profile

```
┌──────────────────────┐     ┌────────────────────┐
│  Performance Review  │────▶│  Review Response   │
│  (Created per cycle) │     │  (Per criterion)   │
└──────────┬───────────┘     └────────────────────┘
           │
           ▼
┌──────────────────────┐     ┌────────────────────┐
│  Employee Profile    │◀────│  Performance Goals │
│  (Aggregate scores)  │     │  (OKRs, KPIs)      │
└──────────────────────┘     └────────────────────┘
```

**Integration Points:**

1. **Review Creation**: Manager initiates review → creates `performanceReviews` record linked to `userId`
2. **Goal Linkage**: Goals created during review → `performanceGoals.userId` references same employee
3. **Profile Aggregation**: Employee profile shows:
   - Latest overall rating from `performanceReviews.overallRating`
   - Active goals from `performanceGoals` where status != 'COMPLETED'
   - Historical reviews from `performanceReviews` where status = 'SUBMITTED'

**Database Query Pattern:**
```typescript
// Get employee's performance summary
const performanceSummary = await db
  .select({
    lastReviewDate: performanceReviews.reviewDate,
    overallRating: performanceReviews.overallRating,
    activeGoalsCount: sql<number>`count(*) filter (where ${performanceGoals.status} = 'IN_PROGRESS')`
  })
  .from(performanceReviews)
  .leftJoin(performanceGoals, eq(performanceReviews.userId, performanceGoals.userId))
  .where(eq(performanceReviews.userId, employeeId))
  .groupBy(performanceReviews.id);
```

### Flow 3: Training → Compliance (NOM-035)

```
┌──────────────────────┐     ┌────────────────────┐
│  Training Catalog    │────▶│  Employee Training │
│  (Course definitions)│     │  (Enrollment/Record)│
└──────────────────────┘     └──────────┬─────────┘
                                         │
                                         ▼
┌──────────────────────┐     ┌────────────────────┐
│  Employee Profile    │◀────│  NOM-035           │
│  (Certifications)    │     │  Assessments       │
└──────────────────────┘     └────────────────────┘
```

**NOM-035 Specific Requirements:**

| Requirement | Implementation | Table |
|-------------|----------------|-------|
| Psychosocial risk assessment | Questionnaire application every 2 years | `nom035Assessments` |
| Severe traumatic events | Event logging and follow-up | `traumaticEvents` |
| Training on psychosocial risks | Training enrollment tracking | `employeeTraining` with `trainingType = 'COMPLIANCE'` |
| Organizational environment | Department-level metrics | `nom035DepartmentResults` |
| Evidence documentation | Document attachment to assessments | Links to `employeeDocuments` |

**Integration Points:**

1. **Training → Compliance**:
   - Training with `isMandatory = true` and `trainingType = 'COMPLIANCE'` auto-created from NOM-035 requirements
   - Completion status linked to compliance status

2. **Assessment → Profile**:
   - NOM-035 results stored at employee level
   - High-risk employees flagged in `employeeProfiles` via `needsIntervention` flag
   - Results affect organizational metrics at department level

**Database Schema Extension (NOM-035):**
```typescript
// Required new tables for NOM-035 compliance
export const nom035Assessments = pgTable("nom035_assessments", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull(),
  companyId: uuid("company_id").notNull(),
  assessmentType: text("assessment_type").notNull(), // 'STE', 'FRPS', 'EO'
  riskLevel: text("risk_level"), // 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'
  score: integer("score"),
  assessmentDate: timestamp("assessment_date").notNull(),
  nextDueDate: timestamp("next_due_date"), // 2 years from completion
  status: text("status").default('PENDING'),
  // Links to employee training
  trainingCompletedId: uuid("training_completed_id"), // employee_training.id
});

export const nom035Interventions = pgTable("nom035_interventions", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull(),
  assessmentId: uuid("assessment_id").notNull(),
  interventionType: text("intervention_type").notNull(), // 'INDIVIDUAL', 'ORGANIZATIONAL'
  description: text("description"),
  assignedTo: text("assigned_to"), // Manager/HR responsible
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  status: text("status").default('PENDING'),
});
```

---

## Suggested Build Order

### Phase 1: Foundation (Existing)
- Employee profiles with personal/employment data
- Contracts and salary history
- Document management
- Attendance and shift tracking

### Phase 2: Onboarding (Priority: HIGH)
**Rationale:** Connects directly to existing tables, creates immediate value

1. **Onboarding checklist templates**: Company-specific onboarding workflows
2. **Buddy/mentor assignment**: Link to existing users
3. **Progress tracking**: Dashboard for HR to monitor onboarding status
4. **Document collection**: Link to `employeeDocuments` for required paperwork

**Dependencies:** Uses existing `employeeOnboarding`, `onboardingSteps`

### Phase 3: Performance (Priority: MEDIUM)
**Rationale:** Depends on onboarding completion; builds on profile data

1. **Review templates**: Criteria definitions per company
2. **Review cycles**: Quarterly/annual review scheduling
3. **Goal tracking**: OKRs and KPIs tied to employee profiles
4. **360 reviews**: Peer feedback collection

**Dependencies:** `employeeProfiles`, `performanceReviews`

### Phase 4: Training & Compliance (Priority: HIGH for Mexico)
**Rationale:** NOM-035 is mandatory; training ties to compliance

1. **Training catalog**: Course definitions with compliance flags
2. **Enrollment management**: Assign training by role/department
3. **NOM-035 assessments**: Psychosocial risk questionnaires
4. **Intervention tracking**: Follow-up actions for high-risk cases

**Dependencies:** `employeeTraining`, new NOM-035 tables

### Phase 5: Recruitment (Priority: LOW)
**Rationale:** ATS integration is complex; build after core HR is solid

1. **Job postings**: Create/manage job listings
2. **Candidate pipeline**: Application tracking
3. **ATS integration**: Webhook接收 hire events → trigger onboarding
4. **E-signature**: Contract signing flow

**Dependencies:** All previous phases

---

## Integration Points with Existing Employee System

### Authentication Integration
The HR modules use existing `users` table as the system of record:

```typescript
// All HR records link to users.id
const employeeTraining = pgTable("employee_training", {
  userId: text("user_id").notNull().references(() => users.id),
  // ...
});

const performanceReviews = pgTable("performance_reviews", {
  userId: text("user_id").notNull().references(() => users.id),
  reviewerId: text("reviewer_id").notNull().references(() => users.id),
  // ...
});
```

### Tenant Isolation
All HR data scoped by `companyId`:

```typescript
// Every query includes companyId filter
const employees = await db
  .select()
  .from(employeeProfiles)
  .leftJoin(users, eq(employeeProfiles.userId, users.id))
  .where(and(
    eq(users.companyId, currentCompanyId),
    eq(employeeProfiles.employeeStatus, 'ACTIVE')
  ));
```

### Document Storage
HR documents (contracts, certificates, NOM-035 evidence) use existing `employeeDocuments`:

```typescript
// Training completion creates document reference
await db.insert(employeeDocuments).values({
  userId: employeeId,
  companyId,
  documentType: 'TRAINING',
  documentName: 'NOM-035 Training Certificate',
  documentUrl: certificateUrl,
  isRequired: true,
  status: 'VALIDATED'
});
```

---

## Scalability Considerations

| Scale | HR Module Behavior |
|-------|-------------------|
| **10-50 employees** | Single company, simple onboarding, manual reviews |
| **50-200 employees** | Multiple branches, automated onboarding templates, quarterly reviews |
| **200-1000 employees** | Complex permissions (HR/Manager/Employee views), NOM-035 automation, performance analytics |
| **1000+ employees** | Department-level metrics, integration middleware, compliance dashboard |

---

## Anti-Patterns to Avoid

### 1. Duplicate Employee Records
**Bad:** Creating new user when candidate is hired
**Good:** Link existing `users.id` to onboarding; create single employee profile

### 2. Hardcoding Compliance Rules
**Bad:** Embedding NOM-035 questionnaires in code
**Good:** Store assessment templates in database; support configurable questionnaires

### 3. Siloed Training Data
**Bad:** Training not linked to employee profile
**Good:** Training records aggregate in employee profile; completion affects compliance status

### 4. Batch-Only Sync
**Bad:** Nightly batch jobs for ATS → HRIS sync
**Good:** Event-driven (webhooks) for hire events; reconciliation jobs for drift detection

---

## Sources

- **Integration Architecture**: [Apideck HRIS Integration Guide](https://www.apideck.com/blog/a-guide-to-hris-integrations-best-practices-use-cases-and-trends-for-2025) — HIGH
- **ATS-HRIS Patterns**: [Treegarden ATS-HRIS Integration](https://treegarden.io/blog/ats-hris-integration-guide/) — HIGH
- **Event-Driven HR**: [Peopletech Cloud Workflows](https://peopletech.cloud/designing-integrated-workflows-how-crm-ats-and-hris-should-s) — HIGH
- **NOM-035 Requirements**: [Sabentis NOM-035 Guide](https://www.sabentis.com/en/blog/nom-035-mexico-2/) — HIGH
- **NOM-035 Compliance**: [EdiFactMx NOM-035 Platform](https://www.edifact.com.mx/en/nom-035-compliance.php) — MEDIUM
- **Current Schema**: `lib/db/schema.ts` lines 1040-1760 — Authoritative