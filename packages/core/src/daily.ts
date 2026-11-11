/**
 * Deterministic daily-summary logic shared by the web and mobile dashboards (ADR-006, ADR-033).
 * Nothing here talks to the network; apps pass in rows they have already loaded.
 */
import { roundTo } from "./nutrition.ts";

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

/** The macro-relevant part of a logged entry's nutrient snapshot. `null` = unknown. */
export type LoggedNutrients = {
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

export type DailyTotals = {
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** True if any entry had an unknown value, so totals may be understated (ADR-011). */
  hasUnknownValues: boolean;
};

/** Sums known values; unknown values are skipped and flagged, never treated as zero silently. */
export function sumLoggedNutrients(entries: readonly LoggedNutrients[]): DailyTotals {
  let energyKcal = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let hasUnknownValues = false;
  for (const e of entries) {
    if (e.energy_kcal === null || e.protein_g === null || e.carbs_g === null || e.fat_g === null) {
      hasUnknownValues = true;
    }
    energyKcal += e.energy_kcal ?? 0;
    proteinG += e.protein_g ?? 0;
    carbsG += e.carbs_g ?? 0;
    fatG += e.fat_g ?? 0;
  }
  return {
    energyKcal: roundTo(energyKcal, 0),
    proteinG: roundTo(proteinG, 1),
    carbsG: roundTo(carbsG, 1),
    fatG: roundTo(fatG, 1),
    hasUnknownValues,
  };
}

export type Progress = {
  consumed: number;
  target: number;
  /** What is left before the target (0 once reached). */
  remaining: number;
  /** How far past the target (0 until exceeded). */
  over: number;
  /** Whole-number percentage of the target, not capped (can exceed 100). */
  percent: number;
  /** 0–1, capped, for drawing progress bars and rings. */
  fraction: number;
};

export function progressToward(consumed: number, target: number): Progress {
  const safeTarget = target > 0 ? target : 0;
  const ratio = safeTarget === 0 ? 0 : consumed / safeTarget;
  return {
    consumed,
    target: safeTarget,
    remaining: roundTo(Math.max(0, safeTarget - consumed), 1),
    over: roundTo(Math.max(0, consumed - safeTarget), 1),
    percent: Math.round(ratio * 100),
    fraction: Math.min(1, Math.max(0, ratio)),
  };
}

/** Groups entries by meal slot in display order. Every slot is present, possibly empty. */
export function groupByMealSlot<T extends { meal_slot: MealSlot }>(
  entries: readonly T[],
): Record<MealSlot, T[]> {
  const groups: Record<MealSlot, T[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const entry of entries) groups[entry.meal_slot].push(entry);
  return groups;
}

export function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** First word of the display name, for a friendly greeting. */
export function firstName(displayName: string | null): string | null {
  const first = displayName?.trim().split(/\s+/)[0];
  return first ? first : null;
}

export type DailyTipInput = {
  hour: number;
  entryCount: number;
  totals: DailyTotals;
  targets: { calorieTarget: number; proteinG: number };
  waterMl: number;
  waterTargetMl: number;
};

export type DailyTip = { id: string; message: string };

/**
 * One short, rule-based note about today, built only from the user's own numbers.
 * This is deterministic guidance, not AI analysis, and it never names specific foods
 * because dietary preferences and allergies are not recorded yet (ADR-033).
 */
export function dailyTip(input: DailyTipInput): DailyTip {
  const { hour, entryCount, totals, targets, waterMl, waterTargetMl } = input;
  const calories = progressToward(totals.energyKcal, targets.calorieTarget);
  const protein = progressToward(totals.proteinG, targets.proteinG);
  const water = progressToward(waterMl, waterTargetMl);

  if (entryCount === 0) {
    return hour < 11
      ? {
          id: "start",
          message: "Nothing logged yet. Start with breakfast to see your day take shape.",
        }
      : {
          id: "start-late",
          message: "Nothing logged yet today. Add your meals so far to see where you stand.",
        };
  }
  if (calories.over > 0) {
    return {
      id: "over",
      message: `You're ${fmt(calories.over)} kcal over today's target. One day doesn't define your progress — tomorrow is a fresh start.`,
    };
  }
  if (hour >= 15 && protein.percent < 50) {
    return {
      id: "protein-behind",
      message: `You've had ${fmt(totals.proteinG)} g of your ${fmt(targets.proteinG)} g protein. Choosing protein-rich foods at your next meal will help close the gap.`,
    };
  }
  if (hour >= 15 && water.percent < 50) {
    return {
      id: "water-behind",
      message: `You've had ${fmt(waterMl / 1000)} L of water so far. Keep a bottle nearby to reach ${fmt(waterTargetMl / 1000)} L.`,
    };
  }
  if (calories.percent >= 90) {
    return {
      id: "near-target",
      message: `You're within ${fmt(calories.remaining)} kcal of your target. Plan a lighter option if you're still hungry.`,
    };
  }
  return {
    id: "on-track",
    message: `${fmt(calories.remaining)} kcal and ${fmt(protein.remaining)} g protein left for today. You're on track.`,
  };
}

function fmt(value: number): string {
  return new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 }).format(value);
}

// Water ---------------------------------------------------------------------------------------

/**
 * Quick-add water portions. These are container sizes, not nutrition data: a "pure water"
 * sachet is 50 cl and the common bottled-water size is 75 cl.
 */
export const WATER_PORTIONS = [
  { id: "cup", label: "Cup", ml: 250 },
  { id: "sachet", label: "Sachet", ml: 500 },
  { id: "bottle", label: "Bottle", ml: 750 },
] as const;
export type WaterPortionId = (typeof WATER_PORTIONS)[number]["id"];

export const MAX_WATER_ENTRY_ML = 5000;

export function sumWaterMl(entries: readonly { amount_ml: number }[]): number {
  return entries.reduce((total, e) => total + e.amount_ml, 0);
}

export function formatLitres(ml: number): string {
  return `${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(ml / 1000)} L`;
}

// Weight --------------------------------------------------------------------------------------

export type WeightPoint = { measured_on: string; weight_kg: number };

export type WeightSummary = {
  current: WeightPoint;
  /** Change from the earliest entry inside the window to the latest (negative = lost). */
  change: number | null;
  changeSince: string | null;
  /** Kilograms left to the target weight (positive = still to go), or null without a target. */
  toTarget: number | null;
};

/**
 * Summarises weigh-ins (any order). `windowStart` (ISO date) limits the "recent change".
 * Returns null when there are no entries.
 */
export function summariseWeights(
  entries: readonly WeightPoint[],
  windowStart: string,
  targetWeightKg: number | null,
): WeightSummary | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => a.measured_on.localeCompare(b.measured_on));
  const current = sorted[sorted.length - 1] as WeightPoint;
  const inWindow = sorted.filter((e) => e.measured_on >= windowStart);
  const baseline = inWindow.length > 1 ? inWindow[0] : undefined;
  return {
    current,
    change: baseline ? roundTo(current.weight_kg - baseline.weight_kg, 1) : null,
    changeSince: baseline ? baseline.measured_on : null,
    toTarget:
      targetWeightKg === null ? null : roundTo(Math.abs(current.weight_kg - targetWeightKg), 1),
  };
}

/** ISO date `days` before `isoDate` (calendar arithmetic, no time zones involved). */
export function isoDaysBefore(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) - days));
  return date.toISOString().slice(0, 10);
}
