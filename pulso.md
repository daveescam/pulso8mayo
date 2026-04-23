# Pulso HORECA - Product Requirements Document (PRD)

## Project Overview

Pulso is a comprehensive workflow management platform designed for HORECA (Hotel, Restaurant, and Catering) businesses. The platform focuses on automating compliance processes, managing daily operations, and providing real-time insights through KPI tracking. The system implements a multi-tenant architecture to serve multiple companies and their branches while maintaining strict data isolation.

## Vision Statement

To become the leading compliance and operations management platform for HORECA businesses in Mexico, helping them meet regulatory requirements (NOM-251, NOM-035, Labor Laws) while optimizing daily operations through automated workflows and intelligent reporting.

## Success Metrics

- 95% compliance rate for businesses using the platform
- 50% reduction in time spent on compliance activities
- 80% of daily operational tasks completed through the platform
- 99.9% uptime for mission-critical systems
- Sub-2-second response time for all user interactions

---

## Phase 1: Foundation (Weeks 1-4)

### 1.1 Core Infrastructure

**Priority**: P0 (Critical)
**Dependencies**: None

#### 1.1.1 Database Setup
- **Requirement**: Implement complete database schema using Drizzle ORM
- **Acceptance Criteria**:
  - All tables from schema.ts created in PostgreSQL
  - Foreign key relationships properly configured
  - Indexes created for performance optimization
  - Migration system functional
- **Technical Details**:
  - Use Drizzle Kit for migrations
  - Implement connection pooling (10-30 connections)
  - Set up read replicas for analytics queries
- **Subtasks**:
  - [ ] Initialize Drizzle configuration
  - [ ] Create migration files for all tables
  - [ ] Run initial migration on dev database
  - [ ] Create seed data script
  - [ ] Set up database backup strategy

#### 1.1.2 Authentication System
- **Requirement**: Implement secure user authentication with better auth via neon auth 
- **Acceptance Criteria**:
  - Users can register with email/password
  - OAuth login (Google, Apple) functional
  - Session management with JWT tokens
  - Role-based access control (RBAC) enforced
  - Password reset functionality
- **Technical Details**:
  - 
  - Session expiry: 7 days
  - Implement refresh token rotation
  - Multi-factor authentication optional for admins
- **Subtasks**:
  - [ ] Configure better auth neon  project
  - [ ] Implement registration endpoint
  - [ ] Implement login endpoint
  - [ ] Create authentication middleware
  - [ ] Implement password reset flow
  - [ ] Add OAuth providers
  - [ ] Create user session management

#### 1.1.3 Multi-Tenant Architecture
- **Requirement**: Implement data isolation for companies and branches
- **Acceptance Criteria**:
  - All queries automatically scoped to empresa_id
  - Branch-level data isolation functional
  - Cross-tenant data leakage prevented
  - Tenant context in all API requests
- **Technical Details**:
  - Use middleware to inject tenant context
  - Implement Row-Level Security (RLS) policies
  - Create tenant-aware ORM wrapper
- **Subtasks**:
  - [ ] Create tenant context middleware
  - [ ] Implement tenant-scoped queries
  - [ ] Add tenant validation to all endpoints
  - [ ] Create audit log for tenant access
  - [ ] Test cross-tenant access prevention

#### 1.1.4 API Foundation
- **Requirement**: Create REST API with proper error handling and validation
- **Acceptance Criteria**:
  - RESTful endpoint structure
  - Request validation with Zod schemas
  - Consistent error response format
  - API rate limiting implemented
  - Request logging functional
- **Technical Details**:
  - Use Next.js App Router for API routes
  - Implement Zod for input validation
  - Rate limiting: 100 req/min per user
  - Error codes: 400, 401, 403, 404, 422, 500
- **Subtasks**:
  - [ ] Define API response format standard
  - [ ] Create error handling middleware
  - [ ] Implement request validation middleware
  - [ ] Set up rate limiting
  - [ ] Create API logging system
  - [ ] Document API standards

---

## Phase 2: Core Business Logic (Weeks 5-8)

### 2.1 User Management

**Priority**: P0 (Critical)
**Dependencies**: 1.1 Core Infrastructure

#### 2.1.1 User CRUD Operations
- **Requirement**: Complete user management functionality
- **Acceptance Criteria**:
  - Create user with role assignment
  - Update user profile and settings
  - Soft delete users (archive)
  - List users with filtering and pagination
  - User search by name, email, role
- **API Endpoints**:
  - `POST /api/users` - Create user
  - `GET /api/users` - List users
  - `GET /api/users/:id` - Get user details
  - `PATCH /api/users/:id` - Update user
  - `DELETE /api/users/:id` - Soft delete user
- **Subtasks**:
  - [ ] Create user CRUD API endpoints
  - [ ] Implement Zod validation schemas
  - [ ] Create user service layer
  - [ ] Add pagination and filtering
  - [ ] Implement user search
  - [ ] Add audit logging for user changes
  - [ ] Create user management UI components

#### 2.1.2 Role-Based Permissions
- **Requirement**: Implement granular permission system
- **Acceptance Criteria**:
  - Roles: SUPER_ADMIN, ADMIN, GERENTE, SUPERVISOR, EMPLEADO, READONLY
  - Resource-level permissions (read, write, delete)
  - Permission checking in all protected endpoints
  - UI elements hidden based on permissions
- **Permission Matrix**:
  ```
  SUPER_ADMIN: Full access to everything
  ADMIN: Company-wide access, cannot modify billing
  GERENTE: Branch management, reports, user management
  SUPERVISOR: Workflow assignmenty, reports (read-only)
  EMPLEADO: Execute assigned workflows, view own data
  READONLY: View-only access to reports and data
  ```
- **Subtasks**:
  - [ ] Define permission constants
  - [ ] Create permission checking utility
  - [ ] Implement permission middleware
  - [ ] Add UI permission guards
  - [ ] Create permission testing suite
  - [ ] Document permission matrix

#### 2.1.3 User Profile Management
- **Requirement**: Users can manage their profiles and preferences
- **Acceptance Criteria**:
  - Update personal information
  - Change password
  - Set notification preferences
  - Configure WhatsApp opt-in
  - Upload profile photo
- **Subtasks**:
  - [ ] Create profile update endpoint
  - [ ] Implement password change with validation
  - [ ] Add notification preferences UI
  - [ ] Implement WhatsApp opt-in flow
  - [ ] Add profile photo upload (S3/R2)
  - [ ] Create profile page UI

---

### 2.2 Company & Branch Management

**Priority**: P0 (Critical)
**Dependencies**: 2.1 User Management

#### 2.2.1 Company Registration
- **Requirement**: Onboarding flow for new companies
- **Acceptance Criteria**:
  - Company registration form
  - Business information collection (RFC, address, etc.)
  - Plan selection (FREE, BASIC, PRO, ENTERPRISE)
  - Initial admin user creation
  - Email verification
- **User Flow**:
  1. User fills company information
  2. Selects plan and payment method
  3. Creates admin account
  4. Verifies email
  5. Redirected to dashboard
- **Subtasks**:
  - [ ] Create company registration API
  - [ ] Implement plan management
  - [ ] Create onboarding UI flow
  - [ ] Add email verification
  - [ ] Set up payment integration (Stripe)
  - [ ] Create welcome email template

#### 2.2.2 Branch Management
- **Requirement**: Companies can create and manage multiple branches
- **Acceptance Criteria**:
  - Create branch with unique code
  - Configure branch operating hours
  - Set branch-specific settings
  - Assign branch managers
  - View branch hierarchy
- **API Endpoints**:
  - `POST /api/branches` - Create branch
  - `GET /api/branches` - List branches
  - `PATCH /api/branches/:id` - Update branch
  - `DELETE /api/branches/:id` - Archive branch
- **Subtasks**:
  - [ ] Create branch CRUD endpoints
  - [ ] Implement branch code generation
  - [ ] Add operating hours configuration
  - [ ] Create branch settings management
  - [ ] Implement branch assignment logic
  - [ ] Create branch management UI
  - [ ] Add branch switching for multi-location users

