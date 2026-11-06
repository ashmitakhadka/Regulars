import { z } from "zod";
import { accountSchema } from "./accountSchema";
import { businessSchema } from "./businessSchema";

export const MerchantRegisterSchema = accountSchema.and(businessSchema);
