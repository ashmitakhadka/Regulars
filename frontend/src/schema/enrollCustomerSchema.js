import { z } from "zod";

export const enrollCustomerSchema = z.object({
  loyalty_program_id: z.coerce
    .number({ invalid_type_error: "Select a loyalty program." })
    .min(1, "Select an active loyalty program."),
  identifier_type: z.enum(["customer_code", "phone"]),
  identifier: z.string().trim().min(1, "Enter the customer's code or phone."),
});
