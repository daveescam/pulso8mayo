import { z } from 'zod';

/**
 * Validation schemas for Workflow Scheduling API
 */

// Schedule Frequency
export const scheduleFrequencySchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ONCE']);

// Assignment Type
export const assignmentTypeSchema = z.enum(['ROLE', 'USER', 'AUTO', 'MANUAL']);

// Priority
export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// Role
export const roleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'SUPERVISOR', 'EMPLEADO', 'READONLY']);

// Assignment Status
export const assignmentStatusSchema = z.enum(['PENDING', 'NOTIFIED', 'STARTED', 'COMPLETED', 'OVERDUE']);

/**
 * Create Schedule Schema
 */
export const createScheduleSchema = z.object({
    templateId: z.string().min(1, 'Template ID is required'),
    branchId: z.string().uuid('Invalid branch ID'),
    assignmentType: assignmentTypeSchema,
    assignedRole: roleSchema.optional(),
    assignedUserId: z.string().optional(),
    frequency: scheduleFrequencySchema,
    dayOfWeek: z.number().min(0).max(6).optional(), // 0-6 (Sunday-Saturday)
    dayOfMonth: z.number().min(1).max(31).optional(), // 1-31
    timeOfDay: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()).optional(),
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(500).optional(),
    priority: prioritySchema.optional(),
}).refine((data) => {
    // If assignmentType is ROLE, assignedRole must be provided
    if (data.assignmentType === 'ROLE' && !data.assignedRole) {
        return false;
    }
    // If assignmentType is USER, assignedUserId must be provided
    if (data.assignmentType === 'USER' && !data.assignedUserId) {
        return false;
    }
    return true;
}, {
    message: 'assignedRole required for ROLE type, assignedUserId required for USER type',
    path: ['assignmentType'],
}).refine((data) => {
    // WEEKLY requires dayOfWeek
    if (data.frequency === 'WEEKLY' && data.dayOfWeek === undefined) {
        return false;
    }
    // MONTHLY requires dayOfMonth
    if (data.frequency === 'MONTHLY' && data.dayOfMonth === undefined) {
        return false;
    }
    return true;
}, {
    message: 'dayOfWeek required for WEEKLY, dayOfMonth required for MONTHLY',
    path: ['frequency'],
});

/**
 * Update Schedule Schema
 */
export const updateScheduleSchema = z.object({
    assignmentType: assignmentTypeSchema.optional(),
    assignedRole: roleSchema.optional(),
    assignedUserId: z.string().optional(),
    frequency: scheduleFrequencySchema.optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    timeOfDay: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    startDate: z.string().datetime().or(z.date()).optional(),
    endDate: z.string().datetime().or(z.date()).optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(500).optional(),
    priority: prioritySchema.optional(),
    isActive: z.boolean().optional(),
});

/**
 * Schedule Filters Schema
 */
export const scheduleFiltersSchema = z.object({
    isActive: z.boolean().optional(),
    frequency: scheduleFrequencySchema.optional(),
    assignmentType: assignmentTypeSchema.optional(),
});

/**
 * Assignment Filters Schema
 */
export const assignmentFiltersSchema = z.object({
    status: assignmentStatusSchema.optional(),
    priority: prioritySchema.optional(),
    isOverdue: z.boolean().optional(),
    dueBefore: z.string().datetime().or(z.date()).optional(),
    dueAfter: z.string().datetime().or(z.date()).optional(),
});

/**
 * Update Assignment Status Schema
 */
export const updateAssignmentStatusSchema = z.object({
    status: assignmentStatusSchema,
});

/**
 * Reassign Workflow Schema
 */
export const reassignWorkflowSchema = z.object({
    newUserId: z.string().min(1, 'User ID is required'),
    notes: z.string().max(500).optional(),
});

/**
 * Type exports
 */
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type ScheduleFilters = z.infer<typeof scheduleFiltersSchema>;
export type AssignmentFilters = z.infer<typeof assignmentFiltersSchema>;
export type UpdateAssignmentStatus = z.infer<typeof updateAssignmentStatusSchema>;
export type ReassignWorkflow = z.infer<typeof reassignWorkflowSchema>;
