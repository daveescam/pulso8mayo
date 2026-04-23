import { z } from "zod";

// Schema for operating hours configuration
export const operatingHoursSchema = z.object({
    monday: z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        isOpen: z.boolean().default(true)
    }).optional(),
    tuesday: z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        isOpen: z.boolean().default(true)
    }).optional(),
    wednesday: z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        isOpen: z.boolean().default(true)
    }).optional(),
    thursday: z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        isOpen: z.boolean().default(true)
    }).optional(),
    friday: z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        isOpen: z.boolean().default(true)
    }).optional(),
    saturday: z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        isOpen: z.boolean().default(true)
    }).optional(),
    sunday: z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)").optional(),
        isOpen: z.boolean().default(true)
    }).optional()
});

export const locationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
});

export const createBranchSchema = z.object({
    name: z.string().min(2, "Branch name is required"),
    code: z.string().optional(),
    address: z.string().optional(),
    timezone: z.string().default("America/Mexico_City"),
    companyId: z.string().uuid().optional(),
    operatingHours: operatingHoursSchema.optional(),
    location: locationSchema.optional(),
    managerId: z.string().nullable().optional(),
});

export const updateBranchSchema = z.object({
    name: z.string().min(2).optional(),
    code: z.string().optional(),
    address: z.string().optional(),
    timezone: z.string().optional(),
    active: z.boolean().optional(),
    operatingHours: operatingHoursSchema.optional(),
    location: locationSchema.optional(),
    managerId: z.string().nullable().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type OperatingHoursInput = z.infer<typeof operatingHoursSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
