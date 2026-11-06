import { z } from "zod";

export const businessSchema = z.object({
  business_name: z
    .string()
    .trim()
    .min(1, "Business name is required")
    .max(255, "Business name cannot exceed 255 characters"),

  phone: z
    .string()
    .trim()
    .min(1, "Business phone is required")
    .max(20, "Phone number cannot exceed 20 characters"),

  address: z.string().trim().min(1, "Business address is required"),

  description: z.string().trim().optional(),
});
