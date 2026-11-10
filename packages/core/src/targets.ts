/**
 * Daily calorie, macro and water targets (ADR-024, ADR-031). Deterministic; never LLM-generated.
 *
 * ⚠️ All constants below are widely used guideline values pending sign-off by a qualified
 * Nigerian dietitian (ADR-024 follow-up). Change them only through a recorded decision.
 * The calorie floors and minimum age are also enforced by the database
 * (supabase/migrations/20261110180000_onboarding.sql); keep both in sync.
 */

export type Sex = "female" | "male";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalType = "lose" | "maintain" | "gain";

export const MIN_AGE_YEARS = 18;

/** Minimum daily calorie target, including user overrides. */
export const CALORIE_FLOOR_KCAL: Record<Sex, number> = { female: 1200, male: 1500 };

/** Multipliers applied to BMR to estimate total daily energy expenditure. */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Approximate energy in 1 kg of body-weight change. */
export const KCAL_PER_KG = 7700;

/** Maximum weight loss per week as a fraction of current body weight. */
export const MAX_LOSS_FRACTION_PER_WEEK = 0.01;
export const GAIN_RATE_KG_PER_WEEK = { min: 0.25, max: 0.5 } as const;

export const PROTEIN_G_PER_KG = { strengthTraining: 1.6, default: 1.2 } as const;
/** Protein never exceeds this share of calories (upper end of the accepted 10–35% range). */
export const PROTEIN_MAX_ENERGY_SHARE = 0.35;
export const FAT_ENERGY_SHARE = 0.25;
export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

export const DEFAULT_WATER_ML = 2500;

export interface TargetInput {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  /** Requested rate of change for lose/gain goals; ignored for maintain. */
  targetRateKgPerWeek?: number | undefined;
  strengthTrains: boolean;
}

/** Why a computed target differs from what the user asked for. Shown to the user. */
export type TargetAdjustment =
  | "loss_rate_capped"
  | "gain_rate_raised"
  | "gain_rate_capped"
  | "calorie_floor_applied"
  | "protein_capped";

export interface DailyTargets {
  bmrKcal: number;
  tdeeKcal: number;
  calorieTarget: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
  /** The rate actually used after safety limits, in kg per week (0 for maintain). */
  rateKgPerWeek: number;
  adjustments: TargetAdjustment[];
}

export class TargetInputError extends Error {
  override name = "TargetInputError";
}

/** Whole years between an ISO date of birth (YYYY-MM-DD) and an ISO date `today`. */
export function ageInYears(dateOfBirth: string, today: string): number {
  const dob = parseIsoDate(dateOfBirth, "dateOfBirth");
  const now = parseIsoDate(today, "today");
  let age = now.year - dob.year;
  if (now.month < dob.month || (now.month === dob.month && now.day < dob.day)) {
    age -= 1;
  }
  return age;
}

export function isAdult(dateOfBirth: string, today: string): boolean {
  return ageInYears(dateOfBirth, today) >= MIN_AGE_YEARS;
}

/** Mifflin–St Jeor basal metabolic rate, kcal/day. */
export function basalMetabolicRate(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  ageYears: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return base + (sex === "male" ? 5 : -161);
}

