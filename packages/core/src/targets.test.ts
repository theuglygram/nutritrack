import { describe, expect, it } from "vitest";
import {
  TargetInputError,
  ageInYears,
  basalMetabolicRate,
  calculateDailyTargets,
  calorieFloorViolation,
  isAdult,
  type TargetInput,
} from "./targets.ts";

const base: TargetInput = {
  sex: "female",
  ageYears: 30,
  heightCm: 165,
  weightKg: 70,
  activityLevel: "moderate",
  goalType: "maintain",
  strengthTrains: false,
};

describe("ageInYears / isAdult", () => {
  it("counts whole years, turning over on the birthday", () => {
    expect(ageInYears("2008-11-10", "2026-11-10")).toBe(18);
    expect(ageInYears("2008-11-11", "2026-11-10")).toBe(17);
    expect(ageInYears("2008-02-29", "2026-02-28")).toBe(17);
    expect(ageInYears("2008-02-29", "2026-03-01")).toBe(18);
  });

  it("is 18+ only", () => {
    expect(isAdult("2008-11-10", "2026-11-10")).toBe(true);
    expect(isAdult("2008-11-11", "2026-11-10")).toBe(false);
  });

  it("rejects malformed and impossible dates", () => {
    expect(() => ageInYears("10/11/1990", "2026-11-10")).toThrow(TargetInputError);
    expect(() => ageInYears("1990-02-30", "2026-11-10")).toThrow(TargetInputError);
  });
});

describe("basalMetabolicRate (Mifflin–St Jeor)", () => {
  it("matches the published formula", () => {
    // 10×70 + 6.25×165 − 5×30 − 161 = 1420.25
    expect(basalMetabolicRate("female", 70, 165, 30)).toBeCloseTo(1420.25, 10);
    // 10×80 + 6.25×180 − 5×30 + 5 = 1780
    expect(basalMetabolicRate("male", 80, 180, 30)).toBe(1780);
  });
});

describe("calculateDailyTargets", () => {
  it("maintain: TDEE, 1.2 g/kg protein, 25% fat, carbs fill the rest", () => {
    // TDEE = 1420.25 × 1.55 = 2201.39 → 2200 kcal
    expect(calculateDailyTargets(base)).toEqual({
      bmrKcal: 1420,
      tdeeKcal: 2201,
      calorieTarget: 2200,
      proteinG: 84, // 1.2 × 70
      fatG: 61, // 2200 × 0.25 / 9 = 61.1
      carbsG: 329, // (2200 − 336 − 549) / 4 = 328.75
      waterMl: 2500,
      rateKgPerWeek: 0,
      adjustments: [],
    });
  });

  it("strength training raises protein to 1.6 g/kg", () => {
    expect(calculateDailyTargets({ ...base, strengthTrains: true }).proteinG).toBe(112);
  });

  it("lose: subtracts the daily deficit for the requested rate", () => {
    // 0.5 kg/week × 7700 / 7 = 550 kcal/day → 2201.39 − 550 = 1651.39 → 1650
    const t = calculateDailyTargets({ ...base, goalType: "lose", targetRateKgPerWeek: 0.5 });
    expect(t.calorieTarget).toBe(1650);
    expect(t.rateKgPerWeek).toBe(0.5);
    expect(t.adjustments).toEqual([]);
  });

  it("lose: caps the rate at 1% of body weight per week", () => {
    const t = calculateDailyTargets({ ...base, goalType: "lose", targetRateKgPerWeek: 1.5 });
    expect(t.rateKgPerWeek).toBe(0.7);
    // 0.7 × 7700 / 7 = 770 → 2201.39 − 770 = 1431.39 → 1430
    expect(t.calorieTarget).toBe(1430);
    expect(t.adjustments).toContain("loss_rate_capped");
  });

  it("never goes below the calorie floor, and says so", () => {
    const t = calculateDailyTargets({
      ...base,
      weightKg: 50,
      heightCm: 150,
      ageYears: 60,
      activityLevel: "sedentary",
      goalType: "lose",
      targetRateKgPerWeek: 0.5,
    });
    expect(t.calorieTarget).toBe(1200);
    expect(t.adjustments).toContain("calorie_floor_applied");
    expect(
      calculateDailyTargets({
        ...base,
        sex: "male",
        goalType: "lose",
        targetRateKgPerWeek: 0.7,
        weightKg: 70,
        heightCm: 150,
        ageYears: 70,
        activityLevel: "sedentary",
      }).calorieTarget,
    ).toBe(1500);
  });

  it("gain: keeps the rate within 0.25–0.5 kg/week", () => {
    const slow = calculateDailyTargets({ ...base, goalType: "gain", targetRateKgPerWeek: 0.1 });
    expect(slow.rateKgPerWeek).toBe(0.25);
    expect(slow.adjustments).toContain("gain_rate_raised");
    // 0.25 × 7700 / 7 = 275 → 2201.39 + 275 = 2476.39 → 2480
    expect(slow.calorieTarget).toBe(2480);

    const fast = calculateDailyTargets({ ...base, goalType: "gain", targetRateKgPerWeek: 1 });
    expect(fast.rateKgPerWeek).toBe(0.5);
    expect(fast.adjustments).toContain("gain_rate_capped");
  });

  it("caps protein at 35% of calories for heavy users on low targets", () => {
    const t = calculateDailyTargets({
      ...base,
      weightKg: 150,
      activityLevel: "sedentary",
      goalType: "lose",
      targetRateKgPerWeek: 1.5,
      strengthTrains: true,
    });
    expect(t.proteinG).toBeLessThan(1.6 * 150);
    expect(t.proteinG * 4).toBeLessThanOrEqual(t.calorieTarget * 0.35);
    expect(t.adjustments).toContain("protein_capped");
    expect(t.carbsG).toBeGreaterThan(0);
  });

  it("macro energy adds back up to the calorie target (within rounding)", () => {
    for (const goalType of ["lose", "maintain", "gain"] as const) {
      for (const strengthTrains of [true, false]) {
        const t = calculateDailyTargets({
          ...base,
          goalType,
          strengthTrains,
          targetRateKgPerWeek: 0.5,
        });
        const macroKcal = t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9;
        expect(Math.abs(macroKcal - t.calorieTarget)).toBeLessThanOrEqual(10);
      }
    }
  });

  it("rejects under-18s and out-of-range measurements", () => {
    expect(() => calculateDailyTargets({ ...base, ageYears: 17 })).toThrow(TargetInputError);
    expect(() => calculateDailyTargets({ ...base, weightKg: 10 })).toThrow(TargetInputError);
    expect(() => calculateDailyTargets({ ...base, heightCm: 300 })).toThrow(TargetInputError);
    expect(() =>
      calculateDailyTargets({ ...base, goalType: "lose", targetRateKgPerWeek: -1 }),
    ).toThrow(TargetInputError);
  });
});

describe("calorieFloorViolation (user overrides)", () => {
  it("mirrors the database floors", () => {
    expect(calorieFloorViolation("female", 1199)).toBe(1200);
    expect(calorieFloorViolation("female", 1200)).toBeNull();
    expect(calorieFloorViolation("male", 1499)).toBe(1500);
    expect(calorieFloorViolation(null, 1400)).toBe(1500);
  });
});
