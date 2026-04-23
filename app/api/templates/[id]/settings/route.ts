
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { WorkflowScheduleService } from '@/lib/services/workflow-schedule-service';
import { WorkflowTriggerService } from '@/lib/services/workflow-trigger-service';
import { z } from 'zod';

const scheduleSchema = z.object({
    enabled: z.boolean(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'on_demand']),
    shiftTimes: z.record(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)),
    days: z.array(z.string()).optional(),
    assignedRoles: z.array(z.string()).optional(),
    assignedShifts: z.array(z.string()).optional(),
    autoAssign: z.boolean(),
    triggers: z.array(z.object({
        eventName: z.string(),
        conditions: z.record(z.any()).optional()
    })).optional()
});

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        const user = session?.user as any; // Cast to any to avoid TS errors for implicit custom fields

        if (!user?.email || !user?.branchId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const templateId = params.id;
        const branchId = user.branchId;

        console.log(`[API] Fetching schedule settings for template ${templateId} in branch ${branchId}`);

        // Get existing schedule & triggers
        const [schedule, triggers] = await Promise.all([
            WorkflowScheduleService.getScheduleByTemplateId(templateId, branchId),
            WorkflowTriggerService.getTriggersForTemplate(templateId, branchId)
        ]);

        if (!schedule) {
            // Return defaults if no schedule exists
            return NextResponse.json({
                settings: {
                    enabled: false,
                    frequency: 'daily',
                    shiftTimes: {
                        morning: '08:00',
                        afternoon: '15:00',
                        night: '23:00',
                        all: '08:00'
                    },
                    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                    assignedRoles: ['EMPLEADO'],
                    assignedShifts: ['morning'],
                    autoAssign: true,
                    triggers: triggers.map(t => ({
                        eventName: t.eventName,
                        conditions: t.conditions
                    }))
                }
            });
        }

        // Map DB model to frontend settings format
        // Handle both old format (single timeOfDay) and new format (JSON shiftTimes)
        let shiftTimes: Record<string, string>;
        try {
            // Try to parse as JSON first (new format)
            shiftTimes = schedule.timeOfDay ? JSON.parse(schedule.timeOfDay) : {
                morning: '08:00',
                afternoon: '15:00',
                night: '23:00',
                all: '08:00'
            };
        } catch {
            // Fallback to old format - use single time for all shifts
            const singleTime = schedule.timeOfDay || '08:00';
            shiftTimes = {
                morning: singleTime,
                afternoon: singleTime,
                night: singleTime,
                all: singleTime
            };
        }

        const settings = {
            enabled: schedule.isActive,
            frequency: schedule.frequency.toLowerCase(),
            shiftTimes,
            days: schedule.dayOfWeek !== null
                ? [getDayName(schedule.dayOfWeek)]
                : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            assignedRoles: schedule.assignedRole ? [schedule.assignedRole] : [],
            assignedShifts: [],
            autoAssign: schedule.assignmentType === 'AUTO',
            triggers: triggers.map(t => ({
                eventName: t.eventName,
                conditions: t.conditions
            }))
        };

        return NextResponse.json({ settings });

    } catch (error: any) {
        console.error('[API] Error fetching schedule settings:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        const user = session?.user as any;

        if (!user?.email || !user?.branchId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const templateId = params.id;
        const branchId = user.branchId;
        const body = await req.json();

        // Validate body
        const validation = scheduleSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid settings', details: validation.error.format() },
                { status: 400 }
            );
        }

        const data = validation.data;
        console.log(`[API] Saving schedule settings for template ${templateId}`, data);

        // Check if schedule exists
        const existingSchedule = await WorkflowScheduleService.getScheduleByTemplateId(templateId, branchId);

        // Map frontend frequency to DB enum
        const dbFrequency = data.frequency.toUpperCase() as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';

        let dayOfWeek: number | undefined;
        if (dbFrequency === 'WEEKLY' && data.days && data.days.length > 0) {
            dayOfWeek = getDayNumber(data.days[0]);
        }

        const scheduleData = {
            templateId,
            branchId,
            assignmentType: data.autoAssign ? 'AUTO' : 'ROLE',
            assignedRole: data.assignedRoles && data.assignedRoles.length > 0 ? data.assignedRoles[0] as any : null,
            frequency: dbFrequency,
            timeOfDay: JSON.stringify(data.shiftTimes), // Store as JSON
            dayOfWeek: dayOfWeek,
            startDate: new Date(),
            title: `Schedule for ${templateId}`,
            createdBy: user.id,
            isActive: data.enabled
        };

        if (existingSchedule) {
            await WorkflowScheduleService.updateSchedule(existingSchedule.id, {
                ...scheduleData,
                assignmentType: scheduleData.assignmentType as any,
                assignedRole: scheduleData.assignedRole,
                frequency: scheduleData.frequency,
            });
        } else {
            await WorkflowScheduleService.createSchedule({
                ...scheduleData,
                assignmentType: scheduleData.assignmentType as any,
                assignedRole: scheduleData.assignedRole,
                frequency: scheduleData.frequency,
            });
        }

        // Save Triggers
        if (data.triggers) {
            await WorkflowTriggerService.syncTriggers(
                templateId,
                branchId,
                data.triggers,
                user.id
            );
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[API] Error saving schedule settings:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// Helpers
function getDayNumber(day: string): number {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days.indexOf(day.toLowerCase());
}

function getDayName(num: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[num] || 'monday';
}
