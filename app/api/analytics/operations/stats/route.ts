import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { workflowInstances, workflowAssignments, workflowTemplates, users, inventoryMovements } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, desc, count } from 'drizzle-orm';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');

    // 1. Active workflows by status
    const statusResult = await db
      .select({
        status: workflowInstances.status,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(workflowInstances)
      .groupBy(workflowInstances.status);

    const activeWorkflows = statusResult.map(s => ({
      status: s.status,
      count: Number(s.count),
    }));

    // 2. Completion rate trend (last 7 days)
    const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
    const trendConditions = [
      gte(workflowInstances.completedAt, sevenDaysAgo),
    ];
    // @ts-ignore
    if (branchId && branchId !== 'all') trendConditions.push(eq(workflowInstances.branchId, branchId));

    const completionTrend = await db
      .select({
        date: sql<string>`DATE(${workflowInstances.completedAt})`,
        total: sql<number>`cast(count(*) as integer)`,
      })
      .from(workflowInstances)
      .where(and(...trendConditions))
      .groupBy(sql`DATE(${workflowInstances.completedAt})`)
      .orderBy(sql`DATE(${workflowInstances.completedAt})`);

    const completionRate = completionTrend.map(t => ({
      date: format(new Date(t.date), 'MMM dd'),
      rate: Number(t.total),
    }));

    // 3. Employee leaderboard (top 5 by completed assignments last 30 days)
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));

    const leaderboard = await db
      .select({
        userId: workflowAssignments.assignedTo,
        userName: users.name,
        completed: sql<number>`cast(count(*) as integer)`,
        avgScore: sql<number>`COALESCE(AVG(${workflowInstances.score}), 0)`,
      })
      .from(workflowAssignments)
      .innerJoin(workflowInstances, eq(workflowAssignments.instanceId, workflowInstances.id))
      .leftJoin(users, eq(workflowAssignments.assignedTo, users.id))
      .where(and(
        eq(workflowAssignments.status, 'COMPLETED'),
        gte(workflowAssignments.completedAt, thirtyDaysAgo),
      ))
      .groupBy(workflowAssignments.assignedTo, users.name)
      .orderBy(sql`count(*) DESC`)
      .limit(5);

    const employeeLeaderboard = leaderboard.map(e => ({
      name: e.userName || 'Unknown',
      completed: Number(e.completed),
      score: Math.round(Number(e.avgScore)),
    }));

    // 4. Inventory movements today
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const movementConditions = [
      gte(inventoryMovements.timestamp, todayStart),
      lte(inventoryMovements.timestamp, todayEnd),
    ];

    const inventoryActivityToday = await db
      .select({
        type: inventoryMovements.type,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(inventoryMovements)
      .where(and(...movementConditions))
      .groupBy(inventoryMovements.type);

    return NextResponse.json({
      activeWorkflows,
      completionRate,
      employeeLeaderboard,
      inventoryActivityToday: inventoryActivityToday.map(m => ({
        type: m.type,
        count: Number(m.count),
      })),
    });
  } catch (error) {
    console.error('Error fetching operations stats:', error);
    return NextResponse.json({ error: 'Failed to fetch operations stats' }, { status: 500 });
  }
}
