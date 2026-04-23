# Analytics Implementation

## 1. Backend
- [ ] Implement `calculateScore` in `WorkflowExecutionService`.
- [ ] Create `GET /api/analytics/compliance`
    - Returns:
        - Overall Compliance Score (Avg of instance scores)
        - Total Inspections (Count of instances)
        - Open Incidents (Count of active incidents)

## 2. Frontend
- [ ] Create `app/dashboard/components/compliance-chart.tsx`
    - Use `recharts` or simple progress bars.
- [ ] Update `app/dashboard/page.tsx` to include this chart.
