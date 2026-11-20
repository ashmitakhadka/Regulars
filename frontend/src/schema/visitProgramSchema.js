import { z } from "zod";
import {
  baseShape,
  rewardShape,
  requiredInt,
  withVoucherRules,
} from "./loyaltyProgramBase";

// Visit programs: `threshold` is the number of visits that completes the card.
export const visitProgramSchema = withVoucherRules(
  z.object({
    ...baseShape,
    ...rewardShape,
    earning_type: z.literal("visit"),
    threshold: requiredInt("Visits required"),
    stamps_awarded: requiredInt("Stamps per visit"),
  }),
);
