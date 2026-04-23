import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, createRateLimitHeaders } from "./lib/rate-limiter";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Middleware Session Verification
 *
 * This function verifies the session cookie using the better-auth API directly
 * without importing the full auth module (which includes Node.js dependencies).
 */
async function verifySession(request: NextRequest) {
    const cookie = request.headers.get("cookie") || "";

    try {
        console.log("[Middleware] Verifying session via /api/auth/get-session...");
        
        const response = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
            headers: {
                cookie,
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.log(`[Middleware] Session verification failed with status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        console.log("[Middleware] Session verification result:", {
            hasSession: !!data,
            userId: data?.user?.id,
            companyId: data?.user?.companyId,
            branchId: data?.user?.branchId
        });
        
        return data;
    } catch (error) {
        console.error("[Middleware] Session verification failed:", error);
        return null;
    }
}

export default async function authMiddleware(request: NextRequest) {
    const isApiRoute = request.nextUrl.pathname.startsWith("/api");
    const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
    const isAuthRoute = request.nextUrl.pathname.startsWith("/sign-in") || 
                        request.nextUrl.pathname.startsWith("/sign-up");

    // Rate limiting for API routes (except auth endpoints)
    if (isApiRoute && !request.nextUrl.pathname.startsWith("/api/auth")) {
        // Get user identifier from session or IP
        const authData = await verifySession(request);

        const identifier = authData?.user?.id ||
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            "anonymous";

        // Check rate limit
        const rateLimitResult = checkRateLimit(identifier, request.nextUrl.pathname);
        const { headers: rateLimitHeaders, shouldBlock, retryAfter } = createRateLimitHeaders(rateLimitResult);

        // Block if rate limit exceeded
        if (shouldBlock) {
            console.log(
                `[RateLimit] Blocked request from ${identifier} to ${request.nextUrl.pathname}. ` +
                `Retry after: ${retryAfter}s`
            );

            return new NextResponse(
                JSON.stringify({
                    error: "Too Many Requests",
                    message: "Rate limit exceeded. Please try again later.",
                    retryAfter: retryAfter,
                }),
                {
                    status: 429,
                    headers: {
                        ...rateLimitHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Add rate limit headers to response
        const responseHeaders = new Headers(request.headers);
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
            responseHeaders.set(key, value);
        });

        return NextResponse.next({
            request: {
                headers: responseHeaders,
            },
        });
    }

    // Authentication check for dashboard routes
    if (isDashboardRoute) {
        // First check if session cookie exists (optimistic check)
        const sessionCookie = getSessionCookie(request);

        // If no cookie, verify session (might be stored differently)
        let authData = null;
        
        if (!sessionCookie) {
            authData = await verifySession(request);
        } else {
            // Try to verify session, but be lenient on errors
            try {
                authData = await verifySession(request);
            } catch (error) {
                // Log but don't fail - allow the request through if cookie exists
                console.warn("[Middleware] Session verification error, allowing with cookie:", error);
            }
        }

        // Only redirect to sign-in if we're sure there's no valid session
        if (!authData && !sessionCookie) {
            // Store the intended destination
            const redirectUrl = new URL("/sign-in", request.url);
            redirectUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // If we have auth data, proceed with normal checks
        if (authData) {
            const user = authData.user;
            const isOnboarding = request.nextUrl.pathname.startsWith("/onboarding");

            console.log(`[Middleware] Path: ${request.nextUrl.pathname}, User: ${user.email}, CompanyId: ${user.companyId}`);

            if (!user.companyId && !isOnboarding) {
                console.log("[Middleware] Redirecting to /onboarding");
                return NextResponse.redirect(new URL("/onboarding", request.url));
            }

            if (user.companyId && isOnboarding) {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }

            // Role-based access control
            const userRole = user.role as 'ADMIN' | 'GERENTE' | 'EMPLEADO';
            const requestedPath = request.nextUrl.pathname;

            // Skip RBAC for API routes and public paths
            if (!requestedPath.startsWith('/api') && !requestedPath.startsWith('/join')) {
                const { hasAccess, getDefaultDashboard } = await import('./lib/rbac/permissions');

                if (!hasAccess(userRole, requestedPath)) {
                    console.log(`[RBAC] Access denied for ${userRole} to ${requestedPath}`);
                    const defaultPath = getDefaultDashboard(userRole);
                    return NextResponse.redirect(new URL(defaultPath, request.url));
                }
            }

            const headers = new Headers(request.headers);
            headers.set("x-user-id", user.id);

            // Forward tenant ID if available
            if (user.companyId) {
                headers.set("x-pulso-tenant-id", user.companyId);
            }

            return NextResponse.next({
                request: {
                    headers
                }
            });
        }

        // If we only have a cookie but no auth data, allow the request
        // The page components will handle auth state
        return NextResponse.next();
    }

    // For other routes, just pass through
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/api/:path*"],
};
