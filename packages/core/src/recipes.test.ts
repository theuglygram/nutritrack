import { describe, expect, it } from "vitest";
import type { NutrientProfile } from "./nutrition.ts";
import { recipePer100g } from "./recipes.ts";

const profile = (kcal: number | null, protein: number | null): NutrientProfile => ({
  energyKcal: kcal,
  proteinG: protein,
  carbsG: 0,
  fatG: 0,
  fibreG: 0,
  sugarG: 0,
  sodiumMg: 0,
});

describe("recipePer100g", () => {
  it("concentrates nutrients when cooking loses water", () => {
    // 200 g at 100 kcal/100 g + 100 g at 400 kcal/100 g = 600 kcal; cooks down to 250 g.
    const r = recipePer100g(
      [
        { grams: 200, per100g: profile(100, 2) },
        { grams: 100, per100g: profile(400, 10) },
      ],
      250,
    );
    expect(r.energyKcal).toBe(240);
    expect(r.proteinG).toBe(5.6);
  });

  it("dilutes nutrients when cooking absorbs water", () => {
    // 100 g dry rice at 360 kcal absorbs water to 300 g cooked.
    expect(recipePer100g([{ grams: 100, per100g: profile(360, 7) }], 300).energyKcal).toBe(120);
  });

  it("keeps a nutrient unknown if any ingredient lacks it", () => {
    const r = recipePer100g(
      [
        { grams: 100, per100g: profile(100, null) },
        { grams: 100, per100g: profile(100, 5) },
      ],
      200,
    );
    expect(r.proteinG).toBeNull();
    expect(r.energyKcal).toBe(100);
  });

  it("rejects empty recipes and impossible yields", () => {
    expect(() => recipePer100g([], 100)).toThrow();
    expect(() => recipePer100g([{ grams: 100, per100g: profile(1, 1) }], 0)).toThrow();
  });
});
