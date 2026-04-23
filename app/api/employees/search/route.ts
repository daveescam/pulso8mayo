import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employeeProfiles, savedSearches, users } from '@/lib/db/schema';
import { eq, and, ilike, or, sql, asc, desc, count, gte, lte } from 'drizzle-orm';

// GET - Search employees with advanced filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const companyId = searchParams.get('companyId');
        const search = searchParams.get('search');
        const department = searchParams.get('department');
        const position = searchParams.get('position');
        const status = searchParams.get('status');
        const branchId = searchParams.get('branchId');
        const city = searchParams.get('city');
        const state = searchParams.get('state');
        const salaryMin = searchParams.get('salaryMin');
        const salaryMax = searchParams.get('salaryMax');
        const hireDateFrom = searchParams.get('hireDateFrom');
        const hireDateTo = searchParams.get('hireDateTo');
        const sortBy = searchParams.get('sortBy') || 'name';
        const sortOrder = searchParams.get('sortOrder') || 'asc';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!companyId) {
            return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
        }

        // Build where conditions
        const conditions = [eq(sql`u."company_id"`, companyId)];

        if (search) {
            const searchCondition = or(
                ilike(employeeProfiles.employeeNumber, `%${search}%`),
                ilike(sql`u.name`, `%${search}%`),
                ilike(employeeProfiles.department, `%${search}%`),
                ilike(employeeProfiles.position, `%${search}%`),
                ilike(employeeProfiles.personalEmail, `%${search}%`)
            );
            if (searchCondition) conditions.push(searchCondition);
        }

        if (department && department !== 'all') {
            conditions.push(eq(employeeProfiles.department, department));
        }

        if (position) {
            conditions.push(ilike(employeeProfiles.position, `%${position}%`));
        }

        if (status && status !== 'all') {
            conditions.push(eq(employeeProfiles.employeeStatus, status as any));
        }

        if (branchId && branchId !== 'all') {
            conditions.push(eq(employeeProfiles.branchId, branchId));
        }

        if (city) {
            conditions.push(ilike(employeeProfiles.city, `%${city}%`));
        }

        if (state) {
            conditions.push(eq(employeeProfiles.state, state));
        }

        if (hireDateFrom) {
            conditions.push(gte(employeeProfiles.hireDate, new Date(hireDateFrom)));
        }

        if (hireDateTo) {
            conditions.push(lte(employeeProfiles.hireDate, new Date(hireDateTo)));
        }

        // Get total count
        const totalResult = await db
            .select({ count: count() })
            .from(employeeProfiles)
            .leftJoin(sql`users u`, eq(employeeProfiles.userId, sql`u.id`))
            .where(and(...conditions));

        const total = totalResult[0].count;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        // Build order by
        const orderBy = sortOrder === 'desc'
            ? desc(employeeProfiles[sortBy as keyof typeof employeeProfiles] || employeeProfiles.name)
            : asc(employeeProfiles[sortBy as keyof typeof employeeProfiles] || employeeProfiles.name);

        // Fetch employees
        const employees = await db
            .select({
                id: employeeProfiles.id,
                userId: employeeProfiles.userId,
                employeeNumber: employeeProfiles.employeeNumber,
                name: sql<string>`u.name`,
                email: sql<string>`u.email`,
                image: sql<string>`u.image`,
                department: employeeProfiles.department,
                position: employeeProfiles.position,
                employeeStatus: employeeProfiles.employeeStatus,
                hireDate: employeeProfiles.hireDate,
                branchId: employeeProfiles.branchId,
                city: employeeProfiles.city,
                state: employeeProfiles.state,
                profilePhotoUrl: employeeProfiles.profilePhotoUrl,
            })
            .from(employeeProfiles)
            .leftJoin(sql`users u`, eq(employeeProfiles.userId, sql`u.id`))
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);

        // Get unique departments for filter
        const departments = await db
            .select({ department: employeeProfiles.department })
            .from(employeeProfiles)
            .where(eq(sql`u."company_id"`, companyId))
            .groupBy(employeeProfiles.department);

        return NextResponse.json({
            employees,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            filters: {
                departments: departments.map(d => d.department).filter(Boolean),
            },
        });
    } catch (error) {
        console.error('Error searching employees:', error);
        return NextResponse.json(
            { error: 'Failed to search employees' },
            { status: 500 }
        );
    }
}

// POST - Save a search
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, companyId, name, description, searchCriteria, entityType } = body;

        if (!userId || !companyId || !name || !searchCriteria) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const saved = await db.insert(savedSearches).values({
            userId,
            companyId,
            name,
            description,
            searchCriteria,
            entityType: entityType || 'EMPLOYEE',
        }).returning();

        return NextResponse.json({ savedSearch: saved[0] });
    } catch (error) {
        console.error('Error saving search:', error);
        return NextResponse.json(
            { error: 'Failed to save search' },
            { status: 500 }
        );
    }
}

// GET - Get saved searches for a user
export async function getSavedSearches(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const companyId = searchParams.get('companyId');

        if (!userId || !companyId) {
            return NextResponse.json(
                { error: 'userId and companyId are required' },
                { status: 400 }
            );
        }

        const searches = await db
            .select()
            .from(savedSearches)
            .where(
                and(
                    eq(savedSearches.userId, userId),
                    eq(savedSearches.companyId, companyId)
                )
            )
            .orderBy(desc(savedSearches.lastUsedAt));

        return NextResponse.json({ searches });
    } catch (error) {
        console.error('Error fetching saved searches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch saved searches' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a saved search
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const searchId = searchParams.get('id');
        const userId = searchParams.get('userId');

        if (!searchId || !userId) {
            return NextResponse.json(
                { error: 'id and userId are required' },
                { status: 400 }
            );
        }

        await db
            .delete(savedSearches)
            .where(
                and(
                    eq(savedSearches.id, searchId as any),
                    eq(savedSearches.userId, userId)
                )
            );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting saved search:', error);
        return NextResponse.json(
            { error: 'Failed to delete saved search' },
            { status: 500 }
        );
    }
}
