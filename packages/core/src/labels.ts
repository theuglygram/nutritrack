import type { ActivityLevel, GoalType, Sex, TargetAdjustment } from "./targets.ts";

/** User-facing wording shared by web and mobile so both apps say exactly the same thing. */

export const SEX_LABELS: Record<Sex, string> = { female: "Female", male: "Male" };

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, { label: string; description: string }> =
  {
    sedentary: { label: "Mostly sitting", description: "Desk job, little exercise" },
    light: { label: "Lightly active", description: "Light exercise 1–3 days a week" },
    moderate: { label: "Moderately active", description: "Exercise 3–5 days a week" },
    active: { label: "Very active", description: "Hard exercise 6–7 days a week" },
    very_active: {
      label: "Extremely active",
      description: "Physical job or training twice a day",
    },
  };

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  lose: "Lose weight",
  maintain: "Maintain my weight",
  gain: "Gain weight",
};

/** Weekly rate choices offered in onboarding (kg/week). Safety limits are applied by core. */
export const RATE_OPTIONS_KG_PER_WEEK: Record<Exclude<GoalType, "maintain">, number[]> = {
  lose: [0.25, 0.5, 0.75, 1],
  gain: [0.25, 0.5],
};

export const TARGET_ADJUSTMENT_MESSAGES: Record<TargetAdjustment, string> = {
  loss_rate_capped:
    "We've slowed your weekly loss to 1% of your body weight. Faster loss can cost muscle and isn't sustainable.",
  gain_rate_raised: "We've set a minimum gain of 0.25 kg a week so progress is noticeable.",
  gain_rate_capped: "We've limited gain to 0.5 kg a week to keep it mostly lean weight.",
  calorie_floor_applied:
    "Your target is at the safe minimum. For a lower target, speak to a doctor or dietitian.",
  protein_capped:
    "Your protein target is capped at 35% of your calories to keep your diet balanced.",
};

export const NOT_MEDICAL_ADVICE =
  "NutriTrack gives general nutrition guidance, not medical advice. If you are pregnant, breastfeeding or have a medical condition, speak to a doctor or registered dietitian before changing your diet.";

export const HEALTH_DATA_CONSENT =
  "I agree that NutriTrack may store and process my health information (such as my weight, height, age and food intake) to calculate my targets and track my progress. I can delete my account and data at any time.";
