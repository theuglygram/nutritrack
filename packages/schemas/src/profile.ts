import { MIN_AGE_YEARS, calorieFloorViolation, isAdult, type Sex } from "@nutritrack/core";
import { Constants } from "@nutritrack/types";
import { z } from "zod";

const Enums = Constants.public.Enums;

/** Version of the health-data consent text shown in onboarding. Bump when the wording changes. */
export const CONSENT_VERSION = "2026-11-10";

export const sexSchema = z.enum(Enums.sex);
export const activityLevelSchema = z.enum(Enums.activity_level);
export const goalTypeSchema = z.enum(Enums.goal_type);

const isoDate = z.iso.date({ error: "Enter a valid date" });

function isRealIsoDate(value: string): boolean {
  return isoDate.safeParse(value).success;
}

/**
 * Everything the user enters during onboarding. `today` is the user's local date, passed in so
 * validation is deterministic and testable.
 */
export function onboardingSchema(today: string) {
  return z
    .object({
      displayName: z.string().trim().min(1, { error: "Enter your name" }).max(80),
      sex: sexSchema,
      // Zod 4 runs refinements even when the format check failed, so only judge age for
      // well-formed dates; malformed ones are already reported by the format check.
      dateOfBirth: isoDate.refine((dob) => !isRealIsoDate(dob) || isAdult(dob, today), {
        error: `NutriTrack is for adults aged ${MIN_AGE_YEARS} and over`,
      }),
      heightCm: z.number().min(50).max(272),
      weightKg: z.number().min(20).max(400),
      activityLevel: activityLevelSchema,
      strengthTrains: z.boolean(),
      goalType: goalTypeSchema,
      targetWeightKg: z.number().min(20).max(400).optional(),
      targetRateKgPerWeek: z.number().min(0).max(2).optional(),
      consent: z.literal(true, { error: "You need to agree before continuing" }),
    })
    .superRefine((v, ctx) => {
      if (v.goalType === "maintain") return;
      if (v.targetRateKgPerWeek === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["targetRateKgPerWeek"],
          message: "Choose a weekly rate",
        });
      }
      if (v.targetWeightKg === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["targetWeightKg"],
          message: "Enter a target weight",
        });
        return;
      }
      if (v.goalType === "lose" && v.targetWeightKg >= v.weightKg) {
        ctx.addIssue({
          code: "custom",
          path: ["targetWeightKg"],
          message: "Target weight should be below your current weight",
        });
      }
      if (v.goalType === "gain" && v.targetWeightKg <= v.weightKg) {
        ctx.addIssue({
          code: "custom",
          path: ["targetWeightKg"],
          message: "Target weight should be above your current weight",
        });
      }
    });
}

export type OnboardingInput = z.infer<ReturnType<typeof onboardingSchema>>;

/** Profile details a user can change after onboarding. */
export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1, { error: "Enter your name" }).max(80),
  heightCm: z.number({ error: "Enter your height" }).min(50).max(272),
  activityLevel: activityLevelSchema,
  strengthTrains: z.boolean(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/** A user's manual override of their daily targets. Floors match the database (ADR-031). */
export function targetOverrideSchema(sex: Sex | null) {
  return z
    .object({
      calorieTarget: z.int().min(500).max(10000),
      proteinG: z.int().min(0).max(1000),
      carbsG: z.int().min(0).max(2000),
      fatG: z.int().min(0).max(1000),
      waterMl: z.int().min(0).max(10000),
    })
    .superRefine((v, ctx) => {
      const floor = calorieFloorViolation(sex, v.calorieTarget);
      if (floor !== null) {
        ctx.addIssue({
          code: "custom",
          path: ["calorieTarget"],
          message: `For your safety the minimum is ${floor} kcal. Speak to a doctor or dietitian about lower targets.`,
        });
      }
    });
}

export type TargetOverrideInput = z.infer<ReturnType<typeof targetOverrideSchema>>;
