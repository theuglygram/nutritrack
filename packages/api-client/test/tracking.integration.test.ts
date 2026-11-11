/**
 * Dashboard data (food log, water, weight) against a running local Supabase.
 * Run: pnpm --filter @nutritrack/api-client test:integration
 */
import { beforeAll, describe, expect, it } from "vitest";
import {
  ApiError,
  addWater,
  deleteWater,
  getDayLog,
  getLatestWeight,
  getWaterForDay,
  getWeightHistory,
  loadDashboard,
  localIsoDate,
  logWeight,
  type NutriTrackClient,
} from "../src/index.ts";
import { configured, confirmedUser } from "./helpers.ts";

describe.skipIf(!configured)("dashboard tracking against local Supabase", () => {
  const today = localIsoDate();
  let alice: NutriTrackClient;
  let bob: NutriTrackClient;

  beforeAll(async () => {
    [alice, bob] = await Promise.all([confirmedUser("it-alice"), confirmedUser("it-bob")]);
  });

  it("returns an empty food log for a new user", async () => {
    expect(await getDayLog(alice, today)).toEqual([]);
  });

  it("adds, lists and removes water for today", async () => {
    const cup = await addWater(alice, { amountMl: 250, unitLabel: "Cup" });
    await addWater(alice, { amountMl: 500, unitLabel: "Sachet" });
    const entries = await getWaterForDay(alice, new Date());
    expect(entries.map((e) => e.amount_ml)).toEqual([250, 500]);

    await deleteWater(alice, cup.id);
    expect((await getWaterForDay(alice, new Date())).map((e) => e.amount_ml)).toEqual([500]);
  });

  it("validates water before it reaches the database", async () => {
    await expect(addWater(alice, { amountMl: 0 })).rejects.toThrow();
  });

  it("keeps one weigh-in per day and returns history in order", async () => {
    await logWeight(alice, { weightKg: 80, measuredOn: "2026-10-20" }, today);
    await logWeight(alice, { weightKg: 79.2, measuredOn: today }, today);
    await logWeight(alice, { weightKg: 79, measuredOn: today }, today); // replaces the first
    const history = await getWeightHistory(alice, today, 365);
    expect(history.map((w) => [w.measured_on, w.weight_kg])).toEqual([
      ["2026-10-20", 80],
      [today, 79],
    ]);
    expect((await getLatestWeight(alice))?.weight_kg).toBe(79);
  });

  it("never shows one user's entries to another", async () => {
    expect(await getWaterForDay(bob, new Date())).toEqual([]);
    expect(await getWeightHistory(bob, today, 365)).toEqual([]);
    expect(await getLatestWeight(bob)).toBeNull();
  });

  it("loads every dashboard section independently", async () => {
    const data = await loadDashboard(alice, today, new Date());
    expect(data.log).toEqual({ ok: true, data: [] });
    expect(data.water.ok && data.water.data.length).toBe(1);
    expect(data.latestWeight.ok && data.latestWeight.data?.weight_kg).toBe(79);
  });

  it("reports a signed-out client as a failed section, not a crash", async () => {
    const { newClient } = await import("./helpers.ts");
    const data = await loadDashboard(newClient(), today, new Date());
    expect(data.log.ok).toBe(false);
    expect(!data.log.ok && data.log.error).toBeInstanceOf(ApiError);
    await expect(addWater(newClient(), { amountMl: 250 })).rejects.toBeInstanceOf(ApiError);
  });
});
