import { z } from "zod";
import { baseShape, emptyToNull, requiredInt } from "./loyaltyProgramBase";

// Quantity programs have no program-level reward. Each product rule carries
// its own, and those rows live in component state, so `getProductRulesSchema`
// is checked on submit.
export const quantityProgramSchema = z.object({
  ...baseShape,
  earning_type: z.literal("quantity"),
});

export const getProductRulesSchema = (issuesVoucher) => {
  const ruleSchema = z.object({
    product_id: z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.coerce.number({
        required_error: "Choose a product.",
        invalid_type_error: "Choose a product.",
      }),
    ),
    quantity_required: requiredInt("Quantity"),

    // Reward details only matter when vouchers are on.
    reward_title: issuesVoucher
      ? z.string().trim().min(1, "Enter a reward title.")
      : z.string().optional(),
    reward_description: z.string().optional().nullable(),
    reward_type: z.string().optional(),
    reward_value: issuesVoucher
      ? z.preprocess(
          emptyToNull,
          z.coerce
            .number({ invalid_type_error: "Enter a number." })
            .min(0, "Can't be negative.")
            .nullable()
            .optional(),
        )
      : z.any().optional(),
    voucher_validity_days: issuesVoucher
      ? requiredInt("Validity")
      : z.any().optional(),
  });

  return z
    .array(ruleSchema)
    .min(1, "Add at least one product rule.")
    .superRefine((rules, ctx) => {
      const seen = new Set();

      rules.forEach((rule, i) => {
        if (seen.has(rule.product_id)) {
          ctx.addIssue({
            code: "custom",
            path: [i, "product_id"],
            message: "Each product can only be used once.",
          });
        }
        seen.add(rule.product_id);
      });
    });
};
