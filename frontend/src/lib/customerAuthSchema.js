import { z } from "zod";

/**
 * Validates a Nepal mobile number:
 * Strips whitespace, dashes, brackets, +977, 00977, and leading 0.
 * Checks for 10 digits starting with 96, 97, or 98.
 */
export const normalizeAndValidateNepaliPhone = (val) => {
  if (!val || typeof val !== "string") return false;

  let digits = val.replace(/\D+/g, "");
  if (!digits) return false;

  if (digits.startsWith("00977") && digits.length === 15) {
    digits = digits.slice(5);
  } else if (digits.startsWith("977") && digits.length === 13) {
    digits = digits.slice(3);
  }

  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  return /^9[678]\d{8}$/.test(digits);
};

export const customerLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const customerRegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .max(100, "Name must be 100 characters or less"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .refine(normalizeAndValidateNepaliPhone, {
        message: "Must be a valid 10-digit Nepal mobile number (starts with 96, 97, or 98)",
      }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    password_confirmation: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });
