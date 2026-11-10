import { describe, expect, it } from "vitest";
import { nutrientProfileSchema, servingInputSchema } from "./nutrition.ts";

const valid = {
  energyKcal: 150,
  proteinG: 1.2,
  carbsG: 35.5,
  fatG: 0.3,
  fibreG: null,
  sugarG: 0,
  sodiumMg: null,
};

describe("nutrientProfileSchema", () => {
  it("accepts numbers and nulls", () => {
    expect(nutrientProfileSchema.parse(valid)).toEqual(valid);
  });

  it("rejects missing keys instead of defaulting them", () => {
    const { fibreG, ...missing } = valid;
    expect(nutrientProfileSchema.safeParse(missing).success).toBe(false);
  });

  it("rejects negative, infinite and unknown fields", () => {
    expect(nutrientProfileSchema.safeParse({ ...valid, fatG: -0.1 }).success).toBe(false);
    expect(nutrientProfileSchema.safeParse({ ...valid, fatG: Infinity }).success).toBe(false);
    expect(nutrientProfileSchema.safeParse({ ...valid, vitaminC: 1 }).success).toBe(false);
  });
});

describe("servingInputSchema", () => {
  it("requires positive quantity and grams per unit", () => {
    expect(servingInputSchema.safeParse({ quantity: 1.5, gramsPerUnit: 220 }).success).toBe(true);
    expect(servingInputSchema.safeParse({ quantity: 0, gramsPerUnit: 220 }).success).toBe(false);
    expect(servingInputSchema.safeParse({ quantity: 1, gramsPerUnit: -5 }).success).toBe(false);
  });
});
