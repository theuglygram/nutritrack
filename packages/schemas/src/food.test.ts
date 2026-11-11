import { describe, expect, it } from "vitest";
import { customFoodSchema, foodSearchQuerySchema } from "./food.ts";

const valid = { name: "Mama Put special", energyKcal: 180, proteinG: 6, carbsG: 22, fatG: 7 };

describe("foodSearchQuerySchema", () => {
  it("trims and requires 2 letters", () => {
    expect(foodSearchQuerySchema.parse("  ewa ")).toBe("ewa");
    expect(foodSearchQuerySchema.safeParse("a").success).toBe(false);
  });
});

describe("customFoodSchema", () => {
  it("accepts a food with an optional serving", () => {
    const parsed = customFoodSchema.parse({ ...valid, serving: { unit: "plate", grams: 450 } });
    expect(parsed.serving).toEqual({ unit: "plate", grams: 450 });
  });

  it("rejects impossible values", () => {
    expect(customFoodSchema.safeParse({ ...valid, energyKcal: 1200 }).success).toBe(false);
    expect(customFoodSchema.safeParse({ ...valid, proteinG: -1 }).success).toBe(false);
  });

  it("rejects macros that add up to more than 100 g", () => {
    const r = customFoodSchema.safeParse({ ...valid, proteinG: 50, carbsG: 40, fatG: 20 });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["fatG"]);
  });

  it("only allows known serving units", () => {
    expect(
      customFoodSchema.safeParse({ ...valid, serving: { unit: "bucket", grams: 10 } }).success,
    ).toBe(false);
  });
});
