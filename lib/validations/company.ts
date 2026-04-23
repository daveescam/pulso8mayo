import { z } from "zod";

export const createCompanySchema = z.object({
    name: z.string().min(2, "Company name is required"),
    taxId: z.string().optional(),
    plan: z.enum(["FREE", "BASIC", "PRO", "ENTERPRISE"]).default("FREE"),
});

export const updateCompanySchema = z.object({
    name: z.string().min(2).optional(),
    taxId: z.string().optional(),
    plan: z.enum(["FREE", "BASIC", "PRO", "ENTERPRISE"]).optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
