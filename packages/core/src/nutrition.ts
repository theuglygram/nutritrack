/**
 * Deterministic nutrition calculations (ADR-006).
 *
 * All nutrient values in the food database are stored per 100 g. A value of `null`
 * means "unknown for this food" and must never be treated as zero (ADR-011).
 */

export const NUTRIENT_KEYS = [
  "energyKcal",
  "proteinG",
  "carbsG",
  "fatG",
  "fibreG",
  "sugarG",
  "sodiumMg",
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

/** Nutrient amounts per 100 g of food. `null` = unknown. */
export type NutrientProfile = Record<NutrientKey, number | null>;

/** Decimal places kept for stored and computed nutrient values. */
export const NUTRIENT_DECIMALS = 2;

export class NutritionInputError extends Error {
  override name = "NutritionInputError";
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new NutritionInputError(`${label} must be a positive finite number, received ${value}`);
  }
}

/**
 * Round half away from zero to a fixed number of decimal places.
 * The scaled value is snapped to 15 significant digits first so binary floating-point
 * artefacts (1.005 × 100 = 100.49999999999999) don't round the wrong way.
 */
export function roundTo(value: number, decimals: number = NUTRIENT_DECIMALS): number {
  const factor = 10 ** decimals;
  const scaled = Number((Math.abs(value) * factor).toPrecision(15));
  const rounded = (Math.sign(value) * Math.round(scaled)) / factor;
  // Normalise -0 to 0.
  return rounded === 0 ? 0 : rounded;
}

/**
 * Grams eaten for a quantity of a serving unit, e.g. 1.5 wraps × 220 g per wrap.
 * `gramsPerUnit` comes from the food's own serving definition (a wrap of eba ≠ a wrap of amala).
 */
export function gramsForServing(quantity: number, gramsPerUnit: number): number {
  assertPositiveFinite(quantity, "quantity");
  assertPositiveFinite(gramsPerUnit, "gramsPerUnit");
  return roundTo(quantity * gramsPerUnit);
}

/** Scale a per-100 g nutrient profile to a portion in grams. Unknown values stay unknown. */
export function scaleNutrients(per100g: NutrientProfile, grams: number): NutrientProfile {
  assertPositiveFinite(grams, "grams");
  const result = {} as NutrientProfile;
  for (const key of NUTRIENT_KEYS) {
    const value = per100g[key];
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      throw new NutritionInputError(`${key} must be a non-negative finite number or null`);
    }
    result[key] = value === null ? null : roundTo((value * grams) / 100);
  }
  return result;
}
