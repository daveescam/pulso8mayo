import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, createRateLimitHeaders } from "./lib/rate-limiter";
import { getSessionCookie } from "better-auth/cookies";
import { hasAccess, getDefaultDashboard } from './lib/rbac/permissions';
import { createChildLogger } from './lib/logger';

const logger = createChildLogger('proxy');
const isDev = process.env.NODE_ENV === 'development';

async function verifySession(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";

  try {
    if (isDev) {
      logger.debug("Verifying session via /api/auth/get-session...");
    }

    const response = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
      headers: {
        cookie,
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (isDev) {
        logger.debug({ status: response.status }, "Session verification failed");
      }
      return null;
    }

    const data = await response.json();
    if (isDev) {
      logger.debug({
        hasSession: !!data,
        userId: data?.user?.id,
        companyId: data?.user?.companyId,
        branchId: data?.user?.branchId
      }, "Session verification result");
    }

    return data;
  } catch (error) {
    logger.error({ error }, "Session verification failed");
    return null;
  }
}

export async function proxy(request: NextRequest) {
    const isApiRoute = request.nextUrl.pathname.startsWith("/api");
    const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
    const isOnboardingRoute = request.nextUrl.pathname.startsWith("/onboarding");
    const isAuthRoute = request.nextUrl.pathname.startsWith("/sign-in") || 
                        request.nextUrl.pathname.startsWith("/sign-up");

    if (isApiRoute && !request.nextUrl.pathname.startsWith("/api/auth")) {
        const authData = await verifySession(request);

        const identifier = authData?.user?.id ||
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            "anonymous";

        const rateLimitResult = await checkRateLimit(identifier, request.nextUrl.pathname);
        const { headers: rateLimitHeaders, shouldBlock, retryAfter } = createRateLimitHeaders(rateLimitResult);

        if (shouldBlock) {
          logger.warn({
            identifier,
            path: request.nextUrl.pathname,
            retryAfter
          }, "Rate limit exceeded");

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

    if (isDashboardRoute || isOnboardingRoute) {
        const sessionCookie = getSessionCookie(request);

        let authData = null;
        
    if (!sessionCookie) {
      authData = await verifySession(request);
    } else {
      try {
        authData = await verifySession(request);
      } catch (error) {
        if (isDev) {
          logger.debug({ error }, "Session verification error, allowing with cookie");
        }
      }
    }

        if (!authData && !sessionCookie) {
            const redirectUrl = new URL("/sign-in", request.url);
            redirectUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
            return NextResponse.redirect(redirectUrl);
        }

    if (authData) {
      const user = authData.user;
      const isOnboarding = request.nextUrl.pathname.startsWith("/onboarding");

      if (isDev) {
        logger.debug({
          path: request.nextUrl.pathname,
          userEmail: user.email,
          companyId: user.companyId
        }, "Request authorized");
      }

      if (!user.companyId && !isOnboarding) {
        logger.info({ userId: user.id }, "Redirecting unassigned user to onboarding");
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }

      if (user.companyId && isOnboarding) {
        logger.info({ userId: user.id }, "Redirecting assigned user from onboarding to dashboard");
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      const userRole = (user.role || 'EMPLEADO') as 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE' | 'SUPERVISOR' | 'EMPLEADO' | 'READONLY';
      const requestedPath = request.nextUrl.pathname;

      if (!requestedPath.startsWith('/api') && !requestedPath.startsWith('/join')) {
        if (!hasAccess(userRole, requestedPath)) {
          logger.warn({ userRole, path: requestedPath }, "Access denied by RBAC");
                    const defaultPath = getDefaultDashboard(userRole);
                    return NextResponse.redirect(new URL(defaultPath, request.url));
                }
            }

            const headers = new Headers(request.headers);
            headers.set("x-user-id", user.id);

            if (user.companyId) {
                headers.set("x-pulso-tenant-id", user.companyId);
            }

            return NextResponse.next({
                request: {
                    headers
                }
            });
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/api/:path*", "/onboarding"],
};