# HR Modules Research Summary

**Project:** Pulso HORECA — HR Modules (Recruitment, Performance Reviews, Training)  
**Synthesized:** April 2026  
**Purpose:** Roadmap creation for HR module implementation

---

## Executive Summary

This research synthesizes findings across technology stack, feature landscape, architecture patterns, and common pitfalls for implementing HR modules in the Pulso HORECA platform. HORECA industry presents unique requirements: high-volume hiring, hourly workforce with mobile-first access needs, seasonal staffing peaks, and in Mexico, mandatory NOM-035 psychosocial risk compliance.

**Key findings:**

- **Technology:** The existing Next.js 16 stack (react-hook-form, Zod, @dnd-kit) handles all HR core requirements. Only two new installations needed: Mux for training video hosting and Tiptap for rich text course creation.

- **Data flow:** The existing database schema provides 80% of required structures. The critical gap is ATS (Applicant Tracking System) tables and NOM-035 compliance workflows for Mexico. All modules should flow into the employee profile as the system of record: Recruitment → Onboarding → Employee Profile → Performance → Training → Compliance.

- **Build priority:** Onboarding first (connects existing systems, immediate value), then Performance (depends on onboarding), then Training & Compliance (NOM-035 mandatory in Mexico), then Recruitment last (most complex, build on solid core).

- **Critical risks:** Slow hiring cycles drive away top talent in HORECA; annual-only reviews create recency bias; training content overload without role-based paths leads to sub-30% completion rates. Mobile-first design is non-negotiable—HORECA workforce accesses systems primarily via phone.

---

## Key Findings

### Stack Recommendations (from STACK.md)

| Category | Recommended | Version | Rationale |
|----------|-------------|---------|------------|
| Forms | react-hook-form | 7.x | Already in stack—industry standard for complex HR forms |
| Validation | Zod | 4.x | Already in stack—type-safe schema validation |
| Kanban Pipeline | @dnd-kit | 10.x | Already in stack—modern maintained replacement for react-beautiful-dnd |
| Video Hosting | @mux/mux-player-react | 3.x | Fastest JIT encoding, best React integration, per-second analytics |
| Rich Text | Tiptap | 3.x | Headless, fully customizable—better than Quill for modern apps |

**Already installed packages usable:**

- `@stepperize/react` for multi-step wizard forms
- `@dnd-kit/core`, `@dnd-kit/sortable` for candidate pipeline kanban
- `date-fns` for training expiry date calculations

**Pattern recommendations:**

- **Multi-step wizard forms:** Use `@stepperize/react` with partial Zod schemas per step, final submit validates all
- **Review cycles:** Zod discriminators or conditional schemas per phase (self-assessment, manager review, calibration, delivery)
- **Training progress:** Custom implementation—no library needed, track via video onTimeUpdate at 25/50/75/100%

### Feature Priorities (from FEATURES.md)

**Table Stakes (Must Have for MVP):**

| Module | Must-Have Features |
|--------|-----------------|
| **Recruitment** | Job postings with distribution, Kanban pipeline, application screening, document collection, mobile-accessible dashboard |
| **Performance** | Configurable review cycles (any cadence), goal setting and tracking, rating scales, employee self-assessment, review history |
| **Training** | Content delivery (video, text, quiz), progress tracking, certification expiry tracking, role-based assignment, mobile access |

**Key Differentiators for HORECA:**

- WhatsApp integration for candidate communication (HORECA candidates prefer it)
- Rehire pool for seasonal peaks (past employees are proven hires)
- Continuous feedback replacing annual-only reviews
- Gamification and microlearning for training completion

**Anti-Features to Avoid:**

