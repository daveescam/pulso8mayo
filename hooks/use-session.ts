"use client";

import { useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";

interface Session {
    user: {
        id: string;
        email: string;
        name: string;
        companyId?: string;
        branchId?: string;
        role?: string;
        image?: string;
    };
    session: {
        id: string;
        userId: string;
        expiresAt: Date;
    };
}

export function useSession() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Fetch session
    const fetchSession = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/get-session", {
                credentials: "include",
                cache: "no-store",
            });

            if (response.ok) {
                const data = await response.json();
                setSession(data);
                setError(null);
            } else {
                setSession(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to fetch session"));
            setSession(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    // Refresh session on navigation (but don't block navigation)
    useEffect(() => {
        const refreshOnNavComplete = () => {
            fetchSession();
        };

        // Listen for navigation complete
        refreshOnNavComplete();

        // Set up periodic refresh to keep session alive
        const interval = setInterval(() => {
            fetchSession();
        }, 5 * 60 * 1000); // Refresh every 5 minutes

        return () => clearInterval(interval);
    }, [pathname, fetchSession]);

    return {
        session,
        loading,
        error,
        refresh: fetchSession,
    };
}

// Hook to check if user is authenticated
export function useRequireAuth(redirectUrl = "/sign-in") {
    const { session, loading } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !session) {
            // Store intended destination
            const callbackUrl = encodeURIComponent(pathname);
            router.push(`${redirectUrl}?callbackUrl=${callbackUrl}`);
        }
    }, [session, loading, router, redirectUrl, pathname]);

    return {
        session,
        loading,
        isAuthenticated: !!session,
    };
}
