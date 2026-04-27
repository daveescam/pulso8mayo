import { z } from "zod";
import { roleEnum } from "@/lib/db/schema";

export const createUserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
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
