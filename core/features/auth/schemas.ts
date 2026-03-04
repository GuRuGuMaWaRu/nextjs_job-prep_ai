import z from "zod";

import {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from "@/core/features/auth/constants";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email address");

const passwordStrengthSchema = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  )
  .max(
    MAX_PASSWORD_LENGTH,
    `Password must be less than ${MAX_PASSWORD_LENGTH} characters`
  )
  .refine((password) => /[a-zA-Z]/.test(password), {
    message: "Password must contain at least one letter and one number",
  })
  .refine((password) => /[0-9]/.test(password), {
    message: "Password must contain at least one letter and one number",
  });

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: emailSchema,
  password: passwordStrengthSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