#### 2.2.3 Business Hours & Shifts
- **Requirement**: Configure work schedules and shifts
- **Acceptance Criteria**:
  - Define shift types (MATUTINO, VESPERTINO, NOCTURNO, MIXTO)
  - Set shift hours and break times
  - Assign employees to shifts
  - Configure holiday schedules
- **Subtasks**:
  - [ ] Create shift configuration API
  - [ ] Implement shift assignment
  - [ ] Add holiday calendar
  - [ ] Create shift management UI
  - [ ] Implement shift change requests

---

## Phase 3: Workflow Engine (Weeks 9-12)

### 3.1 Core Workflow System

**Priority**: P0 (Critical)
**Dependencies**: 2.2 Company & Branch Management

#### 3.1.1 Workflow Template Builder
- **Requirement**: Drag-and-drop visual builder for creating custom workflows
- **Acceptance Criteria**:
  - Visual interface for building workflows
  - Support for multiple step types (text, number, yes/no, photo, etc.)
  - Step validation and conditional logic
  - Template saving and versioning
- **Technical Details**:
  - JSON-based workflow definition schema
  - Template storage in `flow_templates` table
  - Validation with Zod schemas
  - Support for 100+ steps per workflow
- **Subtasks**:
  - [ ] Create workflow builder UI components
  - [ ] Implement step type definitions
  - [ ] Add validation and conditional logic
  - [ ] Create template save/load functionality
  - [ ] Implement version control for templates
  - [ ] Add template duplication feature

#### 3.1.2 Workflow Execution Engine
- **Requirement**: Execute assigned workflows with evidence collection via multiple channels
- **Acceptance Criteria**:
  - Display workflow instance with all steps
  - Collect input based on step type
  - Upload evidence (photos, signatures, etc.)
  - Auto-save progress every 30 seconds
  - Mark workflow as complete
  - Support for WhatsApp smartlink execution
  - Multi-stepper UI for seamless navigation
  - Conditional logic execution (if-this-then-that)
  - Real-time progress synchronization across devices
  - Support for offline completion with sync when online
  - WhatsApp notification delivery with smartlinks to specific workflow instances
  - Role-based workflow access via WhatsApp smartlinks
  - Photo evidence submission via web app multistepper mobile responsive with AI verification
  - Conditional alert escalation based on workflow responses
- **Technical Details**:
  - Real-time state management
  - Optimistic UI updates with rollback on failure
  - Photo upload with compression (max 2MB per photo)
  - Progress indicator accurate to step level
  - Smartlink integration with role-based access
  - Conditional workflow branching based on responses
  - Multi-stepper UI with progress indicators, step navigation, and responsive design
  - Support for all step types: text input, number, yes/no, multiple choice, photo, signature, checklist, timer
  - Offline-first architecture with automatic sync
  - WhatsApp WASENDER API integration for smartlink delivery
  - Role-based access control for workflow instances accessed via WhatsApp
  - Conditional logic engine for alert escalation based on workflow responses
- **Subtasks**:
  - [ ] Create workflow execution UI
  - [ ] Implement step navigation
  - [ ] Add evidence collection functionality
  - [ ] Implement auto-save mechanism
  - [ ] Create workflow completion logic
  - [ ] Add progress tracking
  - [ ] Implement multi-stepper UI component
  - [ ] Add conditional logic engine
  - [ ] Create smartlink generation system
  - [ ] Implement role-based workflow assignment
  - [ ] Add offline capability with sync
  - [ ] Create responsive design for mobile
  - [ ] Implement all step type components
  - [ ] Add progress synchronization
  - [ ] Integrate with WhatsApp WASENDER API
  - [ ] Create smartlink notification system
  - [ ] Implement role-based access for WhatsApp workflows
  - [ ] Add photo submission via WhatsApp/webapp multistepper mobile responsive
  - [ ] Create conditional alert triggers based on workflow responses
  - [ ] Implement escalation logic for failed verifications

