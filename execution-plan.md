
# Compliance Engine & Execution Flow Implementation

## 1. Backend Implementation
- [ ] Create `GET /api/workflows/public/[token]`
    - Validate token using `SmartLinkService`
    - Return instance data, template steps, and assignee info
- [ ] Create `POST /api/workflows/public/[token]/step`
    - Validate token
    - Call `WorkflowExecutionService.updateStep` using the public token context
    - Handle AI verification if enabled

## 2. Frontend Implementation (New)
- [ ] Create `app/workflow/public/[token]/page.tsx`
    - Fetch workflow data server-side or client-side
    - Render `WorkflowStepper` component
- [ ] Create `components/execution/workflow-stepper.tsx`
    - Mobile-responsive UI
    - Progress bar
    - Steps: Instruction, Photo/Text Input, Verification Feedback
    - Completion screen

## 3. Trigger Mechanism
- [ ] Update `app/dashboard/labor/shifts/page.tsx` (or similar)
    - Add button to "Assign Workflow" to a shift
    - Call API to generate link -> Display link or send (mock)
