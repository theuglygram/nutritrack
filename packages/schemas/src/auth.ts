import { z } from "zod";

/** Mirrors supabase/config.toml: minimum_password_length = 8, password_requirements = letters_digits. */
export const PASSWORD_MIN_LENGTH = 8;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address" }));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { error: `Use at least ${PASSWORD_MIN_LENGTH} characters` })
  .max(72, { error: "Use 72 characters or fewer" })
  .regex(/[A-Za-z]/, { error: "Include at least one letter" })
  .regex(/\d/, { error: "Include at least one number" });

/** 6-digit code from a confirmation or password-reset email (otp_length = 6). */
export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { error: "Enter the 6-digit code from the email" });

export const signUpSchema = z.object({ email: emailSchema, password: passwordSchema });
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Enter your password" }),
});
export const verifyEmailSchema = z.object({ email: emailSchema, code: otpCodeSchema });
export const requestPasswordResetSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  password: passwordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