#### 3.1.3 WhatsApp Smartlink Workflow Execution
- **Requirement**: Enable workflow execution through WhatsApp smartlinks with role-based access and AI verification
- **Acceptance Criteria**:
  - Workflow notifications delivered via WhatsApp with smartlinks
  - Smartlinks contain workflow template ID and role-based access token
  - Users can execute workflows directly from WhatsApp smartlinks
  - Multi-stepper UI accessible via smartlink with all workflow steps
  - Photo evidence collected and sent to AI verification service
  - Conditional alerts triggered based on AI verification results
  - Escalation system for failed verifications or non-compliance
  - Real-time progress synchronization between WhatsApp and web/mobile interfaces
- **Technical Details**:
  - Smartlink contains encrypted workflow instance ID and user role
  - Token-based authentication for workflow access
  - Seamless transition from WhatsApp to web workflow interface
  - Integration with AI verification services for photo evidence
  - Conditional logic engine for alert escalation
  - Real-time progress synchronization across platforms
- **Subtasks**:
  - [ ] Create smartlink generation with encrypted tokens
  - [ ] Implement token-based authentication for workflows
  - [ ] Develop seamless transition from WhatsApp to web interface
  - [ ] Integrate AI verification for photo evidence
  - [ ] Create conditional alert triggers based on AI results
  - [ ] Implement escalation system for failed verifications
  - [ ] Add real-time progress synchronization
  - [ ] Create error handling for invalid smartlinks
  - [ ] Implement role-based access validation
  - [ ] Add notification delivery via WhatsApp WASENDER API

#### 3.1.4 Workflow Assignment & Scheduling
- **Requirement**: Assign workflows to users and schedule recurring tasks
- **Acceptance Criteria**:
  - Assign workflows to specific users/roles
  - Schedule recurring workflows (daily, weekly, etc.)
  - Send notifications for upcoming tasks
  - Track completion status
- **Subtasks**:
  - [ ] Create workflow assignment API
  - [ ] Implement scheduling system
  - [ ] Add notification system
  - [ ] Create workflow dashboard
  - [ ] Add completion tracking

---

## Phase 4: Compliance Intelligence (Weeks 13-16)

### 4.1 Compliance Automation

**Priority**: P1 (High)
**Dependencies**: 3.1 Core Workflow System

#### 4.1.1 Compliance Template Tagging
- **Requirement**: Tag workflows with compliance metadata
- **Acceptance Criteria**:
  - Ability to tag workflows with compliance types (NOM-251, NOM-035, etc.)
  - Store compliance metadata with each template
  - Calculate compliance scores automatically
  - Generate compliance alerts
- **Technical Details**:
  - Metadata includes: complianceType, regulationSection, requiredFrequency, auditable, criticalForCompliance
  - Pre-built templates have metadata filled in automatically
  - Custom workflows can be tagged optionally
- **Subtasks**:
  - [ ] Add compliance metadata fields to templates
  - [ ] Create compliance tagging UI
  - [ ] Implement compliance scoring algorithm
  - [ ] Add compliance alert system
  - [ ] Create compliance dashboard

#### 4.1.2 Compliance Report Generator
- **Requirement**: Generate audit-ready compliance reports
- **Acceptance Criteria**:
  - Generate NOM-251 audit reports (COFEPRIS)
  - Generate NOM-035 psychosocial risk reports (STPS)
  - Export reports in multiple formats (PDF, Excel)
  - Include all required evidence and signatures
- **Technical Details**:
  - Reports include: completed workflows, evidence, signatures, timestamps
  - Automatic calculation of compliance percentages
  - Historical tracking of compliance trends
- **Subtasks**:
  - [ ] Create report generation engine
  - [ ] Implement NOM-251 report format
  - [ ] Implement NOM-035 report format
  - [ ] Add export functionality (PDF, Excel)
  - [ ] Create report scheduling system

#### 4.1.3 Compliance Monitoring Dashboard
- **Requirement**: Real-time compliance monitoring and alerts
- **Acceptance Criteria**:
  - Visual compliance scorecards
  - Upcoming compliance deadlines
  - Non-compliance alerts
  - Historical compliance trends
