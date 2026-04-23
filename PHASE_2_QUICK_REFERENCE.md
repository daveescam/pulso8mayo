# Phase 2 Quick Reference Guide

## 🎯 How to Use Phase 2 Features

---

## 1. Performance Reviews

### Create a New Review
```typescript
POST /api/performance/reviews
Body: {
  userId: "user-uuid",
  reviewerId: "reviewer-uuid",
  companyId: "company-uuid",
  reviewType: "SELF" | "MANAGER" | "PEER" | "360",
  reviewPeriod: "2026-Q1",
  overallRating: 4, // optional
  strengths: "Great team player...",
  areasForImprovement: "Time management...",
}
```

### List Reviews with Filters
```typescript
GET /api/performance/reviews?companyId=xxx&status=COMPLETED&reviewType=MANAGER&page=1&limit=20
```

### Update Review Status
```typescript
PATCH /api/performance/reviews?id=review-uuid
Body: {
  status: "SUBMITTED" // Triggers submittedAt timestamp
}
```

### Create Performance Goal
```typescript
POST /api/performance/goals
Body: {
  userId: "user-uuid",
  companyId: "company-uuid",
  title: "Improve customer satisfaction",
  description: "Achieve 95% satisfaction rating",
  category: "Customer Service",
  targetDate: "2026-12-31",
  status: "IN_PROGRESS"
}
```

### Access Performance Page
Navigate to: `/dashboard/performance`

---

## 2. Leave Management

### Create Leave Type
```typescript
POST /api/leave/types
Body: {
  companyId: "company-uuid",
  name: "VACATION",
  description: "Annual vacation days",
  isPaid: true,
  requiresDocumentation: false,
  maxDaysPerYear: 12,
  accrualRate: 12
}
```

### Request Leave
```typescript
POST /api/leave/requests
Body: {
  userId: "user-uuid",
  companyId: "company-uuid",
  leaveTypeId: "leave-type-uuid",
  startDate: "2026-05-01",
  endDate: "2026-05-05",
  totalDays: 5,
  reason: "Family vacation"
}
```
*Note: Automatically checks balance and rejects if insufficient*

### Approve Leave Request
```typescript
PATCH /api/leave/requests?id=request-uuid&action=approve
Body: {
  approvedBy: "manager-uuid"
}
```
*Note: Updates balance (used +5, pending -5, balance -5)*

### Reject Leave Request
```typescript
PATCH /api/leave/requests?id=request-uuid&action=reject
Body: {
  rejectedBy: "manager-uuid",
  rejectionReason: "Insufficient coverage during period"
}
```

### Get Leave Balances
```typescript
GET /api/leave/balances?userId=user-uuid&companyId=company-uuid&year=2026
```

### Bulk Accrue Leave (Annual)
```typescript
PATCH /api/leave/balances
Body: {
  userIds: ["user1", "user2", ...],
  leaveTypeId: "vacation-type-uuid",
  year: 2026,
  accrualRate: 12
}
```

### Access Leave Page
Navigate to: `/dashboard/labor/leave`

---

## 3. Document Automation

### Get Expiring Documents (Next 30 Days)
```typescript
GET /api/employees/documents/expiring?companyId=company-uuid&days=30
```

### Get Expiring Documents (Next 7 Days)
```typescript
GET /api/employees/documents/expiring?companyId=company-uuid&days=7
```

### Send Expiration Reminders
```typescript
POST /api/employees/documents/expiring
Body: {
  companyId: "company-uuid",
  documentType: "ID", // optional, filter by type
  daysBeforeExpiration: 30
}
```

---

## 4. RBAC Permissions

### Check Permission
```typescript
import { hasPermission } from '@/lib/rbac/employee-permissions';

// Check if user can edit salary
const canEditSalary = hasPermission(
  'ADMIN',           // User role
  'salary',          // Entity
  'edit',            // Action
  'company'          // Scope
);

// Check with conditions
const canReview = hasPermission(
  'SUPERVISOR',
  'performance',
  'edit',
  'team',
  { reviewType: 'MANAGER' }  // Conditions
);
```

### Get Allowed Edit Fields
```typescript
import { getAllowedEditFields } from '@/lib/rbac/employee-permissions';

// For EMPLEADO role
const fields = getAllowedEditFields('EMPLEADO');
// Returns: ['personalEmail', 'personalPhone', 'address', ...]

// For ADMIN role
const adminFields = getAllowedEditFields('ADMIN');
// Returns: ['*'] (all fields)
```

### Check Sensitive Field
```typescript
import { isSensitiveField, maskSensitiveFields } from '@/lib/rbac/employee-permissions';

isSensitiveField('salary'); // true
isSensitiveField('name'); // false

// Mask sensitive fields
const data = { name: 'John', salary: 50000, rfc: 'ABC123' };
const masked = maskSensitiveFields(data, ['name']);
// Returns: { name: 'John', salary: '••••••••', rfc: '••••••••' }
```

