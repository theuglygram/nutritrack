import {
  requestPasswordResetSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  verifyEmailSchema,
  type RequestPasswordResetInput,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
  type VerifyEmailInput,
} from "@nutritrack/schemas";
import type { NutriTrackClient } from "./client.ts";
import { ApiError, fromAuthError } from "./errors.ts";

/**
 * Email + password auth with 6-digit email codes (ADR-031). The same calls run on web and mobile.
 * Inputs are validated with the shared schemas before anything is sent.
 */

/** Creates the account and emails a confirmation code. The user is not signed in until verified. */
export async function signUp(client: NutriTrackClient, input: SignUpInput): Promise<void> {
  const { email, password } = signUpSchema.parse(input);
  const { error } = await client.auth.signUp({ email, password });
  if (error) throw fromAuthError(error);
}

/** Confirms the email with the code and signs the user in. */
export async function verifySignUpCode(
  client: NutriTrackClient,
  input: VerifyEmailInput,
): Promise<void> {
  const { email, code } = verifyEmailSchema.parse(input);
  const { data, error } = await client.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) throw fromAuthError(error);
  if (!data.session) throw new ApiError("invalid_code", "That code is wrong or has expired.");
}

export async function resendSignUpCode(client: NutriTrackClient, email: string): Promise<void> {
  const { error } = await client.auth.resend({ type: "signup", email: email.trim().toLowerCase() });
  if (error) throw fromAuthError(error);
}

export async function signIn(client: NutriTrackClient, input: SignInInput): Promise<void> {
  const { email, password } = signInSchema.parse(input);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw fromAuthError(error);
}

export async function signOut(client: NutriTrackClient): Promise<void> {
  const { error } = await client.auth.signOut();
  if (error) throw fromAuthError(error);
}

/**
 * Emails a password-reset code. Resolves even if no account exists, so the response never reveals
 * which emails are registered.
 */
export async function requestPasswordReset(
  client: NutriTrackClient,
  input: RequestPasswordResetInput,
): Promise<void> {
  const { email } = requestPasswordResetSchema.parse(input);
  const { error } = await client.auth.resetPasswordForEmail(email);
  if (error) throw fromAuthError(error);
}

/** Verifies the reset code (which signs the user in) and sets the new password. */
export async function resetPassword(
  client: NutriTrackClient,
  input: ResetPasswordInput,
): Promise<void> {
  const { email, code, password } = resetPasswordSchema.parse(input);
  const verified = await client.auth.verifyOtp({ email, token: code, type: "recovery" });
  if (verified.error) throw fromAuthError(verified.error);
  const updated = await client.auth.updateUser({ password });
  if (updated.error) throw fromAuthError(updated.error);
}