- **Subtasks**:
  - [ ] Create compliance dashboard UI
  - [ ] Implement real-time scorecards
  - [ ] Add deadline tracking
  - [ ] Create alert system
  - [ ] Add historical trend visualization

---



---

## Phase 6: Labor Management (Weeks 21-24)

### 6.1 Labor Tracking System

**Priority**: P1 (High)
**Dependencies**: 2.2 Company & Branch Management

#### 6.1.1 Work Schedule Management
- **Requirement**: Define and manage work schedules
- **Acceptance Criteria**:
  - Create different shift types (MATUTINO, VESPERTINO, etc.)
  - Assign employees to schedules
  - Track work hours and breaks
  - Handle overtime calculations
- **Technical Details**:
  - Schedules linked to empresa_id and sucursal_id
  - Support for flexible scheduling
  - Automatic break tracking
- **Subtasks**:
  - [ ] Create schedule management API
  - [ ] Implement schedule builder UI
  - [ ] Add employee assignment functionality
  - [ ] Create time tracking system
  - [ ] Add overtime calculation

#### 6.1.2 Time & Attendance
- **Requirement**: Track employee attendance and working hours
- **Acceptance Criteria**:
  - Clock in/out functionality
  - Break tracking
  - Overtime monitoring
  - Attendance reports
- **Technical Details**:
  - Integration with workflow completion for time tracking
  - Geolocation verification for remote workers
  - Multiple clock-in methods (whatsapp , workflow)
- **Subtasks**:
  - [ ] Create time tracking API
  - [ ] Implement clock in/out UI
  - [ ] Add geolocation verification
  - [ ] Create attendance reports
  - [ ] Integrate with workflow system

#### 6.1.3 Labor Analytics
- **Requirement**: Analyze labor efficiency and costs
- **Acceptance Criteria**:
  - Labor cost tracking
  - Productivity metrics
  - Overtime analysis
  - Schedule optimization suggestions
- **Subtasks**:
  - [ ] Create labor analytics engine
  - [ ] Implement cost tracking
  - [ ] Add productivity metrics
  - [ ] Create overtime analysis
  - [ ] Add optimization suggestions

---

## Phase 7: KPI & Analytics (Weeks 25-28)

### 7.1 KPI Tracking System

**Priority**: P1 (High)
**Dependencies**: 3.1 Core Workflow System, 6.1 Labor System

#### 7.1.1 KPI Definition & Configuration
- **Requirement**: Define and configure custom KPIs
- **Acceptance Criteria**:
  - Create custom KPIs with formulas
  - Set targets and thresholds
  - Configure alert conditions
  - Schedule KPI calculations
- **Technical Details**:
  - Support for multiple metric types (percentage, count, average, sum)
  - Flexible calculation formulas
  - Period-based targets (daily, weekly, monthly)
- **Subtasks**:
  - [ ] Create KPI definition API
  - [ ] Implement KPI builder UI
  - [ ] Add target configuration
  - [ ] Create alert system
  - [ ] Add calculation scheduler

#### 7.1.2 KPI Dashboard & Visualization
- **Requirement**: Visualize KPIs with charts and graphs
- **Acceptance Criteria**:
  - Interactive dashboards
  - Multiple chart types
  - Drill-down capabilities
  - Export functionality
- **Technical Details**:
  - Real-time KPI updates
  - Responsive design for mobile devices
  - Customizable dashboards
- **Subtasks**:
  - [ ] Create dashboard UI
  - [ ] Implement charting system
  - [ ] Add drill-down functionality
  - [ ] Create export features
  - [ ] Add customization options

#### 7.1.3 KPI Alerts & Notifications
- **Requirement**: Alert users when KPIs breach thresholds
- **Acceptance Criteria**:
  - Configurable alert thresholds
  - Multiple notification channels
  - Escalation procedures
  - Alert acknowledgment system
- **Subtasks**:
  - [ ] Create alert configuration
  - [ ] Implement notification system
  - [ ] Add escalation procedures
  - [ ] Create acknowledgment system
  - [ ] Add alert history tracking

---

## Phase 8: Advanced Features (Weeks 29-32)