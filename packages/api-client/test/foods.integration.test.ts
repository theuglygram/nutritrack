/**
 * Food search, detail and custom foods against local Supabase with the seeded catalogue
 * (supabase/seed.sql). Run: pnpm --filter @nutritrack/api-client test:integration
 */
import { beforeAll, describe, expect, it } from "vitest";
import {
  createCustomFood,
  deleteCustomFood,
  getFood,
  listMyFoods,
  searchFoods,
  type NutriTrackClient,
} from "../src/index.ts";
import { configured, confirmedUser } from "./helpers.ts";

describe.skipIf(!configured)("foods against local Supabase", () => {
  let ada: NutriTrackClient;
  let bayo: NutriTrackClient;

  beforeAll(async () => {
    [ada, bayo] = await Promise.all([confirmedUser("it-foods-a"), confirmedUser("it-foods-b")]);
  });

  it.each([
    ["ewa", "Beans (cowpeas), boiled"],
    ["dodo", "Plantain, ripe, fried"],
    ["ji", "Yam, boiled"],
    ["epo pupa", "Palm oil"],
    ["rice", "Rice, white, boiled"],
  ])("finds %s → %s", async (query, expected) => {
    const [first] = await searchFoods(ada, query);
    expect(first?.name).toBe(expected);
  });

  it("returns nothing for one-letter queries without calling the database", async () => {
    expect(await searchFoods(ada, "e")).toEqual([]);
  });

  it("loads a food's source, per-100 g values and sourced servings", async () => {
    const [rice] = await searchFoods(ada, "Rice, white, boiled");
    const food = await getFood(ada, rice?.id ?? "");
    expect(food?.source?.licence).toBe("CC0 1.0 (public domain)");
    expect(food?.per100g).toMatchObject({
      energyKcal: 130,
      proteinG: 2.69,
      carbsG: 28.17,
      fatG: 0.28,
    });
    expect(food?.servings).toContainEqual({ unitName: "cup", grams: 158, isEstimate: false });
    expect(food?.verificationStatus).toBe("unverified");
    expect(food?.aliases.map((a) => a.alias)).toContain("shinkafa");
  });

  it("creates, lists and deletes a private custom food", async () => {
    const id = await createCustomFood(ada, {
      name: "Ada's moi moi",
      energyKcal: 150,
      proteinG: 8,
      carbsG: 14,
      fatG: 6,
      serving: { unit: "wrap", grams: 180 },
    });
    expect((await listMyFoods(ada)).map((f) => f.id)).toContain(id);
    const food = await getFood(ada, id);
    expect(food).toMatchObject({ isCustom: true, verificationStatus: "unverified" });
    expect(food?.servings).toEqual([{ unitName: "wrap", grams: 180, isEstimate: true }]);

    // Private: another user can neither find nor open it.
    expect(await searchFoods(bayo, "Ada's moi moi")).toEqual([]);
    expect(await getFood(bayo, id)).toBeNull();

    await deleteCustomFood(ada, id);
    expect(await getFood(ada, id)).toBeNull();
  });

  it("validates custom foods before they reach the database", async () => {
    await expect(
      createCustomFood(ada, { name: "Bad", energyKcal: 100, proteinG: 60, carbsG: 50, fatG: 10 }),
    ).rejects.toThrow();
  });
});
