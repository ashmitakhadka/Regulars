import { visitProgramSchema } from "./visitProgramSchema";
import { purchaseProgramSchema } from "./purchaseProgramSchema";
import { quantityProgramSchema } from "./quantityProgramSchema";

const SCHEMAS = {
  visit: visitProgramSchema,
  purchase: purchaseProgramSchema,
  quantity: quantityProgramSchema,
};

// Pick the schema that matches the selected earning type.
export const getLoyaltyProgramSchema = (earningType) =>
  SCHEMAS[earningType] ?? visitProgramSchema;

// One import path for the form.
export { tiersSchema } from "./purchaseProgramSchema";
export { getProductRulesSchema } from "./quantityProgramSchema";
export { formatSchemaError } from "./loyaltyProgramBase";
