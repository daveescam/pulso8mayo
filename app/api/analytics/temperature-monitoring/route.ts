import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { temperatureLogs, branches, inventoryItems } from "@/lib/db/schema";
import { eq, sql, and, gte, lte, inArray, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { enforceBranchScope, getAccessibleBranchIds } from "@/lib/branch-scope";

export async function GET(req: NextRequest) {
try {
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user?.id || !session?.user?.companyId) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const companyId = session.user.companyId;
const userRole = (session.user as any).role as string;
const userBranchId = (session.user as any).branchId as string | undefined;

const searchParams = req.nextUrl.searchParams;
const period = searchParams.get("period") || "30d";
const requestedBranchId = searchParams.get("branchId");

const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
const startDate = startOfDay(subDays(new Date(), days));
const endDate = endOfDay(new Date());

const companyBranches = await db
.select({ id: branches.id, name: branches.name })
.from(branches)
.where(eq(branches.companyId, companyId));

const allBranchIds = companyBranches.map((b) => b.id);

const accessibleBranchIds = getAccessibleBranchIds(
userRole as any,
userBranchId,
allBranchIds
);

const effectiveBranchId = enforceBranchScope(
userRole as any,
userBranchId,
requestedBranchId
);

const targetBranchIds = effectiveBranchId
? [effectiveBranchId]
: accessibleBranchIds;

if (targetBranchIds.length === 0) {
return NextResponse.json({
summary: {
totalReadings: 0,
compliantReadings: 0,
complianceRate: 0,
violationsToday: 0,
},
byBranch: [],
recentViolations: [],
trend: [],
});
}

let totalReadings = 0, compliantReadings = 0, complianceRate = 0;
try {
const summaryResult = await db
.select({
totalReadings: sql<number>`cast(count(*) as integer)`,
compliantReadings: sql<number>`cast(count(*) filter (where ${temperatureLogs.isCompliant} = true) as integer)`,
})
.from(temperatureLogs)
.where(
and(
inArray(temperatureLogs.branchId, targetBranchIds),
gte(temperatureLogs.timestamp, startDate),
lte(temperatureLogs.timestamp, endDate)
)
);

totalReadings = Number(summaryResult[0]?.totalReadings || 0);
compliantReadings = Number(summaryResult[0]?.compliantReadings || 0);
complianceRate =
totalReadings > 0
? Math.round((compliantReadings / totalReadings) * 100 * 10) / 10
: 0;
} catch {}

let violationsToday = 0;
try {
const todayStart = startOfDay(new Date());
const todayEnd = endOfDay(new Date());

const violationsTodayResult = await db
.select({
count: sql<number>`cast(count(*) as integer)`,
})
.from(temperatureLogs)
.where(
and(
inArray(temperatureLogs.branchId, targetBranchIds),
eq(temperatureLogs.isCompliant, false),
gte(temperatureLogs.timestamp, todayStart),
lte(temperatureLogs.timestamp, todayEnd)
)
);

violationsToday = Number(violationsTodayResult[0]?.count || 0);
} catch {}

let byBranch: any[] = [];
try {
byBranch = await Promise.all(
targetBranchIds.map(async (branchId) => {
const branchInfo = companyBranches.find((b) => b.id === branchId);

let totalBranch = 0, compliantBranch = 0, branchCompliance = 0;
try {
const branchStats = await db
.select({
total: sql<number>`cast(count(*) as integer)`,
compliant: sql<number>`cast(count(*) filter (where ${temperatureLogs.isCompliant} = true) as integer)`,
})
.from(temperatureLogs)
.where(
and(
eq(temperatureLogs.branchId, branchId),
gte(temperatureLogs.timestamp, startDate),
lte(temperatureLogs.timestamp, endDate)
)
);

totalBranch = Number(branchStats[0]?.total || 0);
compliantBranch = Number(branchStats[0]?.compliant || 0);
branchCompliance =
totalBranch > 0
? Math.round((compliantBranch / totalBranch) * 100 * 10) / 10
: 0;
} catch {}

let lastReading: any = null;
try {
const lastReadingResult = await db
.select({
value: temperatureLogs.readingValue,
timestamp: temperatureLogs.timestamp,
location: temperatureLogs.location,
})
.from(temperatureLogs)
.where(eq(temperatureLogs.branchId, branchId))
.orderBy(desc(temperatureLogs.timestamp))
.limit(1);

lastReading =
lastReadingResult.length > 0
? {
value: Number(lastReadingResult[0].value),
timestamp: lastReadingResult[0].timestamp.toISOString(),
location: lastReadingResult[0].location,
}
: null;
} catch {}

return {
branchId,
branchName: branchInfo?.name || "Sin nombre",
totalReadings: totalBranch,
compliantReadings: compliantBranch,
complianceRate: branchCompliance,
lastReading,
};
})
);
} catch {}

let formattedViolations: any[] = [];
try {
const recentViolations = await db
.select({
id: temperatureLogs.id,
branchName: branches.name,
readingValue: temperatureLogs.readingValue,
unit: temperatureLogs.unit,
location: temperatureLogs.location,
minThreshold: temperatureLogs.minThreshold,
maxThreshold: temperatureLogs.maxThreshold,
timestamp: temperatureLogs.timestamp,
})
.from(temperatureLogs)
.innerJoin(branches, eq(temperatureLogs.branchId, branches.id))
.where(
and(
inArray(temperatureLogs.branchId, targetBranchIds),
eq(temperatureLogs.isCompliant, false)
)
)
.orderBy(desc(temperatureLogs.timestamp))
.limit(20);

formattedViolations = recentViolations.map((v) => ({
id: v.id,
branchName: v.branchName,
readingValue: Number(v.readingValue),
unit: v.unit || "C",
location: v.location,
minThreshold: v.minThreshold !== null ? Number(v.minThreshold) : null,
maxThreshold: v.maxThreshold !== null ? Number(v.maxThreshold) : null,
timestamp: v.timestamp.toISOString(),
}));
} catch {}

let trend: any[] = [];
try {
const trendResult = await db
.select({
date: sql<string>`DATE(${temperatureLogs.timestamp})`,
total: sql<number>`cast(count(*) as integer)`,
violations: sql<number>`cast(count(*) filter (where ${temperatureLogs.isCompliant} = false) as integer)`,
})
.from(temperatureLogs)
.where(
and(
inArray(temperatureLogs.branchId, targetBranchIds),
gte(temperatureLogs.timestamp, startDate),
lte(temperatureLogs.timestamp, endDate)
)
)
.groupBy(sql`DATE(${temperatureLogs.timestamp})`)
.orderBy(sql`DATE(${temperatureLogs.timestamp})`);

trend = trendResult.map((t) => ({
date: format(new Date(t.date + "T00:00:00"), "MMM dd"),
total: Number(t.total),
violations: Number(t.violations),
}));
} catch {}

return NextResponse.json({
summary: {
totalReadings,
compliantReadings,
complianceRate,
violationsToday,
},
byBranch,
recentViolations: formattedViolations,
trend,
});
} catch (error) {
console.error("[Temperature Monitoring API] Error:", error);
return NextResponse.json(
{ error: "Failed to fetch temperature monitoring data" },
{ status: 500 }
);
}
}
