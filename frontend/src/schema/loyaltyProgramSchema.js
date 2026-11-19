import { z } from "zod";

const emptyToNull = (v) =>
  v === "" || v === null || v === undefined ? null : v;

const optionalNumber = (msg) =>
  z.preprocess(
    emptyToNull,
    z.coerce.number({ invalid_type_error: msg }).nullable().optional(),
  );

export const loyaltyProgramSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a program name.")
    .max(255, "Name can't exceed 255 characters."),
  description: z
    .string()
    .trim()
    .max(1000, "Description can't exceed 1000 characters.")
    .optional(),
  earning_type: z.enum(["visit", "purchase", "quantity"]),
  daily_stamp_limit: z.preprocess(
    emptyToNull,
    z.coerce
      .number({ invalid_type_error: "Daily limit must be a number." })
      .int("Daily limit must be a whole number.")
      .min(1, "Daily limit must be at least 1.")
      .nullable()
      .optional(),
  ),
  threshold: optionalNumber("Enter a number."),
  stamps_awarded: optionalNumber("Enter a whole number."),
  reward_title: z.string().optional(),
  reward_description: z.string().optional(),
  reward_type: z.string().optional(),
  reward_value: z.preprocess(
    emptyToNull,
    z.coerce
      .number({ invalid_type_error: "Enter a number." })
      .min(0, "Can't be negative.")
      .nullable()
      .optional(),
  ),
  voucher_validity_days: z.preprocess(
    (v) => (v === "" || v == null ? 30 : v),
    z.coerce
      .number()
      .int("Whole days only.")
      .min(1, "At least 1 day.")
      .optional(),
  ),
});