---

## 5. Employee Communications

### Create Communication
```typescript
POST /api/communications
Body: {
  companyId: "company-uuid",
  communicationType: "ANNOUNCEMENT",
  title: "Holiday Schedule",
  content: "Office will be closed on...",
  targetType: "COMPANY", // INDIVIDUAL, DEPARTMENT, BRANCH, COMPANY
  targetIds: [], // User IDs if INDIVIDUAL
  isPinned: true,
  deliveredVia: ["EMAIL", "WHATSAPP", "IN_APP"]
}
```

### Send Communication
```typescript
PATCH /api/communications?action=send
Body: {
  communicationId: "comm-uuid",
  sentBy: "user-uuid"
}
```

### Mark as Read
```typescript
PATCH /api/communications?action=mark-read
Body: {
  communicationId: "comm-uuid",
  userId: "user-uuid"
}
```

### List Communications
```typescript
GET /api/communications?companyId=company-uuid&communicationType=ANNOUNCEMENT&status=SENT
```

---

## 🗂️ Database Table Relationships

```
performance_reviews
├── userId → users.id
├── reviewerId → users.id
├── companyId → companies.id
└── branchId → branches.id

performance_review_responses
├── reviewId → performance_reviews.id
└── criteriaId → performance_review_criteria.id

performance_goals
├── userId → users.id
├── companyId → companies.id
└── branchId → branches.id

leave_requests
├── userId → users.id
├── companyId → companies.id
├── branchId → branches.id
└── leaveTypeId → leaveTypes.id

leave_balances
├── userId → users.id
└── leaveTypeId → leaveTypes.id

employee_communications
├── companyId → companies.id
└── branchId → branches.id

communication_read_receipts
├── communicationId → employee_communications.id
└── userId → users.id
```

---

## 🔍 Common Query Patterns

### Get User's Performance Reviews
```sql
SELECT * FROM performance_reviews 
WHERE userId = 'user-uuid' 
AND companyId = 'company-uuid'
ORDER BY reviewDate DESC;
```

### Get Pending Leave Requests
```sql
SELECT lr.*, u.name as userName
FROM leave_requests lr
JOIN users u ON lr.userId = u.id
WHERE lr.status = 'PENDING'
AND lr.companyId = 'company-uuid'
ORDER BY lr.requestedAt ASC;
```

### Get Expiring Documents
```sql
SELECT * FROM employee_documents
WHERE companyId = 'company-uuid'
AND expirationDate BETWEEN NOW() AND NOW() + INTERVAL '30 days'
AND status != 'EXPIRED';
```

### Get Leave Balance Summary
```sql
SELECT 
  lt.name as leaveTypeName,
  lb.totalEntitlement,
  lb.used,
  lb.pending,
  lb.balance
FROM leave_balances lb
JOIN leave_types lt ON lb.leaveTypeId = lt.id
WHERE lb.userId = 'user-uuid'
AND lb.year = 2026;
```

---

## 💡 Tips & Best Practices

### Performance Reviews
1. Always create criteria before starting reviews
2. Use review periods like "2026-Q1", "2026-H1", "2026-ANNUAL"
3. Set status to "SUBMITTED" to trigger notification workflow
4. Overall rating is 1-5 scale

### Leave Management
1. Check balances before approving requests
2. Use bulk accrual at start of year for all employees
3. LFT requires vacation days based on seniority
4. Always provide rejection reason for transparency

### Document Automation
1. Run expiration check daily via cron job
2. Send reminders at 30, 15, 7, and 1 days before expiration
3. Track compliance percentage per department

### RBAC
1. Always check permissions before showing edit forms
2. Mask sensitive fields in API responses
3. Use scope hierarchy: own < team < branch < company < all
4. HR role is separate from ADMIN for compliance

### Communications
1. Use pinned for important announcements
2. Track read receipts for compliance
3. Multi-channel delivery increases reach
4. Target by department for relevant messages

---

## 🐛 Troubleshooting

### Issue: Leave Request Fails with "Insufficient Balance"
**Solution**: Check leave_balances table. Create balance entry if missing:
```typescript
POST /api/leave/balances
Body: {
  userId: "user-uuid",
  leaveTypeId: "type-uuid",
  year: 2026,
  totalEntitlement: 12,
  used: 0,
  pending: 0,
  balance: 12
}
```

### Issue: Performance Review Not Showing
**Solution**: Verify companyId matches and status filter is correct

### Issue: Permission Denied
**Solution**: Check user role in users.role column and verify permission matrix

### Issue: Communications Not Sent
**Solution**: Ensure status is changed from "DRAFT" to "SENT" via PATCH action

---

## 📞 Need Help?

- Check API response bodies for detailed error messages
- Review database schema in `lib/db/schema.ts`
- Check permission matrix in `lib/rbac/employee-permissions.ts`
- Review component implementations for usage examples

---

*Quick Reference for Phase 2 - Employee Record Management System*
