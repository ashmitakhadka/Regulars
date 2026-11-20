import { z } from "zod";

/* ---------- helpers (same style as your existing schema) ---------- */

export const emptyToNull = (v) =>
  v === "" || v === null || v === undefined ? null : v;

const emptyToUndefined = (v) =>
  v === "" || v === null || v === undefined ? undefined : v;

export const optionalNumber = (msg) =>
  z.preprocess(
    emptyToNull,
    z.coerce.number({ invalid_type_error: msg }).nullable().optional(),
  );

export const requiredInt = (label) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({
        required_error: `${label} is required.`,
        invalid_type_error: `${label} is required.`,
      })
      .int(`${label} must be a whole number.`)
      .min(1, `${label} must be at least 1.`),
  );

export const requiredPositive = (label) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({
        required_error: `${label} is required.`,
        invalid_type_error: `${label} is required.`,
      })
      .positive(`${label} must be greater than 0.`),
  );

/* ---------- fields every program type shares ---------- */

export const baseShape = {
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
  daily_stamp_limit: z.preprocess(
    emptyToNull,
    z.coerce
      .number({ invalid_type_error: "Daily limit must be a number." })
      .int("Daily limit must be a whole number.")
      .min(1, "Daily limit must be at least 1.")
      .nullable()
      .optional(),
  ),
  issues_voucher: z.boolean(),
};

// Reward fields used by visit and purchase programs.
export const rewardShape = {
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
};

// A reward title is only required when vouchers are turned on.
export const withVoucherRules = (schema) =>
  schema.superRefine((d, ctx) => {
    if (d.issues_voucher && !d.reward_title?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["reward_title"],
        message: "Enter a reward title.",
      });
    }
  });

/* ---------- error text for rows kept in component state ---------- */

// "Tier 2: Minimum spend is required." for row errors, plain message otherwise.
export const formatSchemaError = (error, rowLabel = "Row") => {
  const issue = error.issues[0];
  const index = typeof issue.path[0] === "number" ? issue.path[0] : null;

  return index === null
    ? issue.message
    : `${rowLabel} ${index + 1}: ${issue.message}`;
};
