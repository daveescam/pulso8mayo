"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface DashboardSessionProviderProps {
    children: React.ReactNode;
    initialSession: any;
}

export function DashboardSessionProvider({
    children,
    initialSession,
}: DashboardSessionProviderProps) {
    const [session, setSession] = useState(initialSession);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Fetch session on mount and on route change
        const fetchSession = async () => {
            try {
                const response = await fetch("/api/auth/get-session", {
                    credentials: "include",
                    cache: "no-store",
                });

                if (response.ok) {
                    const data = await response.json();
                    setSession(data);
                } else {
                    // Session expired, redirect to sign in
                    const callbackUrl = encodeURIComponent(pathname);
                    router.push(`/sign-in?callbackUrl=${callbackUrl}`);
                }
            } catch (error) {
                console.error("Failed to fetch session:", error);
                // Don't redirect on network errors, let the user continue
            } finally {
                setIsLoading(false);
            }
        };

        fetchSession();

        // Set up periodic session refresh (every 2 minutes)
        const interval = setInterval(fetchSession, 2 * 60 * 1000);

        return () => clearInterval(interval);
    }, [pathname, router]);

    // Don't redirect during initial load if we have a session
    if (isLoading && !session) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <>{children}</>;
}
