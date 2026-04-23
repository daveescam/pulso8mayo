# Pulso - Employee Record Management System
## Complete Implementation Plan (Phases 1.5 - 4)

**Created:** April 13, 2026  
**Version:** 1.0  
**Status:** Planning  
**Total Estimated Duration:** 8-10 weeks

---

## 📋 Table of Contents

1. [Phase 1.5: UI Implementation](#phase-15-ui-implementation)
2. [Phase 2: Advanced HR Features](#phase-2-advanced-hr-features)
3. [Phase 3: Performance & Analytics](#phase-3-performance--analytics)
4. [Phase 4: Integrations & Compliance](#phase-4-integrations--compliance)
5. [Implementation Timeline](#implementation-timeline)
6. [Resource Requirements](#resource-requirements)
7. [Risk Management](#risk-management)
8. [Success Criteria](#success-criteria)

---

## Phase 1.5: UI Implementation

**Duration:** 2-3 weeks  
**Priority:** HIGH  
**Dependencies:** Phase 1 (Backend) ✅ Complete

### Overview

Build comprehensive user interfaces to make the Employee Record Management System accessible to HR staff, managers, and employees. Focus on modern, intuitive UI with proper role-based access controls.

---

### 1.5.1 Employee Directory Page

**Priority:** P0 (Critical)  
**Estimated Time:** 3-4 days

#### Components to Build:

| Component | Type | Description |
|-----------|------|-------------|
| Employee List Table | Data Grid | Paginated table with all employees |
| Search & Filter Bar | Form | Real-time search + multi-filter |
| Employee Card | UI | Summary card for each employee |
| Status Badge | UI | Visual status indicator |
| Department Filter | Dropdown | Filter by department |
| Branch Filter | Dropdown | Filter by branch |
| Status Filter | Dropdown | Filter by employment status |
| Export Button | Action | Export to CSV/PDF |
| Add Employee Button | Action | Create new employee |
| Bulk Actions Menu | Dropdown | Bulk operations on selected employees |

#### Features:

- [ ] **Data Display:**
  - Employee name, photo, employee number
  - Position, department, branch
  - Employment status (color-coded badges)
  - Hire date, supervisor name
  - Quick actions (view, edit, message)

- [ ] **Filtering & Search:**
  - Full-text search (name, email, employee number, position)
  - Multi-select filters (department, branch, status)
  - Date range filter (hire date)
  - Save filter presets
  - URL-based filter sharing

- [ ] **Sorting:**
  - Sort by any column
  - Multi-column sorting
  - Default sort: name ascending

- [ ] **Pagination:**
  - 20/50/100 items per page
  - Jump to page
  - Show total count

- [ ] **Bulk Actions:**
  - Select multiple employees
  - Bulk status change
  - Bulk department change
  - Bulk export
  - Bulk email/WhatsApp

#### API Integration:

```typescript
GET /api/employees?companyId={id}&search={query}&department={dept}&status={status}&page={n}&limit={n}
```

#### Files to Create:

```
app/dashboard/employees/
├── page.tsx                          # Main employee directory
components/employees/
├── employee-directory.tsx            # Main container component
├── employee-table.tsx                # Data table component
├── employee-filters.tsx              # Filter sidebar/modal
├── employee-card.tsx                 # Card view component
├── employee-bulk-actions.tsx         # Bulk actions menu
└── employee-export-dialog.tsx        # Export configuration
```

---

### 1.5.2 Employee Profile Detail Page

**Priority:** P0 (Critical)  
**Estimated Time:** 5-6 days

#### Layout Structure:

```
┌─────────────────────────────────────────────────────┐
│  Header: Name, Photo, Status, Quick Actions         │
├─────────────────────────────────────────────────────┤
│  Tabs:                                              │
│  [Personal] [Professional] [Contracts] [Documents] │
│  [Onboarding] [Time & Attendance] [Audit]          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tab Content Area                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Tab 1: Personal Information

**Components:**

- [ ] **Profile Header:**
  - Profile photo (upload/change)
  - Full name
  - Employee number badge
  - Status badge (ACTIVE, ONBOARDING, etc.)
  - Quick action buttons (Edit, Message, Export)

- [ ] **Personal Details Form:**
  - Date of birth (date picker)
  - CURP (18 characters, validation)
  - RFC (13 characters, validation)
  - NSS (social security number)
  - Gender (radio buttons)
  - Marital status (dropdown)
  - Blood type (dropdown)
  - Nationality (dropdown)

- [ ] **Contact Information:**
  - Personal email (with validation)
  - Personal phone (with validation)
  - Address (structured form):
    - Street, exterior number, interior number
    - Neighborhood, city, state, zip code
  - City, State (separate fields for filtering)

- [ ] **Emergency Contact:**
  - Contact name
  - Phone number
  - Email
  - Relationship (dropdown: Spouse, Parent, Sibling, Other)

- [ ] **Bank Information:** (Restricted access - HR/Managers only)
  - Bank name (dropdown of Mexican banks)
  - CLABE (18 digits, validation)
  - Card number (last 4 digits display)
  - Payment method (dropdown)

#### Tab 2: Professional Information

**Components:**

- [ ] **Employment Details:**
  - Employee number
  - Department (dropdown)
  - Position (dropdown/text)
  - Supervisor (searchable dropdown)
  - Hire date (date picker)
  - Seniority date (date picker)
  - Probation end date (date picker, auto-calculated)

- [ ] **Employment Status:**
  - Status dropdown (ONBOARDING, ACTIVE, ON_LEAVE, etc.)
  - Active/Inactive toggle
  - Termination date (if applicable)
  - Termination reason (dropdown, if terminated)
  - Rehire eligible (checkbox)

- [ ] **Work Schedule:**
  - Standard hours per week
  - Default shift assignment
  - Schedule preview link

- [ ] **Skills & Languages:**
  - Skills (tag input, add/remove)
  - Languages (tag input, add/remove)
  - Notes (textarea, HR-only visibility)

#### Tab 3: Contracts

**Components:**

- [ ] **Contract Timeline:**
  - Visual timeline of all contracts
  - Current contract highlighted
  - Contract start/end dates
  - Contract type badges

- [ ] **Active Contract Card:**
  - Contract number
  - Contract type (badge)
  - Work regime
  - Start date, end date (if applicable)
  - Probation period days remaining
  - Status badge

- [ ] **Compensation Section:**
  - Daily salary (formatted currency)
  - Weekly salary
  - Monthly salary
  - Salary history chart (line graph)
  - Last salary change date/reason

- [ ] **Benefits Section:**
  - Health insurance (checkbox + details)
  - Life insurance (checkbox + details)
  - Savings fund (checkbox + details)
  - Food vouchers (checkbox + details)
  - Transportation bonus (checkbox + details)

- [ ] **Work Schedule Details:**
  - Start time, end time
  - Work days (visual week selector)
  - Break duration

- [ ] **Contract Actions:**
  - View contract document
  - Edit contract
  - Create new contract (for renewals)
  - Terminate contract

#### Tab 4: Documents

**Components:**

- [ ] **Document Grid:**
  - Document cards with icons
  - Document type, name, upload date
  - Status badge (VALIDATED, PENDING, EXPIRED, REJECTED)
  - Expiration date (if applicable)
  - Quick actions (view, download, validate, delete)

- [ ] **Document Upload:**
  - Drag & drop upload area
  - Document type selection
  - Document name
  - Expiration date (optional)
  - Notes
  - Upload progress indicator

- [ ] **Required Documents Checklist:**
  - CONTRACT (required by LFT)
  - ID (required by LFT)
  - TAX_ID (required by LFT)
  - BANK_INFO (required by LFT)
  - Progress bar (X of Y required documents uploaded)

- [ ] **Document Validation:** (HR/Managers only)
  - Validate/Reject buttons
  - Rejection reason input
  - Validation date
  - Validator name

#### Tab 5: Onboarding

**Components:**

- [ ] **Onboarding Progress:**
  - Progress bar (0-100%)
  - Current step indicator
  - Start date, target end date
  - Assigned buddy/mentor cards

- [ ] **Step Checklist:**
  - Step name, category (color-coded)
  - Status badge
  - Due date
  - Completed date/by
  - Mark complete/incomplete
  - Step notes

- [ ] **Step Categories:**
  - DOCUMENTS (blue)
  - TRAINING (green)
  - SETUP (orange)
  - COMPLIANCE (red)
  - ORIENTATION (purple)

#### Tab 6: Time & Attendance

**Components:**

- [ ] **Attendance Summary:**
  - Current week hours
  - Month-to-date hours
  - Overtime hours (month)
  - Absences (month)
  - Tardiness (month)

- [ ] **Recent Activity:**
  - Last 10 clock-ins/outs
  - Date, time, GPS location
  - Status (on-time, late, early departure)

- [ ] **Schedule Calendar:**
  - Monthly calendar view
  - Scheduled shifts
  - Actual shifts
  - Discrepancies highlighted

#### Tab 7: Audit Trail

**Components:**

- [ ] **Audit Log Table:**
  - Date/time of change
  - User who made change
  - Entity type (PROFILE, CONTRACT, SALARY)
  - Field name
  - Old value → New value (diff view)
  - IP address
  - Sensitive data flag (masked view)

- [ ] **Audit Filters:**
  - Date range
  - Entity type
  - Action type (CREATE, UPDATE, DELETE)
  - Sensitive only toggle
  - User filter

- [ ] **Change Detail Modal:**
  - Full old/new value display
  - Before/after comparison
  - Reason for change
  - Approval status (if required)

#### API Integration:

```typescript
// Get employee profile with all related data
GET /api/employees/{id}?includeContracts=true&includeSalary=true&includeOnboarding=true&includeBenefits=true&includeTraining=true&includeVacation=true

// Update employee profile
PATCH /api/employees?id={id}
Body: { field: value, ... }

// Get audit logs
GET /api/employees/audit?userId={id}&page=1&limit=50

// Get contracts
GET /api/employees/contracts?userId={id}
```

#### Files to Create:

```
app/dashboard/employees/[id]/
├── page.tsx                          # Employee profile container
├── tabs/
│   ├── personal-tab.tsx              # Personal information
│   ├── professional-tab.tsx          # Professional information
│   ├── contracts-tab.tsx             # Contracts & salary
│   ├── documents-tab.tsx             # Document management
│   ├── onboarding-tab.tsx            # Onboarding progress
│   ├── attendance-tab.tsx            # Time & attendance
│   └── audit-tab.tsx                 # Audit trail
components/employees/
├── employee-header.tsx               # Profile header with photo
├── personal-info-form.tsx            # Personal details form
├── contact-info-form.tsx             # Contact information form
├── emergency-contact-form.tsx        # Emergency contact form
├── bank-info-form.tsx                # Bank information form
├── employment-details-form.tsx       # Professional information form
├── contract-timeline.tsx             # Contract history timeline
├── salary-history-chart.tsx          # Salary change chart
├── benefits-checklist.tsx            # Benefits configuration
├── contract-form.tsx                 # Create/edit contract form
├── document-grid.tsx                 # Document gallery
├── document-upload.tsx               # Document upload component
├── document-validator.tsx            # Document validation UI
├── onboarding-progress.tsx           # Onboarding progress tracker
├── onboarding-checklist.tsx          # Step-by-step checklist
├── attendance-summary.tsx            # Attendance statistics
├── recent-activity.tsx               # Recent clock-in/out activity
├── audit-log-table.tsx               # Audit log data table
└── audit-filters.tsx                 # Audit log filters
```

---

### 1.5.3 Employee Self-Service Portal

**Priority:** P1 (High)  
**Estimated Time:** 3-4 days

#### Features for Employees:

**View-Only Access:**
- [ ] Personal profile (all fields visible)
- [ ] Current contract details
- [ ] Document library (own documents only)
- [ ] Vacation balance (days available)
- [ ] Work schedule (upcoming 30 days)
- [ ] Attendance history (own records)
- [ ] Training history
- [ ] Benefits enrollment

**Editable Fields:**
- [ ] Personal email
- [ ] Personal phone
- [ ] Address
- [ ] Emergency contact information
- [ ] Profile photo
- [ ] Bank information (with HR approval workflow)

**Actions Available:**
- [ ] Update profile information
- [ ] Upload documents (ID, proof of address, etc.)
- [ ] Request vacation (link to existing vacation flow)
- [ ] Request time off (link to existing approvals)
- [ ] View payslips (future integration)
- [ ] Download employment documents

#### Components:

```
app/dashboard/profile/
├── page.tsx                          # Self-service profile container
├── personal-info.tsx                 # View/edit personal info
├── my-contracts.tsx                  # View current contract
├── my-documents.tsx                  # View/upload documents
├── my-schedule.tsx                   # View personal schedule
├── my-attendance.tsx                 # View attendance history
├── vacation-balance.tsx              # Vacation balance display
└── benefits-view.tsx                 # View enrolled benefits
```

#### Access Control:

```typescript
// EMPLEADO role: Can only view/edit own profile
// SUPERVISOR+: Can view team member profiles (branch-scoped)
// GERENTE/ADMIN: Can view all company profiles, edit sensitive fields
// SUPER_ADMIN: Full access to everything
```

---

### 1.5.4 Contract Management UI

**Priority:** P1 (High)  
**Estimated Time:** 2-3 days

#### Features:

**Contract Creation Wizard:**
- [ ] Step 1: Contract type selection
- [ ] Step 2: Work regime configuration
- [ ] Step 3: Salary input (auto-calculates weekly/monthly)
- [ ] Step 4: Work schedule setup
- [ ] Step 5: Benefits selection
- [ ] Step 6: Review & submit
- [ ] Step 7: Contract document generation (future)

**Contract Editing:**
- [ ] Edit any contract field
- [ ] Salary change form (creates salary history entry)
- [ ] Contract renewal form (creates new contract)
- [ ] Contract termination form

**Contract History:**
- [ ] Timeline view of all contracts for employee
- [ ] Compare contracts side-by-side
- [ ] Export contract history

#### Components:

```
components/employees/
├── contract-wizard.tsx                 # Multi-step contract creation
├── contract-type-selector.tsx          # Contract type cards
├── work-regime-config.tsx             # Work regime configuration
├── salary-input.tsx                    # Salary form with calculations
├── work-schedule-config.tsx            # Schedule builder
├── benefits-selector.tsx               # Benefits checkbox list
├── contract-review.tsx                 # Review before submit
├── contract-comparison.tsx             # Side-by-side comparison
└── contract-renewal-form.tsx           # Renew existing contract
```

---

### 1.5.5 Onboarding/Offboarding UI

**Priority:** P1 (High)  
**Estimated Time:** 3-4 days

#### Onboarding Dashboard:

**HR/Manager View:**
- [ ] List of all active onboardings
- [ ] Progress overview (chart)
- [ ] Overdue onboardings (alert)
- [ ] Create new onboarding
- [ ] Assign buddy/mentor

**Onboarding Wizard:**
- [ ] Step-by-step interface for new hires
- [ ] Mark steps complete
- [ ] Upload required documents
- [ ] View progress
- [ ] Due date reminders

#### Offboarding Dashboard:

**HR/Manager View:**
- [ ] List of active offboardings
- [ ] Financial settlement calculator
- [ ] Asset return checklist
- [ ] Exit interview form
- [ ] Compliance checklist
- [ ] Final approval

**Offboarding Wizard:**
- [ ] Reason selection
- [ ] Resignation date input
- [ ] Last working day selection
- [ ] Financial calculation preview
- [ ] Asset return form
- [ ] Exit interview (HR only)
- [ ] Final approval workflow

#### Components:

```
app/dashboard/employees/onboarding/
├── page.tsx                          # Onboarding dashboard
├── [id]/
│   └── page.tsx                      # Individual onboarding detail
└── new/
    └── page.tsx                      # Create onboarding wizard

app/dashboard/employees/offboarding/
├── page.tsx                          # Offboarding dashboard
├── [id]/
│   └── page.tsx                      # Individual offboarding detail
└── new/
    └── page.tsx                      # Create offboarding wizard

components/employees/
├── onboarding-dashboard.tsx          # Active onboardings list
├── onboarding-wizard.tsx             # Create onboarding flow
├── onboarding-step-view.tsx          # Employee step-by-step view
├── offboarding-dashboard.tsx         # Active offboardings list
├── offboarding-wizard.tsx            # Create offboarding flow
├── financial-calculator.tsx          # Settlement calculator
├── asset-checklist.tsx               # Asset return tracking
├── exit-interview-form.tsx           # Exit interview UI
└── compliance-checklist.tsx          # Offboarding compliance
```

---

### 1.5.6 Audit Trail UI

**Priority:** P2 (Medium)  
**Estimated Time:** 2 days

#### Features:

**Audit Log Viewer:**
- [ ] Timeline visualization
- [ ] Filter by date, entity type, action, user
- [ ] Sensitive data masking
- [ ] Export audit logs
- [ ] Change diff display
- [ ] Approval status tracking

#### Components:

```
app/dashboard/employees/[id]/audit/
├── page.tsx                          # Audit trail page
components/employees/
├── audit-timeline.tsx                # Timeline visualization
├── audit-diff-viewer.tsx             # Before/after comparison
├── audit-export-dialog.tsx           # Export configuration
└── sensitive-data-mask.tsx           # Mask sensitive information
```

---

### Phase 1.5 Deliverables Summary

| Deliverable | Priority | Est. Time | Status |
|-------------|----------|-----------|--------|
| Employee Directory | P0 | 3-4 days | ⏳ Pending |
| Employee Profile Detail | P0 | 5-6 days | ⏳ Pending |
| Self-Service Portal | P1 | 3-4 days | ⏳ Pending |
| Contract Management UI | P1 | 2-3 days | ⏳ Pending |
| Onboarding/Offboarding UI | P1 | 3-4 days | ⏳ Pending |
| Audit Trail UI | P2 | 2 days | ⏳ Pending |
| **TOTAL** | | **18-23 days** | |

---

## Phase 2: Advanced HR Features

**Duration:** 2-3 weeks  
**Priority:** HIGH  
**Dependencies:** Phase 1.5 (UI) Complete

### Overview

Implement advanced HR features including performance reviews, leave management enhancements, document automation, and granular permissions.

---

### 2.1 Performance Review System

**Priority:** P1 (High)  
**Estimated Time:** 5-6 days

#### Database Schema (New Tables):

```sql
performance_reviews
├── id (UUID, PK)
├── userId (FK → users.id)
├── reviewerId (FK → users.id)
├── companyId (FK → companies.id)
├── reviewType (enum: SELF, MANAGER, PEER, 360)
├── reviewPeriod (text: "2026-Q1", "2026-H1", "2026-ANNUAL")
├── reviewDate (timestamp)
├── status (enum: DRAFT, IN_PROGRESS, COMPLETED, SUBMITTED)
├── overallRating (integer: 1-5)
├── strengths (text)
├── areasForImprovement (text)
├── goals (jsonb: [{ goal, target, deadline }])
├── achievements (jsonb)
├── developmentPlan (text)
├── comments (text)
├── submittedAt (timestamp)
├── completedAt (timestamp)
└── createdAt, updatedAt

performance_review_criteria
├── id (UUID, PK)
├── companyId (FK → companies.id)
├── name (text)
├── description (text)
├── category (text: TECHNICAL, SOFT_SKILLS, LEADERSHIP, etc.)
├── weight (integer: 1-10)
└── isActive (boolean)

performance_review_responses
├── id (UUID, PK)
├── reviewId (FK → performance_reviews.id)
├── criteriaId (FK → performance_review_criteria.id)
├── rating (integer: 1-5)
├── comments (text)
└── createdAt

performance_goals
├── id (UUID, PK)
├── userId (FK → users.id)
├── companyId (FK → companies.id)
├── title (text)
├── description (text)
├── category (text)
├── status (enum: NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED)
├── targetDate (timestamp)
├── completedDate (timestamp)
├── metrics (jsonb)
└── createdAt, updatedAt
```

#### Features:

**Review Management:**
- [ ] Create review cycles (quarterly, semi-annual, annual)
- [ ] Assign reviewers (self, manager, peers)
- [ ] 360-degree review support
- [ ] Custom review criteria per company
- [ ] Rating scales (1-5 with descriptions)

**Review Process:**
- [ ] Self-assessment form
- [ ] Manager assessment form
- [ ] Peer assessment forms
- [ ] Review comparison view
- [ ] Review submission workflow
- [ ] Review approval by HR

**Goals Management:**
- [ ] Set performance goals
- [ ] Track goal progress
- [ ] Goal completion tracking
- [ ] Goal history

**Analytics:**
- [ ] Performance trends over time
- [ ] Department performance comparison
- [ ] High/low performer identification
- [ ] Review completion rates

#### UI Components:

```
app/dashboard/performance/
├── page.tsx                          # Performance dashboard
├── reviews/
│   ├── page.tsx                      # Review list
│   ├── [id]/
│   │   └── page.tsx                  # Review detail/edit
│   └── new/
│       └── page.tsx                  # Create review
├── goals/
│   ├── page.tsx                      # Goals list
│   └── [id]/
│       └── page.tsx                  # Goal detail
└── analytics/
    └── page.tsx                      # Performance analytics

components/performance/
├── review-dashboard.tsx
├── review-list.tsx
├── review-form.tsx
├── self-assessment.tsx
├── manager-assessment.tsx
├── peer-assessment.tsx
├── review-comparison.tsx
├── goals-list.tsx
├── goal-form.tsx
├── goal-tracker.tsx
├── performance-chart.tsx
└── review-criteria-builder.tsx
```

---

### 2.2 Enhanced Leave & Absence Management

**Priority:** P1 (High)  
**Estimated Time:** 4-5 days

#### Database Schema Extensions:

```sql
leaveTypes
├── id (UUID, PK)
├── companyId (FK → companies.id)
├── name (text: VACATION, SICK_LEAVE, PERSONAL, MATERNITY, PATERNITY, BEREAVEMENT, etc.)
├── description (text)
├── isPaid (boolean)
├── requiresDocumentation (boolean)
├── maxDaysPerYear (integer)
├── accrualRate (integer: days per year)
└── isActive (boolean)

leaveRequests
├── id (UUID, PK)
├── userId (FK → users.id)
├── companyId (FK → companies.id)
├── leaveTypeId (FK → leaveTypes.id)
├── startDate (timestamp)
├── endDate (timestamp)
├── totalDays (integer)
├── reason (text)
├── status (enum: PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED)
├── supportingDocumentId (FK → employeeDocuments.id)
├── requestedAt (timestamp)
├── approvedBy, approvedAt (timestamp)
├── rejectedBy, rejectedAt (timestamp)
├── rejectionReason (text)
└── createdAt, updatedAt

leaveBalances
├── id (UUID, PK)
├── userId (FK → users.id)
├── leaveTypeId (FK → leaveTypes.id)
├── year (integer)
├── totalEntitlement (integer: days)
├── used (integer: days)
├── pending (integer: days)
├── balance (integer: days)
└── updatedAt
```

#### Features:

**Leave Types:**
- [ ] Pre-configured leave types per Mexican law:
  - Vacation (LFT Art. 76)
  - Sick leave (IMSS)
  - Personal leave
  - Maternity leave (12 weeks, LFT Art. 170)
  - Paternity leave (5 days, LFT Art. 132)
  - Bereavement leave
  - Training leave
  - Jury duty
- [ ] Custom leave types (company-specific)

**Leave Request Flow:**
- [ ] Employee submits leave request
- [ ] Automatic balance checking
- [ ] Manager approval workflow
- [ ] HR notification
- [ ] Calendar integration
- [ ] Conflict detection (multiple employees on leave)

**Leave Balance Tracking:**
- [ ] Real-time balance display
- [ ] Accrual calculation (vacation: LFT seniority table)
- [ ] Leave usage reports
- [ ] Year-end balance rollover (configurable)

**Leave Analytics:**
- [ ] Leave trends by type
- [ ] Department leave rates
- [ ] Leave vs. productivity correlation
- [ ] Absenteeism rate tracking

#### UI Enhancements:

```
app/dashboard/labor/leave/
├── page.tsx                          # Leave dashboard
├── request/
│   └── page.tsx                      # Request leave
├── balance/
│   └── page.tsx                      # Leave balances
└── calendar/
    └── page.tsx                      # Team leave calendar

components/labor/
├── leave-dashboard.tsx
├── leave-request-form.tsx
├── leave-balance-card.tsx
├── leave-calendar.tsx
├── leave-type-config.tsx
└── leave-analytics.tsx
```

---

### 2.3 Document Automation & Alerts

**Priority:** P1 (High)  
**Estimated Time:** 3-4 days

#### Features:

**Document Expiration Alerts:**
- [ ] Automatic expiration date checking
- [ ] Alert generation 30/15/7/1 days before expiration
- [ ] Multi-channel notifications (email, WhatsApp, in-app)
- [ ] Escalation rules (if not updated, notify manager)
- [ ] Bulk expiration report

**Document Templates:**
- [ ] Contract template generation
- [ ] Offer letter templates
- [ ] NDA templates
- [ ] Training certificate templates
- [ ] Custom template builder

**Document Compliance Reporting:**
- [ ] Missing required documents report
- [ ] Expiring documents report
- [ ] Invalid/rejected documents report
- [ ] Compliance percentage by department/branch
- [ ] Export to PDF/Excel

**AI-Powered Document Validation:** (Future integration)
- [ ] OCR for ID validation
- [ ] Document authenticity checking
- [ ] Data extraction from documents
- [ ] Automatic field population

#### API Endpoints:

```typescript
// Get expiring documents
GET /api/employees/documents/expiring?days=30&companyId={id}

// Send expiration reminders
POST /api/employees/documents/reminders
Body: { documentType, daysBeforeExpiration }

// Generate contract from template
POST /api/employees/contracts/generate
Body: { userId, templateId, variables }

// Get compliance report
GET /api/employees/documents/compliance?companyId={id}&branchId={id}
```

#### Components:

```
components/employees/
├── document-expiration-alerts.tsx
├── document-compliance-report.tsx
├── document-template-builder.tsx
├── document-reminder-config.tsx
└── document-export-dialog.tsx
```

---

### 2.4 Granular Role-Based Access Control

**Priority:** P1 (High)  
**Estimated Time:** 3-4 days

#### Features:

**Field-Level Permissions:**
- [ ] Define permissions per field:
  - Salary: Only HR/ADMIN can view/edit
  - Personal info: Employee can edit, HR can approve
  - Performance reviews: Only reviewer/manager can view
  - Bank info: Employee can edit, HR can view
  - Emergency contacts: Employee can edit, HR can view

**Permission Matrix:**

| Data Category | EMPLEADO | SUPERVISOR | GERENTE | ADMIN | HR |
|---------------|----------|------------|---------|-------|-----|
| Personal Info (basic) | View Own | View Team | View All | View All | View All |
| Personal Info (edit) | Edit Own | - | - | Edit All | Edit All |
| Salary Information | - | - | View | Edit | Edit |
| Bank Information | Edit Own | - | View | View | View |
| Performance Reviews | View Own | View Team | View All | View All | View All |
| Documents | View Own | View Team | View All | View All | View/Validate |
| Contracts | View Own | View Team | View/Edit | View/Edit | View/Edit |
| Audit Logs | - | - | View | View | View |

**Permission Enforcement:**
- [ ] Middleware checks on API routes
- [ ] UI component visibility based on permissions
- [ ] Field-level masking for unauthorized users
- [ ] Permission audit logging

#### Implementation:

```typescript
// lib/rbac/employee-permissions.ts

export type PermissionAction = 'view' | 'edit' | 'delete' | 'export';
export type PermissionEntity = 'profile' | 'salary' | 'contracts' | 'documents' | 'performance' | 'audit';

export interface PermissionRule {
  entity: PermissionEntity;
  action: PermissionAction;
  scope: 'own' | 'team' | 'branch' | 'company' | 'all';
  conditions?: Record<string, any>;
}

export const rolePermissions: Record<UserRole, PermissionRule[]> = {
  EMPLEADO: [
    { entity: 'profile', action: 'view', scope: 'own' },
    { entity: 'profile', action: 'edit', scope: 'own' },
    { entity: 'documents', action: 'view', scope: 'own' },
    // ...
  ],
  SUPERVISOR: [
    { entity: 'profile', action: 'view', scope: 'team' },
    { entity: 'performance', action: 'view', scope: 'team' },
    // ...
  ],
  // ...
};
```

---

### 2.5 Employee Communications

**Priority:** P2 (Medium)  
**Estimated Time:** 2-3 days

#### Features:

**Internal Messaging:**
- [ ] Send messages to employees
- [ ] Broadcast messages (company-wide, branch-wide, department-wide)
- [ ] Message templates
- [ ] Read receipts
- [ ] WhatsApp integration for external messages

**Announcements:**
- [ ] Company announcements
- [ ] Policy updates
- [ ] Holiday notifications
- [ ] Event announcements
- [ ] Pin important announcements

**Notifications:**
- [ ] Contract renewal reminders
- [ ] Document expiration alerts
- [ ] Onboarding step due dates
- [ ] Offboarding task assignments
- [ ] Performance review deadlines
- [ ] Vacation request approvals/rejections

#### Components:

```
components/employees/
├── message-composer.tsx
├── broadcast-form.tsx
├── announcement-banner.tsx
├── notification-center.tsx
└── message-templates.tsx
```

---

### Phase 2 Deliverables Summary

| Deliverable | Priority | Est. Time | Dependencies |
|-------------|----------|-----------|--------------|
| Performance Review System | P1 | 5-6 days | 1.5 Complete |
| Enhanced Leave Management | P1 | 4-5 days | 1.5 Complete |
| Document Automation | P1 | 3-4 days | 1.5 Complete |
| Granular RBAC | P1 | 3-4 days | 1.5 Complete |
| Employee Communications | P2 | 2-3 days | 1.5 Complete |
| **TOTAL** | | **17-22 days** | |

---

## Phase 3: Performance & Analytics

**Duration:** 2 weeks  
**Priority:** MEDIUM  
**Dependencies:** Phase 2 Complete

### Overview

Build comprehensive analytics, reporting, and business intelligence features for employee data. Add performance optimizations and advanced search capabilities.

---

### 3.1 Employee Analytics Dashboard

**Priority:** P1 (High)  
**Estimated Time:** 4-5 days

#### Features:

**Workforce Overview:**
- [ ] Total headcount (active, on leave, terminated)
- [ ] New hires (this month, this quarter, YTD)
- [ ] Terminations (this month, this quarter, YTD)
- [ ] Turnover rate (%)
- [ ] Average tenure
- [ ] Headcount trend (line chart)

**Demographics:**
- [ ] Gender distribution (pie chart)
- [ ] Age distribution (histogram)
- [ ] Department distribution (bar chart)
- [ ] Branch distribution (map/bar chart)
- [ ] Tenure distribution (histogram)

**Compensation Analytics:**
- [ ] Average salary by department
- [ ] Average salary by position
- [ ] Salary distribution (histogram)
- [ ] Salary trends over time
- [ ] Overtime cost analysis
- [ ] Benefits cost analysis

**Attendance Analytics:**
- [ ] Attendance rate by department
- [ ] Absenteeism rate
- [ ] Tardiness rate
- [ ] Overtime hours trend
- [ ] Top absent employees
- [ ] Leave utilization

**Performance Analytics:**
- [ ] Average performance rating by department
- [ ] Performance distribution
- [ ] High performers identification
- [ ] Low performers identification
- [ ] Performance trends

**Compliance Metrics:**
- [ ] Document compliance rate (%)
- [ ] Required documents completion
- [ ] Expiring documents count
- [ ] Onboarding completion rate
- [ ] Offboarding completion rate
- [ ] LFT compliance score

#### Dashboard Layout:

```
┌──────────────────────────────────────────────────────┐
│  Workforce Overview (KPI Cards)                      │
│  [Headcount] [New Hires] [Turnover] [Avg Tenure]    │
├──────────────────────────────────────────────────────┤
│  Charts (2x3 Grid)                                   │
│  [Headcount Trend] [Demographics] [Compensation]    │
│  [Attendance]    [Performance]  [Compliance]        │
├──────────────────────────────────────────────────────┤
│  Alerts & Insights                                   │
│  • 5 documents expiring in next 30 days             │
│  • Turnover rate increased 2% from last month       │
│  • Department X has highest absenteeism             │
└──────────────────────────────────────────────────────┘
```

#### Components:

```
app/dashboard/analytics/employees/
├── page.tsx                          # Main analytics dashboard
├── workforce/
│   └── page.tsx                      # Workforce analytics
├── compensation/
│   └── page.tsx                      # Compensation analytics
├── attendance/
│   └── page.tsx                      # Attendance analytics
├── performance/
│   └── page.tsx                      # Performance analytics
└── compliance/
    └── page.tsx                      # Compliance analytics

components/analytics/
├── workforce-overview.tsx
├── demographics-chart.tsx
├── compensation-chart.tsx
├── attendance-chart.tsx
├── performance-chart.tsx
├── compliance-meter.tsx
├── kpi-card.tsx
├── trend-chart.tsx
├── distribution-chart.tsx
└── insights-panel.tsx
```

---

### 3.2 Reporting Engine

**Priority:** P1 (High)  
**Estimated Time:** 4-5 days

#### Features:

**Standard Reports:**
- [ ] Employee roster (all employees with basic info)
- [ ] Headcount report (by department, branch, status)
- [ ] Turnover report (terminations with reasons)
- [ ] Compensation report (salary by department/position)
- [ ] Attendance report (absences, tardiness, overtime)
- [ ] Performance report (ratings, goals completion)
- [ ] Compliance report (document status, onboarding/offboarding)
- [ ] Leave utilization report

**Custom Report Builder:**
- [ ] Select data source (employees, contracts, attendance, etc.)
- [ ] Choose fields to include
- [ ] Apply filters
- [ ] Group by fields
- [ ] Sort by fields
- [ ] Save report template
- [ ] Schedule report generation

**Export Formats:**
- [ ] PDF (formatted, branded)
- [ ] Excel/CSV (data export)
- [ ] JSON (API integration)
- [ ] Print (browser print-friendly)

**Scheduled Reports:**
- [ ] Weekly/Monthly/Quarterly scheduling
- [ ] Email delivery
- [ ] Export to cloud storage (S3/R2)
- [ ] Report archive

#### Components:

```
app/dashboard/reports/
├── page.tsx                          # Reports dashboard
├── standard/
│   └── page.tsx                      # Standard reports list
├── custom/
│   └── page.tsx                      # Custom report builder
└── scheduled/
    └── page.tsx                      # Scheduled reports

components/reports/
├── report-list.tsx
├── report-builder.tsx
├── report-preview.tsx
├── report-scheduler.tsx
├── report-export-dialog.tsx
└── report-templates.tsx
```

---

### 3.3 Advanced Search & Filtering

**Priority:** P2 (Medium)  
**Estimated Time:** 2-3 days

#### Features:

**Global Employee Search:**
- [ ] Full-text search across all employee fields
- [ ] Search suggestions/autocomplete
- [ ] Recent searches
- [ ] Search history

**Advanced Search Filters:**
- [ ] Multi-field filtering (department, position, status, location, etc.)
- [ ] Date range filtering (hire date, birth date, etc.)
- [ ] Salary range filtering
- [ ] Performance rating filtering
- [ ] Document status filtering

**Saved Searches:**
- [ ] Save search criteria
- [ ] Name saved searches
- [ ] Quick access to saved searches
- [ ] Share saved searches

**Search Results:**
- [ ] Highlighted search terms
- [ ] Result count
- [ ] Sort options
- [ ] Export results

---

### 3.4 Performance Optimizations

**Priority:** P2 (Medium)  
**Estimated Time:** 2-3 days

#### Optimizations:

**Database:**
- [ ] Add indexes for frequently queried fields
- [ ] Optimize complex joins
- [ ] Implement read replicas for analytics queries
- [ ] Query result caching (Redis)

**API:**
- [ ] Response caching (SWR/React Query)
- [ ] Pagination for all list endpoints
- [ ] Field selection (only return requested fields)
- [ ] Batch requests support

**UI:**
- [ ] Lazy loading for large lists
- [ ] Virtual scrolling for tables
- [ ] Image optimization (profile photos)
- [ ] Code splitting by route
- [ ] Prefetching for likely navigation paths

---

### Phase 3 Deliverables Summary

| Deliverable | Priority | Est. Time | Dependencies |
|-------------|----------|-----------|--------------|
| Employee Analytics Dashboard | P1 | 4-5 days | Phase 2 Complete |
| Reporting Engine | P1 | 4-5 days | Phase 2 Complete |
| Advanced Search & Filtering | P2 | 2-3 days | Phase 2 Complete |
| Performance Optimizations | P2 | 2-3 days | Phase 2 Complete |
| **TOTAL** | | **12-16 days** | |

---

## Phase 4: Integrations & Compliance

**Duration:** 2-3 weeks  
**Priority:** MEDIUM  
**Dependencies:** Phase 3 Complete

### Overview

Implement external integrations with government systems (IMSS, SAT), payroll providers, biometric devices, and AI-powered features. Ensure full regulatory compliance.

---

### 4.1 Government Reporting Integration

**Priority:** P1 (High)  
**Estimated Time:** 5-6 days

#### IMSS Integration (Mexican Social Security):

**Features:**
- [ ] Employee registration (Alta ante IMSS)
- [ ] Employee deregistration (Baja ante IMSS)
- [ ] Salary reporting (SUA file generation)
- [ ] Employee movement reporting
- [ ] IMSS contribution calculation
- [ ] Digital stamp generation

**File Generation:**
- [ ] SUA format files (salary updates)
- [ ] IDSE format files (employee movements)
- [ ] SIPARE format files (contributions)
- [ ] Download pre-filled forms

#### SAT Integration (Tax Authority):

**Features:**
- [ ] RFC validation
- [ ] CURP validation
- [ ] Payroll CFDI generation (future)
- [ ] Tax withholding calculation
- [ ] Annual salary certificate (Constancia de Retenciones)
- [ ] SAT form filling (formatos del SAT)

#### Government Compliance Reports:

**Reports:**
- [ ] Monthly IMSS contribution report
- [ ] Annual salary report (Decreto)
- [ ] Employee list for labor inspection
- [ ] Work risk report (STPS)
- [ ] Gender equity report (NOM-025)
- [ ] Training compliance report (DC-3 forms)

#### Components:

```
app/dashboard/compliance/
├── page.tsx                          # Compliance dashboard
├── imss/
│   ├── page.tsx                      # IMSS integration
│   ├── altas/
│   │   └── page.tsx                  # Employee registration
│   ├── bajas/
│   │   └── page.tsx                  # Employee deregistration
│   └── reports/
│       └── page.tsx                  # IMSS reports
├── sat/
│   ├── page.tsx                      # SAT integration
│   └── reports/
│       └── page.tsx                  # SAT reports
└── stps/
    ├── page.tsx                      # Labor inspection (STPS)
    └── reports/
        └── page.tsx                  # STPS reports

components/compliance/
├── imss-registration.tsx
├── imss-deregistration.tsx
├── sua-file-generator.tsx
├── idse-file-generator.tsx
├── sat-rfc-validator.tsx
├── cfdi-payroll-generator.tsx
├── dc3-form-generator.tsx
└── compliance-report-export.tsx
```

---

### 4.2 Payroll Integration

**Priority:** P1 (High)  
**Estimated Time:** 4-5 days

#### Features:

**Data Synchronization:**
- [ ] Employee data export to payroll
- [ ] Attendance/overtime data export
- [ ] Leave data export
- [ ] Salary change notifications
- [ ] Bi-directional sync (payroll → Pulso for cost tracking)

**Supported Payroll Providers:**
- [ ] Manual CSV export (universal)
- [ ] API integration (custom providers)
- [ ] Common Mexican payroll systems:
  - CONTPAQi Nóminas
  - Aspel NOI
  - Oracle HCM
  - SAP SuccessFactors
  - Custom API integration

**Payroll Data in Pulso:**
- [ ] Payslip viewing (employee self-service)
- [ ] Payroll cost analytics (manager view)
- [ ] Payroll error detection (missing data, discrepancies)
- [ ] Payroll approval workflow

#### API Endpoints:

```typescript
// Export payroll data
POST /api/employees/payroll/export
Body: {
  payPeriodStart: "2026-04-01",
  payPeriodEnd: "2026-04-15",
  format: "csv" | "json" | "xml",
  provider: "contpaqi" | "aspel" | "custom"
}

// Import payroll results
POST /api/employees/payroll/import
Body: { payrollData: [...] }

// Get payslip (for employee self-service)
GET /api/employees/{id}/payslips?period=2026-04
```

---

### 4.3 Biometric Device Integration

**Priority:** P2 (Medium)  
**Estimated Time:** 3-4 days

#### Features:

**Device Support:**
- [ ] ZKTeco devices (common in Mexico)
- [ ] Hikvision devices
- [ ] Generic TCP/IP devices
- [ ] USB fingerprint scanners (for enrollment)

**Integration Methods:**
- [ ] Real-time sync (device → API via webhook)
- [ ] Scheduled sync (pull data from device)
- [ ] File import (CSV from device software)

**Data Processing:**
- [ ] Clock-in/out matching with shifts
- [ ] GPS vs. biometric verification
- [ ] Duplicate detection
- [ ] Anomaly detection (buddy punching)

**Biometric Enrollment:**
- [ ] Fingerprint enrollment UI
- [ ] Facial recognition enrollment
- [ ] Device assignment per employee
- [ ] Biometric template storage (encrypted)

#### Components:

```
app/dashboard/labor/biometric/
├── page.tsx                          # Biometric dashboard
├── devices/
│   └── page.tsx                      # Device management
├── sync/
│   └── page.tsx                      # Sync status
└── enrollment/
    └── page.tsx                      # Biometric enrollment

components/labor/
├── biometric-dashboard.tsx
├── device-manager.tsx
├── sync-status.tsx
├── clock-in-matcher.tsx
└── biometric-enrollment.tsx
```

---

### 4.4 AI-Powered Features

**Priority:** P2 (Medium)  
**Estimated Time:** 4-5 days

#### Features:

**AI Document Validation:**
- [ ] ID document OCR and validation (INE, passport)
- [ ] Proof of address validation
- [ ] Tax document validation (RFC registration)
- [ ] Bank statement validation (CLABE verification)
- [ ] Certificate/training document validation

**AI Compliance Checking:**
- [ ] Contract completeness check
- [ ] Missing document detection
- [ ] Compliance risk scoring
- [ ] Anomaly detection in employee data
- [ ] Fraud detection (fake documents, etc.)

**AI Performance Insights:**
- [ ] Performance trend prediction
- [ ] Turnover risk prediction
- [ ] Employee engagement scoring
- [ ] Optimal team composition suggestions
- [ ] Training recommendation

**AI-Powered Search:**
- [ ] Natural language search ("Show me all employees in sales with more than 2 years tenure")
- [ ] Semantic search (find similar employees)
- [ ] Smart suggestions ("You might want to review these 5 expiring documents")

#### Implementation:

```typescript
// lib/ai/document-validation.ts

import { openai } from '@ai-sdk/openai';

export async function validateDocument(
  documentType: string,
  imageUrl: string
): Promise<ValidationResult> {
  const prompt = `
    Validate this ${documentType} document image.
    Check for:
    1. Document authenticity (signs of forgery)
    2. Data extraction (name, date, ID number, etc.)
    3. Expiration date
    4. Overall quality
    
    Return structured JSON with validation results.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      { role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]}
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

---

### 4.5 Advanced Compliance & Audit

**Priority:** P1 (High)  
**Estimated Time:** 3-4 days

#### Features:

**NOM-035 Compliance (Psychosocial Risk Prevention):**
- [ ] Work environment surveys
- [ ] Risk factor identification
- [ ] Preventive measure tracking
- [ ] Compliance reporting
- [ ] Employee wellbeing monitoring

**NOM-251 Compliance (Food Safety in HORECA):**
- [ ] Health certificate tracking
- [ ] Training compliance
- [ ] Incident reporting
- [ ] Audit trail

**Labor Law Compliance (LFT):**
- [ ] Maximum work hours enforcement (8h/day, 48h/week)
- [ ] Overtime calculation (2x first 9h, 3x after)
- [ ] Vacation accrual per seniority table
- [ ] Christmas bonus tracking (Aguinaldo: min 15 days/year)
- [ ] Profit sharing calculation (PTU)
- [ ] Seniority bonus tracking (Prima de Antigüedad)
- [ ] Termination compliance (severance calculation)

**Audit Readiness:**
- [ ] Complete audit trail for all employee actions
- [ ] Data retention policy enforcement
- [ ] Privacy compliance (LFPDPPP - Mexican data protection law)
- [ ] GDPR compliance (if applicable)
- [ ] Export audit logs for external auditors
- [ ] Compliance score dashboard

#### Components:

```
app/dashboard/compliance/audit/
├── page.tsx                          # Audit readiness dashboard
├── nom035/
│   └── page.tsx                      # NOM-035 compliance
├── nom251/
│   └── page.tsx                      # NOM-251 compliance
├── lft/
│   └── page.tsx                      # LFT compliance
└── data-protection/
    └── page.tsx                      # Data privacy compliance

components/compliance/
├── nom035-survey.tsx
├── nom035-report.tsx
├── lft-compliance-checker.tsx
├── aguinaldo-calculator.tsx
├── ptu-calculator.tsx
├── severance-calculator.tsx
├── audit-log-export.tsx
└── compliance-scorecard.tsx
```

---

### 4.6 Mobile App Support

**Priority:** P2 (Medium)  
**Estimated Time:** 4-5 days

#### Features:

**Responsive Web App:**
- [ ] Mobile-optimized employee directory
- [ ] Mobile-optimized profile view
- [ ] Touch-friendly forms
- [ ] Mobile camera integration (document upload)
- [ ] Mobile GPS for clock-in verification

**Progressive Web App (PWA):**
- [ ] Install on mobile devices
- [ ] Offline mode (view cached data)
- [ ] Push notifications
- [ ] Background sync

**Mobile-Specific Features:**
- [ ] QR code employee ID
- [ ] Mobile clock-in with GPS + photo
- [ ] Mobile document scanning
- [ ] Mobile signature capture
- [ ] Biometric authentication (Face ID, Touch ID)

---

### Phase 4 Deliverables Summary

| Deliverable | Priority | Est. Time | Dependencies |
|-------------|----------|-----------|--------------|
| Government Reporting (IMSS/SAT) | P1 | 5-6 days | Phase 3 Complete |
| Payroll Integration | P1 | 4-5 days | Phase 3 Complete |
| Biometric Integration | P2 | 3-4 days | Phase 3 Complete |
| AI-Powered Features | P2 | 4-5 days | Phase 3 Complete |
| Advanced Compliance & Audit | P1 | 3-4 days | Phase 3 Complete |
| Mobile App Support | P2 | 4-5 days | Phase 3 Complete |
| **TOTAL** | | **23-29 days** | |

---

## Implementation Timeline

### Week-by-Week Breakdown

```
Week 1-2:   Phase 1.5 - Employee Directory & Profile UI
Week 3:     Phase 1.5 - Self-Service & Contract UI
Week 4:     Phase 1.5 - Onboarding/Offboarding UI
Week 5:     Phase 2 - Performance Review System
Week 6:     Phase 2 - Leave Management & Document Automation
Week 7:     Phase 2 - RBAC & Communications
Week 8:     Phase 3 - Employee Analytics Dashboard
Week 9:     Phase 3 - Reporting Engine & Search
Week 10:    Phase 4 - Government Reporting (IMSS/SAT)
Week 11:    Phase 4 - Payroll & Biometric Integration
Week 12:    Phase 4 - AI Features & Advanced Compliance
Week 13:    Phase 4 - Mobile Support & Final Testing
Week 14:    Buffer, Bug Fixes, Documentation
```

### Milestone Dates

| Milestone | Target Date | Deliverables |
|-----------|-------------|--------------|
| **M1: Employee Profile UI Complete** | Week 4 | Directory, Profile, Self-Service |
| **M2: Advanced HR Features Complete** | Week 7 | Performance, Leave, RBAC |
| **M3: Analytics & Reporting Complete** | Week 9 | Dashboards, Reports, Search |
| **M4: Integrations Complete** | Week 12 | IMSS, SAT, Payroll, AI |
| **M5: Production Ready** | Week 14 | Testing, Documentation, Launch |

---

## Resource Requirements

### Development Team

| Role | Count | Responsibilities |
|------|-------|------------------|
| Frontend Developer | 1-2 | UI components, responsive design, state management |
| Backend Developer | 1-2 | API endpoints, database, integrations |
| Full-Stack Developer | 1 | End-to-end features, code review |
| QA Engineer | 1 | Testing, bug reporting, automation |
| UI/UX Designer | 0.5 | Wireframes, prototypes, design system |
| DevOps Engineer | 0.5 | Deployment, monitoring, performance |

### Technology Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| Frontend | React, Next.js 16, TypeScript | UI framework |
| UI Components | shadcn/ui, Radix UI | Component library |
| Styling | Tailwind CSS | CSS framework |
| State Management | React Hook Form, Zustand | Form state, app state |
| Charts | Recharts, Chart.js | Data visualization |
| Tables | @tanstack/react-table | Data tables |
| Backend | Next.js API Routes, Drizzle ORM | API, database |
| Database | PostgreSQL | Data storage |
| AI | OpenAI GPT-4, Moondream | Document validation, insights |
| Storage | Cloudflare R2 | Document storage |
| Authentication | Better Auth | User authentication |
| WhatsApp | WasenderAPI | Notifications |

---

## Risk Management

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database migration failures | Medium | High | Test migrations on staging, backup before migration |
| API performance degradation | Medium | Medium | Implement caching, pagination, query optimization |
| Third-party API changes (IMSS, SAT) | Low | High | Abstract integrations, implement fallbacks |
| AI accuracy issues | Medium | Medium | Human-in-the-loop validation, fallback to manual |
| Mobile responsiveness issues | Low | Medium | Mobile-first design, extensive testing |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Changing regulatory requirements | Medium | High | Regular compliance review, flexible architecture |
| User adoption resistance | Medium | Medium | User training, intuitive UI, gradual rollout |
| Data privacy concerns | Low | High | Implement LFPDPPP compliance, encryption, audit logs |
| Integration with legacy systems | High | Medium | API abstraction layer, manual import/export fallback |

### Schedule Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | High | High | Strict scope management, phase backlog for new features |
| Developer availability | Low | High | Documentation, pair programming, knowledge sharing |
| Testing delays | Medium | Medium | Automated testing, continuous integration |
| Deployment issues | Low | High | Staging environment, rollback procedures |

---

## Success Criteria

### Phase 1.5 Success Criteria

- [ ] Employee directory loads in <2 seconds with 1000 employees
- [ ] Employee profile page displays all data correctly
- [ ] Self-service portal allows employees to view/edit permitted fields
- [ ] Contract management UI creates/edits contracts successfully
- [ ] Onboarding/offboarding workflows guide users through process
- [ ] Audit trail displays all changes with proper formatting
- [ ] Mobile-responsive design works on all screen sizes
- [ ] Zero critical bugs in production

### Phase 2 Success Criteria

- [ ] Performance review system supports self, manager, peer, and 360 reviews
- [ ] Leave management handles all Mexican law leave types
- [ ] Document automation reduces manual document tracking by 50%
- [ ] RBAC enforces field-level permissions correctly
- [ ] Employee communications reach intended recipients
- [ ] User satisfaction score > 4/5

### Phase 3 Success Criteria

- [ ] Analytics dashboard loads in <3 seconds
- [ ] All standard reports generate correctly
- [ ] Custom report builder creates functional reports
- [ ] Advanced search returns results in <1 second
- [ ] API response times <500ms for all endpoints
- [ ] Database query optimization reduces load by 30%

### Phase 4 Success Criteria

- [ ] IMSS/SAT integrations generate correct files
- [ ] Payroll integration exports/imports data accurately
- [ ] Biometric devices sync successfully
- [ ] AI document validation accuracy > 90%
- [ ] Compliance score reflects actual compliance status
- [ ] Mobile app works on iOS and Android devices
- [ ] All regulatory requirements met (LFT, NOM-035, NOM-251, LFPDPPP)

---

## Appendix

### A. Database Schema Diagram

```
[Phase 1 Tables]                    [Phase 2 Tables]
┌─────────────────┐                ┌──────────────────────┐
│ users           │                │ performance_reviews  │
│ employee_       │                │ performance_criteria │
│   profiles      │◄──────┐        │ performance_goals    │
│ employee_       │       │        │ leaveTypes           │
│   contracts     │       │        │ leaveRequests        │
│ salary_history  │       │        │ leaveBalances        │
│ employee_       │       │        └──────────────────────┘
│   audit_logs    │       │
│ employee_       │       │        [Phase 4 Tables]
│   onboarding    │       │        ┌──────────────────────┐
│ onboarding_     │       │        │ payroll_exports      │
│   steps         │       │        │ biometric_devices    │
│ employee_       │       │        │ biometric_logs       │
│   offboarding   │       │        │ ai_validations       │
│ employee_       │       │        │ compliance_reports   │
│   benefits      │       │        │ government_filings   │
│ employee_       │       │        └──────────────────────┘
│   training      │       │
│ vacation_       │       │
│   accruals      │       │
└─────────────────┘       │
                          │
┌─────────────────┐       │
│ companies       │───────┘
│ branches        │
│ shiftSessions   │
│ plannedShifts   │
│ employee_       │
│   documents     │
│ vacation_       │
│   requests      │
└─────────────────┘
```

### B. API Endpoint Summary

| Phase | Endpoint | Methods | Purpose |
|-------|----------|---------|---------|
| 1 | `/api/employees` | GET, POST, PATCH | Employee profiles |
| 1 | `/api/employees/[id]` | GET, DELETE | Employee detail |
| 1 | `/api/employees/contracts` | GET, POST, PATCH | Contract management |
| 1 | `/api/employees/audit` | GET, POST | Audit logs |
| 1 | `/api/employees/lifecycle` | GET, POST, PATCH, PUT | Onboarding/offboarding |
| 2 | `/api/performance/reviews` | GET, POST, PATCH | Performance reviews |
| 2 | `/api/performance/goals` | GET, POST, PATCH | Performance goals |
| 2 | `/api/leave/types` | GET, POST, PATCH | Leave types |
| 2 | `/api/leave/requests` | GET, POST, PATCH | Leave requests |
| 2 | `/api/leave/balances` | GET, POST, PATCH | Leave balances |
| 2 | `/api/employees/documents/expiring` | GET | Expiring documents |
| 2 | `/api/employees/documents/reminders` | POST | Send reminders |
| 2 | `/api/employees/contracts/generate` | POST | Generate contracts |
| 4 | `/api/compliance/imss/altas` | GET, POST | IMSS registration |
| 4 | `/api/compliance/imss/bajas` | GET, POST | IMSS deregistration |
| 4 | `/api/compliance/sat/rfc/validate` | POST | RFC validation |
| 4 | `/api/payroll/export` | POST | Payroll export |
| 4 | `/api/payroll/import` | POST | Payroll import |
| 4 | `/api/biometric/sync` | GET, POST | Biometric sync |
| 4 | `/api/ai/validate-document` | POST | AI document validation |

### C. File Structure (Complete)

```
pulso29/
├── app/
│   └── dashboard/
│       ├── employees/                    # NEW: Employee management
│       │   ├── page.tsx                  # Employee directory
│       │   ├── [id]/
│       │   │   ├── page.tsx              # Employee profile
│       │   │   └── audit/
│       │   │       └── page.tsx          # Audit trail
│       │   ├── onboarding/
│       │   │   ├── page.tsx              # Onboarding dashboard
│       │   │   ├── [id]/
│       │   │   │   └── page.tsx          # Onboarding detail
│       │   │   └── new/
│       │   │       └── page.tsx          # Create onboarding
│       │   └── offboarding/
│       │       ├── page.tsx              # Offboarding dashboard
│       │       ├── [id]/
│       │       │   └── page.tsx          # Offboarding detail
│       │       └── new/
│       │           └── page.tsx          # Create offboarding
│       ├── profile/                      # NEW: Self-service portal
│       │   ├── page.tsx                  # Profile overview
│       │   ├── personal-info.tsx
│       │   ├── my-contracts.tsx
│       │   ├── my-documents.tsx
│       │   └── my-schedule.tsx
│       ├── performance/                  # NEW: Performance management
│       │   ├── page.tsx                  # Performance dashboard
│       │   ├── reviews/
│       │   └── goals/
│       ├── analytics/                    # NEW: Analytics
│       │   └── employees/
│       │       ├── page.tsx              # Analytics dashboard
│       │       ├── workforce/
│       │       ├── compensation/
│       │       ├── attendance/
│       │       └── compliance/
│       ├── reports/                      # NEW: Reporting
│       │   ├── page.tsx                  # Reports dashboard
│       │   ├── standard/
│       │   ├── custom/
│       │   └── scheduled/
│       ├── compliance/                   # NEW: Compliance
│       │   ├── page.tsx                  # Compliance dashboard
│       │   ├── imss/
│       │   ├── sat/
│       │   ├── stps/
│       │   ├── audit/
│       │   └── data-protection/
│       └── labor/                        # EXISTING: Labor management
│           ├── attendance/
│           ├── breaks/
│           ├── documents/
│           ├── geolocation/
│           ├── holidays/
│           ├── overtime/
│           ├── schedule-builder/
│           ├── shift-changes/
│           ├── shifts/
│           ├── vacations/
│           └── violations/
├── components/
│   └── employees/                        # NEW: Employee components
│       ├── employee-directory.tsx
│       ├── employee-table.tsx
│       ├── employee-filters.tsx
│       ├── employee-card.tsx
│       ├── employee-header.tsx
│       ├── personal-info-form.tsx
│       ├── contract-timeline.tsx
│       ├── salary-history-chart.tsx
│       ├── document-grid.tsx
│       ├── onboarding-progress.tsx
│       ├── audit-log-table.tsx
│       └── ... (40+ more components per plan)
├── app/api/
│   └── employees/                        # NEW: Employee APIs
│       ├── route.ts
│       ├── [id]/
│       │   └── route.ts
│       ├── contracts/
│       │   └── route.ts
│       ├── audit/
│       │   └── route.ts
│       └── lifecycle/
│           └── route.ts
└── lib/
    ├── db/
    │   └── schema.ts                     # UPDATED: New tables
    └── rbac/
        └── employee-permissions.ts       # NEW: Permission rules
```

### D. Glossary

| Term | Definition |
|------|------------|
| LFT | Ley Federal del Trabajo (Mexican Federal Labor Law) |
| IMSS | Instituto Mexicano del Seguro Social (Mexican Social Security) |
| SAT | Servicio de Administración Tributaria (Tax Authority) |
| STPS | Secretaría del Trabajo y Previsión Social (Labor Department) |
| CURP | Clave Única de Registro de Población (Population Registry Code) |
| RFC | Registro Federal de Contribuyentes (Tax ID) |
| NSS | Número de Seguro Social (Social Security Number) |
| CLABE | Clave Bancaria Estandarizada (Standardized Bank Account Number) |
| NOM | Norma Oficial Mexicana (Official Mexican Standard) |
| SUA | Sistema Único de Autodeterminación (IMSS contribution system) |
| IDSE | Instituto Mexicano del Seguro Social - Digital Services |
| CFDI | Comprobante Fiscal Digital por Internet (Digital Tax Receipt) |
| PTU | Utilidades (Profit Sharing) |
| LFPDPPP | Ley Federal de Protección de Datos Personales (Data Protection Law) |

---

**Document Version:** 1.0  
**Last Updated:** April 13, 2026  
**Owner:** Development Team  
**Next Review:** After Phase 1.5 completion
