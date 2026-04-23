import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { users, sessions, account, verifications } from "./db/schema";
import { nextCookies } from "better-auth/next-js";
import { authConfig } from "./auth-config";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: users,
            session: sessions,
            account: account,
            verification: verifications
        },
    }),
    plugins: [
        nextCookies()
    ],
    emailAndPassword: {
        enabled: true
    },
    // Merge custom config with defaults
    session: authConfig.session,
    advanced: authConfig.advanced,
    user: {
        ...authConfig.user,
        additionalFields: {
            companyId: {
                type: "string",
                required: false
            },
            branchId: {
                type: "string",
                required: false
            },
            role: {
                type: "string",
                required: false
            },
            phone: {
                type: "string",
                required: false
            }
        }
    },
    rateLimit: authConfig.rateLimit,
});

import { headers } from "next/headers";

export const getSession = async () => {
    return await auth.api.getSession({
        headers: await headers()
    });
};
