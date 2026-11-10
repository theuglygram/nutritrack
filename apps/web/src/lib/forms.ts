import { toUserMessage } from "@nutritrack/api-client";
import { firstErrorPerField } from "@nutritrack/schemas";

export type { FieldErrors } from "@nutritrack/schemas";
export const fieldErrors = firstErrorPerField;
export const errorMessage = toUserMessage;

/** "" → undefined, otherwise a number (NaN stays NaN so validation reports it). */
export function toNumber(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}
