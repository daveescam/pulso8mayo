import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const PLANS = {
    FREE: {
        id: 'FREE',
        name: 'Free Starter',
        price: 0,
        limits: {
            branches: 1,
            users: 5,
            storage: 1 // GB
        },
        features: ['Basic Workflows', 'Email Support']
    },
    BASIC: {
        id: 'BASIC',
        name: 'Basic',
        price: 2900, // Cents
        limits: {
            branches: 3,
            users: 10,
            storage: 5
        },
        features: ['Advanced Workflows', 'Priority Support', 'WhatsApp Integration (Basic)']
    },
    PRO: {
        id: 'PRO',
        name: 'Pro',
        price: 7900,
        limits: {
            branches: 10,
            users: 1000, // Unlimited effectively
            storage: 50
        },
        features: ['AI Verification', 'API Access', 'Custom Reports', 'WhatsApp Automation']
    },
    ENTERPRISE: {
        id: 'ENTERPRISE',
        name: 'Enterprise',
        price: 0, // Contact Sales
        limits: {
            branches: 1000,
            users: 10000,
            storage: 1000
        },
        features: ['SLA', 'Dedicated Manager', 'Custom Integrations']
    }
};

export type PlanId = keyof typeof PLANS;

export class BillingService {

    /**
     * Get current plan and usage for a company
     */
    static async getCompanyPlan(companyId: string) {
        const company = await db.query.companies.findFirst({
            where: eq(companies.id, companyId)
        });

        if (!company) throw new Error("Company not found");

        const planId = (company.plan as PlanId) || 'FREE';
        const planDetails = PLANS[planId];

        return {
            ...planDetails,
            status: company.billingStatus,
            trialEndsAt: null, // Implement trial logic later if needed
            stripeCustomerId: company.stripeCustomerId
        };
    }

    /**
     * Subscribe to a new plan (Mock Implementation)
     */
    static async subscribe(companyId: string, planId: PlanId) {
        if (!PLANS[planId]) throw new Error("Invalid plan ID");

        // Here we would interact with Stripe to create/update subscription
        // For now, we just update the DB directly

        await db.update(companies)
            .set({
                plan: planId,
                billingStatus: 'ACTIVE',
                updatedAt: new Date()
            })
            .where(eq(companies.id, companyId));

        return { success: true, message: `Subscribed to ${PLANS[planId].name}` };
    }

    /**
     * Generates a link to the customer portal (Mock)
     */
    static async generatePortalLink(companyId: string) {
        // Mock URL
        return "https://billing.stripe.com/p/login/test";
    }

    /**
     * Check if company has reached a limit
     */
    static async checkLimit(companyId: string, limitType: keyof typeof PLANS['FREE']['limits'], currentUsage: number): Promise<boolean> {
        const { limits } = await this.getCompanyPlan(companyId);
        const limit = limits[limitType];

        if (limit === undefined) return true; // No limit defined
        return currentUsage < limit;
    }
}
