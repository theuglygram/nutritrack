import type { ActivityLevel, GoalType, Sex } from "@nutritrack/core";
import type { ZodError } from "zod";
import { onboardingSchema, type OnboardingInput } from "./profile.ts";

/**
 * The multi-step onboarding flow, shared by web and mobile so both ask the same questions in the
 * same order and validate them identically. UI code only renders steps and calls these helpers.
 */

export type FieldErrors = Partial<Record<string, string>>;

/** First error message per field path, for showing next to inputs. */
export function firstErrorPerField(error: ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}

/** What the user has typed so far. Text inputs stay strings until validation. */
export type OnboardingDraft = {
  displayName: string;
  sex?: Sex | undefined;
  dateOfBirth: string;
  heightCm: string;
  weightKg: string;
  activityLevel?: ActivityLevel | undefined;
  strengthTrains?: "yes" | "no" | undefined;
  goalType?: GoalType | undefined;
  targetWeightKg: string;
  targetRateKgPerWeek?: string | undefined;
  consent: boolean;
};

export const EMPTY_ONBOARDING_DRAFT: OnboardingDraft = {
  displayName: "",
  dateOfBirth: "",
  heightCm: "",
  weightKg: "",
  targetWeightKg: "",
  consent: false,
};

export const ONBOARDING_STEPS = [
  { title: "About you", fields: ["displayName", "sex", "dateOfBirth", "heightCm", "weightKg"] },
  { title: "Your activity", fields: ["activityLevel", "strengthTrains"] },
  { title: "Your goal", fields: ["goalType", "targetWeightKg", "targetRateKgPerWeek"] },
  { title: "Your daily targets", fields: ["consent"] },
] as const;

export const LAST_ONBOARDING_STEP = ONBOARDING_STEPS.length - 1;

function toNumber(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

function toCandidate(d: OnboardingDraft, assumeConsent: boolean) {
  const maintain = d.goalType === "maintain";
  return {
    displayName: d.displayName,
    sex: d.sex,
    dateOfBirth: d.dateOfBirth,
    heightCm: toNumber(d.heightCm),
    weightKg: toNumber(d.weightKg),
    activityLevel: d.activityLevel,
    strengthTrains: d.strengthTrains === undefined ? undefined : d.strengthTrains === "yes",
    goalType: d.goalType,
    targetWeightKg: maintain ? undefined : toNumber(d.targetWeightKg),
    targetRateKgPerWeek:
      maintain || d.targetRateKgPerWeek === undefined ? undefined : Number(d.targetRateKgPerWeek),
    consent: assumeConsent ? true : d.consent,
  };
}

/**
 * Validates one step. Later steps' fields may still be empty, so only this step's errors count.
 * Consent is assumed until the last step. `data` is the full input once everything is valid.
 */
export function validateOnboardingStep(
  today: string,
  draft: OnboardingDraft,
  step: number,
): { errors: FieldErrors; data: OnboardingInput | null } {
  const isLast = step >= LAST_ONBOARDING_STEP;
  const result = onboardingSchema(today).safeParse(toCandidate(draft, !isLast));
  if (result.success) return { errors: {}, data: result.data };
  const fields: readonly string[] =
    ONBOARDING_STEPS[Math.min(step, LAST_ONBOARDING_STEP)]?.fields ?? [];
  const errors = Object.fromEntries(
    Object.entries(firstErrorPerField(result.error)).filter(([key]) => fields.includes(key)),
  );
  return { errors, data: null };
}

/** The complete input if every answer except consent is valid — used to preview targets. */
export function onboardingAnswersForPreview(
  today: string,
  draft: OnboardingDraft,
): OnboardingInput | null {
  const result = onboardingSchema(today).safeParse(toCandidate(draft, true));
  return result.success ? result.data : null;
}

/** Latest date of birth allowed for an adult today (for date-picker limits). */
export function latestAdultBirthDate(today: string, minAgeYears: number): string {
  const [y, m, d] = today.split("-");
  return `${Number(y) - minAgeYears}-${m}-${d}`;
}
