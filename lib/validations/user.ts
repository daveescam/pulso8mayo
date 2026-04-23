import { z } from "zod";
import { roleEnum } from "@/lib/db/schema";

export const createUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(roleEnum.enumValues).default("EMPLEADO"),
    companyId: z.string().uuid().optional(),
    branchId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(roleEnum.enumValues).optional(),
    branchId: z.string().uuid().optional(),
    phone: z.string().optional(),
    whatsappPhone: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
