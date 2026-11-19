import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a product name.")
    .max(255, "Name can't exceed 255 characters."),
  description: z
    .string()
    .trim()
    .max(1000, "Description can't exceed 1000 characters.")
    .optional()
    .or(z.literal("")),
  price: z.coerce
    .number({ invalid_type_error: "Enter a valid price." })
    .min(0, "Price can't be negative."),
  status: z.enum(["active", "inactive"]).optional(),
});
