import { isoDaysBefore, type MealSlot } from "@nutritrack/core";
import {
  waterEntrySchema,
  weightEntrySchema,
  type WaterEntryInput,
  type WeightEntryInput,
} from "@nutritrack/schemas";
import type { NutriTrackClient } from "./client.ts";
import { fromPostgrestError } from "./errors.ts";

/** A logged food as shown on the dashboard. Nutrients are the snapshot taken at log time. */
export type LogEntry = {
  id: string;
  meal_slot: MealSlot;
  food_name: string;
  quantity: number;
  grams: number;
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  serving_unit_name: string | null;
};

export type WaterEntry = {
  id: string;
  amount_ml: number;
  unit_label: string | null;
  logged_at: string;
};
export type WeightEntry = { id: string; measured_on: string; weight_kg: number };

/** Food logged on a local calendar day, oldest first. RLS limits rows to the signed-in user. */
export async function getDayLog(client: NutriTrackClient, logDate: string): Promise<LogEntry[]> {
  const { data, error } = await client
    .from("food_log_entries")
    .select(
      "id, meal_slot, food_name, quantity, grams, energy_kcal, protein_g, carbs_g, fat_g, serving_units(name)",
    )
    .eq("log_date", logDate)
    .order("created_at", { ascending: true });
  if (error) throw fromPostgrestError(error);
  return data.map(({ serving_units, ...row }) => ({
    ...row,
    serving_unit_name: serving_units?.name ?? null,
  }));
}

export async function deleteLogEntry(client: NutriTrackClient, id: string): Promise<void> {
  const { error } = await client.from("food_log_entries").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

/** Start and end of the device's local day as ISO timestamps (water is stored as timestamptz). */
function localDayBounds(day: Date): { from: string; to: string } {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

/** Water logged during the device's local day containing `day`, oldest first. */
export async function getWaterForDay(client: NutriTrackClient, day: Date): Promise<WaterEntry[]> {
  const { from, to } = localDayBounds(day);
  const { data, error } = await client
    .from("water_entries")
    .select("id, amount_ml, unit_label, logged_at")
    .gte("logged_at", from)
    .lt("logged_at", to)
    .order("logged_at", { ascending: true });
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function addWater(
  client: NutriTrackClient,
  rawInput: WaterEntryInput,
): Promise<WaterEntry> {
  const input = waterEntrySchema.parse(rawInput);
  const { data, error } = await client
    .from("water_entries")
    .insert({ amount_ml: input.amountMl, unit_label: input.unitLabel ?? null })
    .select("id, amount_ml, unit_label, logged_at")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function deleteWater(client: NutriTrackClient, id: string): Promise<void> {
  const { error } = await client.from("water_entries").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

/** Weigh-ins from `days` before `today` up to today, oldest first. */
export async function getWeightHistory(
  client: NutriTrackClient,
  today: string,
  days: number,
): Promise<WeightEntry[]> {
  const { data, error } = await client
    .from("weight_entries")
    .select("id, measured_on, weight_kg")
    .gte("measured_on", isoDaysBefore(today, days))
    .lte("measured_on", today)
    .order("measured_on", { ascending: true });
  if (error) throw fromPostgrestError(error);
  return data;
}

/** The most recent weigh-in ever recorded, or null. */
export async function getLatestWeight(client: NutriTrackClient): Promise<WeightEntry | null> {
  const { data, error } = await client
    .from("weight_entries")
    .select("id, measured_on, weight_kg")
    .order("measured_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  return data;
}

/** Records a weigh-in. A second entry on the same day replaces the first. */
export async function logWeight(
  client: NutriTrackClient,
  rawInput: WeightEntryInput,
  today: string,
): Promise<WeightEntry> {
  const input = weightEntrySchema(today).parse(rawInput);
  const { data: claims } = await client.auth.getClaims();
  const userId = claims?.claims.sub;
  const { data, error } = await client
    .from("weight_entries")
    .upsert(
      {
        measured_on: input.measuredOn,
        weight_kg: input.weightKg,
        ...(userId ? { user_id: userId } : {}),
      },
      { onConflict: "user_id,measured_on" },
    )
    .select("id, measured_on, weight_kg")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function deleteWeight(client: NutriTrackClient, id: string): Promise<void> {
  const { error } = await client.from("weight_entries").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

/** Each dashboard section loads independently so one failure doesn't blank the whole page. */
export type Section<T> = { ok: true; data: T } | { ok: false; error: unknown };

export type DashboardData = {
  log: Section<LogEntry[]>;
  water: Section<WaterEntry[]>;
  weights: Section<WeightEntry[]>;
  latestWeight: Section<WeightEntry | null>;
};

/** Days of weigh-ins shown in the dashboard trend. */
export const DASHBOARD_WEIGHT_DAYS = 30;

export async function loadDashboard(
  client: NutriTrackClient,
  today: string,
  now: Date,
): Promise<DashboardData> {
  const settle = <T>(p: Promise<T>): Promise<Section<T>> =>
    p.then(
      (data) => ({ ok: true as const, data }),
      (error: unknown) => ({ ok: false as const, error }),
    );
  const [log, water, weights, latestWeight] = await Promise.all([
    settle(getDayLog(client, today)),
    settle(getWaterForDay(client, now)),
    settle(getWeightHistory(client, today, DASHBOARD_WEIGHT_DAYS)),
    settle(getLatestWeight(client)),
  ]);
  return { log, water, weights, latestWeight };
}
