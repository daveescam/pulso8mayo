import type { BetterAuthOptions } from "better-auth";

/**
 * Auth Configuration for Pulso
 *
 * Implements refresh token rotation for enhanced security:
 * - Access token: 15 minutes
 * - Refresh token: 7 days
 * - Refresh token rotation: enabled (new refresh token on each use)
 * - Reuse detection: enabled (invalidates all tokens if reuse detected)
 */

export const authConfig: BetterAuthOptions = {
    // Session configuration
    session: {
        // Access token expiration: 15 minutes
        expiresIn: 60 * 15, // 15 minutes in seconds

        // Refresh token expiration: 7 days
        refreshExpiresIn: 60 * 60 * 24 * 7, // 7 days in seconds

        // Enable refresh token rotation
        updateAge: 60 * 60 * 24, // Update session age every 24 hours

        // Allow session extension via refresh token
        cookieCache: {
            enabled: false,
            maxAge: 60 * 5, // 5 minutes cache for session cookie
        },

        // Cookie configuration
        cookieName: "auth-token",
        cookieOptions: {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        },
    },

    // Rate limiting for auth endpoints (additional to middleware rate limiting)
    rateLimit: {
        enabled: true,
        window: 60, // 1 minute window
        max: 10, // 10 requests per minute for auth endpoints
    },

    // Advanced security options
    advanced: {
        // Enable refresh token rotation
        refreshTokenRotation: true,

        // Invalidate all sessions if refresh token reuse is detected
        invalidateRefreshTokenOnReuse: true,

        // Require secure cookies in production
        defaultCookieAttributes: {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            httpOnly: true,
            path: "/",
        },

        // Use cookies for session management
        useCookies: true,
    },

    // User configuration
    user: {
        additionalFields: {
            companyId: {
                type: "string",
                required: false,
                input: false, // Not settable by user
            },
            branchId: {
                type: "string",
                required: false,
                input: false,
            },
            role: {
                type: "string",
                required: false,
                defaultValue: "EMPLEADO",
            },
            phone: {
                type: "string",
                required: false,
            },
        },
        // Change email requires verification
        changeEmail: {
            enabled: true,
            requireVerification: true,
        },
    },

    // Account configuration (for OAuth)
    account: {
        // Allow multiple OAuth accounts to be linked
        accountLinking: {
            enabled: true,
            trustedProviders: ["google", "microsoft"],
        },
    },

    // Database configuration is handled in auth.ts
};
