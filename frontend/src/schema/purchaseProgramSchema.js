import { z } from "zod";
import {
  baseShape,
  rewardShape,
  optionalNumber,
  requiredInt,
  requiredPositive,
  withVoucherRules,
} from "./loyaltyProgramBase";

// Purchase programs: either a simple minimum spend, or spend tiers.
// Tiers live in component state, so `tiersSchema` is checked on submit.
export const purchaseProgramSchema = withVoucherRules(
  z.object({
    ...baseShape,
    ...rewardShape,
    earning_type: z.literal("purchase"),
    purchase_mode: z.enum(["simple", "tiers"]),
    stamps_required: requiredInt("Stamps required"),
    threshold: optionalNumber("Enter a number."),
    stamps_awarded: optionalNumber("Enter a whole number."),
  }),
).superRefine((d, ctx) => {
  if (d.purchase_mode !== "simple") return;

  if (!(d.threshold > 0)) {
    ctx.addIssue({
      code: "custom",
      path: ["threshold"],
      message: "Enter a minimum spend greater than 0.",
    });
  }

  if (!Number.isInteger(d.stamps_awarded) || d.stamps_awarded < 1) {
    ctx.addIssue({
      code: "custom",
      path: ["stamps_awarded"],
      message: "Stamps must be a whole number, at least 1.",
    });
  }
});

export const tierSchema = z
  .object({
    min_amount: requiredPositive("Minimum spend"),
    max_amount: optionalNumber("Maximum spend must be a number."),
    stamps_awarded: requiredInt("Stamps awarded"),
  })
  .refine((t) => t.max_amount == null || t.max_amount > t.min_amount, {
    path: ["max_amount"],
    message: "Maximum spend must be greater than minimum spend.",
  });

export const tiersSchema = z.array(tierSchema).min(1, "Add at least one tier.");
