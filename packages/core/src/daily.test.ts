import { describe, expect, it } from "vitest";
import {
  dailyTip,
  firstName,
  greetingFor,
  groupByMealSlot,
  isoDaysBefore,
  progressToward,
  sumLoggedNutrients,
  sumWaterMl,
  summariseWeights,
  type DailyTipInput,
} from "./daily.ts";

const entry = (kcal: number | null, p: number | null, c: number | null, f: number | null) => ({
  energy_kcal: kcal,
  protein_g: p,
  carbs_g: c,
  fat_g: f,
});

describe("sumLoggedNutrients", () => {
  it("returns zeros for an empty day", () => {
    expect(sumLoggedNutrients([])).toEqual({
      energyKcal: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      hasUnknownValues: false,
    });
  });

  it("adds snapshots and rounds without float drift", () => {
    const totals = sumLoggedNutrients([
      entry(320.4, 10.1, 50.2, 9.15),
      entry(150.3, 0.2, 30.1, 0.05),
    ]);
    expect(totals).toMatchObject({ energyKcal: 471, proteinG: 10.3, carbsG: 80.3, fatG: 9.2 });
  });

  it("flags unknown values instead of hiding them", () => {
    const totals = sumLoggedNutrients([entry(100, null, 10, 2)]);
    expect(totals.hasUnknownValues).toBe(true);
    expect(totals.proteinG).toBe(0);
  });
});

describe("progressToward", () => {
  it("reports remaining, percent and capped fraction", () => {
    expect(progressToward(500, 2000)).toEqual({
      consumed: 500,
      target: 2000,
      remaining: 1500,
      over: 0,
      percent: 25,
      fraction: 0.25,
    });
  });

  it("reports how far over the target", () => {
    const p = progressToward(2300, 2000);
    expect(p).toMatchObject({ remaining: 0, over: 300, percent: 115, fraction: 1 });
  });

  it("handles a missing target without dividing by zero", () => {
    expect(progressToward(100, 0)).toMatchObject({ percent: 0, fraction: 0, over: 100 });
  });
});

describe("groupByMealSlot", () => {
  it("keeps every slot, in order", () => {
    const groups = groupByMealSlot([
      { id: "a", meal_slot: "dinner" as const },
      { id: "b", meal_slot: "breakfast" as const },
    ]);
    expect(Object.keys(groups)).toEqual(["breakfast", "lunch", "dinner", "snack"]);
    expect(groups.dinner.map((e) => e.id)).toEqual(["a"]);
    expect(groups.lunch).toEqual([]);
  });
});

describe("greeting helpers", () => {
  it("picks the time of day", () => {
    expect(greetingFor(6)).toBe("Good morning");
    expect(greetingFor(12)).toBe("Good afternoon");
    expect(greetingFor(19)).toBe("Good evening");
  });

  it("uses the first name only", () => {
    expect(firstName("  Adaeze  Okafor ")).toBe("Adaeze");
    expect(firstName("")).toBeNull();
    expect(firstName(null)).toBeNull();
  });
});

describe("dailyTip", () => {
  const base: DailyTipInput = {
    hour: 9,
    entryCount: 0,
    totals: sumLoggedNutrients([]),
    targets: { calorieTarget: 2000, proteinG: 120 },
    waterMl: 0,
    waterTargetMl: 2500,
  };

  it("nudges to log when nothing is logged", () => {
    expect(dailyTip(base).id).toBe("start");
    expect(dailyTip({ ...base, hour: 14 }).id).toBe("start-late");
  });

  it("uses the user's own protein numbers in the afternoon", () => {
    const tip = dailyTip({
      ...base,
      hour: 16,
      entryCount: 2,
      totals: sumLoggedNutrients([entry(900, 40, 120, 20)]),
      waterMl: 2000,
    });
    expect(tip.id).toBe("protein-behind");
    expect(tip.message).toContain("40 g of your 120 g");
  });

  it("is supportive, not alarming, when over target", () => {
    const tip = dailyTip({
      ...base,
      entryCount: 3,
      totals: sumLoggedNutrients([entry(2250, 130, 200, 80)]),
    });
    expect(tip.id).toBe("over");
    expect(tip.message).toContain("250 kcal over");
  });

  it("reports on-track otherwise", () => {
    const tip = dailyTip({
      ...base,
      entryCount: 1,
      totals: sumLoggedNutrients([entry(500, 40, 50, 15)]),
    });
    expect(tip.id).toBe("on-track");
    expect(tip.message).toContain("1,500 kcal and 80 g protein left");
  });
});

describe("water", () => {
  it("sums millilitres", () => {
    expect(sumWaterMl([{ amount_ml: 500 }, { amount_ml: 250 }])).toBe(750);
  });
});

describe("summariseWeights", () => {
  it("returns null with no entries", () => {
    expect(summariseWeights([], "2026-10-01", 70)).toBeNull();
  });

  it("measures change within the window and distance to target", () => {
    const s = summariseWeights(
      [
        { measured_on: "2026-11-10", weight_kg: 78.4 },
        { measured_on: "2026-09-01", weight_kg: 85 },
        { measured_on: "2026-10-20", weight_kg: 80 },
      ],
      "2026-10-11",
      72,
    );
    expect(s).toEqual({
      current: { measured_on: "2026-11-10", weight_kg: 78.4 },
      change: -1.6,
      changeSince: "2026-10-20",
      toTarget: 6.4,
    });
  });

  it("has no change with a single weigh-in in the window", () => {
    const s = summariseWeights([{ measured_on: "2026-11-10", weight_kg: 70 }], "2026-10-11", null);
    expect(s?.change).toBeNull();
    expect(s?.toTarget).toBeNull();
  });
});

describe("isoDaysBefore", () => {
  it("crosses month and year boundaries", () => {
    expect(isoDaysBefore("2026-03-01", 1)).toBe("2026-02-28");
    expect(isoDaysBefore("2026-01-05", 30)).toBe("2025-12-06");
  });
});
