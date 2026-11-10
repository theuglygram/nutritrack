import type { AuthError, PostgrestError } from "@supabase/supabase-js";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "email_taken"
  | "weak_password"
  | "invalid_code"
  | "rate_limited"
  | "same_password"
  | "not_signed_in"
  | "underage"
  | "calorie_floor"
  | "consent_required"
  | "validation"
  | "network"
  | "unknown";

/** Error with a stable code for logic and a message that is safe to show to users. */
export class ApiError extends Error {
  override name = "ApiError";
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
  }
}

const AUTH_MESSAGES: Partial<Record<string, [ApiErrorCode, string]>> = {
  invalid_credentials: ["invalid_credentials", "Email or password is incorrect."],
  email_not_confirmed: ["email_not_confirmed", "Please confirm your email address first."],
  user_already_exists: [
    "email_taken",
    "An account with this email already exists. Try signing in.",
  ],
  email_exists: ["email_taken", "An account with this email already exists. Try signing in."],
  weak_password: [
    "weak_password",
    "Choose a stronger password: at least 8 characters with letters and numbers.",
  ],
  otp_expired: ["invalid_code", "That code is wrong or has expired. Request a new one."],
  same_password: ["same_password", "Your new password must be different from the old one."],
  over_email_send_rate_limit: [
    "rate_limited",
    "Please wait a minute before requesting another email.",
  ],
  over_request_rate_limit: [
    "rate_limited",
    "Too many attempts. Please wait a few minutes and try again.",
  ],
  email_address_invalid: ["validation", "Enter a valid email address."],
  session_not_found: ["not_signed_in", "Your session has ended. Please sign in again."],
  session_expired: ["not_signed_in", "Your session has ended. Please sign in again."],
};

export function fromAuthError(error: AuthError): ApiError {
  const mapped = error.code ? AUTH_MESSAGES[error.code] : undefined;
  if (mapped) return new ApiError(mapped[0], mapped[1], error);
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return new ApiError(
      "network",
      "Can't reach NutriTrack. Check your connection and try again.",
      error,
    );
  }
  return new ApiError("unknown", "Something went wrong. Please try again.", error);
}

/** Maps database errors, including the `hint`s raised by our own triggers and functions. */
export function fromPostgrestError(error: PostgrestError): ApiError {
  switch (error.hint) {
    case "underage":
      return new ApiError("underage", "NutriTrack is for adults aged 18 and over.", error);
    case "calorie_floor":
      return new ApiError(
        "calorie_floor",
        "That calorie target is below the safe minimum. Speak to a doctor or dietitian about lower targets.",
        error,
      );
    case "consent_required":
      return new ApiError("consent_required", "You need to agree before continuing.", error);
  }
  if (error.code === "42501") {
    return new ApiError("not_signed_in", "Your session has ended. Please sign in again.", error);
  }
  if (error.code === "23514" || error.code === "22P02") {
    return new ApiError(
      "validation",
      "Some of the details aren't valid. Please check and try again.",
      error,
    );
  }
  return new ApiError("unknown", "Something went wrong. Please try again.", error);
}

/** A message that is safe and useful to show users for any thrown error. */
export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Please check your details.";
  return "Something went wrong. Please try again.";
}
