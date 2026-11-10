import { describe, expect, it } from "vitest";
import {
  NutritionInputError,
  gramsForServing,
  roundTo,
  scaleNutrients,
  type NutrientProfile,
} from "./nutrition.ts";

// Arbitrary test values — not real food data.
const profile: NutrientProfile = {
  energyKcal: 150,
  proteinG: 1.2,
  carbsG: 35.5,
  fatG: 0.3,
  fibreG: null,
  sugarG: 0,
  sodiumMg: null,
};

describe("roundTo", () => {
  it("rounds to 2 decimals by default", () => {
    expect(roundTo(1.005)).toBe(1.01);
    expect(roundTo(0.1 + 0.2)).toBe(0.3);
  });

  it("rounds half away from zero and normalises -0", () => {
    expect(roundTo(-1.005)).toBe(-1.01);
    expect(Object.is(roundTo(-0.001), 0)).toBe(true);
  });
});

describe("gramsForServing", () => {
  it("multiplies quantity by grams per unit", () => {
    expect(gramsForServing(1.5, 220)).toBe(330);
    expect(gramsForServing(3, 0.1)).toBe(0.3);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("rejects quantity %s", (q) => {
    expect(() => gramsForServing(q, 100)).toThrow(NutritionInputError);
  });

  it("rejects non-positive grams per unit", () => {
    expect(() => gramsForServing(1, 0)).toThrow(NutritionInputError);
  });
});

describe("scaleNutrients", () => {
  it("scales per-100 g values to the portion", () => {
    expect(scaleNutrients(profile, 250)).toEqual({
      energyKcal: 375,
      proteinG: 3,
      carbsG: 88.75,
      fatG: 0.75,
      fibreG: null,
      sugarG: 0,
      sodiumMg: null,
    });
  });

  it("keeps unknown values as null rather than zero", () => {
    const scaled = scaleNutrients(profile, 50);
    expect(scaled.fibreG).toBeNull();
    expect(scaled.sugarG).toBe(0);
  });

  it("is identity at 100 g", () => {
    expect(scaleNutrients(profile, 100)).toEqual(profile);
  });

  // Same inputs and expected outputs as supabase/tests/database/03_food_log.test.sql,
  // so the client preview and the database snapshot provably agree.
  it("matches the database snapshot for the same portion", () => {
    const grams = gramsForServing(1.5, 220);
    expect(grams).toBe(330);
    expect(scaleNutrients(profile, grams)).toEqual({
      energyKcal: 495,
      proteinG: 3.96,
      carbsG: 117.15,
      fatG: 0.99,
      fibreG: null,
      sugarG: 0,
      sodiumMg: null,
    });
    expect(scaleNutrients({ ...profile, energyKcal: 0.67 }, 150).energyKcal).toBe(1.01);
  });

  it("rejects negative nutrient values and invalid grams", () => {
    expect(() => scaleNutrients({ ...profile, fatG: -1 }, 100)).toThrow(NutritionInputError);
    expect(() => scaleNutrients(profile, 0)).toThrow(NutritionInputError);
  });
});