export function calculateDailyTargets(input: TargetInput): DailyTargets {
  validateInput(input);
  const adjustments: TargetAdjustment[] = [];

  const bmr = basalMetabolicRate(input.sex, input.weightKg, input.heightCm, input.ageYears);
  const tdee = bmr * ACTIVITY_FACTORS[input.activityLevel];

  // 1. Safe rate of change.
  let rate = 0;
  if (input.goalType === "lose") {
    const requested = input.targetRateKgPerWeek ?? 0;
    const maxLoss = input.weightKg * MAX_LOSS_FRACTION_PER_WEEK;
    rate = Math.min(requested, maxLoss);
    if (requested > maxLoss) adjustments.push("loss_rate_capped");
  } else if (input.goalType === "gain") {
    const requested = input.targetRateKgPerWeek ?? GAIN_RATE_KG_PER_WEEK.min;
    rate = Math.min(Math.max(requested, GAIN_RATE_KG_PER_WEEK.min), GAIN_RATE_KG_PER_WEEK.max);
    if (requested < GAIN_RATE_KG_PER_WEEK.min) adjustments.push("gain_rate_raised");
    if (requested > GAIN_RATE_KG_PER_WEEK.max) adjustments.push("gain_rate_capped");
  }

  // 2. Calories: TDEE ± the daily energy needed for that rate, never below the floor.
  const dailyDelta = (rate * KCAL_PER_KG) / 7;
  let calories = roundToNearest(
    input.goalType === "lose" ? tdee - dailyDelta : tdee + dailyDelta,
    10,
  );
  const floor = CALORIE_FLOOR_KCAL[input.sex];
  if (calories < floor) {
    calories = floor;
    adjustments.push("calorie_floor_applied");
  }

  // 3. Macros: protein by body weight (capped), fat by share of energy, carbs fill the rest.
  const proteinPerKg = input.strengthTrains
    ? PROTEIN_G_PER_KG.strengthTraining
    : PROTEIN_G_PER_KG.default;
  let proteinG = Math.round(proteinPerKg * input.weightKg);
  const maxProteinG = Math.floor((calories * PROTEIN_MAX_ENERGY_SHARE) / KCAL_PER_G.protein);
  if (proteinG > maxProteinG) {
    proteinG = maxProteinG;
    adjustments.push("protein_capped");
  }
  const fatG = Math.round((calories * FAT_ENERGY_SHARE) / KCAL_PER_G.fat);
  const carbsG = Math.round(
    (calories - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat) / KCAL_PER_G.carbs,
  );

  return {
    bmrKcal: Math.round(bmr),
    tdeeKcal: Math.round(tdee),
    calorieTarget: calories,
    proteinG,
    carbsG,
    fatG,
    waterMl: DEFAULT_WATER_ML,
    rateKgPerWeek: roundToNearest(rate, 0.01),
    adjustments,
  };
}

/** Returns the floor that a user-entered calorie target violates, or null if it is allowed. */
export function calorieFloorViolation(sex: Sex | null, calorieTarget: number): number | null {
  // Unknown sex → the higher floor, matching the database trigger.
  const floor = sex ? CALORIE_FLOOR_KCAL[sex] : Math.max(...Object.values(CALORIE_FLOOR_KCAL));
  return calorieTarget < floor ? floor : null;
}

function validateInput(input: TargetInput): void {
  const checks: [boolean, string][] = [
    [Number.isFinite(input.ageYears) && input.ageYears >= MIN_AGE_YEARS, "ageYears must be 18+"],
    [Number.isFinite(input.heightCm) && input.heightCm >= 50 && input.heightCm <= 272, "heightCm"],
    [Number.isFinite(input.weightKg) && input.weightKg >= 20 && input.weightKg <= 400, "weightKg"],
    [
      input.targetRateKgPerWeek === undefined ||
        (Number.isFinite(input.targetRateKgPerWeek) && input.targetRateKgPerWeek >= 0),
      "targetRateKgPerWeek must be ≥ 0",
    ],
  ];
  for (const [ok, message] of checks) {
    if (!ok) throw new TargetInputError(`Invalid target input: ${message}`);
  }
}

function roundToNearest(value: number, step: number): number {
  const rounded = Math.round(value / step) * step;
  // Remove floating-point noise from steps like 0.01.
  return Number(rounded.toFixed(10));
}

function parseIsoDate(value: string, label: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new TargetInputError(`${label} must be an ISO date (YYYY-MM-DD)`);
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new TargetInputError(`${label} is not a real calendar date`);
  }
  return { year, month, day };
}