- CV-centric workflows (HORECA candidates lack formal resumes—focus on availability and fit)
- Enterprise ATS complexity (too slow for HORECA's fast-paced hiring)
- Annual-only performance reviews (too infrequent for hospitality)
- Desktop-only training interfaces (many staff lack computer access)

### Architecture Considerations (from ARCHITECTURE.md)

**Existing schema provides 80% of required structures in `lib/db/schema.ts`:**

- Employee core: `users`, `employeeProfiles`
- Contracts: `employeeContracts`, `salaryHistory`
- Documents: `employeeDocuments`
- Attendance: `shiftSessions`, `plannedShifts`
- Onboarding: `employeeOnboarding`, `onboardingSteps`
- Performance: `performanceReviews`, `performanceGoals`
- Training: `employeeTraining`

**Required new tables:**

- Recruitment: `jobPostings`, `candidates`, `applications`
- NOM-035: `nom035Assessments`, `nom035Interventions`

**Critical data flows:**

1. **Recruitment → Onboarding → Employee Profile:** Hire event triggers onboarding creation, candidate record links to users.id
2. **Performance → Employee Profile:** Aggregate scores link to profile, goals tie to employee
3. **Training → Compliance:** Training completion affects NOM-035 compliance status

**Tenant isolation:** All HR data scoped by `companyId` with role-based access per location

### Critical Pitfalls (from PITFALLS.md)

**Critical (require immediate attention):**

1. **Slow hiring cycles** — TOP risk for HORECA. Top candidates accept other offers in 24-48 hours. Implement parallel interview scheduling, stage gate time limits (max 48 hours), async video screening.

2. **Annual reviews creating recency bias** — 77% of employees say reviews don't improve performance. Implement continuous feedback with monthly check-ins, require documented evidence for ratings.

3. **Training content overload without paths** — Leads to <30% completion. Limit initial library to 5-10 courses per role, create role-based learning paths.

**Moderate (create operational drag):**

4. **ATS-only thinking** — ATS doesn't source candidates, schedule interviews, or provide analytics. Prioritize integrated platforms.
5. **Vague goals** — "Improve performance" goals cause rating disputes. Enforce SMART goals.
6. **Training siloed from HRIS** — Manual reconciliation 40-60 hours per compliance cycle.
7. **Over-automation** — Fully automated hiring creates candidate drop-off. Keep human-in-the-loop.

---

## Implications for Roadmap

### Suggested Phase Structure

Based on combined research, the following build order maximizes value delivery while managing dependencies and risks:

#### Phase 1: Employee Foundation & Onboarding (Priority: HIGH)

**Rationale:** Connects directly to existing tables, creates immediate operational value, low risk.

**Deliverables:**
- Employee profile enhancements (leverages existing schema)
- Onboarding checklist templates with buddy/mentor assignment
- Document collection flow linking to `employeeDocuments`
- Progress dashboard for HR to monitor onboarding status

**Dependencies:** Uses existing `employeeOnboarding`, `onboardingSteps`

**Pitfalls to avoid:**
- Don't build onboarding without role-based permissions (location managers need to manage their own hires)

#### Phase 2: Performance Reviews Foundation (Priority: MEDIUM)

**Rationale:** Depends on onboarding completion (employee profiles must exist); builds on profile data; addresses the critical annual review recency bias pitfall early.

**Deliverables:**
- Review templates with customizable criteria per role
- Review cycles supporting any cadence (quarterly, semi-annual, annual)
- Goal tracking (OKRs, KPIs) tied to employee profiles
- Manager and employee mobile access
- Self-assessment workflow

**Dependencies:** `employeeProfiles`, `performanceReviews`

**Pitfalls to avoid:**
- Annual-only assumption (design for continuous feedback first)
- Mixing compensation with development (creates defensive reactions)
- Vague goals without measurable criteria

#### Phase 3: Training & NOM-035 Compliance (Priority: HIGH for Mexico)

**Rationale:** NOM-035 is mandatory for Mexican employers—requires psychosocial risk assessments every 2 years. Training ties directly to compliance.

**Deliverables:**
- Training catalog with course definitions
- Role-based enrollment management
- Progress tracking and completion certificates
- Certification expiry alerts (30/60/90 days)
- NOM-035 assessment questionnaires
- Intervention tracking for high-risk cases
- Training reporting for audit readiness

**Dependencies:** `employeeTraining`, new NOM-035 tables

**Pitfalls to avoid:**
- Content overload without learning paths (implement role-based paths first)
- Launch without change management (expect <50% adoption without communication)
- Desktop-only interfaces (must be mobile-first)

#### Phase 4: Recruitment Core (Priority: LOW to MEDIUM)

**Rationale:** ATS integration is most complex; builds best after core HR is solid. However, recruitment is often top priority for HORECA venues—the hiring velocity drives the business.

**Deliverables:**
- Job postings with multi-channel distribution
- Candidate pipeline (Kanban board using @dnd-kit)
- Application screening with custom questions
- Document collection for hiring paperwork
- Mobile-accessible dashboard for managers
- Team permissions by location
- Hire event trigger → creates onboarding record

**Dependencies:** All previous phases (creates employee from candidate)

**Pitfalls to avoid:**
- Slow hiring cycles (implement stage gates and parallel scheduling)
- ATS-only thinking (understand hiring stack layers)
- Over-automation without human touch
- Not tracking pipeline metrics

---

## Research Flags

| Phase | Requires Additional Research | Standard Patterns Apply |
|-------|------------------------------|--------------------------|
| Phase 1: Onboarding | Low—uses existing tables | Standard onboarding workflows |
| Phase 2: Performance | Medium—review template design, goal frameworks | Established patterns via research |
| Phase 3: Training | Low—NOM-035 questionnaire templates | Compliance requirements documented |
| Phase 4: Recruitment | High—ATS vendor selection, WhatsApp integration | May need `/gsd-research-phase` for vendor evaluation |

**Areas identified as needing vendor evaluation:**

- ATS platform comparison for HORECA (or build-custom decision)
- WhatsApp Business API integration patterns
- Background check service integration

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Technologies verified, most already in existing stack |
| **Features** | MEDIUM | HORECA-specific requirements well-mapped; some differentiation features require market validation |
| **Architecture** | HIGH | Integration patterns well-documented; existing schema analysis authoritative |
| **Pitfalls** | MEDIUM-HIGH | Domain pitfalls documented; some HORECA-specific gaps (seasonal hiring timing, multi-location patterns) |

**Gaps to Address:**

- Limited research on HORECA-specific hiring peaks (seasonal, events-driven)
- Food safety training compliance across jurisdictions (varies by location)
- AI governance for candidate screening (evolving area, may need compliance research)
- QStash integration for training reminders (scheduling system not yet documented)

---

## Sources

- **Stack:** OpenATS, Hire Gnome, Devlumiq ATS, nextjs-math-course, LMS Boilerplate, TheFrontKit HR Template
- **Features:** Software Finder, Frontline CRM, StaffedUp, PerformYard, Docebo, Litmos, eHACCP.org, Truvelop, Rotaready, HigherMe
- **Architecture:** Apideck HRIS Integration Guide, Treegarden ATS-HRIS Integration, Peopletech Cloud Workflows, Sabentis NOM-035 Guide, current schema `lib/db/schema.ts` (lines 1040-1760)
- **Pitfalls:** NextInHR, The Smart Recruit, Juicebox.ai, EvalFlow, Windmill, Confirm, LMSPedia, StratBeans, eLearning Industry, Gartner enterprise tech implementation research