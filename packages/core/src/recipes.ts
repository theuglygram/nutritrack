/**
 * Composite dishes (jollof rice, egusi soup …) are calculated from documented recipes
 * (ADR-013), never estimated: sum each ingredient's nutrients for its raw weight, then express
 * the total per 100 g of the finished dish using the measured cooked yield (water lost or gained
 * in cooking changes the concentration).
 */
import { NUTRIENT_KEYS, NutritionInputError, roundTo, type NutrientProfile } from "./nutrition.ts";

export type RecipeIngredient = { grams: number; per100g: NutrientProfile };

/**
 * Nutrients per 100 g of the cooked dish. A nutrient unknown for any ingredient is unknown for
 * the dish (null), because a partial sum would understate it (ADR-011).
 */
export function recipePer100g(
  ingredients: readonly RecipeIngredient[],
  yieldGrams: number,
): NutrientProfile {
  if (ingredients.length === 0)
    throw new NutritionInputError("A recipe needs at least one ingredient");
  if (!Number.isFinite(yieldGrams) || yieldGrams <= 0) {
    throw new NutritionInputError(
      `yieldGrams must be a positive finite number, received ${yieldGrams}`,
    );
  }
  const result = {} as NutrientProfile;
  for (const key of NUTRIENT_KEYS) {
    let total = 0;
    let unknown = false;
    for (const ing of ingredients) {
      if (!Number.isFinite(ing.grams) || ing.grams <= 0) {
        throw new NutritionInputError(`Ingredient grams must be positive, received ${ing.grams}`);
      }
      const value = ing.per100g[key];
      if (value === null) {
        unknown = true;
        break;
      }
      total += (value * ing.grams) / 100;
    }
    result[key] = unknown ? null : roundTo((total * 100) / yieldGrams);
  }
  return result;
}
